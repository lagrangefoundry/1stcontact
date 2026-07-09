---
uid: acceptance_criterion-900c206c
id: AC-469
type: acceptance_criterion
title: Slug shot renders, serves, and screenshots the served page as a non-blank PNG
  with assets resolved
created_by: xgd
created_at: '2026-07-09T20:20:00.921388+00:00'
updated_at: '2026-07-09T20:20:00.921388+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3ae5b34e
  kind: behavior
  regression_only: false
---

## Criterion
Running `1c shot <slug>` for a site whose page references `/assets/` images produces a PNG file at the resolved output path. The PNG is non-blank (byte length > 0 and larger than an empty/all-background image), and the site's referenced `/assets/` images appear rendered in it rather than missing. The command achieves this by rendering the chosen source, serving it over a local loopback address, and screenshotting the served page (so asset URLs resolve over HTTP).

## Verification
Run `1c shot` in slug mode against a fixture site that references a bundled asset, using an injected fake browser driver. Assert a PNG file exists at the returned output path, its byte length is non-zero, and the URL that was screenshotted is the loopback served URL (evidence the served page — not a filesystem path — was captured, which is what allows the assets to load).
