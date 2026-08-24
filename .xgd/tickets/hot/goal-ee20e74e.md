---
uid: goal-ee20e74e
id: GOAL-37
type: goal
title: Asset and background upload
created_by: xgd
created_at: '2026-08-24T22:39:14.418289+00:00'
updated_at: '2026-08-24T22:39:14.418289+00:00'
completed_at: null
last_field_updated: created_at
status: concept
fields:
  provenance: discovered
  workstream: false
---

Let the operator bring their own images, backgrounds and assets into a site, and make the AI aware of them.

Two halves: the mechanical one (get bytes in, store them, surface them in the editor) and the intelligent one (the AI knows what an asset IS and can reason about using it).

Storage per DOC-5: R2 holds uploaded images, generated images and customer assets; D1 holds the structured records that point at them.

Evidence: no upload path in the repo today. The drag hits in the L1 shade and edit modules are editor drag-handles, not file upload.

Provenance is discovered rather than planned -- DOC-4 and DOC-5 name asset storage as substrate, but drag-and-drop upload as a builder capability is not in the MVP scope list. It surfaced from building.

Children: drag and drop upload (UI and storage), KB access and awareness.