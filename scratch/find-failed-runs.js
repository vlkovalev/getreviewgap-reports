const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function run() {
  console.log("Searching AgentRun table for failed runs...")
  try {
    const failedRuns = await prisma.agentRun.findMany({
      where: {
        status: "FAILED"
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    })

    console.log(`Found ${failedRuns.length} failed run(s):`)
    failedRuns.forEach((run) => {
      console.log(`\nRun ID: ${run.id}`)
      console.log(`Created At: ${run.createdAt}`)
      console.log(`Name: ${run.name}`)
      console.log(`ErrorMessage: "${run.errorMessage}"`)
      console.log(`Input:`, JSON.stringify(run.input, null, 2))
    })
  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

run()
