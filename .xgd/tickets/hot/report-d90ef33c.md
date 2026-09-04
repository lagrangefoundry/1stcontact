---
uid: report-d90ef33c
id: REPORT-3327
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T19:18:03.490360+00:00'
updated_at: '2026-09-02T19:18:03.490360+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — class **AA** (both added), intent/bookkeeping
  ticket → rule **2e**, "one side is a strict superset of the other: keep the superset". Resolved to
  the HEAD side, staged with `git add --sparse` (path is outside the sparse-checkout cone, DOC-986
  §2/§4.1).

  - Incoming (`97327f55c1d75dfef7bf44d407e7b73949eef6e6`, "xgd(ticket): update request
    request-b88b79fe", 2026-08-23 16:26:15 -0700): the 98-line draft, `status: draft`,
    `updated_at: 2026-08-20T23:16:27`.
  - HEAD (`afd199743a83e4644f8058597f487b7edf98347b`, 2026-08-31 12:21:41 -0700): 218 lines,
    `status: bundled`, `updated_at: 2026-08-31T05:05:09`, plus `fields.commits`, `fields.version`,
    `fields.bundled_in`, and the entire `# What was built` section.
  - No per-fact conflict existed: every frontmatter field on the incoming side is present on the
    HEAD side with the same or a later value, and no field or section exists only on the incoming
    side. The enrichment rule ("take the more recent commit by timestamp") and the 2e superset rule
    agree, so no `xgd working-timeline` tiebreak was needed.

## Incoming changes preserved

- `.xgd/tickets/hot/request-b88b79fe.md` — **preserved in full; nothing discarded.**

  The incoming commit's file content is byte-identical (modulo a missing trailing newline) to the
  version already committed on this branch at `721f73866725cd497aa038c694e56c9304f77a74`, which
  carries the same author date (2026-08-23 16:26:15 -0700) and the same subject as the incoming
  commit. The incoming change is therefore already integrated into HEAD by a different route; HEAD
  then advanced past it on 2026-08-31.

  Verified mechanically rather than by eye: a word-level comparison of the two bodies (frontmatter
  stripped, markdown emphasis normalised, since HEAD re-flowed the prose from hard-wrapped to
  unwrapped and switched `*…*` to `_…_`) reports **0 segments of the incoming version absent from
  the HEAD version** — 700 incoming words, all matched inside HEAD's 2108.

  This is the BUG-1109/BUG-1122 redundant-commit shape, not a discard: the STEP 3 test — are the
  incoming commit's key changes *present in HEAD* (redundant) or simply *absent* (discarded)? —
  answers "present". Accordingly the staged tree shows no diff vs HEAD (`git diff --cached HEAD`
  is empty). `--skip` was **not** called; the cherry-pick sequencer state is untouched and
  `CHERRY_PICK_HEAD` remains in place for `cherry_pick_finalize_resolution`.

- No code/implementation files were in conflict, so no BUG-1301 precedence exception was invoked
  and no test function was deleted.
