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

$results = @()

foreach ($case in $cases) {
  $app = $case.app
  $email = "test-$app-$(Get-Random)@example.com"
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $signupBody = "mode=signup&email=$email&password=testpass123&redirectTo=/onboarding"
  Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -Body $signupBody -ContentType "application/x-www-form-urlencoded" -WebSession $session -MaximumRedirection 5 | Out-Null

  $payload = @{
    reportType = "REVIEW_RATING"
    platform = "shopify"
    productUrl = $case.url
    reviewApp = $app
    reviewPageLimit = 5
  } | ConvertTo-Json

  $result = [ordered]@{ app = $app; status = $null; error = $null; reportId = $null }
  try {
    $resp = Invoke-WebRequest -Uri "$base/api/scraper/reports" -Method POST -Body $payload -ContentType "application/json" -WebSession $session -MaximumRedirection 0
    $result.status = $resp.StatusCode
    $json = $resp.Content | ConvertFrom-Json
    $result.reportId = $json.report.id
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $result.status = [int]$resp.StatusCode
      $stream = $resp.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $result.error = $reader.ReadToEnd()
    } else {
      $result.error = $_.Exception.Message
    }
  }
  $results += [pscustomobject]$result
}

$results | Format-Table -AutoSize
$results | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 "scratch\review-app-test-results.json"
