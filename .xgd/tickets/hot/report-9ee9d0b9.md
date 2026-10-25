---
uid: report-9ee9d0b9
id: REPORT-6682
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T22:42:21.073727+00:00'
updated_at: '2026-10-25T22:42:21.073727+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-5bc83942.md` — class 2e (intent/bookkeeping ticket, bug), UU, index-only (outside sparse cone). Incoming commit 0027707142 ("update bug bug-5bc83942", updated_at 2026-09-01T22:43:53). Resolved with `git checkout --ours` + `git add --sparse`.
  - Incoming vs its base made three changes: `updated_at`; rewrote Fault 4 into the "client's file was already on the site" analysis; rewrote the Status section.
  - Ours (HEAD, updated_at 2026-10-25T22:19, status bundled) already contains verbatim: the whole new Fault 4 analysis up to "substituted a hand-drawn SVG for it", the `absences` paragraph, and the new Status text.
  - One paragraph that only the incoming side has: "Three separable defects: `promoteToSiteAsset` not registering what it promotes; ...". This is a same-section edit, and the later edit wins per fact (2e). Ours is the later revision of that section, and it replaces the paragraph with "What registration is actually worth — the fix follows from this." It explicitly says "Making `promoteToSiteAsset` register was the earlier reading and is rejected", and later records the operator decision to remove the registry entirely. Putting the paragraph back would bring back a diagnosis the ticket itself withdraws.
  - `updated_at`: ours is later.

## Incoming changes preserved

No code files in conflict. All of the incoming ticket edits are present in HEAD, except the one paragraph that a later edit of the same ticket deliberately superseded (above). Resolution nets to no diff vs HEAD — the commit is redundant, so the finalize step should skip it.
