---
uid: bug-000abc75
id: BUG-400
type: bug
title: 'Builder preview: the Phone width shows sized-per-width type far too small,
  and the consultant keeps asking the client to reload the whole app'
created_by: EPIC-19
created_at: '2026-11-09T06:20:27.906108+00:00'
updated_at: '2026-11-09T14:48:52.511452+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-47839831
  commits:
  - working_sha: 28018e99719fcf72c4b9c6b3a05e7e16d55e3218
    reconcile_sha: null
    main_sha: null
  - working_sha: 72cb9fa272672281481ecd90d29262f0f692966a
    reconcile_sha: null
    main_sha: null
  version: 0.2.843
  story_points: 8
---

## Symptoms (client test site in production, 2026-11-08/09)

1. **The Phone width setting shows the hero title tiny.** With the preview's width control on **Phone**, the hero title (type role `display`, sized per width through `responsive.fontSizePx` keyframes) appeared at roughly 10pt, smaller than the 12px caption beside it. Narrowing the browser window to phone width showed it correctly, and the consultant's own `draft` screenshot at `mobile` showed 44px. The client then asked for a bigger title, and the consultant made a real design change (phone display 44px → 54px) to fix a fault that existed only in the preview. The consultant reported it as PLATFORM_ISSUE-7.
2. **The consultant tells the client to reload.** Across the conversation it repeatedly said things like "it may be the preview showing an old version again. Reload once", "After a reload, do you see…". The builder has no way to reload the preview alone, so the client reloads the entire app, losing their place. Meanwhile the preview already follows the draft by itself: it reloads whenever the draft's change count moves, whoever wrote it (BUG-192, `apps/control-app/src/builder/app.js`, `draft-at` Server-Timing), and refreshes keep the reader's place (BUG-248). So nearly every request was a guess. The one confirmed stale case (2026-11-05: "I had to reload to see the gap") was never explained.

## Expected behaviour

### Phone width
1. **The Phone setting renders exactly what a 375px-wide phone renders** (and Tablet what a tablet renders): every per-width value (type sizes, spacing, geometry) resolves the same as in a real viewport of that width and in the consultant's `draft` screenshot at that preset. In particular `calc(… 100vw …)` interpolation and `(min-width: …)` rules have to see the same width. Candidates to rule out: the frame's viewport width and its scrollbar, the shrink-to-fit `transform: scale()` (`panel.js` `layOut`), the edit channel's render, and which ladder width the setting picks (`view-width.js`).
2. **The width the client is looking at is the width the consultant is told.** If the frame's real inner width ever differs from the setting's nominal width, the digest reports the real one.

### Reloads
3. **The client never has to reload the app to see the current draft.** Every write (the consultant's, a delegated builder's in its container, a placed clip or photo, the client's own edit) reaches the preview through the draft feed, and nothing it loads (page, theme CSS, pictures, clips) can be served from a stale cache.
4. **The consultant knows whether the client's preview is current.** Each turn's digest carries the change count the client's preview is showing next to the draft's current count. So the consultant never guesses "it may be showing an old version". If the preview is behind, the builder refreshes it itself, and the consultant may say "the preview is catching up". It never tells the client to reload.
5. **The consultant is told never to ask for a reload.** Its guidance says: the preview follows the draft by itself; to see motion again (crossfades, clips, entrances) the client uses the preview's own refresh button (item 6); to check on a real phone, offer "View on your phone" (REQ-376). The digest's "unknown/behind" state is the only reason to mention the preview's freshness at all.
6. **A "Refresh preview" button reloads only the preview,** keeping the client's place and playing the page's motion from the start. It replaces "Replay animations", which already does exactly this reload and is the same control under a narrower name. It works in View and Edit; Edit runs no motion.
7. **Unexplained staleness is reported, not hidden.** If the preview's shown count is still behind the draft a few seconds after a write, the builder logs it as a platform fault with both counts, so a real cache or feed bug surfaces instead of being worked around by asking for reloads.

## Test plan

UATs `test_UAT_FC_BUG-<n>_*`:
- In a real browser, a page whose `display` text has per-width sizes (for example 44px at 375 → 84px at 1280) is opened in the builder with the width control on Phone. The heading's computed `font-size` equals the size in a plain 375px-wide viewport of the same draft (±0.5px), and the same holds for Tablet.
- A write made by a delegated builder (not the chat stream) updates the open preview without any page reload of the builder, and its `draft-at` matches the draft's count.
- The consultant's turn digest names the preview's shown count and the draft's count; with them equal, the consultant's reply after a change contains no request to reload (scripted-model check on the guidance plus a lint over the consultant guidance text).
- The toolbar offers "Refresh preview" (and no "Replay animations"); pressing it reloads only the preview frame, the builder's own document is not reloaded, and the scroll position is kept.

## Related

The renderer fault that makes sized-per-width headings collapse below their first keyframe width (the likely trigger of item 1's tiny Phone title) is tracked separately in BUG-401. This ticket keeps the preview-side checks.

## Root cause (item 1)

Measured in Chromium with the real panel: a frame given the Phone setting has a viewport of exactly its width at every device scale (1–1.75) and pane size (narrower than a phone, scaled; wider, centred). Its `min-width` rules and `100vw` see the same width a real phone does, and overlay or classic scrollbars don't change that. The frame wasn't the fault.

The setting's pick was. REQ-388 made each fixed setting render at the page's ladder width *nearest* its nominal width (`view-width.js` `presetWidth`). A real phone and the consultant's `screenshot` `mobile` preset are exactly 375. On a ladder like `[360, 414, …]`, "Phone" laid the page out at 360. That is below a title whose per-width sizes start at 375, where BUG-401's heading reset makes it inherit the body size. So the result was a tiny title that only the preview showed.

## What changed

**This supersedes REQ-388's nearest-ladder rule.** A fixed setting now renders at its device's width whatever the ladder holds: Phone 375, Tablet 768, Desktop 1280, the `screenshot` presets. The digest still says which of the page's own layouts that width falls between.

1. **Widths** (`view-width.js`, `preview-width.js`). `presetWidth(mode)` is the nominal width and `layoutLabel(width)` names it. The width control no longer reads the page listing.
2. **The width reported is the frame's own** (`panel.js` `viewport()`). Once the shown page has loaded, its `innerWidth` is what the client is looking at, so that is what goes with each prompt. Before it has loaded, the requested width stands.
3. **Every prompt says which change the preview is current as of** (`app.js` `previewAt`, sent as `view.previewAt`). The value is the count the shown page states (`draft-at`). It can be a later count when every write reported since went to *another* page: such a write moves the draft count without touching this page, so the page is still current. It is never a count past a write that touched the page and hasn't been shown yet. `readClientView` accepts a non-negative integer and refuses anything else.
4. **The digest states it beside the draft's count** (`roles.ts` `previewLine`, templates `page-digest-preview-current` / `-behind` / `-unknown`):
   - Current: "Their preview shows the draft as it stands (change N)…"
   - Behind: "Their preview shows change S; the draft is at change N. It is catching up by itself… Never ask them to reload."
   - No count (mid-load): "Their preview is loading…"
   - A turn that reports no view gets no line.
5. **Rule 16 in the consultant's rules** (`priming.json` `rules`): "Never ask them to reload." The preview follows the draft by itself and the digest says whether it is current. To see motion again the client uses **Refresh preview**; to check on a real phone, the consultant offers View on your phone.
6. **"Refresh preview" replaces "Replay animations"** (`toolbar.js` `refreshPreviewAction`, id `refresh-preview`, in View *and* Edit). It is the same refresh as before: the preview frame alone, at the reader's place, with the page requested with motion on. The builder itself never reloads.
7. **A preview left behind a write is reported** (`app.js` `watchStale`). When a write that touched the shown page has had its refresh interval plus `previewStaleMs` (10s) and the page still states an older count, the builder POSTs `/api/preview/stale` with both counts, the channel and the page. It does this once per site per builder load. The route files a `platform_issue` (kind `bug`, "Builder preview stayed behind the draft") in the platform store, where the platform console lists it. The body names the site, page, both counts and the draft's current count. A report that isn't behind gets a 400; an unknown site gets a 404.
8. **Item 3 (caching): no change was needed.** Every response from `route()` is already `no-store` (`uncacheable`), including the preview page, its theme CSS, pictures and clips served under `/preview/<site>/<channel>/…`. Item 7's report is the safety net if that ever stops being true.

## Design decisions made during implementation

- **Device width, not ladder width.** Item 1 requires Phone to be what a 375px phone renders and what the consultant's `mobile` picture shows. Both are exactly 375, so the nearest-ladder pick couldn't be kept.
- **An effective count, not the raw `draft-at`.** The page's stamp is the counter at render time. A write to another page would make a current preview read "behind" forever, so the builder reports the count it is current as of instead.
- **Filed as a platform issue, once per site per load,** so a real fault reaches the operator's console without flooding it.
- Existing UATs that pinned the old name were updated: BUG-248 (the control now in Edit too), BUG-325 (button name) and the toolbar-lifetime reconciliation test.

## Test plan (as built)

- `tests/test_UAT_FC_BUG-400_preview_is_the_device.test.ts` (Chromium, real panel, width control and toolbar). The page listing has a ladder whose nearest-to-375 is 360.
  - `phone_and_tablet_render_what_a_phone_and_a_tablet_render`: under Phone, Tablet and Desktop the frame's inner width is 375/768/1280, the per-width title matches a plain window of that width (±0.5px), and the reported width is that width. Fails on the old code (frame at 360).
  - `the_reported_width_is_the_frames_own`
  - `refresh_preview_reloads_only_the_frame_and_keeps_the_place`: there is no "Replay animations"; pressing "Refresh preview" requests the page again with motion on and swaps it in at the same scroll position, and the builder document is never reloaded.
- `tests/test_UAT_FC_BUG-400_the_preview_follows_and_says_so.test.ts` (jsdom, the real builder):
  - `a_builders_write_reaches_the_preview_and_each_prompt_says_which_change_it_shows`: a feed-only write refreshes the preview and the prompt's `previewAt` follows it; a write to another page triggers no refresh and keeps `previewAt` current.
  - `a_preview_left_behind_a_write_is_reported_once_with_both_counts`
  - `the_toolbar_offers_refresh_preview_in_view_and_edit`
- `tests/test_UAT_FC_BUG-400_the_consultant_knows_the_preview_is_current.test.ts` (real host, scripted model):
  - The digest's current, behind and unknown lines.
  - No line without a view.
  - Malformed `previewAt` is refused.
  - Rule 16 reaches the model.
  - A lint over every consultant guidance JSON: nothing asks the client to reload, and nothing names "Replay animations".
- `tests/test_UAT_FC_BUG-400_a_stale_preview_is_filed.workers.test.ts` (real Worker): the report files the platform issue with both counts; a report that isn't behind is refused, and so is an unknown site.

Regression scope: REQ-388 (all), BUG-192, BUG-207, BUG-246, BUG-248, BUG-250, BUG-325, REQ-215, REQ-248, REQ-285, REQ-413, REQ-435, REQ-479, the priming and digest suites, and the toolbar lifetime suite. All pass except `REQ-248_page_reach` and `REQ-473_v2_priming`, which fail identically on clean xgd-working.