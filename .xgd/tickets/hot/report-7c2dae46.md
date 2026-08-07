---
uid: report-7c2dae46
id: REPORT-1635
type: report
title: 'Capability-Intent Alignment: Site Delivery: Deploy & Public Serving (level=story)'
created_by: xgd
created_at: '2026-08-07T21:45:37.466280+00:00'
updated_at: '2026-08-07T21:45:37.466280+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a12e557f
  level: story
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Delivery: Deploy & Public Serving
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 3
**Needs review**: 0

Anchor report: report-17a279f7. Capability: capability-a12e557f (CAP-82).
Attempt 2 — the prior cycle was report-ab9b224d (REPORT-1633, FAIL: 1 violation,
2 warnings) and its fix call report-d4a39a72 (REPORT-1634, 4 fixes applied).
Stories in scope: STORY-94 (story-5349d01f), STORY-95 (story-d34eccd8),
STORY-96 (story-66115f6b).

**The prior violation is closed and independently re-verified** (see finding 4).
All three prior fixes are present in the current bodies, worded from their ACs'
own criterion text, with no collateral rewriting. The three warnings below are
new — two surfaced by re-reading the amended bodies against the documents and
intents they now cite, one by widening the intent sweep to a reconciled intent
outside this capability that changed a fact the matrix asserts.

## Cumulative Intent Considered

All three stories carry `intent_uid: bundle-e0143ffa` (BUNDLE-13,
free_and_reconciled, main `1ee6aaf2`); STORY-94 and STORY-95 additionally carry
`updated_by: bundle-0385746c` (BUNDLE-14, free_and_reconciled, main
`cd8f98c8`). Both bundles were decomposed to their source intents and each was
read in full; the whole `request` (50) and `bug` (31) spaces were then swept by
title and by keyword for anything else landing on a delivery surface.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-110 | free_and_reconciled | 2026-07-30 | R2 artifact store + `1c deploy`: layout (`manifest.json` / `preview/<sha>` / `rev/NNNN`, `out/` **and** `source/`), render-first, 12-hex content-addressed id, previews-are-not-revisions, `--dry-run`, `--prune` (reporting each deletion), stage-labelled report terminating in the URL, published-requires-revision refusal naming `1c publish`, conditional manifest write | YES |
| REQ-111 | free_and_reconciled | 2026-07-30 | `public-site` Worker: route grammar (draft/published), trailing-slash 301, `SiteStore` seam, content-type by extension (unknown → octet-stream), immutable vs 60s TTL, `X-Robots-Tag` on every draft response, opaque 404 that never distinguishes unknown slug from unpublished, reserved `draft` segment gated at deploy time, apex holding response, Cache API on repeat hits, 404s deliberately uncached, `HEAD` served, `405 + Allow` | YES |
| REQ-113 | free_and_reconciled | 2026-07-31 | Extensionless → `.html` mapping. Original scope was the preview server only; the 2026-07-30 scope extension corrected a false premise (no Cloudflare Pages anywhere in the serving path) and added the production half as AC5–AC9 on the Worker, including the load-bearing trailing-slash exclusion | YES |
| BUG-31 | free_and_reconciled | 2026-07-31 | Namespace every stored key by store root; `--prune` scoped to root; `DeployResult.url` nullable + "not publicly reachable" report for the scratch root; `SERVABLE_ROOT = 'sites'` never derived from a request; CLI help; DOC-12 §7 mapping-table correction | YES |
| REQ-109 | free_and_reconciled | 2026-07-30 | Document-relative asset URLs (relocatable output). Hard dependency of all three stories; owned by STORY-83 in another capability | YES, out-of-capability — correctly referenced, not duplicated |
| BUG-30 | free_and_reconciled | 2026-07-31 | `relativizeUrl` same-page-anchor defect. Surfaced REQ-113's missing production half; the fix is the emitter's | YES, out-of-capability |
| REQ-115 | free_and_reconciled | 2026-07-31 | Builder shell. Factored `resolveStaticFile` out of `serve.ts` so the builder origin serves the rendered channels under the identical confinement / directory-index / extensionless rules. Builder origin is local authoring — out of this capability, represented by STORY-99 — **but it changes a fact STORY-96's body asserts** (finding 1) | YES for finding 1 only; otherwise NO |
| REQ-108, REQ-114, REQ-116 | free_and_reconciled | 2026-07-29…31 | L1 pointer accent / palette model / edit render. REQ-116 was read in full: the edit channel is "never published, never content-addressed, never enters `history.json`", and its AC8 pins published and draft-preview renders byte-identical. No delivery surface | NO (other capabilities) |
| REQ-117, REQ-118 | free_and_reconciled | 2026-07-31 | Copy editing / image selection. Touch `serve.ts` only through the builder origin | NO |
| BUG-32 | free_coded | 2026-08-05 | `WEBUI_SCOPE` rebrand `@gendevlabs` → `@lagrangefoundry`. Builder chrome and import maps only; read in full, no deploy or serving surface | NO (and not yet reconciled) |
| REQ-112 | draft | 2026-07-31 | Untitled, 12-char body | NO (not active) |
| REQ-119 | draft | 2026-07-31 | Would move draft/edit renders to request time inside control-app; explicitly leaves publishing and `public-site` unchanged | NO (not active) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-94 (Ship a site off the laptop) | REQ-110, BUG-31 | **aligned.** Every REQ-110 ask now has an in-scope bullet, including the published-requires-revision refusal added last cycle ("Publish mints, deploy ships"), which matches REQ-110's wording and AC-897. Every BUG-31 ask is present and correctly abstracted out of `--sandbox`/R2 vocabulary into "store tree". REQ-110's conditional-write divergence is disclosed in Technical Context rather than silently dropped. Its Out-of-scope list mirrors REQ-110's Non-goals one for one (no canonical-store move, no custom domains, no subdomain routing). |
| STORY-95 (Serve a deployed snapshot) | REQ-111, BUG-31 | **aligned, two body-completeness warnings.** Last cycle's violation is closed: the DOC-12 bullet now states the amendment landed, and that is true (finding 4) — though it cites the wrong section (finding 3). The three added in-scope bullets each match their AC's criterion text, including AC-908's uploader-metadata negative. Warning: the apex behaviour (AC-913) is supported only by a parenthetical inside the Out-of-scope paragraph (finding 2). |
| STORY-96 (Clean page URLs) | REQ-113 | **aligned, one stale enumeration.** Records REQ-113's *corrected* intent rather than its original false premise, and says so explicitly. AC-915…AC-923 map one-to-one onto REQ-113 AC1–AC9. Both residual-state claims re-verified true against the tree. Warning: "the two places a site is ever served from" was made false by REQ-115 (finding 1). |

Boundary discipline between the three stories remains explicit and
non-overlapping: STORY-94 disclaims the reserved-segment refusal and hands it to
STORY-95 (AC-914); STORY-95 disclaims the clean-URL agreement and hands it to
STORY-96; STORY-96 disclaims the route grammar and hands it back to STORY-95. No
exclusivity violations. The capability body's five scope bullets each land on
exactly one story: shipping → STORY-94; the draft/published split → STORY-94 +
STORY-95 across the operator/visitor line; serving → STORY-95; URL-resolution
agreement → STORY-96; operator legibility (report, refusals, deletions) →
STORY-94.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-96 (story-66115f6b), Description ¶3 | story-body-edit | The body frames the agreement as holding between "the two places a site is ever served from: the local preview command and the deployed public site". There are now **three** surfaces running that resolver. REQ-115 (free_and_reconciled, 2026-07-31) factored the confinement / directory-index / extensionless resolution out of the preview server into `resolveStaticFile` (`tools/generate/src/cli/serve.ts:68`) and the builder origin serves the rendered channels through it (`tools/generate/src/cli/builder.ts:11`, `:391`). The agreement itself is **not broken** — one implementation is precisely why REQ-115 unified it, and the builder origin is out of this capability (STORY-99) — but the enumeration is stale, and this story is where a future divergence must be re-settled, exactly as the story already says for the nesting asymmetry. | Reword to name the two environments the agreement is *about* rather than claiming they are the only ones, and add a sentence to Technical Context: a third surface (the builder origin, STORY-99) shares the same resolver by construction; should it ever diverge, this story is where that is re-settled. |
| 2 | warning | coverage | STORY-95 (story-d34eccd8), "In scope" / "Out of scope" | story-body-edit | AC-913 ("The apex address returns a holding response and never serves any site's snapshot") is an active AC asserting two behaviours: a plain text-typed holding response at the root, and a confinement guarantee that no deployed site's content is ever served there regardless of how many are published. The story body mentions the apex only inside the Out-of-scope sentence — "the apex marketing site (the apex is deliberately held back to a holding response)". The holding response is thus stated as an aside within an exclusion, and the confinement half appears nowhere at all. REQ-111 asked for both ("`/` may stay a holding response so nothing becomes public before the operator chooses"). Same shape as last cycle's findings 2 and 3, and the same level-cascade risk: an `ac`-level pass taking the body as its working reference may read AC-913 as covering out-of-scope behaviour and propose `ac-deprecate` against a correct AC. | Keep the *marketing site* out of scope, and add an in-scope bullet for the behaviour — e.g. "**The root address is not a site.** The apex returns a plain holding response and serves no deployed site's content under any addressing, so nothing becomes public there before the operator chooses to put something there." |
| 3 | warning | consistency | STORY-95 (story-d34eccd8), Technical Context, final bullet | story-body-edit | The bullet added by last cycle's fix cites "[[DOC-12]]'s preview-privacy wording was amended … (§2 principle 4, and the audience row in §7)". **§7 is "Cloudflare mapping"** — a Concept / File / Phase 1 / Phase 2 table with no audience row. The audience row is in **§6 "Rendering"** ("Audience | author, plus anyone holding the link (§5.1) | public"). §2 principle 4 is cited correctly. The claim's substance is true (finding 4); only the pointer is wrong, and it was inherited from the prior report's own mis-citation. A future check following it lands on the wrong table and cannot confirm the amendment — the precise failure this ledger exists to prevent. | Change "the audience row in §7" to "the audience row in §6" (optionally also citing §5.1, where the link-private wording is restated). |
| 4 | info | consistency | STORY-95, DOC-12 bullet | — | **Prior violation independently re-verified as closed**, not taken on the fix report's word. A case-insensitive scan of the current DOC-12 body returns **zero** occurrences of "author only". §2 principle 4 reads "Draft output is **link-private, not authenticated**: anyone holding the unguessable URL can view it (§5.1)"; §6's audience row reads "author, plus anyone holding the link (§5.1)"; §9 carries "preview snapshots are link-private only (principle 4, §5.1)". REQ-111's Non-goals documentation action is complete and the matrix now says so. | none |
| 5 | info | consistency | STORY-96 (story-66115f6b), Technical Context | — | Both residual-state claims re-verified against the working tree and still true: the stale in-code comment citing the original Cloudflare Pages premise is at `tools/generate/src/cli/serve.ts:80-85` ("`renderSite` emits a page at `<slug>.html`, and Cloudflare Pages serves that at `/<slug>`"), and the authored `.html` links remain in `storage/sites/xgd/draft/pages/whitepapers.json` (4 occurrences). The story is correct to record both as outstanding. | none |
| 6 | info | exclusivity | STORY-94 out-of-scope + STORY-95 AC-914 | — | The reserved-segment refusal is a *deploy-time* behaviour (`assertNoReservedSegment`, called from `cmdDeploy` before upload) housed under the *serving* story, because the segment is reserved by the route grammar. This is deliberate and explicitly handed over: STORY-94's out-of-scope names "the refusal of a snapshot whose contents would collide with the preview route" as the serving story's. Recorded so an `ac`-level pass does not read AC-914 as misfiled. | none |
| 7 | info | coverage | STORY-94, STORY-95 | — | Carried forward from report-ab9b224d finding 6, deliberately left to this level by the fix call: BUG-31 asked that "CLI help for `1c deploy` documents the sandbox root and points at the throwaway-slug workaround". Both story bodies express it ("which the command's own help says"), but no AC under either story pins it. Still an `ac`-level decision. | none at this level |

## Notes for the Editor

**Nothing here blocks.** Zero violations, zero needs_review. All three warnings
are one- or two-sentence body edits and none touches a behavioural scope
boundary or any of the 36 ACs.

**Findings 2 and 3 are both in STORY-95 and can be applied in one pass**, and
finding 3 in particular should be, because it corrects an error this cycle's
own predecessor introduced — the prior report asserted "§7's audience row" and
the fix call copied it into the ticket verbatim after verifying the *claim* but
not the *citation*. Verify against DOC-12's section headers before editing:
§5.1 Preview snapshots, §6 Rendering, §7 Cloudflare mapping.

**Finding 1 is the only one a future check could not have found from the matrix
alone.** It required reading REQ-115 — an intent belonging to a different
capability — because it changed the number of surfaces running a resolver that
STORY-96 counts. The prior cycle spotted the same fact and, reasonably, declined
to call it (the agreement is intact). It is raised now as a warning rather than
left in prose because "the two places a site is ever served from" is a load-
bearing enumeration in a story whose whole subject is an agreement between
environments: if the builder origin ever stops sharing `resolveStaticFile`, the
story will read as though nothing needs re-settling.

**What this capability does unusually well** — recorded again so a future check
sees it was deliberate, and so no later pass "fixes" it away:

- STORY-96 documents REQ-113's *corrected* intent instead of its original false
  premise (there is no Cloudflare Pages in the serving path; the real state was
  the inverse of what the ticket described), and says so explicitly.
- STORY-94 discloses a known divergence from REQ-110 — the conditional
  compare-and-swap manifest write became a re-read comparison, narrowing rather
  than closing the race — rather than restating the intent as satisfied.
- STORY-95 records REQ-111's carried-forward uncertainty verbatim: the
  `wrangler dev` smoke check against a live bucket and the apex custom-domain
  provisioning were never run, so the serving rules and root confinement are
  proven against the real request entry point with the binding faked, not
  against a real bucket. Honest; do not remove.
- STORY-95 records the reserved-segment gate as a standing invariant that no
  site definition can currently trigger (rendered pages are emitted flat), which
  is exactly what REQ-111's "Not done" section says.
- BUG-31's vocabulary (`--sandbox`, R2, `SERVABLE_ROOT`) is abstracted in both
  story bodies to "store tree" / "the servable tree", keeping the matrix
  implementation-independent while preserving the invariant. Verified present in
  code as `SERVABLE_ROOT = 'sites'` at `apps/public-site/src/site-store.ts:50`,
  used at `:54`, `:99`, `:103` and never derived from a request.

**Intent-space sweep result**: every reconciled intent in the ledger is
represented, and no story text was found that intent does not support beyond
findings 1–3. BUG-32 (free_coded, 2026-08-05) is the only intent landed but not
yet reconciled; it was read in full and is a builder-chrome npm-scope rename with
no deploy or serving surface, so it does not enter this capability whenever it
reconciles.
