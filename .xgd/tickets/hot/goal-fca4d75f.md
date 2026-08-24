---
uid: goal-fca4d75f
id: GOAL-41
type: goal
title: Storage and access of reference sites and content
created_by: xgd
created_at: '2026-08-24T22:39:49.186395+00:00'
updated_at: '2026-08-24T22:39:49.186395+00:00'
completed_at: null
last_field_updated: created_at
status: concept
fields:
  provenance: discovered
  workstream: false
---

Open question: how captured reference sites and their content are stored, and how the AI reaches them.

Context. DOC-13 (Reference Capture Model) specifies HOW a reference is captured -- rendered-only through a browser driver, navigate live then intercept-cache every response, query computed signals, copy verbatim, colours and fonts and asset bytes exact. It specifies the capture, not the long-term storage or the access path.

Today three captured references sit on the filesystem under storage/references (faelan.com, gigabytealchemy.ai, joyfulculinarycreations.com). DOC-5 says filespace is a seed representation and not a permanent store, with D1 the canonical home and R2 for asset bytes -- so these need a destination.

The access side is the harder half and where it meets knowledge management: DOC-15 makes the reference corpus dual-purpose, both the module-gap source for the framework AND the taste library the AI reasons from. A taste library the AI cannot query is not a taste library.

To settle: canonical store for reference bundles, retention and refresh policy, whether references are system-level or can be site-scoped, and the query surface the AI uses.