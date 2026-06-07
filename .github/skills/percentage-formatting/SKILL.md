---
name: percentage-formatting
description: How to fix percentage formatting in PDF/report output when parentheses are unclosed or digits lack the % symbol.
---

# Percentage Formatting in Report Generation

## Problem Context

When generating PDF reports from review analysis data, percentages can lose their `%` symbol if:
1. The `closeUnclosedBrackets()` function closes unclosed parentheses without preserving formatting
2. AI model output contains incomplete percentage strings like `"20 of 57 reviews (35"` instead of `"20 of 57 reviews (35%)"`

This results in evidence statements like:
- ❌ `"Evidence: 20 of 57 reviews (35)"`
- ✅ `"Evidence: 20 of 57 reviews (35%)"`

## Solution

The `closeUnclosedBrackets()` function in `lib/reports/report-engine.ts` detects unclosed parentheses containing only digits or decimals and adds the `%` symbol before closing them.

### Implementation

```typescript
function closeUnclosedBrackets(value: string): string {
  const brackets = { "(": ")", "[": "]", "{": "}" }
  const stack: string[] = []
  
  // Collect unclosed brackets
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
  
  let result = value
  if (stack.length > 0) {
    const closingBrackets = stack.reverse().map((bracket) => brackets[bracket as keyof typeof brackets]).join("")
    
    // Check if the last unclosed bracket is "(" and the value ends with digits or decimals
    // Transform "reviews (35" → "reviews (35%)" 
    if (stack[0] === "(" && /\(\d+\.?\d*$/.test(value)) {
      result = value + "%" + closingBrackets
    } else {
      result = value + closingBrackets
    }
  }
  
  return result
}
```

### Key Pattern

The regex `/\(\d+\.?\d*$/` matches:
- `\(` — literal opening parenthesis
- `\d+\.?\d*` — one or more digits, optional decimal point, zero or more digits
- `$` — end of string

This ensures we only add `%` for numeric values, not other unclosed brackets.

### Test Cases

```typescript
// ✅ PASS: Adds % to incomplete percentage
"15 of 57 reviews (26" → "15 of 57 reviews (26%)"

// ✅ PASS: Preserves already-formatted percentages
"evidence: 15 of 57 reviews (26.3%)" → unchanged

// ✅ PASS: Closes other brackets without %
"value with [unclosed bracket" → "value with [unclosed bracket]"

// ✅ PASS: Complex case with full evidence statement
"Mitigates top complaint theme: Inflation Issues. Evidence: 15 of 57 reviews (26" 
→ "Mitigates top complaint theme: Inflation Issues. Evidence: 15 of 57 reviews (26%)"
```

## Where It's Used

- **File**: `lib/reports/report-engine.ts`
- **Context**: Processing report data for PDF export via the `stringifyPdfValue()` function
- **Called for**: Evidence strings, recommendation text, verbatim quotes—anywhere percentages appear in report output

## Related Files

- `test-brackets.ts` — Contains comprehensive test cases
- `lib/ai/service.ts` — Where AI-generated report data is created (lines 1070-1104)
- `lib/ai/prompts.ts` — System prompt that instructs AI to include percentage format: `'{count} of {total} reviews ({pct}%)'`

## Learnings

1. **Source of Problem**: AI models occasionally truncate numeric output, especially near token limits. The percentage value arrives incomplete from the LLM, requiring downstream cleanup.
2. **Why Not Fix at Source**: It's safer and more resilient to normalize output in the formatting layer than to enforce strict AI output constraints—formatting functions become the guardrail.
3. **Decimal Handling**: Support both integers and decimals (`26` and `26.3`) because the AI prompt specifies `toFixed(2)` for precision, but truncation can remove the decimal portion.
4. **Bracket Matching**: The function correctly handles nested and multiple unclosed brackets; it only adds `%` when the specific pattern of `"(\d"` is detected at the end.
