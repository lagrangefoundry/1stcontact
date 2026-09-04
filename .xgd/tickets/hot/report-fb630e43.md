---
uid: report-fb630e43
id: REPORT-3418
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:06:10.781697+00:00'
updated_at: '2026-09-04T00:06:10.781697+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — **UU**, intent/bookkeeping ticket
  (rule **2e**; `request-*`, user-authored content, not matrix state). Resolved to
  the **OURS/HEAD** side.

  Path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict
  existed only in the index with no working-tree markers; resolved with
  `git checkout --ours` + `git add --sparse`.

  Conflict stages:
  - base `:1` = `7aa29ba4c3` (the blob produced by the previous cherry-pick
    attempt's incoming commit `ad68bd8ac7`)
  - ours `:2` = `353324f1de` (= HEAD `a3455307e5`, unchanged since attempt 144)
  - theirs `:3` = `3d15e21eaa`

  **Incoming** (`3013025820`, `xgd(ticket): update request`, 2026-08-31 15:17:10
  -0700) changes exactly two lines vs base, both pure bookkeeping metadata:
  - `updated_at: …T22:17:07.072374 → …T22:17:10.902125` (a 3-second bump)
  - `last_field_updated: status → story_points`

  It changes **no field value and no body text**. `story_points: 13` is byte-identical
  across all three stages — the commit records a no-op touch of that field.

  **Ours/HEAD** (`1856968a43`, `xgd(ticket): seed_local_overlay request`,
  2026-09-02 10:50 -0700) vs base: `updated_at → 2026-09-02T17:48:26`,
  `status: free_coded → bundled`, `+fields.bundled_in: bundle-203b1dc2`, plus the
  `# What landed` body rewrite. HEAD left `last_field_updated` at `status`.

  Per-fact resolution under 2e:

  - `updated_at` — both sides changed it; HEAD is later-positioned by two days
    (2026-09-02 vs 2026-08-31). → **HEAD**.
  - `last_field_updated` — superficially disjoint (only the incoming edited the
    literal line), but this field is *functionally dependent* on `updated_at` and on
    which field that update touched. The three together express one fact: "the most
    recent mutation was X at time T". The two sides state that one fact differently
    — incoming says "`story_points` at 2026-08-31T22:17:10", HEAD says "`status` at
    2026-09-02T17:48:26". So 2e's same-fact timeline rule applies, not its
    apply-both branch. → **HEAD**. Grafting the incoming's `story_points` marker
    onto HEAD's `updated_at`/`status` would have produced an internally inconsistent
    record: claiming the mutation at 2026-09-02T17:48 was `story_points`, when that
    timestamp belongs to the `status → bundled` transition.
  - `status` / `bundled_in` / body — untouched by the incoming; HEAD's values stand
    unopposed.

  Taking theirs wholesale would additionally have reverted `status: bundled →
  free_coded` and dropped `bundled_in: bundle-203b1dc2` — un-bundling the very bundle
  this reconcile run is executing.

  No content was invented; no `intent_uid`/`story_uid`/`capability_uid` field was
  touched.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted file is a
bookkeeping ticket, and the incoming commit contains no substantive change to
preserve: no field value differs between the base and theirs stages, and the body is
untouched. The whole of the incoming commit is a timestamp bump plus a
`last_field_updated` marker, both superseded per-fact by HEAD's later operation as
argued above.

The substantive free-coding metadata this ticket carries — `fields.commits[0]
.working_sha: 115f0d39ec5f8787751f144cda8b5d3c6279fbf9`, `fields.version: 0.2.23`,
and a `status` advanced past `free_coding` — is present in the resolved result,
carried by HEAD.

Nothing was dropped under the BUG-1301 precedence exception; no hunk was discarded.

Because HEAD already subsumes this commit's entire effect, the staged tree nets to
**no diff vs HEAD** (`git status --porcelain --untracked-files=no` is empty). Per
STEP 4 this is the redundant-commit case (BUG-1109/BUG-1122), **not** a discard:
STEP 3's distinguishing check passes — the incoming commit carries no change that is
genuinely absent from HEAD. `--skip` was not called; the cherry-pick sequencer state
(`CHERRY_PICK_HEAD` = `3013025820`) is left intact for
`cherry_pick_finalize_resolution`.

Note for the outer run: this is the second consecutive attempt (144, then 145) whose
incoming commit is a pure-bookkeeping frontmatter touch of this same ticket that HEAD
already subsumes. Both resolved to HEAD and both net to empty. Further commits in this
run of `xgd(ticket): update request request-119dd4af` are likely to behave the same
way.
