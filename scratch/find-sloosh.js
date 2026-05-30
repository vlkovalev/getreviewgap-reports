const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function run() {
  console.log("Searching database for 'Sloosh' reports...")
  try {
    const reports = await prisma.intelligenceReport.findMany({
      where: {
        OR: [
          { title: { contains: "Sloosh", mode: "insensitive" } },
          { summary: { path: ["productName"], string_contains: "Sloosh" } },
          { filters: { path: ["productUrl"], string_contains: "Sloosh" } }
        ]
      }
    })

    console.log(`Found ${reports.length} report(s) matching 'Sloosh':`)
    reports.forEach((r) => {
      console.log(`\nReport ID: ${r.id}`)
      console.log(`Title: ${r.title}`)
      console.log(`Status: ${r.status}`)
      console.log(`Filters:`, JSON.stringify(r.filters, null, 2))
      console.log(`Summary Keys:`, Object.keys(r.summary || {}))
      if (r.summary && typeof r.summary === "object") {
        console.log(`Product Name:`, r.summary.productName)
        console.log(`Review Count:`, r.summary.reviewCount)
      }
    })
  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

run()
