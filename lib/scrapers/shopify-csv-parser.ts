/**
 * A robust CSV parser that correctly handles quoted values,
 * escaped double-quotes (""), and multiline fields (newlines inside quotes).
 */
export function parseCsv(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          field += '"';
          i++; // Skip the second quote
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = "";
      } else if (char === '\r' || char === '\n') {
        row.push(field);
        field = "";
        // Only push non-empty rows
        if (row.length > 0 && row.some((x) => x.trim().length > 0)) {
          lines.push(row);
        }
        row = [];
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n
        }
      } else {
        field += char;
      }
    }
  }

  // Handle final residue
  if (field || row.length > 0) {
    row.push(field);
    if (row.some((x) => x.trim().length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Extracts and formats reviews from a CSV string.
 * Supports Judge.me, Loox, Yotpo, Okendo, Stamped, Shopify reviews, and generic layouts.
 * Automatically strips HTML tags and normalizes spacing.
 */
export function extractReviewsFromCsv(csvText: string): string[] {
  const trimmed = csvText.trim();
  if (!trimmed) return [];

  // Parse CSV rows cleanly
  const rows = parseCsv(trimmed);
  if (rows.length === 0) return [];

  // If there's only 1 row or it's a single raw string, treat each line as a review
  if (rows.length === 1) {
    return rows[0].map((item) => item.trim()).filter(Boolean);
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());

  // Search for the primary review text/body column
  const bodyKeywords = [
    "review body",
    "review_body",
    "body",
    "content",
    "review text",
    "review_text",
    "text",
    "comment",
    "description",
    "review"
  ];
  let bodyIdx = -1;
  for (const keyword of bodyKeywords) {
    bodyIdx = headers.findIndex((h) => h === keyword || h.includes(keyword));
    if (bodyIdx !== -1) break;
  }

  // Fallback to line splitting if we can't find a review body column
  if (bodyIdx === -1) {
    return csvText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 500);
  }

  // Search for an optional title/subject column
  const titleKeywords = [
    "review title",
    "review_title",
    "title",
    "subject",
    "headline",
    "summary"
  ];
  let titleIdx = -1;
  for (const keyword of titleKeywords) {
    titleIdx = headers.findIndex((h) => h === keyword || h.includes(keyword));
    if (titleIdx !== -1) break;
  }

  // Search for an optional rating/score column
  const ratingKeywords = [
    "review rating",
    "review_rating",
    "rating",
    "score",
    "stars",
    "star",
    "value"
  ];
  let ratingIdx = -1;
  for (const keyword of ratingKeywords) {
    ratingIdx = headers.findIndex((h) => h === keyword || h.includes(keyword));
    if (ratingIdx !== -1) break;
  }

  const reviews: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const body = row[bodyIdx]?.trim() || "";
    const title = titleIdx !== -1 ? row[titleIdx]?.trim() || "" : "";
    const rating = ratingIdx !== -1 ? row[ratingIdx]?.trim() || "" : "";

    if (!body) continue;

    // Strip HTML tags and double whitespace
    const cleanBody = body
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const cleanTitle = title
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/\s+/g, " ")
      .trim();

    let reviewText = "";
    if (rating) {
      reviewText += `Rating: ${rating}. `;
    }
    if (cleanTitle) {
      reviewText += `${cleanTitle}. `;
    }
    reviewText += cleanBody;

    const formatted = reviewText.trim();
    if (formatted) {
      reviews.push(formatted);
    }
  }

  return reviews.slice(0, 500);
}
