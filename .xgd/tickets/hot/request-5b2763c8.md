---
uid: request-5b2763c8
id: REQ-254
type: request
title: 'Reproduction console: capture a site, reproduce its home page, show the diff'
created_by: EPIC-12
created_at: '2026-09-16T01:47:16.558352+00:00'
updated_at: '2026-09-16T17:44:26.837827+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9cd0e430
  commits:
  - 0d467ee00f5f8b20bc4faada7ba707fb818b1d11
  - 657a4024e15e38a9a82b3d2b1f80f85a91dc607c
  version: 0.2.216
  story_points: 8
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

## Revisiting a site, and watching the fold move

A reproduction is not a single sitting. An operator captures a site, runs a few
iterations, leaves, changes the engine, and comes back — and the question they
come back with is *how much has this moved*, which needs yesterday's iterations
still on the page next to today's.

29. **A capture already on disk is reused, not re-taken.** Pressing
    **[reproduce]** on a site that has a stored bundle **skips the capture step
    and refolds the stored bundle instead**. This is requirement 15's reasoning
    applied to the first press rather than the second: re-capturing re-rolls the
    oracle, moving the reference at the same moment the fold moves, and the
    comparison an iteration exists to make is exactly the one that destroys.
    Reusing is therefore the default and the safe direction.
30. **[recapture] is the explicit way to re-hit the site.** A separate button,
    because deliberately moving the reference is a real thing to want — the site
    changed — and it must be a thing the operator *chose*, never something that
    happened because they pressed the ordinary button twice.
31. **The blank page lists the sites already captured.** Each is a link that
    loads that site without re-capturing it, so revisiting is one click and does
    not require remembering how the address was typed the first time. This is
    what makes requirement 2's blank page blank *on a fresh checkout* and useful
    on a worked-in one.
32. **`1c capture list --json` reports the stored bundles**, for the same reason
    requirement 19 gave `capture page` a `--json`: the console cannot derive
    them. A bundle is named after the host that answered, so which captures
    exist — and where each one sits — is a question only the engine can answer.
33. **The iteration list is rebuilt from disk, not held in memory.** Each
    iteration directory carries a small manifest recording what the iteration
    was, so loading a site recovers the iterations it already has, with their
    links live. Restarting the console, or opening a second one, therefore shows
    the history that is on disk rather than an empty page beside a full
    `storage/tmp/`. A console's memory of a site is the disk's, not the
    process's.
34. **Each iteration keeps the reproduction's own L1 document.** The rendered
    pixels and the diff images are kept per iteration (requirement 17) but the
    reproduction *itself* — the page document `1c repro` wrote, carrying the
    folded L1 — was being rebuilt in place and overwritten by the next
    iteration. That document is where a fold change actually lives; keeping only
    its rendering keeps the symptom and discards the cause. So it is copied into
    the iteration's own directory and **is the iteration's fourth link**.
    ([[REQ-256]]'s gap-ticket link is a *fifth*, not this one.)
35. **Two consoles must be pointed at different sites.** A site is one sandbox
    slug and one scratch directory (requirement 25), both derived from its host
    and both rebuilt in place, so two consoles running the same site at once
    overwrite each other. Different sites share nothing and run concurrently
    without interfering — which is the supported way to work several
    reproductions at once, each on its own `--port`.

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

## What an iteration actually runs

14. An iteration is a **sequence of separate `1c` invocations**, each its own OS
    process (requirement 7), run from the repo root:
    **capture** (first run on a site only) → **refold** → **repro** →
    **render** → **diff**. A step that fails ends the iteration (requirement 10);
    the steps after it do not run.
15. **A re-run does not re-capture.** It **refolds the stored bundle from its own
    retained oracle** before reproducing, so an engine change is picked up
    without re-hitting the site. Re-capturing would re-roll the oracle and move
    the reference under the comparison, making a fold change and a reference
    change inseparable — which is exactly what the iteration is trying to tell
    apart.
16. **[reproduce] and [run again] are different verbs.** [reproduce] takes an
    address, captures it, and **starts the iteration list over at "Iteration 1"**
    for that site. [run again] takes no address, re-runs the site already loaded,
    and **appends** the next iteration.
17. **Each iteration's artifacts are kept separately**, so following iteration 1's
    links after iteration 3 has run still shows iteration 1's reproduction and
    iteration 1's diff images rather than the newest ones. They land under
    `storage/tmp/`, which is scratch space and is not committed.
18. **A non-empty diff is a result, not a failure.** `1c diff` exits non-zero
    whenever it finds a region of interest, which is the normal case for every
    reproduction worth looking at. The console judges that step by **whether it
    produced its report**, not by its exit code — otherwise every real iteration
    would be reported as a failed run.

## Where the bundle landed

19. The capture step **reports the bundle it wrote in a machine-readable form**,
    because the console cannot derive it: a capture is named after **the host
    that answered**, which may not be the host that was typed (`www.` added or
    dropped), and every later step in the iteration has to point `--ref` at that
    exact directory.


## Implementation consequences

These are behaviours the requirements above imply rather than state, recorded
here because they are asserted by test and would otherwise look unmotivated.

20. **Static resolution is reused, not restated.** The console serves each
    iteration's rendered site and diff images off disk, which needs the same
    confinement, directory-index and extensionless rules the builder origin
    already has. That resolver lived in `tools/generate/src/cli/serve.ts`, whose
    other imports drag the node-only store barrel (and its
    `@cloudflare/workers-types` ambients) along with it — a cost a console that
    serves two scratch directories has no reason to pay, and the alternative was
    a second copy of a traversal guard, which is the failure `serve.ts`'s own
    note says must not happen. So the resolver moved to
    `tools/generate/src/cli/static-file.ts`, unchanged, and its two existing
    callers (`builder.ts` and the CLI barrel) now name that module directly.
    **No re-export is left behind on `serve.ts`** — one import path to the
    resolver, not two.
21. **A served path cannot escape its iteration.** `/iteration/<n>/…` resolves
    inside that iteration's own directory and nothing above it; an attempt to
    climb out is refused rather than served, and an iteration that does not
    exist is a 404 rather than a hole.
22. **Artifact URLs carry a trailing slash.** Without it a reproduction's
    document-relative asset references resolve one level too high and the page
    loads with no CSS and no images, so a link that arrives without one is
    redirected to the slash form.
23. **Nothing the console serves is cached.** Every byte of it is rebuilt under
    the browser by the next iteration, so a cached copy is a stale answer to
    the one question the console exists to ask.
24. **The diff link is a page, not a directory listing.** It shows what
    `1c diff` reported, in [[DOC-19]]'s worst-first reading order: the headline
    numbers, then the two heatmaps, then a reference / reproduction / difference
    triptych per ranked region. The crop paths in `regions.json` are absolute —
    `1c diff` wrote that report for an operator reading it on their own disk —
    so the console serves the same files by name out of the iteration's own
    directory.
25. **A site is one sandbox slug, derived from its host.** Re-running rebuilds
    that sandbox site in place, which is what `1c repro` already does; the
    iteration's *artifacts* are what is kept separately (requirement 17).
26. **`1c capture page` grows a `--json` flag** (requirement 19). Under it the
    command reports `{url, name, dir, sections, assets, l1Nodes, widths}` and
    prints nothing else — the whole command runs through `withCleanStdout`, so
    a browser launch, a font fetch or a Vite notice cannot land in the middle
    of the document. Without the flag the prose line is unchanged.
27. **A failed step is reported by name, with what the process said.** The last
    few informative lines are kept, and lines with no word character in them
    are dropped first: Playwright prints its "browser is not installed" refusal
    inside a drawn box, so the literal last line of the commonest capture
    failure is box-drawing characters — which said that the run failed and
    nothing whatever about why.

28. **A deployable package is a directory with a manifest.** Requirement 12's
    check enumerates what sits under `apps/` and `packages/`, and a checkout may
    carry directories there that are not packages at all — an editor's or an
    agent's own dotfile directory. Those cannot be deployed, so they are not
    what the check is about; a manifest is what makes a directory a package,
    which is what `pnpm-workspace.yaml` means by its glob too.

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

## Implementation decisions

- **Started by its own launcher, `bin/repro-console`**, which mirrors `bin/1c`:
  a bash wrapper into `tools/repro-console/bin/repro-console.mjs`, which boots a
  Vite SSR server and loads the TypeScript console. It is deliberately **not** a
  `1c` subcommand — that would make `tools/generate` (whose source the control
  app imports directly) depend on the console, pointing the dependency arrow the
  wrong way through the package the deployable Worker reads from.
- **The console spawns `1c`; it does not import the engine.** Requirement 7 needs
  a fresh process per step anyway, and a process boundary is a stronger version
  of requirement 12 than an import rule.
- **The page is rendered by the server on every request**, and carries a version
  number. The browser polls a small status endpoint for the running/failed line
  and reloads when the version moves. There is no client build step and no
  duplicated markup.
- **One dependency: `vite`.** The console declares nothing else — everything it
  does is node builtins and the `1c` binary. `vite` is there because the console
  is TypeScript and node cannot import it directly; the launcher boots a Vite
  SSR server and loads the console through `ssrLoadModule`, the same bootstrap
  `bin/1c` uses and for the same reason ([[REQ-150]]). The bootstrap is written
  out rather than shared with `tools/generate`: reaching in for it would put the
  console into the import graph of the package the deployable Worker reads its
  engine out of, which is the one direction requirement 12 forbids.

Related: [[EPIC-12]] §8.1, §8.3, §8.6 · [[REQ-150]] (why the CLI compiles on the
fly) · [[DOC-19]]