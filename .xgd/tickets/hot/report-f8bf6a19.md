---
uid: report-f8bf6a19
id: REPORT-3675
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=story)'
created_by: xgd
created_at: '2026-09-10T05:54:53.062135+00:00'
updated_at: '2026-09-10T05:54:53.062135+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: story
  violations: 4
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: story

**Result**: FAIL
**Violations**: 4
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

Stories in this capability carry *bundles* as `intent_uid`, so the ledger is the member
intents of those bundles that touch the storage port, plus the bugs and requests that later
amended it.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-141 `request-b18d2056` (in BUNDLE-19 `bundle-77b28def`) | free_and_reconciled | 2026-08-15 | Workers-runtime test project: UATs inside workerd against real D1/R2 bindings, routed by filename | YES |
| REQ-142 `request-0dd62a5d` (BUNDLE-19) | free_and_reconciled | 2026-08-15 | The async `SiteStore` port itself, filesystem adapter behind it, filesystem-free store beside it, one whole-change write | YES |
| REQ-143 `request-18a48d63` (in BUNDLE-20 `bundle-b3b7c399`) | free_and_reconciled | 2026-08-15 | The Cloudflare store (D1 + R2), tenant-scoped handle, conditional write, copy path, bindings in both deployment halves | YES |
| REQ-145 `request-b474390f` (BUNDLE-20) | free_and_reconciled | 2026-08-15 | control-app becomes the builder: routes and render in workerd, **proxy deleted**, every route ports through the store | YES |
| REQ-149 `request-554ac441` (BUNDLE-20) | free_and_reconciled | 2026-08-17 (landed 2026-08-20, commit `30abfebebd`) | **The port grows five revision storage verbs** (`revisions`, `writeRevision`, `readRevision`, `draftBase`, `setDraftBase`); `pendingChanges` *leaves* the port and becomes a function above it; the cloud store becomes a revision store (migration `0002_revisions.sql`) | YES |
| BUG-36 `bug-db356ff8` (bundle `bundle-78f4e2fe`) | free_and_reconciled | 2026-08-23 | Unknown-vs-inactive account refused at handle construction, carrying the reason as a value a caller can branch on | YES |
| BUG-37 `bug-6612c4b7` (bundle `bundle-78f4e2fe`) | free_and_reconciled | 2026-08-24 | Retained assembled draft keyed `(tenant, slug)`, invalidated by a live read of the site's write version | YES |
| REQ-162 `request-13a5e206` | free_and_reconciled | 2026-08-31 | Second R2 binding (`1stcontact-material`) — forced AC-1398's binding claim from counted to paired-per-binding | YES |
| REQ-154 `request-4fcbd354`, BUG-39 `bug-23d1ec27` | bundled | 2026-08-20 / 2026-08-24 | Browser-rendering seam; chat-host doubles — neither touches the storage port | imminent, not applicable |
| REQ-155 `request-01ea4eec` | draft | 2026-08-20 | A separate `ReferenceStore` port for capture | NO |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-101 body `capability-c4c7a854` | REQ-142 | gap: body states two live implementations; REQ-143 added a third, and this capability's own AC-1385 says "all three live stores" |
| STORY-118 `story-3f4a5f2b` | REQ-141, REQ-142 | gap: the declared operation set and the publish/history exclusion predate REQ-149, which changed both |
| STORY-121 `story-fde7370b` | REQ-143, BUG-36, BUG-37, REQ-162 | aligned on the store's own behaviour (account scoping, conditional write, retained draft, bindings); gap: two out-of-scope claims contradicted by REQ-149 and by REQ-145/BUG-36/BUG-37 |

Coverage of each counting intent is otherwise present: REQ-141 → AC-1328/AC-1329; REQ-142 →
AC-1321–AC-1327; REQ-143 → AC-1385–AC-1397; BUG-36 → AC-1387; BUG-37 → AC-1447/AC-1448;
REQ-162 → AC-1398 (already restated per binding, with the decision recorded in STORY-121).
REQ-149's *publish-side* behaviour is expressed outside this capability, in CAP-82's STORY-94
(`story-5349d01f`, `updated_by: bundle-b3b7c399`), which is the correct home for it — what is
missing here is only this capability's description of its own port.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-118 (`story-3f4a5f2b`), "What storage is asked" | story-body-edit | The enumerated operation set lists "report what the draft has pending against the revision it descends from" as a declared storage operation. REQ-149 (free_and_reconciled, member of `bundle-b3b7c399`, commit `30abfebebd`) removed it from the port: it is now `pendingChanges()` at `tools/generate/src/publish/publish.ts:101`, a function sequencing port verbs above the port. The same edit added five verbs the enumeration does not mention — `revisions`, `writeRevision`, `readRevision`, `draftBase`, `setDraftBase` (`tools/generate/src/store/site-store.ts:206–234`), implemented by all three adapters (`fs-store.ts:145–208`, `memory-store.ts:188–228`, `d1r2-store.ts:666–795`) | Drop the pending-against-base item from the declared operation set and state that the port also carries the revision storage verbs REQ-149 added, naming publish/checkout as their caller (owned by CAP-82's STORY-94) |
| 2 | violation | consistency | STORY-118 (`story-3f4a5f2b`), "Out of scope" | story-body-edit | "**Publish, checkout, render and history**, which stay on the filesystem directly" is false under cumulative intent. REQ-149 moved publish and history onto the port and into the Worker: `apps/control-app/src/router.ts:399–404` serves `POST /api/publish` through `publishSite(await openStore(), …)`, and `db/migrations/0002_revisions.sql` gives the cloud store `site_revisions` and `sites.base_revision` | Narrow the exclusion to what is still true — that *sequencing* a publish is CAP-82's, not this capability's — and remove the claim that publish, checkout and history stay on the filesystem |
| 3 | violation | consistency | STORY-121 (`story-fde7370b`), "Out of scope" | story-body-edit | "**Publishing, checkout and revision history**, which remain filesystem-backed here … This store reports every file as pending against no base, which is exactly what a site that has never published reports." Both sentences are false of the store this story describes, and were already false when the story was authored (2026-08-31; REQ-149 landed 2026-08-20). The adapter's own header says "IT IS A REVISION STORE NOW (REQ-149)" (`tools/generate/src/store/d1r2-store.ts:50`), and `draftBase`/`setDraftBase` read and write `sites.base_revision` (`d1r2-store.ts:782–795`) | Replace with the true boundary: the cloud store holds revisions and the draft's lineage, and what is out of scope here is the publish *sequence* over those verbs, which belongs to CAP-82's STORY-94 |
| 4 | violation | consistency | STORY-121 (`story-fde7370b`), "Out of scope: Any production caller" | story-body-edit | "The command line still runs on the filesystem and the builder is still a proxy — the relocation of the builder origin is its own story." The CLI half is true (`tools/generate/src/cli/*` uses `fsSiteStore` throughout); the builder half is not. REQ-145 (free_and_reconciled, same bundle) deleted the proxy, and CAP-85's STORY-99 records "The relocation landed: the origin *is* the edge runtime" / "The proxy is deleted, not disabled". The deployed builder opens *this* store on every route (`apps/control-app/src/store.ts:88`), which is what BUG-36 and BUG-37 are reports against. The claim also contradicts this story's own Description ("The preview surface reads the draft on *every* request") and AC-1447/AC-1448, which are only observable because a production caller exists | Keep the CLI sentence, drop "the builder is still a proxy", and state that the deployed builder origin is a live caller of this store while the *origin's* own behaviour remains CAP-85's |
| 5 | info | — | STORY-121 (`story-fde7370b`) `fields.updated_by` | — | Three of the story's criteria (AC-1387, AC-1447, AC-1448) formalize BUG-36 and BUG-37, which are bundled in `bundle-78f4e2fe`, but `updated_by` records only `request-13a5e206` (REQ-162). A future alignment check reading the field chain alone would not find the two bugs this story is aligned to | none required for this level; noted so the chain can be repaired when the story is next edited |

## Notes for the Editor

- **One cross-cutting pattern behind findings 1–3**: REQ-149 is a member of `bundle-b3b7c399`
  — the very bundle recorded as STORY-121's `intent_uid` — yet neither story in this capability
  reflects it. Both were authored describing a port that had already grown five verbs and a
  cloud store that had already become a revision store. Repairing findings 1–3 is one
  consistent edit: the port carries revision storage verbs; the cloud adapter implements them;
  sequencing a publish over them is CAP-82's story, not this capability's.

- **A second, smaller instance of the same staleness, one level up**: the capability body
  states "Two implementations are live and current at the same time" and lists exactly two
  (the operator's git-tracked tree, and a store with no filesystem). Since REQ-143 there are
  three — `fsSiteStore`, `memorySiteStore` and `d1r2SiteStore`, all exported live from
  `tools/generate/src/store/index.ts:83–87` — and this capability's own AC-1385 says "all three
  live stores". This is not counted as a separate violation because it is the same intent delta
  as finding 3 and sits on the capability rather than on a story, but the capability body should
  be corrected in the same pass; leaving it is how the next reader re-derives the two-store
  picture.

- **Not a finding, but the AC layer will need the same pass**: AC-1385 enumerates "every
  question the editing surface asks" and omits the five revision verbs. That enumeration is
  defensible as written — it is explicitly scoped to the *editing* surface, and the shared
  assertion body it describes is about editing questions — so it is left to the `ac`-level cycle
  to decide whether the revision verbs belong inside that enumeration or in a criterion of their
  own. It is recorded here so the decision is made deliberately rather than by omission.

- **No `needs_review` items.** Every ambiguity in this pass resolved against the implementation:
  the port surface (`tools/generate/src/store/site-store.ts:164–251`), the three adapters, the
  deployed router's publish route, and the migrations. No intent in the ledger is silent on a
  behaviour a story claims.
