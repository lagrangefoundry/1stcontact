---
uid: comment-77992e39
id: COMMENT-2026
type: comment
title: Comment on bug BUG-42
created_by: xgd
created_at: '2026-09-01T21:03:43.763152+00:00'
updated_at: '2026-09-01T21:17:17.827357+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-034bf955
  kind: chat_transcript
---

<!-- xgd-turn id="ed89904f-f2c8-455c-bd05-4ce6b7f24074-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T21:03:29.034944+00:00" -->
#### You
There are some problems rendering the markdown content on the first contact site.

1. Markdown loaded from the chat transcript initially appears as text with md tags on first load of the site - on refresh it is rendered correctly
2. I the library tab the "What this is" is not being rendered as md

<!-- xgd-turn id="ed89904f-f2c8-455c-bd05-4ce6b7f24074-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T21:17:17.423886+00:00" -->
#### Claude
I'll start by reading the ticket and investigating both rendering issues.

The ticket is empty. Let me investigate both issues.

Now I have a full picture of both bugs. Let me confirm the app.js options shape:

Diagnosis is complete. Let me record the scope on the ticket before touching code.

Now cutting a branch for the work:

Baseline passes in the worktree. Now the shared engine module:

Now `chat.js` — stop it firing the loaders itself:

Now `app.js` — the wait, alongside the session open:

Now the Library description rendering:

Now wire it into `openDetail`:

Now let me run the existing suites to check nothing regressed:

Both existing suites still pass. Now the UATs:

All six pass. Let me confirm they actually catch the bug by reverting the fixes temporarily:

I lost my app.js edits with that checkout — re-applying them:

Now confirming the Library UATs catch their bug too:

Both halves are load-bearing. Now the regression scope:

Let me widen the regression scope to everything touching the builder:

Pre-existing worktree gap, now confirmed unrelated. Full builder scope green:

Now merging back into `xgd-working`:

Merge landed. Recording it on the ticket:

Both bugs are fixed, merged into `xgd-working`, and BUG-42 is at `free_coded` (`bd7612f977e33b9f307e929f20d1a7cb38e37cee`, v0.2.36).

## What was wrong

Both symptoms are the same miss in two places: **a surface painted markdown before the engine that renders it had arrived.** `marked` and DOMPurify are lazily imported from a CDN, and until they land `renderSafe` deliberately degrades to *escaped source*. That's the right answer when they're absent, and the wrong one when they're merely late.

1. **The transcript** — `chat.js` fired the loads and didn't wait; `app.js` replayed the transcript as soon as the session fetch answered. On a cold load the uncached CDN import lost that race, and since `mountChat` paints each turn once and offers no redraw, the turns stayed as source for the life of the page. On a refresh the import came from cache, won, and the identical code looked fine — that's the whole of "works after reload".
2. **The Library** — no race at all, just a permanent miss: `mountFields` reads a scalar and builds a plain-text read cell. It was never asked to render markdown.

## What changed

- New `builder/markdown.js` owns the engines: starts both loads at import, exports `markdownReady`, which settles on load *or* failure and never rejects. Offline stays a plainer panel, not one that hangs.
- `app.js`'s `showSite` awaits it alongside `openSession` — parallel, so no added latency; the existing generation guard already covered the extra async. The failure branch waits too, since its note is markdown as well.
- `library.js` repaints the description's read cell, keeping the component's own element so click-to-edit, its classes and its listeners survive — editing still opens the component's textarea over the markdown **source**. A `MutationObserver` follows the component's rebuilds (commit, cancel, rollback), and the paint is redone when the engines land so a detail opened cold upgrades itself.
- Rendering goes through `renderSafe` in both places: descriptions are LLM output written from client-supplied files, so the Library must not be the one surface inserting that HTML unscrubbed.

## Evidence

Six UATs in `tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts`, against the real components. The cold load is *driven*, not waited for — both surfaces take `markdownReady` as an injected promise the test holds open across the moment content arrives, because under vitest the real CDN import fails within a macrotask and the race isn't otherwise reproducible. I checked they're load-bearing: reverting the `app.js` wait fails 2, reverting the library paint fails 3.

Regression scope: all 16 builder-touching suites, 103 tests, green.

Two notes worth flagging:
- I hit and worked around two known worktree gaps — `src/generated/*` and `dist-assets/` are gitignored, so a fresh worktree fails those suites at import until they're copied from the main checkout. Pre-existing, unrelated to this change.
- `webui-fields` has no markdown-capable read cell; the repaint is a workaround for that gap. Closing it upstream in `lagrange-framework` would let the library drop the observer entirely — worth a ticket there if you want it, but I haven't filed one.

<!-- xgd-chat-end -->