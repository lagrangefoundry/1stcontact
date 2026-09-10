---
uid: comment-9493257b
id: COMMENT-2535
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T13:12:33.017224+00:00'
updated_at: '2026-09-10T13:12:33.017224+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-735ce8ed
  kind: note
---

**Report created: REPORT-3736 (`report-735ce8ed`) — PASS, 0 violations / 0 warnings / 0 needs_review.**

## What I verified

**Scope unchanged**: 7 stories, 108 ACs (105 active, 3 pending — AC-1622/1623/1624). No AC has an `updated_at` later than 12:44; attempt 8 (13:02) edited no ticket body.

**All four findings of report-6de02f6a are closed**, re-derived from the diff and a live run rather than taken on the fix report's word. `git show 7a13ea79a6 --stat` confirms attempt 8 touched three test files and nothing else:

1. **AC-685's enum delegation now lands** — `reconciliation-l1-substrate.test.ts:379-391` adds a real probe: `textTransform: 'uppercase'` accepted (positive control), `'rotate(1deg);color:red'` rejected, reported path asserted `/root/axes/textTransform`, message required to name a declared member. Two map entries extend it to a second leaf kind. Passes green.
2. **AC-684 / AC-727 browser arms split** — both are verbatim relocations into `it.runIf` arms; no assertion dropped. I checked `at(1440)` against the file's `WIDTHS` at `:33` so the AC-684 arm won't throw when an engine appears.
3. **REQ-87 vocabulary residue gone**; `grep -in capabilit` across all 22 files leaves only deliberate hits.

**The silent-gate defect class is clean for the first time.** Swept all 22 files: six surviving matches, none a gate — five are TS narrowing tails each preceded by `expect(x.ok).toBe(true)`, three are `return []` in parser helpers.

**Test evidence** (21 of 22 files; the `*.workers` project can't start here): **102 passed / 7 skipped / 2 failed**. The 7 skips are the verification — the same 15-file set that reported `73 passed | 0 skipped` two cycles ago now reports **73 passed / 1 skipped**, and `l1-substrate` reports 3 skips where it reported 2. The 2 failures (AC-703, AC-888) and the workers non-start are the same `listen EPERM` sandbox restriction as the last two cycles, re-measured; Chromium is refused at the Mach-bootstrap layer, which is why the skips are observable at all.

**Evidence validity re-swept**: nine mock sites, eight at platform/DOM/network boundaries; the one internal-module substitution (AC-702) spreads `importOriginal()`, is `doUnmock`-scoped, vacuity-guarded at `:579`, and declared in the AC body.

## One thing I deliberately did not raise

Ten `z.enum` declarations sit inside structured forms (`schema.ts:353, 366, 431, 451, 546, 595, 762, 809, 1315, …`) with no out-of-vocabulary probe. I recorded this as **info with an explicit "do not open a repair"** — no active AC asks for it (AC-685 delegates enums away; AC-726's rejection list has no enum item), and the mechanism is pinned from both sides already. Escalating it would fail a tenth cycle on a technicality left behind by a correct repair. If it's ever judged worth pinning, the order is `ac-edit` on AC-726 first, `uat-add` second.

Note for the outer loop: the capability's `uat_coverage` still reads `fail`, as do six AC-level values that disagree with what the tests now show. That field is owned by check/fix_uat_coverage — I left it alone.
