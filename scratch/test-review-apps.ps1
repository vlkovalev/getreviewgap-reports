$base = "http://localhost:3100"
$cases = @(
  @{ app = "judgeme"; url = "https://demo.com/products/glow-serum" },
  @{ app = "loox"; url = "https://demo.com/products/glow-serum" },
  @{ app = "yotpo"; url = "https://demo.com/products/glow-serum" },
  @{ app = "okendo"; url = "https://demo.com/products/glow-serum" },
  @{ app = "stamped"; url = "https://demo.com/products/glow-serum" },
  @{ app = "shopify-product-reviews"; url = "https://demo.com/products/glow-serum" },
  @{ app = "other"; url = "https://demo.com/products/glow-serum" }
)

$resultsFile = "scratch\review-app-test-results.json"
$results = @()

foreach ($case in $cases) {
  $app = $case.app
  $email = "test-$app-$(Get-Random)@example.com"
  Write-Host "=== Testing $app ==="
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $signupBody = "mode=signup&email=$email&password=testpass123&redirectTo=/onboarding"
  Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -Body $signupBody -ContentType "application/x-www-form-urlencoded" -WebSession $session -MaximumRedirection 5 -UseBasicParsing -TimeoutSec 30 | Out-Null

  $payload = @{
    reportType = "REVIEW_RATING"
    platform = "shopify"
    productUrl = $case.url
    reviewApp = $app
    reviewPageLimit = 5
  } | ConvertTo-Json

  $result = [ordered]@{ app = $app; status = $null; error = $null; reportId = $null; source = $null; reviewCount = $null; sampleNote = $null; executiveSummary = $null; pdfBytes = $null; pdfHasUnescapedBrackets = $null }
  try {
    $resp = Invoke-WebRequest -Uri "$base/api/scraper/reports" -Method POST -Body $payload -ContentType "application/json" -WebSession $session -MaximumRedirection 0 -UseBasicParsing -TimeoutSec 90
    $result.status = [int]$resp.StatusCode
    $json = $resp.Content | ConvertFrom-Json
    $result.reportId = $json.report.id
    $result.source = $json.report.summary.source
    $result.reviewCount = $json.report.summary.reviewCount
    $result.sampleNote = $json.report.summary.sampleNote
    $result.executiveSummary = $json.report.summary.executiveSummary

    try {
      $pdfResp = Invoke-WebRequest -Uri "$base/api/scraper/reports/$($json.report.id)/export?format=pdf" -WebSession $session -UseBasicParsing -TimeoutSec 30
      $result.pdfBytes = $pdfResp.RawContentLength
    } catch {
      $result.pdfBytes = "PDF export failed: " + $_.Exception.Message
    }
  } catch [System.Net.WebException] {
    $resp = $_.Exception.Response
    if ($resp) {
      $result.status = [int]$resp.StatusCode
      $stream = $resp.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $result.error = $reader.ReadToEnd()
    } else {
      $result.error = "WebException (no response): " + $_.Exception.Message
    }
  } catch {
    $result.error = "ClientError: " + $_.Exception.GetType().FullName + ": " + $_.Exception.Message
  }
  Write-Host ($result | ConvertTo-Json -Compress)
  $results += [pscustomobject]$result
  $results | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 $resultsFile
}

$results | Format-Table -AutoSize
