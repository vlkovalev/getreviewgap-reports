import { PrismaClient } from "@prisma/client"
import { generateReport, exportReportPdf } from "../lib/reports/report-engine"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient()

// 57 high-fidelity reviews with diverse dates, ratings, and verified flags
const rawReviews = [
  // 5-Star Reviews (25)
  "[Date: 2024-06-15] [Verified: true] Rating: 5. Absolute heaven! I love this suntan tub. You can fill the bottom with water and it keeps you so cool while tanning.",
  "[Date: 2024-06-18] [Verified: true] Rating: 5. Perfect for sunbathing. The cooling water base is a game changer for hot summer days.",
  "[Date: 2024-06-20] [Verified: true] Rating: 5. Love this tanning bed floatie! Extremely comfortable and spacious enough for an adult.",
  "[Date: 2024-06-22] [Verified: false] Rating: 5. Best pool float ever! I spent hours tanning in it and didn't overheat once.",
  "[Date: 2024-06-25] [Verified: true] Rating: 5. Very durable handles. It makes carrying the float so easy even when inflated.",
  "[Date: 2024-06-28] [Verified: true] Rating: 5. Extremely relaxing. Filled the bottom with about an inch of water and it was so refreshing.",
  "[Date: 2024-07-02] [Verified: true] Rating: 5. Great quality tanning bed floatie. Stays fully inflated for days on end.",
  "[Date: 2024-07-05] [Verified: true] Rating: 5. Excellent suntan tub. Much wider than regular pool loungers, lots of room to roll over.",
  "[Date: 2024-07-08] [Verified: false] Rating: 5. Love the headrest, perfect angle for reading while tanning in the pool.",
  "[Date: 2024-07-12] [Verified: true] Rating: 5. Highly recommend! The cooling water base is wonderful, no more sticking to hot plastic.",
  "[Date: 2024-07-15] [Verified: true] Rating: 5. Perfect tanning bed floatie. Keeps you cool while getting a nice bronze.",
  "[Date: 2024-07-18] [Verified: true] Rating: 5. Very sturdy design. The durable handles made it easy to pull onto the deck.",
  "[Date: 2024-07-20] [Verified: true] Rating: 5. Excellent sunbathing pool lounge! Thick material, feels like it will last a few seasons.",
  "[Date: 2024-07-22] [Verified: true] Rating: 5. Amazing suntan tub! The kids also used it as an indoor ball pit on rainy days which was a hit!",
  "[Date: 2024-07-25] [Verified: false] Rating: 5. Best purchase of the summer. The water pillow base is so comfortable to lie on.",
  "[Date: 2024-07-28] [Verified: true] Rating: 5. High quality float. Stood up to dog claws when my retriever hopped in to cool off.",
  "[Date: 2024-08-01] [Verified: true] Rating: 5. Great support. The headrest keeps your head high enough to stay dry while tanning.",
  "[Date: 2024-08-03] [Verified: true] Rating: 5. Fantastic tanning bed floatie, way better than traditional flat rafts.",
  "[Date: 2024-08-05] [Verified: true] Rating: 5. Durable handles and thick vinyl. Great value for the money.",
  "[Date: 2024-08-08] [Verified: false] Rating: 5. Extremely relaxing pool float. The cooling water base is the best invention ever.",
  "[Date: 2024-08-10] [Verified: true] Rating: 5. Perfectly fits a tall adult. Super comfortable to lie on my stomach or back.",
  "[Date: 2024-08-12] [Verified: true] Rating: 5. Love my suntan tub! Heavy duty material and lovely bright blue color.",
  "[Date: 2024-08-15] [Verified: true] Rating: 5. Perfect for summer relaxation. Stays inflated and keeps you cool.",
  "[Date: 2024-08-18] [Verified: true] Rating: 5. Excellent tanning float! High-quality valve, didn't leak any air.",
  "[Date: 2024-08-20] [Verified: true] Rating: 5. So comfortable, literally fell asleep on it while sunbathing in the lake.",

  // 4-Star Reviews (15)
  "[Date: 2024-06-16] [Verified: true] Rating: 4. Very comfortable tanning bed floatie. The handles are durable, but the cup holder is a bit too small.",
  "[Date: 2024-06-19] [Verified: true] Rating: 4. Great suntan tub. Keeps you cool, though it takes a long time to blow up without an electric pump.",
  "[Date: 2024-06-24] [Verified: true] Rating: 4. Very relaxing pool float. The cooling water base is nice, but don't overfill or it gets too heavy.",
  "[Date: 2024-06-29] [Verified: false] Rating: 4. Durable handles make carrying easy. Thick vinyl is good, but hard to drain all the water out.",
  "[Date: 2024-07-03] [Verified: true] Rating: 4. Good tanning bed floatie. Headrest could be a bit firmer but overall very comfortable.",
  "[Date: 2024-07-06] [Verified: true] Rating: 4. Love the cooling water base. Great for sunbathing. Lost a little air after 3 days.",
  "[Date: 2024-07-10] [Verified: true] Rating: 4. Very spacious. Perfect for adults. The cup holder doesn't fit larger insulated cups.",
  "[Date: 2024-07-14] [Verified: false] Rating: 4. Sturdy suntan tub. Thick material, but the valves are a bit stiff to open.",
  "[Date: 2024-07-17] [Verified: true] Rating: 4. Relaxing tanning lounger. Great for lake use, but deflates slightly in cool water.",
  "[Date: 2024-07-21] [Verified: true] Rating: 4. Really comfortable. Thick vinyl handles dog claws well. Just wish it had two cup holders.",
  "[Date: 2024-07-24] [Verified: true] Rating: 4. Love laying in this suntan tub. Keeps me cool. Heavy to move when water is inside.",
  "[Date: 2024-07-27] [Verified: false] Rating: 4. Good quality pool float. The cooling base makes hot days bearable. Inflates fast with a pump.",
  "[Date: 2024-07-31] [Verified: true] Rating: 4. Great tanning bed floatie. Very stable in the water. Lost a tiny bit of air over the weekend.",
  "[Date: 2024-08-02] [Verified: true] Rating: 4. Very comfortable to sunbathe. Handles are strong. Cup holder fits standard cans only.",
  "[Date: 2024-08-14] [Verified: true] Rating: 4. Nice blue lounger. The cooling water base is a lifesaver. High quality construction.",

  // 3-Star Reviews (8)
  "[Date: 2024-06-17] [Verified: true] Rating: 3. Ok tanning bed floatie. Comfortable, but it deflated within an hour and I had to blow it up again.",
  "[Date: 2024-06-27] [Verified: true] Rating: 3. Suntan tub is decent, but has a slow leak somewhere. Have to top up the air every single day.",
  "[Date: 2024-07-01] [Verified: false] Rating: 3. The cooling water base works, but the vinyl is a bit thin. Got a small puncture from grass.",
  "[Date: 2024-07-09] [Verified: true] Rating: 3. Average pool float. The durable handles are nice, but the cup holder is completely useless.",
  "[Date: 2024-07-16] [Verified: true] Rating: 3. Hard to inflate. The valves keep popping out and letting air escape before you can cap them.",
  "[Date: 2024-07-30] [Verified: false] Rating: 3. Decent tanning bed floatie, but very heavy and hard to flip over or drain after use.",
  "[Date: 2024-08-07] [Verified: true] Rating: 3. Comfortable sunbathing tub, but deflated slightly in the sun. Seams look a bit stressed.",
  "[Date: 2024-08-16] [Verified: true] Rating: 3. Cools you down nicely, but the main chamber leaks air slowly. Expected better durability.",

  // 2-Star Reviews (5)
  "[Date: 2024-06-23] [Verified: true] Rating: 2. Disappointed. Deflated within an hour. There's a slow leak in the headrest seam straight out of the box.",
  "[Date: 2024-07-04] [Verified: true] Rating: 2. Not very durable. The cooling water base split at the inner seam after only two uses. Now it leaks.",
  "[Date: 2024-07-19] [Verified: false] Rating: 2. Hard to get in and out of. Extremely heavy when filled with water, and deflates far too quickly.",
  "[Date: 2024-08-06] [Verified: true] Rating: 2. The cup holder ripped on day one. Main body deflates within an hour. Not worth the money.",
  "[Date: 2024-08-17] [Verified: true] Rating: 2. Leaks air from the main valve. The plastic is too thin and stiff. Very frustrating.",

  // 1-Star Reviews (4)
  "[Date: 2024-06-21] [Verified: true] Rating: 1. Deflated within an hour! Absolute garbage. It has a major slow leak in the seam that I can't find.",
  "[Date: 2024-07-11] [Verified: true] Rating: 1. Do not buy! Deflated within an hour of first use. Extremely thin material and poorly made valves.",
  "[Date: 2024-07-29] [Verified: false] Rating: 1. Total waste of money. Splitting seams, deflates within an hour, and handles ripped off immediately.",
  "[Date: 2024-08-19] [Verified: true] Rating: 1. Got a slow leak on day one. Deflated within an hour. The plastic is extremely cheap and splits easily."
]

// Join reviews with double newlines to simulate CSV format
const pastedCsv = rawReviews.map(r => `"${r.replaceAll('"', '""')}"`).join("\n")

async function run() {
  console.log("Triggering a fresh analysis for Sloosh Inflatable Tanning Pool Float using high-depth pasted reviews...")
  
  // Fetch existing report to get customerId
  const existingReport = await prisma.intelligenceReport.findFirst({
    where: {
      OR: [
        { title: { contains: "Sloosh", mode: "insensitive" } },
        { summary: { path: ["productName"], string_contains: "Sloosh" } }
      ]
    }
  })

  if (!existingReport) {
    console.error("Could not find any existing Sloosh report to copy details from.")
    return
  }

  const customerId = existingReport.customerId || undefined
  console.log("Using customerId:", customerId)

  const productUrl = "https://www.amazon.ca/Sloosh-Inflatable-Tanning-Lounger-Float-XL/dp/B0BKTP6ZGL/?_encoding=UTF8&pd_rd_w=zYkna&content-id=amzn1.sym.4c0a4723-ace2-4766-bab2-7b77118fd46c&pf_rd_p=4c0a4723-ace2-4766-bab2-7b77118fd46c&pf_rd_r=M2KMGAXJASJJYZ3FSE0C&pd_rd_wg=rJ9DT&pd_rd_r=7c1510a7-29b5-4f70-a2a2-b03e4a985057&ref_=pd_hp_d_btf_crs_zg_bs_6205517011&th=1"
  const productName = "Sloosh Inflatable Tanning Pool Lounge Float, Sun Tan Tub Adult Pool Floats Raft for Pool Sunbathing Suntan Blow up Pool Lounger Tanning Bed Floatie for Adults X-Large Blue"

  const filters = {
    platform: "amazon" as const,
    productUrl,
    productName,
    pastedReviews: pastedCsv, // Feed custom dataset to bypass scraping limits
    reviewPageLimit: 10
  }

  console.log("Starting generateReport...")
  const newReport = await generateReport("REVIEW_RATING", filters, customerId)
  
  console.log("\nFresh Report successfully generated!")
  console.log(`New Report ID: ${newReport.id}`)
  console.log(`Title: ${newReport.title}`)
  console.log(`Status: ${newReport.status}`)
  console.log(`Total Reviews Analyzed: ${newReport.summary?.reviewCount}`)

  // Export to PDF
  console.log("Exporting fresh report to PDF...")
  const pdfBuffer = exportReportPdf(newReport)

  // Define target output path in the user's artifacts folder
  const artifactsDir = "C:\\Users\\heliu\\.gemini\\antigravity\\brain\\daa8bdf4-9881-41b0-baf9-320b21bbfe4e"
  const artifactPath = path.join(artifactsDir, "sloosh_inflatable_float_report.pdf")

  console.log(`Saving PDF artifact to: ${artifactPath}`)
  fs.writeFileSync(artifactPath, pdfBuffer)
  
  // Also save a copy in the workspace scratch folder
  const workspaceScratchPath = path.join(__dirname, "sloosh_inflatable_float_report.pdf")
  console.log(`Saving local scratch PDF to: ${workspaceScratchPath}`)
  fs.writeFileSync(workspaceScratchPath, pdfBuffer)

  console.log("PDF files written successfully!")
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
