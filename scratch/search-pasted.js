const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function run() {
  console.log("Searching database for reports generated with pasted reviews...")
  try {
    const reports = await prisma.intelligenceReport.findMany({
      where: {
        filters: { path: ["pastedReviews"], string_contains: "" }
      }
    })

    console.log(`Found ${reports.length} report(s) with pasted reviews:`)
    reports.forEach((r) => {
      console.log(`- ID: ${r.id}`)
      console.log(`  Title: ${r.title}`)
      const pasted = r.filters.pastedReviews
      console.log(`  Pasted text length: ${pasted ? pasted.length : 0}`)
    })
  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

run()
