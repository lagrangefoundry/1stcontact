---
uid: report-8863aaee
id: REPORT-1435
type: report
title: 'Reconciliation Review: commits (BUNDLE-13)'
created_by: xgd
created_at: '2026-08-06T19:20:37.658861+00:00'
updated_at: '2026-08-06T19:20:37.658861+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-e0143ffa
  anchor_uid: bundle-e0143ffa
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: (none — commits mode)
**Anchor**: bundle-e0143ffa (BUNDLE-13)
**Stories Reviewed**: 5 (STORY-90, STORY-83, STORY-94, STORY-95, STORY-96)

## Method

Intent read first: the bundle body and all six source intents (REQ-108, REQ-109,
REQ-110, REQ-111, REQ-113, BUG-30), including the mid-implementation corrections
recorded on them. Code read independently across the 11 cherry-picked commits
(`818a4196`…`0e693da0`, 21 production files, +2418/-37). Stories and all 82 of
their acceptance criteria read last. Evidence checked by executing it.

## Behavior Inventory

**38 behaviours** across 5 feature groups, matching the diff:

- `pointerAccent` axis + renderer-owned driver (10): two compositing arrangements
  chosen by which side the texture can occupy; repeated asset mask passes;
  zero-alpha texture existing only under the cursor; textureless node emitting
  nothing; marker-gated `isolation`; core-disc-plus-bumps region bounded by the
  declared reach; deterministic emitted CSS with randomness confined to the
  driver; instance-data-free driver; rAF loop that stops; armed-vs-dimmed state
  separation surviving focus loss.
- `relativizeUrl` at all three emission sinks (4): leading-slash strip; `//`
  guard; explicit `./` for an empty or colon-bearing first segment; flat-snapshot
  assertion in `renderSite`.
- `1c deploy` (10): always-render; complete `out/`+`source/` artifact;
  content-addressed 12-hex id; already-deployed short-circuit; preview vs
  revision channels; refusal by name on empty history; `--dry-run`; `--prune`
  against a write-ahead key index; re-read manifest conflict detection; labelled
  per-stage report terminating in the URL.
- public-site Worker (9): route grammar and segment rejection; manifest-as-
  authority resolution; trailing-slash 301 preserving the query; content type
  from the served key; immutable vs short-TTL caching; draft `X-Robots-Tag`;
  opaque non-listing 404 that is never cached; warm-cache path; `HEAD`/`405`;
  deploy-time reserved-segment gate.
- extensionless URL resolution in both environments (5): `1c serve` fallback
  applied to the already-confined path after the directory index; Worker
  `htmlFallbackFor` as a pure URL rule; exact match always winning; extensions
  never eligible; trailing slash never eligible.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Accent redraws the node's own texture under the cursor, derived from the same declaration | Covered | story-d2b5cb1c | AC-879 |
| 2 | Both texture kinds; faint asset lit to full accent weight | Covered | story-d2b5cb1c | AC-880; mechanism (pass count) correctly held non-author-facing |
| 3 | Fully transparent texture exists only under the cursor | Covered | story-d2b5cb1c | AC-881 — pinned in its own right, as the intent asked |
| 4 | Textureless node emits no accent, no handle, no driver | Covered | story-d2b5cb1c | AC-882 |
| 5 | Fails visible; every added declaration (incl. `isolation`) waits for a real pointer | Covered | story-d2b5cb1c | AC-883 |
| 6 | Byte-identical renders; driver carries no instance data; emitted only when used | Covered | story-d2b5cb1c | AC-884 |
| 7 | Region deterministically rough, bounded by reach, plain circle at roughness 0 | Covered | story-d2b5cb1c | AC-885 |
| 8 | Still while the pointer is (no frames), deforms while moving, returns after blur | Covered | story-d2b5cb1c | AC-886 — the REQ-108 focus-loss defect is pinned, not merely described |
| 9 | Envelope rejects out-of-range/non-hex/unknown-key accent input | Covered | story-d2b5cb1c | AC-887 |
| 10 | Snapshot relocatable: document-relative emission at all three sinks | Covered | story-d0a8cfad | AC-888 |
| 11 | Absolute, protocol-relative, fragment, already-relative pass through unchanged | Covered | story-d0a8cfad | AC-889 |
| 12 | Empty or colon-bearing first segment keeps its base (BUG-30 + the security half) | Covered | story-d0a8cfad | AC-890 |
| 13 | Nested page slug fails the render loudly | Covered | story-d0a8cfad | AC-891 |
| 14 | Untextured-page `background-size` invariant re-scoped to authored surfaces | Covered | story-d0a8cfad | AC-831 modified in place (updated 2026-08-06T18:26), reasoning stated |
| 15 | Draft deploy ships the complete artifact to a content-addressed preview | Covered | story-5349d01f | AC-892 |
| 16 | Identical bytes a no-op; changed bytes land beside | Covered | story-5349d01f | AC-893 |
| 17 | Always renders; stale `dist/` can never ship | Covered | story-5349d01f | AC-894 |
| 18 | Preview never mints a revision or enters publish history | Covered | story-5349d01f | AC-895 |
| 19 | Published channel ships latest revision, moves the live pointer | Covered | story-5349d01f | AC-896 |
| 20 | Empty history refused by name, writes nothing | Covered | story-5349d01f | AC-897 |
| 21 | `--dry-run` writes nothing | Covered | story-5349d01f | AC-898 |
| 22 | `--prune` deletes only unreferenced snapshot objects | Covered | story-5349d01f | AC-899 |
| 23 | Labelled per-stage report terminating in the shareable URL | Covered | story-5349d01f | AC-900 |
| 24 | Index changed underneath fails loudly, leaves it unclobbered | Covered | story-5349d01f | AC-901 — divergence from the intent's `onlyIf` etag flagged, not absorbed |
| 25 | Preview URL renders its snapshot complete | Covered | story-d34eccd8 | AC-902 |
| 26 | Published URL follows the live revision | Covered | story-d34eccd8 | AC-903 |
| 27 | Bare directory URL 301s, preserving the query | Covered | story-d34eccd8 | AC-904 |
| 28 | Only manifest-referenced snapshots servable; orphans unreachable | Covered | story-d34eccd8 | AC-905 |
| 29 | 404 plain, no listing, no existence oracle | Covered | story-d34eccd8 | AC-906 |
| 30 | Malformed/traversal-shaped components rejected before any read | Covered | story-d34eccd8 | AC-907 |
| 31 | Content type from the object that answered | Covered | story-d34eccd8 | AC-908 |
| 32 | Immutable on snapshot addresses; short TTL published | Covered | story-d34eccd8 | AC-909; the accepted mixed-cache wart is recorded |
| 33 | Every draft-channel response noindex, including redirect and 404 | Covered | story-d34eccd8 | AC-910 |
| 34 | Warm cache; 404s never retained | Covered | story-d34eccd8 | AC-911 |
| 35 | Read-only: `HEAD` bodiless, writes refused with `Allow` | Covered | story-d34eccd8 | AC-912 |
| 36 | Apex holding response, never a site's snapshot | Covered | story-d34eccd8 | AC-913 |
| 37 | Deploy-time reserved-segment gate | Covered | story-d34eccd8 | AC-914; the story records it as a standing, not-yet-reachable invariant |
| 38 | Extensionless mapping, both environments, both channels, GET+HEAD, exact-wins, extension-never, trailing-slash-never, confinement unchanged | Covered | story-66115f6b | AC-915…AC-923 |

No uncovered behaviours. `bin/verify_req108_pointer.mjs` (351 lines) is a
declared-throwaway runtime harness, not product, and is correctly absent from the
matrix; `storage/sites/xgd/draft/pages/home.json` is instance data for one site.

## Intent Fidelity

Every divergence between the source intents and the code is **recorded in the
story that owns it**, with the correction stated rather than the code silently
documented as if it were the intent:

| Divergence | Intent said | Code does | Treatment |
|---|---|---|---|
| Manifest concurrency | R2 conditional write (`onlyIf` etag) | re-read and compare (`ManifestConflictError`) — wrangler exposes no conditional write | STORY-94 Technical Context, explicitly "flag for regression"; narrows rather than closes the race, property preserved. Verified in `manifest.ts:85-100`. |
| REQ-113's premise | "Cloudflare Pages is the deployment target, so preview is the broken half" | No Pages anywhere; the Worker serves every byte, so the *inverse* was true | STORY-96 records the corrected intent, names the stale in-code comment as documentation drift |
| Preview privacy | DOC-12: "author only (private)" | no authentication; unguessable-URL privacy | STORY-95 names the documentation divergence explicitly |
| REQ-108 stacking-context claim | "~5000px moved on a resting band" | 0px with entrance motion settled; the claim was retracted on the intent | STORY-90 records the retraction and that gating was kept for the exception-free invariant, not a measured regression |
| Operator mid-implementation direction | REQ-108 body originally described visible grids on `#problem`/`#close` | operator asked for removal; bands now carry a fully transparent texture | STORY-90 records the dialogue and pins the resulting behaviour as AC-881 |
| REQ-1 apex route assertion | apex declared as a zone `route` | replaced by `custom_domain = true` | Correctly not upgraded: `test_UAT_FC_REQ-1_*` is free-coded-named and bound to no matrix AC. Verified — no story owns it. |

Both known limitations the intents carried forward are recorded as such rather
than presented as settled: REQ-111's un-run `wrangler dev` smoke check against a
live bucket and apex DNS (STORY-95), and REQ-108's hero-grid-as-asset gap whose
clean fix is a typed L1 perspective primitive (STORY-90).

## Ungrounded Stories

None. Every story claim traces to either an intent statement or an observed code
behaviour; no invented behaviour found.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. L1 pointer-reactive texture accent (upgrade) | story-d2b5cb1c (STORY-90) | ✓ — 9 ACs added (AC-879…887), all 9 planned criteria present |
| 2. L1 emitter: relocatable, base-preserving asset URLs (upgrade) | story-d0a8cfad (STORY-83) | ✓ — 4 ACs added (AC-888…891) + the planned `modify` applied to AC-831 |
| 3. `1c deploy` — content-addressed artifact shipping (feature) | story-5349d01f (STORY-94) | ✓ — 10 ACs |
| 4. public-site Worker — serving snapshots from R2 (feature) | story-d34eccd8 (STORY-95) | ✓ — 13 ACs |
| 5. Extensionless page URLs — preview and production agree (feature) | story-66115f6b (STORY-96) | ✓ — 9 ACs |

No plan items dropped. The plan's placement judgment holds on inspection: the
accent's load-bearing properties (renderer-owned driver, marker gate armed on
first interaction, fail-visible degradation, no script when unused) are STORY-90's
existing AC-820/823/825 claims extended to a third axis, not STORY-83's static
paint; and BUG-30's colon case belongs with the emitter's independent-defence
claim because it is the rewrite re-admitting a value `isSafeUrl` had refused.

## Evidence Sufficiency (Step 5b)

Every AC on all five stories has a name-bound UAT — checked mechanically across
all 82 ACs, zero misses. The 45 UATs covering this bundle's 45 new/modified ACs
were **executed during this review**: `tests/reconciliation-l1-pointer-accent`,
`-l1-relocatable-output`, `-deploy-snapshot`, `-serve-deployed-snapshot`,
`-clean-page-urls` — **5 files, 45 passed, 0 failed** (vitest 4.1.9, 1.27s).

Spot-checked for discriminating power rather than rubber-stamping:

- **Real entry points.** The deploy and serving UATs drive `cmdDeploy` and the
  Worker's real `fetch` export over bytes a real `1c deploy` wrote; local preview
  is driven over the real loopback server, and over a raw socket where a
  traversing request must survive client-side URL normalisation. R2 is faked at
  the binding — the one boundary the project does not own. Route grammar, deploy
  index, header policy and cache are all real.
- **No internal mocking.** The pointer-accent file states and honours it: the
  renderer's real script runs in JSDOM with only `PointerEvent`, `matchMedia` and
  `requestAnimationFrame` stubbed (JSDOM ships no `PointerEvent`; its `matchMedia`
  always answers false, which would make a media guard untestable; rAF is stubbed
  so frames are counted and stepped rather than raced).
- **No source-inspection tests** in the reconciliation suites. Assertions are over
  the *emitted artifact* (stylesheet declarations, HTML, HTTP responses) and over
  observed runtime state, not over repository source text.
- **They discriminate.** AC-886 counts scheduled frames at rest, asserts spread
  and per-lobe scale while moving, asserts a slower hand deforms less, and cycles
  `pointerleave` and `blur` twice each — the exact shape of the REQ-108 defect
  that ran the restore once per session. AC-880 fails if the mask pass count drops
  to 1 and asserts no author-facing key can name that strength. AC-879 asserts the
  accent stack is byte-equal to the base stack with only the colour substituted,
  so a second drifting geometry cannot pass. AC-890 covers both the fragment and
  the `javascript:` re-admission case. AC-891 asserts nothing was written.

## Judgment Calls

- **`bin/verify_req108_pointer.mjs` undocumented — acceptable.** A throwaway
  runtime verification harness declared as such on REQ-108. A developer would not
  be surprised to find a verification script unrepresented in the capability matrix.
- **`wrangler.toml` `custom_domain` / `SITES` binding not an AC — acceptable.**
  Infrastructure configuration; its observable consequence (the apex serving a
  holding response and never a site) is AC-913, and STORY-95 records that the live
  provisioning was never exercised in session.
- **The `SiteStore` and `R2Client` seams not ACs — acceptable and correct.** Both
  stories say so explicitly and keep their ACs at the observable boundary. Pinning
  a seam as an acceptance criterion would freeze the phase-2 D1 swap the seam
  exists to enable.
- **REQ-109's nine re-baselined expectations across eight suites — no plan item
  needed.** Consequences of item 2's one rule; each still pins the same behaviour
  with only the URL shape moved. Confirmed on inspection; no assertion weakened.

## Observations (not gaps — flagged for the operator, outside this review's remit)

1. **The workflow's scoped quality runs did not execute these suites.** Every
   scoped quality report on these stories reads `pass (0 tests, 0 failed)` and
   every test-naming check reads `skipped - no test files`, yet the five
   `tests/reconciliation-*` files exist and are correctly `test_UAT_AC{N}_*` named.
   The scoped runner's file selection is not finding them. The evidence is sound —
   I executed all 45 UATs directly — but the workflow's own gate is currently
   passing vacuously on this bundle.
2. **STORY-83 carries a stale `uat_coverage: fail` field** from the prior bundle
   (`bundle-31e474b9`). All 31 of its ACs, including the four added here, have
   name-bound UATs. A matrix field-state issue for structural validation, not a
   coverage gap.
3. **AC-831 appears twice in STORY-83's child listing** under one UID
   (`acceptance_criterion-9c1ba2b3`) — a duplicate link, again structural.

## Verdict

**PASS.** Stories accurately and completely document the behaviour surface, and —
the harder test — they document the operator's *intent*, including the places
where the code and the intent parted company. All six divergences are recorded in
the owning story with the correction stated: the manifest conditional-write
narrowing, REQ-113's false premise about Cloudflare Pages, DOC-12's superseded
preview-privacy wording, REQ-108's retracted 5000px measurement, the operator's
mid-implementation direction to remove two bands' grids, and the superseded REQ-1
apex route assertion. Nothing was silently absorbed. All 5 plan items produced
output, including item 2's `modify`. Every active AC has a passing UAT that enters
through a real interface, mocks nothing the project owns, asserts observable
outcomes rather than source text, and would fail if the criterion's behaviour were
removed. A developer reading only these stories would have a correct mental model
of what this code does and of what the operator set out to build.
