---
uid: report-1ac15f89
id: REPORT-2461
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=story)'
created_by: xgd
created_at: '2026-08-20T15:40:24.107587+00:00'
updated_at: '2026-08-20T15:40:24.107587+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: story
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

The capability carries no `intent_uid` of its own. Its single story (STORY-118,
`story-3f4a5f2b`, `story_kind=feature`) names `intent_uid: bundle-77b28def`
(BUNDLE-19, `free_and_reconciled`, `merged_at_commit b18b859d…`). That bundle
carries nine source tickets; the capability's tree derives from exactly two of
them. The other seven were scanned for storage/runtime asks and are clean
(REQ-123's single `workerd` mention explicitly *excludes* the store: "The D1
ticket store is not in this ticket").

Downstream intents were also checked, because four of them build directly on
this port and will extend the capability once reconciled.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-141 | bundled (in BUNDLE-19, `free_and_reconciled`) | 2026-08-15 | Vitest split into node + workerd projects; D1/R2 bindings; filename routing convention; production compatibility settings; one UAT per project | YES |
| REQ-142 | free_and_reconciled | 2026-08-15 | Async `SiteStore` port (11 verbs, total, no location-shaped returns); `FsSiteStore` carrying today's non-atomicity; `edit.ts`'s 31 exports async; one whole change as one call; in-memory adapter; site factory over both backends; unchanged CLI surface + envelopes | YES |
| REQ-143 | ready_to_reconcile | 2026-08-15 | The D1/R2 adapter — a **third** store, plus `SiteStore.version(slug)` and `SiteWrite.expect?` (CAS), and `site-store-contract.ts` running one contract over three adapters | imminent (see info #4) |
| REQ-145 | ready_to_reconcile | 2026-08-15 | control-app becomes the builder; `d1r2SiteStore()` tenant-scoped handle | imminent |
| REQ-146 | ready_to_reconcile | 2026-08-15 | AI host into workerd; `createL1Toolbox` takes an injected `SiteStore`; static import-graph guard on the Worker path | imminent |
| REQ-148 | ready_to_reconcile | 2026-08-15 | Behavior modules in workerd; more `*.workers.test.ts` files | imminent |
| REQ-147 | reconciling | 2026-08-15 | Cloudflare Access — no store surface | imminent, not relevant |
| REQ-149 | draft | 2026-08-17 | Publish in the cloud (would retire "publish/checkout stay filesystem-only") | NO — draft |
| REQ-150 | free_coding | 2026-08-18 | Vite SSR server instead of Astro's | NO — not yet active |
| REQ-134, REQ-112 | abandoned | 2026-08-12 / 2026-07-31 | — | NO |

Chronologically the picture is simple: REQ-141 landed the runtime the claim is
checked in, REQ-142 landed the port itself, and nothing reconciled since has
retired any of it. No behavior currently described by this capability has been
retired by a later counting intent.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-101 (body) | REQ-141, REQ-142 | aligned — "eleven questions and one whole-change write", "no filesystem location", "two implementations live and current", "two runtimes routed by filename" all trace to REQ-142 §10 and REQ-141's landed section |
| STORY-118 | REQ-141, REQ-142 | **gap**: REQ-142's named AC-2 ("No `node:fs` or `node:path` import remains in `edit.ts`") is expressed nowhere in the story tree — see finding 1. Everything else aligned. |
| STORY-118 — declared-operation list | REQ-142 §10 | aligned — the eleven verbs in the story body match `store/site-store.ts` on `origin/main` exactly (`hasDraft`, `readSiteJson`, `readPages`, `write`, `listAssets`, `readAsset`, `counter`, `appendChange`, `changesSince`, `pendingChanges`, `loadDraft`) |
| STORY-118 — "Deliberate non-behaviours" | REQ-142 §7, §10 | aligned — fs non-atomicity, memory store is not a revision store, preview buffered not streamed, asset-name confinement carried not introduced: each traces to REQ-142 §7 or is an explicit disclaimer rather than a claim |
| STORY-118 — "Known divergence" (stale pin rationale) | REQ-141 CORRECTION block | aligned, and verified still true in the tree — see warning 2 |
| STORY-118 — "Suite state and its attribution" | REQ-141 §evidence, REQ-142 §11–§12 | aligned — the story fuses the two intents' verifications (13 files/75 tests pre-split; 11 files/56 tests pre-port) into one no-numbers claim, and accounts for the delta with the two suites REQ-142 §12 repaired |
| AC-1321 … AC-1329 | REQ-141 AC1–AC5, REQ-142 AC1, AC3–AC5, AC7 | aligned; every one has a named reconciliation UAT (`test_UAT_AC1321_*` … `test_UAT_AC1329_*` present on `origin/main`) |
| Exclusivity vs STORY-115 (CAP-99, journal) | REQ-131 | no overlap — STORY-118 explicitly cedes journal semantics ("the change journal is its own capability; this story owns only that those questions are asked of the store") |
| Exclusivity vs STORY-119 (CAP-102, build/deploy) | REQ-144 | no overlap — REQ-144 contains no vitest/workerd/store asks |
| Exclusivity vs CAP-82 (`apps/public-site/src/site-store.ts`) | REQ-110, REQ-111 | no overlap despite the shared name — a different store on the far side of a deploy, as STORY-118's Technical Context states |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-118 (`story-3f4a5f2b`) + AC tree | story-body-edit (then ac-add) | REQ-142 (`request-0dd62a5d`, free_and_reconciled) names as its AC-2 "No `node:fs` or `node:path` import remains in `edit.ts`", and REQ-142 §10 adds the same requirement for the port's own supporting modules ("Node-free supporting modules, so the port can be imported without dragging `node:fs` behind it"). Nothing in the capability's story tree expresses this. The story's In-scope list stops at "the absence of any location-shaped return value"; AC-1322 covers what *crosses* the boundary and AC-1324 covers what a command *needs at runtime* — neither is the static-import claim. The property is real in the tree (`edit.ts` on `origin/main` has zero `node:` imports) and is already proven by two tests explicitly headed `// ── AC-2: the seam is real, not described` (`tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` and `:115`), so the evidence is orphaned rather than absent. This matters as a distinct claim because a behavioural pass is not evidence of an absent import — REQ-146 records that under `nodejs_compat` `node:fs` *resolves* in workerd and silently yields an ephemeral per-isolate filesystem, so only an import-graph assertion can carry it. | Add to STORY-118's In-scope list a bullet stating that the editing surface and the port's own modules reach no filesystem *in their imports*, not merely in their behaviour — the seam asserted over the import graph rather than over a passing run. Then author one AC covering it (`edit.ts` and `store/{site-store,assemble,journal-model,memory-store}.ts` import no `node:` module and no filesystem barrel), to which `test_UAT_FC_REQ-142_site_store_port.test.ts:105` and `:115` map. |
| 2 | warning | consistency | `vitest.workers.config.mts` (on `origin/main`) | code-issue | REQ-141's post-promotion CORRECTION block states "The rationale comment in `vitest.workers.config.mts` states the wrong cause and should be corrected or removed", after four controlled experiments retracted the supply-chain-policy diagnosis in favour of pnpm 11.9.0's incremental resolution dropping `optionalDependencies`. Verified still present on `origin/main`, `vitest.workers.config.mts:23-28`: "…whose platform binary must actually be installable under this workspace's supply-chain policy. A caret silently picks a release whose workerd binary is still withheld…". **The matrix is aligned here** — STORY-118's "Known divergence between the tree and its own explanation" records the retraction accurately and the ACs deliberately encode neither the pin nor its rationale. The outstanding item is the tree comment, which REQ-141 itself left "pending a decision on whether to reopen this ticket for a comment-only commit or fold it into the dependency-bump work". | No matrix edit. Operator decision: correct or delete the comment, or fold it into the dependency-bump work. Until then STORY-118's divergence note is the thing stopping a later reader re-deriving the retracted theory, and should not be removed. |
| 3 | info | coverage | STORY-118 | — | REQ-141 AC-6 and REQ-142 AC-6 both ask for a clean `pnpm -r build` / typecheck / no new lint warnings. Neither is expressed in the story tree. This is deliberate and correct — those are `xgd quality run` gates, not capability behaviour — and is recorded here so a future check does not read it as drift. | none |
| 4 | info | coverage | CAP-101 body + STORY-118 | — | Four imminent intents (REQ-143, REQ-145, REQ-146, REQ-148, all `ready_to_reconcile`) extend this capability and will require story edits when they reconcile: REQ-143 adds a **third** adapter (D1/R2), two new port verbs (`SiteStore.version(slug)` and `SiteWrite.expect?` for compare-and-set), and replaces the two-backend factory with `tests/support/site-store-contract.ts` run over three adapters; REQ-146 injects the store into `createL1Toolbox`. At that point "Two implementations are live and current at the same time" (capability body and story body) and the eleven-verb list become stale. Treated as live-but-not-yet-enforced per the status table — authoring them now would make the matrix describe unreconciled code. | none now; expect a `story-body-edit` when REQ-143 reconciles |
| 5 | info | coverage | AC-1321 | — | REQ-142 §7 ("Port width") makes four journal-facing verbs part of the port: `counter`, `appendChange`, `changesSince`, `pendingChanges`. STORY-118's body names all four. AC-1321's enumeration of "every question" names only "read its change count". Flagged for the **ac-level** cycle, not repaired here — at story level the behaviour is expressed. | none at this level |
| 6 | info | exclusivity | `test_UAT_FC_REQ-142_*` / `test_UAT_AC132*_*` | — | The free-coded UATs (`tests/test_UAT_FC_REQ-141_*`, `tests/test_UAT_FC_REQ-142_site_store_port.test.ts`) remain on `origin/main` alongside the reconciliation UATs (`test_UAT_AC1321_*` … `test_UAT_AC1329_*`). REQ-141's own test plan anticipated this ("become reconciliation's to rename against real ACs"). Whether the FC set is now redundant is a **uat-level** exclusivity question. | none at this level |

## Notes for the Editor

**The single violation is narrow and the evidence already exists.** Finding 1 is
not "write a new test" — the two assertions are already in the tree and already
labelled with the intent's AC number. What is missing is the matrix element they
belong to. Fixing it is a story In-scope bullet plus one AC, after which those
two tests get an AC-named home and stop being orphans at uat level.

**The verification for that AC should be structural, and that is consistent with
this matrix.** AC-1328 and AC-1329 already carry structural claims (the two
configs' include/exclude globs agree; the composing config declares no suite of
its own; the workers config carries no Astro transform), because in those cases
the structure *is* the deliverable. The import graph is the same case. The
general preference for behavioural UATs over AST checks does not apply where the
absent import is the thing being shipped.

**Do not resolve finding 2 by editing the matrix.** The temptation is to read the
story's "Known divergence" paragraph as stale text. It is not — it is accurate,
it was verified against `origin/main` during this check, and it is load-bearing:
it is the only thing in the matrix telling a later reader that the comment in the
tree states a retracted cause.

**Verification environment caveat.** This check ran in worktree
`regression-cb0dad9c`, whose HEAD (`2940caee0`) does **not** contain
BUNDLE-19's merge commit `b18b859d…` — the worktree predates the storage port
and has neither `vitest.workers.config.mts` nor `tools/generate/src/store/site-store.ts`.
Every code-level assertion above was therefore read from `origin/main` via
`git show` / `git grep`, not from the working tree. Anyone re-running these spot
checks locally must do the same or they will conclude the port does not exist.

**Survey hazard, restated because it applies to any follow-up.** `builder.ts` and
`fidelity.ts` carry deliberate NUL bytes as cache-key separators, so a plain
recursive grep classifies them as binary and skips them silently. `builder.ts` is
one of the heaviest consumers of `edit.ts`. Any survey of the port's callers must
force text mode (`grep -a` / `git grep -a`) or it will report a consumer set that
is missing its largest member.
