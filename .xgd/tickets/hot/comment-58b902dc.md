---
uid: comment-58b902dc
id: COMMENT-1205
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-20T01:08:07.376388+00:00'
updated_at: '2026-08-20T01:08:07.376388+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6b05ffae
  kind: note
---

Cluster 4 resolved. **Both stories confirmed in place — no reassignment, no merge, no ticket mutations.**

**The decision.** CAP-86 and CAP-93 own two different *contracts* over one shared *write path*, and the retirement made that split cleaner rather than muddier:

- **STORY-100 → CAP-86** is field-granular: a region address, the derived list of fields it exposes with closed/bounded value vocabularies, one change map as one diff. Live at `packages/site-schema/src/l1/edit.ts` behind `/api/copy` and the CLI, with 31 UATs across the three `reconciliation-copy-edit-*` files.
- **STORY-106 → CAP-93** is element-granular: styling-free map, verbatim subtree read, bounded whole-node replace, reachable only via `get_l1`/`set_l1`.

**The two questions the survey left unstated, answered from source rather than prose:**

*Two front doors or two contracts?* Two contracts. `AC-1092`'s UAT (`tests/reconciliation-page-composition-surface.test.ts:602`) asserts declared-equals-implemented on the control surface and that `get_copy`/`set_copy` are absent from both the declaration and the running toolbox — a `set_copy` call answers `unknown tool`. Each contract now has exactly one front door. What they share is the validator and the all-or-nothing write, which is shared substrate, not a shared surface.

*Whose evidence proves an assistant-replaced element stays operator-editable?* CAP-93's — `AC-1093`/`AC-1094`, driven over `/api/copy` on subtrees `set_l1` authored. CAP-93's body already declares that split: the form is out of scope as an owned surface, but "must keep working" is an obligation it accepts. Moving those ACs to CAP-86 would separate a regression guard from the change that made it necessary.

All 33 STORY-100 ACs and all 12 STORY-106 ACs sit on the correct side; no reparenting, so no test renames.

**One residual I could not fix within this task's three actions.** CAP-86's body and STORY-100's body both still assert the pre-retirement identity — *"never a second mechanism beside the one the AI uses… Two producers share this one path"* — and STORY-100's body has zero hits for `set_l1`, `get_l1`, `retire`, `supersed`, `CAP-93`, or `STORY-106`. That claim is now stale: the AI still changes a text run's words, but through `set_l1` on the element tree, not through the copy-field pair. CAP-86 is the operator gesture's field surface now, with the CLI beside it. This is prose staleness, not a misassignment — the split is right however the sentence reads — and correcting it would mean editing story content (forbidden here outside a merge) and a capability body other clusters also touch. It's written up under **Residual** in the report for whoever does the capability-body pass.

Report created: **REPORT-2291** (`report-6b05ffae`), `cluster_id: 4`, result `pass`. Note the ticket commit landed locally but the git push failed — `ssh_dispatch_run_fatal: Broken pipe`, the sandbox has no network egress; it'll need a push from an unsandboxed context.
