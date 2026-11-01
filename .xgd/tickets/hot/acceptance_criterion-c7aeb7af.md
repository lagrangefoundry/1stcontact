---
uid: acceptance_criterion-c7aeb7af
id: AC-2081
type: acceptance_criterion
title: The reference is titled with the captured page's own title, and its body is
  derived from the capture record and screenshot and opens with a link to the captured
  site
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T01:51:20.084945+00:00'
updated_at: '2026-11-01T01:51:20.084945+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
The `reference` ticket written for a capture has the following title and body.

**Title.** The captured page's own `<title>`, trimmed, as recorded in the capture record's `title`. When that is blank or absent, the captured host is used instead.

**Body.**
- It is derived from the capture record plus the screenshot.
- Its first line is a markdown link `[<title>](<captured url>)` to the captured address.
- It always includes the facts measured from the capture record (palette, type treatment, section count).
- Prose describing the site is added when a describer is available and a screenshot is present.
- Without a describer, or without a screenshot, the body still opens with the link and carries the measured facts. It states that the site was captured but not described, and the ticket's description status records why (e.g. `no_describer`, `no_text`).

## Verification
Adopt a fixture bundle whose capture record has `title: "Green Oven Bakery"`:
1. Assert the ticket title is `Green Oven Bakery`, the body's first line is `[Green Oven Bakery](<url>)`, and the body mentions the palette.
2. Repeat with `title: "  "`. Assert the title is the host.
3. Repeat with no describer. Assert the link and measured facts are still present and the description status is `no_describer`.
