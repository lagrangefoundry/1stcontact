---
uid: acceptance_criterion-557026d4
id: AC-936
type: acceptance_criterion
title: The non-colour token groups validate and emit exactly as before the colour
  cut
created_by: xgd
created_at: '2026-08-06T20:52:26.292936+00:00'
updated_at: '2026-08-09T05:41:45.983819+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Retiring the colour group leaves the **rest of the token surface untouched**. The
theme tokens a site declares still cover typography (families, size scale, weight
scale, line-height scale, tracking), spacing, radius, shadow, container widths and
breakpoints; each still validates with the same shape it had before, and the
generated theme stylesheet still declares the corresponding custom property for
every slot in each of those groups.

The generator's slot-filling behaviour is unchanged for them: a site supplying
only some slots still gets the full surface, with every omitted slot filled from
the defaults, so the emitted stylesheet always covers the whole non-colour token
vocabulary regardless of how sparse the site's theme is. Only the colour group —
which had no non-colour slot to fill — is absent.

## Verification
Generate the theme stylesheet from the default token surface and assert it
declares a property from each surviving group (font family, font size, font
weight, line height, spacing, radius, shadow, container, breakpoint), and assert
the total declared-property count matches the full non-colour surface. Generate
it again from a theme supplying a single spacing slot and observe the override
present, an omitted slot in the same group default-filled, and a slot in another
group default-filled. Validate a theme declaring every surviving group and
observe acceptance.