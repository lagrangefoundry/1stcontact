---
uid: report-5d3866d7
id: REPORT-1499
type: report
title: 'Reconciliation Review: commits (BUNDLE-14)'
created_by: xgd
created_at: '2026-08-06T22:14:50.485339+00:00'
updated_at: '2026-08-06T22:14:50.485339+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-0385746c
  anchor_uid: bundle-0385746c
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: —
**Anchor**: bundle-0385746c (BUNDLE-14 — BUG-31 + REQ-114 + REQ-116)
**Stories Reviewed**: 6

## Behavior Inventory

Six behaviour clusters across the three commits (`00d2463`, `c5541f8`, `1ce0cd1`), read
independently from the code before the stories: root-scoped deploy addressing; the Worker's
fixed servable root; the L1 palette colour model; the token colour-palette retirement with
page colour re-homed on the L1 document; `1c colors` census/retrofit; and the `--edit` render
channel with derived segmentation and render-scoped addresses.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Every deploy key built from `ctx.root`; per-root index; root-scoped prune | Covered | story-5349d01f | AC-924/926 added, AC-899 modified and its UAT extended with a per-tree orphan scenario |
| 2 | `DeployResult.url` null from the non-servable tree; report prints prefix + reason; CLI help documents it | Covered | story-5349d01f | AC-925; UAT also drives `run(['help'])` |
| 3 | `SERVABLE_ROOT` constant; no root derived from a request | Covered | story-d34eccd8 | AC-927 added, AC-905 modified — see Judgment Calls |
| 4 | `l1Color` widened to `hex \| {ref,step?,alpha?}`; site palette; dangling ref = validation failure; resolution at `loadSite` | Covered | story-c490f1cf | AC-928–932; AC-716 modified to make the literal the *base* of a two-form model |
| 5 | `paletteTokensSchema` / `PaletteTokens` / `theme.palette` / `layerColorRoleSchema` / `paletteVars()` / dark-mode override / module colour-role resolvers deleted; `background` + `textColor` on the L1 document | Covered | story-d0a8cfad | AC-933–936 |
| 6 | `1c colors [--json] [--assign] [--names]`; alpha collapse then chroma-based ramp grouping; write gated on round-trip proof | Covered | story-5e7eb0c5 | AC-939–947 |
| 7 | `--edit` channel; inert page; settled state; derived segments; `data-l1-path`/`data-l1-segment`; renderer-drawn outlines | Covered | story-af36c2cb | AC-948–958 |
| 8 | A behavior module may ship an edit-scoped settled-state rule | Covered | story-179b8c06 | AC-809 rewritten with a bounded second carve-out; UAT updated in step |
| 9 | `storage/sites/xgd/draft/pages/whitepapers.json` (+1776) | N/A — content | — | Site definition data, not capability surface; correctly excluded by the plan |

## Intent Fidelity

Every behaviour the three source tickets declare maps to a story, including BUG-31's declared
documentation deliverable: DOC-12 §7's mapping table now carries `<root>` in every key with the
"only `sites/` is servable" note, verified directly.

Divergences from intent are **flagged, not absorbed** — checked specifically, since silent
absorption is the primary failure mode this review exists to catch:

- **STORY-94** records the conditional-write (CAS) narrowing as a *"Known divergence from intent
  (flag for regression)"* rather than restating the intent's guarantee as delivered.
- **STORY-95** records that DOC-12 still calls previews "author only (private)", superseded by the
  no-authentication decision, and that root confinement is proven against a faked binding rather
  than a live bucket.
- **STORY-98** carries two explicit intent/observation notes: REQ-114's AC6 asks for all four sites
  retrofitted, but two census at zero colour literals and are vacuously retrofitted; and REQ-114's
  AC7 asks the census to reproduce DOC-23 §5.3's table, whose counts have since moved 17/15 → 18/16.
  Both name the intent, the observation, and why the difference is not a defect.
- **STORY-83** scopes its negative guarantee honestly — revision snapshots still carry
  `theme.palette` (immutable history, correctly excluded) and a site's mirrored third-party CSS may
  declare `--color-*` of its own (site content, not emitted output).
- **story-af36c2cb** records the commit-sweep provenance, and the behavior-module placement question
  it had flagged for a reviewer was ruled on and closed — the contract story now carries the settled
  state as a declared carve-out, so the matrix no longer holds a proposition and its negation.

No story was found describing behaviour that neither intent nor code supports.

## Ungrounded Stories

None found.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Deploy: store-root isolation | story-5349d01f (upgrade) | ✓ AC-924/925/926 added; AC-892/899/900 modified |
| 2. Public serving: one servable root | story-d34eccd8 (upgrade) | ✓ AC-927 added; AC-905 modified |
| 3. L1 colour model: literal base, palette overlay | story-c490f1cf (upgrade) | ✓ AC-928–932 added; AC-716 modified |
| 4. One colour system; page colour re-homed | story-d0a8cfad (upgrade) | ✓ AC-933–936 added |
| 5. `1c colors` census and retrofit | story-5e7eb0c5 (feature) | ✓ 9 ACs |
| 6. The edit render | story-af36c2cb (feature) | ✓ 11 ACs |

All six produced output. Nothing dropped.

## Evidence Sufficiency (Step 5b)

Every active AC across the six stories has a covering `test_UAT_AC{N}_*`. Verified by execution,
not inspection:

- **Targeted run** — the 7 reconciliation suites carrying this bundle's ACs: **56 passed / 0 failed**.
- **Full suite** — **1140 passed, 9 skipped, 0 failed** (162 files). This also settles the plan's open
  observation: the four fold/gate failures REQ-116's body reported do **not** reproduce on this branch.
- **`pnpm -r build`** — clean, exit 0. REQ-114's AC12 called this out specifically because the schema
  cut is wide enough that stale `dist/` would mask type drift; it typechecks.

Entry points and mocking were audited rather than assumed. Every UAT drives a real interface —
`worker.fetch`, `cmdDeploy`, `cmdPublish`, `cmdRender`, `cmdNew`, `loadSite`, `renderSite`,
`validateSite`, and `run(['help'])`. Faking is confined to the one boundary the project does not own:
`MemoryR2Client` at the upload boundary and `FakeBucket` at the R2 binding. **No internal-component
mocking and no source-inspection tests were found** in any of the six stories' UATs.

Three tests deserve specific credit for being resistant to a broken implementation:

- `test_UAT_AC927` establishes, out of band, that the sandbox snapshot is *really* deployed, *really*
  indexed (`live: 1`), and *really* readable at its key — so the 404s that follow are attributable to
  root confinement rather than to a broken fixture. It then asserts no read ever *named* the sandbox
  tree (unreachable by construction, not by a trailing check), confirms the 404 is byte-identical to a
  never-deployed site (no existence oracle), and re-runs every address after a live site occupies the
  same slug in the servable tree.
- `test_UAT_AC926` reproduces BUG-31's headline consequence directly — real and sandbox sites sharing a
  slug, both publishing revision 1 — and asserts the real site's index bytes, `rev/0001/` bytes and live
  pointer are all unchanged.
- `test_UAT_AC933` guards its own negative against vacuity before asserting it (`themeCss.length >
  theme.length`, and a check that the document's L1 stylesheet is genuinely among the sheets scanned) —
  the right defence for the "easy to satisfy once, easy to reintroduce silently" risk the plan flagged.

## Judgment Calls

- **AC-905's fourth verification assertion sits under AC-927's test — recorded, not failed.** AC-905's
  Verification clause names four assertions; three are in `test_UAT_AC905` (orphan bytes, unlinked
  preview, index-recorded location). The fourth — "a complete index in the wrong tree grants no
  reachability" — is proven by `test_UAT_AC927`, comprehensively and in the same story. This is drift
  between an AC's prose and where its assertion lives, not missing evidence: a broken implementation
  cannot pass, because breaking root confinement fails AC-927 loudly. Not material under the Step 5
  test; worth tidying whenever STORY-95 is next touched.
- **`resolveAddress` in the edit-render UATs is test-local — acceptable here.** AC-953/955 resolve
  stamped addresses using an ~8-line resolver defined in the test rather than imported from production,
  because there is no production resolver: client-side resolution is explicitly T3 and out of scope.
  It encodes the documented rule ("index the render's root node list, then `children` at each later
  step") and applies it to bytes from a real `1c render --edit`, so what is under test is the
  renderer's stamps against the contract its consumer will apply — the correct shape for a
  producer-side AC. Flagging so T3 wires the real client resolver to this same rule rather than a
  second interpretation of it.
- **AC-937/AC-938 do not exist.** A numbering gap, not a dropped criterion — every AC that exists is
  attached to a story and covered.
- **`whitepapers.json` omitted as content.** Site definition data is not capability surface; the plan
  excluded it correctly and no story asserts against it.

## Verdict

**PASS.** Stories accurately and completely document the behaviour surface, and — more to the point of
this review — they document the operator's *intent*, with every place the code diverges from it called
out in the story rather than quietly rewritten to match what shipped. All six plan items produced
output, all active ACs carry passing UATs that enter through real interfaces and would fail if the
behaviour they assert were removed, and the full suite and build are green. A developer reading only
these six stories would have a correct mental model of what this bundle intended to build, where it
fell short, and why.
