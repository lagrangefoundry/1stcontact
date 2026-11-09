---
uid: comment-e9060200
id: COMMENT-8071
type: comment
title: Comment on bug BUG-397
created_by: xgd
created_at: '2026-11-09T06:22:37.240963+00:00'
updated_at: '2026-11-09T07:16:16.117447+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-7935a7ed
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8f926475-af88-4ff8-ac44-6b9b2eafa731",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="91919c95-7d82-4985-b7a6-14d117dbfd81-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T06:21:08.866450+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="91919c95-7d82-4985-b7a6-14d117dbfd81-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T07:16:15.497869+00:00" -->
#### Claude
Not a duplicate (closest are REQ-649 and BUG-260, which are different). Now reading the font-face, preload and page-head code before I scope the fix.

Still scoping: the tuned fallback (items 4–5) needs each font's metrics, and the data model has none, so I'm checking where the font files are available at build time.

Still mapping the build: next is how `renderSiteFiles` gets assets, so I can find the font bytes there and compute each face's metrics.

Found a precedent: REQ-655 already ships a per-family font-advance table into the framework renderer. Checking whether it can also carry the vertical metrics the tuned fallback needs.

Site CSP allows inline scripts, so a small head script plus CSS-timer fallback works. Now checking item 9: modules that write `<style>` after their markup.

Not a duplicate, scope is clear, so I'm starting: setting the ticket to `free_coding` and cutting the branch.

Branch cut. Making the worktree runnable (node_modules links, per the known recipe).

Plan settled. Before writing code, checking how first-section images are emitted (an `<img>` or a CSS background), since the reveal needs to wait on the hero still.

Writing the metrics generator (`tools/generate/src/fonts/metrics.ts`).

Wiring the command into the CLI, then running it against the staged mirror.

Table generated (1,931 families; Arial reads 0.441 em average width, matching published figures). Now the framework side: the stand-in faces, the first-screen alias, preload tags and the reveal gate.

Now the framework module for the stand-ins, preloads and reveal gate.

Fixing a specificity slip in the `<noscript>` override, then wiring this into `render.ts`.

Exporting the new pieces from the framework index, then type-checking.

Framework type-checks clean. Now the page head in `tools/generate` (preloads + reveal), then the module style ordering.

Only pre-existing control-app type errors, none from my changes. Now item 9: moving each module's `<style>` ahead of its markup.

Module styles now precede their markup. Writing the UATs next; checking for a committed font file to serve in browser tests.

Using the committed IBM Plex Sans woff2 files (400 and 600) as test fonts. Checking the metrics table knows that family and what a starter site's pages look like.

Writing the UAT file.

Pointing the reveal's font wait at the first-screen alias (the face the title actually paints with), then running the suite.

All 11 UATs pass. Now regression: these changes touch every L1 render's CSS, the page head, module markup and capture, so I'll run the full suite in batches per the known recipe.

519 affected test files. Running them in foreground chunks with a JSON reporter.

Many failures in builder/assistant suites that look environmental. I'll run all chunks first, then baseline only the failing files in a clean worktree at the branch base.

All chunks completed: 3,659 passed, 172 failed across 74 files. Building a clean baseline worktree at the branch base to see which of those were already red.

8 failures are new on the branch. Looking at each one's message.

AC1041's rule-splitting regex only worked with one `@font-face` rule; with several in a row it spans across them. The assertion is still right, so I'll fix the regex. Reading the other five.

Type-checks clean. Now updating the five tests that pinned the old exact output, keeping each one's original intent.

All 51 pass. Checking the workerd test project for suites that touch rendering, since I excluded `*.workers.test.ts` above.

Workers suites: identical 47 pass / 23 fail on the baseline, so nothing new there. Re-running my UATs twice to check for timing flakiness, then removing the baseline worktree.

Adding one more UAT for a consequence of the change: capturing a rendered page must read back the author's font stack, without the `fc-` names.

Capture strip verified offline. Now updating the ticket body with what landed (appending, preserving the existing text).

Ticket body updated. Committing on the branch, then the lock / merge / version / free_coded sequence.

Merged cleanly. Re-running my UATs and the adjusted suites on the merged tree before bumping the version.

BUG-397 is fixed and merged into `xgd-working`, and the ticket is at `free_coded` (version 0.2.844, 8 story points). It isn't a duplicate: REQ-649 and BUG-260 are related but cover neither the font swap nor the piecemeal reveal.

**What changed**
- **The hero title never shows a stand-in font.** Text in the first screen (the header, and all text in the page's first section) first names a copy of its font that stays invisible until the font loads. If the font is merely slow, the title waits up to the browser's ~3 s limit and then shows a stand-in. If the font request fails, the stand-in shows straight away.
- **Body text below still appears straight away,** in a local stand-in matched to the real font's size and weight (light text stays light). When the real font arrives, the letterforms change but the text doesn't move or rewrap. The sizes come from a new table generated from every font we offer, by a new command, `1c fonts metrics`.
- **Only the first screen's fonts are preloaded** from `<head>`, next to the hero image preloads.
- **The first screen appears whole.** The page stays blank until the first screen's fonts and on-screen images are ready, then fades in over 120 ms. A CSS timer shows it after 1.5 s regardless, and visitors with JavaScript off see it at once. This applies to the published site, the draft and the builder's preview, but not the edit view.
- **Modules style themselves before they appear.** Contact form, carousel, catalog, checkout and both account modules now write their styles ahead of their markup.
- **Captures ignore the new font names,** so re-capturing a rendered page reads back the font list the author wrote.

**Testing**
- 11 of the 12 new UATs in `tests/test_UAT_FC_BUG-397_first_screen_arrives_whole.test.ts` pass, three runs in a row. The browser ones load the page in Chromium with the font or photo delayed, stalled or failed, and check every frame.
- The 12th, the capture test, skips in this sandbox, as REQ-649's capture test does. I checked the capture change by running the edited script directly instead.
- Regression: I ran the 519 test files that touch rendering, plus the 10 related Worker test files, and compared them with a clean copy of the branch base.
  - Two new failures were load flakes that pass when run alone.
  - Five existing tests checked the old exact font output, and I updated them with their intent kept: AC-727, AC-685, AC-1041, REQ-88 and REQ-90. AC-1041 also had a pattern that only handled one font rule in a row.
  - Everything else that failed also fails on the base.
- The `tests/browser/` suite can't run in this sandbox and wasn't run.

**Worth knowing**
- If a hero photo is a CSS background rather than an image element, the reveal doesn't wait for it; the 1.5 s limit still applies.
- Body text in the first section waits for its font too, not just the `<h1>`. That was a deliberate choice so the whole first screen arrives in one go.
- Nothing is deployed. Sites pick this up at their next build, and dev only changes after `bin/deploy --env dev`.

The ticket body now records the as-built design, the five adjusted tests and the hero-background limit.

<!-- xgd-chat-end -->