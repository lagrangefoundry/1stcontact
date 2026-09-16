---
uid: request-5b2763c8
id: REQ-254
type: request
title: 'Reproduction console: capture a site, reproduce its home page, show the diff'
created_by: EPIC-12
created_at: '2026-09-16T01:47:16.558352+00:00'
updated_at: '2026-09-16T02:56:59.270132+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9cd0e430
---

Parent: [[EPIC-12]] §8. First of three. **No AI in this ticket.**

## Goal

A local dev console that runs one reproduction round end to end and shows the
result, so a human can look at the original, the reproduction and the diff
side by side without assembling anything by hand.

This is useful on its own: even with no AI attached it collapses the setup cost
of today's manual reproduction loop, which is why it lands first.

## Behavior

1. The console is **started from the CLI** and **serves on localhost only**. It
   is never reachable from anywhere but the machine it runs on.
2. It opens on a **blank page carrying a text box and a [reproduce] button**, and
   nothing else.
3. Entering a site address and pressing **[reproduce]** **captures that site and
   runs a reproduction of it**.
4. When the run finishes, **a heading "Iteration 1" appears with three links
   beneath it**: **the original site** (for comparison), **the reproduction**, and
   **the diff images**.
5. **Every link opens in a new tab**, so following one never loses the console.
6. A **[run again]** button re-runs the reproduction and **appends a new
   iteration** — "Iteration 2", then "Iteration 3" — below the previous one.
   Earlier iterations stay on the page.
7. **Each iteration runs as a fresh `1c` process.** The CLI compiles TypeScript
   on the fly through a Vite SSR server, so a long-lived server would cache the
   module graph and silently keep running older code — an iteration that
   reproduced the previous iteration's result for no visible reason.
8. **Home pages only.** One page per site.
9. While a run is in progress the page **says so**, and pressing the button again
   during a run does not start a second one.
10. **If the capture or the reproduction fails, the page says what failed** and
    the console stays usable. A failed run does not leave a half-built iteration
    on the page.

## Isolation — it must not be deployable ([[EPIC-12]] §8.6)

11. The console **lives in `tools/repro-console/`, not `apps/`**, is **private**,
    **declares no build script**, and **ships no wrangler configuration**.
    `pnpm-workspace.yaml` globs `tools/*`, so it will be a workspace package and
    `pnpm -r build` will visit it; having no build script is what makes that
    visit a no-op.
12. **Dependency direction is one-way.** The console may import the reproduction
    engine. **No package under `apps/` or `packages/` may depend on the console**,
    directly or transitively.
13. Requirements 11 and 12 are **asserted by test**, not left as convention — the
    suite fails if the console acquires a build script or a wrangler config, or
    if a deployable package gains a dependency on it.

## Out of scope

- Any AI (that is [[REQ-256]]), and the fourth per-iteration link to the gap
  ticket the AI filed (also [[REQ-256]]).
- The regression rail (T2).
- Pages other than the home page.

## Testable at the end

Start the console, enter `joyfulculinarycreations.com`, press [reproduce]. The
"Iteration 1" heading appears with three links; each one opens in a new tab and
shows the real artifact — the live site, the reproduction, the diff images.
Press [run again] and "Iteration 2" appears below it. Kill the network and the
page reports the failure instead of hanging.

Related: [[EPIC-12]] §8.1, §8.3, §8.6 · [[REQ-150]] (why the CLI compiles on the
fly) · [[DOC-19]]