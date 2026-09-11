---
uid: report-cac55785
id: REPORT-3870
type: report
title: 'Capability-Intent Alignment: Page Authoring Through The Control Surface: Read
  & Replace The Element Tree (level=ac)'
created_by: xgd
created_at: '2026-09-11T02:16:30.069578+00:00'
updated_at: '2026-09-11T02:16:30.069578+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-fe236246
  level: ac
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Page Authoring Through The Control Surface: Read & Replace The Element Tree
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a. CAP-93 (`capability-fe236246`) has exactly one story —
STORY-106 (`story-189fc1ac`, `story_kind=feature`, status `completed`) — carrying **12
active ACs** (AC-1083 … AC-1094), all `kind=behavior`, `regression_only=false`,
`uat_coverage=pass`. No AC is deprecated.

Per the level cascade, STORY-106's body is the working reference. It was edited **today**
(`updated_at 2026-09-11T02:03:51`, `last_field_updated: body`) by the story-level fix
cycle (REPORT-3865, `report-dee9edac`), and the re-check passed (REPORT-3866,
`report-e281cdc6`, 0 violations). The 12 ACs were last touched 2026-08-16 and only on
`uat_coverage`. **That gap — a story body corrected today over an AC set unchanged since
August — is where the one violation sits**, and the story-level report named it in advance
as an `ac-edit` cascade deferred to this cycle.

## Cumulative Intent Considered

STORY-106's `fields.intent_uid` is **BUNDLE-17** (`bundle-e59210c5`, `free_and_reconciled`,
`merged_at_commit 0198704b7e29db3c53cf569070042cec0eb467bc`), which rolls up eight source
requests; exactly one of them, **REQ-129**, governs this capability. Statuses below were
re-read from the ticket store this cycle, not carried over from the story-level pass.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 (`request-d9407f80`) | free_and_reconciled | 2026-08-08 → 08-10 | Declared the control surface: operations, error taxonomy, addressing contract. **Owned by CAP-92** | YES (dependency, not this capability) |
| REQ-127 (`request-22a6521a`) | free_and_reconciled | 2026-08-08 → 08-10 | Tooling configuration over the surface. **Owned by CAP-92** | YES (dependency) |
| REQ-129 (`request-b1300473`) | free_and_reconciled | 2026-08-09 → 08-10 | **The governing intent.** `describe_page` widened to every node; verbatim `get_l1`; subtree-replacing `set_l1`; `get_copy`/`set_copy` retired from the AI surface; the security guarantee relocated to L1's closed schema; the operator modal left unchanged | YES — primary |
| REQ-130 (`request-ed6ba145`) | free_and_reconciled | 2026-08-09 → 08-10 | Beyond the element tree: config, components, page metadata, generated assets. **Owned by CAP-94** | YES (sibling, explicitly out of scope here) |
| REQ-119 / REQ-121 / REQ-122 / REQ-128 | free_and_reconciled | 2026-07-31 … 08-08 | The rest of BUNDLE-17; no reach into this capability's AC surface | YES (unrelated here) |
| REQ-131 (`request-5d3bf630`) | free_and_reconciled | 2026-08-11 → 08-20 | Draft change journal; every mutating op returns the resulting draft count | YES — but expressed in CAP-99 (finding 3) |
| REQ-137 (`request-d2980a95`) | free_and_reconciled | 2026-08-12 → 08-17 | L1 palette: `shade` on the reference replaces named `steps` | YES — no AC edit needed (finding 4) |
| REQ-139 (`request-3f57cd0c`) | free_and_reconciled | 2026-08-12 → 08-20 | The operator modal locks a control that cannot faithfully express what the element holds | YES — no AC edit needed (finding 5) |
| REQ-134 (`request-ba3e3fba`) | abandoned | 2026-08-12 | Image-generation component | NO |
| REQ-160 (`request-bbff35c7`) | draft | 2026-08-30 | Session seeding, turn reminders, change cursor | NO (not active) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1083 (`acceptance_criterion-da12ce4c`) — map returns every element | REQ-129 | aligned — matches the story's "Where is everything" bullet, including the instance/slot scoping and the independent-walk comparison |
| AC-1084 (`acceptance_criterion-f1e7490c`) — label recognises, no styling in the map | REQ-129 | aligned — carries the story's size-follows-node-count claim as an assertion |
| AC-1085 (`acceptance_criterion-aa3322ea`) — verbatim read | REQ-129, REQ-137 | aligned, durably — phrased model-agnostically ("a reference … still a reference"), so REQ-137's `steps`→`shade` change needs no edit |
| AC-1086 (`acceptance_criterion-9a249134`) — read→write round trip is accepted | REQ-129 | aligned — and correctly notes a refusal also leaves the page unchanged, so acceptance must be asserted |
| AC-1087 (`acceptance_criterion-277dfb8a`) — replace is whole-subtree, siblings untouched | REQ-129 | aligned |
| AC-1088 (`acceptance_criterion-d75d0764`) — add/remove as group replace, and it renders | REQ-129 | aligned — carries the story's "no separate insert or delete" and REQ-129's nav-bar acceptance case |
| AC-1089 (`acceptance_criterion-4d4ac81f`) — off-vocabulary refused whole, draft byte-unchanged | REQ-129, DOC-2 | aligned — all six measured security cases present |
| AC-1090 (`acceptance_criterion-4bd36a69`) — a refusal is correctable | REQ-129 | **drift** — records as a live limitation a gap that has since closed upstream (finding 1) |
| AC-1091 (`acceptance_criterion-bad505ff`) — bad address refused, nothing written | REQ-129, REQ-126 (addressing) | aligned |
| AC-1092 (`acceptance_criterion-fbda4a6e`) — exactly one way to change a page; declared ≡ implemented | REQ-129 | aligned — covers the retired copy pair, the tool list, the manual and the `AuthorPages` grant |
| AC-1093 (`acceptance_criterion-d1bda2c2`) — operator modal opens/saves on assistant-composed elements | REQ-129, REQ-139 | aligned — phrased as "the fields that element's **kind** exposes", so REQ-139 widening the text row set does not falsify it |
| AC-1094 (`acceptance_criterion-84b87d8a`) — no fields on a kind the form does not edit | REQ-129, REQ-139 | aligned — REQ-139's rule is *never hide a row*, which cannot turn an empty list non-empty |

### Consistency — each AC against the story body

Eleven of twelve trace cleanly to a bullet of STORY-106's body. The exception is AC-1090,
and the contradiction is explicit rather than inferred: the story body now says the
upstream limitation **"has since been closed"** and that "a refused replacement now names
the offending pointer **as well as** the strategy", while AC-1090 still carries a
paragraph headed *"Known limit, deliberately recorded"* asserting the opposite. See
finding 1.

### Coverage — the story's behavioural surface against the AC set

Every in-scope bullet of STORY-106 is covered, with no residue:

| Story bullet | Covered by |
|---|---|
| Where is everything (the map) | AC-1083, AC-1084 |
| Read one element as it stands | AC-1085 |
| Replace one element (+ the read/write pair) | AC-1086, AC-1087, AC-1091 |
| Adding and removing | AC-1088 |
| One way to change a page | AC-1092 |
| Where the security guarantee now lives | AC-1089, AC-1090 |
| The operator's editing gesture is untouched | AC-1093, AC-1094 |

The body's second recorded divergence (the vestigial `nav` settings key) is explicitly
*not* addressed by this story and correctly has no AC. The out-of-scope absence of
whole-document submission is covered obliquely rather than directly — see finding 2.

### Exclusivity

No two ACs state the same criterion. The near neighbours were checked individually:
AC-1086 (a faithful round trip is **accepted**) vs AC-1087 (a *different* element
replaces the subtree) differ in what is sent and what is asserted; AC-1089 (schema-invalid,
six payload shapes) vs AC-1091 (not-found / malformed **address**) are different refusal
classes on different inputs; AC-1089 asserts the refusal and the byte-unchanged draft
while AC-1090 asserts what the refusal *says*; AC-1093 (a kind the form edits) and
AC-1094 (a kind it does not) are complementary halves of one invariant, not a duplicate.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | **violation** | consistency | AC-1090 (`acceptance_criterion-4bd36a69`) | `ac-edit` | The criterion's *"Known limit, deliberately recorded"* paragraph — "this caller does not receive the specific offending field … The tool layer renders only the declared meaning of the failure code … This criterion asserts the strategy; it does not assert the field name" — states a limitation the shipped system no longer has, and the criterion is deliberately weakened because of it. STORY-106's body (edited today, REPORT-3866 pass) says the opposite: "closed upstream, no longer a limit … a refused replacement now names the offending pointer **as well as** the strategy", and names the weak AC as "an outstanding matrix edit, not a missing behaviour". Verified independently this cycle against the installed upstream, not taken from the story-level report: `node_modules/@lagrangefoundry/ai/src/toolbox/declaration.js:463` sets `hostDetail: flag(where, declared, 'host_detail', true)` (opt-*out*, default true); `runtime.js:487-496` renders `Error: <tool> failed (<code>). <declared meaning> The host reports: <detail>`; `runtime.js:549-558` (`usableDetail`) returns the JSON pointer **even when the message text is judged redundant** ("a useless message must not take one with it"); `tools/generate/src/cli/ai/l1-surface.json:124-126` declares `SCHEMA_INVALID` with no `host_detail` key, so it does not opt out; and `tools/generate/src/cli/edit.ts:800-816` is already rewritten to `UPSTREAM FINDING, CLOSED`. So the pointer reaches this caller today | Delete the "Known limit" paragraph. Strengthen the criterion to: a refusal carries the failure code, the recovery strategy (nothing written / do not resend unchanged / read the element back) **and** the offending field, named as a pointer into the element. Update Verification to assert the pointer for the wrongly-typed appearance property (e.g. the refusal names `fontSizePx`) alongside the three strategy assertions |
| 2 | warning | coverage | AC-1092 (`acceptance_criterion-fbda4a6e`) | `uat-edit` (cascade of finding 1) | `tests/test_UAT_FC_REQ-129_l1_authoring.test.ts:374-400` (`test_UAT_FC_REQ_129_a_refusal_is_correctable_within_the_turn`) asserts only the three strategy strings. Its own comment at lines 384-390 already records the closure and says "Asserting the pointer is a strengthening of AC-1090 that has not been made yet; when it is, assert it here." The test is **green** — the assertion has merely stopped being the strongest available — so this is not a failure, but once finding 1 lands the test no longer proves its AC in full | Add `expect(answer).toMatch(/fontSizePx/)` (or an assertion on the full `/pages/…/axes/fontSizePx` pointer) and delete the "has not been made yet" paragraph. Strictly a `uat`-level repair; recorded here because it is the direct consequence of finding 1 and the two should move together |
| 3 | info | coverage | STORY-106 AC set | — | REQ-131 (free_and_reconciled 2026-08-20) made every mutating operation return the resulting draft count, and `set_l1`'s `change` shape gained `now`. No AC here states a result contract for `set_l1` beyond "the reply names the address" (AC-1087), so nothing is false. The count is claimed once, for every write on the path, by STORY-115 (`story-6cd17452`, CAP-99 `capability-702b7c02`). Adding an AC here would duplicate a cross-cutting claim across two capabilities | none — coverage sits in CAP-99 by design |
| 4 | info | consistency | AC-1085 | — | REQ-137 (free_and_reconciled) deleted the palette's named `steps` and added `shade` on the reference — a change to the vocabulary `get_l1` returns verbatim. AC-1085 says "a reference to a site-level value comes back as that reference", never naming the entry model, so it survives the change untouched | none |
| 5 | info | consistency | AC-1093 + AC-1094 | — | REQ-139 (free_and_reconciled) changed the operator modal these two ACs promise is unchanged: a control that cannot faithfully express what the element holds is now shown **locked with a reason** rather than dropped (`copyFieldsOf`, `packages/site-schema/src/l1/edit.ts:967-973`, derives the colour row either way). Both ACs survive: AC-1093 asserts "the fields that element's **kind** exposes … carrying its current values" (kind-relative, so a widened row set is still the right answer) and asserts survival of the assistant's axes across a save, which REQ-139's "a lock binds a change, never the status quo" strengthens; AC-1094 asserts an **empty** list for a kind exposing nothing, which a never-hide-the-row rule cannot make non-empty. This is the likeliest false positive for a future cycle | none |
| 6 | info | coverage | AC-1092 | — | CAP-93's scope and STORY-106's out-of-scope both state that there is *no way to submit a whole page at once*, and REQ-129 records it as a declared absence. No AC asserts that absence by name; it is covered obliquely by AC-1092's two claims — changing a page is reached through a *single* operation, and declared operations ≡ implemented operations in both directions — which together make an undeclared whole-document write unreachable. Judged adequate rather than a gap; noted so a future cycle does not re-derive it | none |

## Notes for the Editor

**Finding 1 is the only thing standing between this level and a pass, and it is a
one-ticket edit.** It is the cascade the story-level cycle explicitly deferred here —
REPORT-3864 (`report-491a72d5`) listed the stale claim in four places and said of
AC-1090: *"That is an `ac-edit` cascade, for the ac-level cycle, not for this one."* Three
of the four have already moved: the story body (REPORT-3865), the `editL1Set` comment
(`edit.ts:800`, now "UPSTREAM FINDING, CLOSED") and the test's own comment. AC-1090 is the
straggler, and finding 2 is the fourth place.

**Do not weaken the strategy half when you strengthen the field half.** The declared
`SCHEMA_INVALID` message (`l1-surface.json:125`) was deliberately written to carry the
recovery strategy *because* the pointer could not get through. Now that both arrive, they
are complementary — upstream appends the host detail to the declared meaning, it does not
replace it. AC-1090 should assert both, not swap one for the other.

**Dependency drift has no commit here.** `@lagrangefoundry/ai` is not pinned in the
lockfile, so this behaviour change arrived with no commit, no intent ticket and no red
test in this repository. Its installed `package.json` declares `"version": "0.0.0"`, so a
future run against a different installed copy could legitimately reach a different answer
and should re-read `node_modules/@lagrangefoundry/ai/src/toolbox/runtime.js` rather than
trust this report. The evidence cited in finding 1 was read end to end this cycle
(declaration default → `renderHostError` → `usableDetail` → the surface's own declaration
→ the thrown `CommandError`), not carried forward.

**Method.** Static analysis of the ticket store and the working tree. The test suite was
not executed — this session runs in don't-ask mode, which denies the runner — and no test
outcome is asserted here beyond what the file's own source shows. Read-only: no ticket,
test or source file was modified.

**Traceability friction, unchanged.** CAP-93 carries no `intent_uid`, and STORY-106's
points at BUNDLE-17, so establishing that REQ-129 governs still costs a dereference of
eight bundled requests. Raised at the tooling level, not repaired here.
