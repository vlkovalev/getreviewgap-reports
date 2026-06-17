import { readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { spawn } from "node:child_process"

const testsDir = dirname(fileURLToPath(import.meta.url))
const testFiles = readdirSync(testsDir)
  .filter((file) => file.endsWith(".test.ts"))
  .sort()

function runTest(file) {
  return new Promise((resolve) => {
    console.log(`\n--- Running ${file} ---`)
    const child = spawn(process.execPath, ["--import", "tsx", join(testsDir, file)], {
      stdio: "inherit",
      env: process.env
    })
    child.on("exit", (code) => resolve(code === 0))
  })
}

async function main() {
  let allPassed = true
  for (const file of testFiles) {
    const passed = await runTest(file)
    if (!passed) allPassed = false
  }
  if (!allPassed) {
    console.error("\nOne or more test files failed.")
    process.exit(1)
  }
  console.log("\nAll test files passed.")
}

main()
