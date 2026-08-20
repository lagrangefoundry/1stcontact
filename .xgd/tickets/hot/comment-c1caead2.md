---
uid: comment-c1caead2
id: COMMENT-1281
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T08:40:20.475823+00:00'
updated_at: '2026-08-20T08:40:20.475823+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-05196cd1
  kind: note
---

Report created: **REPORT-2410** (`report-05196cd1`) — **FAIL**, 3 violations / 5 warnings / 0 needs_review.

## Scope
7 stories, **103 live ACs** (99 active, 3 pending; AC-718 now deprecated and out of scope). **Every live AC has at least one `test_UAT_AC<n>_*` test** — no coverage holes at the mapping level. Three (AC-683/688/727) are declared in the multi-line `it.runIf(...)(\n 'name',` form and are invisible to a single-line grep; a naive scan would file three phantom `uat-add`s.

## I ran the suite this cycle
All 21 CAP-70 test files, three runs: **111 passed, 3 failed, 2 skipped**. The 2 skips are honest `it.runIf` engine gates. The 3 failures (AC-703, AC-888, AC-1344) are `EPERM: listen` — this worktree denies socket binding. Those are environment, not findings, and I did not count them.

Execution paid for itself: it converted a four-cycle static claim into a demonstrated defect. With no chromium installed, `reconciliation-nowrap-width-floor.test.ts` reports `✓ 4 passed` while three of those four tests' browser arms never execute — they use `if (!HAVE_CHROMIUM) return`, not `it.runIf`.

## Violations
1. **AC-685 over-claims vs the emitter** (5th cycle). Eight closed-enum axes are still bare `${…}` interpolations in `render.ts`; `cssEnum` has 0 hits. New this pass: the AC's *own Verification paragraph* never asks for an enum payload either — so DOC-2 §2, the code, the Verification and the test all agree, and only the Criterion's prose is wider. I dropped the ac-edit/code-issue branch that stalled four cycles and made one recommendation: narrow the AC, don't touch the test.
2. **AC-1012's browser arm silently passes** and its round-trip-fidelity clause is exercised by no arm at all — the fixture is synthetic, with no capture to compare against.
3. **`test_UAT_AC718_*` is live against a deprecated AC** and duplicates `test_UAT_AC701_*`. The ac cycle landed the deprecation; the test didn't move. Not a plain delete — it holds the suite's only assertion of contact-form's closed config key set, which must be folded into AC-701's test first.

## Warnings
AC-1009/1011 same silent gate; AC-702's internal `vi.doMock` (still the only internal mock in 103 UATs); AC-930/AC-942 cross-capability duplication; AC-686/687 ¶2 attribution gap; and new — **AC-928's REQ-137 rewrite outran its test**: the entry-side step rejection and the on-disk store walk are proven only by FC-named tests in `test_UAT_FC_REQ-137_palette_shade.test.ts`, which already match the AC's Verification wording verbatim. Repair is a rename, not new tests.

Two prior open items closed: REQ-93's unclaimed evidence (Info 10) and the AC-1144/1145 colour surface both land clean.

The through-line for the fix loop: **an AC deprecation or rewrite isn't finished until the test names pointing at it have moved too** — that's the origin of two of this cycle's three violations. Read-only respected; I created only the report.
