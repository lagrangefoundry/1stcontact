---
uid: report-7e5523fa
id: REPORT-3799
type: report
title: 'Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations (level=ac)'
created_by: xgd
created_at: '2026-09-10T21:13:11.234186+00:00'
updated_at: '2026-09-10T21:13:11.234186+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-7e4714b7
  level: ac
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

Note on `previous_attempt_count = 1`: no prior `capability_validation` report at
**level=ac** exists for `capability-7e4714b7` in this regression. The three
2026-08-16 reports (REPORT-2068/2069/2070, all zero-violation) predate the story
body's BUNDLE-20/BUNDLE-21 reconciliation of 2026-08-31 and are not evidence
about the tree being checked here. What *did* run immediately before this call is
the **story-level** cycle of 2026-09-10: REPORT-3795 (1 violation, 2 warnings) →
REPORT-3796 (fix, 4 body mutations) → REPORT-3798 (0 violations, pass). This
assessment therefore takes the **post-fix** story body as its working reference,
per the level cascade, and re-verified that the three repaired passages are
consistent with the criteria that depend on them.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Statuses re-read
this call from the ticket store (`--type request` / `--type bug`); they agree
with the ledger REPORT-3798 passed on.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-122 | free_and_reconciled | 2026-08-07 | Created the capability: one session per site, declared-tools-only, capability/open/turn routes, transcript storage, layered priming, failures reported not swallowed | YES |
| REQ-123 | free_and_reconciled | 2026-08-07 | System KB reaches the session read-only from the *same* toolbox; map-first priming; degradation-not-failure | YES |
| REQ-126 | free_and_reconciled | 2026-08-08 | The control surface as data (owned elsewhere); source of the recorded refusal-specificity divergence | YES (context) |
| REQ-127 | free_and_reconciled | 2026-08-08 | Withdrew REQ-122's `{slug, text}` turn **and** its own scope-predicate clause; located the binding in the session | YES (supersedes) |
| REQ-131 | free_and_reconciled | 2026-08-11 | Per-turn change signal — owned by CAP-99 / STORY-115, not here | YES (elsewhere) |
| REQ-143 | free_and_reconciled | 2026-08-15 | The Cloudflare SiteStore (D1 + R2), account-scoped — the store this story's transcript is written through | YES (upstream) |
| REQ-146 | free_and_reconciled | 2026-08-15 | Host moves into workerd. AC1 turn-on-deployed-host, AC2 resume, AC3 durable audit, AC4 redaction, AC5 build-time bundling + loud build failure, AC6 no-fs import graph, AC7 publish unreachable | YES |
| REQ-149 | free_and_reconciled | 2026-08-17 | Deploy-secret guard: ask the deployment, not the shell | YES |
| BUG-38 | free_and_reconciled | 2026-08-24 | Deleted the per-process registry; resolution made durable and account-scoped | YES (supersedes AC-1055's earlier verification) |
| BUG-39 | bundled | 2026-08-24 | The model double must speak the streaming contract | imminent (harness only) |
| REQ-158 / REQ-159 / REQ-160 | draft | 2026-08-28→30 | KB in the Worker, tenant-scoped corpus, session seeding | NO (not active) |
| REQ-134 | abandoned | 2026-08-12 | Image-generation component | NO |

No **Step 2.5** case arose: no AC in this tree names a delivery-vehicle ticket at
all, and every ticket the *story* body cites (REQ-122/123/126/127/143/146/149,
BUG-38) is `free_and_reconciled`. BUG-39 is `bundled`/imminent and creates no
durable behavioural intent — it is a test-double correctness item, already
recorded in the story body's evidence caveats.

## Alignment Ledger

Story: **STORY-103** (`story-a58a0974`), `story_kind = upgrade`, 23 active ACs,
0 deprecated. Upgrade stories are matrix members and are expected to carry ACs —
the coverage check applies in full.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1051 capability answer | REQ-122 | aligned. Story body *Reconciliation Decisions* explicitly holds this criterion unchanged and records the local-transport asymmetry as flagged-elsewhere (CAP-85), not as a criterion here. Its not-ready branch is verified under AC-1060 rather than restated — correct, not a gap. |
| AC-1052 open a conversation | REQ-122, REQ-127 | aligned with In-scope *Opening a conversation for a site*, including "opening the same site again is the same conversation". |
| AC-1053 turn addressed to a conversation | REQ-122→REQ-127 (superseded) | aligned. Reflects the **amended** intent: the turn carries a conversation identifier, not `{slug, text}`. The retired site-named form is the refused case. |
| AC-1054 turn streams, one completion, change in draft | REQ-122 | aligned with In-scope *Running a turn*. |
| AC-1055 identifier naming no site this account holds is refused | REQ-127 → BUG-38 (supersedes) | aligned. Carries BUG-38's restatement verbatim in shape: derivable-for-a-held-site now **resolves**, and the per-origin refusal shapes are stated — matching the BUNDLE-21 decision and the story body's post-fix "in the shape that origin's own answer takes". |
| AC-1056 two sites are two conversations | REQ-122, REQ-127 | aligned with In-scope *Binding*. |
| AC-1057 stored through the site's store, replayed after the host is gone | REQ-146 AC2 | aligned. Carries the BUNDLE-20 decisions verbatim: "through the store the site belongs to" (not the directory), and the junction's cost stated *inside* the criterion. |
| AC-1058 every operation granted, takes no site, reaches no path | REQ-122, REQ-127, REQ-123 | aligned with In-scope *Binding* + *What the assistant is told about itself*. |
| AC-1059 refusal handed back inside the turn | REQ-122, bounded by REQ-126 | aligned. Asserts the class-level named refusal + correction and does **not** claim the per-call path, exactly as the story body's *Known divergence* paragraph requires. |
| AC-1060 assistant that cannot run is explained | REQ-122 | aligned with In-scope *Honest failure*. |
| AC-1061 failure after streaming begins | REQ-122 | aligned. |
| AC-1317 corpus from the same granted surface | REQ-123 | aligned with In-scope *What it can look up* and the *Two surfaces, one toolbox* context. |
| AC-1318 read-only grant, both scope axes from one declaration | REQ-123 | aligned with *One declaration fills both scope axes*. |
| AC-1319 primed with the map and the manual, in order | REQ-123 | aligned with *Priming order is load-bearing*. |
| AC-1320 no KB is ordinary and silent; a broken one is reported | REQ-123 | aligned with *Degradation is not failure*, including the deployed host as the third instance of the ordinary state. |
| AC-1404 whole turn on the deployed host, key from deploy secret | REQ-146 AC1 | aligned with In-scope *Where the conversation runs*. Its second paragraph (missing credential costs a turn, not the conversation) restates AC-1060 scoped to the deployment's secret store; recorded as principled, not duplicate — see *Exclusivity* below. |
| AC-1405 one language-neutral stored form | REQ-146 | aligned. Carries the BUNDLE-20 decision splitting stored *form* from stored *place*. |
| AC-1406 no filesystem junction/archive in the deployed artifact | REQ-146 AC6 | aligned. The story body carries this one as a named Reconciliation Decision, including why a passing turn is excluded as evidence. |
| AC-1407 assistant library bundled at build time; build fails loudly | REQ-146 AC5 | **warning (finding 1)** — faithful to intent, unanchored in the story body. |
| AC-1408 no credential in a log, envelope or stream | REQ-146 AC4 | aligned with In-scope *Honest failure* ("nothing the assistant says back … carries the credential") and the BUNDLE-20 redaction decision. |
| AC-1409 transcripts and the assistant's record outside the site-file region | REQ-146 | aligned on the transcript half (Out-of-scope: "no request address can name it"); **warning (finding 2)** on the record/audit half. |
| AC-1410 model key as a deploy secret, decided by asking the deployment | REQ-149 | aligned. The story body explicitly carries this guard here rather than under publish or build. |
| AC-1456 turn on a process that never opened the session | BUG-38 | aligned with In-scope "*Nor does it know which instance of a host is answering*", added by the same post-fix passage. |

**Coverage — verified, no gaps.** Every behavioural clause of the story body maps
to at least one active AC:

- In-scope *Asking what the assistant is* → AC-1051. *Opening* → AC-1052.
  *Running a turn* → AC-1054 (+ AC-1053 for what a turn is addressed to).
- *Binding* → AC-1056 (two sites, two conversations) + AC-1058 (no operation
  takes a site).
- *What the assistant is told / can look up* → AC-1058 (priming is a projection
  of the grant), AC-1317 (one surface), AC-1318 (read-only, both axes),
  AC-1319 (map + manual, not the documents, in order).
- *Continuity* → AC-1057, including the in-flight-tier cost stated in-criterion.
- *Where the conversation runs* → AC-1404 (deployed host), AC-1405 (same bytes
  either way), AC-1456 (any instance), AC-1055 (per-origin refusal shape).
- *Honest failure* → AC-1059, AC-1060, AC-1055, AC-1061, AC-1320, AC-1408.
- Reconciliation Decisions → AC-1406 (import graph), AC-1410 (deploy secret),
  AC-1409 (addressability), AC-1405 (stored form), AC-1057 (junction cost).

Nothing the story body scopes **out** has grown an AC: no criterion asserts the
declaration/grant/validation machinery (control surface), the write path's
validation or atomicity (CAP-86 / story-37a3921b), the browser pane, the store's
own tenancy and byte path (capability-c4c7a854), or the building of the corpus
(STORY-117 / story-c4f329d3). REQ-146 AC3 (durable audit) and AC7 (publish
withheld) correctly live under CAP-92 and are absent here.

**Exclusivity — clean.** The three near-neighbour pairs were examined and each
splits on a property that fails independently:

- **AC-1055 vs AC-1456** — resolution/refusal vs cross-process continuity. The
  story body's BUNDLE-21 decision argues the split explicitly: resolution could
  admit an identifier and still start a fresh conversation per process, which
  loses the operator's history rather than their turn.
- **AC-1057 vs AC-1456** — both discard in-memory state and re-open, but AC-1456's
  load-bearing step is a *turn* running on a process that never opened the
  session, which AC-1057 never exercises.
- **AC-1060 vs AC-1404 ¶2** — same operator-visible outcome, different mechanism
  and origin: a credential absent from the origin's environment vs absent from
  the deployment's secret store. Not folded, deliberately, since AC-1404 exists
  to prove the deployed host at all.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-1407 (`acceptance_criterion-b9b99c29`) ↔ STORY-103 body | story-body-edit | AC-1407 asserts build-time bundling of the assistant library and a build that "fails loudly … naming what is missing and how to install it". This is a faithful expression of REQ-146 AC5 (free_and_reconciled, 2026-08-15: "The AI library is bundled at build time — no `require.resolve`, no `pathToFileURL`, no runtime dynamic import remains on the Worker path, and the build fails loudly if the component is absent rather than shipping a Worker with no chat"). But **the story body never mentions it**: a term sweep of the body finds no occurrence of "bundled", "build time", "artifact" or "library" in this sense — the only `build` hits are lines 94 (*building the knowledge base*, out of scope), 107 (the *builder* workspace origin), 163 (builds its store per request) and 235 (the *build capability*, named only to say the deploy-secret guard is **not** carried there). AC-1407 is the one criterion in the tree with no anchor in its story. Its sibling shipped-artifact criterion, AC-1406, *is* carried — as a named Reconciliation Decision ("The import-graph guard is a criterion in its own right"). | Add a companion clause to STORY-103's *Reconciliation Decisions* (BUNDLE-20 block, beside the import-graph guard): the assistant library is resolved once at build time and travels inside the artifact, and a build that cannot find it fails rather than emitting a host whose conversation route is silently absent — because that failure otherwise surfaces only as an operator asking a question and getting nothing (REQ-146 AC5). Do **not** touch AC-1407, which is correct. |
| 2 | warning | consistency | AC-1409 (`acceptance_criterion-fa74adda`) ↔ STORY-103 body line 79 | story-body-edit | AC-1409 asserts placement for **two** artefacts: "Transcripts **and the record of what the assistant did** are held outside the one region of shared storage that a site's own files are addressed within." The transcript half is anchored (body line 90: "this story claims only that the conversation is written through the site's own store rather than beside it, and that no request address can name it"). The record half reads against body line 79, whose Out-of-scope bullet lists "*declaration, grant, parameter validation, error taxonomy and **audit** of the operations it calls are a separate capability*" without qualification. Two other passages of the same body do make audit claims here — line 183 ("its transcript and audit are tenant-partitioned through the site's own store (REQ-143 / REQ-146)", added by REPORT-3796's finding-1 fix) and line 281 (Dependencies: "The store the transcript and audit are written through is the site-store capability"). So the body supports AC-1409 in two places and appears to disclaim it in a third. This is phrasing, not drift — but it is the passage an editor would cite to argue AC-1409 is out of scope. | Qualify line 79 so it excludes the audit *of a call* (what is recorded, under which schema, and the durability of the sink — REQ-146 AC3, which lives at CAP-92 / AC-1411) while leaving in scope the claim lines 183/281 already make: where the record is written and that no request address can name it. Do **not** touch AC-1409. |

## Notes for the Editor

- **This level passes.** Both findings are warnings and neither blocks. Both are
  `story-body-edit` against STORY-103 and neither requires opening, editing or
  deprecating a single AC — the criteria are correct as written in both cases.
  If the fixer applies them, apply them to the story body only.
- **Do not re-open the passages REPORT-3796 just repaired.** The tenancy
  paragraph (line ~177), the two `CAP-86` citations, and the "in the shape that
  origin's own answer takes" clause were all rewritten hours ago and were
  re-verified here as consistent with AC-1055, AC-1409 and AC-1456. Finding 2
  touches line 79, which that fix did not.
- **Cross-cutting pattern behind both findings.** The story body absorbed
  REQ-146 unevenly: three of its seven asks are carried as named Reconciliation
  Decisions (import graph, redaction, stored form), one is carried in the
  Dependencies section (the store), and AC5's bundling guard is carried nowhere
  at all. The two findings are the two seams that left. There is no third: every
  other criterion in the tree was traced to a body clause above.
- **Watch for REQ-158 / REQ-159 / REQ-160 (`draft`).** When they activate, the
  *Degradation is not failure* context, AC-1320 (whose whole point is that the
  deployed host has no corpus) and the narrowed tenancy paragraph all move —
  REQ-159 makes the corpus itself tenant-scoped, contradicting the "does not vary
  by account" claim as currently written. Recorded here so the next check does
  not read it as fresh drift; excluded from this assessment because `draft` does
  not count.
- **BUG-39 remains `bundled`.** Its body flags a REQ-127 / AC-1055
  "derivable is not the same as issued" question as operator-pending. That
  decision was already taken and recorded in the BUNDLE-21 reconciliation
  (AC-1055's earlier verification is now deliberately the accepted case), and
  AC-1055 reflects the taken decision. Not re-litigated here.
