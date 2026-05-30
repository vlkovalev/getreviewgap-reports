const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function run() {
  try {
    const report = await prisma.intelligenceReport.findUnique({
      where: { id: "cmpoyw70x0003jr048ui13m2t" }
    })
    if (report) {
      console.log("Report found!")
      console.log("Title:", report.title)
      console.log("Summary structure keys:", Object.keys(report.summary || {}))
      console.log("Data structure keys:", Object.keys(report.data || {}))
      
      const dataObj = report.data || {}
      console.log("dataObj.source:", dataObj.source)
      
      // Look for reviews inside data or summary
      let reviews = null
      if (Array.isArray(dataObj.reviews)) {
        reviews = dataObj.reviews
        console.log(`Found reviews array directly in data (length: ${reviews.length})`)
      } else if (dataObj.insight && Array.isArray(dataObj.insight.reviews)) {
        reviews = dataObj.insight.reviews
        console.log(`Found reviews inside data.insight (length: ${reviews.length})`)
      } else if (report.summary && Array.isArray(report.summary.reviews)) {
        reviews = report.summary.reviews
        console.log(`Found reviews inside summary (length: ${reviews.length})`)
      } else if (Array.isArray(dataObj.rows)) {
        // Let's print out the rows to see what they contain
        console.log(`Found rows in data (length: ${dataObj.rows.length})`)
        console.log("Sample row 1:", JSON.stringify(dataObj.rows[0], null, 2))
      }
    } else {
      console.log("Report cmpoyw70x0003jr048ui13m2t not found.")
    }
  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

run()
