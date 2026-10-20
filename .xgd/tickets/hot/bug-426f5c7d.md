---
uid: bug-426f5c7d
id: BUG-234
type: bug
title: 'Working line: say "The consultant is …", not "Your consultant is …"'
created_by: EPIC-19
created_at: '2026-10-20T03:31:07.784947+00:00'
updated_at: '2026-10-20T03:37:00.180011+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  severity: low
  priority: medium
  story_points: 1
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-926eed03
  commits:
  - working_sha: 7e7f880b67e9d0394c8716fbb475f0be323d726d
    reconcile_sha: null
    main_sha: null
  - working_sha: 859559b0e4f0eb708625bd1bd9b8e5c30c0d203f
    reconcile_sha: null
    main_sha: null
  version: 0.2.549
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


## What changed (implementation)

- `tools/generate/src/cli/ai/slow-tools.json`: `"unnamed": "The consultant"`, and its
  `about` note now says the line reads "The consultant is …" ([[BUG-234]]). Every
  one-to-one working line (slow-tool step lines and the Delegate turn line) takes
  its subject from this one value, so nothing else needed changing.
- No other client-visible "Your consultant" existed. The REQ-402 comment in
  `apps/control-app/src/builder/config.js` that called "Tell the consultant" an
  exception to "your consultant" was reworded — it is no longer an exception.
- UATs: BUG-205 (one-to-one case renamed `…says_the_consultant…`, expects
  "The consultant is capturing …"), BUG-215 fixture strings, REQ-390 comment updated.
  New `tests/test_UAT_FC_BUG-234_working_line_says_the_consultant.workers.test.ts`:
  through `/api/ai/session` + `/api/ai/prompt`, every working frame in a one-to-one
  turn begins "The consultant is ", and contains neither "Your consultant" nor either
  configured group-chat member name.