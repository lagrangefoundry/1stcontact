---
uid: comment-b89e6fdc
id: COMMENT-5586
type: comment
title: Comment on request REQ-442
created_by: xgd
created_at: '2026-10-24T03:08:28.638998+00:00'
updated_at: '2026-10-24T03:21:09.102935+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-202e5585
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "5175a577-b4ec-4aad-acee-e817ef5805d7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0903e133-f78f-4463-ae48-42da66d7feb6-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T03:07:03.680216+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0903e133-f78f-4463-ae48-42da66d7feb6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T03:21:06.829126+00:00" -->
#### Claude
Let me check the worktree-setup memory and locate the relevant code.

Ticket is clear and in scope; branch cut. Now reading the three section renderers before changing them.

Reading the builder's opening-mode logic (`storyFirst`, `restore`) to work out the "a drafted site opens on View" part.

Board logic done; now the shared CSS and the View-on-open rule.

These four pin behaviour the ticket explicitly changes. Let me read them to update minimally.

Existing suites green. Now writing the REQ-442 UATs; checking how other tests do computed-style checks first.

All 7 new UATs pass. Confirming the Chromium check really ran, and that the tests go red without the fix.

Both failures are pre-existing on clean xgd-working (not mine). Now the commit/merge steps — checking my promotion-gate memory first.

Updating the ticket body first (preserving existing content), then committing.

`--append-body` takes a string; retrying that way.

Body updated. Now merge back: lock, merge xgd-working into the branch, then `xgd-merge`.

Merged. Now `move-to-free-coded` without `--version` (the gate bumps itself).

Both parts of REQ-442 are built and merged into `xgd-working`. The ticket is at `free_coded` (version 0.2.607, commits `a31301d6` plus the version bump), and the branch is cleaned up. The 7 new UATs pass, and 6 of them fail when the fix is taken out. The 7th, the `#show` link test below, also passes on the old code. The REQ-408, REQ-431 and REQ-433 suites pass too.

**Part one: quiet empty lines**
- "No questions yet", the story board's empty line and the comparison sites' empty line now share one style, `input-empty`: centred, the builder's muted grey, no emphasis. A Chromium check confirms the centring and the colour.
- The "Open each site and have a look around…" instructions only show once there is at least one site.
- The "Add a site you like" box and the Skip button stay.

**Part two: a clean first look**
- An empty section starts collapsed and its header reads "Questions (none yet)", "Stories (none yet)" or "Comparison sites (none yet)". The header switches to the count as soon as content arrives.
- New content doesn't open or close a section while the client is in Input. The expand rule applies the next time Input is opened.
- **A site with a first draft opens on View**, whatever mode it was last left in. A site with no draft still opens on Input.
- If the client follows a `#show=…` link (or any link into Input) before the site's plan has loaded, they stay where the link points.

**Decisions I made that you may want to check:**
- **Hiding "Your input" on an empty board.** The ticket says the summary lines "follow the same states", and that an empty board is three header lines. So I hide the "Your input" box while all three sections are empty. "How you can help" in the chat column is unchanged.
- **What counts as "empty" for Stories:** no notes, no headline offered or chosen, and no position card.
- **Edit also gives way to View.** On a drafted site, opening now shows View even if Edit was the last mode, not just Input or Looks.

**Existing tests I changed or left:**
- I updated three REQ-433/REQ-431 UATs that tested the behaviour this ticket replaces: the empty board, and the two "remembered mode restores as Input" tests. The restore tests now check the mode before the site's plan has loaded, so they still prove the old remembered mode is migrated to Input.
- REQ-408's `a_drafted_site_opens_where_the_client_left_it` still passes, but its name now describes the old behaviour. I've noted that in the ticket so reconciliation can rename it.

Two other UATs fail (`REQ-398_hover_focus…` and `REQ-393_loading_the_file…`). They fail the same way on a clean `xgd-working`, so this change didn't cause them.

The ticket now has an "As implemented" section below the original scope. It's ready for you to promote to `ready_to_reconcile` when you're happy.

<!-- xgd-chat-end -->