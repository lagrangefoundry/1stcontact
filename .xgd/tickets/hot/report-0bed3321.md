---
uid: report-0bed3321
id: REPORT-3205
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T04:42:21.722177+00:00'
updated_at: '2026-09-01T04:42:21.722177+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

Cherry-pick in progress: 876811161c "Merge branch 'free-BUG-39' into xgd-working"
(merge commit; mainline parent ab2f423dde). Two conflicted paths, both UU.
Every other path in the incoming diff (8 test files + tests/support/scripted-model-client.ts)
applied with zero net diff vs HEAD — already integrated on the bundle branch.

## Files resolved

- **package.json** — UU, config file (2g scalar / free_coded-vs-free_coded exception).
  Base 0.2.14, ours 0.2.16, theirs 0.2.15; the version line is the ONLY difference
  between the two sides (verified by blob diff). Both sides are `free_coded`, so the
  later working-timeline position wins. Resolved to **ours, 0.2.16**, via
  `git checkout --ours`. Taking theirs would have REGRESSED the version.

- **.xgd/tickets/hot/bug-23d1ec27.md** — UU, intent/bookkeeping ticket (2e), resolved
  **per-fact, not whole-file**:
  - *Body*: took **theirs verbatim** (`git checkout --theirs`). Both sides carry the
    SAME "as landed" body edit, but ours is a degraded round-trip of it: the markdown
    results table was flattened into 24 bare lines, `**One double, in **` has the bold
    span broken, the ```ts fence lost its language tag and gained a stray blank line,
    and hard wraps were collapsed. Theirs is the developer-authored original. Same
    fact, better rendering -> superset rule.
  - *Frontmatter*: took **ours** — `status: bundled` (theirs: `free_coding`),
    `updated_at: 2026-08-31T05:05:09` (theirs: 2026-08-25T23:27:28),
    `last_field_updated: status` (theirs: `body`), plus ours-only
    `fields.commits` / `fields.version: 0.2.15` / `fields.story_points: 3` /
    `fields.bundled_in: bundle-8eef3846`. Ours is later by timeline AND is the bundle
    lifecycle state; reverting to `free_coding` would unbundle the ticket.
  - Non-overlapping composition: ours' operation was a STATUS advance
    (`last_field_updated: status`), theirs' was a BODY edit (`last_field_updated: body`).
    2e's "apply BOTH" case, exactly.
  - Also removed the auto-merge duplication of the "**The blast radius is wider than the
    reproduce line.**" paragraph, which git had merged in twice (once wrapped, once
    unwrapped) because each side added the same paragraph in a different wrap. One copy
    kept — de-duplication of an identical addition, not a content deletion.
  - Staged with `git add --sparse` (path is outside the sparse-checkout cone).

## Incoming changes preserved

- **.xgd/tickets/hot/bug-23d1ec27.md** — the resolved file diffs against the incoming
  blob ONLY in the frontmatter lines listed above; the entire body is byte-identical to
  theirs. Every incoming body change is present: the blast-radius paragraph, the
  `AnthropicAccumulator` / `api_tools.js:317` root-cause detail, the "Fix — as landed"
  section with the intact 8-row results table, "The evidence for this ticket",
  "Out of scope — a second, unrelated defect surfaced", the three ✅ acceptance criteria,
  and the Reproduce build-artefact note.

- **package.json** — the incoming change (0.2.14 -> 0.2.15) is present in HEAD via a
  different route, not discarded. HEAD's history contains 61e4aae3dd
  "test(chat-host): one streaming model double, shared by every suite [FREE-CODED]"
  (both `-S"0.2.15"` and `merge-base --is-ancestor` confirm), which is the same bump this
  merge carries — it is the free_coded commit for THIS very ticket, BUG-39, whose
  `fields.version` is 0.2.15. A later free_coded commit, 1213d247dd
  "feat(capture): Browser Rendering driver behind the BrowserDriver seam [FREE-CODED]"
  (also an ancestor of HEAD), then bumped to 0.2.16. So this is the BUG-1109/BUG-1122
  redundant case, not a discard: the incoming intent is in HEAD and has been superseded.
  package.json therefore stages with no net diff vs HEAD, which is expected.

- No UAT test function on either side of either conflict was deleted; no BUG-1301
  precedence exception was invoked.

## State

`git status --porcelain` shows no UU/AA/DU/UD lines — only
`M  .xgd/tickets/hot/bug-23d1ec27.md`. CHERRY_PICK_HEAD is intact; no
`cherry-pick --continue/--skip/--quit/--abort`, `reset`, or `checkout <branch>` was run.
