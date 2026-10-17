---
uid: comment-b18a3320
id: COMMENT-5364
type: comment
title: Comment on bug BUG-207
created_by: xgd
created_at: '2026-10-17T13:53:30.388071+00:00'
updated_at: '2026-10-17T13:59:47.925207+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b324e927
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0056a761-efeb-433c-a0ac-565f885ede83",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ab6ee017-1398-43f5-8e49-24ccc387938a-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T13:53:21.692018+00:00" -->
#### You
After using the link on the Console tab to visit another cusomters site, that site persists in my view.

I "impersonated" faelanwesthead and visited the site. I discontinued impersonation and went toi my own sites/businesses, but the home view is still showing the falean.com site

<!-- xgd-turn id="ab6ee017-1398-43f5-8e49-24ccc387938a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T13:59:47.727661+00:00" -->
#### Claude
Tracing the Console tab code in the control app to find where the "current site" is remembered.

Found the business-switch flow in `app.js`; now checking where the site pane remembers its selection.

Server-side scope looks correct; checking the client's "carry" (remembered preview page) next, since that's what could hold a stale site.

Writing a quick scratch repro using the existing REQ-367 harness: enter a business, go back, then remount, and check which site the pane shows.

The client switch logic works correctly in isolation, so I'm checking the server's `/api/sites` route next.

Re-running the repro with the own business having no sites (verbose reporter needed to see logs).

Fix is a one-spot change in `panel.js`'s `navigate`: an empty URL should actually unload the frame (`about:blank`) rather than write `src=""`. Recording scope on BUG-207 before touching code.

Now the UAT, modelled on the REQ-367 chrome suite.

The second case I wrote is muddled (guessed storage key, and a reload after leaving actually stores an empty site, so it isn't a real path). Replacing it with the switcher way out.

All 48 pass with nothing skipped. Confirming the new UAT actually fails without the fix:

Red without the fix, green with it. Checking my notes on this project's version-bump/gate procedure before committing.

Commit on the branch, then lock and merge back.

Merged. Updating the ticket's test plan to match the final UATs, then promoting to `free_coded` (letting the gate bump the version itself).

I've fixed this and merged it into `xgd-working`. BUG-207 is at `free_coded`. It isn't on dev or production yet: dev only changes when you run `bin/deploy --env dev`.

**What was happening:** the "back" button on the operator banner takes you to your first own business, which is most likely 1st Contact itself. That business's only page is the `/account` portal, and the builder's site list leaves portals out on purpose, so it has no sites. With no site, the preview pane cleared the frame by setting its `src` to an empty string. Browsers don't unload a frame for an empty `src`, so it kept showing what it already had: faelan.com. Everything else (switcher, banner, Library, Settings) had moved correctly; only the preview frame was stale. The business switcher hits the same bug, so does any move to a business with no sites.

**Fix:** when there's no site to show, the frame now loads `about:blank`. It's a one-line change in `apps/control-app/src/builder/panel.js`. Leaving a customer's business you entered now gives a blank preview, never their site.

**Tests:** the new `tests/test_UAT_FC_BUG-207_leaving_an_entered_business_clears_the_preview.test.ts` covers leaving by the banner and by the switcher. Both cases fail without the fix and pass with it. The nearby builder suites (REQ-367, BUG-79, REQ-391 and four others, 48 tests) also pass.

**Not confirmed:** I couldn't query production to check that your own business really has no sites, because Cloudflare refused the request from the sandbox. The cause is worked out from the code and reproduced in tests, not read from your data. If one of your own businesses does have a site and the old site still shows after you deploy, tell me which business you went back to and I'll keep looking.

<!-- xgd-chat-end -->