---
uid: comment-8f174f45
id: COMMENT-1251
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T04:04:09.964453+00:00'
updated_at: '2026-08-20T04:04:09.964453+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ddb6d8d3
  kind: note
---

Attempt 9 complete — all three findings from `report-cb71281a` are resolved.

## Finding 1 (violation, `code-issue`) — the boolean-flag registry

`BOOLEAN_FLAGS` at `tools/generate/src/cli/args.ts:11` had drifted six flags behind the CLI. I independently enumerated every boolean read (`flags.X === true`) across `cli/index.ts` and confirmed exactly the assessor's six: `collapse`, `clusters` (`:794-795`), `edit` (`:469`), `dry-run`/`prune` (`:498-499`), `apply` (`:978`). Each falls to the value-taking branch at `args.ts:26-32` and eats the following token — and every one of those commands takes `slug = requireSlug(rest[0])`, so it dies with the exact `Missing required <slug>` signature REQ-58 fixed.

Registered all six, exported the set, and pinned it **entire** in evidence with two new UATs — one asserting the set as a set (mirroring REQ-44's gated-command-set test), one parameterised over every member proving `<slug>` survives in both flag orders. First verified no valued use of any of the six exists anywhere in the repo. Commit `9e8abb376`.

Tests: 44 passed / 2 chromium-skipped across the five CLI suites, 33 passed on the fidelity suite. The one `tsc` error (`builder.ts:337`) pre-exists — confirmed by stashing and re-running.

## Findings 2 and 3 (warnings)

Five story bodies retargeted off retired CAP-64/65/66 names onto CAP-63 / `1c_capture_diff_fidelity`, including STORY-76's two dangling `[[values_diff_fidelity]]` links and STORY-78's "Belongs to CAP-65" (which contradicted its own `capability_uid`). STORY-116 §5 now matches REQ-76's two-member taxonomy, with `outline` marked as a code-sourced extension citing `fidelity.ts:463-465` — it is genuinely in the shipped `CAUSE_MAP`, so I cited rather than dropped it.

## One thing worth your attention

`xgd ticket get capability-aa030c83` returns a **stale body** — 6425 chars, missing attempt 8's report-surface scope bullet and both new History paragraphs. The committed file at git HEAD has all of them (9959 chars). This worktree's sparse-checkout excludes `/.xgd/tickets/**`, so xgd materialises ticket files on demand; story reads were all current (every edit landed as a small surgical diff, verified against the commit diffs), but the capability read is not. Any editor that reads that body and writes it back will silently revert attempt 8's repair. I avoided the write for that reason — and because scope §5's claim is now simply true. Forwarded in the report.

Completion report: `report-ddb6d8d3` (`needs_more_work: false`, `violations_remaining: 0`).
