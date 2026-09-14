---
uid: report-22efed20
id: REPORT-4223
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T04:17:07.092897+00:00'
updated_at: '2026-09-14T04:17:07.092897+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` (BUG-43) — **UU**, intent/bookkeeping
  ticket (rule **2e**: a `bug-*` ticket, not one of the matrix-defining
  `story`/`acceptance_criterion`/`capability` kinds rule 2d governs, despite
  living in `hot/`). Resolved by **keeping ours (HEAD)** under 2e's
  strict-superset clause. Path is outside the sparse-checkout cone (DOC-986
  sections 2 / 4.1), so the conflict existed only in the index with no
  working-tree markers; inspected via `git show :1:/:2:/:3:` and resolved with
  `git checkout --ignore-skip-worktree-bits --ours` + `git add --sparse`.

  Sides:
  - **Ours** — `xgd(ticket): seed_local_overlay bug bug-360c5a44`,
    `updated_at 2026-09-11T18:53:54`, `status: bundled`, carrying
    `commits[0].working_sha 84cc117`, `version 0.2.40`,
    `bundled_in bundle-8e1807f6`.
  - **Theirs** — `xgd(ticket): update bug bug-360c5a44` (6862ea14,
    2026-09-01T22:34:57), `status: draft`, `last_field_updated: body`;
    a pure body edit.

  The enrichment rule for this file ("intent unknown on one or both sides;
  take the more recent commit by timestamp") and 2e's superset clause agree:
  ours is both the later timestamp (2026-09-11 vs 2026-09-01) and a content
  superset. No per-fact timeline tie-break was needed — no fact is asserted
  differently on the two sides.

  Context: this is the second cherry-pick attempt in this bundle to conflict
  on this same ticket. The prior one (scope 255/0) was fd72594, the large
  body rewrite; this one, 6862ea14, is its five-minute-later follow-up. The
  three hunks 6862ea14 adds are *exactly* the content that attempt flagged as
  ours-side extras already present in the seeded overlay — so both attempts
  resolve the same way and for the same reason.

## Incoming changes preserved

Confirmed present — in this case exactly, not merely in substance.
`git diff :3: :2:` produced only two hunks: the frontmatter (ours' bundling
fields and later `updated_at`), and a final-line hunk that is purely a
trailing-newline difference (no newline at end of file on ours). The entire
body of 6862ea14 is byte-identical to HEAD's.

All three of 6862ea14's body hunks verified against
`HEAD:.xgd/tickets/hot/bug-360c5a44.md`:

- Fix section, added paragraph: "Reloading a frame is the host's business,
  and a host that fails at it must not take the conversation with it: a
  callback that throws is swallowed and the turn finishes streaming its
  answer in full." — present.
- Test plan panel bullet, reworded to "once per signal, **carrying the
  counter**... The signal **leaves no trace in the conversation, and a
  callback that throws does not cost** the operator the assistant's answer."
  — present.
- Test plan, new **app** bullet: "a turn reporting two writes reloads the
  preview frame twice, and a turn reporting none leaves it alone." — present.

The remaining incoming hunk is the `updated_at` bump to
`2026-09-01T22:34:57`, superseded by ours' `2026-09-11T18:53:54` — that is
the frontmatter fact the timestamp rule resolves in ours' favour, not a
discarded edit.

No BUG-1301 precedence exception was invoked — no hunk was dropped, and no
test function on either side was removed.

**Note for the finalize step:** this resolution nets to **no diff vs HEAD**
(`git diff --cached HEAD` empty), because the seeded overlay already carried
6862ea14's content. Per STEP 4 / BUG-1109 this is the *redundant* case, not
the *discarded* case — STEP 3 distinguishes them and it passed: the incoming
commit's changes are present in HEAD via the overlay, not absent. `--skip`
was not called; CHERRY_PICK_HEAD
(6862ea1402fbfdb44a96861e415402e6d0f2eba4) is left intact for
cherry_pick_finalize_resolution.
