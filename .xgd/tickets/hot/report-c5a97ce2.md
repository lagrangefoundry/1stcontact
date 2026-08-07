---
uid: report-c5a97ce2
id: REPORT-1617
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=story)'
created_by: xgd
created_at: '2026-08-07T19:50:49.760227+00:00'
updated_at: '2026-08-07T19:50:49.760227+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: story
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

Anchor report: report-17a279f7 · Capability: capability-a994b8f3 (CAP-85) ·
Story tree: STORY-99 (story-e674c60a) only.

## Cumulative Intent Considered

CAP-85's single story carries `intent_uid: bundle-15c1f647` (BUNDLE-16,
`free_and_reconciled`, merged at `1741ee5d`) and no `updated_by`. The bundle is
not itself an ask — it bundles three requests, so the ledger is walked at the
request level. REQ-119 is included because it is the declared successor to this
capability's serving arrangement and its status decides whether the story's
"temporary origin" framing is live.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-44 (request-3b78151f) | free_and_reconciled | 2026-07-03 | `1c` CLI preflight: fail loud on unresolvable declared dep / lockfile drift | YES — but lands outside this capability (see info #4) |
| REQ-115 (request-a6740b4a) | free_and_reconciled | 2026-07-31 | T1 builder chrome: webui consumption via installed artifact store, Node origin + control-app same-origin front, `site` tab, multi-mode display panel, mode-declared toolbar, split + persistence, shared `resolveStaticFile` confinement, publish via existing path | YES — the primary intent for this capability |
| REQ-117 (request-395b67e6) | free_and_reconciled | 2026-07-31 | T3 copy editing end-to-end. Two of its recorded sections touch this capability: the viewport-fill follow-up (`94ae6fee`) and "the loop is closed" (`cda7fe4d`), which added `/api/copy` and `/framework/edit-client.js` to the workspace origin | YES (partially — the chrome/origin parts) |
| COMMENT-601 on REQ-117 | — | 2026-08-03 | Operator dialogue settling the origin's freshness: "`sendFile` sent `content-type` and nothing else … Now `no-store`" | YES — secondary source of truth, supports AC-977 |
| COMMENT-600 on REQ-115 | — | 2026-07-31 | Settles Deliverable 0 (upstream blocker) and the Node-origin-plus-Worker-front shape | YES |
| REQ-118 (request-66e4c630) | free_and_reconciled | 2026-07-31 | Image selection; added `GET /api/assets` to the workspace origin | YES — but the origin reachability is claimed by STORY-102 / CAP-89 (info #5) |
| REQ-119 (request-64864801) | draft | 2026-07-31 | Request-time draft/edit renders inside control-app; deletes the proxy | NO — draft, not yet active |

Cumulative picture for this capability: REQ-115 establishes the whole surface;
REQ-117 adds the window-fill fix and extends the origin with the edit transport;
REQ-119 has not yet retired anything (the story's "deliberate and temporary"
framing of the Node origin is therefore still correct, not stale).

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-99 — component consumption (installed store, `exports`-derived entry points, never vendored, missing-install diagnostic) | REQ-115 (Deliverable 0, AC 1) + COMMENT-600 | aligned |
| STORY-99 — single workspace origin, control-app front forwards verbatim | REQ-115 (serving section, AC 2/6) + COMMENT-600 | aligned |
| STORY-99 — one tab, fills the window, no page-level scrollbar, one definition site per name | REQ-115 (AC 2, AC 3) + REQ-117 follow-up `94ae6fee` | aligned — REQ-117's follow-up explicitly says "This is T1 (REQ-115) chrome … move it if the reconcile wants the fix attributed to T1"; the shared bundle makes attribution here correct |
| STORY-99 — display panel, modes as entries, mode switch preserves the pane | REQ-115 (AC 7) | aligned |
| STORY-99 — toolbar renders the active mode's declared controls; selector over the real store; publish via existing path | REQ-115 (AC 6, AC 8, AC 9) | aligned |
| STORY-99 — split, drag, collapse-to-rail, namespaced persistence | REQ-115 (AC 4, AC 5) | aligned |
| STORY-99 — freshness over caching (every response non-cacheable) | REQ-117 / COMMENT-601 | aligned — no REQ *body* asks for it, but the operator dialogue on REQ-117 settles it explicitly, and `serve.ts:121` / `builder.ts:173,327` carry it |
| STORY-99 — confinement across all three served trees, clamped so the refusal reads as not-found | REQ-115 ("one implementation means a traversal guard cannot be present on one and missing on another") | aligned |
| STORY-99 — the workspace origin's **edit transport** (`/api/copy`) | REQ-117 ("the loop is closed") | **gap — finding #1: intent asked for it, it shipped on this origin, and no element of this capability expresses it** |
| STORY-99 — Technical Context cross-references | REQ-115 / REQ-117 | **warning — finding #2: points at CAP-84, superseded by CAP-87** |
| STORY-99 — origin failure modes (unconfigured vs unreachable) | REQ-115 (front design) | **warning — finding #3: AC-965 claims it and the code implements it; the story body is silent** |
| STORY-99 — "the origin is temporary; a later phase moves rendering into the Worker" | REQ-119 (`draft`) | aligned — REQ-119 is not active, so nothing here is retired yet |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-99 (story-e674c60a) | story-body-edit | REQ-117 (free_and_reconciled, in bundle-15c1f647 — STORY-99's own intent) records: "**`/api/copy` GET/POST on the builder origin** — a thin transport over `editCopyGet`/`editCopySet` … a `CommandError` is the **expected** answer to a bad edit, so it returns **400** carrying the validator's own `code`/`path`/`hint`". It shipped at `tools/generate/src/cli/builder.ts:225`. STORY-99 does not express it: its origin bullet enumerates the origin's operations as "(listing the store, publishing)", its Out-of-scope pushes "the write path behind it" to other stories, the body contains no occurrence of "transport", "/api" or "endpoint", and none of its 21 ACs covers it. STORY-100 (CAP-86) meanwhile states "The builder workspace (CAP-85 / STORY-99) exposes this same surface over its origin as a thin transport — the same operations, not a parallel implementation". Both stories point at the other; the matrix holds the behaviour nowhere. | Extend STORY-99's workspace-origin bullet so the origin's operations include the edit transport: the origin exposes the write path's read/apply operations as a thin transport that adds no semantics, and a refused edit comes back as an *expected* refusal carrying the write path's own code/path/hint rather than a generic server failure. Keep the ownership split intact — CAP-86 owns the operations and the refusal shape; CAP-85 owns only that they are reachable over this origin in that form. CAP-85's capability body needs the same one-line widening ("listing the store, publishing" → plus the edit transport). An AC will follow at the `ac` level cycle; this finding is the story-body half only. |
| 2 | warning | consistency | STORY-99 (story-e674c60a) | story-body-edit | Technical Context references "CAP-84 (Edit Render Channel)" twice as a live pointer ("channels produced by CAP-82 … and CAP-84", "the editable render belongs to CAP-84"). capability-25f7e486 (CAP-84) has `status: superseded`, `superseded_by_uid: capability-12fee326` (CAP-87), and STORY-98 — the edit render — now carries `capability_uid: capability-12fee326`. | Repoint both references to CAP-87 / STORY-98. (STORY-100 carries the identical stale pointer "CAP-84 / STORY-98"; it is out of this capability's scope but will need the same repair.) |
| 3 | warning | coverage | STORY-99 (story-e674c60a) | story-body-edit | AC-965 (`acceptance_criterion-5286c04b`, active) claims "An unconfigured origin and an unreachable origin are reported as distinct, explanatory failures", and the code implements it (`apps/control-app/src/index.ts:28` — 503 naming `1c builder`; `:45` — 502 naming the unreachable origin). The story body describes the front only as forwarding verbatim and never mentions either failure. The behaviour is intent-supported (REQ-115's front design, COMMENT-600) and is held by the matrix via the AC, so this is under-expression in the body rather than a missing capability. | Add a clause to the single-workspace-origin bullet: a workspace whose origin is not configured and one whose origin is not answering are two different, self-explanatory failures, each naming what to do, rather than one blank page. |
| 4 | info | coverage | REQ-44 | — | REQ-44 is in this capability's bundle but asks for a `1c` CLI dependency preflight, which is not this capability's surface. Its behaviour is expressed by STORY-79 (`story-e15a19ef`, CAP-63, `updated_by: bundle-15c1f647`): "a command that needs a declared runtime dependency to refuse loudly on an installed tree that does not match what is declared". Correctly placed; no CAP-85 gap. | none |
| 5 | info | coverage | REQ-118 | — | REQ-118 added `GET /api/assets` to the workspace origin (`builder.ts:205`). STORY-102 (`story-c46abfa6`, CAP-89) claims it explicitly — "The store answers from the command line and from the builder's own origin" — so the origin reachability is held by the asset-store capability rather than by CAP-85. Deliberate and consistent; no gap. Contrast with finding #1, where no story makes the equivalent claim. | none |
| 6 | info | consistency | STORY-99 freshness bullet | — | No REQ *body* in the ledger asks for non-cacheable responses. COMMENT-601 on REQ-117 settles it directly ("`sendFile` sent `content-type` and nothing else — no `Cache-Control`, no `ETag`, no `Last-Modified` … Now `no-store`"), and the code carries it on every route (`serve.ts:121`, `builder.ts:173`, `builder.ts:327`). Recorded here so a future check does not mistake an intent-body silence for drift. | none |
| 7 | info | consistency | STORY-99 "temporary origin" framing | — | REQ-119 ("Request-time draft and edit renders inside control-app", `draft`) would retire the Node origin + proxy. It is not active, so nothing in the story body is stale on that account. When REQ-119 activates, the Technical Context's serving paragraph is the element that must change — the ACs are written about *one origin* and were deliberately authored to survive it. | none |

## Notes for the Editor

- **Findings #1 and #2 are two halves of the same neighbourhood.** Both live in
  the parts of STORY-99 that describe what surrounds the workspace. The story is
  otherwise unusually well aligned: every one of REQ-115's nine ACs maps onto an
  in-scope bullet, and the two REQ-117 sections that touch the chrome are
  attributed correctly.
- **Do not resolve #1 by widening CAP-85 into the write path.** The gap is the
  *reachability* of the write path over this origin, not its semantics. If a
  later cycle prefers CAP-86 to hold the transport instead, that is a legitimate
  alternative — but then STORY-100's sentence attributing it to CAP-85 must
  change in the same pass. What is not acceptable is the current state, where
  each story names the other as the owner.
- **The stale CAP-84 pointer is cross-cutting.** It appears in STORY-99 and in
  STORY-100's "Relationship to neighbouring capabilities" paragraph. Worth a
  sweep for `CAP-84` across all story bodies when #2 is repaired.
- **Method note.** This capability has exactly one story, so exclusivity was
  checked against the neighbouring capabilities' stories rather than within the
  tree: STORY-101 (CAP-87) defers the workspace to STORY-99 explicitly, STORY-100
  (CAP-86) defers the surface it exposes, and STORY-95/96 (CAP-82) cover the
  separate deployed-snapshot origin. STORY-99's Technical Context already flags
  that the `no-store` change reached the standalone `1c serve` preview server
  those stories own, without claiming it — that divergence note is correct and
  should be preserved as-is.
