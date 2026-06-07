// Test to verify the closeUnclosedBrackets function works correctly

function closeUnclosedBrackets(value: string): string {
  const brackets = { "(": ")", "[": "]", "{": "}" }
  const stack: string[] = []
  
  for (const char of value) {
    if (char === "(" || char === "[" || char === "{") {
      stack.push(char)
    } else if (char === ")" || char === "]" || char === "}") {
      if (stack.length > 0) {
        const last = stack[stack.length - 1]
        if ((last === "(" && char === ")") || (last === "[" && char === "]") || (last === "{" && char === "}")) {
          stack.pop()
        }
      }
    }
  }
  
  return value + stack.reverse().map((bracket) => brackets[bracket as keyof typeof brackets]).join("")
}

// Test cases
const testCases = [
  {
    input: "15 of 57 reviews (26",
    expected: "15 of 57 reviews (26)",
    description: "Unclosed parenthesis"
  },
  {
    input: "evidence: 15 of 57 reviews (26.3%). Sub-patterns: deflates quickly, arrived punctured, difficult",
    expected: "evidence: 15 of 57 reviews (26.3%). Sub-patterns: deflates quickly, arrived punctured, difficult",
    description: "Properly closed parenthesis"
  },
  {
    input: "value with [unclosed bracket",
    expected: "value with [unclosed bracket]",
    description: "Unclosed square bracket"
  },
  {
    input: "Mitigates top complaint theme: Inflation and Air Retention Issues. Evidence: 15 of 57 reviews (26",
    expected: "Mitigates top complaint theme: Inflation and Air Retention Issues. Evidence: 15 of 57 reviews (26)",
    description: "Another unclosed parenthesis case from PDF"
  },
  {
    input: "normal text without brackets",
    expected: "normal text without brackets",
    description: "No brackets at all"
  },
  {
    input: "text with { multiple { unclosed { brackets",
    expected: "text with { multiple { unclosed { brackets}}}",
    description: "Multiple unclosed brackets"
  }
]

console.log("Testing closeUnclosedBrackets function:\n")
let passed = 0
let failed = 0

testCases.forEach((testCase) => {
  const result = closeUnclosedBrackets(testCase.input)
  const success = result === testCase.expected
  
  if (success) {
    console.log(`✓ PASS: ${testCase.description}`)
    passed++
  } else {
    console.log(`✗ FAIL: ${testCase.description}`)
    console.log(`  Input:    "${testCase.input}"`)
    console.log(`  Expected: "${testCase.expected}"`)
    console.log(`  Got:      "${result}"`)
    failed++
  }
})

console.log(`\n${passed} passed, ${failed} failed`)
