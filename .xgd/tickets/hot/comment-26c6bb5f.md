---
uid: comment-26c6bb5f
id: COMMENT-1267
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T06:22:23.687747+00:00'
updated_at: '2026-08-20T06:22:23.687747+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b99892f3
  kind: note
---

Report created: **REPORT-2390** (`report-b99892f3`) — **FAIL**, 1 violation, 2 warnings, 0 needs_review. (The `Push failed` line is the sandbox having no network; the ticket committed locally.)

## What I found

Attempt 8's two fixes are **genuinely closed** — I verified `selectMultiViewportPayload` (`fidelity.ts:542`, wired at `index.ts:795`), the deleted `§`+`padding` predicate, AC-1288's re-stated body, and the new precedence test at source rather than trusting the fix report.

The one new violation came from the surface the previous report named as unaudited and skipped:

**AC-815 has no substantive UAT.** Both its tests are built with a local `itA` helper at `tests/bug27-nested-backdrop-capture.test.ts:80-85` whose body is `if (!capture) return`. A plain `it()` that returns early **reports PASS** — so on any Chromium-less runner AC-815 reads fully covered and green while asserting nothing. The repo states this rule in its own words three files away, at `bug24-scrim-alpha.test.ts:260-262`: *"a wrapper reports PASS on a runner with no Chromium … A skip is honest; a vacuous pass is not."* Attempt 7 fixed that wrapper in `bug24`; `bug27` is the sole survivor. AC-816 shares the wrapper but survives on four headless Part-B tests — AC-815 has nothing.

**Why nine attempts missed it** (warning W1, same file, same fix): `bug27`'s `beforeAll` binds a socket *before* checking `chromiumAvailable()`, so it hard-fails here (180s hook timeout + unhandled `EPERM listen`) instead of skipping. Attempt 8 excluded the file, recording that `bug27` "were not in this capability's AC set" — factually wrong; it carries AC-815/816/817, all on STORY-75. The one structurally unrunnable file held the one real hole, and prior cycles' two checks (name-index sweep + run the suite) both returned green precisely because it never ran.

## Verification I did run

- Re-derived the AC→test index with `grep -a`: all 63 non-deprecated ACs carry tests; AC-637 (deprecated) correctly carries none.
- Executed **all 21** files carrying this capability's ACs — including the one prior attempts excluded: 160 passed, 17 skipped, 0 assertion failures, one suite-level failure (`bug27`).
- Audited clause-by-clause the 26 older STORY-75/79 ACs the last report left unaudited. 25 of 26 are strong; several exceed their Verification (AC-1014's bytes-vs-timestamp oracle; AC-1013/1016's real-binary siblings). That predicted "clause inside a multi-clause criterion" risk came back essentially clean — the defect was a gating shape instead.

One thing worth flagging beyond the findings: `fields.uat_coverage` was stale on five ACs here but **correct** on AC-815 — it is unreliable in both directions, so it's worth a look and never a verdict.
