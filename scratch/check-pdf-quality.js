const fs = require("fs")

const pdfPath = process.argv[2]
if (!pdfPath) {
  console.error("Usage: node scratch/check-pdf-quality.js <path-to-report.pdf>")
  process.exit(1)
}

if (!fs.existsSync(pdfPath)) {
  console.error(`PDF not found: ${pdfPath}`)
  process.exit(1)
}

const buf = fs.readFileSync(pdfPath)
const text = buf.toString("latin1")
const matches = text.match(/\(((?:[^()\\]|\\.)*)\)\s*Tj/g) || []
const decoded = matches.map((m) => m.replace(/\)\s*Tj$/, "").replace(/^\(/, "").replace(/\\\(/g, "(").replace(/\\\)/g, ")"))
console.log("PDF:", pdfPath)
console.log("Tj string count:", decoded.length)
const joined = decoded.join(" ")
console.log("--- sample text ---")
console.log(joined.slice(0, 2500))
console.log("--- red flags ---")
const checks = {
  "contains [object Object]": joined.includes("[object Object]"),
  "contains undefined": joined.includes("undefined"),
  "contains NaN": joined.includes("NaN"),
  "contains bare null word": /\bnull\b/.test(joined)
}
for (const [label, failed] of Object.entries(checks)) {
  console.log(`${label}:`, failed)
}
console.log("unclosed paren count check - open vs close in raw strings:")
let unbalanced = 0
for (const d of decoded) {
  let depth = 0
  for (const ch of d) {
    if (ch === "(") depth++
    if (ch === ")") depth--
  }
  if (depth !== 0) unbalanced++
}
console.log("strings with unbalanced parens:", unbalanced)
if (Object.values(checks).some(Boolean) || unbalanced > 0) process.exit(2)
