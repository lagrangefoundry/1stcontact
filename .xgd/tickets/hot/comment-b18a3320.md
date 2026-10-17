---
uid: comment-b18a3320
id: COMMENT-5364
type: comment
title: Comment on bug BUG-207
created_by: xgd
created_at: '2026-10-17T13:53:30.388071+00:00'
updated_at: '2026-10-17T21:26:13.982178+00:00'
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

<!-- xgd-turn id="e4e0f13c-b997-4de1-9d55-5f94bf3b4a49-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T21:15:18.554644+00:00" -->
#### You
The fix doesn't work and it is not specific to impersonation.

I am currently looking at "Charlie's plumbing - 3" but I got there after visiting 1st Contact. I am seeing the 1st Contact site in the preview despite Charlie's plumbing - 3 being selected. If I refresh the browser, I get the correct page.

<!-- xgd-turn id="e4e0f13c-b997-4de1-9d55-5f94bf3b4a49-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T21:26:06.387709+00:00" -->
#### Claude
Writing the new finding to the ticket (keeping the existing content), then cutting a branch.

Now the code change in the worktree.

Now the UAT. It simulates the browser's in-flight navigation: the old window stays in place until a `load` event fires.

All 9 pass. Now checking that the new UATs fail without the fix:

Without the fix, both new tests fail on exactly this: the old site's window gets reloaded. Next, the wider builder regression scope.

Some of these failures could already exist on a clean tree, so I'm running the failing files again without my change for comparison.

Seven of those fail on a clean tree too. The one new failure is BUG-43's "a write reloads the preview frame", most likely the same fixture gap. Checking:

Same cause: the stub stands in for a page that has loaded but never fires `load`. Applying the same one-line fixture fix to both stubs in that file.

The same 7 tests fail as on the clean tree, all unrelated to this change, and nothing new fails. Committing and merging back.

Merged. Now promoting to `free_coded` with all three commits; per my notes, the gate does the version bump itself.

You're right: my first fix only covered switching to a business with no sites. Your case has sites on both sides and has a different cause. I've fixed it and merged it into `xgd-working`. BUG-207 is back at `free_coded`. It's not on dev until you run `bin/deploy --env dev`.

**What was happening:** a switch points the preview frame at the new site. For a moment, until that page arrives, the frame still holds the old one (1st Contact). Meanwhile the new site's change feed, the BUG-192 "preview follows the draft" listener, connects and reports the new site's change count. The builder compared that count with the one stated by the page in the frame, which was still the old site's page. When the old count was lower, it decided the preview was out of date and reloaded the frame where it stood. That reloaded 1st Contact's page and cancelled the trip to Charlie's plumbing. Everything else had moved to Charlie's, so nothing pointed the frame back. A browser refresh starts clean, which is why it fixed it. It depends on which site's count is higher, so not every switch shows it, and impersonation has nothing to do with it.

**Fix:** two small changes, in `apps/control-app/src/builder/panel.js` and `app.js`:
- While a frame is still loading its new page, the builder no longer reads a change count from it.
- A reload asked for during that time sends the frame to the page it is supposed to show. It no longer reloads the page being left.

**Tests:**
- **New UATs:** `tests/test_UAT_FC_BUG-207_switching_between_sites_shows_the_new_site.test.ts` switches from 1st Contact to Charlie's plumbing, then sends a feed update while the frame is still loading. One case sends the opening count, the other a new edit. Both fail without the fix (the old site is reloaded) and pass with it.
- **Two older test files changed:** the stand-in frames in the BUG-192 and BUG-43 tests now signal that the page has finished loading, as a real browser does. Their assertions are unchanged.
- **Wider builder suites:** 7 tests fail (BUG-52, BUG-53, REQ-127, REQ-259, REQ-391 comp viewer, AC1065, AC1070). Those same 7 fail without my change, so this change didn't cause them. Nothing new fails.

**Not confirmed:** I couldn't run this in a real browser. The tests mimic a browser's half-finished navigation, but they aren't one. After you deploy, try switching back and forth a few times between 1st Contact and Charlie's plumbing - 3. If the old site still appears, tell me and say whether you were in View or Edit.

<!-- xgd-chat-end -->