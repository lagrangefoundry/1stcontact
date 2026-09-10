---
uid: report-bd2fed08
id: REPORT-3677
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=story)'
created_by: xgd
created_at: '2026-09-10T06:05:32.616614+00:00'
updated_at: '2026-09-10T06:05:32.616614+00:00'
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

Attempt 2 of this check (previous: REPORT-3675 `report-f8bf6a19`, FAIL, 4 violations;
fix pass REPORT-3676 `report-46a98eeb`). Every prior violation was re-verified against
the current ticket bodies and the tree, not assumed repaired; all four are closed. One
new warning was found in text the fix pass introduced.

## Cumulative Intent Considered

Both stories carry *bundles* as `intent_uid`, so the ledger is the member intents of
those bundles that touch the storage port, plus the bugs and requests that later
amended it.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-141 `request-b18d2056` (BUNDLE-19 `bundle-77b28def`) | free_and_reconciled | 2026-08-15 | Vitest split into two projects routed by filename; workerd project with real D1/R2 bindings and the deployed compatibility settings | YES |
| REQ-142 `request-0dd62a5d` (BUNDLE-19) | free_and_reconciled | 2026-08-15 | The async `SiteStore` port; filesystem adapter behind it; filesystem-free adapter beside it; one whole-change write; no location-shaped return; asset sources move out to callers | YES |
| REQ-143 `request-18a48d63` (BUNDLE-20 `bundle-b3b7c399`) | free_and_reconciled | 2026-08-15 | The D1+R2 store; tenant-scoped handle with no tenant argument; `version` + `expect` conditional write; port-to-port copy; one contract module over three adapters; bindings in both deployment halves | YES |
| REQ-145 `request-b474390f` (BUNDLE-20) | free_and_reconciled | 2026-08-15 | control-app becomes the builder; **proxy deleted**; every route ports through the store | YES (its own behaviour is CAP-85's) |
| REQ-149 `request-554ac441` (BUNDLE-20) | free_and_reconciled | 2026-08-17 | **Five revision storage verbs on the port** (`revisions`, `writeRevision`, `readRevision`, `draftBase`, `setDraftBase`), implemented by every adapter; `pendingChanges` leaves the port; migration `0002` makes the cloud store a revision store | YES |
| BUG-36 `bug-db356ff8` (BUNDLE-21 `bundle-78f4e2fe`) | free_and_reconciled | 2026-08-23 | Unknown-vs-inactive account refused at handle construction, carrying *which* as a branchable value | YES |
| BUG-37 `bug-6612c4b7` (BUNDLE-21) | free_and_reconciled | 2026-08-24 | Assembled draft retained per isolate, keyed `(tenant, slug)`, invalidated by a live read of the site's write version, bounded at one entry per site | YES |
| REQ-162 `request-13a5e206` | free_and_reconciled | 2026-08-31 | Second R2 binding (`BLOBS`) — forced AC-1398's binding claim from counted to paired-per-binding | YES |
| REQ-154 `request-4fcbd354`, BUG-39 `bug-23d1ec27` | bundled | 2026-08-20 / 2026-08-24 | Browser-rendering seam; chat-host doubles — neither touches the storage port | imminent, not applicable |
| REQ-155 `request-01ea4eec` | draft | 2026-08-20 | A separate `ReferenceStore` port for capture | NO |
| REQ-134 `request-ba3e3fba` | abandoned | 2026-08-12 | Image-generation component | NO |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-101 `capability-c4c7a854` | REQ-142, REQ-143, REQ-141 | aligned — body now states **three** live implementations, matching `tools/generate/src/store/index.ts:83-87` (`d1r2SiteStore`, `fsSiteStore`, `memorySiteStore`) and this capability's own AC-1385. Prior gap closed. |
| STORY-118 `story-3f4a5f2b` (feature, completed) | REQ-141, REQ-142, REQ-149 (`updated_by` now records `bundle-b3b7c399`) | aligned — the declared operation set no longer lists the pending-against-base question, and the revision verbs and their above-port caller are described. Warning 1 concerns one clause of that new text. |
| STORY-121 `story-fde7370b` (upgrade, updated) | REQ-143, REQ-149, REQ-145, BUG-36, BUG-37, REQ-162 (`updated_by` now `["bundle-78f4e2fe", "request-13a5e206"]`) | aligned — the store is described as a revision store, the deployed builder origin is named as a live caller, and the out-of-scope boundary is the publish *sequence*, which is CAP-82's STORY-94. |

**Re-verification of the four prior violations** (each checked against the tree, not
against the fix report's claims):

1. STORY-118 "What storage is asked" — the pending-against-base item is gone from the
   enumeration; a new paragraph names the five verbs. `tools/generate/src/store/site-store.ts:206-234`
   declares `revisions`/`writeRevision`/`readRevision`/`draftBase`/`setDraftBase` and no
   pending verb; `tools/generate/src/publish/publish.ts:101` is `pendingChanges(store, slug)`
   above the port. **Closed.**
2. STORY-118 "Out of scope" — "Publish, checkout, render and history … stay on the
   filesystem directly" is gone; the exclusion is now the *sequencing*. **Closed.**
3. STORY-121 "Out of scope" — the "remain filesystem-backed / pending against no base"
   bullet is replaced. `d1r2-store.ts:50` says "IT IS A REVISION STORE NOW (REQ-149)";
   `draftBase`/`setDraftBase` read and write `sites.base_revision` at `d1r2-store.ts:782-795`.
   Both fs and memory adapters implement the verbs (`fs-store.ts:145,149,181,204`;
   `memory-store.ts:188,192,210,223`). **Closed.**
4. STORY-121 "Any production caller" — "the builder is still a proxy" is gone; the
   deployed origin is named as a live caller with the origin's own behaviour left to
   CAP-85. **Closed.**

**Coverage of each counting intent, independently re-checked:**

- REQ-141 → STORY-118 ("two test runtimes, routed by filename"); the tree still carries
  `vitest.config.mts` / `vitest.node.config.mts` / `vitest.workers.config.mts`, and the
  workers config still carries the retracted pin rationale at lines 28-33 — so
  STORY-118's "Known divergence between the tree and its own explanation" section is
  still *accurate*, not stale.
- REQ-142 → STORY-118 (the whole story).
- REQ-143 → STORY-121 (split by kind, handle scoping, `version`/`expect`, copy path,
  one contract over three adapters, bindings in both halves).
- REQ-149 → the port-side half is STORY-118 + STORY-121; the sequencing half is CAP-82's
  STORY-94 `story-5349d01f` (`capability_uid: capability-a12e557f`, `updated_by:
  bundle-b3b7c399`), which is the correct home and does carry it.
- REQ-145 → CAP-85's STORY-99 `story-e674c60a`; CAP-101 correctly records only that the
  origin is a caller of this store.
- BUG-36 → STORY-121's refusal discriminant. Verified as a value in the tree:
  `d1r2-store.ts:104` — `readonly reason: 'unknown' | 'inactive'`, with the load-bearing
  distinction documented against BUG-36.
- BUG-37 → STORY-121's retained assembled draft. Verified: `d1r2-store.ts:185` `ASSEMBLED`
  map keyed `(tenantId, slug)` (`:188`), version checked from the live row read
  (`:803-824`), dropped on `forget` (`:402-405`) and when the site is found absent
  (`:805-807`), replaced rather than accumulated (`:824`).
- REQ-162 → AC-1398's paired-per-binding restatement, recorded as an explicit
  reconciliation decision in STORY-121. The second bucket really is declared:
  `vitest.workers.config.mts` documents `BLOBS` as "A SECOND bucket, not a prefix in
  SITES (REQ-162)", so the counted form would indeed have failed on a correct config.

**Exclusivity**: STORY-118 owns the port, the two original adapters and the runtime
split; STORY-121 owns the third adapter and what only it can promise (atomicity,
account scoping, conditional write, the retained draft). No overlapping intent — the
two stories partition REQ-142/REQ-141 from REQ-143/BUG-36/BUG-37/REQ-162, and STORY-121's
Technical Context states the separation explicitly ("a new story inside CAP-101 rather
than an extension of that one, and it is emphatically not a parallel port").

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-118 (`story-3f4a5f2b`), "And the port carries the revision storage verbs" | story-body-edit | The paragraph's heading says the revision verbs' "callers are not the editing surface" and its body says "No editing command asks them; publish and checkout do." The editing surface *does* ask them, one level removed: `editStatus` (`tools/generate/src/cli/edit.ts:2157-2159`) calls `pendingChanges`, which is `store.revisions()` + `store.readRevision()` (`tools/generate/src/publish/publish.ts:101-105`). `editStatus` is reached as `1c status` (`cli/index.ts:1426`) and by the assistant's tool adapter (`cli/ai/toolbox-core.ts:191,257`) — and that adapter is named in this story's own in-scope list as part of the editing surface. REQ-142 (`request-0dd62a5d`, free_and_reconciled) §7 already recorded that `edit.ts` "computes `status` by diffing the live revision against `draft/`"; REQ-149 moved that computation above the port without removing the caller. Only the *direct* reading of the claim is true: no editing command calls a revision verb itself (verified — `edit.ts` contains no `revisions`/`readRevision`/`draftBase` reference). | Narrow the claim to the direct sense and name the real caller set: no editing command calls a revision verb directly, but `1c status` and the assistant's tool adapter reach two of them through the above-port pending computation, alongside publish and checkout. |
| 2 | info | consistency | STORY-118 (`story-3f4a5f2b`), "In scope" | — | The in-scope list does not name the revision verbs; ownership of them is stated in the Description and in the Out-of-scope bullet instead. Covered generically by "The declared storage operations, their asynchrony, their totality", so this is not drift — recorded so a later reader does not read the omission as a scope boundary. | none |
| 3 | info | consistency | STORY-118 (`story-3f4a5f2b`) | — | "Freeze one" elides that `writeRevision` also writes the *rendered output* and copies the source assets alongside it (`site-store.ts:213-218`), which is REQ-149's "render-to-store" deliverable. Adequate at story level; flagged so the `ac` cycle decides deliberately whether that belongs in a criterion. | none |
| 4 | info | — | STORY-118 / STORY-121 `fields.updated_by` | — | Both field chains were repaired by the fix pass: STORY-118 now records `bundle-b3b7c399` (REQ-149) and STORY-121 now records `bundle-78f4e2fe` (BUG-36/37) alongside `request-13a5e206`. A future check reading the chain alone will now find the intents these bodies are aligned to. | none |

## Notes for the Editor

- **The story level is clean; the AC level still owes one decision.** AC-1385 ("Every
  storage question answers identically over all three live stores") enumerates the
  questions the *editing* surface asks and omits the five revision verbs. The previous
  cycle deliberately left this to the `ac` level and the fix pass correctly did not
  touch it. It is still open: either the enumeration widens or a criterion of its own is
  authored for the revision verbs, but it should be decided rather than inherited by
  omission. The same applies to `version`, which is declared on the port
  (`site-store.ts:249`) as REQ-143's addition and is covered by AC-1388 — so it is not a
  gap, only worth knowing the enumeration in STORY-118 predates it.

- **Warning 1 is a fix-pass artifact, not inherited drift.** The clause did not exist
  before REPORT-3676; it was introduced while repairing violations 1 and 2. It is a
  caller-attribution error, not a behavioural one — nothing about what the port declares
  or what any adapter answers changes if it is left — which is why it is a warning and
  not a violation.

- **Survey hazard still applies** (recorded in STORY-118 and confirmed here): `builder.ts`
  and `fidelity.ts` carry deliberate NUL bytes, so any consumer survey of the editing
  surface must force text mode or it will silently miss two of the heaviest consumers.
