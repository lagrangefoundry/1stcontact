---
uid: report-5a4cf7a4
id: REPORT-2101
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=ac)'
created_by: xgd
created_at: '2026-08-16T09:43:06.493421+00:00'
updated_at: '2026-08-16T09:47:16.899946+00:00'
completed_at: null
last_field_updated: body
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: ac
  violations: 3
  warnings: 4
  needs_review_count: 0
---

placeholder - body appended below

TEST-PERMISSION-PROBE

PROBE-LINE-1
PROBE-LINE-2

PROBE-SIZE-TEST. The capability has exactly one story, STORY-99 (story-e674c60a, story_kind upgrade), carrying 30 active ACs. Cross-story exclusivity is therefore trivially satisfied; every question here is whether an AC follows from the body of STORY-99 and whether the 30 collectively cover it. The last ac-level check was REPORT-1626 dated 2026-08-07 with a PASS and zero findings, and it predates almost half of the current AC set. AC-1030 was authored on 2026-08-08. AC-1029, AC-1031 through AC-1036 and AC-1110 were authored on 2026-08-10, together with the REQ-119 rewrite of the STORY-99 body.

PROBE-MULTILINE-MD

**Result**: FAIL
**Violations**: 3

| # | Severity | Element |
|---|---|---|
| 1 | violation | AC-966 |

Cross-story exclusivity is trivially satisfied because the capability has exactly one story. The question at this level is whether each AC follows from the body of STORY-99 and whether the thirty of them collectively cover its behavioural surface without overlapping each other.



(The lines above are permission-probe artifacts from a session in which only append-writes were permitted. The report begins here.)

**CAPABILITY-INTENT ALIGNMENT — Builder Workspace: Chrome, Origin and Display Panel — LEVEL: ac**

**Result**: FAIL
**Violations**: 3
**Warnings**: 4
**Needs review**: 0


The capability has exactly one story — STORY-99 (story-e674c60a, story_kind: upgrade) — carrying **30 active ACs**. Cross-story exclusivity is therefore trivially satisfied; every question at this level is 'does this AC follow from the body of STORY-99, and do the 30 collectively cover it'.

**The last ac-level check was REPORT-1626 (2026-08-07, PASS 0/0/0). It predates almost half the current AC set.** AC-1030 was authored 2026-08-08; AC-1029, AC-1031 through AC-1036, and AC-1110 on 2026-08-10, together with the REQ-119 rewrite of the STORY-99 body from *serving a stored rendering* to *producing the channel on request*. Those seven ACs and the body change have never been ac-checked against each other. Two of the three violations below live exactly in that unchecked window.

**Cascade note.** The story-level cycle for this capability ran about a minute before this check and **FAILED** — REPORT-2100 (report-4d9be4ea, 2026-08-16T09:28Z, 2 violations, 1 warning), unrepaired at the time of writing. Its two violations are coverage gaps whose stated resolution is 'story-body-edit + **ac-add**'. The ac half of that resolution is findings 2 and 3 below. Per the level cascade the STORY-99 body is *not* a clean working reference for those two behaviours, so they are carried forward rather than assumed correct.

**CUMULATIVE INTENT CONSIDERED**

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUNDLE-16 | bundle-15c1f647 | free_and_reconciled | 2026-08-07 (1741ee5d) | REQ-115 + REQ-117 + REQ-44; the intent_uid of STORY-99 | YES |
| REQ-115 | request-a6740b4a | free_and_reconciled | 2026-07-31, merged 08-07 | Builder shell: webui consumption, site tab, multi-mode panel and toolbar. Origin of AC-959 through AC-979 | YES |
| REQ-117 | request-395b67e6 | free_and_reconciled | 2026-07-31, merged 08-07 | Copy editing end-to-end. Contributes to **this** capability: /api/copy as a thin transport on the builder origin, and /framework/edit-client.js type-stripped from the source the renderer is built from | YES |
| REQ-44 | — | free_and_reconciled | 2026-08-07 | Install preflight; builder explicitly ungated — no ask lands here | YES (no ask) |


| BUG-32 | bug-5cabb340 | merged | 2026-08-08 | Component scope rename in lockstep, one definition site, browser-source exception, consumption evidence made unconditional. The window in which AC-1030 was authored | YES |
| REQ-119 | request-64864801 | free_and_reconciled | 2026-07-31, merged 08-10 (BUNDLE-17 0198704b) | **Request-time draft and edit renders.** One render implementation (writer plus reader), *no artifact on disk*, memoised on the definition, invalid draft surfaced, published untouched. Origin of AC-1031 through AC-1036. Its own AC-1 (render inside the edge Worker) explicitly not attempted; deviation declared in STORY-99 | YES |
| BUG-33 | bug-ede1fb8c | free_and_reconciled | 2026-08-10 (f1664c55) | Toolbar re-derives on mode **and** site; a replaced control is a detached, inert survivor. Origin of AC-1110. The only updated_by on STORY-99 | YES |
| REQ-122 | — | free_and_reconciled | 2026-08-10 | Builder chat panel — the *content* of the secondary pane; owned elsewhere, correctly excluded (AC-973 says so explicitly) | YES (elsewhere) |
| REQ-145 / REQ-147 | — | **draft** | 2026-08-15 | control-app becomes the builder, L1 render in workerd, proxy deleted; Access on the app host | NO — not active |
| REQ-112 | — | **abandoned** | 2026-08-08 | — | NO |

REQ-145 being draft is load-bearing: the STORY-99 clause 'the origin runs outside the edge Worker … deliberate and temporary' and the proxy-conditioned clause of AC-964 are **current, not stale**. Confirmed independently of REPORT-2100.

**ALIGNMENT LEDGER**

All 30 ACs are status active, kind behavior, regression_only false. Twenty-five are aligned with no finding: AC-959, AC-960, AC-961, AC-962, AC-963, AC-967, AC-968, AC-969, AC-970, AC-971, AC-972, AC-973, AC-974, AC-975, AC-976, AC-977, AC-978, AC-979, AC-1029, AC-1030, AC-1031, AC-1032, AC-1033, AC-1034, AC-1035, AC-1110. The exceptions and the two gaps are below.



| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-964 one host, nothing reinterpreted | REQ-115, REQ-119 (deviation clause) | aligned; evidence narrower than the criterion — warning 6 |
| AC-965 unconfigured vs unreachable origin | REQ-115, via the capability body | **no story-body anchor** — warning 7 |
| AC-966 view mode byte-identical to the rendered artifact | REQ-115, **superseded by REQ-119** | **stale: contradicts the request-time model; subsumed by AC-1032 and AC-1031** — violation 1, warning 4 |
| AC-1036 channel addresses resolve as before, never outside the channel | REQ-119 | aligned; confinement half duplicates AC-978 — warning 5 |
| *the origin serving the client code of the editing gesture from the source the renderer is built from* | REQ-117 | **gap: no AC** — violation 2 |
| *the copy read/apply transport, semantics-free, over this origin* | REQ-117 | **gap: no AC** — violation 3 |

**Coverage of the STORY-99 body is otherwise complete.** Every in-scope bullet maps to at least one AC: single address to AC-964 and AC-971; components consumed not copied to AC-961, AC-962, AC-963, AC-1030; scope written once to AC-960; one tab filling the window to AC-959, AC-975, AC-976; panel modes to AC-968, AC-969, AC-1029; toolbar to AC-970, AC-967, AC-971, AC-972, AC-1110; request-time channels to AC-1031 through AC-1036; split and persistence to AC-973 and AC-974; freshness to AC-977; confinement to AC-978 and AC-979. The anchoring paragraph in Technical Context, stated there as 'now … a criterion of its own', is AC-1030.



**FINDINGS**

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-966 (acceptance_criterion-4c720b7e) | ac-edit | AC-966 states the served bytes are 'identical to **the rendered artifact** the platform produced … not a placeholder, **a re-generation**, or a differently-serialised copy'. REQ-119 (free_and_reconciled, merged 2026-08-10) replaced exactly that model, and the STORY-99 body now reads 'The draft-side channels are produced on request, not fetched off a shelf … **There is no rendered artifact for the workspace to serve**' and 'one production of a page, with a writer and a reader over it'. The shipped path **is** a re-generation — byte-identical by construction, not by artifact-serving. The exclusion AC-966 makes is therefore false of what ships, and its premise (that an artifact exists to be served) is contradicted by its own sibling AC-1031. The evidence follows the stale wording: tests/reconciliation-builder-workspace-origin.test.ts:114-141 renders to disk in makeWorkspace (:83-91) and compares one page of one channel against storage/dist/sites/alpha/draft/index.html, with the comment 'not a placeholder, a re-generation, or a differently-serialised copy' at :116-117 | Rewrite AC-966 to its one surviving unique claim — *with a site selected, the display panel displays that site rendered in the active mode* — and drop the byte-identity and asset clauses to AC-1032 and AC-1031 respectively (see finding 4). Delete 'a re-generation' from the exclusion list: it names the shipped mechanism |


| 2 | violation | coverage | STORY-99 ACs (all 30) | ac-add | The CAP-85 body scopes here 'the shared client code the editing gesture runs in the displayed page (**served from the same source the renderer is built from, so the two cannot drift**)', and its Out-of-scope section confirms 'this one owns only that those bytes are served from this origin'. REQ-117 (request-395b67e6, free_and_reconciled) built it: tools/generate/src/cli/builder.ts:462-468 serves /framework/edit-client.js type-stripped from packages/framework/src/l1/edit-client.ts. **No AC asserts it.** It appears in this capability only incidentally — one row of the AC-977 cache sweep and one of the AC-979 not-found sweep. The cannot-drift property is proven only under the editing capability, by test_UAT_AC1006_the_browser_runs_one_address_resolution_served_from_the_renderers_own_source (tests/reconciliation-copy-edit-gesture.test.ts:843). Cascaded from REPORT-2100 finding 1 | Author an AC asserting the origin serves the editing client code from the same source the renderer is built from. **Conditional:** if REPORT-2100 finding 1 is resolved in the other direction — narrowing the CAP-85 body to defer the property to the editing capability — this violation dissolves with it and **no AC should be authored**. Pick one owner; do not duplicate AC-1006 |


| 3 | violation | coverage | STORY-99 ACs (all 30) | ac-add | The CAP-85 body scopes here 'carrying the write path read/apply operations as **a thin transport that adds no semantics of its own**, so that a refused edit arrives as an expected refusal in the write path own terms'. REQ-117 built /api/copy GET and POST (tools/generate/src/cli/builder.ts:371) over the same functions the CLI dispatches to. **No AC asserts it.** Within this capability /api/copy appears only as two probe rows in the AC-977 cache sweep (tests/reconciliation-builder-workspace-origin.test.ts:311-317); the refusal shape is proven only under the editing capability, by test_UAT_AC999_a_refused_edit_shows_its_own_reason_and_leaves_page_and_draft_unchanged (tests/reconciliation-copy-edit-gesture.test.ts:611). Cascaded from REPORT-2100 finding 2 | Author an AC about **reachability and semantics-freeness only** — the origin dispatches to the same functions the CLI does and passes the refusal through unchanged — never re-asserting the *content* of the refusal, which belongs to the write-path capability. Same conditional as finding 2 |
| 4 | warning | exclusivity | AC-966 vs AC-1032 (acceptance_criterion-46534535) and AC-1031 (acceptance_criterion-e9a9ba3b) | ac-edit | After REQ-119 the evidence for AC-966 is a strict subset of the evidence for AC-1032, in the same test shape. AC-966: render alpha, fetch /preview/alpha/draft/, compare to the file on disk, then compare the .css and .js siblings. AC-1032: for **both** draft-side channels, run the platform render, compare **every** text artifact byte-for-byte including theme.css, and assert the channel root equals the bytes of index.html (tests/reconciliation-builder-request-time-render.test.ts:217-268). The asset clause of AC-966 ('assets the page references likewise resolve over the same origin') is the second assertion of AC-1031 (:193-207), which additionally reads the stylesheet href *out of the document* rather than globbing the directory | Fold as in finding 1: AC-966 keeps the display-panel binding, AC-1032 owns byte-equality, AC-1031 owns whole-page asset resolution. If nothing unique survives the fold, ac-deprecate AC-966 instead and record that AC-1032, AC-1031 and AC-967 succeed it |