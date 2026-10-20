---
uid: bug-426f5c7d
id: BUG-234
type: bug
title: 'Working line: say "The consultant is …", not "Your consultant is …"'
created_by: EPIC-19
created_at: '2026-10-20T03:31:07.784947+00:00'
updated_at: '2026-10-20T03:35:08.659356+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  severity: low
  priority: medium
  story_points: 1
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-926eed03
---

## Symptom

The working line and step lines shown while the consultant is busy read
**"Your consultant is …"** — e.g. *"Your consultant is building your home page ·
about 5 min · 2:14 so far"*. The operator wants **"The consultant is …"**.

## Decision (operator, 2026-10-19)

> The progress reports "Your consultant is ..." Please replace with "The consultant.."

This revises BUG-205's choice of "Your consultant" for the one-to-one working
line. It is consistent with REQ-402's "Tell the consultant…" exception and with
DOC-66's rule that the AI has no personal name in a one-to-one conversation —
only the determiner changes. DOC-66's note recommending "your consultant" for
running copy should be updated to match (doc change, no ticket needed).

## Where it lives

- `tools/generate/src/cli/ai/slow-tools.json` — `"unnamed": "Your consultant"`,
  read as `WORKING_UNNAMED` in `cadence-core.ts:147`. This is the single source;
  change it to `"The consultant"` and update the `about` note.
- Tests pinning the old wording:
  - `tests/test_UAT_FC_BUG-205_working_line_names_no_one.workers.test.ts`
  - `tests/test_UAT_FC_BUG-215_working_line_and_steps.test.ts`
  - `tests/test_UAT_FC_REQ-390_stages_and_working_on_the_wire.workers.test.ts`
- Check for any other client-visible "Your consultant" (progress, step lines,
  notices) and change them to "The consultant" too; the label is written once,
  not inline.

## Not in scope

- Group-chat mode keeps the configured member names from `group-chat.json`.
- Running prose the consultant itself writes is not this ticket.

## Test plan

Update the three UATs above to expect "The consultant", and add a UAT
(`test_UAT_FC_<ID>_*`) asserting that in one-to-one mode the working line begins
"The consultant" and contains neither "Your consultant" nor any configured
member name.