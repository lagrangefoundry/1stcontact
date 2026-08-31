---
uid: comment-34e04d9c
id: COMMENT-590
type: comment
title: Comment on request REQ-109
created_by: xgd
created_at: '2026-07-30T20:04:06.821881+00:00'
updated_at: '2026-07-30T20:14:31.301251+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2ea36591
  kind: chat_transcript
---

<!-- xgd-turn id="f1419930-029a-4d94-a869-1bfc80db4af8-user" -->

<!-- xgd-chat role="user" ts="2026-07-30T20:04:04.497998+00:00" -->
#### You
please free code this ticket

<!-- xgd-turn id="f1419930-029a-4d94-a869-1bfc80db4af8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-30T20:14:31.270826+00:00" -->
#### Claude
I'll start by reading the ticket and the relevant renderer code.

Now the implementation. Adding the `relativizeUrl` normaliser at the three sinks:

Now the flatness assertion at render time:

Now the UAT file:

Now the four `reconciliation-*` AC tests:

Now the full suite, compared against the clean-tree baseline:Renders correctly — custom fonts and the grid SVGs all resolve. Now the version bump and commit:

Now updating the ticket body to reflect what actually landed:

Done. REQ-109 is committed and at `free_coded`.

**What landed** (`c72e50b46`, version `0.1.5`):

- `packages/framework/src/l1/render.ts` — one `relativizeUrl` rule applied at the three emission sinks (`cssUrl`, `<img src>`, link `href`), **after** the existing `isSafeUrl` / `CSS_URL_ALLOWED` checks, so the security envelope is unchanged. `//host/…`, absolute URLs and `#anchor` pass through untouched; a bare `/` maps to `./` rather than the empty string (an empty `href` resolves to the current *page*, not the snapshot root).
- `tools/generate/src/render/render.ts` — the flatness invariant is now asserted: a nested page slug throws rather than emitting silently-wrong relative URLs.
- `tests/req109-relocatable-output.test.ts` — the four acceptance UATs, including a real loopback server that mounts the rendered `xgd` directory under `/site/xgd/draft/deadbeef01/` and fetches every reference resolved browser-style, asserting no 404s.

**Verification**: full suite 932 passed. The 4 remaining failures (`reconciliation-1c-astro-free-render`, both `3probe-gate` files, `reconciliation-l1-fold-full-language`) fail identically on a clean tree — I stashed and confirmed. They pre-date this ticket and are untouched by it. `pnpm -r build` typecheck clean. Rendered `xgd` and screenshotted it: custom faces load, grid SVGs paint.

**Re-baselining** — the cost the ticket predicted. Nine expectations across eight suites now expect `url("assets/…")` instead of `url("/assets/…")`. No assertion was weakened; each still pins its original behaviour (safe-only sink, font-face binding, background layer order, anchor retagging, self-contained reproduction).

Two things worth flagging:

1. **The `l1-gate` re-run you'd want as belt-and-braces didn't happen.** The in-repo `gigabytealchemy.ai` reference bundle predates multi-state capture, so the gate refuses it and wants a fresh `1c capture page` against the live site. I reasoned it through instead: the 3-probe gate is analytic over the L1 document (`evalGeometry`), never over emitted URLs, and `1c serve` mounts a snapshot at the root so `assets/x` and `/assets/x` resolve identically to the capture. Plus the empirical render+shot. That's sound but it is not the gate actually running — if you want the belt-and-braces, a re-capture is the missing step.

2. **Nothing serves a snapshot under a prefix yet.** The UAT proves the bytes resolve under one, using its own test server; the real path-based preview is the R2 artifact store / public-site Worker tickets this unblocks.

<!-- xgd-chat-end -->