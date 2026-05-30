const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function run() {
  console.log("Loading fresh report details from Neon database...")
  try {
    const report = await prisma.intelligenceReport.findUnique({
      where: { id: "cmpqd39sy0001b35wb9mf0617" }
    })
    if (report) {
      console.log("\n--- NEW REPORT SUMMARY DETAILS ---")
      console.log(`ID: ${report.id}`)
      console.log(`Title: ${report.title}`)
      
      const summary = report.summary || {}
      console.log(`\nExecutive Summary:\n`, JSON.stringify(summary.executiveSummary, null, 2))
      
      console.log(`\nTop Complaints (Count: ${summary.topComplaints ? summary.topComplaints.length : 0}):`)
      if (summary.topComplaints) {
        summary.topComplaints.forEach((c, idx) => {
          console.log(`[${idx+1}] Theme: "${c.theme}" | Severity: ${c.severity}`)
          console.log(`    Implication: "${c.productImplication}"`)
          console.log(`    Evidence: "${c.evidence}"`)
        })
      }
      
      console.log(`\nTop Compliments (Count: ${summary.topCompliments ? summary.topCompliments.length : 0}):`)
      if (summary.topCompliments) {
        summary.topCompliments.forEach((c, idx) => {
          console.log(`[${idx+1}] Theme: "${c.theme}"`)
          console.log(`    Implication: "${c.marketingImplication}"`)
          console.log(`    Evidence: "${c.evidence}"`)
        })
      }

      console.log(`\nBuyer Language (Count: ${summary.buyerLanguage ? summary.buyerLanguage.length : 0}):`)
      console.log(JSON.stringify(summary.buyerLanguage, null, 2))

      const dataObj = report.data || {}
      const insight = dataObj.insight || {}
      console.log(`\nAd Hooks (Count: ${insight.adHooks ? insight.adHooks.length : 0}):`)
      console.log(JSON.stringify(insight.adHooks, null, 2))

      console.log(`\nPositioning Angles (Count: ${insight.positioningAngles ? insight.positioningAngles.length : 0}):`)
      console.log(JSON.stringify(insight.positioningAngles, null, 2))

      console.log(`\nCompetitive Gap:`, JSON.stringify(insight.competitiveGap, null, 2))
      console.log(`\nEmerging Signals:`, JSON.stringify(insight.emergingSignals, null, 2))
    } else {
      console.log("Report not found.")
    }
  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

run()
