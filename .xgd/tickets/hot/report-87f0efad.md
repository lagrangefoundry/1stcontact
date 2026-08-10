---
uid: report-87f0efad
id: REPORT-1749
type: report
title: 'Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets,
  Provenance & Palette (level=story)'
created_by: xgd
created_at: '2026-08-10T07:53:15.047742+00:00'
updated_at: '2026-08-10T07:53:15.047742+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-b4ac88fc
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

Every story in CAP-89 carries a *bundle* as its `intent_uid`, so the ledger is
resolved to the source intents inside those bundles.

| Intent ID | UID | Status | When (created / merged) | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-101 | request-b63bbed5 (in BUNDLE-11) | free_and_reconciled | 2026-07-26 / f9a415a8 | Project-level font provenance record (`fonts/registry.yaml`), three-state `redistribute_in_product`, `siteConfig.distribution` marker, `1c fonts check` with four violation kinds, on-disk scan as well as reference join, actions warn-but-pass, malformed record is a hard error. Explicitly **no acquisition verb**. | YES |
| REQ-102 | request-56cb1897 (in BUNDLE-11) | free_and_reconciled | 2026-07-26 / f9a415a8 | `1c new` seeds a minimal valid L1 document (widths ladder, background, flowed root, one placeholder run); render+shot immediately; repro over a scaffolded slug ≡ over a virgin slug; **no flag, no mode detection**. | YES |
| REQ-107, REQ-96 | (in BUNDLE-11) | free_and_reconciled | 2026-07-26 / f9a415a8 | Envelope validator runs on every authored page; behavior modules mount into named L1 seams. Context for STORY-93's "seeded document clears the envelope" and "consequence for behavior modules". | YES (context) |
| REQ-114 | request-3cd338cd (in BUNDLE-14) | free_and_reconciled | 2026-07-31 / cd8f98c8 | Palette colour model + **retrofit of existing sites**: alpha collapse then ramp grouping, pixel-identical conversion, repeatable census command, role naming. Retires the theme colour token group (so a fresh site's colour is stated in the page's own L1 document). | YES |
| REQ-118 | request-66e4c630 | free_and_reconciled | 2026-07-31 / b2b9208c | One **union** asset listing (`listSiteAssets`) over registry + `draft/assets/`, entries carrying `{id, src, alt, kind, onDisk, registered}`, one handle vocabulary, three consumers (CLI `1c asset list`, `/api/assets`, the picker's option list); replaces the registry-only listing rather than adding a second one. | YES |
| REQ-128 | request (BUNDLE-e59210c5) | bundled | 2026-08-10 | Background-image picker. Reuses REQ-118's listing **unchanged** — adds no surface to this capability. | imminent (no effect here) |
| REQ-130 | request (BUNDLE-e59210c5) | bundled | 2026-08-10 | `write_image` writes generated SVG **bytes** into `draft/assets/`. Touches this capability's out-of-scope line. Explicitly excludes binary/font upload (defers to REQ-101). | imminent — see finding 3 |
| BUG-33 | bug | ready_to_reconcile | 2026-08-10 | Builder chrome test suites. Unrelated to this capability. | imminent (no effect here) |
| REQ-123, REQ-43, REQ-34, REQ-19, REQ-18, REQ-17, REQ-7 | requests | draft | — | Not yet active. | NO |

Chronological walk: REQ-101 and REQ-102 (both 2026-07-26) established provenance
governance and the seeded start point. REQ-114 (2026-07-31) then *modified*
STORY-93's start point — it deleted the theme colour palette, so the scaffold's
colour provenance moved from the theme to the page's own L1 document — and added
the census/retrofit surface that became STORY-97. REQ-118 (2026-07-31) added the
union asset listing that became STORY-102. No reconciled intent in the ledger
retires any behaviour currently claimed by these four stories.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-93 (story-86c7c21b) — seeded start point | REQ-102 (intent), REQ-114 (updated_by), REQ-107 + REQ-96 (context) | **aligned**. All four of REQ-102's acceptance items are expressed (valid `l1` block, immediate render+shot, repro parity over a scaffolded slug, no flag/no mode detection). REQ-102's open pre-implementation question ("confirm repro overwrites rather than merges") is resolved as *overwrite* and pinned as behaviour, exactly as the intent asked. The REQ-114 colour-token retirement is correctly absorbed: the story restates the load-bearing property rather than quietly reinterpreting it, and records that creation declares **no** palette. |
| STORY-92 (story-8685be2d) — font provenance | REQ-101 | **aligned**. Record contract, all four violation kinds, distribution marker, advisory-actions channel, hard-error-on-malformed-record, and the on-disk scan alongside the reference join are all present. The intent's own "Not done (deliberate)" — no acquisition verb — is carried into the story's Out of scope with the same rationale, so the intent's opening gap sentence does not leak in as unsupported scope. Three divergences the intent is silent on (invalid site definitions skipped by the reference join; two recorded-but-ungated permissions; the under-describing pass line) are declared as divergences rather than asserted as intent. |
| STORY-97 (story-5e7eb0c5) — colour census & palette retrofit | REQ-114 | **aligned**. Covers REQ-114 §3, §5 and acceptance items 3, 5, 6, 7. Correctly refuses the model half (items 1, 2, 4 — palette shape, widened axis, dangling-reference rejection) to STORY-80 / CAP-70, and the token retirement (items 8–11) likewise. Two honest observation notes: the census reproduces §5.3's *method*, not its frozen 17/15 counts (now 18/16), and two of the four sites retrofit vacuously against AC6's "all four". Both are recorded as notes, not as criteria — the right disposition. |
| STORY-102 (story-c46abfa6) — site asset store | REQ-118 | **aligned on behaviour**; one stale cross-reference. Union-of-two-sources, per-entry provenance, one handle vocabulary, usage kind, and reachability from CLI + builder origin without an editing gesture all match REQ-118 §3–§4. The "supersedes the registry-only listing rather than adding a second one" claim matches the intent's stated design decision. Verified in code: `tools/generate/src/cli/edit.ts:748` `listSiteAssets`, consumed by `editAssetList` (`:782`) and by the picker via `imageHandles` (`:776`), and served at `tools/generate/src/cli/builder.ts:226` `GET /api/assets`. See finding 1 for the CAP-80 reference. |

Structure: the capability body declares four scope areas and the story tree holds
exactly four stories, one per area, with no overlap — exclusivity is clean at this
level. STORY-100 (CAP-86) is the picker's *consumer* half of REQ-118 and explicitly
defers the listing to "a separate capability" without duplicating it, so the
REQ-118 split across CAP-86 and CAP-89 does not double-count.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-102 (story-c46abfa6) | story-body-edit | Story body twice names **CAP-80** as a live, *separate* capability — under Out of scope ("Licence and provenance obligations … that is a project-level question (CAP-80)") and under Technical Context ("Relationship to CAP-80 … the two are deliberately held apart"). CAP-80 (capability-745b9a6c) is `status: superseded` with `superseded_by_uid: capability-b4ac88fc` — **this** capability. The supersession was stamped 2026-08-07T18:54:28Z, nine minutes after STORY-102's last edit (18:45:19Z), so the consolidation was never propagated back into the story body. The licence/listing boundary is real but is now a *story* boundary (STORY-92, a sibling in CAP-89), not a capability boundary. | Replace both "CAP-80" references with STORY-92 / the "Asset provenance & licence compliance" scope area of this capability, keeping the substance ("a licence obligation attaches to the asset, a listing attaches to the site") unchanged. |
| 2 | info | coverage | CAP-89 body (capability-b4ac88fc) | — | The provenance scope area reads "a project-level index over every asset file **of a governed kind**". The only governing intent is REQ-101, which governs **fonts** only, and STORY-92 is scoped to fonts. The phrasing is inherited verbatim from CAP-80's body and is future-proofing, not a claim of image/stylesheet licence coverage — but a reader may expect the latter. Not a gap: no intent asks for non-font asset provenance. | none |
| 3 | info | coverage | CAP-89 body — Out of scope | — | The out-of-scope line says "Uploading, importing, converting or processing assets; the store lists what exists." REQ-130 (`bundled`, in bundle-e59210c5) adds `write_image`, which writes generated SVG **bytes** into `draft/assets/` — the first thing to put bytes into the asset store. Imminent, not yet reconciled, so it does not affect this level's verdict. | Revisit this out-of-scope line when bundle-e59210c5 reconciles; decide then whether generated-asset writing lands here or in the AI control-surface capability. |

## Notes for the Editor

- **Bundle-as-intent indirection.** All four stories point at a bundle
  (`bundle-ee56a66e`, `bundle-0385746c`) or a request as `intent_uid`, and ACs in
  this capability carry **no** `intent_uid` at all. Resolving alignment therefore
  requires reading the bundle body's `## REQ-N:` sections. Worth knowing for the
  ac- and uat-level cycles: the intent trail bottoms out at the story, not below it.
- **The two "observation notes" in STORY-97 are load-bearing, not padding.** A
  later editor tempted to tighten the story against REQ-114's literal AC6 ("all
  four `storage/sites/*` sites retrofitted") or AC7 ("reproduce the §5.3 table")
  would be writing criteria against repo state and frozen numbers. The story
  already explains why neither is durable capability surface. Leave them.
- **Cross-capability references are the drift surface here, not behaviour.** Finding 1
  is the only stale one in this tree, and it was created by the CAP-80→CAP-89
  consolidation rather than by any intent. When capabilities are consolidated, story
  bodies elsewhere that name the absorbed capability by ID are not swept — a check
  worth running against the other consolidated capabilities from the 2026-08-07 pass.
- **Behaviour spot-checked against code, not just read.** `listSiteAssets`
  (`tools/generate/src/cli/edit.ts:748`) really is the single source for all three
  consumers, `GET /api/assets` exists (`builder.ts:226`), and `1c colors`
  (`cli/index.ts:952`, with `--assign` / `--names` / `--json`) and `1c fonts check`
  (`:976`, `--json` emitting `{ok, data}`) exist as the stories describe. No
  `code-issue` finding is warranted.
