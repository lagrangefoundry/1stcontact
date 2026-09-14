---
uid: report-754a55c2
id: REPORT-4220
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T04:02:35.943509+00:00'
updated_at: '2026-09-14T04:02:35.943509+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — UU, intent/bookkeeping ticket (rule 2e:
  "one side is a strict superset of the other — keep the superset", with the
  per-fact timeline rule applied to the single genuinely-differing field).
  Ours = `xgd(ticket): seed_local_overlay request request-51514090`
  (updated_at 2026-09-11T18:53:54Z); theirs = incoming
  `xgd(ticket): update request request-51514090` =
  56087d83b36080ce838a809fed0628bca1bb3690 (updated_at 2026-09-01T22:10:38Z).

  `git diff :2: :3:` reduces to two facts. Ours already carries every field the
  incoming commit added — `fields.commits` with all three working SHAs
  (f5807330, 92e927e7, d612c1aa), `fields.version: 0.2.39`, and
  `last_field_updated: status` — plus `fields.bundled_in: bundle-8e1807f6`,
  which the incoming side never had. The only field where the two sides disagree
  is `status`: incoming sets `free_coded`, ours holds `bundled`. Per 2e's
  per-fact timeline rule, ours is the later-positioned intent (2026-09-11 vs
  2026-09-01), and `bundled` is the downstream lifecycle successor of
  `free_coded` — taking theirs would regress the ticket's state. Kept ours.
  Resolved with `git checkout --ours` + `git add --sparse`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-51514090.md`: preserved. The incoming commit's
  substantive hunk was the `fields.commits` / `fields.version` block plus the
  `last_field_updated: status` flip; all of it is present verbatim in the
  resolved file (lines 21-30, verified by grep and by the `:2:` vs `:3:` diff
  showing no delta in that region). The `updated_at` bump and the `status`
  transition are bookkeeping that a strictly later ours-side update already
  advanced past.

  No hunk was dropped under the BUG-1301 precedence exception; this is not a
  discard. This is the seeded-overlay redundancy case (the local overlay seed
  already carried the incoming fields), so the resolution nets to an empty
  staged diff vs HEAD — `git diff HEAD:<path> :2:<path>` was empty. Per STEP 4
  that is expected and the finalize step will detect the clean staged diff and
  skip the commit. STEP 3's guard distinguishes this from a discard: the
  incoming fields are present in HEAD, not absent.

  Note: this is the second consecutive commit in this bundle to resolve the same
  way on this same ticket (the prior one, d3c5e85b, appended the "One honest
  caveat" body section, also already in HEAD).

## Staging state

`git status --porcelain` is empty — no UU/AA/DU/UD lines remain. CHERRY_PICK_HEAD
left intact; no `--continue`/`--skip`/`--abort` issued.
