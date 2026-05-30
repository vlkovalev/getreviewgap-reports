const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function run() {
  try {
    const userCount = await prisma.user.count()
    const intelReportCount = await prisma.intelligenceReport.count()
    const reviewReportCount = await prisma.reviewReport.count()
    const agentRunCount = await prisma.agentRun.count()
    
    console.log("Table Counts:")
    console.log(`- User: ${userCount}`)
    console.log(`- IntelligenceReport: ${intelReportCount}`)
    console.log(`- ReviewReport: ${reviewReportCount}`)
    console.log(`- AgentRun: ${agentRunCount}`)

    if (intelReportCount > 0) {
      console.log("\nSample IntelligenceReport records:")
      const reports = await prisma.intelligenceReport.findMany({ take: 5 })
      reports.forEach((r, i) => {
        console.log(`[${i+1}] ID: ${r.id}`)
        console.log(`    Title: ${r.title}`)
        console.log(`    generatedAt: ${r.generatedAt}`)
      })
    }
  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

run()
