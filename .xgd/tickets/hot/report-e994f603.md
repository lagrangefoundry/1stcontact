---
uid: report-e994f603
id: REPORT-3759
type: report
title: 'Capability-Intent Alignment: Site Delivery: Deploy & Public Serving (level=story)'
created_by: xgd
created_at: '2026-09-10T16:19:03.550516+00:00'
updated_at: '2026-09-10T16:19:03.550516+00:00'
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

Anchor report: report-e37a6b4a. Capability: capability-a12e557f (CAP-82).
Previous attempts: 6.

**What changed since REPORT-3757 (attempt 6's input).** That report's three
violations and one warning all landed on a single element — CAP-82's own body,
the one element BUNDLE-20's 2026-08-31 reconciliation never reached. Attempt 6
(REPORT-3758, `report-7877bc03`) applied them as one rewrite. **All four are
verified closed against the live ticket, not taken from the fix report's word**:
`capability-a12e557f` now carries `updated_at: 2026-09-10T16:14:22Z` with
`last_field_updated: body`, and the repaired text is present.

The capability's story tree is now aligned to cumulative intent at every element.
Nothing new was found this pass, and no finding from any earlier attempt in this
chain remains open.

## Cumulative Intent Considered

CAP-82 carries no `fields.intent_uid` (the norm for capability tickets in this
store). The chain is built from the story tree: all three stories carry
`intent_uid: bundle-e0143ffa` (BUNDLE-13, `free_and_reconciled`); STORY-94 and
STORY-95 additionally carry `updated_by: bundle-b3b7c399` (BUNDLE-20,
`free_and_reconciled`). The ledger was re-swept this pass across every `request`
(50) and `bug` (39) ticket in the store for delivery asks landing after
BUNDLE-20: **there are none**. Everything reconciled since 2026-08-31 (REQ-162)
or drafted since (REQ-155…REQ-166) is capture/KB/library work with no delivery
behaviour.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-109 | free_and_reconciled | 2026-07-30 | Rendered output relocatable: document-relative asset URLs | YES — owned by STORY-83 (CAP-70); a delivery *precondition*, correctly not duplicated here |
| REQ-110 | free_and_reconciled | 2026-07-30 | R2 artifact store + `1c deploy`: content-addressed snapshots, shareable preview snapshots, per-site `manifest.json`, `--dry-run`, `--prune` | YES — **largely retired by REQ-149**; was the source of attempts 5–6's findings |
| REQ-111 | free_and_reconciled | 2026-07-30 | `public-site` Worker: route grammar, SiteStore seam, trailing-slash 301, content types, cache policy, opaque 404, reserved `draft` segment | YES → STORY-95 |
| REQ-113 | free_and_reconciled | 2026-07-31 | `1c serve` extensionless → `.html`, plus the 2026-07-30 scope extension adding the Worker half | YES → STORY-96 |
| BUG-30 | free_and_reconciled | 2026-07-31 | `relativizeUrl` same-page anchor defect | YES — owned by STORY-83 (CAP-70) |
| BUG-31 | free_and_reconciled | 2026-07-31 | `--sandbox` writes into a real site's R2 keyspace; `SERVABLE_ROOT` | YES (**retired** by REQ-149 — no writer left; STORY-95 records this) |
| REQ-141 | free_and_reconciled | 2026-08-15 | workerd vitest project, real D1/R2 bindings | YES — test infrastructure, no CAP-82 behaviour |
| REQ-142 | free_and_reconciled | 2026-08-15 | Async SiteStore port, filesystem behind it | YES — the port publish sequences over |
| REQ-143 | free_and_reconciled | 2026-08-15 | Cloudflare SiteStore: definitions in D1, bytes in R2 | YES — the canonical store; out of CAP-82's scope, and the capability's out-of-scope *reason* now reflects it |
| REQ-145 | free_and_reconciled | 2026-08-15 | control-app becomes the builder in workerd | YES — contributes D4's `/preview/<slug>/published` redirect → STORY-95 |
| REQ-147 | free_and_reconciled | 2026-08-17 | Cloudflare Access on the builder | YES — supports the capability's "the builder's own draft preview … is behind access control" |
| **REQ-149** | **free_and_reconciled** | **2026-08-17 (BUNDLE-20)** | **Publish in the cloud.** D1 no-op, D2 slug claim, D3 schema, D4 published-view redirect, D5 manifest deleted / live = `MAX(id)`, **D6 `1c deploy` deleted**, **D7 sha-addressed draft snapshots dropped "not ported"**; AC-1…AC-9 | **YES — the retiring intent this chain turns on** |
| REQ-150…REQ-153 | free_and_reconciled | 2026-08-18…08-20 | Vite SSR launcher; locale identity; money/time; reserved locale-shaped slugs | YES — none carries a delivery-addressing ask (REQ-153's guard is authoring-time `pageSchema.slug` validation) |
| REQ-162 | free_and_reconciled | 2026-08-31 | Product ticket store: D1 schema, TypePack | YES — no delivery ask |
| REQ-154 | bundled | 2026-08-20 | Browser Rendering driver behind the capture seam | imminent — capture, no delivery ask |
| REQ-155…REQ-161, REQ-163…REQ-166 | draft | 2026-08-20…08-31 | capture / KB / library work | NO (draft) |
| BUG-36…BUG-38 | free_and_reconciled | 2026-08-23…08-24 | control-app 503 / Edit-mode 1102 / chat turn failures | YES, but builder-surface defects — no CAP-82 behaviour |
| BUG-39 | bundled | 2026-08-24 | Node chat-host UAT doubles | imminent — no delivery ask |
| REQ-112 | abandoned | 2026-07-31 | — | NO |

**Current cumulative intent**: one addressing form, revision-numbered, published
from wherever the site's store is — cloud or filesystem — with the content digest
surviving only as an audit value, and the local preview server and the deployed
site agreeing on the URL an author writes.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| **CAP-82** (`capability-a12e557f`) — capability body | REQ-110/REQ-111 (BUNDLE-13) as **revised by REQ-143 + REQ-149** | **aligned — REPORT-3757's findings 1–4 all closed.** Verified in the live body (see the claim-by-claim check below), not taken from REPORT-3758 |
| STORY-94 (`story-5349d01f`, upgrade, uat_coverage=pass) — Publish a site to shared storage | REQ-110 (retired parts, recorded), BUG-31 (retired), REQ-142, REQ-143, **REQ-149 D1–D3, D6, D7** | aligned — every REQ-149 AC has a home: AC-1 → "No filesystem on the cloud path"; AC-3 → "An unchanged draft mints nothing"; AC-4 → "History is readable and forward-only"; AC-5 → "Validate first, write nothing on failure"; AC-6/AC-7 → "One publish, two front doors"; AC-8 → "A published address belongs to whoever claimed it first". Three dated reconciliation decisions carried |
| STORY-95 (`story-d34eccd8`, upgrade, uat_coverage=pass) — Serve a published site | REQ-111, BUG-31 (retired), REQ-145, **REQ-149 D4, D5, D7, AC-2, AC-9** | aligned — "One addressing form, one server", "Live is derived, never stored" (AC-9), record-authority, published-view redirect (D4), grammar rejections, trailing-slash redirect, content typing, read-only surface, freshness, no crawler directive. Three dated reconciliation decisions carried |
| STORY-96 (`story-66115f6b`, feature, uat_coverage=pass) — Clean page URLs | REQ-113 (incl. its 2026-07-30 scope extension), **REQ-149 D7 (recorded)** | aligned — closed at attempt 5 and re-verified here against the live body and against `apps/public-site/src/routes.ts` |

### Consistency — CAP-82's body, claim by claim

Each of REPORT-3757's four findings re-checked against the current body:

1. **Finding 2 (bullet 1, content-addressed identity) — closed.** The bullet now
   reads "naming it by the revision number it was minted as … The content digest
   a revision carries is an audit value, not an address", which is STORY-94's own
   formulation and matches REQ-149's schema comment (`sha TEXT, -- audit, not
   addressing`).
2. **Finding 1 (bullet 2, the shareable preview channel) — closed.** The bullet
   now names the split that survives: "the site's mutable draft, which the builder
   renders on request, versus the immutable numbered revisions it publishes". It
   no longer contradicts STORY-95's "There is no second addressing form".
3. **Finding 3 (out-of-scope reason) — closed.** Now "a site's definitions stay
   canonical in whichever store holds it, the operator's filesystem or the cloud
   store, and delivery never becomes that store". The exclusion is kept; the false
   local-only reason REQ-143/REQ-149 AC-1 invalidated is gone.
4. **Finding 4 (opening framing) — closed.** "Getting a rendered site **out of the
   store it was authored in** and in front of a visitor"; "Every other capability
   … stops at rendered **output**"; "anyone who is **not the author**"; the path
   runs from "**the site has been rendered**". No local-origin premise remains.
5. **Finding 7's guidance (bullet 5) — applied.** Operator legibility is now
   anchored to the forward-only guarantee ("a revision is never removed,
   renumbered or reused") rather than to `--dry-run` / `--prune`.

**Term sweep of the live capability body** for retired-premise vocabulary:
`naming it by its contents` 0, `operator's machine` 0, `operator's laptop` 0,
`on disk` 0, `locally` 0, `--dry-run`/`dry-run` 0, `manifest` 0. `shareable`,
`dry run`, `prune`, `digest`, `index` and `sha` hit **only inside the new "What
was retired, and why it was recorded rather than ported" section**, which is the
house style STORY-94 ("What was removed, and why it was removed rather than
ported") and STORY-96 ("A second addressing form was retired, recorded rather
than absorbed") already use. Each retirement names its retiring decision (D6, D7,
D6), and each matches REQ-149's text: D6 deletes `1c deploy` and the per-site
index; D7 drops the sha-addressed links "not ported" while leaving the builder's
Access-gated `/preview/<slug>/draft/` untouched; `--prune` "has no home" with
orphaned bytes unreachable and costing only storage.

### Coverage

Every REQ-149 acceptance criterion and decision has exactly one home in the tree
(mapped in the ledger above). REQ-111's serving surface and REQ-113's mapping are
each fully expressed by one story. REQ-111's reserved `draft` segment was
un-reserved by D7, and STORY-95 states the consequence explicitly ("The segment
the preview channel reserved inside a site is therefore an ordinary segment
again"). No reconciled intent's delivery behaviour is unexpressed, and no retired
behaviour is asserted as live anywhere in the tree.

### Exclusivity

The three stories partition delivery cleanly and each states the partition in its
own body: STORY-94 the operator half, STORY-95 the visitor half, STORY-96 the
preview/production URL agreement. The two places they touch the same subject are
complementary rather than duplicate — the slug claim (STORY-94 refuses the
*write*, STORY-95 resolves the *read*) and the trailing slash (STORY-95 owns the
site-root redirect, STORY-96 owns the html-fallback eligibility exclusion). The
capability body no longer competes with any of them.

### Step 2.5 — implementation check

No finding this pass, and nothing classified `needs_review`. Tier 3 was applied
anyway to confirm the repaired capability text describes the code that exists:

- `tools/generate/src/deploy/` **does not exist**; `tools/generate/src/publish/`
  (`index.ts`, `publish.ts`) is the only publish path — REQ-149 D6 as landed.
- `apps/public-site/src/routes.ts:112-141` (`parseRoute`) admits exactly `apex`,
  `redirect`, `asset`, `not-found`; there is no draft/sha branch, and
  `routes.ts:13-22` documents the deletion and that `draft` is an ordinary
  segment again — REQ-149 D7 as landed.
- No `manifest.json` read survives: the only reference in `apps/public-site/src`
  is the historical seam comment at `site-store.ts:10` — REQ-149 D5/AC-9.
- `apps/control-app/src/router.ts:579-593` redirects the `published` channel to
  `public-site` citing REQ-149 D4, and `router.ts:640` refuses a slug another
  account owns citing D2 — the two builder-side behaviours STORY-95 and STORY-94
  claim.
- `routes.ts:135-138` maps only the *site root* to `index.html`, confirming
  STORY-96's directory-index asymmetry note is still accurate.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | CAP-82 (`capability-a12e557f`) | — | REPORT-3757 findings 1–4 (three violations + one warning) verified closed in the live body at `updated_at: 2026-09-10T16:14:22Z`. Retirements recorded in the house style, each citing REQ-149 D6/D7 | none |
| 2 | info | coverage | STORY-94 + STORY-95 + STORY-96 | — | All nine REQ-149 ACs, its seven decisions, REQ-111's serving surface and REQ-113's mapping map one-to-one onto the tree; no post-BUNDLE-20 intent adds a delivery ask (50 requests + 39 bugs swept) | none |
| 3 | info | exclusivity | STORY-94 + STORY-95 + STORY-96 | — | The two shared subjects (slug claim, trailing slash) are complementary halves, each cross-referenced by the other story | none |
| 4 | info | — | STORY-96 (`story-66115f6b`) | — | Provenance nit carried from REPORT-3757: the body records REQ-149 D7's retirement but `fields.updated_by` is still unset (BUNDLE-20 never touched this ticket; attempt 5 edited the body only). The field is a scalar and setting it would displace nothing useful. Recorded, not a finding | none |
| 5 | info | — | `tools/generate/src/cli/serve.ts:71-75` | — | The in-code comment still cites the false "Cloudflare Pages serves that at `/<slug>`" premise. Re-verified present this pass. STORY-96 already documents it as documentation drift, so the matrix is accurate; this is a one-line code-comment cleanup, not matrix drift | none |

## Notes for the Editor

**Nothing to edit.** This level passes with no violations, no warnings and no
escalations. The six-attempt chain resolved a single root cause working
outward — BUNDLE-20's 2026-08-31 reconciliation rewrote STORY-94 and STORY-95 but
never reached STORY-96 (repaired at attempt 5) or the capability body they hang
under (repaired at attempt 6). Both are now consistent with the one-channel,
revision-numbered world REQ-149 established, and with the code.

**The one loose thread is outside this scope path.** `serve.ts:71-75`'s stale
premise comment has now survived three alignment cycles. It is correctly
documented as drift inside STORY-96, so it cannot fail an alignment check — but a
one-line comment edit would let that paragraph come out of the story body
entirely. Worth an operator's minute, not a fix-loop iteration.

**Carried-forward uncertainty, unchanged and not a finding.** STORY-95 records
that the end-to-end check against a live R2 bucket and apex custom-domain
provisioning have never been run in session. That is an honest limit stated in
the story, not drift between matrix and intent, and it bears on evidence rather
than alignment.

**Verification performed this pass**: capability body and all three story bodies
read in full at their current revisions; term sweep of the capability body for
retired-premise vocabulary; REQ-149 read in full (D1–D7, schema, scope,
AC-1…AC-9, out-of-scope); REPORT-3757 and REPORT-3758 read in full and their
claims independently re-checked; `request` (50) and `bug` (39) ticket sweeps for
post-BUNDLE-20 delivery asks; code checks against
`apps/public-site/src/routes.ts`, `apps/public-site/src/site-store.ts`,
`apps/control-app/src/router.ts`, `tools/generate/src/cli/serve.ts`,
`tools/generate/src/publish/`, and the absence of `tools/generate/src/deploy/`.
