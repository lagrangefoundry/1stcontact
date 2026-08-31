---
uid: report-53ab3092
id: REPORT-2915
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-31T11:55:11.521280+00:00'
updated_at: '2026-08-31T11:55:11.521280+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-b3b7c399
  plan_item_index: '8'
---

Mutations applied. Verified: `git status` is clean (ticket writes auto-commit; no runtime code touched).

```
Upgrade mutations applied for plan item 8 of 11

Target Stories: story-d34eccd8
Primary Story UID: story-d34eccd8
Stories Modified: 1
ACs Modified: 9
ACs Added: 2
ACs Removed: 4

tickets_modified:
  stories:
    - "story-d34eccd8"
  acceptance_criteria:
    modified: ["acceptance_criterion-27815e0f", "acceptance_criterion-5312d7ac",
               "acceptance_criterion-fd1af685", "acceptance_criterion-e7bd3c3a",
               "acceptance_criterion-fc87f616", "acceptance_criterion-fda70dbc",
               "acceptance_criterion-a136b7e4", "acceptance_criterion-55611f33",
               "acceptance_criterion-08d88be5"]
    added:    ["acceptance_criterion-4690eca9", "acceptance_criterion-48d1ea8e"]
    removed:  ["acceptance_criterion-1fc3d687", "acceptance_criterion-3745124c",
               "acceptance_criterion-923670bf", "acceptance_criterion-536a6df9"]

Progress: 8 of 11 plan items complete
```

**What changed and why**

Story `STORY-95` retitled *"Serve a published site: a URL names a site, the revision record says which bytes"*. The shape survives — one multi-tenant server, grammar rejects before it reads, opaque failure, read-only — but the authority moved from a per-site index object beside the bytes to the revision log in the platform database, read behind the seam `site-store.ts` already had.

- **Authority (AC-905)** — rewritten around the revision record. It absorbs the surviving half of the removed store-tree AC: keys are composed from server-side constants plus the record's own value, so the only untrusted component is the slug the grammar already constrained.
- **Live (AC-903, new AC-1423)** — derived as the highest revision in the log; winding the log back returns the earlier revision to service with both snapshots untouched. Resolution goes through the slug claim because the public URL carries no account.
- **Removals** — the preview addressing form (AC-902), its no-index requirement (AC-910), the servable/non-servable tree confinement (AC-927) and the reserved-segment deploy gate (AC-914). Each is archived with a change comment saying what went and where its surviving half landed. The tree AC in particular is unfalsifiable now: the deploy command that was the second tree's only writer is deleted, which the intent states outright.
- **New AC-1424** — the builder's published view redirects here rather than serving those bytes, with the never-published-shows-a-404 cost stated.

**Three Reconciliation Decisions** recorded in Technical Context (dated 2026-08-31), all places the intent was silent and the code is definite: a record vouching for absent bytes answers not-found rather than an error; the frozen definition shipped beside a revision's rendered output is unaddressable; and published responses carry no crawler directive at all — asserted positively, since a stray one surviving its deleted channel would silently deindex every customer site.

No code contradicted the intent, so nothing is flagged for `fix_uat_coverage`.
