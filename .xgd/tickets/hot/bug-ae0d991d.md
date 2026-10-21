---
uid: bug-ae0d991d
id: BUG-248
type: bug
title: 'Preview refresh: keep scroll position, refresh only the page that changed,
  no replayed animations, fewer redraws during a build'
created_by: EPIC-19
created_at: '2026-10-21T18:00:24.767152+00:00'
updated_at: '2026-10-21T19:03:27.805356+00:00'
completed_at: null
last_field_updated: body
status: draft
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