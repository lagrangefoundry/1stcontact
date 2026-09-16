# repro-console — the reproduction console (REQ-254 / REQ-256, [[EPIC-12]] §8)

A localhost-only dev console that runs one reproduction round end to end —
capture a site, reproduce its home page, diff the two — and puts the three
artifacts one click apart.

```
pnpm install                   # once — the launcher needs vite, newly declared here
./bin/repro-console            # http://127.0.0.1:8710
./bin/repro-console --port 9000
```

Enter an address, press **reproduce**. When the run finishes an *Iteration 1*
heading appears with links — the original site, the reproduction, the diff
images, the reproduction's own L1 document — each opening in a new tab. **run
again** re-runs the reproduction and appends *Iteration 2* below it; earlier
iterations stay on the page with their own artifacts.

## The AI round ([[REQ-256]])

As soon as an iteration's links appear an **AI process starts**, reads that
round's evidence, and finishes by **filing a gap ticket against the reproduction
engine**. Its transcript streams onto the page underneath the iteration, and the
ticket it filed becomes a fifth link. Then it stops: the operator free-codes the
ticket in the ordinary way and presses **run again**, which reproduces with
whatever has landed since.

**The round writes no code.** It is a `claude -p` process whose tool allowlist
grants reading and `xgd ticket …` and nothing else — see `AI_ALLOWED_TOOLS` in
`src/ai.ts`. Two falsifiers run after every round and are shown on the page: the
working tree is compared before and after, and the filed ticket's status is read
back (it must be `draft`; a `ready_*` status is a dispatcher trigger).

A **`capture-incomplete`** verdict means the reference itself is wrong, not the
engine. The console reads that verdict out of `gate.json` and starts no AI
process at all — the round stops and files nothing.

What the round is told is `brief/DIAGNOSE-THE-GAP.md`: a document, reviewed in
the diff that changes it, distilled from [[DOC-19]] and [[EPIC-12]] §7.4–§8.5.

```
REPRO_CONSOLE_AI=my-claude          # a different executable
REPRO_CONSOLE_AI_MODEL=opus         # a different model
REPRO_CONSOLE_RAIL=off              # don't wait for the rail this round
```

The **regression rail** ([[REQ-255]]) runs read-only once per iteration and its
findings are shown beside the links, so each round sees the cross-site state
rather than only this site's. Its verdict never fails the iteration — that
gating belongs to the free-coding session that implements a gap ticket.

The round runs the rail's **`references` phase only** — the cross-site
comparison. The other three phases (typecheck, worker build, the test suite)
gate the *checkout*, and re-running them between two iterations that changed
nothing would spend minutes to re-answer a question no reproduction asked. The
narrowing is never silent: the rail reports what it did not cover and that
carries onto the page. A checkout with no recorded bar says so rather than
passing by default — record one with `repro-rail record`.

## It is not deployable, by construction ([[EPIC-12]] §8.6)

It lives in `tools/`, not `apps/`; it is `private`; it declares **no `build`
script**, so the `pnpm -r build` visit `pnpm-workspace.yaml`'s `tools/*` glob
guarantees is a no-op; it ships **no wrangler configuration**; and nothing under
`apps/` or `packages/` may depend on it. All of that is asserted by
`tests/test_UAT_FC_REQ-254_isolation.test.ts` rather than left as convention.

## It spawns `1c`; it does not run the engine in-process

Every step of an iteration is a **fresh `1c` process**. `1c` compiles TypeScript
on the fly through a Vite SSR server ([[REQ-150]]), so a long-lived server would
cache the module graph and keep running the code it booted with — iteration N+1
would silently reproduce iteration N's result. See `src/iteration.ts`.
