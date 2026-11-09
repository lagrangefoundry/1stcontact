---
uid: comment-cd8aadd1
id: COMMENT-8034
type: comment
title: Comment on bug BUG-388
created_by: xgd
created_at: '2026-11-08T21:05:23.659219+00:00'
updated_at: '2026-11-08T21:36:56.220454+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-630b0ab0
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e578ac55-cdc0-4886-8370-4496442e0fc0",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b54ae573-3b0a-4f4e-a4d0-d576b78c121b-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T21:04:41.820833+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="b54ae573-3b0a-4f4e-a4d0-d576b78c121b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T21:36:52.975682+00:00" -->
#### Claude
Worktree cut; now mapping the Legal pane code before editing.

Now the server side: the legal routes and overview shape.

Now the overview shape and the seed/sections code in client-legal.ts.

Read the seed path; next the admin route and the CLI command, then I'll start editing.

Mapping done. Starting the server edits in `client-legal.ts`.

Editing `client-legal.ts` now: removing owner-section writes, adding the platform-sections replace and a `custom` text field.

Server routes done. Now the admin route and the `1c legal platform-sections` command.

Server side done. Now rewriting the pane's document view (`openClientDocument`) for standard/custom with confirmations and the LF rich editor.

Now the CSS: assistant pane as a height-chain link (chat box at the bottom), plus the about bar and editor.

Pane done. Now the Legal assistant's priming and the revision email sentence that mention adding sections.

Code edits are in. Setting up the worktree's node_modules so I can typecheck and run the suites.

Typecheck clean (two pre-existing errors in unrelated files). Running the existing legal suites to see what my change breaks.

Expected failures — they pin the old pane. Reading those tests to update them to the new design.

Next: the workers-side tests. Reading the existing REQ-669 sections suite as the model.

Writing the BUG-388 jsdom pane suite now.

jsdom suite passes (7/7). Now the workers suite: refused section routes and `platform-sections`.

Workers suite passes (6/6). Now a node test for the CLI side (`platformSections` from DOC-120 and what the command posts).

CLI test passes. Now updating the REQ-665/666/669 suites that pinned the old pane and owner-section writes.

Now the jsdom pane suites (REQ-665, REQ-666, REQ-669).

One timeout: `readDocTickets()` is slow under parallel load and I call it twice. Reading once with a longer timeout.

Node suites green. Now the workers legal suites.

Legal suites green. Checking suites that pin priming/surface text and message seeds.

Some failures — need a baseline to tell mine from pre-existing. Collecting failing files first.

While that runs, reviewing my diff for leftovers.

Waiting for the regression batches to finish.

Still running; I'll wait for the monitor notification.

18 failing files, mostly unrelated-looking (builder origin, contacts, replay). Baselining them with my changes set aside.

No failure is new: all 39 fail on the base too. Restoring my work.

Now the workers files from the affected list.

Baseline those 15 the same way.

No regressions: every workers failure also fails on the base. Now the ticket body, then commit and merge back.

Ticket body appended. Rewording the WIP commit properly, then the merge-back sequence.

Main checkout is clean now (BUG-387's edits have landed). Merging back.

Fast-forwarded. Now the free_coded gate.

BUG-388 is built and merged into xgd-working, and the ticket is at `free_coded` (commits `5eb8eb93…` and `7c15f49a…`, version 0.2.835, 5 points). It wasn't a duplicate; no other open ticket covers this. All the new and updated legal suites pass, and none of the wider suites I ran has a new failure. The ticket body now has a section describing what was built.

**Paperwork → Legal, for every business including 1st Contact**
- The "Sections, and what added them" list, the "Add your own sections" wording and the always-open edit box with Preview are gone.
- **Standard document:** opens on the current text, read-only, under "This is 1st Contact's standard privacy notice. We keep it up to date for you, and it is filled in from your business details." with **[Use custom notice]** ("terms" for the terms documents). A confirmation (Cancel | OK) explains the consequences; OK opens the editor. Nothing is saved until Save.
- **Custom document:** "You're using your own privacy notice. We no longer update it for you." with **[Use standard notice]**, also confirmed. The custom text is kept, and choosing "Use custom" again starts from the last saved custom text.
- **Editor:** the LF `mountRichEditor`. The word "markdown" no longer appears anywhere in the Legal pane.
- **Cancel** asks first (Keep editing | Discard changes) and discards back to the last save.
- **Save** says the change goes live immediately and has an unticked "affects people" checkbox, which drives the existing REQ-666 material-change behaviour.
- The document status label now reads **Standard | Custom** instead of "Edited by you".
- The Legal assistant's chat now fills its pane, so its text box sits at the bottom like Settings'. That one is checked by a jsdom test against the stylesheet, not measured in a real browser.

**Added sections: 1st Contact only**
- The section routes now refuse every business, 1st Contact included (403), and the code that let owners write sections is deleted.
- New command: `1c legal platform-sections --env dev|production [--wording-only]`. It replaces 1st Contact's added sections with DOC-120's current ones and writes one new version of each document whose text changes. Changes count as material unless `--wording-only` is given, and the legal pages publish straight away. A document 1st Contact has switched to custom is left alone.
- The Legal assistant's instructions, the revision email and the revision notice no longer mention adding sections.

**Tests:** 15 new BUG-388 tests (7 for the pane, 6 for the routes and the platform command, 2 for the CLI). I updated the REQ-665, REQ-666 and REQ-669 tests that relied on the old pane or on owners writing sections. Around 200 related test files show failures, but each one also fails on the code before my change, so none is mine.

**Things you should know:**
- **Links in custom text:** once the rich editor has loaded, it has no link or table support. A link in custom text becomes plain text if that part is edited. Until it loads (or if it can't load), the editor is a plain text box.
- **`1c legal platform-sections` hasn't been run against any environment.** It's yours to run after a DOC-120 change.

I added one memory note: `readDocTickets()` takes about 60 seconds when suites run in parallel.

<!-- xgd-chat-end -->