---
uid: capability-19bef07f
id: CAP-59
type: capability
title: Text-Block Prose Column Geometry
created_by: xgd
created_at: '2026-07-13T20:31:18.784189+00:00'
updated_at: '2026-07-13T20:31:18.784189+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: text-block-prose-column-geometry
---

# Text-Block Prose Column Geometry

The geometry of a text-block's content column: how wide the prose column is
by default and how an author may narrow it.

A prose text block fills the standard content container by default (the same
full-width, gutter-aligned geometry as a services-grid), rather than a narrow
off-centre reading column. Authors may opt a block into a narrower reading
measure via the `contentWidth` child-cap dial — including on a plain
(panel-none) block — but the narrow measure is never the base.

Established by REQ-52 (commit 3cd464e7 fix1); the width mechanism was later
generalised by REQ-55's Tailwind content-width scale.
