---
uid: report-472feebd
id: REPORT-1619
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=story)'
created_by: xgd
created_at: '2026-08-07T20:04:37.084230+00:00'
updated_at: '2026-08-07T20:04:37.084230+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: story
  violations: 1
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 3
**Needs review**: 0

Anchor report: report-17a279f7 · Capability: capability-a994b8f3 (CAP-85) ·
Story tree: STORY-99 (story-e674c60a) only · Attempt 2 (prior:
report-c5a97ce2 FAIL, fix report-6d2f7dbd).

**All three actionable findings from attempt 1 are verified repaired** (see
"Prior attempt" below). This attempt's violation is a different defect, found by
driving the real origin rather than by reading the matrix: the freshness
guarantee the story and AC-977 both state as universal is not universal in the
shipped code.

## Cumulative Intent Considered

STORY-99 carries `intent_uid: bundle-15c1f647` (BUNDLE-16, `free_and_reconciled`,
merged at `1741ee5d`) and no `updated_by`. A bundle is not itself an ask, so the
ledger is walked at the request level. No request created after 2026-07-31
touches this capability (checked across all 50 requests).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-44 (request-3b78151f) | free_and_reconciled | 2026-07-03 | `1c` CLI dependency preflight — fail loud on unresolvable declared dep / lockfile drift | YES — but lands outside this capability (info #8) |
| REQ-115 (request-a6740b4a) | free_and_reconciled | 2026-07-31 | T1 builder chrome: webui consumed from the installed artifact store via each package's `exports`, Node origin + `control-app` same-origin front, `site` tab, multi-mode display panel, mode-declared toolbar, split + namespaced persistence, shared `resolveStaticFile` confinement, publish through the existing path | YES — the primary intent for this capability |
| COMMENT-598 / COMMENT-600 on REQ-115 (comment-fe2ff8e0, comment-565838b0) | — | 2026-07-31 | Settles Deliverable 0 (upstream blocker; the three-way spike that rejected both Worker bundler routes) and fixes the Node-origin-plus-Worker-front shape | YES — secondary source of truth |
| REQ-116 (request-41796766) | free_and_reconciled | 2026-07-31 | The edit render channel | YES for context only — owned by CAP-87 / STORY-98 |
| REQ-117 (request-395b67e6) | free_and_reconciled | 2026-07-31 | T3 copy editing end-to-end. Three recorded sections touch this capability: the viewport-fill follow-up (`94ae6fee`), "the loop is closed" (`cda7fe4d` — `/api/copy` and `/framework/edit-client.js` on this origin), and the stale-render/caching fix | YES (the chrome/origin parts) |
| COMMENT-601 on REQ-117 (comment-40779c8d) | — | 2026-08-06 | Operator dialogue settling freshness: "`sendFile` sent `content-type` and nothing else — no `Cache-Control`, no `ETag`, no `Last-Modified` … Now `no-store`". Also settles that a save re-renders **both** channels | YES — the sole intent source for AC-977 |
| REQ-118 (request-66e4c630) | free_and_reconciled | 2026-07-31 | Image selection; added `GET /api/assets` to this origin | YES — origin reachability claimed by STORY-102 / CAP-89 (info #9) |
| REQ-119 (request-64864801) | draft | 2026-07-31 | Request-time renders inside `control-app`; deletes the proxy | NO — draft, retires nothing yet |

Cumulative picture: REQ-115 establishes the whole surface; REQ-117 adds the
window-fill fix, the edit transport, the served edit bridge and the freshness
directive; REQ-119 has retired nothing, so the story's "deliberate and temporary"
framing of the Node origin remains correct.

## Prior attempt — verification of the three applied fixes

| Attempt-1 finding | Repair claimed | Verified now |
|---|---|---|
| #1 violation — edit transport expressed nowhere | Origin bullet widened + Out-of-scope amended + new Technical Context bullet "The edit transport is one seam, claimed once"; CAP-85 body widened | **Confirmed.** STORY-99 body: 5 occurrences of "transport", the seam bullet naming CAP-86 / STORY-100 present; CAP-85 body: 2 occurrences plus a new "Edit semantics" out-of-scope bullet. STORY-100 (story-37a3921b, lines 140–143) still carries the complementary half, so the seam is claimed once from each side — no exclusivity violation |
| #2 warning — stale CAP-84 pointers | Repointed to CAP-87 / STORY-98 | **Confirmed.** STORY-99 body contains `CAP-84` zero times, `CAP-87` twice |
| #3 warning — origin failure modes absent from body | New bullet "An origin that is missing is not a blank page" | **Confirmed.** Present, and matches AC-965 + `apps/control-app/src/index.ts:28` (503 naming `1c builder`) / `:46` (502) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-99 — component consumption (installed store, `exports`-derived entry points, never vendored, missing-install diagnostic) | REQ-115 Deliverable 0 + COMMENT-600 | aligned |
| STORY-99 — single origin serving document / components / browser source / every channel; `control-app` front forwards verbatim | REQ-115 + COMMENT-600 | **gap — finding #3: the enumeration omits the edit bridge (`/framework/*.js`), a fifth thing this origin serves** |
| STORY-99 — the origin's operations: list the store, publish, and the write path's read/apply as a thin transport with an expected refusal | REQ-115 + REQ-117 ("the loop is closed") | aligned (repaired attempt 1) — verified against `tools/generate/src/cli/builder.ts:225` (route), `:353-362` (`CommandError` → 400 carrying `code`/`path`/`hint`) |
| STORY-99 — unconfigured vs unreachable origin are distinct self-explanatory failures | REQ-115 front design + COMMENT-600 | aligned (repaired attempt 1) |
| STORY-99 — one tab, fills the window, follows a live resize, page never scrolls | REQ-117 follow-up `94ae6fee` | aligned |
| STORY-99 — one definition site for every name | REQ-115 AC 3 | aligned |
| STORY-99 — tab declaration integrity (AC-976, active) | REQ-117 follow-up `94ae6fee` ("`app.js` was rebuilding each tab as `{id, label}` and **silently dropping `fill`**") | **gap — finding #4: intent-supported and held by an active AC; the story body is silent** |
| STORY-99 — display panel, modes as entries, switch preserves the pane | REQ-115 AC 7 | aligned |
| STORY-99 — toolbar renders the active mode's declared controls; selector over the real store; publish via existing path | REQ-115 AC 6, 8, 9 | aligned |
| STORY-99 — split, drag, collapse-to-rail, namespaced persistence | REQ-115 AC 4, 5 | aligned |
| STORY-99 — freshness: "every response it returns … is served as non-cacheable" | REQ-117 / COMMENT-601 | **gap — finding #1: the universal ships false. Every `/api/*` response carries no `cache-control` at all** |
| STORY-99 — confinement across all three trees, clamped so the refusal reads as not-found | REQ-115 ("one implementation means a traversal guard cannot be present on one and missing on another") | aligned |
| STORY-99 — "the origin is temporary; a later phase moves rendering into the Worker" | REQ-119 (`draft`) | aligned — nothing retired yet |
| CAP-85 body | REQ-115 + REQ-117 | aligned except the same origin-enumeration omission as finding #3 |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-99 (story-e674c60a) "Freshness over caching" bullet, and AC-977 (`acceptance_criterion-76d3ad8f`, active) | code-issue | Both state a universal: the story says "every response it returns, the workspace document included, is served as non-cacheable. **One exempt response is enough** to leave an operator looking at a stale page that appears to be working"; AC-977's title is "Every response the workspace origin returns is served as non-cacheable". The origin does not do this. `json()` at `tools/generate/src/cli/builder.ts:129-137` writes only `content-type` and `content-length` — no freshness directive and no validator — and every JSON route uses it: `/api/sites` (`:179`), `/api/publish` (`:184`), `/api/assets` (`:205`), `/api/copy` (`:225`), and the `CommandError` envelope (`:356`). The plain-text 404s (`:336`, `:350`) are likewise bare. **Verified empirically, not by reading**: started `bin/1c builder --port 4291` against this checkout — `GET /api/sites` → `200`, headers `content-type`, `content-length`, `Date`, `Connection`, `Keep-Alive`, **no `cache-control`**; `GET /api/assets?slug=1stcontact` → `200`, same. This is the exact combination COMMENT-601 calls "the worst available" (heuristic freshness permitted, nothing to revalidate with) — and it sits on `GET /api/copy`, whose response is the field values the modal displays, and on `GET /api/sites`, the selector's list. The code's own comment at `:166-168` asserts the opposite — "The shell was the last cacheable response on this origin — every other route goes through `sendFile`, which is `no-store`" — which is false for the five `json()` routes. | **Preferred: fix the code**, one line — give `json()` the same `'cache-control': 'no-store, must-revalidate'` `sendFile` uses (`tools/generate/src/cli/serve.ts:118-123`), and the bare 404/403 writes too. That makes the shipped behaviour match what the story, the AC and the code comment all already claim. The alternative — narrowing the story bullet and AC-977 to "every response carrying rendered or served bytes" — is *not* recommended: it weakens a guarantee the author believed shipped, and leaves the stale-modal case uncovered. Whichever is chosen, finding #2 must be resolved in the same pass. |
| 2 | warning | coverage | `test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable` (`tests/reconciliation-builder-workspace-origin.test.ts:252-280`) | uat-edit | The test's name and comment claim the universal ("There is no exempt response") but it probes a subset: `/builder/main.js`, `/builder/builder.css`, `/preview/<slug>/{draft,edit,published}/`, `/` and `/webui/<pkg>/…`. No `/api/*` route is probed, which is precisely why finding #1 is green today. The test's own framing — "the workspace document explicitly: it is hand-written and does NOT travel the same file-sending path as everything else, so it is exactly the response a blanket assumption would miss" — identifies the right risk and then misses the other five responses that do not travel that path. | Add `/api/sites` and `/api/assets?slug=…` (and, once a fixture address exists, `/api/copy` GET) to the probe list. Better: enumerate the origin's routes and assert over all of them, so a route added later is covered the way AC-976 asks tab options to be. Belongs to the `uat` cycle; recorded here because it is the evidence half of finding #1. |
| 3 | warning | coverage | STORY-99 (story-e674c60a) origin bullet (body line 18-20) and CAP-85 body "The workspace origin" scope bullet | story-body-edit | REQ-117 ("the loop is closed") records a fourth kind of byte this origin serves: "**`/framework/edit-client.js`** — the bridge served to the browser by type-stripping the TypeScript source. It stays **one** implementation: it reads the stamp the renderer writes, and a hand-written browser copy would be free to drift from the markup." It ships at `tools/generate/src/cli/builder.ts:311-330` (`/framework/{edit-client,site-schema-edit}.js`), on its own route — not under `/builder/`, so it is not "the workspace's own browser source" tree, and not under `/webui/`. Both bodies enumerate what the origin serves ("the workspace document, the UI components it is built from, its own browser code, and every rendering of every site in the store") and neither covers it; no AC mentions it; and no neighbouring story claims it either — STORY-101 (CAP-87) depends on the workspace only "for the page on screen, the View/Edit modes and the single origin". Same shape as attempt 1's finding #1: intent recorded it, it ships on this origin, the matrix holds it nowhere. | Extend the enumeration in both bodies to include the shared client code the editing gesture runs, served rather than copied so it stays one implementation with the renderer that writes the stamp. Keep the ownership split: CAP-87 owns what the bridge *does*; CAP-85 owns only that it is reachable over this origin, as it already does for the edit transport. |
| 4 | warning | coverage | STORY-99 (story-e674c60a) "One tab, filling the window" bullet | story-body-edit | AC-976 (`acceptance_criterion-922c2d11`, active) claims "A tab is declared once, whole, and every property of that declaration is honoured by the chrome that mounts it … no declared option is silently discarded", with a mutation check on the fill option. It is intent-supported: REQ-117's `94ae6fee` follow-up records that `app.js` "was rebuilding each tab as `{id, label}` and **silently dropping `fill`**. Nothing threw and nothing warned", and the guard UAT asserts "on *every* declared tab key so the next option added cannot be dropped the same silent way". The story body carries only the *outcome* (the site fills the window, follows a resize, the page never scrolls) and the naming property (AC-960); the declaration-integrity guarantee appears nowhere. Same under-expression shape as attempt 1's finding #3. | Add a clause to the chrome bullet: a tab is declared once and whole, and every option in that declaration reaches the chrome intact — an option added to the declaration needs no change at the mounting step and cannot be silently dropped. |
| 5 | info | — | STORY-99 / CAP-85 | — | Attempt 1's violation and both warnings are verified repaired against the live tickets and the code (table above). No regression introduced by those edits: the added text is intent-supported at every clause I checked against `builder.ts` and `control-app/src/index.ts`. | none |
| 6 | info | coverage | STORY-99 ACs | — | No AC covers the edit transport that attempt 1 added to the story body. That is by design — attempt 1's finding #1 states "An AC will follow at the `ac` level cycle; this finding is the story-body half only" — and is recorded here so the `ac` cycle does not have to rediscover it. The AC should be about reachability and the shape of the refusal (a refused edit arrives as an expected refusal carrying the write path's own code/path/hint), never about what the write path validates. | none at story level |
| 7 | info | consistency | STORY-100 (story-37a3921b), body line 138 | — | Still carries the stale pointer "the edit render channel (CAP-84 / STORY-98)". CAP-84 (capability-25f7e486) is `superseded`, `superseded_by_uid: capability-12fee326` (CAP-87). Out of this capability's scope — forwarded by attempt 1's fix report and re-confirmed still present. Should be swept when CAP-86 is validated. | none here |
| 8 | info | coverage | REQ-44 | — | In this capability's bundle but asks for a `1c` CLI dependency preflight, not this surface. Expressed by STORY-79 (`story-e15a19ef`, CAP-63, `updated_by: bundle-15c1f647`). Correctly placed; no CAP-85 gap. | none |
| 9 | info | coverage | REQ-118 / `/api/assets` | — | `GET /api/assets` (`builder.ts:205`) is claimed by STORY-102 (`story-c46abfa6`, CAP-89): "The store answers from the command line and from the builder's own origin." Deliberate, and consistent with STORY-99's origin bullet enumerating only the operations this capability owns. Contrast finding #3, where nothing claims the served bytes. | none |
| 10 | info | consistency | STORY-99 "temporary origin" framing | — | REQ-119 is still `draft`, so nothing in the serving paragraph is stale. When it activates, the Technical Context serving paragraph is the element that must change; the ACs are written about *one origin* and were authored to survive it. | none |

## Notes for the Editor

- **Finding #1 is the only thing blocking PASS, and its cheapest repair is one
  line of code**, not a matrix edit. `json()` and the two bare text writes in
  `builder.ts` are the entire gap. Do #1 and #2 together — fixing the code
  without widening the probe leaves the same hole open to the next route.
- **Findings #3 and #4 are the same species as attempt 1's #1 and #3**:
  behaviour that intent recorded, code shipped, and the story body's
  enumeration or bullet does not mention. Both are body edits with no code
  consequence. If a sweep is worth doing, the pattern to look for is *"the
  origin serves N things / the chrome honours N properties"* lists in the story
  and capability bodies that were written before REQ-117's follow-ups landed.
- **Do not resolve #3 by widening CAP-85 into the gesture.** As with the edit
  transport, the half that belongs here is *what bytes this origin serves*; what
  the bridge does when it runs belongs to CAP-87 / STORY-101.
- **Method note.** This capability has one story, so exclusivity was checked
  against neighbouring capabilities rather than within the tree: STORY-100
  (CAP-86) and STORY-99 now each hold exactly one half of the edit-transport
  seam and say so explicitly; STORY-101 (CAP-87) defers the workspace; STORY-102
  (CAP-89) claims the asset listing's origin reachability; STORY-95/96 (CAP-82)
  cover the separate deployed-snapshot origin, and STORY-99's divergence note
  about `no-store` reaching `1c serve` remains correct and should be preserved
  verbatim.
- **Evidence note.** Finding #1 was found by running the origin
  (`bin/1c builder --port 4291`) and reading response headers, not by reading
  the matrix. The `/` route returned 500 on this machine because the
  `@gendevlabs/webui-*` components are not installed here — the implicit
  dependency gap the story's Technical Context already declares. That does not
  affect the finding: the `/api/*` probes returned 200 with real payloads.

