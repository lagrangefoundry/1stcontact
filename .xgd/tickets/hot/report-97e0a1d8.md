---
uid: report-97e0a1d8
id: REPORT-2305
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=ac)'
created_by: xgd
created_at: '2026-08-20T01:51:57.077541+00:00'
updated_at: '2026-08-20T01:51:57.077541+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: ac
  violations: 2
  warnings: 5
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: ac

**Result**: FAIL
**Violations**: 2
**Warnings**: 5
**Needs review**: 0

Anchor report: report-2485c83c. Capability: capability-a994b8f3 (CAP-85).
Level `ac`. Previous attempts: 7.

Story tree: one story — STORY-99 (`story-e674c60a`, `story_kind=upgrade`,
`updated_at` 2026-08-20T01:34:06Z), carrying **30 active acceptance criteria**
(AC-959…AC-979, AC-1029…AC-1036, AC-1110). All 30 are `status=active`; none is
deprecated. Every AC body was read from the ticket store in this run.

**Level discipline.** Story level passed at attempt 8 (report-9ce9b33d, 0/0/0),
three minutes after the attempt-7 story-body repair (report-b7354d67). STORY-99's
body is therefore the working reference for this check. Intent was consulted only
where the body's own claims needed grounding — chiefly for the origin-side edit
seam, where attempt 7 added an in-scope bullet whose matrix expression turns out
to sit under a different story.

**Re-read, not assumed.** Attempt 7's six story-body edits were verified present
in the body as it now stands, and each was checked for a supporting AC. Three of
this report's findings are direct consequences of those edits: the story body
grew claims (the write-path transport bullet, the tab pass-through, the
not-served-at-all confinement clause) that the AC layer was never re-checked
against. Two of the three now have ACs (AC-976, AC-979/AC-1036); one does not.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability, ordered by
`merged_at_commit` where present, else `created_at`. Statuses read directly from
the ticket store in this run.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUG-32 (`bug-5cabb340`) | merged | created 2026-08-05, merged `125f1dcc` | Scope rename `@gendevlabs` → `@lagrangefoundry` in lockstep: one definition site for the scope, everything that generates a reference composes it from that declaration, the legacy literal nowhere in tracked files (the checked-in generated `index.html` **deleted**, not updated), the browser-source exception held in step against the document's import map, no fallback resolution and no dual-scope detection, and the evidence made **unconditional** so a one-sided rename cannot skip green. Records one bounded operator carve-out: the `ai.gendevlabs.*` quality-plugin entry-point namespace stays (operator decision, 2026-08-05) | YES |
| REQ-115 + REQ-117 + REQ-44 (BUNDLE-16, `bundle-15c1f647`) | free_and_reconciled | merged 2026-08-07 (`1741ee5d`) | REQ-115: the whole chrome — `webui-*` consumed from the shared artifact store through each package's own declared entry points, missing-install diagnostic naming component and command, single `site` tab with one definition site for its label, multi-mode display panel (a mode is a map entry; `setMode` swaps the source rather than rebuilding the pane), mode-declared toolbar, split with collapse-to-rail and namespaced persistence, open-in-new-tab, publish through the existing path, the Node origin with `control-app` as a verbatim same-origin front, shared confinement over three static trees. REQ-117: the copy-edit loop (owned by CAP-88 / `story-37a3921b`) **plus two workspace-side asks** — (a) the origin's edit seam, `/api/copy` GET/POST as a thin transport over `editCopyGet`/`editCopySet`, returning a client fault carrying the validator's own `code`/`path`/`hint`; (b) `/framework/edit-client.js` served by type-stripping the renderer's own TypeScript source so bridge and markup cannot drift — plus the viewport-fill follow-up (`fill: true` on the tab spec, reaching the shell unnarrowed). REQ-44: `1c` dependency preflight, expressed elsewhere (STORY-79, `capability-aa030c83`) | YES |
| BUG-33 (`bug-ede1fb8c`) | free_and_reconciled | created 2026-08-08, merged `f1664c55` | Test-side only. Matrix effect: a control the strip has already replaced is a detached survivor — inert by design, because what kept it current died with it; the behaviour under test is always the control presently in the strip | YES |
| REQ-119 + REQ-122 + REQ-121 + REQ-126 + REQ-128 + 3 more (BUNDLE-17, `bundle-e59210c5`) | free_and_reconciled | created 2026-08-10, merged `0198704b` | REQ-119: draft-side channels rendered at **request time** from the definition, one render implementation behind a writer and a reader (`renderSiteFiles`), **no rendered artifact on disk**, out-of-band definition changes visible on the next request, memoisation keyed on the definition rather than on elapsed time, an invalid draft surfaced as a page naming the offending field, `published` still the publish-time artifact, address resolution and the iframe source contract unchanged. Carries its own **declared deviation** from its AC-1 (render inside the edge Worker not attempted — needs the storage migration its own non-goals forbid). REQ-122: chat panel (owned by `capability-44a04848` / STORY-104); workspace-side residue — the secondary pane hosts a live assistant rather than the placeholder AC-973 incidentally named, shared artifacts resolve through the one resolution point, three probed routes | YES |

No intent in the ledger is `abandoned`, `deprecated`, `wont_fix`, `draft` or
`ready_to_implement`. Nothing is retired; the cumulative picture is additive.
No intent is merely imminent — every entry is fully reconciled.

## Alignment Ledger

One row per acceptance criterion. This is the drift-prevention artifact: it
records which intent each criterion is currently aligned to and the outcome at
this point in time.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-959 single tab, stable id `site`, panel hosted inside it | REQ-115 | aligned — story "One tab, filling the window" |
| AC-960 one definition site for the surface name and the component scope | REQ-115, BUG-32 | aligned on substance; **warning 5** — the AC's declared exclusion list (ticket/workflow store, lockfiles) is intent-supported by BUG-32 but has no supporting sentence in the story body, which says the literal appears "nowhere else in the repository" without qualification |
| AC-961 components served byte-identical from an installed copy outside this repo, resolved package's own identity checked, asserted not skipped | REQ-115, BUG-32 | aligned |
| AC-962 missing component names the component and the install command, raised at the single resolution point | REQ-115 | aligned |
| AC-963 document references each component through its own declared entry point; every reference under the scope in use, none under a superseded scope | REQ-115, BUG-32 | aligned |
| AC-964 one origin, nothing reinterpreted, frame same-origin; front-conditioned step skipped with a stated reason when absent | REQ-115, REQ-119 (deviation) | aligned — written about one origin and what an operator observes, so it survives the runtime relocation unaltered |
| AC-965 unconfigured vs unreachable origin are distinct explanatory failures | REQ-115 | aligned — attempt 7 gave this its supporting story sentence |
| AC-966 view mode displays the real rendered site, byte-identical to the artifact | REQ-115 | **gap: violation 1** — "not … a re-generation" contradicts REQ-119's request-time production, which the story body now states in scope. **warning 4** — its byte-identity claim is subsumed by AC-1032 |
| AC-967 selector lists exactly the store's sites; choosing one changes the displayed site | REQ-115 | aligned |
| AC-968 switching modes changes the source without rebuilding the pane | REQ-115, REQ-119 | aligned |
| AC-969 registering a mode is an added entry; an unknown mode works end to end | REQ-115 | aligned |
| AC-970 toolbar renders exactly the active mode's controls and re-derives on mode *or* site change | REQ-115, BUG-33 | aligned |
| AC-971 open-in-a-new-tab targets the exact displayed document | REQ-115, BUG-33 | aligned |
| AC-972 publish acts on the displayed site through the existing publish path | REQ-115 | aligned |
| AC-973 split, draggable divider, collapse to rail, reopen to previous width | REQ-115, REQ-122 | aligned — criterion correctly re-pointed off the placeholder the pane used to hold |
| AC-974 layout state survives reopening; every stored key namespaced | REQ-115 | aligned |
| AC-975 displayed site fills the window, follows a live resize, page never scrolls | REQ-115, REQ-117 (fill follow-up) | aligned |
| AC-976 every declared tab option reaches the chrome intact | REQ-117 (fill follow-up) | aligned — attempt 7 gave this its supporting story sentence |
| AC-977 every origin response non-cacheable, refusals included, document explicitly | REQ-115, REQ-119 | aligned |
| AC-978 escape from any served tree never satisfied, identically on every tree | REQ-115 | aligned — deliberately unpinned on status, matching the clamp-not-detect implementation the story declares |
| AC-979 unknown rendering channel or unconsumed component answered as not found | REQ-115 | aligned — attempt 7 gave this its supporting story sentence. **warning 7** — partial overlap with AC-1036 |
| AC-1029 the workspace registers an editable mode; selecting it displays the edit channel | REQ-115, REQ-117 | aligned — explicitly states why it is not AC-968/AC-969 restated |
| AC-1030 components consumed are the repository's own, identically from any working tree; four anchor shapes | REQ-122 | aligned |
| AC-1031 draft-side channels answer with no artifact on disk; serving writes nothing back | REQ-119 | aligned |
| AC-1032 one render backs the written artifact and the served bytes, same file set, same bytes, both channels | REQ-119 | aligned |
| AC-1033 an out-of-band definition change shows on the next request, and unwinds | REQ-119 | aligned |
| AC-1034 an invalid draft is reported where the operator is looking, naming the field | REQ-119 | aligned |
| AC-1035 published comes from the publish-time rendering, never from today's draft | REQ-119 | aligned |
| AC-1036 channel addresses resolve as before and never reach outside the channel | REQ-119 | aligned on its address-resolution subject; **warning 7** — its confinement rider restates AC-978 (channel tree) and AC-979 (not-found) |
| AC-1110 a replaced control stops reacting; the workspace accumulates nothing | BUG-33 | aligned on substance; **warning 6** — the chrome-teardown/remount clause has no supporting sentence in the story body |
| — (no element) | REQ-117 ask (b) | **gap: violation 2** — the gesture's client bytes served from this origin and derived from the renderer's own source are claimed in the story body and asked by REQ-117, and no AC expresses them |
| — (no element) | REQ-117 ask (a) | **warning 3** — the origin's edit transport is claimed by STORY-99's body but expressed by AC-992 under `story-37a3921b` (CAP-88) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-966 (`acceptance_criterion-6fb2bebc`) | ac-edit | The criterion says the served bytes are "identical to the rendered artifact the platform produced for that site and channel — **not a placeholder, a re-generation, or a differently-serialised copy**". REQ-119 (BUNDLE-17 `bundle-e59210c5`, free_and_reconciled, merged `0198704b`) made the draft-side channels exactly a re-generation: STORY-99's body now states in scope that "the draft-side channels are produced on request, not fetched off a shelf … There is no rendered artifact for the workspace to serve", and AC-1031 asserts both channels answer *with no rendered output anywhere on disk*. AC-966 both denies the current mechanism and requires, in its verification, a disk artifact AC-1031 says need not exist. The UAT (`tests/reconciliation-builder-workspace-origin.test.ts:114`) passes only because its fixture happens to have run a render first, and its inline comment repeats the stale wording verbatim | Rewrite the mechanism clause: the bytes are **produced on request and equal by construction** to what the platform's render writes — one production with a writer and a reader over it — not a placeholder and not a second implementation that merely agrees today. Drop "a re-generation" from the exclusion list; keep "not a placeholder" and "not a differently-serialised copy" |
| 2 | violation | coverage | STORY-99 in-scope bullet "The origin carries the write path's operations…" (second sentence) | ac-add | REQ-117 (BUNDLE-16 `bundle-15c1f647`, free_and_reconciled, merged `1741ee5d`) asked that `/framework/edit-client.js` be served by type-stripping the renderer's own TypeScript source, so the code in the page and the markup it binds to cannot drift. STORY-99's body claims it in scope ("produced from the same source the renderer itself is built from rather than kept as a hand-written second copy") and its out-of-scope bullet explicitly *retains* it ("and that the gesture's browser code is served from here"). It ships — `tools/generate/src/cli/builder.ts:462-468` maps `/framework/(edit-client\|site-schema-edit).js` onto `packages/framework/src/l1/edit-client.ts`. **No AC under any story expresses it.** A keyword sweep of all 30 AC bodies for `edit-client`, `bridge`, `type-strip` returns nothing; AC-977 names the route only as one cache-header probe among many. The sole evidence is `test_UAT_FC_REQ-117_the_bridge_reaches_the_browser_as_one_implementation` (`tests/req117-edit-loop.test.ts:144`) — a feature-check UAT against the intent, not an AC-linked one, so the property leaves no matrix entry behind | Author an AC under STORY-99: the client code the editing gesture runs inside the displayed page is served from this origin, and its bytes are derived at serve time from the renderer's own source rather than maintained as a second hand-written copy — so the two cannot drift. Scope it to *derivation and serving*; what the code does once the browser runs it stays with STORY-101. Verification: request the route over the origin, assert a success with a script content type, and assert the served text is the type-stripped form of the renderer's own source file rather than a file authored beside it |
| 3 | warning | coverage | STORY-99 in-scope bullet "The origin carries the write path's operations…" (first sentence) | ac-add | REQ-117's other workspace-side ask — read/apply reachable over this origin as a thin transport that decides nothing, so a refused edit arrives as the write path's own refusal carrying its `code`, `path` and `hint` rather than a server fault. STORY-99's body claims it; no AC under STORY-99 expresses it. It **is** expressed in the matrix, as **AC-992** (`acceptance_criterion-9561711e`, `story_uid=story-37a3921b`, active, `uat_coverage=pass`): "the builder origin's editing endpoint exposes the same read and write operations as the command line, not a parallel implementation … a refusal is a client fault … carrying the same code, path and hint the command line reports". Its UAT drives `builder.url` directly. So the behaviour has coverage and passing evidence — the drift is one of *placement*, created when attempt 7 added this bullet to STORY-99 without re-checking the AC layer. Raised as a warning, not a violation: the behaviour is proven, and a verbatim AC here would duplicate AC-992 across stories | Two acceptable resolutions, and the editor should pick one rather than both. **(a)** Add a STORY-99 AC narrowed to what AC-992 does *not* assert — that the read and apply operations are reachable on **this origin** and that the origin interposes no semantics — and have it name AC-992 as the owner of refusal fidelity, in the same shape AC-1029 uses to distinguish itself from AC-968/AC-969. **(b)** Leave the AC layer alone and add a sentence to STORY-99's body recording that the criterion for this bullet lives at AC-992 under the write-path story. Do **not** restate AC-992's refusal-fidelity clause here |
| 4 | warning | exclusivity | AC-966 + AC-1032 (`acceptance_criterion-46534535`) | ac-edit | Both assert byte-identity between the origin's served bytes and the platform's render for the draft channel. AC-1032 strictly subsumes AC-966: it covers **both** draft-side channels, the **whole** artifact set including the per-site stylesheet, over a site with two pages, a behaviour module and a real asset, and it asserts the channel root returns the home page's bytes — which is precisely what AC-966's UAT does for one channel. Not a hard duplicate, because AC-966 alone claims the *display panel* shows that rendering; but that half is the part AC-966's own UAT never exercises (it fetches `/preview/alpha/draft/` and mounts no panel — a uat-level observation, recorded here for the editor rather than assessed at this level) | Fold with finding 1. Re-point AC-966 at what only it owns — the pane displays the currently selected site's real rendering, whole, with its stylesheet and images resolving over the same origin — and cede the artifact-equality claim to AC-1032 rather than restating it in weaker form |
| 5 | warning | consistency | AC-960 (`acceptance_criterion-13d252a9`) | story-body-edit | AC-960's verification enumerates every tracked text file "minus a declared exclusion list (the ticket and workflow store, whose retention of a legacy namespace is a recorded operator decision, and dependency lockfiles)". The carve-out is intent-supported — BUG-32 records it explicitly ("Left alone as decided … the `ai.gendevlabs.*` quality-plugin entry-point namespace stays (operator decision, 2026-08-05)") — but STORY-99's body states the rule unqualified: the scope "appears as a literal nowhere else in the repository — not in a generated artifact checked in beside the generator, not in a comment". The AC is right and the story body is thin, which is the same shape attempt 7 repaired for AC-965, AC-976 and AC-979 | Add the bounded exclusion to STORY-99's "The scope those components are published under is one name, written once" bullet: the sweep covers every tracked text file save a declared exclusion list — the ticket and workflow store, whose retention of the previous namespace is a recorded operator decision, and dependency lockfiles |
| 6 | warning | consistency | AC-1110 (`acceptance_criterion-8cc0c9f2`) | story-body-edit | AC-1110's second paragraph asserts that tearing the workspace's chrome down releases the strip's controls and the strip's own responsiveness, "so mounting the chrome again does not leave the previous strip still reacting alongside it". STORY-99's body covers only the *replacement* trigger ("A control the strip replaces is released with it and stops reacting, so a workspace held open does not accumulate updaters writing to controls that have left the document"). Teardown-and-remount is a different trigger and does not follow from replacement; BUG-33's recorded matrix effect is likewise about detached survivors after replacement, not about chrome lifecycle | Extend the toolbar bullet in STORY-99's body: disposal is symmetric — tearing the chrome down releases the strip's controls and the strip's own subscription the same way replacement does, so a second mount does not leave the previous strip reacting alongside it |
| 7 | warning | exclusivity | AC-1036 (`acceptance_criterion-46e9debf`) vs AC-978 (`acceptance_criterion-53c66f17`) + AC-979 (`acceptance_criterion-a54bfee4`) | ac-edit | AC-1036's second paragraph restates confinement that AC-978 and AC-979 already own. AC-978 covers escape probes "for every served tree" — the rendered channels being one of its three — "including percent-encoded forms", asserting non-success with none of the targeted file's contents; AC-1036 repeats exactly that for the channel tree. AC-979 covers not-found for an unserved channel or component; AC-1036 adds not-found for an unheld page or site, which is adjacent rather than identical. AC-1036's genuinely distinct subject is its first paragraph — that moving *where* a channel's bytes are decided did not change *which* addresses resolve (directory → home page, extensionless → page, the panel's two addresses unchanged) | Optional and low-priority. If trimmed, reduce AC-1036's second paragraph to the one probe the other two do not make — a channel address for a site the store does not hold — and have it name AC-978 and AC-979 as the owners of the rest. If kept, label it explicitly as a regression rider re-running the existing confinement probes against the new mechanism, so a future reader does not read it as an independent guarantee |

## Notes for the Editor

**The cross-cutting pattern is attempt 7's blast radius.** Report-b7354d67 applied
six story-body edits to close story-level findings, and story level then passed
clean. Three of those edits added *behavioural* claims, and the AC layer was never
re-checked against them. Two landed on ACs that already existed (AC-976 for the tab
pass-through, AC-979/AC-1036 for the not-served-at-all confinement clause). One did
not: the write-path transport bullet, which is findings 2 and 3 here. When fixing,
treat that bullet as two separate asks — REQ-117 made them separately, they have
different owners, and only one of them is genuinely uncovered.

**Findings 2 and 3 are asymmetric on purpose — do not merge them.** Ask (a), the
transport, has a criterion (AC-992) and a passing UAT; only its placement is
debatable. Ask (b), the derived client bytes, has neither, and its only evidence is
a `test_UAT_FC_REQ-117_*` feature check — which proves the intent was satisfied at
the time it merged but leaves nothing in the capability matrix, so nothing carries
the property forward. Finding 2 is the one that must close for this level to pass.

**Findings 1 and 4 are one edit to AC-966.** Both bear on the same two sentences.
Doing them separately risks a criterion that has dropped the stale mechanism claim
but still restates AC-1032's equality in weaker form.

**Findings 5 and 6 are the "supporting sentence" pattern** the story-level cycle
established for AC-965, AC-976 and AC-979: the AC is correct and intent-supported,
and the story body is silent. Repair at the story body, not at the AC — editing
either AC to match a thinner story body would lose intent BUG-32 and BUG-33
actually asked for.

**Deliberate non-findings, recorded so a later pass does not re-derive them:**

- **REQ-119's declared deviation is correctly not claimed.** No AC asserts that the
  draft-side channels are rendered inside the edge Worker. AC-964 is written about
  one origin and what an operator observes, and explicitly conditions its
  front-comparison step on a front being interposed, with a stated skip when it is
  not. This survives the eventual runtime relocation unaltered and needs no change.
- **AC-1029's self-differentiation is correct, not redundant.** It names AC-969 and
  AC-968 and states why a mode-agnostic panel contract would be satisfied by a
  workspace shipping no editable mode of its own. This is the shape finding 3(a)
  should copy if the editor takes that route.
- **AC-978's refusal to pin a status is intended.** The story's Technical Context
  explains that confinement clamps rather than detects, so an escaping request is
  answered as not found; the criterion is written about non-delivery. It documents
  what ships, and changing it to demand a forbidden status would be a new ticket
  against this story, not a reconciliation edit.
- **AC-973's re-pointing off `.builder-chat-placeholder` is correct.** REQ-122
  implicitly superseded the placeholder the criterion incidentally named; AC-973 now
  states that its subject is the split's two halves and not what fills the second.
- **The local preview server's freshness divergence carries no AC and should not.**
  STORY-99's body flags it as out of its declared scope, and AC-977 is scoped to the
  workspace origin's responses. Correctly left to STORY-95 / STORY-96's own intent.
- **AC-970's "a mode naming a control that does not exist is reported"** is a fair
  specialisation of "renders exactly the controls the active mode names" and does not
  need its own story sentence.
