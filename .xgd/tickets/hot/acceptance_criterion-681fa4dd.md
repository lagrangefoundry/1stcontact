---
uid: acceptance_criterion-681fa4dd
id: AC-939
type: acceptance_criterion
title: Censusing a site reports its distinct colour literals with use counts, its
  distinct RGB ignoring alpha, and its alpha families, and changes nothing
created_by: xgd
created_at: '2026-08-06T21:07:14.060835+00:00'
updated_at: '2026-08-07T18:44:46.166032+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-5e7eb0c5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Asking for a stored site's colour census produces a human-readable report
carrying, for that site:

- the count of distinct colour literals and the count of distinct RGB values
  ignoring alpha, where the RGB count is never greater than the literal count;
- one line per distinct literal, ordered most-used first, giving the literal,
  its use count across the site's pages, and — when it is not fully opaque —
  its opacity;
- an alpha-families section listing every RGB value used at more than one
  opacity together with those opacities, present only when the site has at
  least one such family.

The census is read-only: the site's stored definition is byte-identical before
and after.

A site with no colour literals at all is a valid census, reporting zero
distinct colours and zero distinct RGB rather than failing.

## Verification

Run the census against a stored site whose colours are known (one carrying an
RGB value used at several opacities, and one carrying none), and assert the
reported counts, the per-literal ordering and counts, the opacity annotations,
and the presence or absence of the alpha-families section. Hash the site's
definition files before and after to confirm the command wrote nothing.