---
uid: report-41df5dd1
id: REPORT-2084
type: report
title: 'Capability-Intent Alignment: Site Delivery: Deploy & Public Serving (level=story)'
created_by: xgd
created_at: '2026-08-16T07:05:23.088262+00:00'
updated_at: '2026-08-16T07:05:23.088262+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a12e557f
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Delivery: Deploy & Public Serving
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Anchor report: report-7ef6a9ea. Capability: capability-a12e557f (CAP-82).
Previous attempts: 0.

## Cumulative Intent Considered

The capability ticket carries no `fields.intent_uid` (neither does CAP-70, checked
as a control — this is the norm for capability tickets in this store, not drift).
The intent chain was therefore built from the story tree: all three stories carry
`intent_uid: bundle-e0143ffa` (BUNDLE-13), and STORY-94/STORY-95 additionally carry
`updated_by: bundle-0385746c` (BUNDLE-14). Both bundles are
`free_and_reconciled`. The ledger below unpacks the bundles into their source
intents and then widens to every later intent that touches deploy or public
serving, found by sweeping all 139 `request` tickets and all `bug` tickets.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-108 | free_and_reconciled | 2026-07-29 | L1 pointer-reactive texture accent | YES — but CAP-70 surface, not delivery |
| REQ-109 | free_and_reconciled | 2026-07-30 | Rendered output relocatable: document-relative asset URLs | YES — owned by STORY-83 (CAP-70); a delivery *precondition*, not delivery |
| REQ-110 | free_and_reconciled | 2026-07-30 | R2 artifact store + `1c deploy`; content-addressed snapshots, preview/published channels, dry-run, prune, manifest concurrency | YES → STORY-94 |
| REQ-111 | free_and_reconciled | 2026-07-30 | public-site Worker: route grammar, SiteStore seam, trailing-slash 301, content types, cache policy, noindex, opaque 404, reserved `draft` segment | YES → STORY-95 |
| REQ-113 | free_and_reconciled | 2026-07-31 | `1c serve` extensionless → `.html`; **scope extension** added the Worker half (AC5–AC9) after the "Cloudflare Pages" premise was found false | YES → STORY-96 |
| BUG-30 | free_and_reconciled | 2026-07-31 | `relativizeUrl` turns `/#frag` into a same-page anchor | YES — owned by STORY-83 (CAP-70) |
| BUG-31 | free_and_reconciled | 2026-07-31 | `--sandbox` writes to a real site's R2 keyspace; namespace every key by root, `SERVABLE_ROOT` fixed in the Worker, null URL for sandbox, root-scoped prune | YES → STORY-94 + STORY-95 |
| REQ-114 | free_and_reconciled | 2026-07-31 | L1 palette colour model | YES — CAP-83 surface, not delivery |
| REQ-116 | free_and_reconciled | 2026-07-31 | The edit render channel | YES — CAP-84 surface; never deployed or content-addressed, so no delivery ask |
| REQ-141 | ready_to_reconcile | 2026-08-15 | workerd vitest project with real D1/R2 bindings (`SITES` mirrors the deployed bucket) | imminent — test infrastructure, no CAP-82 behaviour |
| REQ-142 | free_coded | 2026-08-15 | Async `SiteStore` port over the **authoring** store, `FsSiteStore` behind it | pre-reconcile — and explicitly out of CAP-82 scope (see finding 2) |
| REQ-144 | free_coded | 2026-08-15 | `bin/build` / `bin/deploy` / `bin/smoke`, and the control-app `[vars]` inheritance bug | pre-reconcile — see finding 1 |
| REQ-143 | draft | 2026-08-15 | The Cloudflare SiteStore: definitions in D1, bytes in R2 | NO (draft) |
| REQ-145 | draft | 2026-08-15 | control-app becomes the builder; routes and L1 render in workerd | NO (draft) |
| REQ-146 | draft | 2026-08-15 | AI host and publish move into workerd | NO (draft) |
| REQ-147 | draft | 2026-08-15 | Cloudflare Access on app.1stcontact.io | NO (draft) |
| REQ-148 | draft | 2026-08-15 | Behavior modules render in workerd | NO (draft) |
| REQ-112 | abandoned | 2026-07-31 | (untitled) | NO |

**Status note.** `free_coded` does not appear in the prompt's status table. It sits
one step *earlier* than `ready_to_reconcile` in the free-coding lifecycle: the code
has landed on `xgd-working`, but the reconcile that writes the matrix has not run.
Absence from the matrix is therefore the expected state for a `free_coded` intent,
not drift — treating it otherwise would fail every capability with in-flight work.
REQ-142 and REQ-144 are recorded as ledger entries and forward-looking notes rather
than as findings. Neither retires nor contradicts any behaviour CAP-82 currently
claims, so no `needs_review` arises from the gap in the table.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-94 (`story-5349d01f`, upgrade, uat_coverage=pass) — Ship a site off the laptop | REQ-110, BUG-31 | aligned |
| STORY-95 (`story-d34eccd8`, upgrade, uat_coverage=pass) — Serve a deployed snapshot | REQ-111, BUG-31 | aligned (one forward-looking note, finding 1) |
| STORY-96 (`story-66115f6b`, feature, uat_coverage=pass) — Clean page URLs | REQ-113 (incl. the 2026-07-30 scope extension) | aligned |

### Consistency — verified claim by claim

**STORY-94 → REQ-110 + BUG-31.** Every in-scope bullet maps to an intent ask:
two channels, render-always, `out/` + `source/` as a complete DOC-12 revision,
content addressing with no-op redeploy, previews-are-not-revisions,
publish-mints/deploy-ships refusal on empty history, dry-run, prune-the-orphans,
stage-per-line report (all REQ-110); store-tree scoping of every key, per-tree
deploy index, root-scoped prune, and the null-URL/"not publicly reachable" report
terminator (all BUG-31). Nothing in the body lacks intent support.

The three recorded divergences are all *honest* — each is stated in the story as a
divergence rather than asserted as the intent:
- Conditional write. REQ-110 specified an `onlyIf` etag CAS; the story's Technical
  Context records that the chosen upload mechanism cannot do that, so the
  implementation re-reads and compares, narrowing rather than closing the race. The
  property the intent asked for (a lost update fails loudly) is preserved and the
  in-scope bullet states only that property.
- Preview privacy is unguessable-by-URL, not access-controlled — carried verbatim
  from REQ-110's stated v1 trade-off.
- BUG-31's resolution choice (namespace, do not refuse) is recorded together with
  the alternative that was rejected and the conditions for revisiting it. This
  matches BUG-31's own "Resolved: option (b)" section.

**STORY-95 → REQ-111 + BUG-31.** Two addressing forms; `SERVABLE_ROOT` as a
server property never derived from a request; the deploy index as the authority on
what is servable (so an orphan is unreachable rather than quietly live); grammar
rejects before it reads; the trailing-slash 301 as correctness; noindex on every
preview-channel response; opaque 404 with no unknown-vs-unpublished distinction;
read-only surface (GET/HEAD served, everything else 405 with `Allow`); content
type from the served object's own extension with charset on text formats and
octet-stream for unknown; immutable caching on snapshot addresses vs short TTL on
published, warm cache, 404s never retained; reserved first segment refused at
deploy time. Every one traces to REQ-111's spec table, its "Decisions taken during
implementation", or its "Beyond the stated scope" list, or to BUG-31.

Out-of-scope statements match REQ-111's non-goals exactly (no auth, apex held to a
holding response, no custom domains, no subdomain routing, no D1). The DOC-12
preview-privacy wording amendment REQ-111 called for is recorded as done and the
divergence closed.

Spot-verified against code, since the story states it as a construction guarantee
rather than a check: `SERVABLE_ROOT = 'sites'` is a named constant at
`apps/public-site/src/site-store.ts:50`, consumed at lines 54/99/103 and derived
from nothing in the request. The story's claim holds.

**STORY-96 → REQ-113.** The mapping in both environments and both channels for GET
and HEAD (AC1/AC5); exact matches win (AC2/AC7); only the last segment is examined
for an extension, so `v1.2/page` stays eligible while a missing `.svg` still 404s
(AC3/AC7); response typed from the page that answered (AC6); trailing slash never
eligible on the deployed site, with the document-relative-asset reason REQ-109
established (AC8); preview-server confinement and Worker grammar guards unloosened
(AC4/AC9).

The corrected-intent handling is the notable case and it is handled correctly. The
story does **not** repeat REQ-113's false premise ("Cloudflare Pages serves
`.html` at the clean URL"); it records the premise as false, states the actual
inverse state, and explains that the intent's goal was reached only when the
production half changed too. That is exactly the shape the level-story check wants:
retired reasoning does not survive in the matrix.

Spot-verified: the story's claim that "a stale in-code comment still cites the
original premise" is accurate — `tools/generate/src/cli/serve.ts:85` still reads
"…and Cloudflare Pages serves that at `/<slug>`". The story correctly classifies
this as documentation drift rather than behaviour, so it is not a matrix defect.

### Coverage — every reconciled ask is expressed

BUG-31's five acceptance UATs distribute cleanly across the tree with none orphaned:
namespaced keys / null URL / not-publicly-reachable report → STORY-94; cannot
overwrite a real published revision → STORY-94; separate manifests per root →
STORY-94; the Worker never serves the sandbox root → STORY-95; prune scoped to root
→ STORY-94.

REQ-111's "Beyond the stated scope" additions are all expressed: HEAD and the 405
under "a read-only surface"; the bare published form `/site/<slug>` redirecting on
the same rule as the draft form, under the generic trailing-slash bullet.

REQ-109 and BUG-30 are *not* gaps in this capability. Both are owned by STORY-83
(`story-d0a8cfad`, `capability_uid: capability-ae9d65d6` = CAP-70 Framework
Substrate), whose body carries a "Where the output lands — a relocatable snapshot"
section and names "REQ-109 / BUG-30 — relocatable emission (this reconciliation)"
explicitly. The three delivery stories reference it as a dependency rather than
claiming it, which is the correct allocation: relocatable emission is a renderer
property that delivery consumes.

Both outward cross-references resolve to live tickets with matching subject matter:
STORY-79 (`story-e15a19ef`, "1c CLI: flags parse correctly … `--json` emits a clean
scriptable document") for STORY-94's deferral of machine-readable output hygiene,
and STORY-83 as above. No dangling reference.

### Exclusivity — a clean three-way split

The tree partitions delivery along seams each story states and each of the others
honours, so there is no overlapping intent:

- STORY-94 is the operator half (shipping); it explicitly disclaims serving, the
  URL-level confinement to the servable tree, and the reserved-segment refusal.
- STORY-95 is the visitor half (serving); it explicitly disclaims the clean-URL
  agreement.
- STORY-96 is the two-environment agreement; it explicitly disclaims the deployed
  site's grammar, addressing, caching and privacy.

The one apparent duplication is not one. The trailing slash appears in both
STORY-95 and STORY-96, but as two different behaviours sharing one rationale:
STORY-95 owns the 301 from the bare snapshot root, STORY-96 owns the mapping's
ineligibility for directory-shaped URLs. STORY-96 references STORY-95's redirect as
the precedent rather than restating it as its own behaviour.

The reserved-segment refusal is enforced in `cmdDeploy` but assigned to STORY-95,
not STORY-94. Deliberate and correctly disclaimed by STORY-94: the constraint
exists only because the serving route grammar reserves the segment, so the story
that owns the grammar owns the refusal it implies.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-95 | — | REQ-144 (`free_coded`, 2026-08-15) shipped `bin/smoke`, whose nine live-origin checks assert exactly STORY-95's serving behaviour (apex resolves, trailing-slash 301, draft `cache-control`/`x-robots-tag`, referenced assets 200 with correct content type, unknown-vs-unpublished 404 indistinguishable), and records it passing against live `https://1stcontact.io`. STORY-95's Technical Context still says "the end-to-end smoke check against a live bucket … were never run in session". True as of the reconciled intent set; stale the moment REQ-144 reconciles. | None now — REQ-144 is pre-reconciliation. At REQ-144's reconcile: update STORY-95's carried-forward-uncertainty note, and decide whether the smoke script's own behaviour lands in CAP-82 ("operator legibility of a delivery") or in a deployment-ops capability. `bin/build`/`bin/deploy` deploy Worker code rather than site snapshots and read as out of CAP-82 scope; `bin/smoke` is the genuinely arguable half. |
| 2 | info | coverage | capability-a12e557f | — | REQ-142 (`free_coded`, 2026-08-15) introduces an async `SiteStore` port. Despite the name collision with STORY-95's Worker-side `SiteStore` seam, it is the **authoring** store (`tools/generate/src/store/`, `FsSiteStore`, `edit.ts`), which the capability body puts out of scope by name: "the canonical site store (delivery moves serving, not storing)". | None. Recorded so a future check does not read the name collision as a delivery gap. |
| 3 | info | coverage | STORY-95 | — | REQ-143 (`draft`) moves site definitions to D1 and bytes to R2. STORY-95's Technical Context already anticipates this: the store seam is internal, the ACs are observable at the HTTP boundary, and `SERVABLE_ROOT` is an AC precisely so the guarantee survives the store's replacement. | None (draft does not count). Flag: when REQ-143 reconciles, the `SERVABLE_ROOT`-restatement AC is the criterion most at risk and should be re-checked first. |
| 4 | info | — | capability-a12e557f | — | REQ-141 (`ready_to_reconcile`, imminent) adds a workerd vitest project binding the real `SITES` R2 bucket. Test infrastructure; a `test_infrastructure` story is task-like and carries no ACs, so no CAP-82 matrix element is owed. It does supply the harness that could later close STORY-95's faked-binding caveat. | None. |
| 5 | info | consistency | STORY-96 | — | The story's claim of a surviving stale in-code comment is accurate (`tools/generate/src/cli/serve.ts:85` still cites the false Cloudflare Pages premise). Correctly classified in the story as documentation drift, not behaviour. | None — matrix is right. A comment-only fix is a code task, outside this read-only check. |
| 6 | info | — | capability-a12e557f | — | The capability ticket carries no `fields.intent_uid`. Checked CAP-70 as a control: also absent. Store-wide convention, not drift on this capability. | None. |

## Notes for the Editor

**Nothing to repair at story level.** All three bodies are aligned to the reconciled
intent set, and the capability's `uat_coverage` is already `pass` on the capability
and on each story.

Three cross-cutting observations worth carrying forward:

1. **This capability handles corrected intent unusually well, and that is worth
   preserving.** Three separate intents landed with a premise or a spec that turned
   out to be wrong — REQ-113's non-existent Cloudflare Pages, REQ-110's
   unimplementable etag CAS, REQ-110/DOC-12's root-flattened key layout (BUG-31).
   In each case the story body records the *corrected* position and names the
   original as superseded, rather than either silently absorbing the correction or
   leaving the stale claim standing. Any downstream edit should keep that shape.

2. **The in-flight tail is the thing to watch, not the current state.** Seven
   2026-08-15 intents (REQ-141 through REQ-148) are converging on moving the store
   and the builder into Cloudflare. Two are already `free_coded` and five are
   `draft`. The next story-level check on this capability will run against a
   materially larger ledger; the entries above exist so that check can see what was
   known now.

3. **`free_coded` is a hole in the status table.** It appears in neither the YES,
   the imminent, nor the NO bucket, and two intents in this ledger sit in it. The
   reading applied here — pre-reconciliation, so matrix absence is expected, record
   in the ledger and do not fail the level — is the only one consistent with the
   free-coding lifecycle, but the table should be amended to say so explicitly
   rather than leaving each assessor to derive it.

### Verification performed

Read-only throughout; no ticket, test or source file was modified.

- Ticket reads: capability-a12e557f; stories `story-5349d01f`, `story-d34eccd8`,
  `story-66115f6b`, plus `story-d0a8cfad` (STORY-83) and `story-e15a19ef`
  (STORY-79) as cross-reference checks; bundles `bundle-e0143ffa`,
  `bundle-0385746c` in full (both bodies carry their source intents inline);
  REQ-141, REQ-142, REQ-144 in full; capability-ae9d65d6 as a field-convention
  control.
- Sweeps: all 139 `request` tickets and all `bug` tickets, to find intents touching
  delivery outside the two bundles named on the stories.
- Code spot-checks, to test two story claims stated as construction guarantees:
  `SERVABLE_ROOT` (`apps/public-site/src/site-store.ts:50`) and the stale premise
  comment (`tools/generate/src/cli/serve.ts:85`). Both confirm the story text.
