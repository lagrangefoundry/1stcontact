---
uid: report-a291ddcc
id: REPORT-4222
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T04:12:50.674780+00:00'
updated_at: '2026-09-14T04:12:50.674780+00:00'
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
  `story`/`acceptance_criterion`/`capability` kinds that rule 2d governs,
  despite living in `hot/`). Resolved by **keeping ours (HEAD)** under 2e's
  strict-superset clause. Path is outside the sparse-checkout cone (DOC-986
  §2/§4.1), so the conflict existed only in the index with no working-tree
  markers; inspected via `git show :1:/:2:/:3:` and resolved with
  `git checkout --ignore-skip-worktree-bits --ours` + `git add --sparse`.

  Sides:
  - **Ours** — `xgd(ticket): seed_local_overlay bug bug-360c5a44`,
    `updated_at 2026-09-11T18:53:54`, `status: bundled`, carrying
    `commits[0].working_sha 84cc117`, `version 0.2.40`,
    `bundled_in bundle-8e1807f6`.
  - **Theirs** — `xgd(ticket): update bug bug-360c5a44` (fd72594),
    `updated_at 2026-09-01T22:29:53`, `status: draft`,
    `last_field_updated: body`; a pure body rewrite.

  The enrichment rule supplied for this file ("intent unknown on one or both
  sides; take the more recent commit by timestamp") and 2e's superset clause
  agree here: ours is both the later timestamp (2026-09-11 vs 2026-09-01) and
  a strict content superset. No per-fact timeline tie-break was needed — no
  fact is asserted differently on the two sides.

## Incoming changes preserved

Confirmed present. `git diff :3: :2:` produced hunks in only three places —
the frontmatter, and two ours-side *additions* — with the entire Symptom /
Root cause / What is wanted / Fix-step-1 / workerd-test-bullet region
byte-identical between the two sides. In other words the seeded overlay had
already absorbed fd72594's body rewrite in full.

Spot-checked all 11 distinct key phrases introduced by fd72594 against
`HEAD:.xgd/tickets/hot/bug-360c5a44.md`; all 11 matched:

- Symptom: "A manual browser refresh does show the change (confirmed by the
  operator)…"
- Root cause retitle: "Nothing reloads the preview iframe when **the assistant
  writes**" (from "when an assistant turn ends")
- The whole new `## What is wanted` section, incl. "emitted per write rather
  than once at the end of the turn" and "deliberately no new operation on the
  L1 surface"
- Fix step 1 rewrite: "Instead of passing the model's stream straight
  through…", "One primary-key read per tool call"
- Fix closing para: "Only a counter that actually moved produces a signal…"
- Test plan workerd bullet: "a scripted turn that calls two write tools emits
  a `site_changed` frame after *each* of them…", "interleaved with the tool
  activity rather than collected at the end"
- Test plan panel bullet: "once per signal"

One incoming sentence is restated rather than verbatim, and is a **semantic
superset**, not a discard. Incoming panel bullet ended "The signal is not
passed on to the chat component."; HEAD reads "The signal leaves no trace in
the conversation, and a callback that throws does not cost the operator the
assistant's answer." Both assert the signal never reaches the chat component;
HEAD additionally pins the throwing-callback behaviour.

Ours-side content retained on top of the incoming rewrite (product of the
implementation commit 84cc117, not of this resolution):

- a Fix paragraph: "Reloading a frame is the host's business, and a host that
  fails at it must not take the conversation with it: a callback that throws
  is swallowed and the turn finishes streaming its answer in full."
- "carrying the counter" added to the panel test bullet
- a new **app** test bullet: "a turn reporting two writes reloads the preview
  frame twice, and a turn reporting none leaves it alone."

No BUG-1301 precedence exception was invoked — no hunk was dropped, and no
test function on either side was removed.

**Note for the finalize step:** this resolution nets to **no diff vs HEAD**
(`git diff --cached HEAD` is empty), because the seeded overlay already
carried fd72594's content. Per STEP 4 / BUG-1109 this is the *redundant*
case, not the *discarded* case — STEP 3's check distinguishes them, and it
passed: the incoming commit's key changes are present in HEAD via the
overlay, not absent. `--skip` was not called; CHERRY_PICK_HEAD
(fd72594eb0410ea0c51b51cce207c02e6691ef3a) is left intact for
cherry_pick_finalize_resolution.
