---
uid: comment-a69d85de
id: COMMENT-672
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-05T21:05:37.944831+00:00'
updated_at: '2026-08-05T21:05:37.944831+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-0911f3ec
  kind: note
---

UAT coverage assessment for **CAP-70 framework_substrate** is complete: **REPORT-1317** (`report-0911f3ec`), result **FAIL** — 2 violations, 6 warnings, 1 needs_review.

**What I did:** built the intent ledger from all touching intents (REQ-79/82/84/85/87/90/91/93 reconciled; BUNDLE-11's REQ-96…107 and REQ-108/114 imminent), read all 24 AC bodies and all 5 UAT files line by line, and ran them (`22 passed, 2 skipped, 5/5 files green, 1.18s`).

**Verdicts written** — 23 ACs `pass` / AC-685 `fail`; STORY-80 + STORY-81 `pass`, STORY-83 `fail`, STORY-82 `stale`, STORY-85 `needs_review`; capability `fail`.

The three things that matter:

1. **AC-685 is half-proven (violation, uat-edit).** Its criterion has two paragraphs; only ¶1 (text / alt / image-src / font-family) is tested. ¶2 — a payload in a gradient stop, border colour, background-image URL, shadow, mask or transform must be dropped by the *emitter* — is asserted nowhere. The renderer genuinely implements it (`render.ts:41-43`, `:70-85`), and AC-726 only covers the validator side, so this is a missing test, not a bug.

2. **REQ-87's rename is half-landed in the matrix (violation, story-body-edit).** STORY-85 was carried across; STORY-82 and AC-718 still call the runtime type a "capability module", as do the STORY-82 test file's comments. One sweep fixes all of it.

3. **REQ-93 needs the operator, not the editor (needs_review).** It's marked `free_and_reconciled` inside a reconciled bundle, but its commit `71ba1177` is contained only by `xgd-working` — main still enforces the page XOR at `packages/site-schema/src/schema.ts:540-547`, and no story describes slot-bound module mounting. Authoring ACs for it here would produce UATs that cannot pass, so the status/lost-merge question has to settle first.

Two warnings are explicitly *not* work: AC-683/AC-688 skipped because `playwright` isn't installed in this worktree (browser binaries are cached, the package isn't resolvable), so the round-trip and cross-browser gates carry no executed evidence here; and BUNDLE-11's L1 language extensions are absent from this branch's code by design — its own reconcile owns that matrix update.
