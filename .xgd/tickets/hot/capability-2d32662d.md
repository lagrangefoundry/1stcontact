---
uid: capability-2d32662d
id: CAP-94
type: capability
title: 'Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata
  & Generated Images'
created_by: xgd
created_at: '2026-08-10T09:32:11.897403+00:00'
updated_at: '2026-08-10T09:32:11.897403+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: Site Authoring Beyond The Element Tree
---

Everything a real site carries that is not its page element tree, reachable through the site control surface and the command line: the site's structured settings (palette families, theme groups, navigation entries), instances of vetted behaviour components on a page, per-page search metadata, and images the assistant composes itself.

Settings are written as typed objects and merged at every depth so naming one setting cannot silently delete its siblings. Components are instantiated from a closed catalog, validated against each behaviour's own contract, and arrive with a vetted default look derived from their configuration — the result being ordinary page elements, refined afterwards through the element-tree write path. Page metadata is merged and reaches the rendered document. A composed drawing is accepted or refused whole by a validator closed by construction, under its own grantable capability, because it is the one image in a site that no person vouched for.
