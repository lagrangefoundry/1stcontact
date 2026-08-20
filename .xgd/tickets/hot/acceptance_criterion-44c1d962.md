---
uid: acceptance_criterion-44c1d962
id: AC-1323
type: acceptance_criterion
title: A multi-file command reaches storage as exactly one whole change
created_by: xgd
created_at: '2026-08-20T05:10:23.349350+00:00'
updated_at: '2026-08-20T05:24:46.931226+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3f4a5f2b
  kind: behavior
  regression_only: false
---

## Criterion

A command that changes more than one thing reaches storage as exactly ONE change, carrying all
of it: the site definition, the pages written, the pages removed, the asset bytes written and
the assets removed.

Specifically:

- Renaming a palette entry — which rewrites the site definition and every page that referenced
  that entry — is one change, naming the definition and all affected pages together.
- Removing a page — which rewrites the navigation and deletes the page — is one change, naming
  the definition and the removed page together.
- Editing one page's copy is also one change, and it names *only* the page it altered; the
  other pages are absent from it.

An empty change is legal and does nothing.

## Verification

Drive each of the three commands above against a store that records what it was asked to do,
and assert: exactly one change was received per command; its contents are exactly the files the
command altered; and no additional change followed. This is a claim about the shape of the ask
rather than about the result — the resulting definition is identical either way, so only the
recorded call can show it.