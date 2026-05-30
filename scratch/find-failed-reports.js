const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function run() {
  console.log("Searching database for recently failed reports...")
  try {
    const failedReports = await prisma.intelligenceReport.findMany({
      where: {
        status: "FAILED"
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    })

    console.log(`Found ${failedReports.length} failed report(s):`)
    failedReports.forEach((r) => {
      console.log(`\nReport ID: ${r.id}`)
      console.log(`Created At: ${r.createdAt}`)
      console.log(`Title: ${r.title}`)
      console.log(`ErrorMessage: "${r.errorMessage}"`)
      console.log(`Filters:`, JSON.stringify(r.filters, null, 2))
    })
  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

run()
