---
uid: report-2fd5cbf5
id: REPORT-11419
type: report
title: 'Reconciliation Review: commits (BUNDLE-40)'
created_by: xgd
created_at: '2026-11-08T11:48:06.458595+00:00'
updated_at: '2026-11-08T11:48:06.458595+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-c0301347
  anchor_uid: bundle-c0301347
  overrides_audited: 2
  trust_boundary_overrides: 0
  failing_items:
  - 5
  coverage_gaps:
  - ac: AC-1492
    ac_uid: acceptance_criterion-535253fa
    owning_story: story-e07c589b (STORY-128)
    authored_by: request-13a5e206 (REQ-162)
    superseded_by_uid: request-68718201 (REQ-208)
    issue: superseded wholesale with no replacement AC; the shared rights/provenance
      block and origin=generated are unpinned; UAT at tests/reconciliation-material-types.workers.test.ts:273
      orphaned and ORIGINS at :42 omits generated
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: 
**Anchor**: bundle-c0301347
**Stories Reviewed**: 7 (story-7d255580, story-58b2cec4, story-a58a0974, story-3cf3d57b, story-4cabde9a, story-39c992d3, story-d2bee21c)

This pass re-checks the gap list from the previous review (report-9179b6e2) against the fix commit 4b7b335202. That commit changed only tests; no production code changed after the previous review. It also re-runs the supersession, evidence and override checks.

## Behavior Inventory

About 47 behaviours across six features: the mail text part and sender; the looking surface on the Worker and its budget; priming as configuration; the image describer session; image generation; and drawing geometry. The two behaviours added since the last pass are the measurement caps (AC-2411) and the shared browser source (AC-2410).

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Derived text part, href invariant, refusal of a non-derivable body | Covered | story-7d255580 | AC-2369, AC-2370, AC-2281 |
| 2 | Per-template from with MAIL_FROM fallback and display name; resolved once; read-only modal; POSTed from ignored; not token-substituted | Covered | story-7d255580 | Gaps 1a and 1b closed: a tokened `from` is sent and recorded raw, and the provider payload is asserted |
| 3 | Per-business looking surface, preview renderer, own origin, adoption | Covered | story-58b2cec4 | AC-2372: a live capture_site Worker turn, plus the not-written-up fallback |
| 4 | No browser: session opens without eyes. No BLOBS: no chat at all | Covered, divergence flagged | story-58b2cec4 | AC-2024 narrowed. The Reconciliation Decision states the divergence from REQ-206 and names the follow-up. The UAT asserts the real refusal with no seam replaced |
| 5 | 40-look budget at the lease | Covered | story-58b2cec4 | AC-2373: the declaration names no ceiling, and the Node host makes 41 looks |
| 6 | Screenshot reaches the model as an image block through the Toolbox on both hosts | Covered | story-58b2cec4 | AC-2031: no base64 in text, audit, validation, a non-picture result stays text, and a Worker twin |
| 7 | priming.json as the source, PrimingConfigError at start-up | Covered | story-a58a0974 | AC-2374: an unregistered provider is tested through openSession, and placeholder-as-written is tested. Source inspection is demoted to a supplementary guard, with a structural decision recorded |
| 8 | Single trailing cache boundary, entry drop, 60k budget, empty product tier | Covered | story-a58a0974, story-3cf3d57b | AC-2375's untestable clause moved to Decisions; AC-2376 |
| 9 | Priming names no document by id or title; retitling breaks nothing | Covered | story-3cf3d57b | AC-2377 extended with a retitle test. The STORY-149 UATs ran in the 244-test scoped pass (report-19566abb, 0 skipped) |
| 10 | Tool-less describer session per item, closed afterwards; distinct registration | Covered | story-4cabde9a | AC-2097: open-junction count read during and after success and failure; JPEG media_type exact; description_model equals the requested model. AC-2378 |
| 11 | create_image, optional key, deploy hook, aiConfigured untouched | Covered | story-39c992d3 | AC-2379, AC-2381, AC-2382, AC-2392 |
| 12 | The model never learns the vendor | Covered on tool channels, divergence flagged | story-39c992d3 | AC-2380 covers success, refusal, shape and budget. The material-body leak is recorded as a divergence and tracked as BUG-381 |
| 13 | Material complete from its first visible moment; scoped store; origin=generated; cap of 10 | Covered | story-39c992d3 | AC-2383 tested before attach; AC-2390; AC-2384; AC-2386 |
| 14 | Do not regenerate what the client has; present the result as a draft | Decision recorded | story-39c992d3 | Left to model judgement, since nothing in the product instructs it; recorded as a Decision |
| 15 | Anchor vocabulary, measure, relate, solve, assert, browserless refusal, authoring rules | Covered | story-d2bee21c | AC-2393 and AC-2403 narrowed with Decisions and tested through the operations. Real-browser scale, rotate and list-x cases. Production measurer on the draft page. AC-2407 read from the client's tool list |
| 16 | Measurement caps (200 nodes / 120 glyphs) and unreadable-box omission | Covered | story-d2bee21c | AC-2411 new; AC-2398 narrowed |
| 17 | Measurer shares the fidelity browser source | Covered | story-d2bee21c | AC-2410 new |
| 18 | Shared material/reference rights and provenance block, with `origin` now including `generated` (tickets.ts:87-92, one MATERIAL_FIELDS for both kinds) | **Uncovered** | — | AC-1492 was superseded wholesale and nothing replaces it. See the gap below |

## Ungrounded Stories

None found.

## Supersession (Step 4c)

AC-2337 (story-7b1025b8) is `superseded` by bundle-c0301347 and replaced by AC-2409. That pair is clean.

AC-1492 (acceptance_criterion-535253fa, owned by STORY-128 story-e07c589b, authored by REQ-162 request-13a5e206) is now `status: superseded` with `superseded_by_uid: request-68718201` (REQ-208). Step 4c is therefore satisfied as written. The supersession is over-broad, though, and that creates a coverage gap rather than closing one:

- REQ-208 retracts exactly one clause of AC-1492: "where it came from — one of: uploaded, captured, fetched, or taken from a site". `generated` is added to that list.
- REQ-208 does not retract the rest. That includes the same six-part rights and provenance block on both material and reference, with the same names and values and an unchanged read-back. It also includes the "what it is for" field accepted on both kinds.
- No replacement AC exists. A search of the whole ticket store for an AC under story-e07c589b or one naming AC-1492 finds only the superseded ticket. STORY-128's remaining ACs (AC-1493, AC-1494, AC-1495, AC-1736 and the others) cover refusal, stated booleans, source_url and narrowing. None of them claims the shared form across the two kinds or the origin vocabulary.
- The UAT `test_UAT_AC1492_material_and_reference_carry_the_same_six_part_rights_and_provenance_statement` (tests/reconciliation-material-types.workers.test.ts:273) now targets a superseded AC. It still pins `ORIGINS = ['uploaded', 'captured', 'fetched', 'site']` at line 42, without `generated`.
- So the matrix states nowhere that a `reference` accepts `origin: generated`, or that the two kinds share one block. The code does both, because tickets.ts uses one MATERIAL_FIELDS for both kinds.
- The previous review asked for this replacement AC explicitly: "A replacement AC including `generated` can sit under story-39c992d3." It was not created.

## Evidence Sufficiency (Step 5b)

All gaps 1–6 from report-9179b6e2 are closed by new or extended UATs or by recorded Decisions. Spot-checks on the diff of commit 4b7b335202:

- **Mail (1a, 1b):** a tokened `from` is sent and recorded verbatim while the body's token is filled. The forged-from route asserts the Resend payload.
- **Looking surface (2a–2d):** four new UATs. The no-BLOBS UAT asserts the real 500 with no seam replaced.
- **Priming (3a, 3b, 3d):** new tests. 3c and 3e are resolved as structural decisions, and the grep stays only as a supplementary guard.
- **Describer (4a–4c):** the `createSession` wrapper passes every call through to the original, so it observes rather than mocks. It reads the real junction store, both during the call (so the check is not vacuous) and after it.
- **Image generation (5c, 5d):** new assertions on tool results and on the pre-attach Library.
- **Drawing geometry (6a–6g):** new tests, including real-Chromium cases. report-19566abb shows 244 passed, 0 failed, 0 skipped, so the browser-backed cases executed.

Residual minor hardening, not a cause of this FAIL: AC-2380's vendor list is a fixed set of case variants rather than a case-insensitive match, and the refusal double does not echo the vendor.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Outgoing Mail (upgrade) | story-7d255580 | ✓ |
| 2. Looking surface (upgrade) | story-58b2cec4 | ✓ |
| 3. Session priming (upgrade) | story-a58a0974, story-3cf3d57b | ✓ |
| 4. Material description (upgrade) | story-4cabde9a | ✓ |
| 5. Generated pictures (feature) | story-39c992d3 | ✓ |
| 6. Drawing geometry (feature) | story-d2bee21c | ✓ (AC-2410 and AC-2411 added) |

## Mode Override Audit

2 overrides audited, 0 touched a trust boundary.

- **report-483291fe** (code_frozen, imagegen.ts, rung 1): pass.
  - Only the named file was touched.
  - `vendorless(surface, …)` is present at imagegen.ts:404, composed in imageSurface() as instructed.
  - Conformance passed, with no trust-boundary match.
  - The 244-test scoped run is green.
- **report-7519d965** (code_frozen, ai.ts, rung 2): pass.
  - `lib.ClaudeAPIBackend.capabilities` is present at ai.ts:195.
  - The out-of-scope REQ-146 UAT edit is reverted: `git diff main...HEAD` on that file is empty.
  - The only test-support change left is the 9-line `systemText` helper, which an in-scope REQ-207 UAT imports.
  - The net production diff is ai.ts only, as AC-2097 and AC-2378 demand.

## Judgment Calls

- **AC-2024, AC-2380, AC-2393 and AC-2403** were narrowed to the code. Each carries a Reconciliation Decision that states the divergence from intent and names a follow-up (BUG-381 for the vendor leak). These are flagged divergences, not silent absorption, so they are accepted under frozen code.
- **AC-2403** (a recorded comment with a misspelt anchor is dropped) is accepted. REQ-209's "nothing disappears" is written about assertions, and `assert` does report such entries. The Decision records the asymmetry.
- **REQ-208's "do not regenerate what the client has; present it as a draft"** is accepted as a Decision. No instruction exists for an AC to assert.
- **Fakes at external boundaries are accepted:** the scripted model client, Resend fetch, OpenAI HTTP, the browser launch seam and the wrangler stub.
- **AC-1492 is flagged as material.** STORY-128's description says the shared rights and provenance block "is the substance of the story". This reconciliation retired its only AC and replaced none of the clauses REQ-208 did not touch. The code change in this bundle (adding `generated` to the shared enum) is therefore unpinned for the `reference` kind.

## Gap list (for fix_reconciliation_review)

1. **AC-1492 replacement (story-39c992d3 or STORY-128 story-e07c589b).** Create a new active AC that restates AC-1492's criterion in full, with "where it came from" extended to: uploaded, captured, fetched, taken from a site, or **generated**. Open its body with "Replaces AC-1492, whose origin vocabulary REQ-208 extended. Every other clause carries over unchanged." This is the same pattern as AC-2409/AC-2337. Then:
   - Retarget `test_UAT_AC1492_material_and_reference_carry_the_same_six_part_rights_and_provenance_statement` (tests/reconciliation-material-types.workers.test.ts:273) to the new AC's number.
   - Add `'generated'` to `ORIGINS` at line 42, so both material and reference are shown to accept and read back `origin: generated`.
   - No production change is needed: tickets.ts:89 already accepts it on both kinds.
2. (Optional hardening) AC-2380: match vendor names case-insensitively (tests/reconciliation-consultant-image-generation.workers.test.ts:321), and add a refusal double whose detail echoes the vendor, so `vendorless()` is exercised beyond the shape path.

## Verdict

FAIL. One coverage gap remains. The over-broad supersession of AC-1492 leaves the shared material/reference rights and provenance block, and REQ-208's extension of its origin vocabulary to `generated`, with no active AC. Its UAT is orphaned and pins the pre-REQ-208 vocabulary. Every other gap from the previous review is closed, all six plan items produced stories, and both overrides pass the audit.
