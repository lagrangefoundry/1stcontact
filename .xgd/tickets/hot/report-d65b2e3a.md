---
uid: report-d65b2e3a
id: REPORT-3761
type: report
title: 'Capability-Intent Alignment: Site Delivery: Deploy & Public Serving (level=uat)'
created_by: xgd
created_at: '2026-09-10T16:42:13.167221+00:00'
updated_at: '2026-09-10T16:42:13.167221+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a12e557f
  level: uat
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Delivery: Deploy & Public Serving
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 3
**Needs review**: 0

Anchor report: report-e37a6b4a. Previous attempts at this scope: 3.
Upstream levels this run: story = PASS (report-e994f603), ac = PASS with 2
warnings (report-e6d0145f). Per the level cascade, AC bodies are the working
reference below; intent was consulted only where an AC or a test named a
retired channel.

## Cumulative Intent Considered

Every story in this capability carries `intent_uid: bundle-e0143ffa` and
`updated_by: bundle-b3b7c399` (STORY-96 carries the originating bundle only).
The capability ticket itself carries no `intent_uid` field.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-13 (`bundle-e0143ffa`) — REQ-108, REQ-109, REQ-110, REQ-111, REQ-113, BUG-30 | free_and_reconciled | created 2026-08-06, merged at `1ee6aaf2` | Originating intent for all three stories. REQ-110 shipped the operator-side content-addressed `1c deploy`; REQ-111 the `public-site` Worker serving draft previews and published sites; REQ-113 the extensionless→`.html` mapping and the preview/production agreement; REQ-109 the document-relative (relocatable) asset emission the trailing-slash rules depend on | YES |
| BUNDLE-20 (`bundle-b3b7c399`) — REQ-143, REQ-145, REQ-146, REQ-147, REQ-148, REQ-149, REQ-150, REQ-151, REQ-152, REQ-153 | free_and_reconciled | created 2026-08-24, merged at `eef7a8b4` | REQ-143 moved the store to D1+R2; REQ-149 (2026-08-17 design) moved publishing into the platform and **retired** the `1c deploy` command (D6), the per-site deploy index (D5) and the sha-addressed shareable draft-preview channel (D7). Stories and ACs were reconciled against this on 2026-08-31 | YES (retiring) |

Cumulative picture: one publish implementation reachable from two front doors,
revision-numbered addressing only, **one** public addressing form, and no draft
snapshot channel. Nothing in the ledger is `abandoned`/`deprecated`/`draft`, so
no intent in this capability's history is excluded.

## Alignment Ledger

Every active AC in the capability (28) has exactly one UAT, named to the
convention, and every one drives a real entry point — the `1c` CLI through
`run(argv)`, the builder's or `public-site`'s own `fetch`, or a real loopback
HTTP server — over bytes a real publish produced. No UAT is a structural/AST
substitute for behaviour.

| Element | Test | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1418 | `test_UAT_AC1418_…both_front_doors` (`tests/reconciliation-publish-revision-cloud.workers.test.ts:140`) | BUNDLE-20 (REQ-149 D6) | aligned — real publish in workerd over real D1/R2, both front doors compared key-for-key; the two `?raw` source assertions are prescribed by the AC's own verification ("confirm … no deploy command remains in the tool") |
| AC-1419 | `test_UAT_AC1419_…command_says_so` (`reconciliation-publish-revision.test.ts:116`) | BUNDLE-20 | aligned |
| AC-1420 | `test_UAT_AC1420_…before_any_write` (`:159`) | BUNDLE-20 | aligned |
| AC-1421 | `test_UAT_AC1421_…forward_only` (`:208`) | BUNDLE-20 | aligned |
| AC-1422 | `test_UAT_AC1422_…claimed_slug` (`…-cloud.workers.test.ts:230`) | BUNDLE-20 (REQ-143 tenancy, REQ-149) | aligned — refusal proved against a real PRIMARY KEY, not a double |
| AC-894 | `test_UAT_AC894_…current_draft` (`:272`) | BUNDLE-13, BUNDLE-20 | aligned |
| AC-892 | `test_UAT_AC892_…both_halves` (`:319`) | BUNDLE-13, BUNDLE-20 | aligned |
| AC-903 | `test_UAT_AC903_…live_revision_whole` (`reconciliation-published-site-serving.workers.test.ts:197`) | BUNDLE-13 (REQ-111), BUNDLE-20 | aligned; overlaps AC-1423's test (finding 1) |
| AC-905 | `test_UAT_AC905_…what_a_url_may_reach` (`reconciliation-published-site-serving.test.ts:213`) | BUNDLE-20 (REQ-149 D5) | aligned — ghost bytes, frozen-definition reach attempts and an absent-bytes record all asserted |
| AC-906 | `test_UAT_AC906_…four_causes` (`:285`) | BUNDLE-20 | aligned — whole responses byte-compared pairwise |
| AC-907 | `test_UAT_AC907_…without_a_read` (`:333`) | BUNDLE-13, BUNDLE-20 | aligned — instrumented store proves "rejects before it reads" |
| AC-908 | `test_UAT_AC908_…key_that_answered` (`:393`) | BUNDLE-13 | aligned — includes the mislabelled-metadata discriminator |
| AC-909 | `test_UAT_AC909_…indexable` (`:486`) | BUNDLE-20 (REQ-149 D7 — the crawler directive's channel was removed) | aligned |
| AC-911 | `test_UAT_AC911_…never_retained` (`:511`) | BUNDLE-20 | aligned |
| AC-912 | `test_UAT_AC912_…head_is_bodiless` (`:569`) | BUNDLE-13 | aligned |
| AC-913 | `test_UAT_AC913_the_apex_holds…` (`:141`) | BUNDLE-13 | aligned |
| AC-1423 | `test_UAT_AC1423_…never_beside_the_bytes` (`…serving.workers.test.ts:258`) | BUNDLE-20 (REQ-149 D5) | overlap: shares AC-903's republish/wind-back scenario (finding 1) |
| AC-1424 | `test_UAT_AC1424_…one_serving_path` (`:306`) | BUNDLE-20 (REQ-145) | aligned |
| AC-915 | `test_UAT_AC915_…as_html` (`reconciliation-clean-page-urls.test.ts:368`) | BUNDLE-13 (REQ-113) | aligned |
| AC-916 | `test_UAT_AC916_…on_both_forms_and_for_head` (`:387`) | BUNDLE-13 (REQ-113), BUNDLE-20 (REQ-149 D7) | aligned in substance; carries a vestigial second addressing form (finding 2) |
| AC-917 | `test_UAT_AC917_…in_both_environments` (`:417`) | BUNDLE-13 | aligned |
| AC-918 | `test_UAT_AC918_only_the_last_segment…` (`:464`) | BUNDLE-13 | aligned — real requests in both environments; the `parseRoute` assertions are additional, not the evidence |
| AC-919 | `test_UAT_AC919_…still_returns_not_found` (`:507`) | BUNDLE-13 | aligned |
| AC-920 | `test_UAT_AC920_…page_that_answered` (`:532`) | BUNDLE-13, BUNDLE-20 (REQ-149 D7) | aligned in substance; iterates the same URL twice (finding 3) |
| AC-921 | `test_UAT_AC921_…slash_free_one` (`:560`) | BUNDLE-13 (REQ-109) | aligned — both halves pinned: slash-free resolves, slashed misresolves to 404 |
| AC-922 | `test_UAT_AC922_…confinement_is_unchanged` (`:598`) | BUNDLE-13 | aligned — raw-socket traversal, so the attack shape survives client normalisation |
| AC-923 | `test_UAT_AC923_…never_reaches_the_mapping` (`:647`) | BUNDLE-13, BUNDLE-20 (REQ-149 D7) | aligned — and correctly re-states `draft/` as an ordinary segment post-D7 |

## Execution evidence for this ledger

The three Node suites were run in this session (`npm test -- <files>`):
**15 passed, 8 failed, and every one of the 8 failures is
`Error: listen EPERM: operation not permitted 0.0.0.0`** — this sandbox denies
binding a listening socket, so the six tests that start the real preview server
(`startServe`) and the two that start the real builder (`startBuilder`) time out
at 60s without reaching an assertion. No assertion failed anywhere.
`reconciliation-published-site-serving.test.ts` (9 tests, no socket) passed
whole. The two `.workers` suites were not executed here (workerd pool +
worktree). This is an environment limit, not an evidence defect, and it does not
change any finding below.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | exclusivity | `test_UAT_AC903` + `test_UAT_AC1423` (`tests/reconciliation-published-site-serving.workers.test.ts:197`, `:258`) | uat-edit | The two tests prove the same scenario in the same shape, in the same file: publish r1 → `republish()` to r2 → assert the unchanged URL serves r2 → `dropRevision(slug, 2)` → assert it serves r1 again → assert both revisions' bytes are still in R2. This is the uat-level face of REPORT-3760 finding 2 (AC-903 ¶2 and AC-1423 state the same criterion); the tests are faithful to their ACs, so the repair belongs at AC level first | Once AC-1423 is narrowed to its unique kernel (no per-site index object after a publish; a publish writes no key outside the new revision), drop the republish/wind-back half from `test_UAT_AC1423` and leave it to `test_UAT_AC903`. Do not remove it from both |
| 2 | warning | consistency | `test_UAT_AC916` (`tests/reconciliation-clean-page-urls.test.ts:387-415`) | uat-edit | The test still has the two-addressing-form shape REQ-149 D7 (BUNDLE-20, free_and_reconciled) retired. Line 391 requests `/site/acme/whitepapers` under the comment `// Snapshot-addressed preview.`; line 400 requests the **identical** URL under `// The published address resolves its prefix differently, so it earns its own assertion rather than an assumption` — the prefixes are byte-identical, so the second block asserts nothing the first did not. Line 405, `expect(\`/site/${SLUG}/whitepapers\`).not.toMatch(/\\/(draft\|rev)\\//)`, asserts a string literal about itself and touches no product code. The test name says `on_both_forms`. AC-916 states one form ("under the published site URL"), and the file's own header already records "ONE CHANNEL SINCE REQ-149" — the header was updated and the body was not. Substance is unaffected: the AC's behaviour (slug-only URL serves the page; HEAD matches status/type/length with an empty body) is fully proved | Delete the duplicate block and the tautological assertion at line 405; keep one GET plus the HEAD comparison; rename to `test_UAT_AC916_deployed_site_serves_the_slug_only_url_for_get_and_head` and drop `// Snapshot-addressed preview.` |
| 3 | warning | consistency | `test_UAT_AC920` (`tests/reconciliation-clean-page-urls.test.ts:541`) | uat-edit | Same vestige: `const forms = [\`/site/${SLUG}/whitepapers\`, \`/site/${SLUG}/whitepapers\`]` — the two "forms" are the same string, so the GET/HEAD loop runs each case twice against one address. AC-920 asks for "the deployed site's published addressing form" (singular) plus local preview, both of which the test does cover | Collapse `forms` to the single published URL and keep the `['GET','HEAD']` loop |
| 4 | info | coverage | STORY-95 — a top-level `draft/` page on a published site | — | REPORT-3760 finding 1 notes no AC pins this REQ-149 D7 consequence. At uat level this is not a coverage gap (there is no active AC to leave untested), and `test_UAT_AC923` already asserts the closest observable — `parseRoute('/site/acme/draft/not-hex/whitepapers')` resolves as an ordinary asset path rather than a rejected snapshot address. If the ac-level warning is actioned, the new AC's UAT should promote that to a full request over published bytes | none at this level |
| 5 | info | consistency | `test_UAT_AC1418` (`…publish-revision-cloud.workers.test.ts:217-227`) | — | The "exactly one publish implementation" half is proved by two source-text assertions (`builder.ts` must not contain `'/api/publish'`; `cli/index.ts` must not match `case 'deploy'`). Both are prescribed verbatim by AC-1418's Verification section, and the surrounding test is a real end-to-end publish, so this is not a structural-substitute UAT. Noted only because the first assertion is spelling-sensitive: `builder.ts:46` does still contain the substring `/api/publish` — in the docblock recording that the interception was deleted — so the assertion passes on quote style alone (backticks in the comment vs the single quotes it searches for). Verified the route really is gone: `builder.ts` has no handler for it | none; if AC-1418 is ever revised, prefer asserting the route table's own contents over its source text |

## Notes for the Editor

- **One cross-cutting pattern, one cause.** Findings 2 and 3 are the same
  residue in the same file: when REQ-149 D7 removed the sha-addressed draft
  channel, `tests/reconciliation-clean-page-urls.test.ts` had its docblock
  rewritten ("ONE CHANNEL SINCE REQ-149 … every case below addresses the
  published URL") but two case lists were collapsed to a single URL by
  duplication rather than by deletion. Both are dead weight, neither weakens the
  evidence, and both are one-line edits. `snapshotReads`/`seedPublished`/
  "Snapshot-addressed" naming elsewhere in that file is pre-D7 vocabulary for
  what is now a revision's rendered output; renaming is optional and was not
  raised as a finding.
- **Finding 1 is ordered.** Editing `test_UAT_AC1423` before AC-1423 is narrowed
  would leave a test that no longer covers its own AC text. Take REPORT-3760
  finding 2 first.
- **Do not read the 8 EPERM failures as a regression.** They are the sandbox
  refusing `listen(0.0.0.0)`; the same tests are what the capability's
  `uat_coverage: pass` was recorded against. Any fix loop that re-runs these
  files in this environment will see the identical 8 timeouts.
