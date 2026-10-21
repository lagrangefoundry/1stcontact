---
uid: bug-ae0d991d
id: BUG-248
type: bug
title: 'Preview refresh: keep scroll position, refresh only the page that changed,
  no replayed animations, fewer redraws during a build'
created_by: EPIC-19
created_at: '2026-10-21T18:00:24.767152+00:00'
updated_at: '2026-10-21T20:45:32.954119+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  severity: medium
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-343fd22b
---

## Symptom (Ariel's AR Welding run, 2026-10-21; operator)

Every time a builder changes the site, the preview reloads. Watching the site
form is part of the experience, but:
1. **Scroll position is lost** on every reload — annoying when watching the lower
   part of a page grow.
2. **The page you're viewing reloads even when the builder is working on another
   page** (home reloads while the prices page is being built).
3. **Every reload replays all entrance animations**, which looks janky when many
   changes land in a row.

## Cause

On every rise of the site's change count the builder calls
`panel.reloadDocument()` (`app.js` ~879), which does `location.reload()` of
whatever page is showing (`panel.js` ~545). It doesn't know which page changed,
keeps no scroll position, and a reload is a fresh load, so entrance animations
play again.

## What changes

1. **Scroll position kept, no flash.** A refresh loads the new version in a hidden
   frame, scrolls it to the visible frame's position (same offset, clamped to the
   new page height), then swaps it in — reusing the panel's existing hidden-frame
   preload and swap (`SWAP_MS`) rather than reloading in place. If the client
   scrolls while the new frame loads, their latest position wins.
2. **Only refresh when the page you're viewing changed.** The site-changed signal
   names what changed: the pages (and, where known, sections) written, or a
   site-wide change (styles, fonts, palette, rhythm, shared header/footer, site
   config). The visible page refreshes only if it changed or something shared
   did. Another page changing leaves it alone (other views — Story, Comparisons,
   Looks — are unaffected as today).
3. **No entrance animations on a refresh.** A page loaded because something
   changed is rendered with entrance animations off (a render flag on the preview
   URL, never on published output). Opening a page yourself plays them as
   normal, and the preview offers a "Replay animations" control so motion can
   still be judged.
4. **Fewer refreshes during a burst.** While a build is making many changes, the
   visible page refreshes at most every few seconds (a configurable interval),
   plus once when the build finishes, so the client still watches the page grow
   without constant redraws.

## Test plan
- jsdom/browser: scrolled to 1200px, a change to the visible page swaps in the new
  version at 1200px with no blank frame.
- A change naming only `prices` does not refresh a visible `home`; a site-wide
  style change does.
- A refresh-triggered load carries the no-entrance flag and its entrance
  animations don't run; a user-opened page and "Replay animations" run them.
- Ten changes within the interval produce one refresh during the build and one
  at its end.


## Looks are separate pages (operator, 2026-10-21)

The "Current" draft refreshes every time a builder changes one of the looks. A look is its own page (e.g. `home-heavy-duty`), so item 2's rule covers it: a change naming only a look page must not refresh the real page, and a change to the real page must not refresh a look being viewed. Add to the test plan: a write to `home-<look>` leaves a visible `home` alone.


## As landed (free-coded, 2026-10-21)

**Origin.**
- Journal records may carry `pages` (the pages a write touched when that is not just `page`); setting up looks (`alternative.set`) records the look pages it wrote, not the page they are for.
- `scopeOf(slice)` (`journal-model.ts`) turns a run of changes into `{ pages, site }`: a record naming no page (palette, text styles, fonts, config, assets, gaps) or a truncated window makes it `site: true`.
- The draft feed's `draft` frames (`/api/sites/changes`) and the in-stream `site_changed` meta both carry `pages` + `site`.
- The builder preview honours `?still=1` (`PREVIEW_STILL_PARAM`): the page is served without the reveal script, which is the only thing that turns entrance motion on, so it renders settled. Builder preview only; published output never sees it.

**Builder.**
- `panel.reloadDocument()` no longer reloads the shown frame: it loads the page (where the frame actually is, links followed included) into a frame behind it, scrolls that frame to the shown frame's position read at swap time (the latest scroll wins; the browser clamps to the new height), then swaps it in with the panel's existing swap (the new page fades in over the old). A refresh asked while one loads re-points the same frame; a reader who navigated meanwhile keeps their page (the refresh is dropped). With the story board (a frameless mode) showing, the frame is only marked stale. Palette writes and segment saves use the same refresh.
- Refreshes the draft causes carry `still`; the View toolbar gains **Replay animations**, which refreshes the same page in place without the flag. Edit has no Replay (its render runs no page script).
- The visible page refreshes only when a signal names it (by id or slug) or is site-wide; a signal with no scope, or a page the listing cannot place yet, refreshes conservatively.
- Pacing: at most one draft-caused refresh per `previewRefreshMs` (builder option, default 3000 ms). The first change after a quiet spell shows at once; the rest of a burst shows once when the interval has passed. Whether the frame is behind is judged when the refresh is due, and a count already asked for is not asked again (the same write reported in the chat and on the feed starts one load).

## Test plan (as landed)
- `tests/test_UAT_FC_BUG-248_preview_refresh.test.ts` (jsdom): swap at 1200px with no blank frame; a scroll during load wins; `prices` and a look don't refresh `home`, a site-wide change does; a change to `home` doesn't refresh a viewed look; refresh URL carries `still=1`, Replay drops it and keeps the scroll, Edit has no Replay; ten changes → one refresh during, one after; the interval is configurable.
- `tests/test_UAT_FC_BUG-248_change_scope.workers.test.ts` (workerd/D1): a page write names that page and `site: false`; a palette write is `site: true`; looks name the look page; `?still` preview has no reveal script, the plain one does.
- Updated to the new mechanism/shape: BUG-192 and BUG-43 client and origin UATs, AC1249 (palette refresh, previously failing on clean code), AC970 (View's declared controls).