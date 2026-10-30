---
uid: report-22d81b94
id: REPORT-5572
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T16:32:43.266124+00:00'
updated_at: '2026-09-29T16:32:43.266124+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/doc-58cf04a4.md` (DOC-33, "The Consultation Playbook") —
  UU on an intent/bookkeeping ticket (`type: doc`, not a spec ticket), so rule
  **2e** applies: combine non-overlapping facts, timeline rule per contested
  fact. Outside the sparse-checkout cone, so the conflict existed only in the
  index — resolved from index stages 1/2/3 and staged with `git add --sparse`.

  The two sides were almost entirely disjoint:
  - **OURS** (`6a6d08d05f`, `xgd(ticket): update doc doc-58cf04a4`, author date
    2026-09-02) has a body byte-identical to the merge base (`b8c8fe8c51^`).
    Its *only* difference from base is the `updated_at` scalar:
    `2026-09-02T22:58:37` → `2026-09-11T09:33:30`. It contributes no content.
  - **THEIRS** (`b8c8fe8c51`, `docs(DOC-33): add scheduling to the limb table
    (§11)`, author date 2026-09-07) contributes the whole content change:
    scheduling added to the §11 prose list, a new **Scheduling** row in the
    limb table, the "scheduling is not yet declared there" qualifier on the
    [[DOC-25]] behaviour-modules paragraph, plus one cosmetic blank line after
    the frontmatter. It also bumps `updated_at` to `2026-09-08T01:49:04`.

  **Resolution — strict superset of both sides.** Took THEIRS' file in full
  (every content hunk, including the cosmetic blank line), and for the single
  contested fact — `updated_at`, the only field both sides changed — kept the
  later value, OURS' `2026-09-11T09:33:30.694374+00:00`. `last_field_updated:
  body` is `body` on both sides; no other field conflicts. Nothing from either
  side was discarded.

  Note on the auto-enrichment fallback: it reported "intent unknown on one or
  both sides — take the more recent commit by timestamp and flag for
  post-merge review." Reading the two commit messages made the intent knowable
  (one is a pure metadata bump, the other a documented §11 content edit), so
  the more specific per-fact rule 2e governs rather than the whole-file
  fallback. The outcomes agree on the content (incoming wins everywhere it
  changed anything); they differ only on `updated_at`, where the per-fact rule
  keeps the later stamp instead of regressing it to 2026-09-08.
  **Flagged for post-merge review** as the enrichment requested.

## Incoming changes preserved

`git diff --cached HEAD -- .xgd/tickets/hot/doc-58cf04a4.md` contains every
content hunk of `git show b8c8fe8c51 -- .xgd/tickets/hot/doc-58cf04a4.md`:

- §11 prose: `Site monitoring, payments, scheduling, email lists, marketing
  planning and a lightweight CRM are coming`
- the new `| **Scheduling** | **In the page** — a booking surface with
  availability, states and a destination | **Stage 1** | …timezone,
  cancellation, reminders |` table row
- `…and email capture as future behavior modules; **scheduling is not yet
  declared there** and must be before it can appear in the stage-1 catalogue.`
- the extra blank line after the frontmatter

The only line where the staged result differs from THEIRS is `updated_at`,
which carries OURS' later stamp by the rule above — not a dropped incoming
change but the deliberate per-fact resolution.

No hunk was dropped, so the BUG-1301 precedence exception was not invoked.
No code or UAT test files were in this conflict.

`git status --porcelain` shows `M  .xgd/tickets/hot/doc-58cf04a4.md` and no
conflict-class lines. `CHERRY_PICK_HEAD` is still present at
`b8c8fe8c516afc709a13d834558f6b74fb03f6be` — no `--continue`, `--skip`,
`--quit`, or `--abort` was run.
