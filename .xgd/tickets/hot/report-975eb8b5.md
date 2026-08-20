---
uid: report-975eb8b5
id: REPORT-2463
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=story)'
created_by: xgd
created_at: '2026-08-20T15:49:49.212406+00:00'
updated_at: '2026-08-20T15:49:49.212406+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

This is attempt 2. Attempt 1 (REPORT-2461) carried one violation — the static
import-graph claim was expressed nowhere in the capability's story tree. Both
halves of the repair (story-body-edit + ac-add) were applied by REPORT-2462 and
have been **re-verified from the live tickets and from `origin/main`**, not
assumed. See "Re-verification of attempt 1" below.

## Cumulative Intent Considered

The capability carries no `intent_uid` of its own and no `updated_by` chain. Its
single story (STORY-118, `story-3f4a5f2b`, `story_kind=feature`,
`status=completed`) names `intent_uid: bundle-77b28def` (BUNDLE-19,
`free_and_reconciled`, `merged_at_commit b18b859d…`). That bundle carries nine
source tickets and produced six stories, each landing in a different capability;
CAP-101's tree derives from exactly two of them.

The other seven bundle members were re-scanned independently this cycle for
storage/runtime asks. Two mention D1/R2 at all, and both **explicitly disclaim**
the surface CAP-101 owns:

- REQ-123: *"The D1 ticket store is not in this ticket… The host moves to workerd
  with the store, at DOC-12 §7 phase 2"* — defers to this chain rather than
  competing with it.
- REQ-144: *"`bin/deploy` knows nothing about D1 or any key. That is what keeps
  this ticket shippable ahead of the store chain"* — hooks only.

REQ-133, BUG-35, REQ-131, REQ-140, REQ-139 contain zero matches for `workerd`,
`SiteStore`, `vitest`, `node:fs`, D1 or R2.

Downstream intents were re-checked because four build directly on this port;
none has changed status since attempt 1.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-141 (`request-b18d2056`) | bundled (in BUNDLE-19, `free_and_reconciled`) | 2026-08-15 | Vitest split into node + workerd projects; D1/R2 bindings; `*.workers.test.ts` routing convention; production `compatibilityDate`/`nodejs_compat`; one UAT per project; Astro transform preserved | YES |
| REQ-142 (`request-0dd62a5d`) | free_and_reconciled | 2026-08-15 | Async `SiteStore` port (11 verbs, total, no location-shaped returns); `FsSiteStore` carrying today's non-atomicity; `edit.ts`'s 31 exports async; **no `node:fs`/`node:path` import in `edit.ts` (AC-2)**; one whole change as one call; in-memory adapter; site factory over both backends; unchanged CLI surface + envelopes | YES |
| REQ-123 (`request-488d874b`) | free_and_reconciled | 2026-08-07 | System KB — explicitly excludes the D1 store | YES, but no CAP-101 surface |
| REQ-144 (`request-7bef34e0`) | free_and_reconciled | 2026-08-15 | Build/deploy/smoke scripts — deliberately free of D1 knowledge | YES, but no CAP-101 surface |
| REQ-143 (`request-18a48d63`) | ready_to_reconcile | 2026-08-15 | The D1/R2 adapter — a **third** store, plus `version(slug)` / `SiteWrite.expect?` (CAS) and a contract run over three adapters | imminent (info #3) |
| REQ-145 (`request-b474390f`) | ready_to_reconcile | 2026-08-15 | control-app becomes the builder; tenant-scoped `d1r2SiteStore()` | imminent |
| REQ-146 (`request-0cdfdc5b`) | ready_to_reconcile | 2026-08-15 | AI host into workerd; `createL1Toolbox` takes an injected `SiteStore`; static import-graph guard on the Worker path | imminent |
| REQ-148 (`request-7ae3c2cc`) | ready_to_reconcile | 2026-08-15 | Behavior modules in workerd; more `*.workers.test.ts` files | imminent |
| REQ-147 (`request-23fd6e61`) | reconciling | 2026-08-15 | Cloudflare Access — no store surface | imminent, not relevant |
| REQ-149 (`request-554ac441`) | draft | 2026-08-17 | Publish in the cloud (would retire "publish/checkout stay filesystem-only") | NO — draft |
| REQ-150 (`request-34dd9049`) | free_coding | 2026-08-18 | Vite SSR server instead of Astro's | NO — not yet active |

Chronologically: REQ-141 landed the runtime the claim is checked in, REQ-142
landed the port itself. **No counting intent has retired any behaviour this
capability currently describes.**

## Re-verification of attempt 1

Attempt 1's violation was: REQ-142 AC-2 (and REQ-142 §10's "Node-free supporting
modules") expressed nowhere in the story tree. Both repairs verified present and
correct this cycle:

| Repair | Verified |
|---|---|
| STORY-118 Description paragraph | Present — "**The seam is asserted over the imports, not only over a run that behaved.**", stating the editing surface's module and the port's supporting modules name no filesystem module, with the `nodejs_compat` reason a behavioural pass cannot substitute |
| STORY-118 In-scope bullet | Present — "The editing surface and the port's own modules reaching no filesystem *in their imports*, not merely in their behaviour — the seam asserted over the import graph rather than inferred from a suite that passed", placed immediately after the bullet whose scope it extends |
| AC-1353 (`acceptance_criterion-003caa07`) | Present, `status=active`, `story_uid=story-3f4a5f2b`, `kind=behavior`, `regression_only=false` — matching its nine siblings. Criterion names `edit.ts` plus the four port modules and records `fs-store.ts` behind its separate entry point as the one expected filesystem import |

The property AC-1353 asserts was re-checked against `origin/main` (this worktree
predates the port — see caveat below):

- `git grep -an "node:" origin/main -- tools/generate/src/edit.ts` → **no output**.
- `site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts` → no
  `node:` import (`journal-model.ts:9`'s only hit is prose in a comment).
- `fs-store.ts:1-2` imports `node:fs` / `node:path` and self-documents at line 28
  as "THE ONLY MODULE IN THE PORT'S WORLD THAT IMPORTS `node:fs`".
- The evidence AC-1353 will map to at uat level exists and matches its
  Verification section clause for clause:
  `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:103` header `// ── AC-2: the
  seam is real, not described`, with `:105` ("edit.ts imports no filesystem
  module") and `:115` ("the port and its model reach no filesystem", looping the
  four named modules asserting no `from 'node:` and no `from './fsutil'`).

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-101 (body) | REQ-141, REQ-142 | aligned — "small, total, asynchronous set of questions and one whole-change write", "no operation hands back a filesystem location", "two implementations… neither detected at runtime", "tests run in two runtimes, routed by filename alone" all trace to REQ-142 §5/§10 and REQ-141's landed section |
| STORY-118 — declared-operation list | REQ-142 §10 | aligned — the eleven verbs named in the body match `store/site-store.ts` on `origin/main` (`hasDraft`, `readSiteJson`, `readPages`, `write`, `listAssets`, `readAsset`, `counter`, `appendChange`, `changesSince`, `pendingChanges`, `loadDraft`), including all four journal-facing verbs REQ-142 §7 "Port width" added |
| STORY-118 — import-graph claim | REQ-142 AC-2 + §10 | **aligned (repaired this cycle)** — was attempt 1's sole violation; now carried by a Description paragraph, an In-scope bullet and AC-1353 |
| STORY-118 — "One change is one call" | REQ-142 AC-5, §10 | aligned — AC-1323 |
| STORY-118 — "Two stores, both current, neither detected" | REQ-142 §4, §10 | aligned — including the three start-up naming sites (CLI `editOptions()`, `builderStore()`, `ai/toolbox.ts`) |
| STORY-118 — "Everything an operator sees is unchanged" | REQ-142 AC-3, §7 "Asset sources" | aligned — AC-1326; the `1c asset add <file> --as` source-path carve-out and its NOT_FOUND envelope are stated as REQ-142 §7 states them |
| STORY-118 — "Deliberate non-behaviours" | REQ-142 §7, §10 | aligned — fs non-atomicity, memory store is not a revision store, preview buffered not streamed, asset-name confinement carried not introduced; each is a disclaimer, none is a claim, and none contradicts an intent |
| STORY-118 — "Known divergence" (stale pin rationale) | REQ-141 CORRECTION block | aligned, and the tree comment re-verified still present — see warning 1 |
| STORY-118 — "Suite state and its attribution" | REQ-142 §11–§12 | aligned — the story states the failing set as byte-identical against both the pre-split configuration and the pre-port branch without restating counts, and attributes the delta to the two suites REQ-142 §12 repaired |
| STORY-118 — "Survey hazard" (NUL bytes) | REQ-142 §12 | aligned |
| STORY-118 — two runtimes / bindings / compatibility settings | REQ-141 AC1–AC5 + landed section | aligned — AC-1328, AC-1329 |
| AC-1329 4th bullet | REQ-142 AC-1 | aligned — "The set of failing tests is unchanged across the split **and across storage becoming a port**… No assertion was rewritten" is where REQ-142's whole-correctness claim lives |
| AC-1321 … AC-1329, AC-1353 | REQ-141 AC1–AC5; REQ-142 AC1–AC5, AC7 | every counting behavioural AC of both intents is expressed |
| Exclusivity vs STORY-115 (CAP-99, journal) | REQ-131 | no overlap — STORY-118 explicitly cedes journal semantics: "the change journal is its own capability; this story owns only that those questions are asked of the store like every other" |
| Exclusivity vs STORY-119 (build/deploy) | REQ-144 | no overlap — REQ-144 disclaims D1 knowledge by design |
| Exclusivity vs STORY-117 (CAP-100, system KB) | REQ-123 | no overlap — REQ-123 explicitly defers the D1 store to this chain |
| Exclusivity within CAP-101 | — | CAP-101 holds exactly one story; no intra-capability overlap is possible |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | `vitest.workers.config.mts:26-27` (on `origin/main`) | code-issue | REQ-141's post-promotion CORRECTION block states "The rationale comment in `vitest.workers.config.mts` states the wrong cause and should be corrected or removed", after four controlled experiments retracted the supply-chain-policy diagnosis in favour of pnpm 11.9.0's incremental resolution dropping `optionalDependencies`. Re-verified still present this cycle: `origin/main:vitest.workers.config.mts:26` "…supply-chain policy. A caret silently picks a release whose workerd binary is still withheld…". **The matrix is aligned here** — STORY-118's "Known divergence" paragraph records the retraction accurately, and AC-1328/AC-1329 deliberately encode the routing convention and the bindings rather than the pin or its rationale. Carried forward unchanged from attempt 1; the outstanding item is the tree comment, which REQ-141 itself left "pending a decision". | No matrix edit. Operator decision: correct or delete the comment, or fold it into the dependency-bump work. STORY-118's divergence note must **not** be removed in the meantime — it is the only thing stopping a later reader re-deriving the retracted theory from the comment. |
| 2 | info | coverage | STORY-118 | — | REQ-141 AC-6 and REQ-142 AC-6 both ask for a clean `pnpm -r build` / typecheck / no new lint warnings. Neither is expressed in the story tree, correctly — those are `xgd quality run` gates, not capability behaviour. Recorded so a future check does not read it as drift. | none |
| 3 | info | coverage | CAP-101 body + STORY-118 | — | Four imminent intents (REQ-143, REQ-145, REQ-146, REQ-148 — all still `ready_to_reconcile`) will extend this capability. REQ-143 adds a **third** adapter, two new port verbs (`version(slug)`, `SiteWrite.expect?` for compare-and-set) and replaces the two-backend factory with a contract over three adapters; REQ-146 injects the store into `createL1Toolbox` and adds its own static import-graph guard on the Worker path. At that point "Two implementations are live and current at the same time" (capability body **and** story body) and the eleven-verb enumeration go stale. Authoring those edits now would make the matrix describe unreconciled code. | none now; expect a `story-body-edit` on both CAP-101's body and STORY-118 when REQ-143 reconciles |
| 4 | info | coverage | AC-1321 | — | REQ-142 §7 "Port width" makes four journal-facing verbs part of the port (`counter`, `appendChange`, `changesSince`, `pendingChanges`). STORY-118's body names all four; AC-1321's enumeration of "every question" names only "read its change count". At story level the behaviour is expressed, so this is not drift here. Re-flagged for the **ac-level** cycle. | none at this level |
| 5 | info | exclusivity | `test_UAT_FC_REQ-14x_*` vs `test_UAT_AC132*_*` | — | The free-coded UATs remain on `origin/main` alongside the reconciliation UATs. REQ-141's own test plan anticipated this ("become reconciliation's to rename against real ACs"). AC-1353 in particular currently has no `AC`-named test — its evidence is the FC pair at `test_UAT_FC_REQ-142_site_store_port.test.ts:105` and `:115`, deliberately left unrenamed because this worktree cannot host the file. Whether the FC set is redundant is a **uat-level** exclusivity question. | none at this level; uat level should either rename the FC pair or author `test_UAT_AC1353_*` |

## Notes for the Editor

**Nothing to repair at this level.** The one violation from attempt 1 is closed,
and it closed the way it should have: the assertions already existed in the tree
and already carried the intent's AC number, so the repair was to give them a
matrix element rather than to write a test.

**AC-1353 is the one AC in this story with no `AC`-named test yet.** That is
expected — it was authored this cycle, and the worktree it was authored in
(`regression-cb0dad9c`) physically has none of the modules the test reads. The
uat-level cycle should map `test_UAT_FC_REQ-142_site_store_port.test.ts:105`
and `:115` to it; they already assert exactly what AC-1353's Verification section
describes, including the `./fsutil` clause. Do not treat AC-1353 as
evidence-less.

**Structural verification is correct for AC-1353, not a shortcut.** The general
preference for behavioural UATs over source/AST checks does not apply where the
*absent import is the deliverable*. AC-1328 and AC-1329 already carry structural
claims for the same reason. Under `nodejs_compat` the Workers runtime resolves
`node:fs` and hands back a per-isolate filesystem that evaporates with the
isolate, so a command that quietly reached for a file passes every behavioural
assertion in this story and still loses the operator's work in production.

**Do not resolve warning 1 by editing the matrix.** STORY-118's "Known
divergence" paragraph reads like stale text and is not — it was re-verified
against `origin/main` this cycle and is load-bearing.

**Verification environment caveat (unchanged, and it bit twice).** This check ran
in worktree `regression-cb0dad9c`, HEAD `1792978cc`, which does **not** contain
BUNDLE-19's merge `b18b859d…`. `tools/generate/src/store/` here holds only the
pre-port modules — no `site-store.ts`, no `memory-store.ts`, no
`vitest.workers.config.mts`. Every code-level assertion in this report was read
from `origin/main` via `git grep`/`git show`. Anyone re-running these spot checks
locally must do the same or they will conclude the port does not exist.

**Survey hazard, restated because it applies to any follow-up.** `builder.ts` and
`fidelity.ts` carry deliberate NUL bytes as cache-key separators, so a plain
recursive grep classifies them as binary and skips them silently. `builder.ts` is
one of the heaviest consumers of `edit.ts`. Any survey of the port's callers must
force text mode (`grep -a` / `git grep -a`) or it will report a consumer set
missing its largest member.
