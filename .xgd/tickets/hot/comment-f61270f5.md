---
uid: comment-f61270f5
id: COMMENT-8135
type: comment
title: Comment on bug BUG-405
created_by: xgd
created_at: '2026-11-09T17:39:10.944385+00:00'
updated_at: '2026-11-09T18:52:48.662599+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-61716920
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "63eff237-9fc5-49fb-ad29-5b2f4fb129e2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="93ccf237-44fb-439d-9d19-9912e5f22aa2-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T17:37:25.033272+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="93ccf237-44fb-439d-9d19-9912e5f22aa2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T18:37:03.371860+00:00" -->
#### Claude
Not a duplicate (checked related layout-check tickets). Now reading the layout-check code to scope the 14 items before cutting a branch.

Still scoping: reading the individual checks behind each false finding (spacing, SVG text, off-grid, business name, crop).

Still scoping: locating the list component that writes an inline `<style>` so the fixture matches production.

Still scoping; reading how the check is given each picture's focal point, so a stated `objectPosition` can count as "subject stated".

Now probing the 24px-inset report by rendering a real fixture; first reading the existing on-grid UAT as a template.

Root causes identified for most items. Checking two remaining dependencies (the site's width ladder and the browser driver's reuse) before editing.

Starting the edits now (layout check runner, widths, edges, name, crop), then the renderer and the host's nag logic.

Now the crop finding: stated framing (`objectPosition`) on a picture or slideshow counts as the subject statement.

Now the extra check widths (smallest ladder width and one between phone and tablet).

Now writing the widths function and wiring it into `checkLayoutAt`.

Now the renderer fix for a measure nested inside a measure.

Renderer compiles. Now the host side: no re-sending of findings already said and unchanged, and no hold while the consultant has asked the client a question.

The cross-message "already said" memory has to survive between jobs (containers keep no state), so it should live in the site plan beside `layout_kept`. Checking how plan fields are declared.

Adding a `layout_said` plan field (so "already reported, unchanged" survives between messages and jobs), then rewiring `hostLook` and the reply hold.

Now the `hostLook` rewrite for said/unchanged findings.

Now the reply hold: no layout cue when the consultant's reply asks the client a question, and no re-cue of identical owed lines.

Typecheck is clean apart from two existing errors in files I didn't touch. Running the existing layout-check and host-look suites to see what the changes break.

Baseline: 3 of those failures already exist on clean `xgd-working` (BUG-237, BUG-282, REQ-415 clean page). The other 12 are mine; inspecting the ones that aren't just the width count.

Node layout suites now pass apart from the 3 that already fail on clean `xgd-working`. Next: the Workers suites for the host's look and hold.

One new Workers failure (REQ-436 "message sent during a hold"); the other two already fail on clean. Inspecting it.

Existing suites are in hand. Now writing the new `test_UAT_FC_BUG-405_*` UATs; reading REQ-429's raw-HTML check helper to reuse its pattern.

Before writing UATs, checking the fixture design's type roles: the 320px UAT needs a check for a heading drawn far smaller than its role, and no current check reports that.

Now the node UAT file (false findings, render inset, widths).

Two fixture mistakes: my HTML gutter steps where the design's gutter interpolates, and the L1 page lacks `id`/`title`/`kind`. Fixing both.

All 9 new node UATs pass. Checking they fail on the old code (old check, thresholds and renderer swapped in temporarily).

All 9 node UATs fail on the old code and pass on the new. Now the Workers UAT for the nag rules; reading the BUG-313 kept-finding suite as a template.

The first message still got the hold cue, so the reply's question isn't reaching my check. Adding a temporary debug line to see what `words` holds at that point.

The host appends its own italic status line ("_Finished a build…_") to the reply, so the question isn't the last paragraph. `asksClient` will skip host status lines.

Passes. Checking it fails on the old host code.

Fails on old code, passes on new. Committing work in progress on the branch, then running the broader regression.

Committed on the branch (`9248c6bb48`). Since the renderer changed, running the suites that render nested measures or pin rendered width CSS.

One new failure from my change: REQ-462 "the brand check measures the centred logo". Inspecting.

Running the remaining layout-check suites not yet covered.

Two new: REQ-440 and REQ-460. Inspecting both.

Node side is settled. Checking whether any suite pins the exact list of plan keys (the new `layout_said` key could break it).

Running the 77 other delegation Workers suites in two batches.

Baselining these on the clean checkout (memory notes delegation suites are already red there).

All 24 already fail on clean `xgd-working`. Second batch:

One extra on the branch: REQ-416 "stop building stops the work". Rerunning it alone to rule out a load flake.

Load flake: it passes alone, twice. Checking that nothing pins the `type_scale` rubric phrase I extended, then committing the test updates.

Now updating the ticket body: the existing text stays, and an implementation section is appended.

Ticket body updated. Now merging back with the recipe that has worked here before: lock, merge `xgd-working` into the branch, bump the version there, fast-forward.

Merged cleanly, but BUG-404 ("widths in the UI's words") landed meanwhile and touches the same width naming. Checking how it interacts with my changes.

BUG-404 leaves `layoutLine` and the width names alone, so no conflict. Re-running my UATs, BUG-404's UAT and a typecheck on the merged branch.

`xgd-working` moved (other sessions' ticket commits). Reading the memory's retry recipe for this race.

Running the retry loop: merge `xgd-working` in, bump, fast-forward, then gate to `free_coded`.

Landed and gated. Tearing down the branch.

I've implemented all 14 items of BUG-405 on `xgd-working`. The ticket is at `free_coded` (version 0.2.850, 13 story points, three commits) and is not deployed yet. It isn't a duplicate: no other ticket covers these findings or the repeat nags.

**False findings (items 1–6)**
- **Style text (PLATFORM_ISSUE-13):** the check now ignores `<style>`, `<script>`, `<template>` and `<noscript>`, and never quotes their text. One caveat: in Chromium I could not reproduce the wrong 196–334px gap itself. What I could reproduce, and fixed, is the finding quoting the CSS. Excluding those elements should also stop the wrong gap, but that part is unconfirmed.
- **Wordmark lettering:** text inside an inline SVG is no longer checked as page text.
- **Off-grid:** content that meets either edge of the content or wide measure counts as on the grid. A block touching neither edge is still reported.
- **Business name:** taken from text that carries every word of the site's own name, and never from a button. "Text a photo" no longer counts.
- **Crop warning:** a stated `objectPosition` on a picture, or on a slideshow, now counts as saying where the subject is.
- **The 24px inset was the renderer.** A `width: content` box inside another one subtracted the gutter again, so every wrapped section drew its content one gutter inside the measure, at every width. The renderer no longer does that, and the check now agrees with what is drawn. Separately, an overlay section is now measured by its picture's edge, not the deliberate gutter padding inside it.

**Nagging (items 7–10)**
- The host now remembers which findings it has sent, across messages, in a new site-plan field (`layout_said`). A finding that hasn't moved is repeated once, marked unchanged, then dropped until the page changes it.
- When the consultant's reply ends with a question to the client, the host doesn't send its "Fix them now" follow-up.
- The same follow-up isn't sent twice when nothing has been rebuilt since.
- Kept findings (`layout_kept`) are still filtered out as before.

**Widths (items 11–14)**
- Each page is now also checked at the site's smallest width (320px) and at 572px, between phone and tablet. These two show as "320px" and "572px" in findings.
- I added a new finding: a heading drawn far smaller than its role. This is what now catches a title that lost its size below 375px.
- On cost: the extra widths run only on pages a build changed, but each width still opens its own browser page, like the existing three. That is not quite "the same browser session" that item 14 asks for.

**Tests**
- 10 new UATs. All of them fail on the old code and pass on the new.
- I updated 13 existing UATs for the new behaviour. Most only expected three widths. REQ-436 expected the hold to repeat, which item 7 now forbids.
- Two of the updated UATs (REQ-429, REQ-462) had fixtures with real faults at 320px: a header too narrow for its row, and a logo squeezed below its brand size. Those now check only desktop, tablet and phone.
- I didn't run the whole suite, only the layout-check, rendering and delegation suites. Everything that still fails in them also fails on unmodified `xgd-working`, apart from one REQ-416 test that passed when re-run alone.

**Two behaviour changes to be aware of**
- "Waiting on the client" is detected only by the reply's last paragraph containing a question. A question about something other than the layout faults will also stop the follow-up.
- Expect new real findings at 320px on live sites (narrow headers, squeezed logos). Item 11 asks for this, but it will add findings the consultant hasn't seen before.

<!-- xgd-turn id="5e8ad037-af83-47b1-8628-f2755c21ed0c-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T18:52:17.652361+00:00" -->
#### You
go

<!-- xgd-turn id="5e8ad037-af83-47b1-8628-f2755c21ed0c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T18:52:41.614197+00:00" -->
#### Claude
Nothing is waiting on me, so I've made no changes for "go". BUG-405's code is all on `xgd-working`, and you've since moved the ticket to `ready_to_reconcile`, so the dispatcher can pick it up at any moment.

The one item I left short is item 14. The two extra widths are checked only on pages a build changed, as asked, but each width still opens its own browser page rather than sharing one session with the other three. Closing that would mean a new commit on a ticket already queued for reconcile, so I'd want your go-ahead first.

What did you mean by "go"?
- **Close item 14:** I'll ask you to move the ticket back to `free_coded`, then add the commit to it.
- **Leave it to reconcile:** nothing more from me.
- **Something else:** tell me what.

<!-- xgd-chat-end -->