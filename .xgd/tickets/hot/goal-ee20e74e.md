---
uid: goal-ee20e74e
id: GOAL-37
type: goal
title: Asset and background upload
created_by: xgd
created_at: '2026-08-24T22:39:14.418289+00:00'
updated_at: '2026-09-03T02:33:12.418123+00:00'
completed_at: null
last_field_updated: body
status: concept
fields:
  provenance: discovered
  workstream: false
  children:
  - goal-4bfe7535
  - goal-a66b9250
---

Let the operator bring their own images, backgrounds and assets into a site, and make the AI aware of them.

Two halves: the mechanical one (get bytes in, store them, surface them in the editor) and the intelligent one (the AI knows what an asset IS and can reason about using it).

Storage per DOC-5: R2 holds uploaded images, generated images and customer assets; D1 holds the structured records that point at them.

Provenance is discovered rather than planned -- DOC-4 and DOC-5 name asset storage as substrate, but drag-and-drop upload as a builder capability is not in the MVP scope list. It surfaced from building.

Children: drag and drop upload (UI and storage), KB access and awareness.

## Evidence as of 2026-09-02

The previous body said *no upload path in the repo today; the drag hits in the L1 shade and edit modules are editor drag-handles, not file upload*. That is no longer true. Both halves were built across 09-01 and 09-02, and the intelligent half arrived with the mechanical one rather than after it -- ingestion writes an indexed material ticket, so an uploaded file is a corpus member the assistant can reason about, not just bytes in a bucket.

| Ticket | What | Status |
|---|---|---|
| REQ-161 | The Library tab: list-detail over the client material, and the drop-to-upload overlay | bundled |
| REQ-163 | Ingestion: from a dropped file to an indexed material ticket | bundled |
| REQ-172 | Library detail: render documents inline, with an expand-to-modal reader | ready_to_reconcile |
| REQ-173 | Material description: a digest in the body, the full text in a comment | free_coded |
| REQ-176 | Library: a type icon, a one-line row, and the wording clients actually read | ready_to_reconcile |
| REQ-181 | Library under one-site-per-business: badge the exception, not the rule | draft |
| BUG-41 | An uploaded .md is stored undescribed because the browser sends no content type | ready_to_reconcile |
| BUG-42 | Markdown shows as source on first load, and never renders in the Library | ready_to_reconcile |
| BUG-45 | A file dropped on Put it on the site is unusable to the assistant | ready_to_reconcile |
| BUG-47 | The On this site pill marks where a file was uploaded, not where it is used | ready_to_reconcile |

The bug cluster is the tell that this was genuinely exercised rather than merely written: BUG-41, BUG-42, BUG-45 and BUG-47 are all the shape of defects you only find by dropping real files into a real Library and watching what the assistant then fails to do with them.

This is requirement (b) of the 2026-09-05 demonstrable-system milestone on the class-cohort goal, and it is substantially met.