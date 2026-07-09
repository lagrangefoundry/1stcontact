---
uid: acceptance_criterion-53a4b598
id: AC-498
type: acceptance_criterion
title: Per-site theme CSS folds in each module's component styles so rendered pages
  are fully styled
created_by: xgd
created_at: '2026-07-09T21:09:25.657351+00:00'
updated_at: '2026-07-09T21:09:25.657351+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
The generated per-site stylesheet includes each catalogued module's own component CSS (the raw `<style>` rules the modules define), not just the design-token `:root` custom properties. As a result, a rendered page carrying module class attributes (e.g. `hero`, `header__inner`, `surface-accent`) is fully styled — layout, spacing, and module appearance apply — rather than showing only base body font/colours.

## Verification
Render a site whose page uses styled modules (e.g. header/hero). Assert the produced `theme.css` contains class-selector rules matching the module classes emitted in the HTML (e.g. a `.hero` / `surface-*` / `header__*` selector), in addition to the `:root` token variables — so the served page is not unstyled.
