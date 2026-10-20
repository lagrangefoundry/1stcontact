---
uid: bug-c0f53ca7
id: BUG-238
type: bug
title: 'Layout check: flag a too-small logo or business name, and headings not attached
  to their text'
created_by: EPIC-19
created_at: '2026-10-20T23:26:22.125248+00:00'
updated_at: '2026-10-20T23:26:22.125248+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: medium
  priority: high
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## Symptom (operator, 2026-10-20)

1. "The consultant is CONSTANTLY making the site name and logo too small" —
   raised on every test site; the priming's novice checklist names it, and it
   still happens.
2. Headings sit equally spaced between the text above and below them, so they
   float instead of attaching to their paragraph.

Both are craft defaults builders get wrong, and a priming reminder hasn't held.
Per REQ-415's pattern, the host measures them.

## Fix

Extend REQ-415's layout check (desktop and phone; reported in the `Delegate`
result and `describe_page` warnings; a finding means the build isn't done):
- **Brand too small:** the header's logo image renders shorter than ~48px on
  desktop or ~36px on phone, or the business name in the header is not clearly
  its largest text (less than ~1.25× the navigation link size). Thresholds are
  configuration, not constants in code.
- **Heading not attached:** a heading whose space to the following text is not
  clearly smaller than its space to the preceding content (below ≥ ~0.75 ×
  above). Deliberate exceptions are rare; the consultant can explain one away.
- **Builder defaults:** builder guidance gives starting sizes for the header
  logo and name, and says to group a heading with its text more tightly than
  the gap before it. (The structural fix for spacing is the L1 rhythm REQ;
  this catches existing pages and anything built before it.)

## Test plan
- Layout-check fixtures: a 28px header logo, a header name smaller than the nav
  links, and an evenly spaced heading/paragraph/heading stack each produce the
  named finding at the stated width; a correctly sized header and a tightly
  attached heading produce none.
- Thresholds read from configuration.
