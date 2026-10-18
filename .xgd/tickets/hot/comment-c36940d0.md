---
uid: comment-c36940d0
id: COMMENT-5477
type: comment
title: Comment on request REQ-407
created_by: xgd
created_at: '2026-10-18T00:48:55.533100+00:00'
updated_at: '2026-10-18T00:54:38.511521+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4becf2db
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0f40e6e1-3b09-41cd-99d9-27934dab718a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="7bf5c33b-e926-4f96-b6d8-7895bf7b51cc-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T00:47:24.408677+00:00" -->
#### You
Please make "Open in tab" a button consistent with View on your phone and Publish please

<!-- xgd-turn id="7bf5c33b-e926-4f96-b6d8-7895bf7b51cc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T00:54:36.604437+00:00" -->
#### Claude
Now the CSS.

Now the new FC UAT. Let me look at the BUG-131 test header to reuse its fixtures.

Tests pass; the one remaining REQ-391 failure also fails on clean xgd-working, so it predates this change. Running a broader builder sweep, then committing.

Checking those against the unchanged main checkout to see whether any are mine.

All 7 failures also fail on the unchanged main checkout — none are caused by this change. Committing and landing.

Before committing I'll fix the ticket body: the address now lives in `data-href`, and more suites changed than the body says.

"Open in new tab" is now a real button, matching View on your phone and Publish. It has the same look and font, still sits at the right-hand end of the toolbar, and has lost the purple link colour.

- **What it opens is unchanged:** the draft of the page you're looking at, in a new tab, in both View and Edit.
- **Tooltip:** hovering it shows the address it will open.
- **One thing lost:** because it's no longer a link, middle-click and "copy link" don't work on it any more. The tooltip is the way to see the address.

**Tests:**
- New tests check that it's a button, that clicking it opens the draft in a new tab, and that it's styled the same way as Publish.
- Seven older test files read the address from the old link, so I pointed them at the button instead (it keeps the address in `data-href`). Those tests check the same things as before.
- The builder tests show 7 failures. All of them (plus one more) also fail on the unchanged code, so none come from this change.

REQ-407 is merged into xgd-working and parked at `free_coded`, with the ticket body updated to describe the final result. Promoting it to reconcile is up to you. The dev site won't show the new button until you run `bin/deploy --env dev`.

The main changes are in `apps/control-app/src/builder/toolbar.js` (`openInNewTabAction`) and `apps/control-app/src/builder/builder.css`.

<!-- xgd-chat-end -->