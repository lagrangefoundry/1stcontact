---
uid: request-f8712e87
id: REQ-255
type: request
title: 'Regression rail: a recorded baseline per reference, and one command that says
  ''no worse'''
created_by: EPIC-12
created_at: '2026-09-16T01:47:35.544080+00:00'
updated_at: '2026-09-20T18:41:12.834880+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-5b470956
  commits:
  - working_sha: 20ffb158e9120f54dd3c7a0a5abd571281aaa742
    reconcile_sha: null
    main_sha: null
  - working_sha: e7b2e92baa63527dccacb62c8a96a106ca463e57
    reconcile_sha: null
    main_sha: null
  - working_sha: 9cff763a25e10aec8f012db51a2c76134b5b628a
    reconcile_sha: null
    main_sha: null
  - working_sha: 3d9fa8a4bba657cf77a9f897051eaf7a7caa5e81
    reconcile_sha: null
    main_sha: null
  version: 0.2.221
  story_points: 8
---

Parent: [[EPIC-12]] §8.4. Second of three. **Must land before [[REQ-256]]'s loop
starts proposing engine changes.**

## Goal

The safety rail for any change to the reproduction engine. It answers one
question — **"is everything still as good as it was?"** — and it must be able to
answer "no" convincingly, naming what broke.

The characteristic failure of iterative reproduction work is that **a fix aimed
at the site in front of you breaks the two you cannot see.** Nothing in the repo
currently records what a good result looks like per reference site, so "no worse
than before" is not computable today.

**Who runs it** ([[EPIC-12]] §8.2, §8.4). Its gating caller is the **free-coding
session** that implements a gap ticket: the session's UAT proves the one gap
closed, and only this rail proves the other references did not regress — a
distinction a single-site UAT structurally cannot make. [[REQ-256]]'s console
also runs it read-only, to display cross-site state per iteration.

## Behavior

1. **A gate baseline is recorded per stored reference site.** The baseline says
   what that reference's reproduction currently scores, in enough detail that a
   later run can be judged better, the same, or worse.
2. **One command runs the whole rail** and reports a single pass/fail, so an
   automated caller has exactly one thing to check.
3. The rail **re-gates every stored reference** — `faelan.com`,
   `gigabytealchemy.ai`, `joyfulculinarycreations.com` today — and **fails if any
   of them regressed against its baseline**.
4. **When the rail fails it names which reference regressed and on what**, not
   just that something did. A rail that says only "fail" cannot be acted on by
   the thing it is restraining.
5. The rail **runs the reproduction test suite** and **the typecheck**.
6. The rail **runs a Worker build check**. `apps/control-app` imports the
   reproduction engine directly from `tools/generate/src/`, so engine edits are
   edits to deployed code; a build check makes "the control app no longer
   builds" surface in the round that caused it rather than at the next deploy.
7. **Baselines are updated deliberately, never silently.** Re-recording a
   baseline is an explicit act by a person. An automated run may never move the
   bar it is being measured against.
8. The rail is **fast enough to run every iteration** — it sits in the inner loop,
   so its runtime is a design constraint, not an afterthought.

## Out of scope

- Any AI, and any automated change proposal ([[REQ-256]]).
- Adding new reference sites. Three is thin and it is enough to catch the failure
  mode that matters; growing the corpus is separate.

## Testable at the end

Run the rail on a clean `main`: it passes. Then deliberately break a serializer
in the reproduction engine and run it again: **it fails, and it names which
reference site regressed.** Both directions must be demonstrated — a rail only
ever seen passing has not been tested. Time the run and record the number, so
the subset-vs-whole-suite question ([[EPIC-12]] §9 Q7) can be settled with a
measurement.

Related: [[EPIC-12]] §8.4, §8.6 · [[REQ-254]] · [[DOC-19]] (the 3-probe gate)
---

## What landed

`./bin/repro-rail` — one command, one exit code. A dev tool with its own
launcher, deliberately not a `1c` subcommand: `apps/control-app` imports the
engine straight out of `tools/generate/src`, so making the CLI reach into these
tools would point the dependency arrow the way [[EPIC-12]] §8.6 forbids.

| File | What it is |
|---|---|
| `tools/repro-console/src/baseline.ts` | The recorded bar: what a metric is, how a number is read off a probe report, and the comparison that turns two of them into a named list of regressions. Spawns nothing and needs no browser — the judgement is the part most worth testing. |
| `tools/repro-console/src/rail.ts` | The four phases, the report, the argument parser, and `main`. |
| `tools/repro-console/src/run.ts` | Spawning and reading what a child process said. Shared with [[REQ-254]]'s console, which owned this code before the rail existed. |
| `tools/repro-console/bin/boot.mjs` | The Vite SSR bootstrap, now shared by both launchers rather than restated in each. |
| `bin/repro-rail`, `tools/repro-console/bin/repro-rail.mjs` | The launcher. |

**Phases**, in this order, cheapest first, and *all of them run* — a rail that
stopped at the first failure would hide the second:

1. `typecheck` · 2. `worker-build` · 3. `tests` · 4. `references`

**Probes per reference**: `l1-gate` (browser-free, geometry and envelope against
the bundle's own oracle) and `gate` (the rendered reproduction — structural,
value and perceptual, reconciled). References are **discovered**, not listed, so
a fourth one is gated by whoever adds it rather than by whoever remembers to
edit a list. A re-run **refolds** rather than re-captures: re-capturing would
re-roll the oracle, so the reference would move at the same moment the fold did
and the two changes would be inseparable.

### Behaviour these requirements imply, stated so it is not discovered later

- **A failure says why, not only what.** Requirement 4 is that the thing being
  restrained can act on what it is told. Naming the reference and the probe is
  half of that; a probe that fell over must also quote what the process said.
  The excerpt is taken from the **head** of the output, not the tail: a thrown
  error leads with its reason and unwinds into teardown chatter, so quoting the
  tail of the commonest failure (a browser that will not launch) yields
  "temporary directories cleanup" and nothing actionable. ANSI colour is
  stripped, because these lines are re-quoted inside the rail's own report.
- **A newly-failing test file is rerun on its own before it is called a
  regression.** Found by running the rail as its own final gate: it reported a
  file that passes alone and fails under the parallel load of a whole-suite run
  (shared fixture directories), which sends a session hunting a break in code it
  never touched. Requirement 4 is that the caller can act on what it is told, and
  a rail that cries wolf is one the caller learns to ignore — which costs more
  than no rail. Fails again → a regression, and the line says so. Passes → **not
  gated**: it failed once and passed once, so the rail has no verdict, and the
  file lands in the same not-gated list as a skipped probe, making the run
  PARTIAL and exiting 2. This is not retry-until-green — the rerun separates
  "reliably broken" from "no verdict available" and never manufactures a pass.
  An unreliable file is also kept **off the recorded bar**, because recording it
  as already-failing would lower the bar on one bad roll and stop the rail ever
  reporting that file again. Bounded at 10 files: one flake is worth a rerun,
  forty are a broken engine, and rerunning them to be told so again doubles the
  runtime of a rail whose runtime is a stated design constraint (requirement 8).

- **A run that gated less than everything is PARTIAL, never plain green.**
  `--no-browser`, `--reference` and `--only` all shrink coverage. `pass` answers
  "is anything worse"; `partial` answers "did this run look everywhere". The
  exit code keeps them apart: **0** nothing worse and everything gated · **1**
  something regressed · **2** nothing regressed but coverage was reduced. A
  caller checking `exit == 0` therefore gets the strict answer without having to
  know partial runs exist. A run that gated *no* reference at all is a failure,
  not a pass — the bundles are gitignored, so a fresh worktree has none.
- **The suite is judged against a recorded bar too.** The suite is not green on
  every machine, so the bar for it is the same kind of recorded set as the bar
  for a reference: a file that fails and is not on the list is a regression; one
  that is on the list and now passes is an improvement.
- **Improvements are reported and never fail the rail.** The bar only moves when
  a person moves it, so getting better is something the report says, not
  something it acts on.
- **A metric the bar does not carry is not a regression** (it was added since);
  a metric the bar carries and the run did not produce **is** reported. Coverage
  that quietly shrinks is the failure this whole rail is built against.
- **"The typecheck" is two commands, because this repo splits its packages
  across two script names.** `apps/*` and the two placeholder UI packages
  typecheck under `build`, which is the stage `bin/build` calls the typecheck.
  `packages/framework`, `packages/site-schema`, `tools/generate` and
  `tools/repro-console` typecheck under `typecheck` and are not reached by
  `build` at all. Running only the first — the original reading, on the
  reasoning that the rail should mean by "typecheck" what the build means —
  left **`tools/generate` unchecked by anything**. That is the reproduction
  engine: the one package this rail exists to guard. Both run; the phase fails
  if either does.
- **`tools/generate/tsconfig.json` gains `allowJs`** (`checkJs` stays off), which
  is what made the above possible: `pnpm -r typecheck` was red, because modules
  here import `apps/control-app/src/*.ts`, which import the one definition of a
  rule both sides of the browser/server seam need (`src/builder/email-shape.js`
  and friends, [[BUG-54]]). Without it, following those imports fails TS7016 on
  every one. `apps/control-app` already sets the same flag for the same reason;
  this program reaches that one, so it needs it too.
- **Baselines are gitignored** (`/storage/rail/`), for the same reason the
  reference bundles are: the numbers are taken from those uncommitted bundles,
  and the perceptual ones come from rasterising a page in whatever browser the
  machine has. A committed baseline would be a claim about one laptop that every
  other machine fails.
- **`slugForUrl` takes a namespace prefix.** The rail reproduces the same
  references the console does; one shared sandbox slug would have each rebuild
  the other's site underneath it.

## Measurements

Run on a clean branch, `--no-browser` (this machine cannot launch Chromium —
see below). **Whole rail: 271s.**

| Phase | Time |
|---|---|
| typecheck | 5.9s |
| worker-build | 1.7s |
| tests (527 files, whole suite) | 247.9s |
| references (3, `l1-gate` only) | 15.7s |

Two later whole-rail runs on the same machine took **229s** and **376s**, the
whole spread in the suite phase (208s / 355s) — so the number is machine load,
not a stable constant. The ratio is what settles [[EPIC-12]] §9 Q7: **the test
suite is 91% of the runtime**, and everything else together is ~23s, on every
run measured. An inner
loop that wants to run every iteration should narrow the suite (`--tests`) and
take the whole rail at the end of a round; `--tests` is reported in the summary,
so a narrowed run can never be mistaken for a full one.

## Both directions demonstrated

Requirement: a rail only ever seen passing has not been tested.

**Passing** — clean branch, full rail: PASS, exit 2 (partial: no browser).

**Failing** — `buildGeometry`'s keyframe serializer in `tools/generate/src/l1/fold.ts`
changed to `x: Math.round(box.x) + 2`. The rail failed and named every affected
reference and exactly what moved on each:

```
regression rail: FAIL  (13.3s)
  ✗ faelan.com: the 3-probe structural gate was passing (l1-gate.pass) and now fails
  ✗ faelan.com: the worst geometry delta, in px moved 0.95 → 2.42 (l1-gate.sampleFidelity.maxDelta)
  ✗ faelan.com: deltas over tolerance moved 0 → 22 (l1-gate.sampleFidelity.residuals)
  ✗ gigabytealchemy.ai: … moved 0.89 → 2.45 … · deltas over tolerance moved 0 → 55
  ✗ joyfulculinarycreations.com: … moved 0.98 → 2.48 … · deltas over tolerance moved 0 → 127
```

The engine was restored afterwards; no deliberate break is committed.

## What the rail does not catch, found while demonstrating it

Recorded because a rail is only worth what its coverage is, and these were
established by experiment rather than assumed.

1. **This machine cannot run the browser probe at all.** Chromium dies at
   launch (`bootstrap_check_in … Permission denied`), so every run here is
   `--no-browser` and the recorded bar carries **`l1-gate` metrics only**. The
   report says so on every run and the exit code is 2, which is the design
   working — but it means the bar as recorded here is the weaker half.
2. **`l1-gate` is insensitive to fold *axis* changes.** Doubling every folded
   `fontSizePx` left `sampleFidelity.maxDelta` bit-identical on all three
   references. L1 pins geometry from observation, so an axis value does not move
   the evaluated boxes. `l1-gate` catches geometry and envelope breakage; it
   does not catch axis drift, and nothing browser-free does.
3. **A metric can improve while the page breaks.** Undoing [[REQ-88]]'s
   `Math.ceil` on text-run width — the documented regression where the Gigabyte
   Alchemy hero reflowed onto a second line — moved `maxDelta` 0.95 → 0.50 on
   every reference and was correctly reported as an **improvement**. It is one:
   rounding to nearest genuinely reduces the delta against the oracle box. The
   reflow it causes happens at render time, in a browser, where only the `gate`
   probe can see it. This is the sharpest argument that the browser probe is not
   optional, and the reason `--no-browser` exits 2 rather than 0.

None of these are new defects — they are properties of the existing 3-probe gate
([[DOC-19]]) that the rail inherits and now makes visible. Widening what a
browser-free probe can see is engine work, and belongs to a gap ticket rather
than to the rail that measures it.

## Test plan

`tests/test_UAT_FC_REQ-255_regression_rail.test.ts` — 44 UATs. The rail, its
phase sequencing, its baseline document and every judgement it makes are driven
for real, through a real temporary repo with reference bundles on disk and a
baseline written and read back. The one substitution is a headless browser
rendering three third-party sites: commands are reached through an injected
`CommandRunner`, which is the seam the production runner plugs into, and the
substitute prints the documents the real `--json` verbs print. The contract with
the real CLI — that `1c l1-gate` still takes the flags the rail passes and
prints a document whose every metric path resolves — is checked **unmocked**
against a stored bundle.