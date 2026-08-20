---
uid: acceptance_criterion-f14ffe78
id: AC-1230
type: acceptance_criterion
title: Changing an entry's colour repaints every use of it at every position in its
  family, from one edit, touching no page
created_by: xgd
created_at: '2026-08-20T01:19:42.363264+00:00'
updated_at: '2026-08-20T01:50:37.255730+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ee073693
  kind: behavior
  regression_only: false
---

## Criterion

Changing an entry's colour is a single edit that repaints **every** use of that colour,
including uses at lighter and darker positions within its family, and moves nothing else.

Specifically:
- After the change, the rendered site shows the new colour everywhere the entry was used —
  at each position in the family, derived from the new colour — and shows the old colour nowhere.
- No page in the site definition is rewritten by the change; only the palette entry moves.
- The result of the change reports how many uses it repainted.
- Naming an entry the palette does not declare is refused as *not found*, names the site and the
  entry, and writes nothing.

## Verification

Seed a site referencing one entry at three positions (as stored, lighter, darker) plus other
entries. Change that entry's colour and assert: the rendered page contains the three colours
derived from the new value and none derived from the old; the page files are byte-unchanged;
the reported count matches the number of references. Then attempt to change an entry name the
palette does not declare and assert the operation fails as not-found and the site definition is
byte-unchanged.