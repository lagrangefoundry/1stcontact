---
uid: report-39fcaa86
id: REPORT-5242
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T01:31:29.215934+00:00'
updated_at: '2026-09-28T01:31:29.215934+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` (BUG-36) — **UU**, intent/bookkeeping ticket
  (`bug-*`), so STEP 2e per-fact rules. Out of the sparse-checkout cone, staged
  with `git add --sparse`. Two conflict hunks:

  - **Hunk 1 — frontmatter lifecycle block (lines 9–19).** Both sides changed the
    same facts differently, so a genuine per-fact conflict; resolved to **OURS**
    per fact:
    | fact | ours (HEAD) | incoming (`5af1ff949d`) | taken |
    |---|---|---|---|
    | `updated_at` | `2026-08-31T19:19:38Z` | `2026-08-24T01:48:23Z` | ours (later) |
    | `completed_at` | `2026-08-31T19:19:38Z` | `null` | ours |
    | `last_field_updated` | `status` | `body` | ours |
    | `status` | `free_and_reconciled` | `draft` | ours |
    | `fields.story_points` / `commits` / `version: 0.2.10` / `bundled_in: bundle-78f4e2fe` | present | absent | ours |

    HEAD is strictly downstream of incoming, not merely later by clock: incoming
    is the `draft` state at the moment the body was written, whereas HEAD carries
    the reconciled+bundled state of that same work — its `commits` entry records
    `working_sha ea48502d0d90bb607ac528e34099e71eaab6df40`, which is precisely the
    pre-remap sha this resync run is replaying (remapped to `ae82bdfe21e9…` in the
    anchor's `orphan_commits`). Taking incoming would have regressed the ticket
    `free_and_reconciled` → `draft`, cleared `completed_at`, and dropped
    `bundled_in` / `commits` / `version` — a silent loss of bundling state, with no
    offsetting gain, since incoming contributes nothing here that HEAD lacks.

  - **Hunk 2 — EOF (lines 380–384).** Identical prose on both sides; the sole
    difference was that ours lacked a terminating newline and incoming had one.
    Kept the text and **adopted incoming's trailing newline**, so nothing from the
    incoming side is discarded. This is the entire net staged change against HEAD
    (`1 insertion(+), 1 deletion(-)`, the `\ No newline at end of file` marker
    going away).

  - **Body.** Everything outside those two hunks merged cleanly because the two
    sides' body edits are byte-identical: `git diff <stage2> <stage3>` reports no
    difference anywhere in the body. Both sides add the same `## Status` rewrite
    and the same 110-line `# Implementation — the tenant fix` section (What
    changed table, `storeFor` snippet, "Why `reason` had to be exposed", scope
    argument, the five `test_UAT_FC_BUG-36_tenant_bootstrap` cases, the REQ-149
    /AC-10 supersession note, Verified, and "Still open, and NOT this ticket").

## Incoming changes preserved

Confirmed. `git diff 5af1ff949d -- .xgd/tickets/hot/bug-db356ff8.md` against the
staged resolution shows **only** the frontmatter lifecycle block above — i.e. the
resolution is a strict superset of the incoming blob: every line incoming adds to
the base is present verbatim, and the only divergence is HEAD's downstream
lifecycle metadata that incoming predates.

No hunk was dropped, so the BUG-1301 precedence exception was not invoked. No
UAT test function was touched: this conflict is confined to a single markdown
ticket file, and the five UATs it *describes* live in
`tests/test_UAT_FC_BUG-36_tenant_bootstrap.workers.test.ts`, which is not part of
this conflict and was not modified.

The in-progress cherry-pick was left paused: `CHERRY_PICK_HEAD` is still
`5af1ff949d4069fada2d2f0b4e17871aec5980c6`, `git ls-files -u` is empty, and no
`--continue`/`--skip`/`--quit`/`--abort` was issued.
