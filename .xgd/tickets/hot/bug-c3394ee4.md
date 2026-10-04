---
uid: bug-c3394ee4
id: BUG-202
type: bug
title: 'Comps: two of three competitor sites fail to capture, and the consultant doesn''t
  search for its own'
created_by: EPIC-19
created_at: '2026-10-04T17:57:56.542712+00:00'
updated_at: '2026-10-04T21:29:13.072374+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  severity: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-dafd81d9
  commits:
  - working_sha: 5e50623d8611e67e3587e31265619a3949e6204a
    reconcile_sha: null
    main_sha: null
  - working_sha: 9b49490085a03aae6d72310859c0f946ec16de8d
    reconcile_sha: null
    main_sha: null
  version: 0.2.492
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


## Correction 2026-10-04: the consultant did search, but only in a later round

The original finding (fix 3) covered only the first two turns. Over the whole Charlie 3 session, the turn ledger shows **one** web search, in the turn starting 18:30:20 UTC. It led to a comp the consultant chose itself, "Bay Area Construction & Plumbing | Full Steam Ahead", added at 18:47:20 beside the client's Duncan Plumbing. So search works, and the consultant will use it. What's missing is the timing: it searched only after the client's own list proved thin, and it ran one search for one comp. Fix 3 stands as written: search in the **same** turn as asking the client, aiming for the full mix, rather than as a fallback in a later round.


## What landed (2026-10-04, free-coded)

### Capture: navigation, teardown, retries, egress
- **Navigation** waits for the document's `load`, then up to 3 s of network quiet (`NETWORK_QUIET_MS`, 500 ms idle), and captures anyway. The same bound applies to the post-scroll settle, which used to wait out the full default timeout on every navigation. Both drivers (Playwright and Browser Rendering) share the constants in `page-scripts.ts`. Only a document that doesn't load fails the capture.
- **Teardown:** a driver goes to `about:blank` before closing. Found while testing: a connection the page holds open (a chat widget's long-poll) made the browser's close wait about 30 s, once per navigation, and a capture makes about twenty navigations. This is the likeliest cause of BUG-204's 20-minute turn. The egress guard allows `about:blank`.
- **Retries have a time budget:** retrying stops once 30 s (`RETRY_BUDGET_MS`, one navigation timeout) has passed across all attempts. A navigation that timed out isn't retried. A fast failure (a reset) still gets the BUG-67 budget of 3, and BUG-67's "a timeout still retries" UAT is unaffected because its fake fails instantly. Reporting each retry stays with REQ-386.
- **User agent:** captures send an ordinary browser's agent (`HeadlessChrome` becomes `Chrome`).
- **`data:` and `blob:` URLs are no longer egress refusals.** They carry their own bytes and reach no host. Refusing them broke inline images and produced the "300 refusals". **Supersedes REQ-361's UAT example:** its oversized-refusals summary test now uses long `ftp:` URLs, and the `capture_result` shape documents that inline images are never counted.
- **The "crawl" (BUG-204):** there is none. `pages: 12` in `capture_site`'s result is the viewport ladder: 6 widths plus the REQ-88 height probes, one page. No change made.

### The fold
- **A failed fold never costs the capture.** `cmdCapturePage` catches a `foldToL1` failure. Screenshots, `capture.json`, the multistate ladder and the hints are still written, `l1.json`/`forms.json` are not, and the failure is recorded as `fold-warning.json` in the bundle. A recapture that folds cleanly overwrites the warning with null, because the store has no delete. `capture_site` returns `fold_warning` when present, and the adopted reference ticket carries `fold_warning` (empty when clean). `1c capture page` reports it. `CapturePageResult.l1` is now nullable, with `foldWarning`.
- **Out-of-range response factors are dropped, not clamped:** a final fold pass removes any `yFactor`/`heightFactor` beyond ±`L1_VIEWPORT_RESPONSE_BOUND` (10, now a named export of the schema). The keyframe keeps its captured position. A factor that large is motion the capture sampled, not a reflow to follow, and clamping to 10 would be equally untrue.

### Comp tiles
- **`add_comp` answers `display`:** a sentence telling the consultant to paste the tile exactly, followed by the tile in markdown. The tile is the hero thumbnail (the capture's `screenshot-1280.png`, or else `screenshot.full.png`, served at the business-scoped `/b/<business>/api/material/file?uid=…&member=…`), then the name and host, then `[Open the real site ↗](<url>)`. The page title is markdown-escaped so a stranger's `<title>` can't become a link or an image.
- **Client-added comps:** the plan-answers notice (`planAnswersDelta`, on the same cursor as the notes) now reports comps the client added since the last turn, with each comp's tile, once.
- **A comp with no snapshot** gets the tile without a thumbnail, marked "couldn't take a snapshot".
- **A capture that failed** (not refused by the egress rules) throws its error with a link-only tile appended, so the consultant can still show the client the real site. A failed capture is **not** put on the board: the board stays a set of captures (REQ-378's model). An egress refusal is never linked.
- **Chat CSS:** an image whose address names a `member=screenshot…` is drawn as a 420×220 hero crop (`object-fit: cover`, top), not a full-page sliver. The screenshot viewer is unchanged.

### Method
- Both priming profiles' `comps` section: in the same turn the consultant asks the client, it searches the web for strong businesses in the client's trade and town, and the client's sites add to its search and never replace it. It shows each tile (its own, the client's, and a failed capture's link) and invites the client to open the real site before asking for likes and dislikes. DOC-64 §8 "Comp review" says the same. **The system KB needs a rebuild (`1c kb build`) for DOC-64's change to reach deployed sessions.**

## Test plan (as landed)

`tests/test_UAT_FC_BUG-202_comps_capture_and_show.test.ts`:
- a page whose fold fails (over `maxNodes`) still lands via `capture_site` as an adopted capture with `capture.json` and the screenshots, a `fold_warning`, `fold-warning.json`, and no `l1.json`
- a page whose 1280 height probe moves a box 15× the viewport delta folds into a valid document, with every factor within ±10. Without the fix, this reproduces the reported `yFactor` error.
- a capture whose navigation times out isn't retried, and its error carries a link-only tile ("couldn't take a snapshot", "Open the real site ↗")
- `data:`/`blob:` subresources aren't refusals, `ftp:` still is, and a page is never inline
- `add_comp` answers a tile with the thumbnail, the host, the live link and an escaped title; with no snapshot, it answers the link without a thumbnail
- both priming profiles search in the same turn they ask and show each tile

`tests/test_UAT_FC_BUG-202_a_busy_page_is_captured.test.ts` (real Chromium): a page with a never-answered long-poll and a 200 ms beacon is captured, with its PNG screenshot, in about 6.6 s. With `networkidle`, it fails with `Timeout 30000ms exceeded`.

`tests/test_UAT_FC_REQ-378_the_comp_board.workers.test.ts` (BUG-202 cases added): through the worker's own routes, the consultant's `add_comp` is handed the tile with this business's thumbnail URL, which is served as a PNG. A comp the client adds via `/api/plan/comp` reaches the next turn as a tile, once.

Adjusted: REQ-361's refusal-summary UAT (see the supersession above), req36's driver-source regex, and the fake puppeteer, which now treats `about:blank` as a real browser does (no request).