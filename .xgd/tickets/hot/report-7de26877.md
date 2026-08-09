---
uid: report-7de26877
id: REPORT-1737
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=story)'
created_by: xgd
created_at: '2026-08-09T15:06:17.839995+00:00'
updated_at: '2026-08-09T15:06:17.839995+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 3
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: story

**Result**: FAIL
**Violations**: 0
**Warnings**: 0
**Needs review**: 3

## Cumulative Intent Considered

CAP-85 (`capability-a994b8f3`) carries no `intent_uid`/`updated_by` of its own. The
ledger below is compiled from its single story, STORY-99 (`story-e674c60a`):
`intent_uid = bundle-15c1f647` (BUNDLE-16 = REQ-117 + REQ-115 + REQ-44),
`updated_by = [bug-5cabb340 (BUG-32), sprint-9006c5b0 (a sprint, not an intent)]`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-44 (`request-3b78151f`) | free_and_reconciled | 2026-07-03 | Tooling hygiene: `pnpm install` after lockfile change; fail loud on out-of-sync `node_modules`. Not a CAP-85 behaviour. | YES (out of this capability) |
| REQ-115 (`request-a6740b4a`) | free_and_reconciled | 2026-07-31 | **The core CAP-85 ask.** Deliverable 0 (webui consumed from the shared artifact store via each package's own `exports`, never copied, missing-install diagnostic naming the component + command); Node origin with `control-app` as a same-origin verbatim front; chrome document, `/webui/<pkg>/*`, `/api/sites`, `/api/publish`, `/preview/<slug>/<channel>/*`; shell with single `site` tab; tab label one definition site; split + divider + collapse-to-rail + reopen; namespaced layout persistence; view mode = real rendered site; mode-as-entry with pane preserved; toolbar declared by the active mode; open-in-new-tab ≡ iframe src; publish via the existing path; shared `resolveStaticFile` so a traversal guard cannot be present on one tree and missing on another. ACs 1–9. | YES |
| REQ-117 (`request-395b67e6`) | free_and_reconciled | 2026-07-31 | Copy editing end-to-end (mostly the *editing* capability, out of scope here). Two sections are CAP-85 chrome and are explicitly flagged as such in the ticket ("This is T1 (REQ-115) chrome, not copy editing… move it if the reconcile wants the fix attributed to T1"): the **viewport-fill follow-up** (`tabs[].fill`, `TABS` entry passed through unnarrowed, `body` forbids a page-level scrollbar, frame tracks window height across a live resize) and the **origin-as-thin-transport** additions (`/api/copy` GET/POST over the same `editCopyGet`/`editCopySet` the CLI dispatches to, returning **400** with the validator's own `code`/`path`/`hint`; `/framework/edit-client.js` type-stripped from the renderer's own source so the two cannot drift). | YES |
| BUNDLE-16 (`bundle-15c1f647`) | free_and_reconciled | 2026-08-07 | Bundle wrapper; `merged_at_commit = 1741ee5d1d20eb5ff9bb81564ed3c088ff47731f`. | YES (wrapper) |
| BUG-32 (`bug-5cabb340`) | merged | 2026-08-05 (completed 2026-08-08) | Rebranding gap: `WEBUI_SCOPE` `@gendevlabs` → `@lagrangefoundry` in lockstep with upstream. The scope gets **exactly one definition site**; the builder's browser sources are the declared exception (served verbatim, cannot read a build-time value) and are held in step by requiring every bare specifier to have a matching import-map key; the tracked `index.html` chrome artifact is **deleted** rather than updated (a second definition site); evidence must be **positive and unconditional** because a presence-check skip gate reports "renamed upstream, not renamed here" and "never installed" identically. | YES |
| REQ-119 (`request-64864801`) | free_coded | — | Request-time draft/edit renders inside `control-app` (deletes the proxy; the staleness class). | NO (not reconciled) |
| REQ-122 (`request-58b6a329`) | free_coded | 2026-08-07 | Builder chat panel — occupies the secondary pane STORY-99 holds as a placeholder. Its body is also the only place in the store that names the linked-worktree resolution problem and an unreachable origin surfacing as a message. | NO (not reconciled) |
| BUG-33 (`bug-…`) | draft | 2026-08-08 | Six red builder suites, incl. `test_UAT_FC_REQ-115_open_in_new_tab_matches_the_iframe_exactly` (stale DOM handle in the test, not a product defect). | NO (draft) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-99 (`story-e674c60a`, `story_kind=upgrade`, status `completed`) | REQ-115, REQ-117 (chrome sections), BUG-32 | **aligned on the intent-backed surface** — every one of REQ-115's ACs 1–9, both of REQ-117's CAP-85 sections, and BUG-32's one-definition-scope ask are expressed in the story body and reach the AC tree. **3 blocks of the story body carry no intent in the ledger** — see findings 1–3. |

Intent-backed coverage, verified item by item (REQ-115 AC → STORY-99 AC):
1 → AC-961/962/963 · 2 → AC-959 · 3 → AC-960 · 4 → AC-973 · 5 → AC-974 ·
6 → AC-964/966/967 · 7 → AC-968/969 · 8 → AC-971 · 9 → AC-972 ·
toolbar → AC-970 · edit mode registered → AC-1029 (REQ-115 "Edit mode ships
registered, not absent") · REQ-117 viewport fill → AC-975 · REQ-117 tab spec
unnarrowed → AC-976 · REQ-115 traversal → AC-978.

**Exclusivity**: CAP-85 holds exactly one story, so no two stories can cover
overlapping intent. Nothing to report.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | needs_review | consistency | STORY-99 (`story-e674c60a`), body bullet "**Freshness over caching**"; AC-977 | — | The story requires every response the workspace origin returns — the workspace document included — to be served **non-cacheable**, and states that one exempt response is enough to leave an operator on a stale page. **No intent in the ledger asks for this.** A full-body scan of all 119 requests and 32 bugs for `no-store\|no-cache\|non-cacheable\|Cache-Control\|cacheab\|freshness` returns no hit for REQ-115, REQ-117, REQ-44 or BUG-32, and no hit in any of their comments. The only counted intent that legislates caching is REQ-111 (public-site Worker), which belongs to a different capability and prescribes the *opposite* (`Cache-Control: public, max-age=…`). REQ-119 (request-time renders, "the staleness class, closed") is the nearest match and is `free_coded`, so it does not count. The story's own Technical Context half-acknowledges the orphan — "That server's own intent says nothing about caching" — but only about the *local preview server*, never about where the workspace origin's own requirement came from. Cannot determine whether this is active intent recorded nowhere, or implementation behaviour absorbed into the matrix without an ask. | Escalate to operator: confirm the non-cacheable requirement for the workspace origin and record it against an intent (REQ-115 body amendment or a new ticket), or retire AC-977 and the story bullet |
| 2 | needs_review | consistency | STORY-99 (`story-e674c60a`), Technical Context block "**Resolving the store from a detached working tree is a route correction…**"; AC-1030 | — | The story states a four-branch anchoring rule as a criterion in its own right (main checkout anchors to itself; a linked working tree anchors to the main checkout its shared repository directory belongs to, never to itself; a pointer naming no shared directory anchors to the directory holding it; a location under no checkout anchors to where the walk began), plus the derived test-runner aliases and the "anchor settled once per run" rule. **No counted intent describes it.** BUG-32 — the intent that owns component resolution — covers the scope rename and the anti-silent-green principle but says nothing about working-tree anchoring, in body or comments; REQ-115's Deliverable 0 says only that ordinary Node upward resolution finds the store. The only ticket in the store that names the problem is **REQ-122** ("a bare specifier would find the shared store from the main checkout and nothing from a linked worktree"), which is `free_coded` and therefore does not count. The story presents this as a correction discovered because "nine of this story's criteria… lost their evidence in every working tree *while reporting green*" — consistent with BUG-32's principle, but the specific four-branch rule is an ask no intent makes. | Escalate to operator: attribute the anchoring rule to an intent (extend BUG-32, or promote REQ-122's resolution half), or confirm it is implementation detail that should not carry an AC |
| 3 | needs_review | consistency | STORY-99 (`story-e674c60a`); AC-965 | — | AC-965 requires an **unconfigured** origin and an **unreachable** origin to be reported as distinct, self-explanatory failures rather than a blank page (mirrored in the CAP-85 body). **No counted intent asks for this failure taxonomy.** REQ-115 specifies the `control-app` front only as "forwards verbatim; the origin owns routing, status and content types" — it is silent on what the front does when the origin is missing or down. A scan for `unconfigured origin\|unreachable origin\|BUILDER_ORIGIN` across all request and bug bodies hits **only REQ-122** (`free_coded`), and there it is the *chat panel* surfacing an unreachable origin as a message, not the workspace front. Note the story body itself never states this behaviour either — AC-965 has no parent text in the story, which is why it surfaces at story level rather than as an AC-level consistency finding. | Escalate to operator: record the unconfigured-vs-unreachable requirement against an intent and add the matching text to the story body, or retire AC-965 |

## Notes for the Editor

**The pattern behind all three findings is the same, and it is worth treating as
one question rather than three.** Each is a behaviour that is (a) real and shipped,
(b) inside the CAP-85 scope statement as the capability body currently reads, and
(c) traceable to no intent ticket. All three are plausibly implementation
discoveries from the REQ-115 / BUG-32 sessions that were reconciled into the story
and the capability body without ever being folded back into an intent — which is
exactly the drift this check exists to catch, and exactly the case the prompt says
to escalate rather than guess. There is in-repo precedent for the correct fix:
REQ-117's viewport-fill follow-up was an identical mid-session discovery, and it
*was* written into the intent body (with an explicit "move it if the reconcile
wants the fix attributed to T1" note). Findings 1–3 are the same shape with that
step missing.

**Two of the three have an obvious owner if the operator wants to close them
without new tickets**: finding 2 sits naturally on BUG-32 (it is the same
anti-silent-green argument BUG-32 already makes, applied to a second failure mode),
and findings 1 and 3 sit naturally on REQ-115 (both are properties of the origin
and its front, which REQ-115 owns outright).

**Do not treat `free_coded` intents as cover.** REQ-119 and REQ-122 between them
mention every one of the three orphaned behaviours, which makes it tempting to call
the gaps closed. Per the status table `free_coded` is neither reconciled nor
imminent, so their asks are not part of cumulative intent yet. If the operator
reconciles either, findings 1–3 may resolve on their own — worth checking before
authoring anything new.

**Adjacent, not raised as a finding**: AC-979 ("a request for a rendering channel
or a component the workspace does not serve is answered as not found") is likewise
not named by any intent, but it follows directly from REQ-115's declared route set
and the shared `resolveStaticFile` behaviour REQ-115 does specify, so it is read
here as a corollary rather than an orphan. Flagging it only so a downstream editor
does not rediscover it and assume it was missed.

**Evidence-health observation, outside this level's remit**: CAP-85 carries
`fields.uat_coverage = pass`, while BUG-33 (`draft`, 2026-08-08) records six red
builder suites — one of them
`test_UAT_FC_REQ-115_open_in_new_tab_matches_the_iframe_exactly`, the sole evidence
for AC-971. BUG-33 attributes it to a stale DOM handle in the test rather than a
product defect. This is a `uat`-level concern and is recorded here only so the
story-level ledger notes that AC-971's evidence was red at the time of this check.

**Method note (environment).** The ticket index in the canonical store is at
version 14 while the installed xgd (0.15.145) expects `INDEX_VERSION = 15`, so every
index-backed read forces a rebuild and contends with the long-running dashboard and
dispatcher daemons; `xgd ticket list`, `xgd ticket get --related`, `xgd ticket
comments` and `xgd capability web` all failed with
`index_fcntl_lock: timed out … __cold_index__.flock` / `__hot_index__.flock`
throughout this run. Every ticket read behind this report was therefore taken
through the sanctioned `xgd_source.core.ticketing` module on its index-free scan
path (`_list_from_scan` over `sources.query_sources`, plus per-ticket
`ticketing.get`), which is the documented fallback for a stale or contended index.
No ticket file was read or written directly, and nothing in the store was modified.
The story tree, AC tree, all 151 request/bug bodies and the comments on REQ-115,
REQ-117, BUG-32 and BUNDLE-16 were all read successfully, so this report's coverage
is complete despite the degraded tooling — but the index-version mismatch is worth
an operator's attention independently of this check.
