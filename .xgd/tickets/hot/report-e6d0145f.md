---
uid: report-e6d0145f
id: REPORT-3760
type: report
title: 'Capability-Intent Alignment: Site Delivery: Deploy & Public Serving (level=ac)'
created_by: xgd
created_at: '2026-09-10T16:27:51.427524+00:00'
updated_at: '2026-09-10T16:27:51.427524+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a12e557f
  level: ac
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Delivery: Deploy & Public Serving
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

## Scope note — why this pass matters more than its predecessors

This is the **first ac-level check to run since BUNDLE-20's 2026-08-31
reconciliation**. The previous ac-level checks were REPORT-1636/1638 (2026-08-07),
REPORT-1734 (2026-08-09) and REPORT-2085 (2026-08-16) — all before REQ-149's
reconciliation rewrote STORY-94 and STORY-95, created seven new ACs
(AC-1418…AC-1424) and rewrote every pre-existing STORY-95 AC. Those seven ACs have
**never been ac-validated before this pass**. Attempt 5 (REPORT-3757) swept
STORY-96's ACs at story level; STORY-94's and STORY-95's ACs had not been swept
since 2026-08-16.

All 28 ACs were read in full at their current revision for this pass.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-13 (`bundle-e0143ffa`) — REQ-108 + REQ-109 + **REQ-110** + **REQ-111** + **REQ-113** + 1 | free_and_reconciled | 2026-08-06, merged `1ee6aaf2` | Originating intent for all three stories: REQ-110 the operator-side content-addressed deploy, REQ-111 the multi-tenant serving surface, REQ-113 the extensionless→`.html` mapping | YES |
| REQ-142 (`request-0dd62a5d`) | free_and_reconciled | 2026-08-15 | Async SiteStore port with the filesystem behind it — the seam publish/serve run through | YES |
| REQ-143 (`request-18a48d63`) | free_and_reconciled | 2026-08-15 | The Cloudflare SiteStore: definitions in D1, bytes in R2 | YES |
| REQ-145 (`request-b474390f`) | free_and_reconciled | 2026-08-15 | control-app becomes the builder — hosts the publish route and the published-view redirect | YES |
| **REQ-149** (`request-554ac441`) | free_and_reconciled | 2026-08-17 | **The decisive one.** Publish moves into the platform: D5 deletes the per-site index, D6 deletes `1c deploy` and content-addressed snapshot identity, D7 drops the sha-addressed shareable draft channel "not ported". Revisions are named by number | YES |
| BUNDLE-20 (`bundle-b3b7c399`) — REQ-147 + REQ-143 + REQ-145 + REQ-146 + REQ-148 + 5 (incl. REQ-149) | free_and_reconciled | 2026-08-24 → completed 2026-08-31, merged `eef7a8b4` | The reconciliation vehicle: rewrote STORY-94/95 bodies, created AC-1418…AC-1424, rewrote AC-892/894/903–913 | YES |

Story-level provenance: all three stories carry `intent_uid = bundle-e0143ffa`;
STORY-94 and STORY-95 carry `updated_by = bundle-b3b7c399`. STORY-96 does not
(recorded as a provenance nit in REPORT-3759 finding 4; not re-raised).

**Level cascade honoured.** Story level passed at REPORT-3759 (2026-09-10 16:19,
0 violations / 0 warnings), so the three story bodies are the working reference
here. Intent history was consulted only for the two findings below and for the
retired-vocabulary sweep; no upper-layer element was found internally
inconsistent.

## Alignment Ledger

### STORY-94 (`story-5349d01f`, upgrade) — 7 ACs. Behavioural surface fully covered.

| Story-body claim | AC | Outcome |
|---|---|---|
| One publish, two front doors; no second handler; deploy command gone | AC-1418 | aligned |
| No filesystem on the cloud path | AC-1418 | aligned |
| Validate first, write nothing on failure | AC-1420 | aligned |
| An unchanged draft mints nothing (+ recon. decision 2: reported distinctly) | AC-1419 | aligned |
| The artifact is complete (+ recon. decision 3: assets in both halves; recon. decision 1: local output dir refreshed, location reported) | AC-892 | aligned |
| History readable, lineage/message/author/change-list/audit digest, checkout re-parents, forward-only | AC-1421 | aligned |
| A published address belongs to whoever claimed it first | AC-1422 | aligned |
| (No stale bytes — publish renders from the freshly frozen draft) | AC-894 | aligned; derived from "minting… freezing… rendering" in the body rather than stated as its own bullet, but it is a sound derivation and carries recon. decision 1's filesystem-store half in its verification |

### STORY-95 (`story-d34eccd8`, upgrade) — 12 ACs. One in-scope consequence unpinned (warning 1); one duplicated criterion (warning 2).

| Story-body claim | AC | Outcome |
|---|---|---|
| One addressing form, one server; URL names the site only | AC-903 | aligned |
| …*and the segment the preview channel reserved is an ordinary segment again* | **none** | **gap — see finding 1** |
| The revision record is the authority (+ recon. decisions 1 & 2) | AC-905 | aligned |
| Live is derived, never stored | AC-1423, AC-903 | aligned, but the two overlap — **see finding 2** |
| A published address is global, and claimed | AC-903 (¶3), AC-906 | aligned |
| The address grammar rejects before it reads | AC-907 | aligned |
| The trailing slash is correctness, not tidiness | AC-904 | aligned |
| Published bytes have exactly one serving path (builder redirects here) | AC-1424 | aligned |
| Honest, opaque failure | AC-906 | aligned |
| A read-only surface | AC-912 | aligned |
| Responses are typed from what answered them | AC-908 | aligned |
| Freshness policy + a cache that follows it (+ recon. decision 3: no crawler directive) | AC-909, AC-911 | aligned; complementary (headers vs store-read behaviour), not duplicate |
| (Apex held back to a holding response — stated in the out-of-scope parenthetical) | AC-913 | aligned — see info 3 |

### STORY-96 (`story-66115f6b`, feature) — 9 ACs. Behavioural surface fully covered.

| Story-body claim | AC | Outcome |
|---|---|---|
| The mapping, in local preview | AC-915 | aligned |
| The mapping, on the deployed site, full and header-only | AC-916 | aligned (body edited 2026-09-10 to "under the published site URL" — the second addressing form is gone from the text) |
| The mapping, header-only in local preview | AC-920 | aligned (AC-920 carries the preview-HEAD case) |
| Exact matches always win (incl. the preview directory-index asymmetry) | AC-917 | aligned |
| Extensions are never eligible; only the last segment is examined | AC-918 | aligned (body edited 2026-09-10) |
| Typed from the page that answered | AC-920 | aligned (body edited 2026-09-10) |
| A directory-shaped URL is never eligible on the deployed site | AC-921 | aligned (title edited 2026-09-10) |
| No existing guard is loosened — preview confinement | AC-922 | aligned |
| No existing guard is loosened — deployed grammar | AC-923 | aligned |
| (The mapping never invents a page) | AC-919 | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | STORY-95 (`story-d34eccd8`), In-scope bullet 1 | ac-add | The story states as in-scope that "the segment the preview channel reserved inside a site is therefore an ordinary segment again — **a published site may hold a top-level page of that name, because nothing shadows it**". No AC under STORY-95 pins this, and no UAT asserts it (the 12 delivery UATs were enumerated; none exercises a `draft/` page). The behaviour is real and is stated verbatim in the code that delivers it — `apps/public-site/src/routes.ts:21-23`: "`draft` IS THEREFORE AN ORDINARY SEGMENT AGAIN. A published site may now contain a top-level `draft/` page, because nothing shadows it" — landing with **REQ-149 D7** (free_and_reconciled, 2026-08-17). Warning rather than violation because it is a *consequence* of a deletion, not a rule with its own code path: `parseRoute` (`routes.ts:112-141`) admits only `apex` / `redirect` / `asset` / `not-found`, so AC-903's one-addressing-form criterion and AC-905's key-composition guarantee already constrain the path that would have to change for it to regress | Optionally author one AC under STORY-95 pinning it: a published revision containing a top-level `draft/` page serves that page at `/site/<slug>/draft/…` like any other, with no route shadowing it. Contrast AC-1423, which *does* pin its REQ-149 removal consequence (the index object's absence) — this is the one removal consequence in the story left unpinned |
| 2 | warning | exclusivity | AC-903 (`acceptance_criterion-5312d7ac`) + AC-1423 (`acceptance_criterion-4690eca9`), both under STORY-95 | ac-edit | The two ACs state the same criterion in near-identical words and verify it with the same scenario. AC-903 ¶2: "Live is the highest revision in the site's log, derived on read… when the log is wound back, the same unchanged URL returns the earlier revision's content again, with every revision's bytes left untouched in storage. Nothing else is consulted, so nothing can disagree with the log." AC-1423: "derived on read as the highest revision in that log… appending a higher revision changes what is served… removing the highest revision returns the previous one to service. There is no second record that could disagree with the log." Both verifications publish a second revision, assert the URL serves it, wind the log back and assert the earlier revision is served with bytes untouched. Introduced together in BUNDLE-20's 2026-08-31 edit (AC-1423 created; AC-903 rewritten the same day), so this is reconciliation overlap, not historical drift. AC-1423's genuinely unique kernel is narrow: **the per-site index object does not exist after a publish**, and **no second write is made beyond the revision's own bytes** | Narrow AC-1423 to its unique kernel — there is no second record of live anywhere (the per-site index object is gone; a publish writes no live-pointer beside the bytes) — and let AC-903 keep sole ownership of "the published URL follows the log, including when it is wound back". Cross-reference rather than restate. Do not delete either AC: each has a distinct UAT (`test_UAT_AC903_a_published_url_serves_the_live_revision_whole`, `test_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes`) |
| 3 | info | consistency | All 28 ACs | — | Retired-premise vocabulary sweep run over every AC title + body (`deploy`, `snapshot`, `manifest`, `sha-`, `content-address`, `digest`, `draft preview`, `preview channel`, `shareable`, `Pages`, `immutable`, `index object`, `prune`, `dry run`, `operator's machine`, `on disk`, `1c `). Every hit is benign: "the deployed site" as a noun; "the separate content-addressed deploy command… no longer exists" and "no deploy command remains in the tool" (AC-1418, asserting absence); "the per-site index object… does not exist after a publish" (AC-1423, asserting absence); "never declared immutable" (AC-909, asserting absence); "web manifests" (AC-908, a MIME type). **No AC asserts retired behaviour as live** — there is no `ac-deprecate` work in this tree | none |
| 4 | info | coverage | All 28 ACs | — | Every AC has a correspondingly-numbered UAT. Enumerated from `tests/`: AC-892, 894, 903–913, 915–923, 1418–1424 all have a `test_UAT_AC<n>_*` function. No AC is orphaned at this level (substantive-evidence judgement belongs to the uat level, not asserted here) | none |
| 5 | info | — | AC-1418, AC-1419, AC-1420, AC-1421, AC-1422, AC-1423, AC-1424 | — | These seven carry no `uat_coverage` field, unlike the twenty-one older ACs which read `pass`. They were created 2026-08-31 by BUNDLE-20 and the last `uat_coverage_check` for this capability was REPORT-2087 (2026-08-16), which predates them. Recorded so the downstream uat-level and coverage stages know the field's absence is a *never-checked*, not a *failed*. The field is owned by check/fix_uat_coverage and is not touched here | none |
| 6 | info | exclusivity | AC-892 + AC-894 + AC-1418 (STORY-94) | — | Checked and found complementary, not duplicate. The overlaps are in *verification technique*, not in criterion: AC-1418's verification reads back both halves of the artifact (AC-892's criterion) as evidence that the publish completed; AC-894's verification asserts the local published-output directory was refreshed (AC-892's closing paragraph) as evidence the render was fresh. Each AC's criterion sentence is distinct — minting/two-front-doors, both-halves-stored, never-stale | none |
| 7 | info | exclusivity | AC-1419 + AC-1421 (STORY-94) | — | AC-1419's closing paragraph ("a draft checked out from an earlier revision differs from live… publishing it mints a new highest revision as normal") restates AC-1421's forward-only claim and repeats its checkout-then-publish verification step. Judged acceptable rather than duplicate: AC-1419 is proving the *interaction* — that the no-op rule does not swallow a legitimate post-checkout publish — which is a boundary its own criterion needs and AC-1421 does not assert | none |
| 8 | info | consistency | AC-913 (`acceptance_criterion-08d88be5`) | — | STORY-95 lists "the apex marketing site" under **Out of scope**, while AC-913 pins apex behaviour. Not a contradiction: what the story excludes is building the marketing site; the parenthetical in the same sentence explicitly reserves the current behaviour ("the apex is deliberately held back to a holding response"), and AC-913's load-bearing half — the apex "serves no published site's content under any circumstances" — is an addressing rule squarely inside the story's serving scope | none |
| 9 | info | consistency | AC-1423 verification vs STORY-94's forward-only guarantee | — | AC-1423's verification instructs "Remove the highest revision from the log", which reads at a glance against STORY-94's "A revision is never removed, renumbered or reused". No repair needed: that is a test-harness manipulation used to demonstrate that live is *computed* rather than stored, explicitly framed as such in the AC, and the forward-only guarantee is a property of the publish path (STORY-94/AC-1421), not of what a test may do to a log. Recorded only so a future reader does not mistake it for a matrix self-contradiction | none |

## Notes for the Editor

**This level passes; neither warning blocks it.** Both are opportunistic repairs
inside STORY-95's AC set, and both are cheap. If only one is taken, take finding
2 — it is a pure text-narrowing edit with no new AC and no new UAT, and it makes
the two ACs legible as the distinct claims they were meant to be.

**Both warnings share one origin, and it is not drift.** BUNDLE-20's 2026-08-31
reconciliation rewrote STORY-94 and STORY-95 wholesale in a single pass: seven ACs
created, thirteen rewritten. Finding 1 is a claim that made it into a story body
without an AC; finding 2 is a claim that got an AC *and* stayed in the neighbouring
one. Both are the ordinary residue of a large reconciliation landing at once, not a
matrix falling out of step with intent — which is the thing this check exists to
catch, and which it did not find at this level.

**No `code-issue`, no `needs_review`, no `ac-deprecate`.** Every AC in the tree
describes the one-channel, revision-numbered world REQ-149 established, and the
implementation agrees with it everywhere it was checked. Nothing here implies a
production code change.

**Carried forward, still outside this scope path.** `tools/generate/src/cli/serve.ts:71-75`
still carries the in-code comment citing the false "Cloudflare Pages serves that at
`/<slug>`" premise. STORY-96 documents it as documentation drift, so it cannot fail
an alignment check — it has now survived four cycles, and a one-line comment edit
would let that paragraph come out of STORY-96's body entirely. An operator's minute,
not a fix-loop iteration.

**Verification performed this pass**: all 28 AC titles + bodies read in full at
their current revisions; per-AC `created_at` / `updated_at` / `last_field_updated`
pulled to establish which were touched by BUNDLE-20 (2026-08-31) and which by
attempt 5 (2026-09-10); every story-body in-scope bullet, out-of-scope clause and
Reconciliation Decision mapped to an AC or recorded as a gap; programmatic
retired-vocabulary sweep across all 28; the capability's full report history (23
reports) read to establish that no ac-level check has run since the reconciliation;
REPORT-3757 and REPORT-3759 read in full; the delivery UAT name index enumerated
from `tests/`; and code checks against `apps/public-site/src/routes.ts` (header
comment lines 1-23, the `Route` union, `SITE_SEGMENT`, `SLUG_PATTERN`).
