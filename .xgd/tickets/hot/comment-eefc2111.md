---
uid: comment-eefc2111
id: COMMENT-5861
type: comment
title: Comment on bug BUG-318
created_by: xgd
created_at: '2026-10-31T18:23:01.929875+00:00'
updated_at: '2026-10-31T18:30:37.075868+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-7fbfef2c
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3c7eb181-7ab9-413e-877f-02388333ca8b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="9b537264-1766-456a-879d-dc5b360b0038-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T18:21:49.608690+00:00" -->
#### You
When I trigger an invite after I have hit send and it has apparently worked the window stays open and the CTA to send remains active or appears to. Assuming action was successful the modal should close.

This is also true for Provision a business - after the business is provisioned the model should close

The default business name is the name of the account holder - this doesn't really make sense. The default name should be "Unnamed business" with a suffix number if necessary incremented to make the default name unique. Please.

<!-- xgd-turn id="9b537264-1766-456a-879d-dc5b360b0038-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T18:30:33.685467+00:00" -->
#### Claude
Now let me find the invite and provision modals.

Reading the provisioning route on the Worker to decide where the default name belongs.

Found the provisioning route; now checking the existing `availableBusinessName` helper (onboarding's unique-default logic) to reuse it.

Still working: checking which existing invite tests read the report after an all-successful send, since closing on success would remove it.

Scope is clear. Writing the ticket body, then cutting a branch.

Now editing `people.js` in the worktree.

Now the UAT file, modelled on the REQ-450 harness.

Now updating the two superseded test expectations and writing the BUG-318 UAT.

BUG-53's two failures are pre-existing on clean xgd-working (classes I didn't touch). Fixing the REQ-186 refusal test, whose double never actually refused:

Remaining failures are pre-existing (`timeline-show` fails on clean xgd-working; BUG-58 is the worktree's missing `generated/` artifact). Committing.

Committed. Now the merge-back and promotion loop.

All three are fixed and merged into xgd-working. BUG-318 is at `free_coded` (commits `a9179a22` and the version bump `e4e85199`, 0.2.713).

**Invite:** if the invite went to every contact you ticked, the dialog now closes. The list of who it was sent to now appears next to the Invite button instead of inside the dialog. The Invite button is greyed out until you tick contacts again. If anyone was refused, the dialog stays open showing who and why, as before.

**Provision a business:** after a successful provision, the dialog closes. The person's pane redraws with the new business listed and a line saying "X is provisioned." The first-draft test option closes the same way once its copy finishes. If provisioning fails, or a copy stops partway, the dialog stays open with the error and "Provision again to continue the copy."

**Default name:** the name field now starts as "Unnamed business" instead of the person's own name. If that name is taken it uses the first free one of "Unnamed business-1", "-2", and so on. This is the same suffix scheme and name comparison the server already uses, so the suggested name won't be refused as a duplicate. The suffix is "-1" rather than " 1" to match that scheme. You can still edit the name, and the first-draft test still swaps in the source business's name.

**Testing:** the new tests in `tests/test_UAT_FC_BUG-318_dialogs_close_on_success.test.ts` pass, along with the related invite, contacts and first-draft dialog tests. I had to change three older tests that expected the old behaviour:
- One closed the invite dialog by hand; it now closes itself.
- One checked refusals, but its fake server never actually refused anyone. It only passed because the dialog never closed, so I made it really refuse.
- One read the progress bar after the copy finished; it now checks that the dialog closed.

Two style checks (REQ-189 and BUG-53) fail, but they fail the same way on a clean xgd-working and are about other parts of the page.

- **Sign-up not changed:** new businesses created when someone signs up are still named after the person. Several existing tests rely on that, so I left it alone. Say if you want that changed too.
- **Not on dev yet:** dev serves a frozen copy, so you'll only see these changes there after `bin/deploy --env dev`.

<!-- xgd-chat-end -->