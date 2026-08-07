---
uid: report-774ff873
id: REPORT-1623
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=story)'
created_by: xgd
created_at: '2026-08-07T20:36:02.910218+00:00'
updated_at: '2026-08-07T20:36:02.910218+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-17a279f7 · Capability: capability-a994b8f3 (CAP-85) ·
Story tree: STORY-99 (story-e674c60a) only · Attempt 4 (prior: report-c5a97ce2
FAIL → fix report-6d2f7dbd; report-472feebd FAIL → fix report-b7fbc162;
report-3536002c FAIL → fix report-fda1e9db).

**Headline: attempt 3's restore is genuine and verified against the blob, not
the CLI read.** All four of attempt 3's findings are closed, and the regression
mechanism that produced attempts 2 and 3 (a write from a stale read silently
deleting a prior attempt's passages) did not recur — the committed body is a
strict superset of both parent blobs.

Proof, re-derived independently this attempt from git rather than from the fix
report's own claims:

| Check | Command | Result |
|---|---|---|
| HEAD ⊇ attempt-1 body | `git diff a1f3e5f70 HEAD -- .xgd/tickets/hot/story-e674c60a.md` | **zero content deletions** — only attempt-2's additions appear |
| HEAD ⊇ attempt-2 body | `git diff 4b8553945 HEAD -- …` | 4 deletions, all four exactly the ones report-3536002c asked for (two sentence continuations superseded by the restored longer text; the two `CAP-84` lines) |
| Body integrity | blob 12281 B vs parents 11295 / 10511 | union, not replacement |
| Markers | `transport` = **5**, `CAP-87` = **2**, `CAP-84` = **0** | hits report-3536002c's stated targets exactly |
| Working tree | `git status --porcelain` | clean |

**Read-method note, confirmed:** `xgd ticket get` (including `--json`) returns
the body truncated at 11745 chars; the on-disk blob is 12281 bytes. The API read
is a strict prefix of the file (verified by substring test), so a grep over the
CLI read reports the tail passages as missing when they are present. Every
verification below was run against `git show HEAD:.xgd/tickets/hot/story-e674c60a.md`.

## Cumulative Intent Considered

STORY-99 carries `intent_uid: bundle-15c1f647` (BUNDLE-16, `free_and_reconciled`,
`merged_at_commit 1741ee5d`) and no `updated_by`. A bundle is not itself an ask,
so the ledger is walked at request/bug level. Re-derived independently this
attempt across all 112 requests and all 31 bugs (the bug sweep, added at attempt
3, is retained — it is what surfaces BUG-32). No intent outside the set below
touches this capability.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-44 (request-3b78151f) | free_and_reconciled | 2026-07-03 | `1c` CLI dependency preflight; fail loud on out-of-sync `node_modules`. Its own body lists `builder` among the **ungated** offline verbs | YES — but lands outside this capability (info #2) |
| REQ-115 (request-a6740b4a) | free_and_reconciled | 2026-07-31 | T1 builder chrome: webui consumed from the installed artifact store through each package's `exports`, Node origin + `control-app` same-origin front, `site` tab, multi-mode display panel, mode-declared toolbar, split + namespaced persistence, shared `resolveStaticFile` confinement, publish through the existing path | YES — the primary intent for this capability |
| COMMENT-600 on REQ-115 | — | 2026-07-31 | Settles Deliverable 0 and the Node-origin-plus-Worker-front shape (the three-way spike that rejected both Worker bundler routes) | YES — secondary source of truth |
| REQ-116 (request-41796766) | free_and_reconciled | 2026-07-31 | The edit render channel | context only — owned by CAP-87 / STORY-98 |
| REQ-117 (request-395b67e6) | free_and_reconciled | 2026-07-31 | T3 copy editing end-to-end. Three recorded sections touch this capability: the viewport-fill follow-up (`94ae6fee`), "the loop is closed" (`cda7fe4d` — `/api/copy` and `/framework/edit-client.js` on this origin), and the freshness fix | YES (the chrome/origin parts) |
| COMMENT-601 on REQ-117 (comment-40779c8d) | — | 2026-08-01…08-06 | Operator dialogue settling freshness. Read in full this attempt: `sendFile` "sent `content-type` and nothing else … Now `no-store`", then `65b9be7a` — "the shell at `/` is the only response still cacheable … a hole in exactly one response is worse than none". Also records that a save re-renders **both** channels (write-path scope, not this capability's) | YES — the sole intent source for the freshness bullet / AC-977 |
| REQ-118 (request-66e4c630) | free_and_reconciled, `main_sha b2b9208c` | 2026-07-31 | Image selection; added `GET /api/assets` to this origin | YES — origin reachability claimed by STORY-102 (`story-c46abfa6`, capability-b4ac88fc), verified this attempt (info #3) |
| BUG-32 (bug-5cabb340) | **free_coded** | 2026-08-05 | Component npm scope `@gendevlabs` → `@lagrangefoundry`; `WEBUI_SCOPE` one definition site; browser-source bare specifiers coupled to import-map keys; webui suites assert resolution instead of skipping green | **NO — not yet** (info #1). `free_coded` is FREE-CODING.md's stable resting state; `fields.commits[].main_sha` is null. Re-confirmed absent from this branch: `tools/generate/src/cli/webui.ts:33` still reads `WEBUI_SCOPE = '@gendevlabs'` |
| REQ-119 (request-64864801) | draft | 2026-07-31 | Request-time renders inside `control-app`; deletes the proxy | NO — draft, retires nothing yet |

Cumulative picture, unchanged: REQ-115 establishes the whole surface; REQ-117
adds the window-fill fix, the edit transport, the served edit bridge and the
freshness directive; COMMENT-601 closes freshness over every response including
`/`. **Nothing has been retired**, so the story's "deliberate and temporary"
framing of the Node origin remains correct while REQ-119 is `draft`.

## Prior attempts — final disposition

| Repair | Claimed by | Verified now |
|---|---|---|
| A1 #1 — origin's operations + edit transport + expected-refusal shape | attempt 1, reverted at attempt 2, restored at attempt 3 | **Present.** Body: "The same origin also carries the operations the workspace performs on a site — listing the store, publishing, and the read-and-apply steps of the write path … as a thin transport that adds no semantics of its own", plus "a refused edit arrives as an *expected* refusal carrying the write path's own code, path and hint" |
| A1 #2 — CAP-84 → CAP-87 | same path | **Present.** "produced by CAP-82 (Site Delivery) and CAP-87 (In-Page Copy Editing)"; "belongs to CAP-87 (STORY-98)". `CAP-84` occurs 0 times |
| A1 #3 — "An origin that is missing is not a blank page" | same path | **Present**, in its original position after the *single workspace* bullet |
| A1 #4 — "The edit transport is one seam, claimed once" | same path | **Present** in Technical Context |
| A2 #1/#2 — `NO_STORE` in `builder.ts` | attempt 2 | **Present and re-verified in code**, not re-litigated: `:130` defines it; applied at `:148` (`json`), `:187` (the hand-written shell at `/`, with the comment naming the one-hole hazard COMMENT-601 describes), `:303`, `:343`, `:356`, `:369`, `:393`, `:397` |
| A2 #4 — served client code + tab-declaration integrity | attempt 2 | **Present** and untouched by attempt 3's merge |
| A2 #6 — AC-977 widened | attempt 2 | **Present** |
| A3 #5 — the read/write regression mechanism | attempt 3 | **Closed.** Verified by the two-way diff above, not by the fix report's assertion |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-99 — component consumption (installed store, `exports`-declared entry points, never vendored, missing-install diagnostic) | REQ-115 D0 + COMMENT-600 | aligned — `webui.ts:46-60` resolves via `require.resolve` on the package spec then walks to its `package.json`, throwing `MissingWebuiComponentError` |
| STORY-99 — the implicit-dependency coverage gap ("suites skip with a stated, reported reason") | REQ-115 "Known cost, accepted and made visible" | aligned — `tests/req115-builder-composition.test.ts:26` warns the reason, `:77/:136/:190` are `describe.skipIf`. Correct **for this branch**; BUG-32 changes it on promotion |
| STORY-99 — single origin serving document / components / browser source / served edit bridge / every channel | REQ-115 + REQ-117 "the loop is closed" | aligned |
| STORY-99 — the origin's *operations*: list the store, publish, and the write path's read/apply as a thin transport whose refusal is expected | REQ-117 "the loop is closed" | **aligned (attempt-3 restore held).** Ships at `builder.ts:239` (`/api/copy`), `:371-378` (`CommandError` → **400** + `err.toEnvelope()`, with the comment "a CommandError is the EXPECTED answer to a bad edit") |
| STORY-99 — unconfigured vs unreachable origin are distinct self-explanatory failures | REQ-115 front design + COMMENT-600 | **aligned (attempt-3 restore held).** AC-965 (`acceptance_criterion-5286c04b`, `active`) again has its story body; ships at `apps/control-app/src/index.ts:26-33` (503 naming `1c builder`) and `:44-49` (502 naming the origin tried) |
| STORY-99 — "Displays, never produces" / "the editable mode is registered" pointers | REQ-116 → CAP-87 (capability-12fee326) | **aligned (attempt-3 restore held)** |
| STORY-99 — the transport seam is claimed once from each side | REQ-117 + STORY-100 (story-37a3921b) | **aligned.** STORY-100 (capability-f753cecd) says "The builder workspace (CAP-85 / STORY-99) exposes this same surface over its origin as a thin transport — the same operations, not a parallel implementation"; STORY-99 now carries the matching half. Claimed exactly once from each side |
| STORY-99 — one tab, fills the window, follows a live resize, page never scrolls; declaration integrity | REQ-117 follow-up `94ae6fee` | aligned (AC-959, AC-975, AC-976) |
| STORY-99 — one definition site for every name | REQ-115 AC 3 | aligned (AC-960) |
| STORY-99 — display panel, modes as entries, switch preserves the pane | REQ-115 AC 7 | aligned (AC-968, AC-969) |
| STORY-99 — toolbar renders the active mode's declared controls; selector over the real store; open-in-new-tab; publish via the existing path | REQ-115 AC 6, 8, 9 | aligned (AC-966, 967, 970, 971, 972) |
| STORY-99 — split, drag, collapse-to-rail, namespaced persistence | REQ-115 AC 4, 5 | aligned (AC-973, AC-974) |
| STORY-99 — freshness: every response non-cacheable, workspace document included | REQ-117 / COMMENT-601 (`65b9be7a`) | aligned in body, evidence and code |
| STORY-99 — confinement across all three trees, clamped so the refusal reads as not-found | REQ-115 | aligned (AC-978, AC-979); the technical-context note that `resolveStaticFile`'s explicit forbidden branch (`builder.ts:393`) is unreachable for URL-derived paths documents what ships |
| STORY-99 — divergence note: `no-store` also reached `1c serve` (STORY-95/96) | COMMENT-601 | aligned — flagged, not absorbed. Preserve verbatim |
| STORY-99 — "the origin is temporary" | REQ-119 (`draft`) | aligned — nothing retired yet; `apps/control-app/src/index.ts:12-16` carries the same framing |
| STORY-99 out-of-scope bullet (merged from both parents) | REQ-117 | aligned — carries both "in what shape its answers arrive" and "never what that code does once it runs", drawing the CAP-86 and CAP-87 lines correctly |
| CAP-85 body | REQ-115 + REQ-117 | aligned — and STORY-99 no longer contradicts it |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | STORY-99 ACs (all 21 `active`) | `ac-add` | **No AC covers the edit transport.** The behaviour is now expressed in the story body (attempt-3 restore) and ships at `builder.ts:239` / `:371-378`, but none of AC-959…AC-979 addresses the reachability of `/api/copy` over this origin or the shape of its refusal. This was attempt 1's deferred half, re-forwarded by attempts 2 and 3 as `info` while it was blocked behind the story-body gap. That gap is closed, so the item is **unblocked** — raised to `warning` here so the AC cycle cannot drop it. It does not fail this level: the repair shape is `ac-add`, which is an ac-level action | Author one AC at the AC level covering *reachability and the shape of the refusal* — the write path's own `code`/`path`/`hint` arriving as an expected 400 — and **never** what the write path validates (that is CAP-86 / STORY-100). Do not repair by widening the story body |
| 2 | info | coverage | BUG-32 (bug-5cabb340), `free_coded` | — | Squarely CAP-85 scope (component npm scope, `WEBUI_SCOPE` one-definition-site, browser bare specifiers coupled to import-map keys, webui suites asserting instead of skipping green). Correctly **not counted**: `free_coded` is the stable resting state, `main_sha` is null, and `tools/generate/src/cli/webui.ts:33` on this branch still reads `WEBUI_SCOPE = '@gendevlabs'`. Recorded so the reconcile after its promotion knows it lands here — on the "consumed not copied" bullet, the implicit-dependency technical-context note, and probably AC-961/962/963 | none |
| 3 | info | coverage | REQ-44 | — | In this capability's bundle but asks for a `1c` CLI dependency preflight; its own body lists `builder` among the ungated offline verbs. Expressed by STORY-79 (`story-e15a19ef`, capability-aa030c83), which carries `updated_by: bundle-15c1f647` — re-verified this attempt. Correctly placed; no CAP-85 gap | none |
| 4 | info | coverage | REQ-118 / `/api/assets` | — | `GET /api/assets` (`builder.ts:219`) is claimed by STORY-102 (`story-c46abfa6`, capability-b4ac88fc), re-verified. STORY-99 enumerating only the operations this capability owns is deliberate and consistent | none |
| 5 | info | consistency | STORY-100 (story-37a3921b) | — | Still names "the edit render channel (CAP-84 / STORY-98)" — the same superseded pointer STORY-99 has now fixed, in a different capability's story (capability-f753cecd). Forwarded by attempts 1–3; re-confirmed present. Out of this capability's scope; sweep when CAP-86 is validated | none here |
| 6 | info | exclusivity | STORY-99 vs STORY-100, STORY-101, STORY-102 | — | Checked across neighbouring capabilities, since CAP-85 has one story. STORY-101 (`story-3bf94bd4`, capability-12fee326) explicitly **depends on** STORY-99 "for the page on screen, the View/Edit modes and the single origin" and claims none of it; STORY-100 holds the write-path semantics and names STORY-99 for the transport only; STORY-102 claims the asset listing. No overlap | none |

## Notes for the Editor

- **Nothing to repair at this level.** This report is a PASS; finding #1 is a
  warning whose action shape belongs to the AC cycle. Do not open STORY-99's
  body to close it — widening the story body to describe the transport more is
  not the gap; an AC is.

- **Do not touch the code.** There is no `code-issue` in this report. Attempt 2's
  `NO_STORE` fix and attempt 3's zero-code discipline were both re-verified
  against the source this attempt; the working tree is clean.

- **Read STORY-99 from the blob, not the CLI.** `xgd ticket get` — `--json`
  included — truncates the body at 11745 chars, and STORY-99 is 12281 bytes. The
  truncation is silent in the JSON path (no marker), which is a live hazard for
  any future session that greps the read to verify a passage. Use
  `git show HEAD:.xgd/tickets/hot/story-e674c60a.md`. This is very likely the
  root cause of the attempt-2 stale-read regression, and it has not been fixed —
  only worked around procedurally.

- **`.xgd/tickets/` remains sparse-checkout-excluded** in this worktree
  (`git sparse-checkout list` carries `!/.xgd/tickets/`) even though the files
  are currently materialised. The next session that edits a non-materialised
  ticket here inherits the same hazard. Diff before and after every ticket write.

- **The bug sweep is now part of this capability's method.** Attempts 1 and 2
  swept `type=request` only; BUG-32 surfaced only when `type=bug` was added at
  attempt 3. Retained here and re-run. Future cycles on CAP-85 should sweep both.

