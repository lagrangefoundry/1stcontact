---
uid: bug-c3394ee4
id: BUG-202
type: bug
title: 'Comps: two of three competitor sites fail to capture, and the consultant doesn''t
  search for its own'
created_by: EPIC-19
created_at: '2026-10-04T17:57:56.542712+00:00'
updated_at: '2026-10-04T18:43:33.666847+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  severity: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-dafd81d9
---

## Symptom (Charlie's Plumbing 3, 2026-10-04)

The client gave three competitor URLs. Only one, Duncan Plumbing, reached the comp board. The consultant didn't look for any comps itself.

1. **rosenthalplumbing.com:** `capture_site` failed with `Navigation timeout of 30000 ms exceeded` after 3 attempts, and again on the bare domain.
2. **expertplumbingca.com:** the page loaded, but the capture failed in `foldToL1: produced an invalid L1 document — …/geometry/keyframes/3/viewportResponse/yFactor: Too small: expected number to be >=-10`. The consultant correctly read this as our bug, not the site's.
3. **No search:** the turn ledger shows `web_search_requests = 0` on both turns. The consultant asked the client "who do you lose jobs to?" (as REQ-378's method says), received three URLs, and never searched. Search was granted (`webSearchFor` in `host-core.ts`, REQ-378 commit 7fcf3e19b7).

## Root cause

1. `playwright-driver.ts` ~L142 navigates with `waitUntil: 'networkidle'`. Trade sites routinely carry chat widgets, review widgets, analytics beacons and consent managers. Duncan's capture alone pulled in GDPR consent bundles, a review widget and long-lived scripts. Their network never goes idle, so a working page times out. Waiting longer won't help such a site.
2. `capture.ts` ~L176 always folds the capture into an L1 document and validates it, and a fold that violates an L1 bound fails **the whole capture**. A comp only needs the screenshots, the extracted page facts and the description. The L1 fold is for reproduction. The invalid `yFactor` is also a fold defect in its own right: a scroll-driven animation's response factor exceeds the ±10 bound, and the fold should clamp or drop that keyframe rather than emit an invalid document.
3. Method, not mechanism. The priming and DOC-64 say to ask the client first, and nothing tells the consultant to search **as well**. Once the client answered, it treated the board as filled by the client.

## Fix

1. **Navigation that works on real trade sites.** Wait for the document to load, then a bounded settle period (for example, up to a few seconds of network quiet, then capture anyway), instead of requiring `networkidle`. A capture is refused only if the document itself doesn't load.
2. **A failed fold never costs the comp.** If `foldToL1` (or its validation) fails, the capture still produces its screenshots, `capture.json` and description, and is a valid comp. The fold failure is recorded on the reference as a warning, for the reproduction tooling. Separately, the fold clamps or drops out-of-range `viewportResponse` factors so that page folds validly.
3. **The consultant searches as well as asks.** The priming and DOC-64 comp-review method: in the same turn it asks the client who they compete with, it also runs its own search for strong local businesses in the client's trade and town. It brings its own picks alongside the client's, aiming for the mix REQ-378 describes (a chain, good locals, one the client thinks is bad). The client's URLs add to the consultant's search, they don't replace it.

## Test plan

UATs named `test_UAT_FC_<TICKET-ID>_*`:
- A page whose network never goes idle (a fixture with a perpetual long-poll) is captured, with screenshots.
- A page whose fold yields an out-of-range `viewportResponse` still lands as a comp with screenshots and a fold warning, and a fold of that page validates once clamped.
- The consultant priming and DOC-64 require a search alongside asking the client.


## Added 2026-10-04: every comp appears in the chat as a tile that opens the real site (operator)

The operator's view: the client needs to see a competitor's site **for what it really is**, live, with its motion, its scrolling and its clutter, not only as a captured screenshot.

- **When a comp is added to the board** (by the consultant or the client), a tile appears in the conversation: the comp's hero thumbnail, its name and address, and **"Open the real site ↗"**, which opens the live site in a new tab (links in assistant bubbles already open in a new tab, lagrange-framework REQ-170).
- **The tile survives a reload.** It's composed as markdown by the host, the same way a generated image is shown in the chat (REQ-217's `displayLine` pattern: the tool's result hands the consultant the exact line to include). It isn't a card, because cards aren't replayed from the transcript.
- **A comp whose capture failed still gets a tile with the link**, marked "couldn't take a snapshot". The client can always see the real site even when our capture can't.
- **The screenshot viewer stays.** It's for reviewing comps side by side later in the engagement and for attaching notes, while the tile is the first look at the real site.
- **The priming says when to use it:** show the tile for each comp and invite the client to open it before asking what they like and dislike.

Additional UAT: adding a comp yields a chat line with the thumbnail and a link to the comp's live URL, and a comp whose capture failed yields the link without a thumbnail.


## Folded in 2026-10-04: BUG-204 (filed by the consultant on the same incident)

BUG-204 reports the same Charlie 3 captures and reaches the same `networkidle` diagnosis. Its additional findings belong here:
- **The wall clock:** the turn ran about 20 minutes (uploads at about 17:05, the successful capture finishing at about 17:26), while each page loads in under 4 seconds in a normal browser. A comp capture should take tens of seconds.
- **The capture may crawl the whole site.** The one successful capture reported `pages: 12`. A comp needs **the page asked for**, at the viewport ladder, and nothing else. Check whether `capture_site` follows links, and make a comp capture a single-page capture.
- **Retries are silent and expensive:** 3 × 30 s per URL, with nothing reported between attempts. With fix 1 a timeout should be rare. Bound the total, and report each retry (the user-facing half is REQ-386).
- **Headless detection:** check whether a missing or headless user agent, or missing headers, makes some hosts stall, and send ordinary browser headers.
- **`data:` URLs** (300 "refusals" on one site) are inline images. Keep them as they are, don't report them as refused fetches.

BUG-204 is closed as a duplicate of this ticket.