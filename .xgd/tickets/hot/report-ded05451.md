---
uid: report-ded05451
id: REPORT-2389
type: report
title: 'Reconciliation Review: commits (BUNDLE-19)'
created_by: xgd
created_at: '2026-08-20T06:14:38.013491+00:00'
updated_at: '2026-08-20T06:14:38.013491+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-77b28def
  anchor_uid: bundle-77b28def
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: bundle-77b28def
**Stories Reviewed**: 9

The failure is **not** a coverage or fidelity failure. Step 4 (intent fidelity and
behavioural coverage) and Step 6 (plan-item accounting) both pass, and the story bodies
are unusually good: every one of the nine records its own intent/code divergences
explicitly rather than absorbing them. The failure is **Step 5b — evidence
sufficiency**. Four active acceptance criteria have UATs that *fail against the tree as
it stands*, and in each case the failure is the UAT correctly catching a story claim the
code does not honour. Nothing in the workflow noticed, because every `Scoped quality`
report produced during this reconcile recorded `suites: {}` — 0 tests, 0 failed.

## Behavior Inventory

13 behaviour clusters identified in the code, across the eleven behaviour-bearing
commits (8e66fef, 90b762c, ceed377, b269998, e70668d, 6b94ba9, 2dbf7e7, aea40e5,
cd6f00c, b179902, da7d31b). They match the anchor plan's inventory; the independent read
of `cli/index.ts`, `cli/edit.ts`, `cli/shared-store.ts`, `cli/ai/toolbox.ts`,
`store/*`, `packages/site-schema/src/l1/{palette,shade,edit}.ts`,
`packages/framework/src/l1/render.ts`, `apps/control-app/src/builder/*`, `bin/*` and the
three vitest configs surfaced no behaviour the plan had missed. `grep -a` was used
throughout — `builder.ts` and `fidelity.ts` carry NUL cache-key separators and are
skipped silently by a plain `grep -r`.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `1c palette get/set/add/rm/rename` + `/api/palette`, per-entry census, server-side delete/rename guards | Covered | story-ee073693 | Story flags two divergences of its own (full census on a write is origin-only; rename-to-own-name is accepted as a no-op write) |
| 2 | `mapL1PaletteRefs` — one structural walk under count, resolve and rename | Covered | story-ee073693 | |
| 3 | Palette popup: manage + pick, usage-labelled swatches, continuous shade slider on the renderer's own Oklab arithmetic, shared modal shell | Covered | story-4300366a | Story flags the evidence gap on the post-write preview refresh |
| 4 | Draft change journal: counter, windowed self-describing records, `list_changes`, `1c changes`, per-turn reminder signal | Covered | story-6cd17452 | Story records the "transactionally with the write" divergence and its safe direction |
| 5 | Colour as a segment field (`color`, `surfaceFill`), palette-membership validation, shade bounds, unknown keys refused | **Partial** | story-37a3921b | Covered as documented, but the *panel* half is broken for a reference-only fill — see finding 2 |
| 6 | Locked controls generalised: `reason` paired with `locked`, `GLYPH_GRADIENT_LOCK`, `NO_ITALIC_FACE_LOCK`, `lockError` refusing a change never the status quo, `(locked: …)` in `1c copy get` | Covered | story-37a3921b | |
| 7 | The colour row, the escalation row, the lock's visible face | **Partial** | story-3bf94bd4 | Escalation row vanishes after its own gesture — finding 2 |
| 8 | Editing box mirrors capitalisation and tracking | Covered | story-3bf94bd4 | AC-1284 new; AC-1138 widened from three parameters to four, closing the recorded divergence |
| 9 | `1c kb build/export/status`, strict-boolean opt-in, named skips, generated map, parsed declaration, byte-change-only writes | Covered | story-c4f329d3 | Story records the yaml→json declaration divergence and the one deliberate "count, not names" exception |
| 10 | Session knowledge surface: `KnowledgeToolbox` in one Toolbox, doubly-scoped read-only grant, landscape-first priming, degradation not failure | Covered | story-a58a0974 | |
| 11 | `SiteStore` port, two injected adapters, no path-returning verb, one write verb, site factory, "a directory holding no definition is not a site" | Covered | story-3f4a5f2b | Story deliberately declines to encode the retracted pool-pin rationale |
| 12 | Vitest node/workerd project split, routing by filename, production compatibility settings | Covered | story-3f4a5f2b | |
| 13 | `bin/build` / `bin/deploy` / `bin/smoke`, `1c preflight`, hook seams, `[env.production]` inheritance guard, secret mechanism | **Partial** | story-d5167ced | The preflight's exit code and named remedy are claimed and absent — findings 3 and 4 |

**Intent fidelity (Step 4A).** Every behaviour the nine intents declare is represented,
and the three items whose intents were superseded (STORY-100, STORY-101, STORY-103) each
had the superseding text applied: STORY-100's colour deferral clause is replaced by the
"arrives by the same route a fifth time" passage; STORY-101's colour/panel-background
clause is narrowed to family/line-height/alignment and its capitalisation divergence is
explicitly closed; STORY-103's "no retrieval is claimed here" is replaced by the four
new knowledge criteria. Three findings REQ-144 deliberately left unfixed (NXDOMAIN
hostname, never-deployed control-app, unproven live secret push) are recorded in
story-d5167ced's Technical Context and claimed by no criterion, as the plan required.

## Ungrounded Stories

| Story | Claim | Issue |
|-------|-------|-------|
| story-ee073693 | AC-1239: a session granted the palette writes "sees the same refusals an operator sees — a removal of an entry in use is refused **naming the count**" | The assistant's refusal is the generic `CONFLICT` template from `tools/generate/src/cli/ai/l1-surface.json:122` ("the name or path is already taken. Choose a different one."). The store's own message (`tools/generate/src/cli/edit.ts:1686`, `'primary' is used 3 times and cannot be deleted.`) is discarded before the model sees it. |
| story-d5167ced | Description + AC-1330: the preflight "refuses an incomplete tree with an environment-specific exit code, naming what is absent **and the command that installs it**" | The remedy lives in `CommandError.hint` (`tools/generate/src/cli/shared-store.ts:113`) and is never printed; the exit code is 1, not 6. |

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Palette Management: `1c palette` & `/api/palette` | story-ee073693 | ✓ (11 ACs) |
| 2. Builder Palette Popup | story-4300366a | ✓ (12 ACs) |
| 3. Draft Change Journal | story-6cd17452 | ✓ (16 ACs) |
| 4. Structured Copy Editing — colour fields and the faithfulness lock | story-37a3921b (upgrade) | ✓ (10 new ACs, 6 pre-existing modified) |
| 5. In-Page Copy Editing — colour row, lock's face, mirroring box | story-3bf94bd4 (upgrade) | ✓ (6 new ACs, 4 pre-existing modified incl. AC-1138) |
| 6. System Knowledge Base: Corpus, Index & Generated Map | story-c4f329d3 | ✓ (16 ACs) |
| 7. AI Site Assistant — the session's knowledge surface | story-a58a0974 (upgrade) | ✓ (4 new ACs, 1 pre-existing modified) |
| 8. Site Store Port & Workers Test Runtime | story-3f4a5f2b | ✓ (9 ACs) |
| 9. Platform Build, Deploy & Smoke Scripts | story-d5167ced | ✓ (13 ACs) |

No plan item was dropped. 113 new acceptance criteria; every one carries a
`test_UAT_AC{N}_*` function (AC-1229…AC-1239, AC-1241…AC-1284, AC-1291…AC-1306,
AC-1317…AC-1342 — no gaps).

## Evidence Sufficiency (Step 5b) — the failures

Every suite carrying a new UAT was executed directly, because no quality report in this
reconcile ran any tests (`report-63f9c8d8`, `report-ecb8f57d`, `report-14887c9d`,
`report-08685a37`, `report-f5ac7b54`, `report-d2777cdc`, `report-5b9f36c6`,
`report-a60b7651` — all `suites: {}`, "0 tests, 0 failed").

| Suite | Result |
|---|---|
| `reconciliation-palette-management.test.ts` | **1 failed**, 6 passed, 4 unrunnable here |
| `reconciliation-palette-popup-surface.test.ts` | 12 passed |
| `reconciliation-draft-change-journal.test.ts` | 16 passed |
| `reconciliation-copy-edit-colour-and-availability.test.ts` | 9 passed, 1 unrunnable here (AC-1273) |
| `reconciliation-copy-edit-colour-row.test.ts` | **1 failed**, 2 passed |
| `reconciliation-copy-edit-control-availability.test.ts` | 2 passed |
| `reconciliation-copy-edit-tracking.test.ts` | 1 passed (took the no-browser `unverified` path — see caveat) |
| `reconciliation-system-knowledge-base.test.ts` | 16 passed |
| `reconciliation-assistant-conversation-knowledge.test.ts` | 4 passed |
| `reconciliation-site-storage-port.test.ts` | 8 passed |
| `reconciliation-site-storage-port.workers.test.ts` | unrunnable here (workerd needs a listening socket) |
| `reconciliation-platform-build-deploy-smoke.test.ts` | **2 failed**, 11 passed |

### FIX-1 — AC-1239 (story-ee073693): the assistant's refusal loses the count

`tests/reconciliation-palette-management.test.ts:752-753` fails:

```
expected 'Error: remove_palette_color failed (CONFLICT). the name or path is already
taken. Choose a different one.'
  to contain "'primary' is used 3 times and cannot be deleted."
```

`editPaletteRm` raises a `CommandError` whose message names the count
(`tools/generate/src/cli/edit.ts:1685-1686`) and the CLI surfaces it. The AI toolbox
replaces it with the per-code refusal template declared at
`tools/generate/src/cli/ai/l1-surface.json:122`, so the assistant is told only that
"the name or path is already taken" — which is not even the right sentence for this
refusal, and withholds precisely the number the intent says the assistant needs
(REQ-133 §5c: *"The unsafe half stays with the AI, which can talk it through
first — and can now see the count"*).

**Fix direction (code preferred):** carry the store's own message into the toolbox
refusal for a `CommandError`, so the sentence the operator sees and the sentence the
assistant sees are one string with one definition site — the same rule REQ-139 already
established for `lockError`. If instead the generic template is deliberate, AC-1239's
fourth bullet and story-ee073693's "sees the same refusals an operator sees" must be
narrowed to what the toolbox actually returns, with the loss recorded as a divergence in
the Technical Context beside the two divergences that story already flags.

### FIX-2 — AC-1280 (story-3bf94bd4): a panel painted from the palette stops being a painted panel

`tests/reconciliation-copy-edit-colour-row.test.ts:521-526` fails:

```
a panel painted from the palette is still a painted panel, and the run still shows it:
expected null to be truthy
```

Sequence: the run's escalation row routes to the panel's dialog, the panel's
`surfaceFill` is set to `{ ref: 'ink' }` (asserted landed at line 519), and re-opening
the run finds **no** escalation row.

Root cause: `l1PaintsSurface` (`packages/framework/src/l1/render.ts:1839-1842`) asks
`surfaceDecls`, whose fill branch is `cssColor(a.surfaceFill)`
(`render.ts:557-561`). On the *editor* read path the definition is unresolved, so a
`{ ref }` value yields no declaration and the box reports as painting nothing;
`panelBehind` (`tools/generate/src/cli/edit.ts:604-620`) then returns `undefined` and
`escalationRow` (`apps/control-app/src/builder/editor.js:561`) returns `null`.

This is the new capability breaking its own round trip: the one gesture the escalation
row exists to enable is the gesture that removes the row. It is wider than the row —
`segmentKind` uses the same predicate (`render.ts:1865+`), so a box or container whose
*only* paint axis is a reference fill also stops being an addressable segment, which
contradicts story-37a3921b's claim that colour "moves the 'nothing to edit here'
specimen off the painted panel".

**Note on AC-1270**, which currently passes: its fixture panels carry `borderRadiusPx`
(and `opacity`) alongside the fill, so they remain "painted" via a second axis after the
reference is written. It passes for a reason unrelated to the claim it makes about
reference fills. Whatever fix lands should also give AC-1270 a panel whose only paint is
the fill, so the criterion can fail.

**Fix direction:** treat a palette reference as paint. Either resolve the palette before
segmentation/field derivation on the editor read path, or make the "does this paint?"
predicate structural about the axis being *present and valid* rather than about the CSS
it currently compiles to.

### FIX-3 — AC-1330 (story-d5167ced): the preflight's remedy is never printed

`tests/reconciliation-platform-build-deploy-smoke.test.ts:483` fails: the refusal output
ends at *"`pnpm install` cannot supply them."* and never carries
`cd ../lagrange-framework && bin/install --lang js --component all`.

The remedy exists — `SHARED_STORE_INSTALL_COMMAND` is placed in `CommandError.hint`
at `tools/generate/src/cli/shared-store.ts:113`, and `CommandError.toHuman()`
(`tools/generate/src/cli/errors.ts:67-72`) would render it as a `hint:` line. It is
never reached: the `preflight` case (`tools/generate/src/cli/index.ts:494-528`) throws,
and `run()`'s dispatch `switch` is **not** wrapped in a catch that calls `fail()` —
`fail` is reached only from the `assertInstall` guard at `index.ts:482` and four
per-command catches at `:1135`, `:1187`, `:1262`, `:1279`. The throw escapes to
`tools/generate/bin/1c.mjs`, whose handler prints `err.message` alone.

### FIX-4 — AC-1331 (story-d5167ced): `bin/build` exits 1, not 6

`tests/reconciliation-platform-build-deploy-smoke.test.ts:584` fails: `expected 1 to be
6`. Same root cause as FIX-3 — `bin/1c.mjs` sets `exitCode = 1` for any escaped error,
so the `ENVIRONMENT` code never reaches `bin/build`, whose own header documents
"Exit codes: 0 success; 6 environment (preflight); 1 anything else" (`bin/build:32`).

**Fix direction for FIX-3 and FIX-4 (one change):** route the `preflight` throw through
`fail()` — either by wrapping the dispatch `switch` in a single `catch { fail(err, json) }`,
or by giving the `preflight` case its own catch, as the four commands at `:1135`+
already have. Both the `hint:` line and `EXIT_CODES.ENVIRONMENT = 6` then follow for
free, and both criteria pass unchanged. Do **not** weaken AC-1330 or AC-1331: the exit
code and the named remedy are stated in REQ-144 §3 and in story-d5167ced's own
Description, and `bin/build` documents the contract it currently breaks.

## Judgment Calls

- **Not counted as failures — unrunnable in this environment.** This assessor's sandbox
  refuses `listen(2)`, so every UAT that starts the real builder origin or boots workerd
  could not be exercised: AC-1233, AC-1235, AC-1237, AC-1238 (skipped when
  `startBuilder` threw `EPERM`), AC-1273 (timed out at 120s inside `withOrigin` after
  its store-sweep half had passed), and the whole
  `reconciliation-site-storage-port.workers.test.ts` project. Their verdicts are
  **unknown**, not negative. They should be run in an environment that can bind a socket
  before this bundle is considered evidenced.
- **Not counted as a failure — AC-1284's browser evidence took the graceful-skip path.**
  `reconciliation-copy-edit-tracking.test.ts` completed in 285ms, i.e. it reported
  `unverified` rather than driving Chromium. The pattern is exactly what BUG-35's test
  plan specified ("a graceful `skip()` when no browser build can be launched") and
  story-3bf94bd4 states it explicitly ("reported **loudly as unverified** rather than
  quietly reduced to something weaker"). Flagged so a later reader knows the tracking
  and capitalisation claims are unproven on any machine without a launchable browser.
- **Acceptable — AC-1329's config-text assertions.** Roughly half of that UAT reads
  `vitest.node.config.mts` / `vitest.workers.config.mts` / the two `wrangler.toml`s as
  text. That is source inspection, but the routing convention and the compatibility
  settings *are* the deliverable here, and the same test also executes a real Astro
  container render, which is the behavioural half. REQ-141 states the structural choice
  deliberately. Not a gap.
- **Acceptable — the census-on-write asymmetry.** story-ee073693 flags that only the
  origin returns the full re-taken census; the CLI and the assistant return the affected
  entry's own count. The story states this as a divergence from the intent's letter
  rather than absorbing it, and the criteria assert each caller's actual answer. Correct
  handling.
- **Acceptable — the two stale worked examples in STORY-80 and STORY-97.** REQ-140 §7
  deleted `storage/sites/1stcontact` and `harbor-cafe`, which those stories name as
  fixtures. The plan explicitly declined to absorb them (the property each illustrates
  survives; both suites were re-pointed at a synthesised bare site) and flagged them for
  their owning intents. No story in this bundle repeats a stale claim.
- **Acceptable — the retracted workerd pin rationale.** story-3f4a5f2b records the
  correction and states that its criteria encode neither the pin nor its stated cause.
  Verified: nothing in AC-1328/AC-1329 mentions the version pin.

## Verdict

**FAIL.** Coverage and fidelity are sound — all nine plan items produced output, all 113
new criteria carry UATs, and a developer reading these nine stories would have an
accurate picture of what the operator intended to build, including the divergences.

The failure is evidence: four active acceptance criteria (AC-1239, AC-1280, AC-1330,
AC-1331) have UATs that fail against the tree, each because the criterion states a
behaviour the code does not have. Two of the four (AC-1330, AC-1331) share one root
cause — a `CommandError` thrown by `1c preflight` escapes `run()` without reaching
`fail()` — and are one fix. AC-1280 is a genuine product defect in the capability this
bundle adds: a panel painted from the palette stops being recognised as painted.
AC-1239 is a choice between carrying the store's refusal through the toolbox and
narrowing the criterion.

None of the four is attributable to the pre-existing upstream toolbox failures the
tickets document; all four are inside this bundle's own new suites.

Additionally, the fix loop should not rely on the workflow's own quality gate to confirm
the repair: every `Scoped quality` report in this reconcile recorded zero tests, so a
green gate here means nothing was run.
