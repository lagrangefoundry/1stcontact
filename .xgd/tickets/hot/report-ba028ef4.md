---
uid: report-ba028ef4
id: REPORT-1636
type: report
title: 'Capability-Intent Alignment: Site Delivery: Deploy & Public Serving (level=ac)'
created_by: xgd
created_at: '2026-08-07T21:54:23.570710+00:00'
updated_at: '2026-08-07T21:54:23.570710+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a12e557f
  level: ac
  violations: 1
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Delivery: Deploy & Public Serving
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 3
**Needs review**: 0

Anchor report: report-17a279f7. Capability: capability-a12e557f (CAP-82).
Level `ac`, first cycle at this level. The `story` level closed PASS at
report-7c2dae46 (REPORT-1635, 0 violations / 3 warnings), so the three story
bodies are the working reference here; intent was consulted directly only where
an AC makes a claim its story body does not (findings 1 and 4).

Scope: 36 active ACs across STORY-94 (13), STORY-95 (14), STORY-96 (9). All
three stories are `feature`/`upgrade`, so all are expected to carry ACs.

## Cumulative Intent Considered

Both bundles were decomposed and each source intent read in full; the whole
`request` and `bug` spaces were then swept by title for any other delivery
surface (nothing further found). Statuses re-read from the tickets rather than
carried over from the story-level cycle.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-110 | free_and_reconciled | 2026-07-30 | `1c deploy` + R2 layout: `out/` **and** `source/` under `preview/<sha>` / `rev/NNNN`, render-first, content-addressed id, previews-are-not-revisions, `--dry-run`, `--prune`, stage-labelled report ending in the URL, published-requires-revision refusal, conditional manifest write | YES |
| REQ-111 | free_and_reconciled | 2026-07-30 | `public-site` Worker: route grammar, trailing-slash 301, `SiteStore` seam, content-type by extension (unknown → octet-stream), immutable vs 60s TTL, `X-Robots-Tag` on **every** draft response, opaque 404 with no unknown-slug/unpublished distinction, reserved `draft` segment gated at deploy, apex holding response, Cache API warm hits, 404s uncached, `HEAD`, `405 + Allow` | YES |
| REQ-113 | free_and_reconciled | 2026-07-31 | Extensionless → `.html` mapping. AC1–AC4 preview server; the 2026-07-30 scope extension corrected the false Cloudflare-Pages premise and added AC5–AC9 on the Worker, incl. the load-bearing trailing-slash exclusion | YES |
| BUG-31 | free_and_reconciled | 2026-07-31 | Every stored key namespaced by store root; per-root manifest; `--prune` scoped to root; `DeployResult.url` nullable + "not publicly reachable" report; `SERVABLE_ROOT = 'sites'` never derived from a request; CLI help | YES |
| REQ-109 / BUG-30 | free_and_reconciled | 2026-07-30/31 | Document-relative asset emission and the `/#frag` defect. Hard dependency; owned by STORY-83 in another capability | YES, out-of-capability — referenced, not duplicated |
| REQ-115 | free_and_reconciled | 2026-07-31 | Factored `resolveStaticFile` out of `serve.ts`; builder origin shares it. Basis of the story-level warning on STORY-96's "two places" wording; no AC-level effect | YES for that warning only |
| REQ-108 / REQ-114 / REQ-116 | free_and_reconciled | 2026-07-29…31 | L1 accent / palette / edit render. REQ-116 re-read: the edit channel is "never published, never content-addressed, never enters `history.json`" and its non-goals pin "no change to the published or draft-preview channels" — no delivery surface, despite the shared `updated_by` bundle | NO |
| REQ-88 / REQ-84 | free_and_reconciled | — | "Servable" there is the local reproduction bundle, not delivery | NO |
| REQ-112 / REQ-119 | draft | 2026-07-31 | Not active; REQ-119 explicitly leaves `public-site` unchanged | NO |

## Alignment Ledger

### STORY-94 (story-5349d01f) — 13 ACs, intents REQ-110 + BUG-31

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-892 (0854ccc9) draft ships complete artifact + URL | REQ-110, BUG-31 | aligned; ¶2 duplicates AC-925/AC-924 (finding 2) |
| AC-893 (77bdb689) content addressing | REQ-110 | aligned |
| AC-894 (33a6622a) render-first | REQ-110 | aligned |
| AC-895 (48e04041) previews are not revisions | REQ-110 | aligned |
| AC-896 (5a097866) published channel + live pointer | REQ-110, BUG-31 | aligned; closing sentence duplicates AC-925 (finding 2) |
| AC-897 (fdcec177) published-with-no-revisions refused by name | REQ-110 | aligned — matches the "Publish mints, deploy ships" bullet added last cycle |
| AC-898 (6d49fb75) dry run | REQ-110 | aligned |
| AC-899 (cff7798d) prune | REQ-110, BUG-31 (¶2 root scoping) | aligned |
| AC-900 (bf89142e) stage-labelled report | REQ-110, BUG-31 (terminates in prefix + reason) | aligned |
| AC-901 (b873d838) lost-update guard | REQ-110 ("manifest concurrency") | aligned to intent; grounded only in the story's Technical Context, not its In-scope list (finding 4) |
| AC-924 (1fd2d4da) every key scoped to store tree | BUG-31 | aligned |
| AC-925 (c996ef8e) non-servable tree → no URL, says why | BUG-31 | aligned |
| AC-926 (1d90d433) per-tree index | BUG-31 | aligned |

Collective coverage of the story body: each of the ten In-scope bullets lands on
at least one AC (one command/two channels → 892+896; render-first → 894;
complete artifact → 892; tree scoping → 924+926+899¶2; unservable says so → 925;
content addressing → 893; previews-not-revisions → 895; publish-mints → 897;
rehearsal+cleanup → 898+899; legible report → 900). No bullet is unaddressed.

### STORY-95 (story-d34eccd8) — 14 ACs, intents REQ-111 + BUG-31

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-902 (536a6df9) preview URL renders complete | REQ-111 | aligned |
| AC-903 (5312d7ac) published URL follows live | REQ-111 | aligned |
| AC-904 (e7bd3c3a) trailing-slash 301 + query | REQ-111 | aligned |
| AC-905 (27815e0f) index is the authority | REQ-111, BUG-31 (gate ordering) | aligned; ¶1 and the fourth verification bullet restate AC-927 (finding 3) |
| AC-906 (fc87f616) opaque not-found | REQ-111 | **violation** — header-identity claim contradicts AC-910 (finding 1) |
| AC-907 (fda70dbc) grammar rejects before reading | REQ-111 | aligned |
| AC-908 (55611f33) typed from the object that answered | REQ-111 | aligned; enumeration exceeds REQ-111's list (gif/avif/xml/webmanifest/ttf/otf) but matches `content-type.ts` exactly — correctly reconciled, see Notes |
| AC-909 (fd1af685) immutable vs short lifetime | REQ-111 | aligned |
| AC-910 (923670bf) noindex on every preview response | REQ-111 | aligned |
| AC-911 (a136b7e4) warm cache, 404s never retained | REQ-111 | aligned |
| AC-912 (8140f45e) read-only surface | REQ-111 | aligned |
| AC-913 (08d88be5) apex holding response | REQ-111 | aligned to intent; story-body grounding is a parenthetical inside Out-of-scope — carried-forward story-level warning, see Notes |
| AC-914 (3745124c) reserved segment refused at deploy | REQ-111 | aligned |
| AC-927 (1fc3d687) one servable tree, never from a request | BUG-31 | aligned |

Collective coverage: all eleven In-scope bullets are addressed. The only body
claim no AC pins is "one multi-tenant server answers both **for every site**" —
multi-tenancy is implicit in the slug-bearing grammar every AC exercises, and no
intent states it as a separately observable criterion; recorded, not raised.

### STORY-96 (story-66115f6b) — 9 ACs, intent REQ-113

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-915 (8d648b73) preview server serves the clean URL | REQ-113 AC1 | aligned |
| AC-916 (4d7804f8) deployed site, both forms, HEAD | REQ-113 AC5 | aligned |
| AC-917 (b5e594c1) exact match always wins | REQ-113 AC2/AC7 | aligned — the directory-index precedence it asserts is real (`serve.ts:92`, fallback runs last) |
| AC-918 (c216e5e2) last segment only | REQ-113 AC3/AC7 | aligned |
| AC-919 (4900cd8a) no page → still not-found | REQ-113 AC1 (negative) | aligned |
| AC-920 (4464d7be) typed from the page that answered | REQ-113 AC6 | aligned |
| AC-921 (f336d8a0) slash-terminated never eligible | REQ-113 AC8 | aligned |
| AC-922 (d48193e6) preview confinement unchanged | REQ-113 AC4 | aligned |
| AC-923 (8d669459) deployed grammar unchanged | REQ-113 AC9 | aligned |

One-to-one with REQ-113 AC1–AC9; all six In-scope bullets covered; no ACs
describe the ticket's retired Cloudflare-Pages premise.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-906 (acceptance_criterion-fc87f616), STORY-95 | ac-edit | AC-906 requires four not-found cases to be "indistinguishable from one another in status, **headers** and body", and its Verification says to byte-compare them. Two of the four necessarily sit on different channels, and AC-910 (acceptance_criterion-923670bf) requires them to differ in exactly one header: case 3 ("a preview identifier that names no snapshot") is a draft-channel 404 that **must** carry `x-robots-tag: noindex` ("not only successful page and asset responses, but also the trailing-slash redirect and the not-found"), while case 2 ("a known site with nothing published") is a published-channel 404 that **must not** ("Responses on the published channel carry no such directive"). The two ACs cannot both hold. Confirmed in code: `notFound(channel)` routes through `withDraftPolicy` (`apps/public-site/src/index.ts:151`, `:171`), and `/site/<slug>/draft/<12-hex>/` resolves to `channel: 'draft'` before the manifest lookup fails (`routes.ts:170`). AC-906 is also broader than its own story body, which scopes the property to "never a difference a stranger could use to tell an unknown site from one that has not published" — both published-channel — and broader than its evidence: `tests/req111-public-site-serving.test.ts:302-307` byte-compares only the two published-channel cases and checks the rest on status/body alone. Written as it stands, AC-906 drives either a UAT that fails against correct code or a "fix" that strips the no-index directive and regresses AC-910. | Keep status, body and content type identical across all four cases; restrict full header equality to responses on the same channel. Name AC-910's preview no-index directive as the one permitted difference and state why it is not an existence oracle: the channel is chosen by the requester, not revealed by what exists, so probing `/site/<a>/` against `/site/<b>/` stays within one channel. |
| 2 | warning | exclusivity | AC-892 (acceptance_criterion-0854ccc9) ¶2 + AC-896 (acceptance_criterion-5a097866) closing sentence vs AC-925 (acceptance_criterion-c996ef8e), STORY-94 | ac-edit | AC-892 ¶2 ("ships and indexes identically — same halves, same content addressing, same preview entry — but returns no URL at all") is contained almost entirely in AC-925, which states both the URL absence and that "the upload, the content addressing and the index update are otherwise exactly what a servable deploy does"; the artifact-readback half is AC-924's. AC-896 repeats the same clause for the published channel. Three ACs assert one BUG-31 criterion in the same shape (inspect the deploy result for a null URL). | Let AC-892 and AC-896 state the servable-tree case and cross-reference AC-925 for the non-servable channel behaviour, or reduce their tails to the one thing neither AC-924 nor AC-925 says. |
| 3 | warning | exclusivity | AC-905 (acceptance_criterion-27815e0f) vs AC-927 (acceptance_criterion-1fc3d687), STORY-95 | ac-edit | AC-905's opening paragraph restates the two-gate ordering and its fourth verification bullet asserts "a site whose bytes and index both exist only in the non-servable tree is not-found on its preview and published addresses" — which is AC-927's own criterion, verified in the same shape (drive the real entry point across the admitted route forms). AC-905's distinct criterion is index-authority *within* the servable tree (orphans, unlinked previews, ids that reach no key). | Keep AC-905's gate-ordering sentence as an explicit cross-reference to AC-927 and drop the duplicated verification bullet, so the tree gate is proven once. |
| 4 | warning | coverage | STORY-94 (story-5349d01f) body vs AC-901 (acceptance_criterion-b873d838) | story-body-edit | AC-901 (deploy fails loudly and leaves the index unclobbered when it changed underneath) is an active criterion backed by REQ-110's "Manifest concurrency" section and implemented at `tools/generate/src/deploy/manifest.ts:107-117`, but the story's In-scope list has no bullet for it. Its only support in the body is the Technical Context note "Known divergence from intent (flag for regression)", which is framed as a *narrowing* of the mechanism rather than as in-scope behaviour — a reader of the story alone would not expect an AC here. Same shape as the open story-level warning on AC-913. | Add an In-scope bullet to STORY-94 (e.g. "**Two deploys do not silently overwrite each other.** A deploy whose index changed under it fails by name and leaves the stored index as the other deploy left it"), and leave the Technical Context note as the record of the narrowed mechanism. |

## Notes for the Editor

- **Finding 1 is the only thing blocking this level.** It is a contradiction
  *inside* the matrix (AC vs sibling AC), not a code defect — `public-site`
  behaves correctly today and no production change is called for. Fix AC-906's
  wording only.

- **Findings 2 and 3 are the same pattern, from the same source.** BUG-31's
  criteria were woven into pre-existing REQ-110/REQ-111 ACs *and* given their
  own ACs (AC-924/925/926/927). The result is correct but says the tree story
  three or four times. If only one is repaired, prefer finding 3: AC-905/AC-927
  is the security-relevant pair, and proving confinement in two places invites a
  future edit that weakens one and leaves the other looking like cover.

- **AC-913 (apex) — carried forward, deliberately not re-counted.** REPORT-1635
  finding 2 (warning, unrepaired) records that STORY-95's body supports AC-913
  only through a parenthetical inside its Out-of-scope paragraph. Nothing at the
  AC level adds to that; it is a story-body repair and belongs to the story
  level's ledger, not this one.

- **AC-908 is not drift, despite looking like it.** Its enumeration (GIF, AVIF,
  XML, web manifest, TTF/OTF) goes beyond REQ-111's stated list of html/css/js/
  svg/woff2/png/jpg/webp/json/ico/txt. It was checked against
  `apps/public-site/src/content-type.ts` and matches the table exactly, so the
  AC records what shipped rather than over-claiming. Its "does not depend on
  metadata recorded by whatever wrote the object" clause is likewise real
  (the type is derived from the served path, never from R2 `httpMetadata`).

- **Spot-checks performed against code, all clean:** AC-901 vs
  `manifest.ts:107` (re-read compare, `ManifestConflictError` names the site and
  the re-run remedy); AC-914 vs `content.ts:87` (exact first-segment match, so
  deeper and prefix-sharing entries proceed); AC-899 vs `deploy.ts:290-310`
  (only `preview/` and `rev/` keys are prune candidates, listing scoped to the
  root); AC-917 vs `serve.ts:92` (fallback runs last, directory index wins);
  AC-921 vs `routes.ts:htmlFallbackFor` (trailing slash never eligible). No
  `code-issue` finding is warranted at this level.
