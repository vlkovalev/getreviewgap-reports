# GetReview / ReviewGap Process Audit

Date: 2026-06-23

Evidence reviewed: application routes, dashboard components, Prisma schema, report-generation API, payment flows, compliance page, tests, and the attached audit prompt. No screen recording, external guide, Google review flow, SMS/WhatsApp provider setup, or real tester notes were provided.

Corrected scope note: the supplied prompt described a review-generation/reputation-management product, but the actual product is a competitor review-intelligence and reporting tool. Customer review request, Google review, SMS, WhatsApp, reminder, and unsubscribe sections below are treated as not applicable unless the product is deliberately expanded later.

Fixes applied after this audit:

- Added a private beta guide that explains the actual competitor intelligence workflow.
- Made "Generate report" the primary dashboard path.
- Reworded sources/batches as advanced analysis tools, not review-request setup.
- Removed the fake schedule field from advanced batches.
- Added server-side report preflight checks before credit consumption for missing inputs, weak pasted-review text, and unsupported Shopify direct-source paths.
- Improved report failure responses so refunded credits are explicit.
- Added no-credit static sample reports for signed-in beta testers.
- Added report-level beta feedback capture backed by audit events.
- Added input-readiness hints in the report generator.

## 1. Executive Verdict

| Area | Verdict |
| --- | --- |
| Overall Process Verdict | Almost ready with minor fixes for private beta; not ready for broad public launch. |
| Ready for Builder/Admin Testing? | Ready for current competitor review-intelligence administration. |
| Ready for Business User Testing? | Ready for controlled private beta with 3-5 Amazon sellers and selected Shopify export testers. |
| Ready for Customer Review Collection? | Not applicable. The product does not collect public reviews from customers. |
| Ready for Client Demo? | Ready if framed as "private beta competitor review intelligence." |
| Ready for Public Launch? | Not ready; public launch should wait until real beta report quality, account recovery, and provider reliability are proven. |
| Biggest Process Risk | Live review-source reliability: Amazon/Shopify providers can expose less written review text than users expect. |
| Most Confusing Step | Advanced sources and batches can still look like setup prerequisites, even though Generate report is the main path. |
| Most Technically Risky Step | Live third-party review retrieval from Amazon/Shopify review apps, because external platforms limit access and connectors can fail. |
| Most Missing Step | Account recovery and deeper source-quality scoring. Basic preflight, sample reports, and structured report feedback are now implemented. |
| Most Important Fix | Keep the beta positioned as competitor intelligence and validate report quality with real sellers before public launch. |
| Confidence Level | High for code-level findings; medium for live UX because no screen recording or tester session was provided. |

## 2. Product and Process Assumptions

| Area | Current Understanding | Evidence | Assumption / Unclear Point |
| --- | --- | --- | --- |
| Product purpose | Generate AI competitor review-intelligence reports. | `app/dashboard/reports`, `lib/reports/report-engine.ts`, report exports. | The attached prompt assumes review generation/reputation management, which is not implemented. |
| Target business | Amazon sellers first; Shopify/DTC teams via authorized exports/imports. | Homepage/pricing/about copy and dashboard report UI. | Exact niche for private beta should be narrowed to 3-5 Amazon sellers. |
| Target admin/builder | Internal owner/admin manages content and demo scraper sources. | `/admin`, `/dashboard/sources`, `/dashboard/jobs`. | No builder flow for customer-review campaigns exists. |
| Target customer/end-user | Paying account user who generates reports. | `CustomerAccount`, credits, billing, saved reports. | There is no separate "customer who leaves a review" role. |
| Main workflow | Sign up, buy/use credits, generate report from Amazon URL or Shopify export/source, view/export report. | `ReportsClient`, `/api/scraper/reports`, billing pages. | Real-world reliability depends on provider configuration and marketplace limits. |
| Expected output | PDF/CSV/JSON report with complaints, compliments, buyer language, gaps, and recommendations. | Report detail and export routes. | Report quality still needs real seller beta feedback. |
| Data required | Account email/password, product URL or pasted/exported reviews, optional product/competitor name, review app, report type. | `ReportsClient` fields and API schema. | No business profile, Google review link, customer contact list, or consent fields. |
| Channels used | Web app, Stripe, PayPal, email for leads/inquiries. | Checkout and email modules. | No SMS, WhatsApp, or customer review-request email campaign channel. |
| Who configures it | Account user configures report defaults and sources/jobs; admin configures content. | Settings, sources, jobs, admin pages. | No self-serve connector setup wizard. |
| Who sends review requests | Nobody. | No campaign/send/request models or routes. | Not verifiable from provided materials. |
| Who receives review requests | Nobody. | No customer recipient model or messaging flow. | Not verifiable from provided materials. |
| Where reviews are posted | Nowhere through the app. Reports analyze existing reviews. | No Google review destination or public review landing page. | Not verifiable from provided materials. |
| What success means | A user receives a useful report and can export it. | Product copy and report UI. | If success means "more Google reviews," the current app does not meet it. |

Clarification required before a reliable product audit is possible: is "GetReview" meant to become a review-request/reputation system, or is the actual product "ReviewGap/GetReviewGap" for competitor review intelligence? The current code supports the second.

## 3. Step-by-Step Process Inventory

| Step # | Step Name | User Role | User Action | System Action | Expected Output | Evidence Source |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Enter private beta site | Visitor/tester | Opens URL and enters Basic Auth credentials | Middleware gates all public pages when env vars are set | Private beta access | `middleware.ts` |
| 2 | Understand product | Visitor/tester | Reads homepage/about/pricing/compliance | Pages explain Amazon-first review intelligence | User understands this is reporting, not review solicitation | `app/page.tsx`, `app/about/page.tsx`, `app/compliance/page.tsx` |
| 3 | Sign up or log in | Business user | Provides email/password | Creates or validates customer session | Account with credits | `/signup`, `/login`, `/api/auth/login`, `CustomerAccount` |
| 4 | View dashboard | Business user | Opens dashboard | Shows sources, runs, products, reports, billing, settings | Orientation to report workflow | `DashboardNav` |
| 5 | Configure report defaults | Business user | Chooses default report type/source/depth/review app | Saves in localStorage | Defaults prefill report generator | `SettingsClient` |
| 6 | Add review source | Business/admin user | Enters source name, URL, type, rate limit, compliance note | Saves source to scraper store/API | Source appears in dashboard | `SourcesClient`, `/api/scraper/sources` |
| 7 | Create review batch | Business/admin user | Adds source and Amazon product URLs | Saves scrape job | Batch can be run | `JobsClient`, `/api/scraper/jobs` |
| 8 | Run review batch | Business/admin user | Clicks analyze now | Runs demo/generic adapter | Run history/product data updated | `JobsClient`, `run-scrape-job.ts` |
| 9 | Generate report | Business user | Chooses Amazon/Shopify, URL/export/pasted reviews, report type | Consumes 1 credit, fetches/imports reviews, calls AI/report engine | Saved intelligence report | `ReportsClient`, `/api/scraper/reports` |
| 10 | Handle failed report | System/business user | Report generation fails | Credit is returned where error is caught | Error message and restored credit | `/api/scraper/reports` |
| 11 | View report | Business user | Opens saved report | Renders metrics, findings, evidence, warnings | Decision-ready report page | `app/dashboard/reports/[id]/page.tsx` |
| 12 | Export report | Business user | Clicks PDF/CSV/JSON | Export route renders selected format | Downloadable artifact | `/api/scraper/reports/[id]/export` |
| 13 | Buy credits | Business user | Chooses Stripe/PayPal checkout | Payment creates/captures order and grants credits | Additional report credits | Checkout/API routes |
| 14 | Manage account | Business user | Changes password, views billing | Updates password/local prefs/ledger | Account remains usable | Settings/billing routes |

Steps unclear: "Review sources" and "Review batches" sound like outgoing review collection. They need wording that makes analysis purpose explicit.

Steps missing for the attached prompt: business profile, Google review link setup, landing page builder, message templates, contact import, consent/opt-out, preview/test send, live review request, reminders, review outcome tracking, QR code generation, suppression list, audit log for sent requests.

Steps duplicated: Dashboard "sources/jobs" and "reports" both appear to initiate analysis, but the relationship is weak. A new user may not know whether to create a batch first or go straight to My Reports.

Steps out of order: Billing appears after reports in nav; for a new paid workflow, credits and onboarding should be clearer before report generation.

Steps dependent on unavailable information: Live Shopify connector success depends on store/review-app public access or exports; not all users will have this.

## 4. Practicality and Feasibility Audit

| Step # | Step | Understandable? | Practical? | Technically Feasible? | Main Risk | Required Fix |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Private beta access | Yes | Yes for testers | Easy | Testers may not know why browser asks for credentials | Send a short beta access note with username/password and normal account signup steps. |
| 2 | Product understanding | Partly | Yes if framed as reports | Easy | "GetReview" name suggests collecting reviews, not analyzing competitor reviews | Rename or reposition copy: "ReviewGap intelligence" vs "GetReview requests." |
| 3 | Signup/login | Yes | Yes | Easy | No email verification/reset shown | Add email verification or at least password reset before broader beta. |
| 4 | Dashboard orientation | Partly | Moderate | Easy | Too many nav items for first-time user | Add guided first-run checklist: Generate first report, Buy credits, View exports. |
| 5 | Report defaults | Yes | Yes | Easy | Preferences saved only locally | Persist preferences per account if users switch devices. |
| 6 | Add review source | Partly | Moderate | Moderate | Users may think this connects a real source; "Approved adapter or API later" is vague | Split into "Demo source" and "Live provider setup"; validate base URL and explain limitations. |
| 7 | Create review batch | Partly | Moderate | Moderate | Batch flow looks scheduled but schedule is manual text | Make schedule a real enum or remove until cron exists. |
| 8 | Run review batch | Partly | Moderate | Moderate | "Analyzing demo review data" may not match live expectations | Show source type and whether live data will be used before running. |
| 9 | Generate report | Mostly | Yes for Amazon beta users | Moderate/High | External provider failures, invalid URLs, no review text, credit consumption anxiety | Add preflight validation and preview of source/method before consuming credit. |
| 10 | Failed report recovery | Mostly | Yes | Moderate | Refund is automatic only around caught errors; users may not trust it | Show explicit "credit returned" ledger entry and failure reason in UI. |
| 11 | View report | Yes | Yes | Easy/Moderate | Users may over-trust AI findings | Keep evidence warnings and add confidence labels per section. |
| 12 | Export report | Yes | Yes | Moderate | PDF formatting regressions are easy to miss | Keep rendered-PDF text extraction tests in CI. |
| 13 | Buy credits | Yes | Yes | Moderate | PayPal/Stripe account identity, webhook, and session mapping issues | Keep live payment smoke tests and reconcile dashboard. |
| 14 | Manage account | Partly | Moderate | Easy | No password reset, no email change, no delete/export data | Add account lifecycle controls before public launch. |

Detailed step review summary:

- Step 1 verdict: Pass. Fix: include beta credential instructions and rotate the shared password after each testing wave.
- Step 2 verdict: Needs Fix. Fix: stop using review-generation language unless that product is built.
- Step 3 verdict: Needs Fix. Fix: add password reset, email verification, and a clearer post-signup onboarding path.
- Step 4 verdict: Needs Fix. Fix: reduce first-run nav complexity and add "Start here."
- Step 5 verdict: Pass for beta. Fix: persist defaults server-side later.
- Step 6 verdict: Needs Fix. Fix: clarify source setup is for analysis data, not review request destinations.
- Step 7 verdict: Needs Fix. Fix: either build true scheduled jobs or remove schedule field.
- Step 8 verdict: Needs Fix. Fix: show dry-run/live source label and run logs.
- Step 9 verdict: Needs Fix. Fix: add preflight source validation, no-credit demo mode, and clear errors for each provider.
- Step 10 verdict: Pass with UX gap. Fix: visible refund/credit ledger feedback.
- Step 11 verdict: Pass for beta. Fix: add section-level confidence and source coverage warnings.
- Step 12 verdict: Pass with regression risk. Fix: automated PDF extraction checks.
- Step 13 verdict: Needs Fix before public launch. Fix: full checkout test plan and webhook monitoring.
- Step 14 verdict: Needs Fix. Fix: password reset/email change/data export/delete.

## 5. Builder/Admin Flow Audit

| Builder/Admin Task | Current Experience | Practicality Risk | Feasibility Risk | Suggested Fix |
| --- | --- | --- | --- | --- |
| Understand what GetReview does | Mostly clear as review intelligence, unclear as GetReview reputation product | High if sold as review generation | Low | Decide product name/category and align all copy. |
| Start setup | Dashboard exists | Medium | Low | Add onboarding checklist. |
| Add business/company details | Not implemented for customer accounts | Medium | Low | Add BusinessProfile model and setup screen. |
| Connect review destinations | Not implemented | Critical for reputation product | Moderate | Only needed if building review requests; add Google review URL/platform links. |
| Configure review landing page | Not implemented | Critical for reputation product | Moderate | Add landing page builder/preview if product direction changes. |
| Configure request templates | Not implemented | Critical | Moderate | Add template editor with variable validation. |
| Configure email/SMS/WhatsApp | Not implemented | Critical | High | Add providers, consent, unsubscribe, delivery tracking. |
| Add/import contacts | Not implemented | Critical | Moderate | Add Contact model, CSV import, validation, dedupe. |
| Map fields | Not implemented | High | Moderate | CSV mapper with preview. |
| Set consent/compliance rules | Not implemented | Critical | Moderate | Consent fields, suppression list, policy guardrails. |
| Define routing logic | Not implemented | Critical/policy risk | Moderate | Avoid review gating; collect feedback ethically. |
| Set reminders | Not implemented | High | Moderate | Reminder rules with stop conditions. |
| Preview customer experience | Not implemented | Critical | Low/Moderate | Preview and send-test mode. |
| Publish flow | Not implemented | Critical | Moderate | Launch checklist and blockers. |
| Monitor sent requests/outcomes | Not implemented | Critical | High | Delivery/outcome dashboard. |
| Edit later/fix mistakes | Partial for reports only | Medium | Low | Add edit/archive/delete paths for real setup objects. |

Can a new builder/admin complete setup without support? No for a review-request product. For the current report product, a beta user can likely generate a report after brief instructions.

Where builders/admins will get stuck: source setup meaning, Shopify connector expectations, whether to use sources/jobs or My Reports, live vs demo data, what happens when a report fails.

Validations missing: live source preflight, customer account email verification, source URL intent, schedule semantics, Shopify connector readiness, account data lifecycle.

Setup defaults needed: Amazon report default, one demo product, no-credit sample report, "paste/exported reviews" default for Shopify until connectors are validated.

## 6. Business User Flow Audit

| Business User Step | Current Experience | Confusion Risk | Failure Risk | Suggested Fix |
| --- | --- | --- | --- | --- |
| Understand review-intelligence workflow | Homepage and dashboard explain reports | Medium | Low | Add one-page "How beta works." |
| Add/import customers | Not implemented | Critical if expected | Critical | Do not promise customer review collection. |
| Choose who receives request | Not implemented | Critical | Critical | Build campaign/contact module only if pivoting. |
| Preview message | Not implemented | Critical for request product | Critical | Build preview/test send before live messaging. |
| Generate report | Implemented | Medium | Medium | Preflight before credit use. |
| Monitor report status | Implemented as saved reports/runs | Medium | Medium | Add stronger in-progress/failure state. |
| Understand performance | Report outputs exist | Medium | Medium | Add report quality/source coverage score. |
| Avoid consent violations | Compliance page exists for data analysis, not messaging | High | High | Add consent language only if messaging is built. |

Can a business user send review requests confidently? No. That flow does not exist.

Where users hesitate: choosing source vs report, Shopify review app choice, uploading review exports, trusting credit refund behavior.

Where trust is weak: live data availability, AI confidence, payment/credit attachment, and any wording implying review collection.

## 7. Customer / End-User Review Flow Audit

| Customer Step | Current Experience | Confusion Risk | Failure Risk | Suggested Fix |
| --- | --- | --- | --- | --- |
| Receive review request | Not implemented | Not verifiable from provided materials. | Critical | Build only if product direction requires it. |
| Recognize business | Not implemented | Not verifiable from provided materials. | Critical | Branded landing pages and sender identity. |
| Trust link | Not implemented | Not verifiable from provided materials. | Critical | Custom domain, HTTPS, business logo, clear copy. |
| Leave public review | Not implemented | Not verifiable from provided materials. | Critical | Add destination links and policy review. |
| Leave private feedback | Not implemented | Not verifiable from provided materials. | Critical | Add feedback form and notifications. |
| Confirmation | Not implemented | Not verifiable from provided materials. | Critical | Confirmation screen and fallback contact. |
| Unsubscribe/opt out | Not implemented | Not verifiable from provided materials. | Critical | Required before SMS/email campaigns. |

Can a customer complete the review flow without explanation? No. There is no customer review flow.

## 8. Review Request and Reputation Logic Audit

| Logic Area | Expected Behavior | Current / Observed Behavior | Risk | Suggested Fix |
| --- | --- | --- | --- | --- |
| Manual request | Send one review request | Not implemented | Critical if promised | Add contact/campaign/request models. |
| Bulk request | Send to selected contacts safely | Not implemented | Critical | Add CSV import, validation, confirmation. |
| Triggered request | Send after service completion | Not implemented | High | Later integration via webhook/Zapier. |
| Email request | Deliver, track, unsubscribe | Not implemented | Critical | Resend/SendGrid plus unsubscribe and bounce handling. |
| SMS request | Consent, deliver, opt out | Not implemented | Critical/compliance | Twilio with consent fields and STOP handling. |
| WhatsApp request | Consent/template approval | Not implemented | High | WhatsApp Business API if needed later. |
| QR code | Static review link | Not implemented | Medium | Add QR generator after review landing page exists. |
| Google redirection | Validate and route | Not implemented | High/policy | Add link validator; avoid deceptive gating. |
| Positive/negative routing | Could become review gating | Not implemented | Critical policy risk | Avoid suppressing negative public review access. |
| Reminder sequence | Stop after completion/opt-out | Not implemented | High | Reminder engine with suppression rules. |
| Duplicate prevention | Block recent duplicate requests | Not implemented | High | Unique contact/campaign cooldown. |
| Outcome tracking | Track delivery/clicks, not guaranteed Google completion | Not implemented | High | Track only what is verifiable; allow manual confirmation. |

Safe rules if this product is built:

- Missing email/phone: block that channel and explain.
- Recently requested: warn and block duplicate by default.
- Missing SMS/WhatsApp consent: block send.
- Invalid review link: block campaign launch.
- Failed test request: block live campaign.
- Low rating/private feedback: collect feedback and notify business, but do not mislead customers about public options.
- Unsubscribe: suppress all future marketing/review requests.
- Bounce: mark contact invalid.
- Completed internal feedback: stop reminders. Public Google completion must not be assumed without a supported integration.

## 9. Data Requirement and Field Validation Audit

| Field / Data Object | Used In Step | Required? | User Understands It? | Validation Needed | Failure If Wrong | Suggested Fix |
| --- | --- | --- | --- | --- | --- | --- |
| Customer account email | Signup/login/billing | Yes | Yes | Email format, uniqueness, verification | Lost account/credits | Add verification/password reset. |
| Password | Signup/login | Yes | Yes | Strength/min length | Account compromise/support | Raise password standards and reset. |
| Product URL | Report generation | Optional/conditional | Mostly | Public URL, SSRF guard, platform parsing | Failed report/security risk | Keep SSRF guard and clear URL examples. |
| Product name | Report generation | Optional | Yes | Length, placeholder handling | Generic report title | Do not pass generic placeholders into connectors. |
| Competitor name | Report generation | Optional | Yes | Length | Weak report context | Add examples. |
| Pasted reviews | Report generation | Optional/conditional | Mostly | Size, content quality, PII warning | Bad report/no reviews | Add preview and review count estimate. |
| Shopify review app | Shopify report | Conditional | Maybe | Enum and connector support | Failed connector | Add "export recommended" guidance. |
| Review depth | Amazon report | Conditional | Yes | Enum | Higher provider cost/time | Explain time/cost. |
| Source name/base URL/type | Sources/jobs | Yes | Partly | URL, type clarity | Invalid source/job | Rename to analysis source; add preflight. |
| Schedule | Jobs | No/unclear | No | Enum or remove | False expectation of automation | Remove until true scheduler exists. |
| Credits | Reports/billing | Yes | Yes | Idempotent transactions | Billing/support issue | Keep ledger and display refunds. |
| Business name/logo | Review-request product | Missing | Not verifiable | Required if built | Untrusted customer request | Add BusinessProfile if pivoting. |
| Google review link | Review-request product | Missing | Not verifiable | URL/destination validation | Broken review CTA | Add validator if pivoting. |
| Contacts/consent | Review-request product | Missing | Not verifiable | Email/phone/consent/dedupe | Compliance/wrong recipient | Add before any customer messaging. |
| Message template | Review-request product | Missing | Not verifiable | Variable validation | Broken messages | Add preview/test send if pivoting. |

## 10. Flow Logic and Dependency Audit

| Step | Depends On | What Happens If Dependency Is Missing? | Current Handling | Required Handling |
| --- | --- | --- | --- | --- |
| Generate report | Signed-in account and credits | 401 or 402 | Implemented | Good; add clearer UI path to buy credits. |
| Amazon live report | Product URL or pasted reviews plus provider config | No reviews/error/fallback | Implemented with provider fallbacks | Add preflight and coverage estimate. |
| Shopify report | URL + supported connector or pasted/exported reviews | Connector failure/no reviews | Partial | Default to upload/export guidance until connector verified. |
| Export report | Saved report owned by user | 401/not found | Implemented | Good; keep export tests. |
| Purchase credits | Signed-in customer identity | Credits may not attach | Recently fixed | Keep live checkout smoke tests. |
| Customer review request | Business profile, destination, templates, contacts, consent | Cannot safely send | Not implemented | Must block entirely until built. |

Process dependency map for the implemented app:

```text
Private beta access
  -> account signup/login
  -> report credit balance
  -> choose platform/source
  -> provide URL/export/pasted reviews
  -> preflight review availability
  -> generate report
  -> inspect warnings/confidence
  -> export PDF/CSV/JSON
  -> buy more credits / generate next report
```

Process dependency map if building a reputation/review-request product:

```text
Business profile
  -> review destination link
  -> link validation
  -> message template
  -> customer/contact list
  -> consent + valid contact info
  -> preview + test send
  -> live send
  -> delivery tracking + follow-up
  -> review outcome tracking
```

## 11. Missing Flow and Edge Case Detection

| Missing Flow / Edge Case | Why It Matters | Consequence If Missing | Recommended Fix | Priority |
| --- | --- | --- | --- | --- |
| Product identity decision | Determines scope and messaging | Users expect wrong product | Decide review-intelligence vs reputation product | Critical |
| Guided first-time onboarding | Reduces setup confusion | Beta users stall | Add setup checklist | High |
| No-credit sample report | Lets users test safely | Fear of wasting credits | Add demo mode button | High |
| Source preflight | Prevents failed paid reports | Support/refund burden | Validate source before consuming credit | Critical |
| Shopify connector readiness labels | External connectors vary | Overpromising | Mark live connector/export/manual modes | High |
| Password reset | Basic account support | Lockouts | Add reset flow | High |
| Email verification | Billing/account trust | Wrong email/credit support | Add verification | Medium |
| Account email change | User asked about payment/email issues | Support burden | Add email change flow | Medium |
| Report generation queue/status | OpenAI/provider can be slow | User repeats/clicks away | Add durable job status | Medium |
| Review-request contacts/campaigns | Required for reputation product | Product cannot collect reviews | Build only if pivoting | Critical |
| Consent/opt-out | Required for messaging | Legal/compliance risk | Add before SMS/email campaigns | Critical |
| Test send/preview | Prevents wrong sends | Trust failure | Add before live campaigns | Critical |
| Audit log | Support/compliance | Cannot prove what happened | Extend existing AuditEvent usage | High |

## 12. Technical Feasibility Review

| Technical Requirement | Needed For | Feasibility | Risk | Suggested Implementation |
| --- | --- | --- | --- | --- |
| Auth/session | Private reports and billing | Easy | Current password lifecycle gaps | Add reset/verification; keep beta gate. |
| Credits/ledger | Paid report usage | Easy/Moderate | Payment reconciliation | Keep idempotent provider IDs and ledger UI. |
| Amazon review providers | Live report generation | Moderate/High | Provider/API limitations | Use official/structured providers and fallback import. |
| Shopify connectors | Live report generation | High risk | Public widgets/API access change | Treat exports/imports as stable path; label live connectors beta. |
| AI report generation | Insights | Moderate | Timeout/cost/hallucination | Keep timeouts, evidence-bound prompts, confidence warnings. |
| PDF export | Client deliverable | Moderate | Formatting regressions | Use rendered text extraction tests. |
| Stripe/PayPal | Revenue | Moderate | Webhook/session/env mismatch | Keep smoke tests, logs, manual reconcile tool. |
| Customer contact import | Review requests | Moderate | Dedupe/validation/PII | Build Contact model and CSV mapper. |
| Email requests | Review requests | Moderate | Deliverability/unsubscribe | Resend/SendGrid plus unsubscribe table. |
| SMS/WhatsApp | Review requests | High risk | Consent/regional rules/provider cost | Defer until email flow is safe. |
| Google review completion tracking | Reputation reporting | High risk | External platform does not reliably confirm | Track clicks/manual confirmation only. |
| Review gating | Reputation routing | High risk | Platform policy risk | Avoid manipulative routing; legal review. |

Technically easy: beta gate, account preferences, import validation, report UI copy, PDF regression tests.

Technically risky: live marketplace review retrieval, Google review outcome tracking, SMS/WhatsApp compliance, fully automated reminders.

## 13. Practicality Score for Each Step

| Step # | Step | Practicality Score | Feasibility Score | UX Clarity Score | Reason |
| --- | --- | ---: | ---: | ---: | --- |
| 1 | Private beta access | 8 | 9 | 7 | Works, but shared Basic Auth needs instructions. |
| 2 | Product understanding | 6 | 9 | 5 | Current app and "GetReview" prompt conflict. |
| 3 | Signup/login | 8 | 8 | 8 | Core flow works; missing reset/verification. |
| 4 | Dashboard orientation | 6 | 8 | 5 | Too many similar sections for first run. |
| 5 | Report defaults | 7 | 8 | 7 | Practical, but local-only. |
| 6 | Add review source | 5 | 7 | 4 | Ambiguous for non-technical users. |
| 7 | Create review batch | 5 | 7 | 5 | Useful but overlaps with direct report generation. |
| 8 | Run review batch | 6 | 7 | 5 | Demo/live state needs clarity. |
| 9 | Generate report | 7 | 6 | 7 | Main useful flow; external data risk. |
| 10 | Failed report recovery | 7 | 7 | 6 | Credit refund exists, but feedback could be stronger. |
| 11 | View report | 8 | 8 | 8 | Strongest current user-facing value. |
| 12 | Export report | 8 | 7 | 8 | Works; needs ongoing regression tests. |
| 13 | Buy credits | 7 | 7 | 7 | Works after fixes; live provider risks remain. |
| 14 | Manage account | 5 | 8 | 6 | Too thin for public launch. |

Lowest-scoring steps: source setup, review batches, account management, product-positioning clarity.

Steps to remove or combine: merge "sources/jobs" into an advanced area; make "My reports" the primary beta path.

Steps to automate: source preflight, report input validation, connector detection, failure/refund messaging, PDF regression checks.

## 14. Process QA Test Plan

| Test ID | Scenario | Steps | Expected Result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- |
| QA-001 | Private beta gate blocks public | Visit `/` without Basic Auth | 401 with beta realm | Pass in recent smoke | Keep after env changes. |
| QA-002 | Private beta gate allows tester | Visit `/` with beta auth | Homepage loads | Pass in recent smoke | Rotate shared password periodically. |
| QA-003 | First-time signup | Sign up with new email | Account created with signup credit | Not run in this audit | Add browser test. |
| QA-004 | Login/logout | Login, visit dashboard, logout | Session works | Not run in this audit | Add e2e. |
| QA-005 | No-credit report blocked | Set credits 0, generate | 402 and pricing path | Not run | Required. |
| QA-006 | Amazon happy path | Generate Amazon report | Report saved, credit decremented | Previously tested, rerun before beta | Use real tester ASINs. |
| QA-007 | Shopify export path | Upload/paste CSV | Report saved | Tests cover parser; live UI should be tested | Stable non-Loox path. |
| QA-008 | Shopify connector matrix | Test all dropdown apps | Report or clear failure | Previously reported by parallel session | Keep script. |
| QA-009 | Invalid URL | Enter private/local URL | Blocked safely | URL tests pass | Keep SSRF tests. |
| QA-010 | Provider returns no text | Generate with limited product | No-review error and credit returned | Not run now | Critical. |
| QA-011 | AI timeout | Simulate stalled OpenAI | Clear timeout error, credit returned | Code reportedly fixed | Add test. |
| QA-012 | PDF export quality | Export PDF and extract rendered text | No bracket/star corruption | Reported fixed | Put in CI. |
| QA-013 | Stripe checkout | Start checkout as signed-in user | Live/disabled mode correct, metadata present | Not run now | Do not complete real charge without approval. |
| QA-014 | PayPal checkout | Start/capture test/live order | Credits attach to same account | Previously fixed/tested | Keep smoke. |
| QA-015 | Password change | Change password and re-login | Old password fails, new works | Unit test exists | Add UI test. |
| QA-016 | Review-request customer flow | Send request to customer | Not possible | Fail / not implemented | Do not claim this feature. |
| QA-017 | Consent/opt-out | Opt out from request | Not possible | Fail / not implemented | Required only if messaging is built. |
| QA-018 | Google review link validation | Save invalid Google link | Not possible | Fail / not implemented | Required only if reputation product. |

Acceptance criteria before this app passes private beta:

- New tester can access beta, sign up, and generate one report without verbal explanation.
- Report generation errors return credits and show clear reasons.
- Amazon report works on 3-5 real seller-selected products or explains limitations.
- Shopify is framed as export/import-first unless live source is verified.
- PDF/CSV/JSON exports are clean.
- Payment credits attach to the right account.
- No copy claims customer review request or Google review collection.

Acceptance criteria before any review-request launch:

- Business profile, review destination, templates, contacts, consent, preview, test send, live send, unsubscribe, duplicate prevention, delivery status, and audit logs exist and pass QA.

## 15. Usability Test Script

Tester Role: Amazon seller private beta user

Task: Generate a competitor review-intelligence report.

Starting Point: `https://www.getreviewgap.com` with beta credentials.

Do Not Explain: Whether to use sources/jobs or My Reports.

Observe: Navigation choice, hesitation at report fields, trust in output, export behavior.

Success Criteria: User signs up, generates a report, opens it, exports PDF, and can explain one action they would take from the report.

Questions After Task:

- What did you think this product does?
- What step confused you most?
- Where did you hesitate?
- Did you know what to do next?
- Did you trust the result?
- Did any wording feel unclear?
- What would stop you from using this?
- What should be added or removed?

Tester Role: Shopify/DTC beta user

Task: Generate a report from an authorized review export.

Starting Point: Dashboard reports page.

Observe: Whether the user understands export/paste requirements and review-app selection.

Success Criteria: User imports review text/CSV, generates a report, and understands source limitations.

Tester Role: Technical reviewer

Task: Try invalid URLs, blocked/private URLs, empty review files, and provider failure scenarios.

Success Criteria: App blocks unsafe inputs and returns credits on report failures.

Tester Role: Compliance-aware reviewer

Task: Review compliance, terms, source setup, and report warnings.

Success Criteria: No copy encourages access-control bypass, review gating, or unsupported platform claims.

If a future reputation flow is built, add 5 customer/end-user testers to receive review requests on mobile. Current app cannot run that test.

## 16. Severity-Based Issue List

| Severity | Issue | Affected Role | Evidence | Impact | Suggested Fix | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| High | Live provider reliability can vary | Business user | Amazon/Shopify sources depend on external access | Failed reports/support | Keep import fallback, warnings, and provider health tests | Engineering/Product |
| High | Source/job flow can distract first-time users | Business user | Dashboard includes advanced source/batch sections | Confusion/support | Done: reworded as advanced analysis tools and made Generate report primary | UX/Content |
| High | Preflight before credit consumption was too thin | Business user | Report POST consumed before validating basic input quality | Credit anxiety/support | Done: missing/weak inputs and unsupported Shopify source paths now fail before credit use; generator also shows input-readiness hints | Engineering |
| High | Shopify live connector expectations may be overread | Business user | Review app dropdown | Failed reports | Mark connector modes and export fallback | Product/UX |
| High | Account lifecycle incomplete | Business user | No reset/email change/delete | Support burden | Add reset, email change, data controls | Engineering |
| Medium | Preferences local-only | Business user | `localStorage` | Defaults lost across devices | Persist per account | Engineering |
| Medium | Schedule field was not real scheduling | Business/admin | Jobs form text field | False expectation | Done: removed schedule field from the advanced batch form | Product/Engineering |
| Medium | Admin vs user roles muddled | Internal/admin | `/admin` and `/dashboard` overlap | Operational confusion | Define roles and permissions | Product |
| Low | Some copy still broad | Visitor | Marketing/resource pages | Positioning drift | Maintain beta copy checklist | Content |

## 17. Suggested Process Redesign

Recommended ReviewGap intelligence process:

Step 1: Private beta access

- Goal: Keep product limited to invited testers.
- User Action: Enter beta credentials.
- System Action: Gate site with Basic Auth.
- Validation: Credentials required.
- Output: Tester reaches homepage.

Step 2: Create account

- Goal: Tie reports and credits to one user.
- User Action: Sign up or log in.
- System Action: Create session and grant signup credit.
- Validation: Email/password rules; eventually email verification.
- Output: Dashboard access.

Step 3: Choose report path

- Goal: Remove dashboard confusion.
- User Action: Click "Generate report."
- System Action: Opens a guided form.
- Validation: User selects Amazon URL, Shopify export, or pasted reviews.
- Output: Valid report input draft.

Step 4: Preflight source

- Goal: Avoid charging for doomed reports.
- User Action: Click "Check source."
- System Action: Validates URL safety, provider availability, pasted review count, and expected limitations.
- Validation: Must have enough review text or clear fallback path.
- Output: Ready-to-generate state.

Step 5: Generate report

- Goal: Produce decision-ready output.
- User Action: Use 1 credit.
- System Action: Fetch/import reviews, generate AI report, save result.
- Validation: Timeout, no-review handling, refund on failure.
- Output: Completed report.

Step 6: Review and export

- Goal: Turn findings into action.
- User Action: Read warnings, inspect evidence, export PDF/CSV/JSON.
- System Action: Renders report and downloads.
- Validation: Owned report only.
- Output: Deliverable.

Step 7: Feedback loop

- Goal: Learn from beta testers.
- User Action: Rate report usefulness and flag issues.
- System Action: Store feedback and source issues.
- Validation: Required before scaling beta.
- Output: Prioritized improvements.

Simplified flow:

```text
Start
  -> Private beta gate
  -> Sign up / log in
  -> Generate report
  -> Preflight source
  -> Use credit
  -> View report
  -> Export
  -> Give beta feedback
```

If building review-request/reputation product later:

```text
Start
  -> Create business profile
  -> Add review destination
  -> Validate review link
  -> Create message template
  -> Add/import customers
  -> Validate contact data + consent
  -> Preview customer experience
  -> Send test request
  -> Launch review requests
  -> Track delivery + outcomes
  -> Follow up / report / export
```

## 18. Suggested QA/Testability Features

| Suggested Feature | User Benefit | Why It Helps QA/Feasibility | Priority |
| --- | --- | --- | --- |
| Report input preflight | Avoid wasted credits | Tests source readiness before generation | Critical |
| No-credit demo report | Lower onboarding friction | Stable happy path | High |
| Source mode badges | Sets expectations | Separates demo/live/import | High |
| PDF extraction regression test | Trustworthy exports | Catches formatting bugs | High |
| Provider health dashboard | Fewer surprises | Shows Amazon/Shopify connector status | Medium |
| Test data generator | Easier QA | Repeatable report cases | Medium |
| Report feedback widget | Beta learning | Captures quality issues | High |
| Error log/admin issue queue | Support | Debugs failed reports/payments | High |
| Payment reconciliation admin tool | Billing trust | Fixes rare provider/session issues | Medium |
| Role simulation | QA | Tests signed-in/signed-out/admin states | Medium |
| If reputation product: contact validator | Safe sending | Prevents wrong recipients | Critical |
| If reputation product: template preview/test send | Trust | Blocks broken messages | Critical |
| If reputation product: consent checker | Compliance | Blocks non-consented channels | Critical |

## 19. Documentation and Guide Audit

| Guide Area | Problem | Suggested Fix | Example Rewrite Needed? |
| --- | --- | --- | --- |
| Before You Start | No concise beta setup guide observed | Add "Who this beta is for" and prerequisites | Yes |
| Product Scope | GetReview vs ReviewGap naming can mislead | State it analyzes existing reviews; it does not send review requests | Yes |
| Required Inputs | Users may not know URL/export/paste options | Add examples for Amazon URL and Shopify CSV | Yes |
| Shopify Source Setup | Review app dropdown implies reliable live collection | Explain export/import-first and connector beta status | Yes |
| Credit Use | Users need trust around refunds | Explain 1 credit/report and refund behavior | Yes |
| Troubleshooting | Provider failures need guidance | Add no-review, invalid URL, failed export sections | Yes |
| Compliance | Good start, but not role-specific | Add beta-user checklist to report form/docs | Yes |
| Payment | PayPal/Stripe setup not user-facing | Add billing FAQ | Yes |

Guide sections to add:

- Before You Start
- What ReviewGap Does / Does Not Do
- Required Inputs
- Amazon Report Setup
- Shopify Export Import Guide
- How Credits Work
- Preview and Preflight
- Generate Your First Report
- Read the Report
- Export PDF/CSV/JSON
- Troubleshooting
- Compliance Basics
- FAQ

## 20. Competitive / Benchmark Process Comparison

| Benchmark Product | What Their Process Does Better | What GetReview Can Learn | Applicability |
| --- | --- | --- | --- |
| Birdeye | Full review request campaigns, inbox, listings, SMS/email | If building reputation product, needs contact/consent/send/tracking | High only for reputation direction |
| Podium | Simple SMS-first review requests and conversation history | Trust comes from clear sender identity and delivery tracking | High only for reputation direction |
| NiceJob | Guided setup and campaign automation | Strong onboarding/checklists matter | Medium |
| Trustpilot | Verified invitation flow and template compliance | Review requests need strict identity and platform policy controls | Medium |
| Yotpo | Review collection and display for ecommerce | Shopify review collection is a separate product category from intelligence reports | Medium |
| Reviews.io | Multi-channel review invites and widgets | Templates, widgets, and moderation are large scope | Medium |
| GatherUp / Grade.us | Location/review link setup and request tracking | Local-business review generation requires link validation and reporting | High if Google reviews are target |
| Typeform/Tally | Simple feedback forms | Private feedback can start as lightweight form before full reputation platform | Medium |
| Zapier/Make flows | Triggered post-purchase/service requests | Integrations can be deferred through webhooks | Medium |

## 21. Compliance and Platform Policy Risk Check

| Risk Area | Why It Matters | Current Evidence | Suggested Safeguard | Severity |
| --- | --- | --- | --- | --- |
| Review gating | Routing only happy customers to public reviews can violate platform expectations | Not implemented; prompt asks for positive/negative routing | Avoid manipulative gating; legal/platform review | Critical if built |
| Incentivized reviews | Incentives can violate platform rules | Not implemented | Prohibit incentives unless legally/platform-approved | High |
| Misleading copy | Users may think app collects Google reviews | Product naming and attached prompt create ambiguity | Make scope explicit everywhere | Critical |
| SMS/WhatsApp consent | Regulated channels | Not implemented | Consent capture, opt-out, provider compliance | Critical if built |
| Email unsubscribe | Required for many campaigns | Not implemented for review requests | Unsubscribe/suppression before sends | Critical if built |
| Data privacy | Reports may include review text; campaigns would include PII | Compliance page covers analysis data | Add data retention/export/delete policy | High |
| Contact import permissions | Imported customer lists carry consent risk | Not implemented | Import attestation and consent fields | Critical if built |
| Public platform terms | Amazon/Shopify/Google access limits | Compliance page warns against evasion | Keep approved source/import-first design | High |
| Review completion claims | Google completion not reliably verifiable | Not implemented | Track clicks/manual confirmations only | High if built |
| AI output trust | Reports can be overread | Evidence-bound prompts and warnings exist | Add confidence and human-review prompts | Medium |

This is not legal advice. Have counsel review the Terms, Privacy Policy, data source usage, messaging compliance, and any reputation-management routing before public launch.

## 22. Priority Fix Roadmap

| Timeframe | Fix / Improvement | Affected Step | Why It Matters | Success Criteria |
| --- | --- | --- | --- | --- |
| Immediate | Decide and state product scope | All | Prevents wrong testers and demos | Homepage/dashboard/docs say intelligence reports, not review requests. |
| Immediate | Add beta guide | Onboarding | Reduces support | Tester can self-serve first report. |
| Immediate | Add report preflight | Generate report | Avoids paid failures | Invalid/unavailable sources are caught before credit use. |
| Immediate | Make Shopify export/import-first | Shopify reports | Avoids Loox/connector overpromise | UI says live connectors are beta; export path is primary. |
| Immediate | Keep private beta gate active | Access | Avoids public exposure | Public URL requires beta auth. |
| Short-Term | Add password reset/email verification | Account | Reduces support/trust issues | Users can recover accounts. |
| Short-Term | Add report feedback capture | Beta | Improves product quality | Done: each report page can be rated/commented. |
| Short-Term | Move sources/jobs to advanced | Dashboard | Simplifies UX | First-run path is Generate Report. |
| Short-Term | Add payment/admin reconciliation view | Billing | Prevents support chaos | Admin can see provider order -> credits. |
| Medium-Term | Durable report job queue/status | Report generation | Handles slow providers/AI | Users see progress and can return later. |
| Medium-Term | Provider health and logs | Operations | Diagnoses failures | Admin dashboard shows provider errors. |
| Later | Build review-request module if desired | Reputation product | New product line | Contacts/templates/consent/preview/test/live send exist. |

## 23. Acceptance Criteria Before Demo or Launch

| Area | Acceptance Criteria |
| --- | --- |
| Website/app clarity | No page implies customer review request collection unless built. |
| Private beta access | Public URL is gated or clearly controlled. |
| Account setup | Signup/login/change password work; reset/verification planned before broad launch. |
| Report generation | Amazon and Shopify export/import happy paths pass with real tester data. |
| Review source validation | Unsafe/private URLs blocked; source availability checked before credit use where possible. |
| Credits | Debits/refunds visible and idempotent; payments attach to right account. |
| Shopify | At least one non-Loox source path is validated; export/import path remains clear. |
| Customer mobile review flow | Not applicable to current app. If promised, must be built and tested. |
| Consent/opt-out | Not applicable to current app unless messaging is built. |
| Error handling | No-review/provider/AI/payment failures produce clear user messages. |
| Reporting | PDF/CSV/JSON exports are readable and regression-tested. |
| Audit logs | Payment/report failures and admin actions are traceable enough for support. |
| Support/help | Beta testers have a short guide and issue-reporting path. |

## 24. Final Scores

| Category | Score | Explanation |
| --- | ---: | --- |
| Process Clarity Score | 7/10 | Clearer after beta-guide and advanced-source wording fixes; still needs real tester feedback. |
| Step Practicality Score | 7/10 | Generate report is now the obvious path; advanced setup remains optional. |
| Technical Feasibility Score | 7/10 | Current report app is feasible; live connectors are risky. |
| Builder/Admin UX Score | 6/10 | Admin tools are basic, but the current product does not need a campaign builder. |
| Business User UX Score | 7/10 | A beta user can follow the guide and generate a report; onboarding should be validated with testers. |
| Customer Review Flow Score | N/A | Not part of the competitor review-intelligence product. |
| Data Validation Score | 7/10 | URL/schema validation exists and basic preflight now blocks weak inputs before credit use. |
| Review Link Reliability Score | N/A | Google/public review destination links are not part of current product. |
| Consent/Compliance Readiness Score | 7/10 | Analysis compliance boundaries are documented; messaging consent is not applicable. |
| Error Handling Score | 7/10 | Refund/error handling is clearer after preflight and returned-credit messaging. |
| Documentation Score | 6/10 | Beta guide now exists; still needs screenshots and tester FAQ. |
| Demo Readiness Score | 7/10 | Ready for a tightly framed private beta report demo. |
| Launch Readiness Score | 4/10 | Not ready for public launch; important product/UX/support gaps remain. |
| Overall Process Readiness Score | 7/10 | Private beta viable for competitor review intelligence; public launch still needs account recovery and real beta evidence. |

## 25. Final Recommendation

Final Verdict: Keep GetReviewGap in private beta as an Amazon-first competitor review-intelligence tool, with Shopify supported through authorized exports/imports and selected live connector tests.

Should GetReview be shown to builders/admins now?: Yes, for current report workflow administration and beta QA.

Should GetReview be shown to business users now?: Yes, to 3-5 Amazon sellers who understand it is a beta report tool. Avoid Shopify-heavy users unless they can provide exports or are explicitly testing connector limitations.

Should GetReview be used with real customers now?: Yes, as a private beta reporting tool for selected seller/tester accounts. It should not be used or described as customer review-request software.

What must be fixed first?: Password reset/email verification, deeper source-quality scoring, and real seller report-quality validation.

What should be tested first?: Amazon report generation with 3-5 real seller products, Shopify export/import report generation, PDF exports, payment-credit attachment, and no-review/provider failure recovery.

What should be removed or simplified?: Hide or demote sources/jobs for first-time beta users; remove schedule wording until scheduling is real.

What should be added immediately?: Account recovery, deeper source-quality scoring, and a beta feedback review dashboard.

Biggest risk if presented too early: Users over-trust weak-source reports or hit provider failures before the app clearly explains source coverage limits.

Best next step: Run a controlled private beta with 3-5 Amazon sellers using the current gated production site, while tracking every failed report, confusing step, and support question in a single QA issue log.
