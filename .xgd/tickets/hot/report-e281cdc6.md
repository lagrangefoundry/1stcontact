---
uid: report-e281cdc6
id: REPORT-3866
type: report
title: 'Capability-Intent Alignment: Page Authoring Through The Control Surface: Read
  & Replace The Element Tree (level=story)'
created_by: xgd
created_at: '2026-09-11T02:11:01.528915+00:00'
updated_at: '2026-09-11T02:11:01.528915+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-fe236246
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Page Authoring Through The Control Surface: Read & Replace The Element Tree
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Anchor report: report-e37a6b4a. Attempt 3 at this level (previous_attempt_count = 2).
CAP-93 (`capability-fe236246`) has exactly one story — STORY-106 (`story-189fc1ac`,
`story_kind=feature`, status `completed`, `uat_coverage: pass`). Re-confirmed by a
ticket-store sweep: `story-189fc1ac` is the only non-report ticket in the store carrying
`capability_uid: capability-fe236246`.

**The finding that failed the last pass is repaired and the repair is correct.**
REPORT-3864 (`report-491a72d5`, 2026-09-11T02:00, FAIL, 1 violation) found STORY-106's
first "Divergences and known limits" bullet asserting a refusal-specificity limit the
shipped system no longer has. REPORT-3865 (`report-dee9edac`) rewrote it. STORY-106's body
now reads (`updated_at: 2026-09-11T02:03:51`, `last_field_updated: body`): *"Refusal
specificity was degraded for this caller — closed upstream, no longer a limit… a refused
replacement now names the offending pointer **as well as** the strategy."* I did not take
the fix report's word for that — see "Re-verification of the repaired claim" below.

## Cumulative Intent Considered

STORY-106's `fields.intent_uid` is **BUNDLE-17** (`bundle-e59210c5`, `free_and_reconciled`,
`merged_at_commit 0198704b7e29db3c53cf569070042cec0eb467bc`), which rolls up eight source
requests; exactly one of the eight — REQ-129 — governs this capability. Intents created
after the bundle were re-swept this cycle for asks reaching this capability's surface
(`describe_page` / `get_l1` / `set_l1` / `AuthorPages`). The sweep confirms the store holds
no intent created after **2026-08-31**, so the ledger below is the same population the last
pass saw, carried forward with re-checked statuses, plus one addition (BUG-39).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 | free_and_reconciled | 2026-08-08 | Declared the control surface: 16 ops, error taxonomy, addressing contract. **Owned by CAP-92** | YES (dependency, not this capability) |
| REQ-127 | free_and_reconciled | 2026-08-08 | Tooling configuration over the surface. **Owned by CAP-92** | YES (dependency, not this capability) |
| REQ-129 (`request-b1300473`) | free_and_reconciled | created 2026-08-09, completed 2026-08-10 | **The governing intent.** `describe_page` widened to every node; verbatim `get_l1`; subtree-replacing `set_l1`; `get_copy`/`set_copy` retired from the AI surface; the security guarantee relocated to L1's closed schema; the operator modal left unchanged | YES — primary |
| REQ-130 (`request-ed6ba145`) | free_and_reconciled | 2026-08-09 | Beyond the element tree: config, components, page metadata, generated assets. **Owned by CAP-94 / STORY-107** | YES (sibling, explicitly out of scope here) |
| REQ-119 / REQ-121 / REQ-122 / REQ-128 | free_and_reconciled | 2026-07-31 … 2026-08-08 | The rest of BUNDLE-17. No reach into this capability's element-tree surface | YES (unrelated to this capability) |
| REQ-131 (`request-5d3bf630`) | free_and_reconciled | created 2026-08-11, completed 2026-08-20 | Draft change journal. Every mutating op returns the draft count — `set_l1`'s `change` shape carries `now` | YES — coverage sits in CAP-99 (finding 2) |
| REQ-137 | free_and_reconciled | 2026-08-12 | L1 palette: `shade` on the reference replaces named `steps` — changes the vocabulary `get_l1` returns verbatim | YES — no matrix edit needed (finding 3) |
| REQ-139 | free_and_reconciled | 2026-08-12 | The operator modal locks a control it cannot faithfully express, with a reason | YES — touches STORY-106's non-regression claim (finding 4) |
| BUG-39 (`bug-23d1ec27`) | **bundled** (imminent) | 2026-08-24 | This repo's BUG-39: the Node chat-host UATs' model double still speaks the pre-streaming Anthropic contract. Test-double repair in `REQ-122_chat_host` / `REQ-127_session_binding` / `reconciliation-assistant-conversation` — **CAP-92's suites, not this capability's** | imminent — no reach into CAP-93 (finding 6) |
| REQ-134 | abandoned | 2026-08-12 | Image-generation component | NO |
| REQ-154 | bundled | 2026-08-20 | Browser Rendering driver behind the existing capture seam | imminent — no reach into this surface |
| REQ-155 / REQ-156 / REQ-157 / REQ-158 / REQ-159 / REQ-160 / REQ-161 / REQ-163 / REQ-164 / REQ-165 / REQ-166 | draft | 2026-08-20 … 2026-08-31 | Capture in workerd, sharp removal, the fidelity surface, KB work, the Library tab, ingestion, projected reference | NO (not active) |

**Name collision worth stating once, because it is the kind of thing a later pass
misreads.** The upstream tool-layer fix that closed the refusal-specificity gap is
*@lagrangefoundry/ai*'s own **BUG-39** — cited in that package's source at
`node_modules/@lagrangefoundry/ai/src/toolbox/declaration.js:450`. It is **not** this
repository's BUG-39 (`bug-23d1ec27`, the chat-host model double). Two different tickets,
two different trackers, same number.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-93 (capability body) | REQ-129 | aligned — the five scope bullets restate REQ-129's delivered parts; out-of-scope correctly cedes governance to CAP-92 and everything beyond the element tree to CAP-94 |
| STORY-106 (`story-189fc1ac`) | REQ-129 (primary); REQ-126, REQ-127 (depended-on) | **aligned** — every in-scope bullet, both out-of-scope items and both recorded divergences now trace to verified behaviour (finding 1) |
| STORY-106 | REQ-131 | aligned — the returned count is claimed once, in STORY-115 (`story-6cd17452`, CAP-99), for every write on the path (finding 2) |
| STORY-106 | REQ-137 | aligned, durably — the body speaks of "references still references", never of `steps` (finding 3) |
| STORY-106 | REQ-139 | aligned — the modal invariant survives the lock mechanism intact (finding 4) |
| STORY-106 vs STORY-107 (CAP-94) | REQ-129 vs REQ-130 | aligned — `page_map`'s `components` key belongs to STORY-107, which claims it explicitly (finding 5) |
| STORY-106 vs STORY-100 (CAP-86) | REQ-129 | aligned — no overlap; independently re-confirmed (finding 7) |

### Re-verification of the repaired claim (the last pass's only violation)

The previous report flagged its own decisive evidence as living in an unpinned package and
asked a future run to re-read it rather than trust the report. Done, end to end:

1. **The thrown refusal carries the pointer.** `tools/generate/src/cli/edit.ts:215-226` —
   `validateOrThrow` throws `CommandError{code:'SCHEMA_INVALID', path: first.path,
   message: '<path>: <message>'}`.
2. **This surface does not opt out of host detail.**
   `tools/generate/src/cli/ai/l1-surface.json:124-126` — `SCHEMA_INVALID` declares a
   `message` and no `host_detail` key.
3. **Upstream, the flag is opt-out and defaults to true.**
   `node_modules/@lagrangefoundry/ai/src/toolbox/declaration.js:463` —
   `hostDetail: flag(where, declared, 'host_detail', true)`, with the doc comment at
   :448-452 stating it is opt-*out*.
4. **The renderer appends it.** `runtime.js:487-493` — `renderHostError` computes
   `const detail = declared.hostDetail ? usableDetail(failure, code, declared.message) : ''`.
   `runtime.js:454-460` — `describeFailure` lifts `path` and `detail` off the error.
   `runtime.js:549-557` — `usableDetail` returns the bare `path` even when the message text
   adds nothing, so the offending field survives independently of the message.
5. **The in-repo comments match.** `edit.ts:800` now reads `UPSTREAM FINDING, CLOSED` and
   names the example pointer `/pages/0/l1/root/children/1/axes/fontSizePx`.

The rewritten bullet asserts exactly this, and adds no claim beyond it. The repair is
sound.

### Consistency — story body against intent

Every remaining claim in the body was re-checked against the working tree this cycle, not
carried over:

- *"each carrying the address that reaches it, the kind of thing it is, a short label…, and
  the component instance and slot the address is scoped to"* — `tools/generate/src/cli/segments.ts:72-90`
  (`walkSegments`, header: "emitting EVERY node") and `:102-118` (`pageSegments`, page L1
  then each module instance's slots). The declared `page_map.segments` wording
  (`l1-surface.json:58`) is the story's sentence almost verbatim.
- *"It carries no styling at all"* — `Segment` is `{path, kind, label}` + `{module, slot}`;
  `labelOf` (`segments.ts:42-53`) emits text/alt/control/slot-name or
  `"row, N children"`. No axis reaches the map.
- *"nothing resolved, nothing tidied, references still references"* — `editL1Get`
  (`edit.ts:772-787`) returns `resolveSegment`'s node untouched; the VERBATIM IS THE
  DECISION block at `:756-769` states the rule.
- *"There is no separate insert or delete, and no way to submit a whole page in one call"* —
  the `AuthorPages` group declares exactly one operation, `set_l1`
  (`l1-surface.json:790-797`), and the declared absence *"Replacing a whole page in one
  call"* is present at `:954-957`.
- *"the narrower copy-field pair retires from this surface"* — no `get_copy`/`set_copy` op
  exists in `l1-surface.json` (op list re-read at `surface_version: 4`), while
  `copyFieldsOf` still backs the operator modal (`edit.ts:642,701,712`).
- *"the capability group it belongs to is one the surface declares and the consumer is
  granted"* — `tools/generate/src/cli/ai/instances.json:4-6` grants `ReadSite` +
  `AuthorPages`.
- *"an element carrying markup, … a script URL, of a kind the vocabulary does not have … is
  refused whole"* — the declared absence *"Writing HTML, CSS or JavaScript"*
  (`l1-surface.json:951-952`) is worded as the closed-vocabulary guarantee, not as "no
  operation accepts them", which is the relocation REQ-129 asked for.
- *"the same small form over the same fields … saving through it leaves everything the
  assistant set alone"* — survives REQ-139: `packages/site-schema/src/l1/edit.ts:233`
  ("honours `locked` by rendering the row read-only") keeps the field list intact, and
  `:1144` ("The status quo always passes, and it is the reason this function exists")
  keeps an assistant-set value riding through an operator save.
- The second recorded divergence still holds: `packages/site-schema/src/schema.ts:990`
  carries `nav: navConfigSchema`, and a grep of `tools/generate/src/render/` and
  `packages/framework/src/` finds no reader of it.

### Coverage — intent expressed in the story tree

REQ-129's delivered asks map onto STORY-106's body without residue: the widened map, the
verbatim read, the bounded replace, the retirement of the copy pair, the relocated security
guarantee, the untouched operator gesture, and both of REQ-129's own "Not in scope" items
(whole-document submission; the vestigial `nav` key). Nothing REQ-129 asked for is
unexpressed, and nothing in the body lacks an intent behind it.

### Exclusivity

No overlap. STORY-106 is CAP-93's only story. Against its two nearest neighbours:

- **STORY-100 (CAP-86)** owns the field-level change map over an addressed editable region;
  STORY-106 owns the element-level map / verbatim read / bounded replace. Different unit of
  change, different vocabulary. STORY-100's body consistently defers the element-level reach
  to "the AI's surface" (`story-37a3921b:357,367,489,494`) rather than claiming it.
- **STORY-107 (CAP-94)** owns everything in `page_map` that is not the element tree
  (finding 5).

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | STORY-106 (`story-189fc1ac`) | — | The sole violation of REPORT-3864 is repaired. The divergence bullet now records the refusal-specificity gap as a closed upstream limit with lineage, and the claim was re-verified independently through all five links of the chain above rather than accepted from the fix report | none — resolved |
| 2 | info | coverage | STORY-106 | — | REQ-131 made every write return the draft count, so `set_l1`'s `change` shape carries `now` (`l1-surface.json:88-92`). STORY-106's body claims no result contract for `set_l1`, and STORY-115 (`story-6cd17452`, CAP-99) states the rule once for every write on the path. Restating it here would duplicate a cross-cutting claim across two capabilities | none — coverage sits in CAP-99 by design |
| 3 | info | consistency | STORY-106 | — | REQ-137 deleted `steps` and added `shade` to the palette reference. The body describes the verbatim guarantee model-agnostically ("references still references, per-width variations still variations"), so the entry-model change needs no matrix edit | none |
| 4 | info | consistency | STORY-106 | — | REQ-139 added locked controls to the operator modal STORY-106 promises is "untouched". Verified compatible at source: a lock renders the row read-only rather than dropping it (`packages/site-schema/src/l1/edit.ts:233`), and a lock refuses a *change*, never the status quo (`:1144`) | none |
| 5 | info | exclusivity | STORY-106 + STORY-107 | — | `page_map` now carries a `components` key (`l1-surface.json:57`) alongside `segments`. That is REQ-130's addition and STORY-107 (`story-b3de4571`) claims it explicitly ("a page reports the instances already on it with their configuration"). CAP-93's own out-of-scope cedes component instances to CAP-94, so the shared shape is not shared ownership | none |
| 6 | info | — | — (ledger) | — | This repo's BUG-39 (`bug-23d1ec27`, `bundled`) is a chat-host test-double repair in CAP-92's suites and does not reach this capability. It shares a number with the *upstream* BUG-39 that closed the refusal gap, which is cited in `@lagrangefoundry/ai`'s own source | none — recorded to stop a future pass conflating them |
| 7 | info | exclusivity | STORY-106 + STORY-100 | — | Re-confirmed against STORY-100's body this cycle, and consistent with the anchor's own overlap resolution (`report-f56df596`, cluster 5, confirm / no change) | none |

## Notes for the Editor

**Nothing to repair at this level. One thing is still outstanding one level down.**

**AC-1090 (`acceptance_criterion-4bd36a69`) has not moved and is now the last stale copy of
the closed limit.** Re-read this cycle: `updated_at: 2026-08-16T02:37:34`, and it still
carries *"**Known limit, deliberately recorded:** this caller does not receive the specific
offending field… criterion asserts the strategy; it does not assert the field name."* That
is an `ac-edit` for the **ac-level cycle**, exactly as REPORT-3864 routed it and REPORT-3865
honoured. It is not a story-level violation, and I have deliberately not reclassified it as
one: STORY-106's body now says the AC lags ("strengthening it to assert the field name is an
outstanding matrix edit, not a missing behaviour"), so the matrix is internally consistent
and truthful at this boundary — the story does not assert something false, it points at the
edit still owed.

Two things the ac-level cycle should carry over rather than re-derive:

1. The strengthened criterion **would pass today**. REPORT-3865 ran the probe — adding
   `expect(answer).toMatch(/fontSizePx/)` to
   `test_UAT_FC_REQ_129_a_refusal_is_correctable_within_the_turn` gave 13/13 green — so the
   ac edit is a pure matrix/test change with no code work behind it.
2. Strengthening AC-1090 needs the matching `uat-edit` in the same breath
   (`tests/test_UAT_FC_REQ-129_l1_authoring.test.ts:377-390`), or the AC's
   `uat_coverage: pass` momentarily overstates what its test proves.

**Durability, restated because it is the axis this capability actually drifts on.** Both
story-level failures this capability has had came from outside the repository:
`@lagrangefoundry/ai` is unpinned in the lockfile, so an upstream change arrives with no
commit, no intent ticket and no failing test here. The decisive evidence for finding 1 lives
in `node_modules/@lagrangefoundry/ai/src/toolbox/`, whose `package.json` declares
`"version": "0.0.0"`. A future pass must **re-read `runtime.js` and `declaration.js`** rather
than trust this report; if the refusal has lost its pointer again, that is an upstream
regression to file, not matrix drift to edit.

**Traceability friction, unchanged and still systemic.** CAP-93 carries no `intent_uid`, and
STORY-106's points at BUNDLE-17, so establishing that REQ-129 governs this capability still
costs a dereference of eight bundled requests. Recorded for the third time at the tooling
level rather than repaired here.

**Method.** Static analysis over the ticket store and the working tree; the test suite was
not executed (this session runs in don't-ask mode, which denies the runner). Every claim in
the Consistency section above is anchored to a file and line read this cycle. The one
executed result quoted — the 13/13 probe — is REPORT-3865's, attributed to it rather than
re-claimed as mine.
