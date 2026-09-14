---
uid: report-bf4de964
id: REPORT-4251
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-14T07:08:37.483403+00:00'
updated_at: '2026-09-14T07:08:37.483403+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-8e1807f6
  plan_item_index: '8'
---

Plan item 8 applied. Verification: the five new ACs were written against the landed code — `apps/control-app/src/builder/reader.js` (the `readerKind` table, the bounded `max-height: 320px` window in `builder.css:1057`, the expand-to-`createModalShell` path, the shared-state repaint, the `AbortController` destroy), `library.js` (`preview()` keeping the download link in every case, `paintDescription`'s keep-the-element/replace-the-children rule and its `MutationObserver`), `material.ts:421,460,697` (one resolved type written to both ticket and attachment, and `rowOf` re-resolving for rows predating the field), and the three FC suites. No runtime code was touched.

Two silences in REQ-172 were formalized as reconciliation decisions rather than left as hedges: the "Reading…" state between request and arrival, and the expanded window closing when the detail is replaced (the ticket states the latter as an implementation consequence, not as something a client observes).

```
Upgrade mutations applied for plan item 8 of 10

Target Stories: story-1500b111
Primary Story UID: story-1500b111
Stories Modified: 1
ACs Modified: 2
ACs Added: 5
ACs Removed: 0

tickets_modified:
  stories:
    - "story-1500b111"        # STORY-144, story_kind feature -> upgrade
  acceptance_criteria:
    modified:
      - "acceptance_criterion-c3e5522d"   # AC-1717
      - "acceptance_criterion-bf0d2b7c"   # AC-1718
    added:
      - "acceptance_criterion-4deb8be1"   # AC-1811 reader chosen by content type
      - "acceptance_criterion-ba0d9e63"   # AC-1812 expand-to-modal
      - "acceptance_criterion-74b13779"   # AC-1813 content type on the row
      - "acceptance_criterion-ff860cf5"   # AC-1814 one sanitizing seam
      - "acceptance_criterion-cb34e0ec"   # AC-1815 cold-load repaint
    removed: []

Progress: 8 of 10 plan items complete
```

Out of scope and left unchanged: AC-1714, AC-1715, AC-1716, AC-1719, AC-1720, AC-1721, AC-1722, AC-1723, AC-1724 (the list, filters, tenancy, file route and re-indexing criteria are untouched by this item); STORY-104's transcript-ordering half of BUG-42 (plan item 9); STORY-140/STORY-141's ingestion criteria (plan item 7, already applied).
