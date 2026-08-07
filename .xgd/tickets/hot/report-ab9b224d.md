---
uid: report-ab9b224d
id: REPORT-1633
type: report
title: 'Capability-Intent Alignment: Site Delivery: Deploy & Public Serving (level=story)'
created_by: xgd
created_at: '2026-08-07T21:36:29.152633+00:00'
updated_at: '2026-08-07T21:36:29.152633+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a12e557f
  level: story
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Delivery: Deploy & Public Serving
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

Anchor report: report-17a279f7. Capability: capability-a12e557f (CAP-82).
Stories in scope: STORY-94 (story-5349d01f), STORY-95 (story-d34eccd8),
STORY-96 (story-66115f6b).

## Cumulative Intent Considered

All three stories carry `intent_uid: bundle-e0143ffa` (BUNDLE-13,
free_and_reconciled, main `1ee6aaf2`); STORY-94 and STORY-95 additionally carry
`updated_by: bundle-0385746c` (BUNDLE-14, free_and_reconciled, main
`cd8f98c8`). The bundles were decomposed to their source intents, and the wider
intent space was swept for anything else landing in this capability's scope.

| Intent ID | Status | Bundle | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-110 | free_and_reconciled | BUNDLE-13 | R2 artifact store + `1c deploy`: layout (manifest / preview/`<sha>` / rev/`NNNN`, `out/` + `source/`), render-first, content-addressed id, previews-are-not-revisions, `--dry-run`, `--prune`, stage-labelled report, published-requires-revision refusal, conditional manifest write | YES |
| REQ-111 | free_and_reconciled | BUNDLE-13 | public-site Worker: route grammar (draft/published), trailing-slash 301, `SiteStore` seam, content-type by extension, immutable vs short TTL, `X-Robots-Tag` on draft, opaque 404, reserved `draft` segment gated at deploy time, apex holding response, Cache API on repeat hits | YES |
| REQ-113 | free_and_reconciled | BUNDLE-13 | Extensionless → `.html` mapping. Original scope was the preview server only; the 2026-07-30 scope extension corrected a false premise (no Cloudflare Pages in the path) and added the production half: AC5–AC9 on the Worker | YES |
| BUG-31 | free_and_reconciled | BUNDLE-14 | Namespace every stored key by store root; `--prune` scoped to root; `DeployResult.url` null + "not publicly reachable" report for the scratch root; `SERVABLE_ROOT = 'sites'` never derived from a request; CLI help; DOC-12 §7 table correction | YES |
| REQ-109 | free_and_reconciled | BUNDLE-13 | Document-relative asset URLs (relocatable output). Hard dependency of this capability; owned by STORY-83 under capability-ae9d65d6 | YES, but out-of-capability — correctly referenced, not duplicated |
| BUG-30 | free_and_reconciled | BUNDLE-13 | `relativizeUrl` same-page-anchor defect. Surfaced REQ-113's missing production half; the fix itself is the emitter's, not delivery's | YES, out-of-capability |
| REQ-108, REQ-114, REQ-116 | free_and_reconciled | BUNDLE-13/14 | L1 pointer accent / palette model / edit render. REQ-116 explicitly holds published and draft-preview renders byte-identical and never publishes or content-addresses the edit channel — no delivery surface | NO (other capabilities) |
| REQ-115 | free_and_reconciled | — | Builder shell. Refactored `resolveStaticFile` out of `serve.ts` so the builder origin serves rendered channels under the identical confinement/index/extensionless rules. Represented by STORY-99; the builder origin is local authoring, explicitly out of this capability's scope | NO (represented elsewhere) |
| REQ-117, REQ-118 | free_and_reconciled | — | Copy editing / image selection. Touch `serve.ts` only through the builder origin | NO |
| REQ-112 | draft | — | Untitled, empty body | NO (not active) |
| REQ-119 | draft | — | Would move draft/edit renders to request time inside control-app. Explicitly leaves publishing and `public-site` unchanged, and is contingent on DOC-8 §13 Q3 | NO (not active) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-94 (Ship a site off the laptop) | REQ-110, BUG-31 | aligned, with one incomplete in-scope list (finding 2). Every BUG-31 ask is present and correctly abstracted away from `--sandbox`/R2 vocabulary into "store tree". REQ-110's conditional-manifest-write divergence is disclosed honestly in Technical Context rather than silently dropped. |
| STORY-95 (Serve a deployed snapshot) | REQ-111, BUG-31 | **gap**: Technical Context asserts a DOC-12 divergence that has since been closed (finding 1). Behavioural scope otherwise aligned; in-scope list incomplete against its own ACs (finding 3). |
| STORY-96 (Clean page URLs) | REQ-113 | aligned. Notably strong: the story records REQ-113's *corrected* intent (the premise that Cloudflare Pages auto-served `.html` was false, and the real state was the inverse) instead of absorbing the original false framing. AC-915…AC-923 map cleanly onto REQ-113 AC1–AC9. Both of its residual-state claims were verified true against the tree (see Notes). |

Boundary discipline between the three stories is explicit and non-overlapping:
STORY-94 disclaims the reserved-segment refusal and hands it to STORY-95
(AC-914); STORY-95 disclaims the clean-URL agreement and hands it to STORY-96;
STORY-96 disclaims the route grammar and hands it back to STORY-95. No
exclusivity violations found.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-95 (story-d34eccd8), Technical Context, final bullet | story-body-edit | Story body states: "The public preview-privacy wording in the product documentation ([[DOC-12]]) **still** describes previews as 'author only (private)', which the no-authentication decision supersedes; the divergence is documentation, not behaviour." This is false as of the current DOC-12. REQ-111 (free_and_reconciled) listed that amendment under Non-goals ("[[DOC-12]] needs its 'author only (private)' wording amended to match"), and the amendment has landed: DOC-12 §2 principle 4 now reads "Draft output is **link-private, not authenticated**: anyone holding the unguessable URL can view it (§5.1)", and §7's audience row reads "author, plus anyone holding the link (§5.1)". A case-insensitive search of DOC-12 returns zero occurrences of "author only". The matrix therefore reports an intent-mandated documentation action as outstanding when it is complete. | Delete the bullet, or restate it as closed — e.g. "DOC-12's preview-privacy wording was amended to 'link-private, not authenticated' to match the no-authentication decision (REQ-111)." |
| 2 | warning | coverage | STORY-94 (story-5349d01f), "In scope" list | story-body-edit | The in-scope list has no bullet for the published-channel refusal when the site has no revisions. REQ-110 names it as its own acceptance (`test_UAT_FC_<TICKET>_deploy_published_requires_revision` — "fails with a message naming `1c publish`"), and the capability body explicitly scopes "what a deploy reports, **what it refuses**, and what it will and will not delete". Intent coverage is not lost — AC-897 ("Deploying the published channel for a site with no revisions is refused by name, and writes nothing") carries it — so this is a body-completeness issue, not an intent gap. | Add an in-scope bullet, e.g. "**Publish mints, deploy ships.** A published deploy of a site with no revisions is refused by name and writes nothing, directing the operator to publish first." |
| 3 | warning | coverage | STORY-95 (story-d34eccd8), "In scope" list | story-body-edit | Three behaviours REQ-111 asked for appear in STORY-95's ACs but in none of its in-scope bullets: (a) content-typing by extension with unknown → generic binary (REQ-111 `test_UAT_FC_<TICKET>_content_types`; AC-908); (b) the URL-grammar rejections for empty / dot-shaped / separator-bearing / malformed components (REQ-111 route grammar + as-built parser notes; AC-907 — and STORY-96 explicitly hands these back to this story); (c) warm-request cache behaviour and the deliberate non-caching of 404s (REQ-111 "Repeat hits go through the Cache API"; as-built "404s are not cached"; AC-911). "Freshness policy that matches addressing" covers cache-control headers only, not the cache itself. | Extend the in-scope list with a bullet for response typing, one for the address grammar's rejections, and widen the freshness bullet to cover repeat-request service and the non-retention of not-found. |
| 4 | info | consistency | STORY-96 (story-66115f6b) | — | Both residual-state claims in the body were verified against the working tree and are still true: the stale in-code comment citing the original Cloudflare Pages premise is at `tools/generate/src/cli/serve.ts:81-85`, and the authored `.html` links plus BUG-30's `index.html#how` workaround are still present in `storage/sites/xgd/draft/pages/whitepapers.json` (lines 301, 365, 392, 1752). No edit needed. | none |
| 5 | info | exclusivity | STORY-95 AC-908 + STORY-96 AC-920 | — | Both concern response typing and read as near-neighbours ("typed from the object that answered" vs "typed from the page that answered"). They are distinct criteria from distinct intents — REQ-111's extension→type map versus REQ-113 AC6, which exists because an extensionless request path offers nothing to type from — and they sit in different stories. Not a duplicate. | none |
| 6 | info | coverage | STORY-94, STORY-95 | — | BUG-31 asked that "CLI help for `1c deploy` documents the sandbox root and points at the throwaway-slug workaround". Both story bodies express it ("which the command's own help says"), but no AC under either story pins it. Out of scope for a story-level finding; flagged here so an AC-level pass can decide whether help text warrants a criterion. | none at this level |

## Notes for the Editor

**The one blocking item is finding 1** — a single stale sentence in STORY-95's
Technical Context. It is a one-line deletion or restatement, and it does not
touch STORY-95's behavioural scope or any of its fourteen ACs.

**Findings 2 and 3 share one shape** and can be fixed together: both story
bodies' "In scope" lists are narrower than their own AC sets. This is worth
repairing even though intent coverage technically holds at AC level, because of
the level cascade — an `ac`-level run takes the story body as its working
reference, and AC-897, AC-907, AC-908 and AC-911 would each read as unsupported
by their parent story. That is a live risk of a downstream pass proposing
`ac-deprecate` against four correct ACs.

**What this capability does unusually well**, recorded so a future check can see
it was deliberate rather than accidental:

- STORY-96 documents REQ-113's *corrected* intent instead of its original false
  premise, and says so explicitly. A story that had simply inherited the ticket
  text would now claim a Cloudflare Pages component that has never existed in
  the serving path.
- STORY-94 discloses a known divergence from REQ-110 (the conditional
  compare-and-swap manifest write became a re-read comparison, narrowing rather
  than closing the race) rather than quietly restating the intent as satisfied.
- STORY-95 records the carried-forward uncertainty from REQ-111 verbatim: the
  `wrangler dev` smoke check against a live bucket and the apex custom-domain
  provisioning were never run, so root confinement and the serving rules are
  proven against the real request entry point with the binding faked, not
  against a real bucket. That is honest and should not be "fixed" away.
- BUG-31's vocabulary (`--sandbox`, R2, `SERVABLE_ROOT`) is correctly abstracted
  in both story bodies to "store tree" / "the servable tree", keeping the matrix
  implementation-independent while preserving the invariant.

**Intent-space sweep result**: no intent in the ledger is unrepresented in this
capability, and no story text was found that intent does not support other than
finding 1. REQ-115/117/118 do touch `tools/generate/src/cli/serve.ts` — REQ-115
split `resolveStaticFile` out so the builder origin serves rendered channels
under the identical confinement, directory-index and extensionless rules — but
the builder origin is local authoring, which this capability's body places out
of scope, and it is represented by STORY-99. Worth watching: STORY-96 frames its
agreement as holding between "the two places a site is ever served from", and
there are now three surfaces running that resolver. The agreement is not
broken (they share one implementation, which is why REQ-115 unified it), so this
is not a finding today — but if the builder origin's resolution ever diverges,
STORY-96 is where it must be re-settled, alongside the nesting asymmetry that
story already flags.

