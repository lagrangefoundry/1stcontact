---
uid: comment-ddbb1e3b
id: COMMENT-5860
type: comment
title: Comment on bug BUG-317
created_by: xgd
created_at: '2026-10-31T18:03:10.925534+00:00'
updated_at: '2026-10-31T18:22:45.884272+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-8e1724d5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8106b3ed-83b3-4455-ad0e-a3acd8fcecae",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d2600597-4f57-4d97-a4ce-24ac8a37e9d5-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T18:01:41.056327+00:00" -->
#### You
I am clicking the Click here to start button in production on 1st contact and a message comes up that says: That didn't start — please try again. I tried - same behavior.

<!-- xgd-turn id="d2600597-4f57-4d97-a4ce-24ac8a37e9d5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T18:08:24.521206+00:00" -->
#### Claude
I'm tracing the start button's request (`POST /api/ai/opening`) and looking for production logs that show why it's refused.

Found it in production's request log: two presses at 15:32 UTC were refused with **403** (no business attached). Checking what refused them.

Confirming the acceptance timestamps for your account, then I'll write up the ticket.

The cause is confirmed. Recording it on the ticket now.

The start button failed because your builder tab was open when new legal documents went live. It wasn't a bug in the start feature itself, and it's already cleared for your account.

**What happened (from production's request log and acceptance records):**
- Last night's production deploy (01:07 UTC) published new versions of the Terms, Privacy Notice and Beta Terms. Whenever a new version is published, every existing account has to accept it again.
- Until you do, production refuses every request from an already-open page with a 403 and no signed-in user attached. The acceptance page itself is only shown when you load or reload a page. Your presses at 15:32 UTC hit exactly that: `POST /api/ai/opening` → 403, twice. The panel's fallback re-read of the session got 403 too.
- The start button treats any failure the same way, so it showed "That didn't start — please try again." Retrying could never work.
- At 18:04:16 you accepted the new documents (I assume after a reload). At 18:04:34 *Click here to start* returned 200. **It should work for you now. If it doesn't, reload the page.**

**The real problem:** every existing user with a builder tab open when legal documents change gets this. It isn't just the start button: every panel fails with whatever generic error it has, instead of being sent to the acceptance page.

**Proposed fix (not coded yet):** when the server refuses a builder request because documents are owed, it marks that refusal in a way the browser can recognise. The builder's shared request helper then reloads the page, so the person lands on the acceptance page. A UAT will check that an account owing documents is sent to the acceptance page and doesn't see "That didn't start".

I've written all this up on BUG-317 (title, cause with the log evidence, proposed fix, test plan). It's still at `draft`. Do you want me to go ahead with that fix?

<!-- xgd-turn id="ca7adb73-724e-4888-a90d-74dc7dade63d-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T18:13:09.793122+00:00" -->
#### You
I think this was an upgrade issue - on page reload things worked as expected.

<!-- xgd-turn id="ca7adb73-724e-4888-a90d-74dc7dade63d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T18:17:00.223445+00:00" -->
#### Claude
Yes, I agree it was an upgrade issue. The deploy published new legal documents while your builder tab was open. That open page couldn't show you the acceptance page, so every request from it was refused. Reloading took you to the acceptance page, and once you'd accepted, everything worked. Nothing is broken now.

It will happen again, though. Each time a new version of the Terms, Privacy Notice or Beta Terms goes live, anyone who already has a builder tab open hits the same generic error until they reload. That only matters if legal updates will be frequent while people are using the builder.

I've added your assessment to BUG-317. It's still at `draft` with no code written. Do you want me to make the small fix (reload the page automatically when a request is refused for unaccepted documents), or close the ticket?

<!-- xgd-turn id="bf79480f-f72d-439a-a916-69a16502d864-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T18:22:19.549867+00:00" -->
#### You
please close as won't fix with that explanation

<!-- xgd-turn id="bf79480f-f72d-439a-a916-69a16502d864-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T18:22:43.317420+00:00" -->
#### Claude
I've closed BUG-317 as `wont_fix` and added a "Resolution: won't fix" section to the ticket explaining why. It says the error was a one-off upgrade effect: new legal documents were published while your builder tab was open, and reloading fixed it. It also says the proposed fix was not built and no code was changed. The rest of the ticket body is unchanged.

<!-- xgd-chat-end -->