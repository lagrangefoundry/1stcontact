# repro-console — the reproduction console (REQ-254, [[EPIC-12]] §8)

A localhost-only dev console that runs one reproduction round end to end —
capture a site, reproduce its home page, diff the two — and puts the three
artifacts one click apart.

```
pnpm install                   # once — the launcher needs vite, newly declared here
./bin/repro-console            # http://127.0.0.1:8710
./bin/repro-console --port 9000
```

Enter an address, press **reproduce**. When the run finishes an *Iteration 1*
heading appears with three links — the original site, the reproduction, the diff
images — each opening in a new tab. **run again** re-runs the reproduction and
appends *Iteration 2* below it; earlier iterations stay on the page with their
own artifacts.

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
