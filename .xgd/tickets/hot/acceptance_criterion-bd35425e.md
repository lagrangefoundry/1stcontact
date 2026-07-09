---
uid: acceptance_criterion-bd35425e
id: AC-513
type: acceptance_criterion
title: markdown GFM-alert blockquotes render as semantic left-bar callouts at medium
  weight
created_by: xgd
created_at: '2026-07-09T22:11:22.144263+00:00'
updated_at: '2026-07-09T22:11:22.144263+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
In any `markdown` content field, a blockquote opened with a GFM-alert marker — `> [!<role>] …` or `> [!<role> italic] …`, where `<role>` is a closed palette role (e.g. `accent`, `secondary`, `primary`, `muted`, `neutral-cool`, `accent-light`, `accent-deep`) — renders as a semantic left-bar callout: an accent border keyed to `--color-<role>`, an indent, medium (500) font weight, and italic when the `italic` flag is present. The marker text itself is consumed (never shown). A blockquote whose marker names an unknown role is left as an ordinary blockquote (no silent mis-styling). The callout CSS is assembled into the site stylesheet.

## Verification
Render a markdown body containing `> [!accent] …` and `> [!secondary italic] …`; assert each renders as a callout blockquote carrying its role's left-bar and medium weight (and italic for the second), with the `[!…]` marker text removed. Render a blockquote with an unrecognised role marker and assert it is left as a plain blockquote.
