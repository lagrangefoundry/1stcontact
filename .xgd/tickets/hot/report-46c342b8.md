---
uid: report-46c342b8
id: REPORT-2308
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=ac)'
created_by: xgd
created_at: '2026-08-20T02:06:23.178033+00:00'
updated_at: '2026-08-20T02:06:23.178033+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-2485c83c. Capability: capability-a994b8f3 (CAP-85).
Level `ac`. Previous attempts: 4.

Story tree: one story — STORY-99 (`story-e674c60a`, `story_kind=upgrade`,
`updated_at` 2026-08-20T01:54:14Z), carrying **31 acceptance criteria** (AC-959…
AC-979, AC-1029…AC-1036, AC-1110, AC-1240). Thirty are `status=active`; AC-1240
is `status=pending`, which is the schema default for a newly created criterion
(see info 3). None is deprecated or superseded. Every AC body was read from the
ticket store in this run, not inherited from a prior report.

**Level discipline.** Story level passed at attempt 8 (report-9ce9b33d, 0/0/0).
STORY-99's body — as it now stands, including the three story-body edits the
attempt-4 fix applied at 01:54:14Z — is therefore the working reference. Intent
was consulted only to re-verify the ledger's statuses and to ground the two
cross-story pointers the body now makes.

**Re-read, not assumed.** Attempt 4's fix (report-8894ebb0) claimed seven actions
against report-97e0a1d8's two violations and five warnings. All seven were
independently verified present in the current ticket state; each is recorded in
the ledger below against the criterion it touched. Nothing was taken on the fix
report's word.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability, ordered by
`merged_at_commit` where present, else `created_at`. Statuses re-read directly
from the ticket store in this run.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUG-32 (`bug-5cabb340`) | merged | created 2026-08-05, merged `125f1dcc` | Scope rename `@gendevlabs` → `@lagrangefoundry` in lockstep: one definition site for the scope, every reference composed from that declaration, the legacy literal in no tracked file, the browser-source exception held in step against the document's import map, no fallback resolution and no dual-scope detection, evidence unconditional so a one-sided rename cannot skip green. Records one bounded operator carve-out for a retained namespace (operator decision, 2026-08-05) | YES |
| REQ-115 + REQ-117 + REQ-44 (BUNDLE-16, `bundle-15c1f647`) | free_and_reconciled | created 2026-08-07, merged `1741ee5d` | REQ-115: the whole chrome — `webui-*` consumed from the shared artifact store through each package's declared entry points, missing-install diagnostic, single `site` tab with one definition site for its label, multi-mode display panel, mode-declared toolbar, split with collapse-to-rail and namespaced persistence, open-in-new-tab, publish through the existing path, the Node origin behind a verbatim front, shared confinement over three static trees. REQ-117: the copy-edit loop (owned by CAP-88 / `story-37a3921b`) plus two workspace-side asks — (a) the origin's edit seam as a thin transport, (b) the gesture's client bytes derived from the renderer's own source — plus the viewport-fill follow-up (`fill: true` reaching the shell unnarrowed). REQ-44: dependency preflight, expressed under `capability-aa030c83` | YES |
| BUG-33 (`bug-ede1fb8c`) | free_and_reconciled | created 2026-08-08, merged `f1664c55` | Test-side only. Matrix effect: a control the strip has already replaced is a detached survivor — inert by design; the behaviour under test is always the control presently in the strip | YES |
| REQ-119 + REQ-122 + REQ-121 + REQ-126 + REQ-128 + 3 more (BUNDLE-17, `bundle-e59210c5`) | free_and_reconciled | created 2026-08-10, merged `0198704b` | REQ-119: draft-side channels rendered at request time from the definition, one render implementation behind a writer and a reader, no rendered artifact on disk, out-of-band definition changes visible on the next request, memoisation keyed on the definition, an invalid draft surfaced as a page naming the offending field, `published` still the publish-time artifact, address resolution unchanged. Carries its own declared deviation (render inside the edge Worker not attempted). REQ-122: chat panel (owned by `capability-44a04848`); workspace-side residue — the secondary pane hosts a live assistant, shared artifacts resolve through the one resolution point | YES |

No intent in the ledger is `abandoned`, `deprecated`, `wont_fix`, `draft` or
`ready_to_implement`. Nothing is retired; the cumulative picture is purely
additive. No intent is merely imminent — all four are fully reconciled, so
every ask below is enforced rather than anticipated.

## Alignment Ledger

One row per acceptance criterion, recording the intents it is currently aligned
to and the outcome at this point in time.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-959 single tab, stable id `site`, panel hosted inside it | REQ-115 | aligned — story bullet "One tab, filling the window" |
| AC-960 one definition site for the surface name and the component scope; bounded exclusion list | REQ-115, BUG-32 | aligned — **fix 4 verified**: STORY-99's component-scope bullet now carries the same bounded exclusion (ticket/workflow store, dependency lockfiles) the criterion enumerates. The prior warning 5 is closed |
| AC-961 components served byte-identical from an installed copy outside this repo, resolved package identity checked, asserted not skipped | REQ-115, BUG-32 | aligned |
| AC-962 missing component names the component and the install command, raised at the single resolution point | REQ-115 | aligned |
| AC-963 document references each component through its own declared entry point; every reference under the scope in use, on the freshly produced document | REQ-115, BUG-32 | aligned — its "freshly produced document" subject is complementary to AC-960's tracked-file sweep, not a duplicate of it: a document generated now is not a tracked file |
| AC-964 one origin, nothing reinterpreted, frame same-origin; front-conditioned step skipped with a stated reason when absent | REQ-115, REQ-119 (deviation) | aligned — written about one origin and what an operator observes, so it survives the runtime relocation unaltered |
| AC-965 unconfigured vs unreachable origin are distinct explanatory failures | REQ-115 | aligned |
| AC-966 the pane shows the selected site's rendering, whole, with stylesheet and images resolving over this origin | REQ-115, REQ-119 | aligned — **fix 1 verified**: the stale "not … a re-generation" clause is gone, replaced by "produced when the request arrives … equal *by construction* … one production of a page, with a writer and a reader over it", and the equality claim is ceded to AC-1032 by name. Prior violation 1 and warning 4 are both closed. Residual: **warning 1** below |
| AC-967 selector lists exactly the store's sites; choosing one changes the displayed site | REQ-115 | aligned |
| AC-968 switching modes changes the source without rebuilding the pane | REQ-115, REQ-119 | aligned |
| AC-969 registering a mode is an added entry; an unknown mode works end to end | REQ-115 | aligned |
| AC-970 toolbar renders exactly the active mode's controls and re-derives on mode *or* site change; strip persists | REQ-115, BUG-33 | aligned |
| AC-971 open-in-a-new-tab targets the exact displayed document | REQ-115, BUG-33 | aligned |
| AC-972 publish acts on the displayed site through the existing publish path | REQ-115 | aligned |
| AC-973 split, draggable divider, collapse to rail, reopen to previous width | REQ-115, REQ-122 | aligned — correctly re-pointed off the placeholder the pane used to hold |
| AC-974 layout state survives reopening; every stored key namespaced | REQ-115 | aligned |
| AC-975 displayed site fills the window, follows a live resize, page never scrolls | REQ-115, REQ-117 (fill follow-up) | aligned |
| AC-976 every declared tab option reaches the chrome intact | REQ-117 (fill follow-up) | aligned |
| AC-977 every origin response non-cacheable, refusals included, document explicitly | REQ-115, REQ-119 | aligned — its route list names the gesture's client route, consistent with AC-1240 |
| AC-978 escape from any served tree never satisfied, identically on every tree | REQ-115 | aligned — deliberately unpinned on status, matching the clamp-not-detect implementation the story declares |
| AC-979 unknown rendering channel or unconsumed component answered as not found | REQ-115 | aligned |
| AC-1029 the workspace registers an editable mode itself; selecting it displays the edit channel | REQ-115, REQ-117 | aligned — states why it is not AC-968/AC-969 restated |
| AC-1030 components consumed are the repository's own, identically from any working tree; four anchor shapes proved against fixtures | REQ-122 | aligned |
| AC-1031 draft-side channels answer with no artifact on disk; serving writes nothing back | REQ-119 | aligned |
| AC-1032 one render backs the written artifact and the served bytes, same file set, same bytes, both channels | REQ-119 | aligned — now the sole owner of the equality claim |
| AC-1033 an out-of-band definition change shows on the next request, and unwinds | REQ-119 | aligned — also the observable expression of REQ-119's "memoisation keyed on the definition, never on elapsed time" |
| AC-1034 an invalid draft is reported where the operator is looking, naming the field | REQ-119 | aligned |
| AC-1035 published comes from the publish-time rendering, never from today's draft | REQ-119 | aligned |
| AC-1036 channel addresses resolve as before; confinement paragraph labelled a regression rider | REQ-119 | aligned — **fix 6 verified**: the second paragraph now names AC-978 and AC-979 as the owners and states it re-runs their probes against the request-time mechanism. Prior warning 7 is closed |
| AC-1110 a replaced control stops reacting; teardown is symmetric; the workspace accumulates nothing | BUG-33 | aligned — **fix 5 verified**: STORY-99's toolbar bullet now carries the symmetric-disposal sentence the criterion's second paragraph asserts. Prior warning 6 is closed |
| AC-1240 the gesture's client code is served from this origin, derived at serve time from the renderer's own source | REQ-117 ask (b) | aligned — **fix 2 verified**: the criterion exists under `story-e674c60a`, is scoped to derivation and serving only, names the editing-gesture story as owner of what the code does, and declines to pin the derivation mechanism. Confirmed shipping: `tools/generate/src/cli/builder.ts:462-468` routes `/framework/(edit-client\|site-schema-edit).js` onto `packages/framework/src/l1/edit-client.ts`. Prior violation 2 is closed. See info 3 on its `pending` status |
| STORY-99 write-path transport bullet | REQ-117 ask (a) | aligned via cross-story pointer — **fix 3 verified**: the body now records that refusal fidelity is not restated here and is owned by AC-992. Pointer verified live, not assumed: AC-992 (`acceptance_criterion-9561711e`, `story_uid=story-37a3921b`, `status=active`, `uat_coverage=pass`) does assert that the origin's editing endpoint exposes the same read and write operations as the command line and that a refusal carries the same code, path and hint. Prior warning 3 is closed. See info 2 for a separate, out-of-subject observation about that criterion |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | exclusivity | AC-966 (`acceptance_criterion-6fb2bebc`) vs AC-1031 (`acceptance_criterion-e9a9ba3b`) | ac-edit | The attempt-4 edit removed AC-966's restatement of AC-1032's equality claim and ceded it by name, which was right. It introduced a weaker restatement of a *different* neighbour in its place: AC-966's verification now requires the fetch to "run against a site the platform has never rendered to disk, so the panel's content cannot be coming off a shelf", and its criterion asserts "the bytes are produced when the request arrives". Answering with no rendered output on disk is precisely AC-1031's subject, and AC-1031 owns it more completely (both draft-side channels, the stylesheet and the site's assets, plus the write-back assertion that nothing is materialised by serving). Raised as a warning and not a violation because AC-966 uses the never-rendered condition as a guard on its own probe rather than asserting it as a standalone guarantee, and its distinct subject — that the *pane* is displaying that rendering, whole — is real and unduplicated. Low priority: the criterion is not wrong, only less economical than the AC-1032 half of the same edit | Optional. For symmetry with the AC-1032 cession the same edit already made, add a clause naming AC-1031 as the owner of "the channels answer with no artifact on disk, and serving writes nothing back", and keep the never-rendered fixture as an explicitly-labelled guard on this criterion's own probe rather than as an independent claim. Do **not** delete the guard — it is what stops AC-966 passing off a shelf copy |
| 2 | info | consistency | AC-992 (`acceptance_criterion-9561711e`, `story_uid=story-37a3921b` / CAP-88) | — | Recorded because STORY-99's body now names this criterion, so a later reader of this capability will follow the pointer. AC-992's third bullet asserts "A successful save re-renders **both** the editable rendering and the plain draft rendering before reporting success", and its verification asserts "both the editable and plain rendered outputs **on disk** reflect it". STORY-99's Technical Context states that step was removed by REQ-119: "Serving a stored rendering meant a save had to re-materialise both channels before it could reply … That step is gone." The two cannot both be current. **Out of this capability's subject** — AC-992 belongs to `story-37a3921b` under CAP-88, and nothing in CAP-85's matrix depends on the clause. The pointer STORY-99 makes is accurate about the two properties it actually cites (same read/write operations; same code, path and hint), neither of which is the disputed clause | None here. Forward to CAP-88's own `ac`-level cycle |
| 3 | info | — | AC-1240 (`acceptance_criterion-bd9ce1d6`) | — | `status=pending` while all thirty of its siblings are `active`. Checked rather than assumed: `pending` is the schema default for `acceptance_criterion` (`ticket_types.yaml`, `properties.status.default: pending`), and the capability tree builder (`xgd_source/api/capability.py`) filters only deprecated *stories* — it applies no status filter to acceptance criteria, so a pending AC is in the matrix and is evaluated. Store-wide there are three pending ACs; one of the other two (AC-719) carries `uat_coverage: pass`, confirming that pending criteria do receive coverage verdicts | None. `fields.uat_coverage: fail` on this criterion is honest state and is the `uat` level's work, not a defect at this level |

## Notes for the Editor

**This level is clean; the single warning is optional.** Both violations and all
five warnings from report-97e0a1d8 were verified closed against the current
ticket state, criterion by criterion, and the four story-body claims that
attempt 7 introduced now each have either an AC under STORY-99 or a verified
cross-story pointer. No new violation and nothing requiring an operator decision
surfaced. Finding 1 can be taken or left without affecting this level's verdict;
if a fix cycle runs anyway, it is a two-sentence edit to one criterion.

**The prior cycle's blast-radius pattern has closed, and the fix did not open a
new one — nearly.** Attempt 7 grew the story body with behavioural claims the AC
layer had never been re-checked against; that is what produced report-97e0a1d8's
findings 2, 3 and 5–7. Attempt 4's fix went the other way round — three story-body
edits and three AC edits — and this pass re-checked each direction against the
other. The one residue is finding 1: an edit that removed one restatement
introduced a smaller one against a different neighbour. Worth naming as a pattern
for whoever fixes it, because it is the second time an AC-966 edit has produced a
restatement of a neighbouring criterion.

**Deliberate non-findings, recorded so a later pass does not re-derive them:**

- **AC-960 and AC-963 are not duplicates**, despite both asserting that every
  component reference is under the scope in use and none under a superseded one.
  AC-960's sweep is over *tracked* files; AC-963 asserts on the document
  *produced now*, which is not a tracked file and which AC-960's sweep therefore
  cannot reach. AC-963 states this reasoning itself ("a committed copy compared
  against itself proves nothing about what an operator would be served").
- **BUG-32's "no fallback resolution and no dual-scope detection" needs no AC of
  its own.** AC-960 asserts the superseded scope appears as a literal in no
  tracked file at all; code that cannot name the old scope cannot fall back to it
  or detect it. The structural assertion subsumes the behavioural one.
- **REQ-119's declared deviation is correctly not claimed.** No AC asserts the
  draft-side channels are rendered inside the edge Worker. AC-964 is written
  about one origin and what an operator observes, and conditions its
  front-comparison step on a front being interposed with a stated skip when it is
  not. It survives the eventual runtime relocation unaltered.
- **AC-1036's title still names confinement** ("…and never anything outside its
  own channel") while its second paragraph is now labelled a regression rider.
  That is consistent with the keep-and-label option the prior cycle chose over
  the trim; the rider does still make those probes. Not drift.
- **AC-970's "a mode naming a control that does not exist is reported"** is a fair
  specialisation of "renders exactly the controls the active mode names" and
  needs no story sentence of its own.
- **AC-978's refusal to pin a status is intended**, matching the clamp-not-detect
  implementation the story's Technical Context declares. Demanding a forbidden
  status would be a new ticket against this story, not a reconciliation edit.
- **The local preview server's freshness divergence carries no AC and should not.**
  STORY-99's body flags it as outside its declared scope; AC-977 is scoped to the
  workspace origin's responses. It stays with STORY-95 / STORY-96's own intent.
- **The mount-evidence skip is test policy, not product behaviour**, and correctly
  has no criterion. The *consumption* evidence that must never skip does have one:
  AC-961, which states it is asserted rather than skipped and names the component
  it could not account for.
