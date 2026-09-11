---
uid: report-491a72d5
id: REPORT-3864
type: report
title: 'Capability-Intent Alignment: Page Authoring Through The Control Surface: Read
  & Replace The Element Tree (level=story)'
created_by: xgd
created_at: '2026-09-11T02:00:35.712948+00:00'
updated_at: '2026-09-11T02:00:35.712948+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-fe236246
  level: story
  violations: 1
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Page Authoring Through The Control Surface: Read & Replace The Element Tree
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 0
**Needs review**: 0

Anchor report: report-e37a6b4a. CAP-93 (`capability-fe236246`) has exactly one story —
STORY-106 (`story-189fc1ac`, `story_kind=feature`, status `completed`), 12 active ACs.
Confirmed by a ticket-store sweep: `story-189fc1ac` is the only non-report ticket carrying
`capability_uid: capability-fe236246`.

This is the second story-level pass on this capability. The first (REPORT-2048,
`report-d533b6d6`, 2026-08-16, anchor report-7ef6a9ea) passed with 0 findings. Three of the
intents it recorded as *imminent, not landed* have since reconciled, and it is one of those
— together with a change in an unpinned upstream dependency — that produces the finding
below.

## Cumulative Intent Considered

STORY-106's `fields.intent_uid` is **BUNDLE-17** (`bundle-e59210c5`,
`free_and_reconciled`, `merged_at_commit 0198704b7e29db3c53cf569070042cec0eb467bc`), which
rolls up eight source requests; exactly one of the eight governs this capability. Intents
created after the bundle were swept for asks reaching this capability's surface
(`describe_page` / `get_l1` / `set_l1` / `AuthorPages`), and the three that do are carried
below with their *current* status.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 | free_and_reconciled | 2026-08-08 | Declared the control surface: 16 ops, error taxonomy, addressing contract. **Owned by CAP-92** | YES (dependency, not this capability) |
| REQ-127 | free_and_reconciled | 2026-08-08 | Tooling configuration over the surface. **Owned by CAP-92** | YES (dependency, not this capability) |
| REQ-129 | free_and_reconciled | 2026-08-09 | **The governing intent.** `describe_page` widened to every node; verbatim `get_l1`; subtree-replacing `set_l1`; `get_copy`/`set_copy` retired from the AI surface; the security guarantee relocated to L1's closed schema; the operator modal left unchanged | YES — primary |
| REQ-130 | free_and_reconciled | 2026-08-09 | Beyond the element tree: config, components, page metadata, generated assets. **Owned by CAP-94** | YES (sibling, explicitly out of scope here) |
| REQ-119 / REQ-121 / REQ-122 / REQ-128 | free_and_reconciled | 2026-07-31 … 2026-08-08 | The rest of BUNDLE-17. No reach into this capability's surface | YES (unrelated to this capability) |
| REQ-131 | **free_and_reconciled** (was `ready_to_reconcile` at the last pass) | created 2026-08-11, completed 2026-08-20 | Draft change journal. Every mutating operation returns the resulting draft count — `set_l1`'s `change` shape gained `now` (`l1-surface.json:88-92`), and `list_changes` joined `ReadSite` | YES — **landed since the last pass** |
| REQ-137 | **free_and_reconciled** (was `bundled`) | 2026-08-12 | L1 palette: `shade` on the reference replaces named `steps` — changes the vocabulary `get_l1` returns verbatim | YES — **landed since the last pass** |
| REQ-139 | free_and_reconciled | 2026-08-12 | The operator modal locks a control that cannot faithfully express what the element holds, with a reason | YES — CAP-86/CAP-87, touches STORY-106's non-regression claim |
| REQ-134 | abandoned | 2026-08-12 | Image-generation component | NO |
| REQ-160 | draft | 2026-08-30 | Session seeding, turn reminders, the change cursor | NO (not active) |

All three newly-landed intents were verified against the working tree rather than taken
from status: `packages/site-schema/src/l1/palette.ts:107` now carries `shade` and the file's
header records the deletion of `steps` (REQ-137); the `change`, `publish_result`, `image`,
`asset` and `palette_change` shapes all declare `now` (REQ-131); `L1FieldDescriptor.reason`
and the lock derivation are in `packages/site-schema/src/l1/edit.ts` (REQ-139).

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-93 (capability body) | REQ-129 | aligned — the five scope bullets restate REQ-129's delivered parts; out-of-scope correctly cedes governance to CAP-92 and everything beyond the element tree to CAP-94 |
| STORY-106 | REQ-129 (primary); REQ-126, REQ-127 (depended-on) | **drift** — every in-scope bullet and both out-of-scope items still trace cleanly, but the first of the two recorded divergences describes a limitation the shipped system no longer has (finding 1) |
| STORY-106 | REQ-131 | aligned — the count `set_l1` now returns is expressed in STORY-115 (`story-6cd17452`, CAP-99), which claims it for *every* write on the path; restating it here would re-open the boundary the overlap survey just closed (finding 2) |
| STORY-106 | REQ-137 | aligned, durably — story body and AC-1085 speak of "references still references" and never of `steps`, so the entry-model change needs no matrix edit (finding 3) |
| STORY-106 | REQ-139 | aligned — the modal invariant STORY-106 asserts survives REQ-139 intact (finding 4) |

### Consistency — story body against intent

Everything in the body traces to REQ-129 **except** the first divergence bullet.

Re-verified as still true:

- "the narrower copy-field pair retires **from this surface**" — no `get_copy`/`set_copy`
  op survives in `tools/generate/src/cli/ai/l1-surface.json` (op list re-read in full at
  `surface_version: 4`), while `copyFieldsOf` still backs the operator modal.
- "a caller has one operation for changing what is on a page" — the `AuthorPages` group
  declares exactly one operation, `set_l1` (`l1-surface.json:790-797`), and it is granted
  in `instances.json:6`. `ManagePages` / `ManageComponents` are separate declared groups
  owned by CAP-94, so the claim reads correctly at the element-tree grain.
- "the map carries no styling at all" — `describe_page` returns the `page_map` shape;
  REQ-130 added the page's component instances to it, which is not styling and is already
  inside CAP-93's own "the component instance and slot it sits inside" scope bullet.
- The second recorded divergence — the vestigial navigation key — still holds:
  `packages/site-schema/src/schema.ts:990` carries `nav: navConfigSchema`, and no render
  path reads it.

The first recorded divergence does **not** hold. See finding 1.

### Coverage — intent expressed in the story tree

REQ-129's delivered asks map onto the AC set without residue (unchanged from the last
pass). The one behavioural addition since — REQ-131's returned draft count — is expressed
in the matrix, in the sibling capability that owns the cross-cutting rule. No reconciled
intent's ask for this capability is unexpressed.

### Exclusivity

No overlap. Independently re-confirmed this cycle by the anchor's own overlap survey
(`report-55d8a179`, cluster 5, "Two AI-reachable routes to changing the words and pictures
on a page") and its resolution (`report-f56df596`, 2026-09-09, **confirm / no change**):
STORY-100 owns the field-level change map over an addressed editable region; STORY-106 owns
the element-level map / verbatim read / bounded replace. Different unit of change,
different vocabulary, each declared explicitly.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-106 (`story-189fc1ac`) | story-body-edit | The body's first recorded divergence — *"Refusal specificity is degraded for this caller … the assistant's tool layer renders only the declared meaning of the error code and drops the detail, so a refusal names what to do rather than which field. … The acceptance criterion below asserts the mitigation that exists, not the fix that does not"* — describes behaviour the shipped system no longer has. The upstream tool layer was fixed (its own BUG-39) and now appends the host's own account to a declared refusal: `node_modules/@lagrangefoundry/ai/src/toolbox/runtime.js:487-495` renders `Error: <tool> failed (<code>). <declared meaning> The host reports: <detail>`, and `toolbox/declaration.js:445-464` makes `host_detail` **opt-out, defaulting to true**. This surface's `SCHEMA_INVALID` does not opt out (`tools/generate/src/cli/ai/l1-surface.json:124-126`), and the refusal `set_l1` raises carries the pointer: `validateOrThrow` throws `CommandError{code:'SCHEMA_INVALID', path:<JSON-pointer>, message:'<pointer>: <reason>'}` (`tools/generate/src/cli/edit.ts:215-226`), which `describeFailure` reads verbatim (`runtime.js:454-460`). A refused `set_l1` therefore *does* now name the offending field | Rewrite the divergence bullet: the upstream gap it records has closed, so either delete it or restate it as "was a known limit under REQ-129; closed upstream, the refusal now carries the offending pointer". Do not leave a false limitation standing — it is the kind of note a future reader designs a workaround around |
| 2 | info | coverage | STORY-106 | — | REQ-131 (reconciled 2026-08-20) made every write return the draft count, so `set_l1`'s `change` shape gained `now`. The last pass predicted this would need a STORY-106 body edit at reconcile. It does not: STORY-115 (`story-6cd17452`, CAP-99) states the rule once for *every* write on the path, and STORY-106's body never claims a result contract for `set_l1`, so nothing here is false. Restating it would duplicate a cross-cutting claim across two capabilities | none — coverage sits in CAP-99 by design |
| 3 | info | consistency | STORY-106 | — | REQ-137 (reconciled) deleted `steps` and added `shade`. The story body and AC-1085 describe the verbatim guarantee model-agnostically, so the palette change needs no matrix edit — the prediction the last pass made held | none |
| 4 | info | consistency | STORY-106 | — | REQ-139 (reconciled) changed the operator modal STORY-106 promises is "untouched … the same small form over the same fields". It survives: REQ-139's rule is explicitly *never hide the row* (a control is shown locked with a reason, never dropped), so the field list is unchanged; and "a lock refuses a CHANGE, never the status quo", so "saving through it leaves everything the assistant set alone" is strengthened rather than contradicted — a locked colour on an assistant-authored gradient rides along while the words save | none — but see Notes, this is the likeliest false positive next cycle |
| 5 | info | exclusivity | STORY-106 + STORY-100 | — | Re-confirmed by this anchor's own overlap resolution (`report-f56df596`, cluster 5, confirm/no change) | none |

## Notes for the Editor

**The one violation is a dependency-drift finding, and that is what makes it easy to miss.**
Nothing in this repository changed. `@lagrangefoundry/ai` is not pinned in the lockfile, so
the upstream fix arrived with no commit, no intent ticket and no failing test here. The
stale claim is currently recorded in **four** places and they should move together:

1. STORY-106's body, "Divergences and known limits" — the finding above.
2. **AC-1090** (`acceptance_criterion-4bd36a69`), whose "Known limit, deliberately recorded"
   paragraph says the same thing and whose criterion is deliberately weakened because of it.
   That is an `ac-edit` cascade, for the ac-level cycle, not for this one.
3. `tools/generate/src/cli/edit.ts:800-808` — the `UPSTREAM FINDING` comment on `editL1Set`.
4. `tests/test_UAT_FC_REQ-129_l1_authoring.test.ts:381-385` — the comment inside
   `test_UAT_FC_REQ_129_a_refusal_is_correctable_within_the_turn` ("until it lands").

The UAT itself still **passes** as written — it asserts the declared meaning carries the
recovery strategy, which it still does. Nothing is red; the assertion has simply stopped
being the strongest one available. If the ac-level cycle strengthens AC-1090 to assert the
field name, that becomes a `uat-edit` for the same test.

**Method, stated plainly.** Static analysis. The test suite was not executed: this session
runs in don't-ask mode, which denies the runner. Finding 1 is nonetheless traced end to
end through read source — thrown error → `describeFailure` → `host_detail` default →
`renderHostError` — rather than inferred from one line. Note for reproducibility that the
decisive evidence lives in `node_modules/@lagrangefoundry/ai/src/toolbox/`, whose
`package.json` declares `"version": "0.0.0"`; a future run against a different installed
copy of that store could legitimately reach a different answer, and should re-read
`runtime.js` rather than trust this report.

**Two predictions from the last pass, resolved.** Both imminent intents it flagged have now
landed, and neither produced the drift it feared (findings 2 and 3). The drift came from a
third direction it did not watch — the upstream dependency it had itself recorded as the
source of a divergence.

**Traceability friction, unchanged and still systemic.** CAP-93 carries no `intent_uid`;
STORY-106's points at BUNDLE-17, so establishing that REQ-129 governs still costs a
dereference of eight requests. Raised once at the tooling level rather than repaired here.
