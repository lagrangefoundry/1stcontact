---
uid: comment-66cd0605
id: COMMENT-895
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-10T07:42:24.293357+00:00'
updated_at: '2026-08-10T07:42:24.293357+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d08f7c1a
  kind: note
---

**Result: PASS** — REPORT-1747 (`report-d08f7c1a`), 0 violations, 2 warnings, 0 needs_review.

## What I assessed

**Intent ledger.** CAP-86's one story (STORY-100) carries `intent_uid: bundle-15c1f647` (REQ-117 + REQ-115 + REQ-44) and `updated_by: request-66e4c630` (REQ-118) — all `free_and_reconciled`, plus REQ-11 (shared validator/atomicity) and REQ-116 (address vocabulary). Nothing reconciled retires any behavior the matrix describes; REQ-118 is the only modifying intent and it *widened* the surface (copy → any edit), which is what the AC set records.

I also walked the newer `bundled` cluster (REQ-119, 121, 122, 126, 127, 128, 129, 130 — imminent per the status table). Every one is additive and each states in its own body that the single shared write path survives (REQ-126: "a formalisation of `edit.ts`, not a second surface beside it"; REQ-129: "leave the operator's click-to-edit modal exactly as it is"). None retires an AC here.

**Coverage.** 17 ACs, 22 UATs across two files. I ran them rather than trusting the index: `2 files passed, 22/22 tests passed, 0 skipped, 1.67s`. Real entry points throughout (`run(argv)` on the real `1c` CLI; a live `startBuilder` origin over real `fetch`), observables are bytes on disk, no `vi.mock`/`vi.fn`/`vi.spyOn`, no conditional skips, nothing structural. The two hardest claims are proved by consequence — AC-986 plants a violation at an untouched node and shows copy, image and `config set` fail with identical code/message/path.

Verdicts written: 17 ACs `pass`, story `pass`, capability `pass`.

## Two warnings (do not affect pass/fail)

1. **REQ-128 will extend this surface** — a container carrying `backgroundImageUrl` exposes a picker through the same `copy get|set` path. It's `bundled` on working, and the code is **not in this branch** (`backgroundImageUrl` is absent from `packages/site-schema/src/l1/edit.ts`). Authoring ACs/UATs for it now would produce failing evidence against this branch, so the correct lever is reconcile, not the editor. Flagged rather than counted as a gap.

2. **AC-984's evidence covers one rendering, not both** — the test compares byte-identity of the *edit* channel only; the plain draft channel is never rendered in that test. Substantive as written, but an optional `uat-edit` would close it.

One thing worth knowing about the tooling: `.xgd/uat_index.json` reads `status: "missing"`, `last_run: null` for all 311 indexed ACs, including these 22 that demonstrably pass, and it still lists pre-rename test names alongside current ones. It can't be read as evidence of missing tests.
