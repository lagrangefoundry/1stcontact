---
uid: report-3dad5aef
id: REPORT-1465
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-06T20:38:48.156300+00:00'
updated_at: '2026-08-06T20:38:48.156300+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-0385746c
  plan_item_index: '3'
---

Mutations applied. The duplicate `AC-716` row in the children listing is an index artifact of the branch worktree (one stale canonical entry plus the branch entry for the same UID) — the same pattern appears on the stories mutated in calls 1 and 2, and `xgd ticket get` resolves to a single ticket.

```
Upgrade mutations applied for plan item 3 of 6

Target Stories: story-c490f1cf
Primary Story UID: story-c490f1cf
Stories Modified: 1
ACs Modified: 1
ACs Added: 5
ACs Removed: 0

tickets_modified:
  stories:
    - "story-c490f1cf"   # STORY-80
  acceptance_criteria:
    modified: ["acceptance_criterion-1eaa93b8"]   # AC-716
    added:
      - "acceptance_criterion-1663c20c"   # AC-928 arbitrary-size palette; axes take literal or reference
      - "acceptance_criterion-ff8376c1"   # AC-929 dangling reference fails validation, no fallback
      - "acceptance_criterion-bec4d585"   # AC-930 alpha rides on the reference
      - "acceptance_criterion-5ab42ca8"   # AC-931 resolve once at load; authoring form invisible
      - "acceptance_criterion-9f1e7baf"   # AC-932 retrofitted palette materially smaller, colour-lossless
    removed: []

Progress: 3 of 6 plan items complete
```

What changed and why:

- **STORY-80** title no longer says the named overlay is "parked in L2" — REQ-114 lands it in L1 for colour. Body now carries the two-form colour model (literal base / palette reference overlay), the site-level arbitrary-size palette with opaque entries and named steps, alpha-on-the-reference, dangling-reference-is-a-validation-failure, and single-pass resolution at the load boundary.
- **AC-716** re-stated: the literal is the *base* of the model rather than the only admissible form, with length/geometry/radius explicitly still literal-only.
- Technical Notes record two things the code shows that the intent's wording does not: REQ-79 principle #2 ("no theme-role indirection IN L1") is **superseded for colour only** by DOC-23 §5.3's measured evidence; and REQ-114 AC-6's "all four sites retrofitted" is true only for the two carrying L1 pages — `1stcontact` and `harbor-cafe` hold pre-L1 module pages with no L1 colour axes, so they carry no palette (verified: 0 entries, 0 hex literals in their page JSON, `theme.palette` dropped from all four).
- Left out of scope deliberately (owned by later plan items): the legacy token-palette retirement, `--color-*` removal and document-level `textColor` (item 4 / STORY-83), and the `1c colors` census-and-retrofit command (item 5). AC-932 asserts the *outcome* of the retrofit, not the tool.
