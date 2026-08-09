---
uid: report-7db1f680
id: REPORT-1733
type: report
title: 'Capability-Intent Alignment: Site Delivery: Deploy & Public Serving (level=story)'
created_by: xgd
created_at: '2026-08-09T09:24:28.701449+00:00'
updated_at: '2026-08-09T09:24:28.701449+00:00'
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

## Cumulative Intent Considered

Both intents that touched this capability's tree are **bundles**, each carrying
several source tickets. The bundle is what the stories record as `intent_uid`;
the source tickets inside it are what actually carry the asks. Ledger below is
expanded to the source-ticket level, because bundle membership alone does not
tell you which asks belong to this capability.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-13 (`bundle-e0143ffa`) | free_and_reconciled | 2026-08-06, merged `1ee6aaf2d2` | Container: REQ-108, REQ-109, REQ-110, REQ-111, REQ-113, BUG-30 | YES |
| → REQ-110 | in BUNDLE-13 | 2026-08-06 | R2 artifact store + `1c deploy`: content-addressed snapshot shipping, manifest, previews-are-not-revisions, dry-run, prune, staged report | YES — **CAP-82** |
| → REQ-111 | in BUNDLE-13 | 2026-08-06 | `public-site` Worker: route grammar, `SiteStore` seam, trailing-slash 301, content types, cache policy, noindex, opaque 404, reserved `draft` segment | YES — **CAP-82** |
| → REQ-113 | in BUNDLE-13 | 2026-08-06 (+ scope extension 2026-07-30) | Extensionless → `.html` in `1c serve`; scope extension added the Worker half (AC5–AC9) after the "Cloudflare Pages" premise was found false | YES — **CAP-82** |
| → REQ-109 | in BUNDLE-13 | 2026-08-06 | Renderer emits document-relative URLs (relocatable snapshot), flat-snapshot invariant | YES — but **CAP-70**, not this capability (rendering is explicitly out of CAP-82 scope) |
| → BUG-30 | in BUNDLE-13 | 2026-08-06 | `relativizeUrl` turns `/#frag` into a same-page anchor | YES — but **CAP-70** (same renderer sink as REQ-109) |
| → REQ-108 | in BUNDLE-13 | 2026-08-06 | L1 pointer-reactive texture accent | YES — but **CAP-70** (STORY-90) |
| BUNDLE-14 (`bundle-0385746c`) | free_and_reconciled | 2026-08-06, merged `cd8f98c89e` | Container: BUG-31, REQ-114, REQ-116 | YES |
| → BUG-31 | in BUNDLE-14 | 2026-08-06 | `1c deploy --sandbox` wrote into a real site's R2 keyspace; resolution = namespace every key by store root, Worker resolves `sites/` only | YES — **CAP-82** |
| → REQ-114 | in BUNDLE-14 | 2026-08-06 | L1 palette colour model | YES — but **CAP-70** (STORY-80) / **CAP-89** (STORY-97) |
| → REQ-116 | in BUNDLE-14 | 2026-08-06 | The edit render | YES — but **CAP-87** (STORY-98) |

Chronology is effectively a single arc: BUNDLE-13 established delivery
(REQ-110 ship → REQ-111 serve → REQ-113 URL agreement), BUNDLE-14 then
**corrected** it (BUG-31 store-root namespacing). No intent in the ledger
retires an earlier delivery behaviour; BUG-31 narrows REQ-110's key layout
rather than withdrawing anything.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-94 (`story-5349d01f`, upgrade) — *Ship a site off the laptop* | REQ-110, BUG-31 | **aligned** — covers both channels, render-first, complete artifact (`out/` + `source/`), content addressing, previews-are-not-revisions, publish-mints/deploy-ships refusal, dry-run, prune, staged report. BUG-31's write half (root-namespaced keys, per-root index, root-scoped prune, no URL for the non-servable tree) is expressed and the correction is recorded as a correction, not silently absorbed. |
| STORY-95 (`story-d34eccd8`, upgrade) — *Serve a deployed snapshot* | REQ-111, BUG-31 | **aligned** — two addressing forms, index-is-authority, grammar-rejects-before-read, trailing-slash 301 as correctness, link-privacy + noindex, opaque 404 with no unknown-slug/unpublished distinction, read-only surface (GET/HEAD, 405 otherwise), content typing, immutable-vs-short-TTL caching with 404s never retained, reserved first segment. BUG-31's read half (`SERVABLE_ROOT` fixed in the server, never derived from a request) is expressed as an AC-level guarantee rather than a note, with the reasoning for that choice recorded. |
| STORY-96 (`story-66115f6b`, feature) — *Clean page URLs* | REQ-113 (incl. its 2026-07-30 scope extension) | **aligned** — expresses the *agreement* between both environments, which is what the corrected intent actually asked for. Exact-match-wins, last-segment-only extension test, typing from the key that answered, trailing-slash never eligible (with the REQ-109 relative-asset reason), and no loosening of confinement or grammar guards. The false "Cloudflare Pages" premise is recorded as corrected rather than repeated. |
| REQ-109 + BUG-30 | — | **correctly out of this capability.** Both are renderer-sink behaviours; CAP-82's scope excludes rendering. Verified present in STORY-83 (`story-d0a8cfad`, CAP-70): its body carries "Where the output lands — a relocatable snapshot" (all three sinks, applied after the safety check, flat-snapshot invariant) and BUG-30's exact case — a reference with an **empty first segment** (`/#how`, `/?q=1`, bare `/`) emitted as an explicitly relative path. Both CAP-82 stories cross-reference STORY-83 by name. No gap. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | STORY-94 | — | The intent (REQ-110, "Manifest concurrency") specifies a conditional write (`onlyIf` etag). The implementation compares a re-read of the index against the bytes it started from, which preserves "a lost update fails loudly" but narrows rather than closes the race. STORY-94's Technical Context flags this explicitly as "Known divergence from intent (flag for regression)". Divergence is recorded, not absorbed — this is the correct handling. | none |
| 2 | info | consistency | STORY-95 | — | REQ-111 enumerated a closed content-type list (html, css, js, svg, woff2, png, jpg, webp, json, ico, txt). `apps/public-site/src/content-type.ts` ships a superset (adds mjs, xml, webmanifest, gif, avif, woff, ttf, otf, jpeg). STORY-95 states the rule in categories ("markup, stylesheets, scripts, JSON, text, XML, images and web fonts… unknown → generic binary") rather than as a closed list, so it contradicts nothing: the intent's actual rule — typed by extension, unknown falls back to octet-stream — is what the story pins. | none |
| 3 | info | consistency | STORY-96 | — | STORY-96 asserts "a stale in-code comment still cites the original premise as the preview server's rationale; that is documentation drift, not behaviour". Verified accurate: `tools/generate/src/cli/serve.ts:82` still reads "Cloudflare Pages serves that at `/<slug>`", the premise REQ-113's scope extension established was false. The story records the staleness instead of inheriting it. | none |
| 4 | info | exclusivity | STORY-94 + STORY-95 | — | The reserved-`draft`-segment gate is a *deploy-time* refusal but is assigned to the *serving* story. Deliberate and reciprocally stated: STORY-94's out-of-scope cedes "the refusal of a snapshot whose contents would collide with the preview route" to the serving story, and the constraint originates in REQ-111's route grammar. One owner, no duplication. | none |
| 5 | info | — | STORY-96 | — | Classified `story_kind: feature` while its siblings are `upgrade`. REQ-113 modified two pre-existing surfaces (`1c serve` and the Worker), which reads as upgrade-shaped; but the capability scope carries "URL resolution agreement" as its own bullet and no story expressed it before. No downstream consequence — feature and upgrade are both matrix-bearing and both expected to have ACs. Recorded for the ledger only. | none |

## Notes for the Editor

**Nothing to repair at this level.** All three stories are aligned to cumulative
intent on consistency, coverage and exclusivity.

Three things worth carrying forward:

1. **The bundle indirection is the trap here.** Both `intent_uid` values on these
   stories are bundles containing asks for four different capabilities. A future
   check that treats `bundle-e0143ffa` as a single ask will read REQ-108
   (pointer accent) and REQ-114 (palette) as uncovered CAP-82 intent and raise
   false coverage violations. Expand bundles to source tickets before judging
   coverage.

2. **REQ-109 and BUG-30 are the deliberate seam.** They sit in the same bundle as
   this capability's intents and are load-bearing *for* delivery — relocatable
   output is the precondition for path-prefix serving, and the trailing-slash
   exclusions in both STORY-95 and STORY-96 exist to protect it — but the
   behaviour is renderer-side and lives in STORY-83 under CAP-70. Both CAP-82
   stories name STORY-83 explicitly. This is correct placement against the
   capability's stated "rendering is out of scope", not a gap. Note that
   STORY-83 currently carries `uat_coverage: fail`, so the evidence for the
   dependency this capability rests on is weaker than this capability's own —
   out of scope for this check, but relevant to anyone reading CAP-82 as proven.

3. **Unverified sub-claim (not a finding).** STORY-95's Technical Context states
   that DOC-12's preview-privacy wording was amended to "link-private, not
   authenticated" (§2 principle 4 and the §7 audience row), closing a divergence
   REQ-111 had asked to be closed. I could not fetch DOC-12 in this session —
   human-ID resolution needs the ticket cold index, and that lock was held
   throughout by a long-running dispatcher (PID 22505). The claim is a
   documentation cross-reference rather than a behavioural assertion, and
   nothing observed contradicts it, so it is not reported as drift. If a later
   pass can read DOC-12 cheaply, confirming the §7 audience row is the check.

**Method note on infrastructure:** `xgd ticket list` / `query` were unusable for
most of this session (persistent `index_fcntl_lock` timeout on the cold index).
The story set was obtained from the dashboard capability tree on port 5555 (the
1stcontact instance) and every ticket body via `xgd ticket get <uid> --json`,
which reads without the cold index. Story-to-code spot-checks were read directly
from the worktree.
