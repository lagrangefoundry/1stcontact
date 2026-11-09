---
uid: report-c94a8a38
id: REPORT-11644
type: report
title: 'Reconciliation Review: commits (BUNDLE-42)'
created_by: xgd
created_at: '2026-11-09T01:21:47.180024+00:00'
updated_at: '2026-11-09T01:21:47.180024+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-7ba3af93
  anchor_uid: bundle-7ba3af93
  overrides_audited: 2
  trust_boundary_overrides: 0
  gap_count: 9
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (none - commits mode)
**Anchor**: bundle-7ba3af93
**Stories Reviewed**: 9 (story-5281f009, story-179b8c06, story-58b2cec4, story-47fb84e6, story-e214a00d, story-e674c60a, story-f2e5032c, story-219b4217, story-d34eccd8)

Intent source: bundle body (BUG-73, BUG-75, REQ-216, REQ-215, REQ-223, REQ-218 incl. the EPIC-1 answers of 2026-09-10 and 2026-09-11). The bundle has no comments. Quality evidence: REPORT-11643 (report-919e9072) passed 268/268 at af9d3b0e. Both override commits (9329cc9f7a, 19535fdd79) are ancestors of that commit.

## Behavior Inventory

About 75 behaviours were identified across 6 features: the embedder transport resolver; capabilities.js composition; driving the draft before the shot; stored image as a sixth picture kind; L1 dialog apparatus and page state; builder carry and panel selector; the public lead endpoint; and the complained status plus the public-site 405 doorway.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Embedder: REST/binding/half-pair/single resolver/no-wrangler vars (B1-B5, B1a) | Covered | story-5281f009 | AC-2468..2471, 2475; sufficient |
| 2 | EmbeddingFailedError transport+KB+advice (B6, B6a) | Covered, evidence partial | story-5281f009 | GAP 9 |
| 3 | No-embedder degradation (B7) | Covered | story-5281f009 | AC-2474, AC-1664 |
| 4 | capabilities.js block-scoped, export stripped, markers, parses as module | Covered | story-179b8c06 | AC-702, AC-2476 import the real bundle; sufficient |
| 5 | `after` grammar, ordering, refusals, draft-only, value gates driven | Covered | story-58b2cec4 | AC-2477..2482; overrides landed (interact.ts:197-204, 280-283) |
| 6 | Edit-channel caption; compare caveat on either side | Covered, evidence partial | story-58b2cec4 | GAP 7 (AC-2482 only edit-on-side-a) |
| 7 | Stored image kind: naming, ambiguity, PNG passthrough, inline raster, original, ENVIRONMENT, CLI holds-no-Library, gif/avif | Covered | story-58b2cec4 | AC-2026..2028, 2483..2489 |
| 8 | Drawing caption / draft-preview font context (EPIC-1 2026-09-11) | Absorbed divergence | story-58b2cec4 | GAP 4 |
| 9 | compare accepts `image` on either side | Uncovered by evidence | story-47fb84e6 | GAP 3 (AC-2490 pending, no UAT) |
| 10 | Edit render keeps shell/role/id/stylesheet, no script; page-state read/apply; draft driven via opener/Close/scrim | Covered | story-e214a00d | AC-2436 amended, AC-2491..2495; sufficient |
| 11 | Carry path/scroll/panel; re-apply on save; drop on site switch/link-out; Edit-only panel selector | Covered, evidence partial | story-e674c60a | GAP 8 |
| 12 | POST /api/lead: tenant from URL, ack frozen, no-JS HTML, addContact, provenance, honeypot, Turnstile fail-closed, rate limit, asset at most once, checkbox | Covered | story-f2e5032c | AC-2500..2516 mostly sufficient |
| 13 | Body limits refused before reading | Absorbed divergence / ungrounded claim | story-f2e5032c | GAP 2 |
| 14 | Internal seam is a WorkerEntrypoint not reachable by URL | Covered, evidence insufficient | story-f2e5032c | GAP 5 |
| 15 | Bounce/complaint suppression scope | Partial (unflagged narrowing) | story-f2e5032c | GAP 6 |
| 16 | multipart/form-data accepted but parsed as urlencoded | Uncovered | - | part of GAP 6 |
| 17 | complained status, webhook mapping, schema enum from MESSAGE_STATUSES | Covered | story-219b4217 | AC-2287, 2293, 2299 sufficient (real signed webhook) |
| 18 | public-site read-only except POST /api/lead | Covered in story, evidence insufficient | story-d34eccd8 | GAP 1 |

## Gaps (for fix_reconciliation_review)

1. **AC-912 (STORY-95, story-d34eccd8): its UAT was never updated for the REQ-223 doorway (Step 5b).** `tests/reconciliation-published-site-serving.test.ts:542-576` probes only `/site/<SLUG>/` with POST/PUT/PATCH/DELETE/OPTIONS. It never touches `/api/lead` or `/site/<key>/api/lead`, sends no POST to a near-miss path (`/api/leads`, `/api/lead/x`) and no non-POST to the lead path, and has no no-apex case. A server that refused the lead POST, or admitted POST under every `/api/` path, would still pass. Remediation: extend `test_UAT_AC912_` so that:
   - PUT, PATCH, DELETE and OPTIONS to a page path, the site root, `/api/lead` and `/site/<key>/api/lead` each get 405 with `allow: GET, HEAD`.
   - POST to a page path, the root, `/api/leads` and `/api/lead/x` each get 405.
   - POST to `/api/lead` (apex configured) and to `/site/<key>/api/lead` does not get 405.
   - Apex `POST /api/lead` with an empty `APEX_SITE_KEY` gets 405.

2. **AC-2509 (story-f2e5032c): absorbed divergence on body limits.** REQ-223 section 6 says a large body "must be rejected rather than read". The story's Reconciliation Decision says a chunked body is refused "after a bounded read". The code does not do that: `apps/public-site/src/lead.ts:257-265` calls `request.arrayBuffer()`, which reads the whole body, and checks `MAX_BODY_BYTES` only afterwards. The comment at :243-245 wrongly claims the read is bounded. The UAT case at about test:771-789 asserts only 413, so it cannot tell a bounded read from an unbounded one. Remediation: correct the story's decision text and flag the code issue (under the resolution ladder the code is wrong). Then either obtain a code_frozen override to read the stream with a running byte cap that cancels past 8 KiB, with a UAT using a never-ending stream that asserts cancellation near the cap; or record the narrowed behaviour explicitly as a divergence.

3. **AC-2490 (STORY-158, story-47fb84e6): no UAT.** The AC is `pending`, and `git grep test_UAT_AC2490_ -- tests` finds nothing, so its REPORT-11643 "pass" selected nothing. `story-47fb84e6.md:41` cites stored-image UATs for the image-side comparison that do not exist, and the Reconciliation Decision at :47 (a stored image is compared at its own size) has no evidence. Remediation: write the UAT AC-2490's Verification describes. Compare a stored non-PNG image against a captured reference, then the same with sides swapped, through the real Toolbox. Assert both side labels and that the size is the common top-left rectangle; a PNG compared with itself must give zero mean difference. Then activate the AC.

4. **STORY-157 (story-58b2cec4): drawing-caption divergence absorbed, and stale story text.** EPIC-1's 2026-09-11 answer on REQ-218 says that photographing drawings in the site's draft preview is "wanted, not merely open". It also says that until then the caption is load-bearing and must say the drawing may not be in the site's typeface, "so letter widths and line breaks are not evidence". The code always rasterises in a bare `data:` document (`tools/generate/src/cli/capture/screenshot.ts:190-225`). The caption (`picture.ts:329-332`, `fidelity-surface.json:200`) does not carry the letter-widths/line-breaks warning. The story's decision (about :123) says the caption "already says what is wrong", and AC-2486 plus its test (`tests/reconciliation-assistant-sees-a-stored-picture.test.ts:557-559`) pin only the weaker caption. Remediation: flag this as a divergence in the story. Amend AC-2486 to require the letter-widths/line-breaks warning, and flag the one-line caption change as a code issue. Record draft-preview rasterisation as the epic's wanted refinement, stated as a divergence rather than as settled behaviour.
   Separately, correct stale text that no longer matches the code after the two overrides:
   - Story :56 still says fields match "by the `name` attribute and element `id`".
   - The two "Code issue flagged" sections (about :76-82) are still presented as open; mark them resolved.
   - Story :67 omits the CLI's "holds no Library" refusal.
   - AC-2487's body (acceptance_criterion-4b0b6386.md:28) still says the CLI does not yet say it holds no Library.

5. **AC-2513 (story-f2e5032c): the internal seam is never executed (Step 5b).** In every endpoint UAT, `LEAD_INTAKE` is a plain object calling `captureLead` directly (test:129-131). The shipped `LeadIntake` WorkerEntrypoint (`apps/control-app/src/worker.ts:67-69`) is only checked with `toBeInstanceOf`/`typeof`, so a broken wrapper (wrong `this.env`, default mailer) would pass. The binding in both environments is shown only by reading the wrangler.toml text (test:1003-1015). The "no URL reaches it" half is adequately probed at runtime (test:1059-1084). Remediation: drive the real `LeadIntake` through a miniflare service binding or auxiliary worker, or at minimum call `new LeadIntake(ctx, env).captureLead(...)` and observe the D1 row.

6. **story-f2e5032c: other REQ-223 problems.**
   - (a) **AC-2510, internal stub.** The "write throws" case replaces `LEAD_INTAKE.captureLead` with a throwing stub (test:866-873), which mocks the repository's control-app entrypoint. Use the real `captureLead` with a failing D1 binding instead.
   - (b) **AC-2512, scope narrowed without being flagged.** Suppression checks only the same tenant's contact (`apps/control-app/src/lead.ts:293-306`). Section 5 says an address that bounced or complained is "never mailed again by this endpoint", and the sending domain is shared across the platform. Record a Reconciliation Decision (per-tenant scope, with its deliverability cost), or flag it as a code issue.
   - (c) **multipart accepted but misparsed.** `multipart/form-data` is accepted as the form shape (`apps/public-site/src/lead.ts:216`) but parsed with `URLSearchParams` (:281), so a real multipart submission loses its Turnstile token and gets 400. This is undocumented: flag it as a code issue, or record it in the story.
   - (d) **AC-2511, CRLF in the email.** Add a case with CRLF or whitespace inside the email field, the one visitor-typed value that reaches the To header, and assert it is refused and nothing is sent.
   - (e) Record the per-site rate-cap tension (20 per 60 s per site and IP, `apps/public-site/wrangler.toml:89-92`) in Technical Context, as section 6 asks.

7. **AC-2479 / AC-2482 (story-58b2cec4): evidence does not separate correct from broken code.**
   - AC-2479 exercises fill-by-label only. Fill by `aria-label`, `aria-labelledby` or `placeholder` is never tried, so removing any of those name sources still passes. Add one positive case per source the AC names.
   - AC-2482 tests only `compare(a: edit, b: draft)`, so code that checks only side `a` passes. Add `a: draft, b: edit`.

8. **AC-2499 (STORY-99, story-e674c60a): naming order not asserted.** In `tests/test_reconciliation_builder_page_carry.test.ts:367-426`, `HEADING_PANEL` puts its `<h2>` first, so dropping the heading rule still passes. The id-as-last-resort claim is never exercised. Remediation:
   - Add a panel whose `<p>` comes before its `<h2>` and assert the heading text is the label.
   - Add a panel with no text and assert its label is its id.
   AC-2497 (minor): drive the real post-save path (`onSaved` reloading the frame, `app.js:630`) rather than re-delivering the page.

9. **AC-2472 (STORY-138, story-5281f009): system-KB attribution and reload advice not proven.** The real failure path is driven only for the project KB (`...embedder-transport.workers.test.ts:486-525`). The system-KB label is checked only on a hand-built error (:528). The binding advice is matched against the code's own `BINDING_ADVICE` constant plus a few words (:502-505); the "a worker reload refreshes it" clause that B6 requires is never asserted. Remediation: drive a failing binding through `systemKnowledge` and assert `kb === SYSTEM_KB`; assert that the message tells the operator to reload the worker.

Minor, non-blocking:
- AC-2435 still says the overlay marker is one "only the dialog script sets"; REQ-215 acceptance 4 says "a script or the builder".
- `looking-surface.test.ts:536` is still named `all_five_kinds`.
- AC-2471's `\benv\.AI\b` scan misses `const { AI } = env`.
- STORY-85 has two "Reconciliation Decisions" headings.

## Supersession Check (Step 4c)

PASS.
- REQ-215 supersedes REQ-212 section 5.7 / acceptance 12. AC-2436 was amended rather than superseded, which is correct because its no-script and no-acting-attribute halves still hold. Its UATs and the REQ-212 FC test were rewritten. No active sibling AC still pins "no shell, no role".
- STORY-95 AC-913 is already superseded. No active AC pins five picture kinds, matching by id/name, or delivered/bounced-only webhook handling.
- AC-1029 and AC-1036 now state that the toggle keeps the page.

## Ungrounded Stories

| Story | Claim | Issue |
|-------|-------|-------|
| story-f2e5032c | Chunked body refused "after a bounded read" | Code reads the whole body (`lead.ts:259`); see GAP 2 |
| story-47fb84e6 | Cites REQ-218 stored-image UATs for image-side compare | No such UAT exists; see GAP 3 |
| story-58b2cec4 | Fields match by `name` attribute and `id` | Removed by the override; see GAP 4 |

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. KB embedder transport (BUG-73) | story-5281f009 | Yes |
| 2. capabilities.js (BUG-75) | story-179b8c06 | Yes |
| 3. Drive the draft (REQ-216) | story-58b2cec4 | Yes |
| 4. Stored image kind (REQ-218) | story-58b2cec4, story-47fb84e6 | Yes (story-47fb84e6 AC-2490 lacks evidence, GAP 3) |
| 5. L1 modal state (REQ-215) | story-e214a00d | Yes |
| 6. Builder carry (REQ-215) | story-e674c60a | Yes |
| 7. Public lead capture (REQ-223) | story-f2e5032c (new) | Yes |
| 8. Message status + serving exception (REQ-223) | story-219b4217, story-d34eccd8 | Yes (AC-912 evidence, GAP 1) |

Every plan item produced a story; none was dropped.

## Mode Override Audit

2 overrides audited, 0 touched a trust boundary.
- **report-15fed5d0** (code_frozen; picture.ts, image-library.ts; AC-2487). Grounded in REQ-218's "Each says which" and the accepted CLI departure ("says plainly that it holds no Library"). files_touched equals the named files, conformance passes, and there is no trust-boundary component. Verified landed: `picture.ts:162` and `:364-368`, `image-library.ts:158`. The AC-2487 UAT drives the real CLI host. Judged correctly.
- **report-b31905da** (code_frozen; interact.ts; AC-2479). Grounded in REQ-216's "There is no way to name a selector, an id or an attribute" and "matches the option's label first and its value second". Only the named file was touched, conformance passes, and there is no trust-boundary component. Verified landed: `interact.ts:197-204` and `:280-283`. The AC-2479 UAT fails on both regressions. Judged correctly.
- Limitation: OVERRIDE-AUDIT.md lies outside the session's readable paths and could not be loaded. Both overrides were judged on its five dimensions as summarised in the prompt (grounding, scope, files touched, trust boundary, conformance). No override_misjudged.

## Judgment Calls

- GAPS 1, 3 and 5 are Step 5b hard failures: an active AC with no UAT, or with one that cannot tell the AC's behaviour from its absence.
- GAPS 2 and 4 are absorbed divergences. The story documents behaviour that contradicts intent, and in GAP 2 the claim does not match the code either.
- GAP 6(a) is an internal mock and is not allowed in a UAT.
- GAPS 7, 8 and 9 are narrower. In each, a specific AC claim would survive its own removal, which is a Step 5b failure under the deterministic rule, so they are listed for the fix loop rather than waived.
- AC-2471 and AC-2475 use static source/config checks. These are accepted because they are "nothing else does X" / "file does not name Y" invariants with no runtime scenario, and AC-2468 and AC-2470 back AC-2471 at runtime.
- Everything else checked is faithful: the BUG-73 B1-B7 scope, BUG-75's three changes, REQ-216's grammar and refusals, REQ-215 acceptance items 1-12, REQ-223 section 8 items 1-15 apart from the gaps above, and the complained status. Intent-silent points are recorded under Reconciliation Decisions.

## Verdict

FAIL: coverage and evidence gaps were found.
- One AC has no evidence: AC-2490.
- Two ACs have evidence that does not prove their claims: AC-912 and AC-2513.
- Two intent divergences were absorbed without being flagged: AC-2509's body limits and AC-2486's drawing caption.
- One UAT stubs internal code: AC-2510.
- Narrower assertion gaps remain in AC-2479, AC-2482, AC-2499 and AC-2472.

The fix loop should address GAPS 1-9 as listed.
