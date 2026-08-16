---
uid: report-5a4cf7a4
id: REPORT-2101
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=ac)'
created_by: xgd
created_at: '2026-08-16T09:43:06.493421+00:00'
updated_at: '2026-08-16T09:46:56.326984+00:00'
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