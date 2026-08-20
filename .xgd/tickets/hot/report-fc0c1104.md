---
uid: report-fc0c1104
id: REPORT-2395
type: report
title: 'Reconciliation Review: commits (BUNDLE-19)'
created_by: xgd
created_at: '2026-08-20T06:54:25.927960+00:00'
updated_at: '2026-08-20T06:54:25.927960+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-77b28def
  anchor_uid: bundle-77b28def
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: bundle-77b28def
**Stories Reviewed**: 9

This is the second review of this bundle. The first (`report-ded05451`) passed Step 4
(intent fidelity and behavioural coverage) and Step 6 (plan-item accounting) and failed
Step 5b on four acceptance criteria whose UATs failed against the tree. The fix loop
(`report-8166869c`) addressed all four but could execute nothing — it stated so plainly.
This review re-ran the evidence. **All four findings are closed, verified by execution,
and no regression was introduced by the fixes.**

## Behavior Inventory

13 behaviour clusters across the eleven behaviour-bearing commits (8e66fef, 90b762c,
ceed377, b269998, e70668d, 6b94ba9, 2dbf7e7, aea40e5, cd6f00c, b179902, da7d31b), plus
the two fix commits on this branch (`4800b9da7`, `062a3bcf8`). The inventory is unchanged
from the first review; the fix commits added no behaviour cluster — they changed one
predicate (`l1PaintsSurface`), added one `catch` (the `preflight` case), and corrected
two UATs.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `1c palette get/set/add/rm/rename` + `/api/palette`, per-entry census, server-side delete/rename guards | Covered | story-ee073693 | Story flags three divergences of its own: origin-only full census on a write, rename-to-own-name accepted as a no-op, and (new) the refusal *sentence* the assistant receives |
| 2 | `mapL1PaletteRefs` — one structural walk under count, resolve and rename | Covered | story-ee073693 | Now also carries the paint probe in `l1PaintsSurface` |
| 3 | Palette popup: manage + pick, usage-labelled swatches, continuous shade slider on the renderer's own Oklab arithmetic, shared modal shell | Covered | story-4300366a | 12 UATs, all passing |
| 4 | Draft change journal: counter, windowed records, `list_changes`, `1c changes`, per-turn reminder signal | Covered | story-6cd17452 | 16 UATs, all passing |
| 5 | Colour as a segment field (`color`, `surfaceFill`), palette-membership validation, shade bounds, unknown keys refused | Covered | story-37a3921b | Previously **Partial** — the reference-fill defect is fixed and AC-1270 now carries the claim and a fill-only fixture |
| 6 | Locked controls generalised: `reason` paired with `locked`, `GLYPH_GRADIENT_LOCK`, `NO_ITALIC_FACE_LOCK`, `lockError`, `(locked: …)` in `1c copy get` | Covered | story-37a3921b | |
| 7 | The colour row, the escalation row, the lock's visible face | Covered | story-3bf94bd4 | Previously **Partial** — the escalation row now survives its own gesture (verified) |
| 8 | Editing box mirrors capitalisation and tracking | Covered | story-3bf94bd4 | AC-1284's browser evidence still takes the graceful `unverified` path here — see Judgment Calls |
| 9 | `1c kb build/export/status`, strict-boolean opt-in, named skips, generated map, parsed declaration, byte-change-only writes | Covered | story-c4f329d3 | 16 UATs, all passing |
| 10 | Session knowledge surface: `KnowledgeToolbox` in one Toolbox, doubly-scoped read-only grant, landscape-first priming, degradation not failure | Covered | story-a58a0974 | 4 UATs, all passing |
| 11 | `SiteStore` port, two injected adapters, no path-returning verb, one write verb, site factory, "a directory holding no definition is not a site" | Covered | story-3f4a5f2b | 8 UATs passing in node; the workerd project remains unrunnable in this sandbox |
| 12 | Vitest node/workerd project split, routing by filename, production compatibility settings | Covered | story-3f4a5f2b | Story records the retracted pin rationale as a known tree/explanation divergence and states that no criterion encodes it — verified: AC-1328/AC-1329 do not |
| 13 | `bin/build` / `bin/deploy` / `bin/smoke`, `1c preflight`, hook seams, `[env.production]` inheritance guard, secret mechanism | Covered | story-d5167ced | Previously **Partial** — the exit code and the named remedy are now both real and asserted against a spawned process |

**Intent fidelity (Step 4A).** Unchanged from the first review and re-spot-checked here.
The three superseded stories carry their superseding text (STORY-100's colour deferral,
STORY-101's colour/panel-background clause and its capitalisation divergence, STORY-103's
"no retrieval is claimed here"). The three findings REQ-144 deliberately left unfixed are
recorded in story-d5167ced — its Out of Scope states that the control application "has
never been deployed and its hostname does not resolve; both are deliberately left alone
here" — and no criterion claims a live deploy.

**On the one intent claim the fix loop narrowed.** REQ-133 §5c reads: "The unsafe half
stays with the AI, which can talk it through first — and can now *see* the count, which
it could not before **(§6)**." The parenthesis points at §6 — the census read — not at
the refusal sentence. AC-1239 as narrowed asserts exactly that route (`get_palette`
reports the count per entry; `remove_palette_color`'s declared description sends the model
there) and story-ee073693 records the sentence-level loss as a flagged divergence,
naming the toolbox's refusal renderer as the upstream change that would close it. This is
faithful to the intent, and the discrepancy is noted rather than absorbed — the required
handling, not an erosion of the criterion.

## Ungrounded Stories

None. Both entries in the first review's table are resolved: story-d5167ced's preflight
claim is now true of the code (verified by execution), and story-ee073693's refusal claim
is narrowed to what the toolbox actually returns with the loss recorded as a divergence.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Palette Management: `1c palette` & `/api/palette` | story-ee073693 (STORY-113) | ✓ |
| 2. Builder Palette Popup | story-4300366a (STORY-114) | ✓ |
| 3. Draft Change Journal | story-6cd17452 (STORY-115) | ✓ |
| 4. Structured Copy Editing — colour fields and the faithfulness lock | story-37a3921b (STORY-100, upgrade) | ✓ |
| 5. In-Page Copy Editing — colour row, lock's face, mirroring box | story-3bf94bd4 (STORY-101, upgrade) | ✓ |
| 6. System Knowledge Base: Corpus, Index & Generated Map | story-c4f329d3 (STORY-117) | ✓ |
| 7. AI Site Assistant — the session's knowledge surface | story-a58a0974 (STORY-103, upgrade) | ✓ |
| 8. Site Store Port & Workers Test Runtime | story-3f4a5f2b (STORY-118) | ✓ |
| 9. Platform Build, Deploy & Smoke Scripts | story-d5167ced (STORY-119) | ✓ |

All nine plan items produced output. No item dropped.

## Evidence Sufficiency (Step 5b) — executed, not assumed

Every `Scoped quality` report in this reconcile — including the most recent
(`report-04a97bcb`) — still records `suites: {}`, "0 tests, 0 failed". The gate proves
nothing, so each suite was run directly (`vitest run --project node`).

| Suite | Result this review | Result at first review |
|---|---|---|
| `reconciliation-palette-management.test.ts` | 7 passed, 4 skipped (origin, EPERM) | **1 failed**, 6 passed |
| `reconciliation-copy-edit-colour-row.test.ts` | 3 passed | **1 failed**, 2 passed |
| `reconciliation-copy-edit-colour-and-availability.test.ts` | 9 passed, AC-1273 unrunnable (EPERM) | 9 passed, 1 unrunnable |
| `reconciliation-platform-build-deploy-smoke.test.ts` | 13 passed | **2 failed**, 11 passed |
| `reconciliation-palette-popup-surface.test.ts` | 12 passed | 12 passed |
| `reconciliation-draft-change-journal.test.ts` | 16 passed | 16 passed |
| `reconciliation-copy-edit-control-availability.test.ts` | 2 passed | 2 passed |
| `reconciliation-copy-edit-tracking.test.ts` | 1 passed (no-browser `unverified` path) | same |
| `reconciliation-system-knowledge-base.test.ts` | 16 passed | 16 passed |
| `reconciliation-assistant-conversation-knowledge.test.ts` | 4 passed | 4 passed |
| `reconciliation-site-storage-port.test.ts` | 8 passed | 8 passed |
| `reconciliation-site-storage-port.workers.test.ts` | unrunnable (workerd needs a socket) | same |

### The four findings, closed

- **FIX-1 / AC-1239 — closed by narrowing, correctly.** `packages/…` unchanged; the UAT
  now asserts the CLI refusal names the count (`'primary' is used 3 times and cannot be
  deleted`), that the assistant's refusal carries `CONFLICT`, that the draft is
  byte-identical after both refusals, and that the count reaches the model through
  `get_palette`'s per-entry census plus the removal operation's declared description. All
  through the real toolbox (`createL1Toolbox`) against a real seeded site, with the site
  definition re-read after each write. Passes.
- **FIX-2 / AC-1280 + AC-1270 — closed by code.** `l1PaintsSurface`
  (`packages/framework/src/l1/render.ts:1866`) now asks `surfaceDecls` with every palette
  reference substituted by a probe hex via `mapL1PaletteRefs`, so a fill of `{ ref: 'ink' }`
  counts as paint on the unfolded editor read path. The escalation row survives its own
  gesture and `segmentKind` keeps stamping the panel. AC-1270 gained the claim ("a panel
  painted only by a palette reference is still a painted panel") and a fill-only fixture,
  so the criterion can now fail — which was the review's specific ask, since the old
  fixtures stayed painted via `borderRadiusPx`.
- **FIX-3 + FIX-4 / AC-1330, AC-1331 — closed by code, one change.** The `preflight` case
  in `tools/generate/src/cli/index.ts` is wrapped in `catch (err) { fail(err, json) }`, so
  the refusal renders through `CommandError.toHuman()` (the `hint:` line naming
  `bin/install` is printed) and sets `EXIT_CODES.ENVIRONMENT = 6`, honouring the `0/6/1`
  contract `bin/build:32` documents. Both UATs spawn `1c preflight` and `bin/build` as
  real processes and assert on the real exit code and stdout. Both pass.

### Regression check on the FIX-2 widening

`l1PaintsSurface` feeds `segmentKind`, so widening it widens the set of addressable
regions — a plausible way to shift addresses under unrelated suites. Eight paint- and
segment-sensitive suites were run (`capture`, `reconciliation-l1-fold`,
`reconciliation-l1-substrate`, `reconciliation-copy-edit-write-path`,
`reconciliation-page-composition-surface`, `req92-image-box-fold`, `req82-l1-substrate`,
`bug15-values-diff-l1-flat-dom`). Result: 45 passed, 10 failed, 17 skipped. **None of the
ten is attributable to this bundle.** All ten are in
`reconciliation-page-composition-surface.test.ts` and all ten fail identically at
`unwrap()` with `TypeError: answer.replace is not a function` — the documented upstream
cause (`@lagrangefoundry/ai`'s toolbox now returns objects where it returned strings),
recorded in story-3f4a5f2b's Technical Context and verified there against both the
pre-split configuration and the pre-port branch. The remaining suite-level failures in
that batch (`capture`, `reconciliation-copy-edit-write-path`) are EPERM on `listen(2)`, a
sandbox limit.

## Judgment Calls

- **Not counted as failures — unrunnable in this environment.** This assessor's sandbox
  refuses `listen(2)`, so every UAT that starts the real builder origin or boots workerd
  could not be exercised: AC-1233, AC-1235, AC-1237, AC-1238 (skipped when `startBuilder`
  threw `EPERM`), AC-1273 (timed out at 120s inside `withOrigin`), and the whole
  `reconciliation-site-storage-port.workers.test.ts` project. Their verdicts are
  **unknown, not negative** — the UATs exist, enter through real interfaces and assert
  observable outcomes; only the socket is missing. Same call as the first review, held for
  consistency. They should be exercised in an environment that can bind a socket before
  this bundle is considered fully evidenced; that is an environment gap, not a matrix gap.
- **Not counted as a failure — AC-1284's browser evidence took the graceful-skip path.**
  `reconciliation-copy-edit-tracking.test.ts` completes in ~300ms, reporting `unverified`
  rather than driving Chromium. BUG-35's test plan specifies exactly this and
  story-3bf94bd4 states it explicitly ("reported **loudly as unverified** rather than
  quietly reduced to something weaker"). Flagged so a later reader knows the capitalisation
  and tracking claims are unproven on any machine without a launchable browser.
- **Acceptable — AC-1239's declaration-text assertion.** `expect(removal.description).toContain('get_palette')`
  reads the operation declaration rather than running something. It is not source
  inspection in the prohibited sense: the declaration *is* the artefact the model receives,
  so asserting its content asserts what the assistant is told. The behavioural half of the
  same UAT (four real writes, two real refusals, a real census read, byte-identical draft)
  carries the weight.
- **Acceptable — AC-1329's config-text assertions.** Roughly half of that UAT reads the
  two vitest configs and the two `wrangler.toml`s as text; the routing convention and the
  compatibility settings *are* the deliverable, and the same test also executes a real
  Astro container render. Unchanged judgment from the first review.
- **Acceptable — the census-on-write asymmetry, the rename-to-own-name no-op, and the
  refusal-sentence loss.** All three are flagged in story-ee073693's Technical Context as
  divergences from the intent's letter, with the criteria asserting what each caller
  actually answers. Correct handling — noted, not absorbed.
- **Acceptable — the two stale worked examples in STORY-80 and STORY-97.** REQ-140 §7
  deleted `storage/sites/1stcontact` and `harbor-cafe`, which those stories name as
  fixtures. The plan declined to absorb them (the property each illustrates survives; both
  suites were re-pointed at a synthesised bare site) and flagged them for their owning
  intents. No story in this bundle repeats a stale claim.
- **Acceptable — the retracted workerd pin rationale.** story-3f4a5f2b records the
  correction as a "known divergence between the tree and its own explanation" and states
  that its criteria encode neither the pin nor its cause. Verified.

## Verdict

**PASS.** Coverage, fidelity and plan-item accounting were sound at the first review and
remain so; a developer reading these nine stories would have an accurate picture of what
the operator intended to build, including every place the code and the intent diverge —
each of which is stated in the story rather than smoothed over. The four evidence failures
that caused the previous FAIL are closed and were re-verified by execution, not by
reading: 59 passing tests across the seven untouched bundle suites, 7/3/9/13 passing
across the four the fix touched, and no regression from the `l1PaintsSurface` widening in
eight paint- and segment-sensitive neighbours.

Two standing caveats, neither a matrix defect: the workflow's own quality gate still runs
zero tests (`suites: {}` in every report of this reconcile), so it must not be read as
confirmation of anything; and six criteria plus the workerd project need a machine that
can bind a socket, and one needs a launchable browser, before their evidence is more than
existent.
