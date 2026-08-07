---
uid: report-04ee9e05
id: REPORT-1638
type: report
title: 'Capability-Intent Alignment: Site Delivery: Deploy & Public Serving (level=ac)'
created_by: xgd
created_at: '2026-08-07T22:01:10.794230+00:00'
updated_at: '2026-08-07T22:01:10.794230+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a12e557f
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Delivery: Deploy & Public Serving
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Anchor report: report-17a279f7. Capability: capability-a12e557f (CAP-82).
Attempt 2 at the `ac` level. The prior cycle was report-ba028ef4 (REPORT-1636,
FAIL: 1 violation, 3 warnings) and its fix call report-d816f77b (REPORT-1637,
5 fixes applied, no code edits).

**All four prior findings are closed, each independently re-verified against the
current ticket state rather than accepted from the fix report** (ledger below).
No new findings at this level. The story level closed PASS at report-7c2dae46,
so the three story bodies remain the working reference here.

Scope re-loaded from scratch: 36 active ACs across STORY-94 (13), STORY-95 (14),
STORY-96 (9) — the same count as the prior cycle. No AC was added, deprecated or
removed by the repair, and exactly the four expected ACs plus one story body
carry a new `updated_at`; every other element is byte-unchanged.

## Cumulative Intent Considered

Unchanged since report-ba028ef4 — statuses re-read, no intent has moved and none
has been added. Reproduced for the ledger's sake:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-110 | free_and_reconciled | 2026-07-30 | `1c deploy` + R2 layout: `out/` **and** `source/`, render-first, content-addressed id, previews-are-not-revisions, `--dry-run`, `--prune`, stage-labelled report, published-requires-revision refusal, conditional manifest write | YES |
| REQ-111 | free_and_reconciled | 2026-07-30 | `public-site` Worker: route grammar, trailing-slash 301, `SiteStore` seam, content-type by extension, immutable vs 60s TTL, `X-Robots-Tag` on **every** draft response, opaque 404, reserved `draft` segment, apex holding response, warm cache, 404s uncached, `HEAD`, `405 + Allow` | YES |
| REQ-113 | free_and_reconciled | 2026-07-31 | Extensionless → `.html` mapping; AC1–AC4 preview server, AC5–AC9 added by the 2026-07-30 scope extension that corrected the Cloudflare-Pages premise | YES |
| BUG-31 | free_and_reconciled | 2026-07-31 | Keys namespaced by store root, per-root index, root-scoped prune, nullable `url` + "not publicly reachable" report, `SERVABLE_ROOT` never derived from a request | YES |
| REQ-109 / BUG-30 | free_and_reconciled | 2026-07-30/31 | Document-relative asset emission; the `/#frag` defect. Hard dependency, owned by STORY-83 elsewhere | YES, out-of-capability |
| REQ-115 | free_and_reconciled | 2026-07-31 | `resolveStaticFile` factored out; builder origin shares it. Basis of an open story-level warning only | YES for that warning only |
| REQ-108 / REQ-114 / REQ-116 | free_and_reconciled | 2026-07-29…31 | L1 accent / palette / edit render. REQ-116's edit channel is "never published, never content-addressed", non-goals pin "no change to the published or draft-preview channels" | NO |
| REQ-88 / REQ-84 | free_and_reconciled | — | "Servable" there is the local reproduction bundle | NO |
| REQ-112 / REQ-119 | draft | 2026-07-31 | Not active; REQ-119 explicitly leaves `public-site` unchanged | NO |

## Alignment Ledger

### Repaired this cycle — each re-read in full and re-checked against code

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-906 (fc87f616) opaque not-found | REQ-111 | **aligned — prior violation closed.** The byte-identity claim is now scoped *within* a channel: the four cases still share status, plain-text type and body, and full header equality is asserted pairwise on the published channel (unknown site vs nothing published) and on the preview channel (unknown snapshot id vs missing object). AC-910's no-index directive is named as the single permitted cross-channel difference, with the non-oracle reason. Verified satisfiable by construction: `notFound(channel)` builds `Headers({'content-type':'text/plain; charset=utf-8'})` and adds `x-robots-tag` only for `draft` (`apps/public-site/src/index.ts:151-166`), so the difference set is exactly one header. Also now matches STORY-95's own wording, which scopes the property to "tell an unknown site from one that has not published" — both published-channel. |
| AC-905 (27815e0f) index is the authority | REQ-111, BUG-31 | **aligned — prior exclusivity warning closed.** The tree gate is now a cross-reference to AC-927 rather than a restatement, and the duplicated fourth verification bullet is gone, replaced by an explicit pointer. The AC's scope ("within the servable tree") now matches STORY-95's bullet, which says "within that tree" verbatim. Its three remaining assertions — orphaned bytes, unlinked preview, unmatched identifier — are all genuinely its own. |
| AC-892 (0854ccc9) draft ships complete artifact | REQ-110, BUG-31 | **aligned — prior exclusivity warning closed.** ¶2 reduced to the servable-tree case with the non-servable behaviour deferred to AC-925; the duplicated verification tail is gone. |
| AC-896 (5a097866) published channel + live pointer | REQ-110, BUG-31 | **aligned — same warning, published half closed.** Closing sentence is now a cross-reference to AC-925; verification names the servable tree explicitly. |
| STORY-94 (5349d01f) body | REQ-110 | **aligned — prior coverage warning closed.** A new In-scope bullet ("Two deploys do not silently overwrite each other") gives AC-901 story-body grounding. Checked against `tools/generate/src/deploy/manifest.ts:107-117`: `writeManifest` throws `ManifestConflictError` *before* `putText`, so "writes no index of its own, leaving the index exactly as the other deploy left it" is literally true. The Technical Context "Known divergence from intent" note survives verbatim, as the finding asked. The other ten bullets and every other section are byte-unchanged. |

### Unchanged — carried forward from report-ba028ef4

| Element group | Outcome |
|---|---|
| STORY-94: AC-893, AC-894, AC-895, AC-897, AC-898, AC-899, AC-900, AC-901, AC-924, AC-925, AC-926 | aligned (REQ-110 / BUG-31), untouched |
| STORY-95: AC-902, AC-903, AC-904, AC-907, AC-908, AC-909, AC-910, AC-911, AC-912, AC-913, AC-914, AC-927 | aligned (REQ-111 / BUG-31), untouched. AC-913's thin story-body grounding remains an open *story-level* warning — see Notes |
| STORY-96: AC-915 … AC-923 | aligned, one-to-one with REQ-113 AC1–AC9; story body untouched (`updated_at` 2026-08-06T22:06:06) |

### Re-checked properties after the repair

- **Consistency** — every AC now follows from its story body. The four edited ACs
  read closer to their bullets than before, not further: AC-905 adopts the story's
  own "within that tree" scoping, AC-906 adopts the story's own unknown-vs-
  unpublished framing.
- **Coverage — no gap opened by the trimming.** Each clause removed from AC-892,
  AC-896 and AC-905 is asserted by the AC it now points at: non-servable
  ship-and-index equivalence by AC-925 ("the upload, the content addressing and
  the index update are otherwise exactly what a servable deploy does"), scratch-
  prefix artifact readback by AC-924, per-tree index isolation on the published
  channel by AC-926, and non-servable-tree unreachability by AC-927. STORY-94's
  eleven In-scope bullets and STORY-95's eleven each land on at least one AC;
  STORY-96 remains one-to-one with REQ-113.
- **Exclusivity** — both duplications are gone and the repair introduced none.
  AC-906's reference to AC-910 asserts a *difference set*, not AC-910's presence
  criterion, so the two remain distinct.

### Evidence re-run

`npx vitest run tests/req111-public-site-serving.test.ts` — **10 passed / 10**,
2.25s. No production code was changed this cycle, and none was expected to be:
the violation was a matrix-internal contradiction between two ACs, not a defect.
`test_UAT_FC_REQ-111_unknown_slug_and_missing_object_404`
(`tests/req111-public-site-serving.test.ts:290`) byte-compares exactly the two
published-channel cases and checks the preview-channel cases on status and body —
which is now what AC-906 asks for, where before the AC demanded more than correct
code can give.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | — | AC-906, AC-905, AC-892, AC-896, STORY-94 | — | All four findings from report-ba028ef4 verified closed against current ticket bodies, not assumed from report-d816f77b. Exactly the five elements the fix report claims to have edited carry a new `updated_at`; the other 32 ACs and two story bodies are unchanged, so the repair was surgical with no collateral rewriting | none |
| 2 | info | — | AC-913 (acceptance_criterion-08d88be5) | — | STORY-95's body supports AC-913 (apex holding response) only through a parenthetical inside its Out-of-scope paragraph. This is REPORT-1635 finding 2, an open **story-level** warning; report-ba028ef4 declined to re-count it at the AC level and report-d816f77b correctly left it untouched. Recorded here so the next story-level cycle still sees it | none at this level; belongs to the story ledger |
| 3 | info | — | STORY-95 body, "one multi-tenant server answers both for every site" | — | No AC pins multi-tenancy as a separately observable criterion. Multi-tenancy is implicit in the slug-bearing grammar every serving AC exercises, and no intent states it as its own acceptance bullet (REQ-111 does not). Recorded, not raised | none |
| 4 | info | — | AC-908 (acceptance_criterion-55611f33) | — | Its extension enumeration (GIF, AVIF, XML, web manifest, TTF/OTF) exceeds REQ-111's stated list but matches `apps/public-site/src/content-type.ts` exactly — the AC records what shipped rather than over-claiming | none |

## Notes for the Editor

- **Nothing to action at this level.** The `ac` level is clean: zero violations,
  zero needs_review, zero warnings.

- **One item is still open upstream.** AC-913's story-body grounding (finding 2)
  is a `story-body-edit` on STORY-95 owned by the story level's ledger
  (REPORT-1635 finding 2, still unrepaired), together with that cycle's other two
  warnings — STORY-96's stale "the two places a site is ever served from"
  enumeration, made inaccurate by REQ-115's `resolveStaticFile` extraction, and
  the DOC-12 section citation. None of the three blocks the AC level.

- **The cross-reference pattern is now the matrix's convention here** — AC-892
  and AC-896 defer to AC-925, AC-905 defers to AC-927, AC-906 names AC-910. It
  keeps each BUG-31 criterion proven exactly once, but it also means a future
  edit that weakens AC-925 or AC-927 silently weakens the ACs pointing at them.
  Worth preserving the pointers verbatim in any later rewording.

- **Spot-checks against production code, all clean** (no `code-issue` warranted):
  AC-906 vs `index.ts:151-166`; AC-901 and STORY-94's new bullet vs
  `manifest.ts:107-117`; AC-914 vs `content.ts:87`; AC-899 vs
  `deploy.ts:290-310`; AC-917 vs `serve.ts:92`; AC-921 vs
  `routes.ts:htmlFallbackFor`.
