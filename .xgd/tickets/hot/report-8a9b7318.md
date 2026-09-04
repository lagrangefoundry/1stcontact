---
uid: report-8a9b7318
id: REPORT-3456
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T01:34:36.368245+00:00'
updated_at: '2026-09-04T01:34:36.368245+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` — UU, intent/bookkeeping ticket (rule 2e), index-only conflict (outside the sparse-checkout cone, no working-tree markers). Resolved to the HEAD side via `git checkout --ours` + `git add --sparse`.

### Why

Extracted all three index stages and diffed them:

- **base → ours** and **base → theirs** apply the *identical* markdown reflow to the entire body (hard-wrapped prose collapsed to long lines, `*emph*` → `_emph_`, list items blank-line separated, the `js` code fence delanguaged). `diff ours theirs` over the body is empty — byte-identical.
- The only real difference is frontmatter bookkeeping:
  - ours: `updated_at: 2026-09-02T17:48:26`, `last_field_updated: status`, `status: bundled`, `fields.bundled_in: bundle-203b1dc2`
  - theirs: `updated_at: 2026-09-01T18:14:18`, `last_field_updated: body`, `status: ready_to_reconcile`

Per 2e's per-fact rule, the two sides changed the same fact (`status` / `updated_at` / `last_field_updated`) differently, so the later-positioned side wins for that fact: ours is a day later (09-02 vs 09-01) and records this very reconcile run bundling the ticket into `bundle-203b1dc2`. Taking theirs would revert `status: bundled` back to `ready_to_reconcile` and drop `bundled_in` — stale bookkeeping carried backwards. This matches the auto-enrichment guidance ("take the more recent commit by timestamp"). No content was invented; no `intent_uid`/`story_uid`/`capability_uid` field was touched.

## Incoming changes preserved

The incoming commit `6e301eb7477b1c0258bcc014f300f4a29851fdf8` ("xgd(ticket): update request request-909e42f8", 57 insertions / 127 deletions) changes exactly one thing: the body reflow described above. That reflow **is present verbatim in the resolved file** — the HEAD-side `seed_local_overlay` commit applied the same normalization, so ours and theirs have identical bodies. Nothing from the incoming diff is absent.

No hunks were dropped, so the BUG-1301 precedence exception does not apply here.

## Note on the staged result

`git diff --cached HEAD` is empty: the incoming commit's whole effect had already reached HEAD by a different route (the overlay seed), so the resolution nets to no change. Per STEP 4 this is not a failure and `--skip` was not called — `cherry_pick_finalize_resolution` will detect the empty staged diff. STEP 3's guard is satisfied: the incoming changes are present in HEAD (redundant), not absent (discarded).

## Verification

- `git status --porcelain` — no `UU`/`AA`/`DU`/`UD`/`AU`/`UA` lines remain.
- `CHERRY_PICK_HEAD` still present; no `--continue`/`--skip`/`--quit`/`--abort`/`reset` was run.
