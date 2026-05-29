import type { ReviewInput } from "./schemas"

export function reviewInsightPrompt(input: ReviewInput, reviews: string[]) {
  // Compute star rating distribution
  let rating5 = 0, rating4 = 0, rating3 = 0, rating2 = 0, rating1 = 0;
  for (const r of reviews) {
    if (r.startsWith("Rating: 5") || r.includes("score: 5") || r.includes("rating: 5")) rating5++;
    else if (r.startsWith("Rating: 4") || r.includes("score: 4") || r.includes("rating: 4")) rating4++;
    else if (r.startsWith("Rating: 3") || r.includes("score: 3") || r.includes("rating: 3")) rating3++;
    else if (r.startsWith("Rating: 2") || r.includes("score: 2") || r.includes("rating: 2")) rating2++;
    else if (r.startsWith("Rating: 1") || r.includes("score: 1") || r.includes("rating: 1")) rating1++;
  }
  const totalWithRating = rating5 + rating4 + rating3 + rating2 + rating1;

  // Format the user query exactly per the requested metadata structure
  const userMessage = `
PRODUCT METADATA
- Product: ${input.productName || "Unknown Product"}
- ID: ${input.competitorName || "N/A"}
- Platform: ${input.platform || "amazon"}
- Source URL: ${input.productUrl}

SAMPLE METADATA  
- Reviews provided: ${reviews.length}
- Target sample: ${input.reviewPageLimit ? input.reviewPageLimit * 10 : 100}
- Verified purchases: ${totalWithRating > 0 ? totalWithRating : "N/A"} of ${reviews.length}
- Rating distribution: 5★ ${rating5}, 4★ ${rating4}, 3★ ${rating3}, 2★ ${rating2}, 1★ ${rating1}

REVIEWS (newline-delimited review JSON)
${reviews.map((r, i) => {
  const dateMatch = r.match(/^\[Date:\s*([^\]]+)\]/);
  const verifiedMatch = r.match(/\[Verified:\s*(true|false)\]/);
  const cleanBody = r.replace(/^\[Date:[^\]]+\]\s*/, "").replace(/\[Verified:[^\]]+\]\s*/, "");
  const ratingMatch = cleanBody.match(/Rating:\s*(\d)/);

  const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
  const verified = verifiedMatch ? verifiedMatch[1] === "true" : true;
  const rating = ratingMatch ? Number(ratingMatch[1]) : 5;

  return JSON.stringify({
    id: `rev_${i}`,
    rating,
    date,
    verified,
    title: "Review Title",
    body: cleanBody
  });
}).join("\n")}

OUTPUT
Return a single valid JSON object per the schema. No prose outside the JSON.
`.trim();

  return {
    role: "You are a senior review intelligence analyst producing a structured analytical report from customer reviews. You write for Amazon sellers, DTC operators, and agencies who will make product, listing, and ad decisions based on this report.",
    objective: "Analyze competitor reviews and produce a concise, highly structured, evidence-grounded customer intelligence report.",
    userMessage,
    qualityRules: [
      "Return valid JSON only. No markdown. No prose. No commentary outside the JSON.",
      "QUANTIFY EVERY CLAIM: Every theme, complaint, and compliment must include a count and percentage of the review sample in the format '{count} of {total} reviews ({pct}%)'. FORBIDDEN phrases: 'some users', 'several customers', 'many buyers', 'a number of', 'frequently mentioned', 'often', 'commonly' - replace with exact counts.",
      "CITE VERBATIM EVIDENCE: Every theme must include 2-3 short verbatim quotes (max 25 words each) with the review's star rating, date, and verified-purchase status if available. Quote EXACTLY as written - preserve typos, casing, punctuation. Do not paraphrase.",
      "SEVERITY JUSTIFIED BY FREQUENCY: Severity must be 'high' if mentioned in >=20% of reviews, 'medium' 10-19%, 'low' 5-9%. Do not surface themes in <5% of reviews as top items.",
      "AD HOOKS MUST BE REVIEW-DERIVED: Every ad hook must do ONE of: (a) neutralize a top complaint, e.g. 'Finally — a [product] that doesn't [complaint]'; or (b) reuse a verbatim buyer phrase from the outcomes, objections, or unexpected_uses buckets. Hooks that could have been written from the product title alone are FORBIDDEN (e.g. 'Stay cool this summer', 'Perfect for relaxation'). Each hook must declare its source in `source_evidence`. MINIMUM OUTPUT REQUIREMENT: You must return at least one ad hook unless BOTH conditions hold: (i) `top_complaints` is empty, AND (ii) `buyer_language.outcomes`, `buyer_language.objections`, and `buyer_language.unexpected_uses` are ALL empty. If even one phrase exists in any of those buckets, you must produce at least one buyer-phrase-derived hook. The hook may be short and direct (e.g. 'Non-greasy. Absorbs in seconds.' is acceptable if 'non-greasy' and 'absorbs well' appear in the buyer language).",
      "BUYER LANGUAGE IS GROUPED AND RICH: Produce 20-40 verbatim phrases categorized into outcomes (what buyers felt/got), objections (what disappointed them), comparisons (what they compared it to), and unexpected_uses (uses you didn't anticipate). Format as '[Category] phrase' (e.g. '[Outcome] nice glow', '[Objection] smaller than expected', '[Comparison] better than brand X', '[Unexpected Use] used for eczema'). Each phrase must appear in at least 2 reviews.",
      "SURFACE TEMPORAL SIGNALS: If complaint rates differ between recent (<=90 days) and older reviews, flag this in the theme's evidence or implications.",
      "RECOMMENDATIONS ARE EVIDENCE-SPECIFIC: Defect recommendations must specify the defect, specific count, and timeframe/variant if discernible. FORBIDDEN: generic 'Improve quality control'.",
      "COMPETITIVE GAP: If competitor reviews are provided in the input, produce the `competitive_gap` section. If not, OMIT the field entirely from your JSON output. Do not return it with null or 'N/A' values. Its absence from the JSON is the signal to the renderer that this section should not appear in the report.",
      "NO INVENTED FACTS: Do not infer features, competitors, prices, or events not present in the reviews. If a section has no supporting evidence, return an empty array.",
      "Tone: Senior consultant briefing a client - direct, evidence-bound, willing to say 'the data does not support a strong conclusion'. No marketing language, do not flatter the product."
    ],
    outputSchema: {
      report_meta: {
        product_name: "string",
        id: "string",
        platform: "string",
        reviews_analyzed: "number",
        target_sample: "number",
        date_range: { earliest: "ISO_Date", latest: "ISO_Date" },
        confidence: "Low | Medium | High",
        confidence_reason: "string"
      },
      executive_summary: {
        headline: "string (ONE sentence, most important finding)",
        context: "string (2-3 sentences max)"
      },
      top_complaints: [
        {
          theme: "string",
          severity: "high | medium | low",
          count: "number",
          total: "number",
          percentage: "number",
          sub_patterns: ["string"],
          verbatim_quotes: [
            { text: "string (max 25 words)", rating: "number", date: "ISO_Date", verified: "boolean" }
          ],
          temporal_signal: "string | null",
          action: "string (evidence-specific)"
        }
      ],
      top_compliments: [
        {
          theme: "string",
          count: "number",
          total: "number",
          percentage: "number",
          sub_patterns: ["string"],
          verbatim_quotes: [
            { text: "string (max 25 words)", rating: "number", date: "ISO_Date", verified: "boolean" }
          ],
          temporal_signal: "string | null",
          action: "string"
        }
      ],
      emerging_signals: [
        { theme: "string", count: "number", first_seen: "ISO_Date" }
      ],
      buyer_language: {
        outcomes: ["string"],
        objections: ["string"],
        comparisons: ["string"],
        unexpected_uses: ["string"]
      },
      ad_hooks: [
        {
          hook: "string",
          source_type: "complaint_neutralization | buyer_phrase",
          source_evidence: "string"
        }
      ],
      positioning_angles: [
        { angle: "string", supported_by: "string" }
      ],
      competitive_gap: {
        competitors_analyzed: ["string"],
        primary_wins: ["string"],
        primary_losses: ["string"],
        open_gaps: ["string"]
      },
      assumptions_and_limitations: ["string"]
    },
    refusalSchema: {
      insufficient_data: true,
      reason: "string",
      reviews_required: "number",
      reviews_provided: "number"
    }
  }
}
