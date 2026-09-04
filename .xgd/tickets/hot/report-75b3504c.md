---
uid: report-75b3504c
id: REPORT-3412
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T23:55:12.821173+00:00'
updated_at: '2026-09-03T23:55:12.821173+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU**, intent/bookkeeping ticket
  (rule **2e**). Index-only conflict: the path is outside the sparse-checkout
  cone (DOC-986 §2/§4.1), so there were no working-tree markers. Resolved by
  taking the **ours/HEAD** side (`git checkout --ours` + `git add --sparse`).

  Rationale — 2e's "one side is a strict superset" branch, corroborated by the
  timeline rule:

  - Incoming `3a7f62aa` (2026-08-31 15:08 -0700, *"content edit: record the
    eight implementation-review decisions"*) is a **git ancestor** of
    `d99c1f43`, the `working_sha` this ticket itself records in
    `fields.commits` (verified with `git merge-base --is-ancestor`). Incoming
    is therefore strictly earlier on the working timeline.
  - Ours `31823f5b` (2026-09-02 10:50 -0700, `seed_local_overlay`) seeded the
    ticket at its end-of-working state — `status: bundled`, `version: 0.2.24`,
    `bundled_in: bundle-203b1dc2` — which is downstream of the incoming commit.

  The enrichment metadata's fallback ("take the more recent commit by
  timestamp") and 2e's per-fact timeline rule both select ours, and they agree
  with the superset test below.

## Incoming changes preserved

Every fact the incoming commit contributes is present in the resolved file.
Verified by normalizing the later `shadow` → `description` rename in the
incoming blob and diffing it against ours: the only lines unique to incoming
are the three groups below, each of which is ours carrying the **same fact in
a later-refined form**, not a discard.

Present verbatim in the resolved file:

- The whole `## Decisions from implementation review` section — all eight
  decisions (routes, index seam, vision path, `*_status`, unpdf and the bundle
  budget, fetch guard and untrusted marking, promotion gate). This is the
  entirety of what the incoming commit message claims to add.
- All four acceptance criteria the incoming commit appended (index seam called
  once + loud log; degraded status still visible and selectable; fetch guard
  refusal with per-hop re-validation; promotion of a non-`republishable`
  source refused). Ours adds a fifth (no-store on every declared route).

The three deltas, and why each is refinement rather than loss:

1. **Frontmatter** (`updated_at`, `last_field_updated`, `status`). Incoming has
   `2026-08-31T22:08:03Z` / `body` / `draft`; ours has `2026-09-02T17:48:27Z` /
   `status` / `bundled` plus `commits`, `version` and `bundled_in`. Ours is the
   later state of the same fields; incoming's values are superseded bookkeeping.
2. **`shadow` → `description` terminology.** Incoming still says *"Shadow"* in
   the step-3 heading and table, *"the shadow as body"*, *"a weak shadow"*,
   `shadow_status`, `shadow_model`. Ours applies the rename consistently across
   the same sentences. Same facts, later vocabulary — and the ours-side
   `## What was built` section documents `description_status`'s six values, so
   reverting the name would desync the ticket from the shipped schema.
3. **The two open questions incoming leaves** (whether `describeImage` moves
   into the AI component; whether a re-describe pass is automatic or
   operator-triggered). Ours does not drop them — it **answers** both in
   `## Resolved after implementation (2026-08-31)`, which opens by saying so
   explicitly: *"Two of the questions left open at hand-off have since been
   answered. Recorded here rather than by deleting them, so what made them
   questions stays legible."* Ours' `## Open questions` then carries a new,
   genuinely-open item (DNS not resolved before fetch).

Ours additionally carries content that postdates incoming entirely and is
untouched by this resolution: the five documented departures from the
decisions, the four-build `wrangler --dry-run` bundle measurement for REQ-158,
and the evidence section naming both UAT files.

No code/implementation files were in conflict, so STEP 3's `git show $CPHEAD --
<file>` check applied only to this ticket. No UAT functions were involved and
no BUG-1301 precedence exception was needed.

**Note for the finalize step:** the resolution takes ours in full, so the
staged tree has **no net diff vs HEAD** — `git status --porcelain` shows no
tracked entries and `git ls-files -u` is empty. This is the redundant-commit
case (BUG-1109/BUG-1122), not a discard: STEP 3's distinguishing test passes
because the incoming commit's key changes *are* present in HEAD, having
arrived there via the `seed_local_overlay` of the later working state. Per
STEP 4 no `--skip` was issued and `CHERRY_PICK_HEAD` was left intact.
