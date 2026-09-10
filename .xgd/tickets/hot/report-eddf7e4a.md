---
uid: report-eddf7e4a
id: REPORT-3638
type: report
title: 'Capability-Intent Alignment: Palette Management: The Site''s Named Colours,
  Read, Edited & Guarded (level=ac)'
created_by: xgd
created_at: '2026-09-10T02:36:37.805000+00:00'
updated_at: '2026-09-10T02:36:37.805000+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a0bba4ec
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Palette Management: The Site's Named Colours, Read, Edited & Guarded
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a. Capability: capability-a0bba4ec (CAP-98).
Matrix read at ac level: 2 stories (both `story_kind: feature`, both therefore
expected to carry ACs), 24 acceptance criteria.

## Cumulative Intent Considered

Every element in this capability's tree carries `intent_uid: bundle-77b28def`
(BUNDLE-19). Neither story nor any of the 24 ACs carries an `updated_by` entry,
so no later intent has modified this capability's tree since the bundle landed.
Within the bundle, **REQ-133** is the sole source ticket that speaks to this
capability; the bundle's other eight source tickets (BUG-35, REQ-131, REQ-139,
REQ-141, REQ-142, REQ-144, REQ-123, and REQ-140) land elsewhere. REQ-140 is
listed below because it is the consumer that opens this capability's pick mode
and it restates the free-hex boundary.

| Intent ID | Status | When (created_at) | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-114 | free_and_reconciled | 2026-07-31 | The L1 palette colour model this capability sits on (entry shape, reference shape). Framework substrate — CAP-98 out-of-scope | YES (as substrate) |
| REQ-119 | free_and_reconciled | 2026-07-31 | Made both draft-side channels render at request time — the fact REQ-133's restated AC-12 rests on | YES |
| REQ-133 | free_and_reconciled | 2026-08-12 | **The originating intent.** Palette popup + `1c palette` command group + `/api/palette` + AI `ManagePalette` group; census with usage counts; the four writes and their guards; 15 ACs, 7 recorded decisions | YES |
| REQ-135 | free_and_reconciled | 2026-08-12 | Text properties; Phase B consumes REQ-133's pick mode. §3.1's named-step ramp grid superseded | YES (consumer) |
| REQ-137 | free_and_reconciled | 2026-08-12 | Split out of REQ-133 §2 and landed first: entry = one colour, continuous `shade` on the reference, `steps` **deleted**. Framework substrate | YES (retired `steps`) |
| REQ-140 | free_and_reconciled | 2026-08-15 | Segment colour fields (`color`, `surfaceFill`) picking from this palette; restates "from a segment a user cannot invent an off-system colour". Copy-editing capability | YES (consumer) |
| BUNDLE-19 | free_and_reconciled | 2026-08-18 (completed 2026-08-20, `merged_at_commit b18b859d`) | The reconciliation vehicle carrying REQ-133 into the matrix; `intent_uid` of both stories and all 24 ACs | YES |
| REQ-166 | draft | 2026-08-31 | Mentions "palette" only illustratively (bundles as corpus members) — asks nothing of this capability | NO (draft, and not on-subject) |

No intent touching this capability is `abandoned`, `deprecated` or `wont_fix`,
so Step 2.5's stale-named-vehicle case does not arise anywhere in this tree.
One matrix element (AC-1458) was added outside the intent chain, by
`fix_uat_coverage` on 2026-08-31 under the BUG-1306 (lagrangefoundry/xgd)
auto-default policy; it is recorded as a Reconciliation Decision in both the
story body and its own AC body.

**Retired behaviour check.** Three things the ledger retires — REQ-137's named
`steps`, REQ-133 decision 5's withdrawn re-render-on-write, and REQ-133 §5c's
rejected `--force` override — are claimed by **no AC** in this capability.
AC-1238 asserts the *opposite* of the withdrawn re-render (no rebuild needed),
and AC-1233 asserts the *absence* of an override, both of which is what the
ledger calls for.

## Alignment Ledger

Working reference at this level is the story body (story-level cycle ran first).
Both stories carry `story_kind: feature`, so the "every story has ACs" check
applies to both.

### STORY-113 (`story-ee073693`) — CLI / origin / assistant surface, 12 ACs (AC-1229…AC-1239, AC-1458)

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1229 `6b7a0f6a` — read answers every entry + count across definition and every page, zero not omitted, no palette = empty not error | REQ-133 §3, AC-11 | aligned |
| AC-1230 `f14ffe78` — change repaints every use at every position, no page rewritten, reports count, unknown entry = not-found | REQ-133 §5a, AC-5; REQ-137 | aligned |
| AC-1231 `6dc06622` — add takes kebab-case + opaque colour; duplicate / malformed / alpha-carrying each refused, definition byte-unchanged | REQ-133 §5b, AC-6 | aligned |
| AC-1232 `fa84760f` — remove at zero references succeeds, other entries keep colour and count | REQ-133 §5c, AC-7 | aligned |
| AC-1233 `f8c7ce1b` — remove in use refused naming the count, enforced at the write, client-error status, no override | REQ-133 §5c, AC-7 | aligned |
| AC-1234 `f77d415d` — rename moves key **in place** and rewrites every reference in one write; positions and transparency survive; renders byte-identically | REQ-133 §5d, AC-8 | aligned |
| AC-1235 `dc286c89` — rename onto existing name (conflict) or non-kebab-case (schema) refused server-side; no partially-renamed state | REQ-133 §5d, AC-9 | aligned |
| AC-1236 `6abc5669` — count before rename == count rewritten == references in files, on a site with references at several positions | REQ-133 AC-10, §6 one-walk | aligned |
| AC-1237 `2903cd4a` — origin read == CLI read; closed operation vocabulary refuses an undeclared verb; **every origin write answers with result + whole re-taken census**; the four writes also at the CLI, each reporting its own result | REQ-133 §6, AC-11 | aligned — and this AC is the *documented* landing of the story's flagged divergence (intent says *every* write returns the full census; as implemented only the origin does, and the AC asserts the full census where it is observable and the operation's own result at the other two callers) |
| AC-1238 `66f840fe` — no rebuild; next request for either draft-side channel serves the new colour | REQ-133 AC-12 (restated), decision 5; REQ-119 | aligned |
| AC-1239 `902e13a5` — all five operations declared to the assistant, read grantable separately from the one write group, each in exactly one group; same guards and `CONFLICT` code, draft byte-unchanged; the **count** reaches the model through `get_palette`, not through the refusal sentence | REQ-133 §6, AC-14, decision 7 | aligned — likewise the documented landing of the story's second flagged divergence (refusal *wording* differs across callers even though guard, code and unchanged draft do not) |
| AC-1458 `e0a729db` — self-rename (`to === from`) succeeds as a no-op, reports the current count, draft byte-unchanged | REQ-133 §5d *rationale* (extension); not stated by any intent | aligned — auto-defaulted 2026-08-31 to shipped behaviour (`tools/generate/src/cli/edit.ts:1744`) under BUG-1306; the decision and its reasoning are recorded in both the story body and the AC body, so this is a disclosed extension rather than silent drift. Status `pending` (3 other ACs in the store share that status, so it is not an anomaly of this tree) |

Story-113 body coverage sweep — all six "In scope" bullets are addressed:
read with counts from CLI and origin (AC-1229, AC-1237); the four writes and
their server-side refusals (AC-1230/1231/1232/1233/1234/1235); closed origin
vocabulary (AC-1237); census on write (AC-1237); five operations declared to
the assistant with the read separately grantable (AC-1239); free colour entry
living on this surface (AC-1230, AC-1231 both carry an operator-supplied
colour). No behaviour in the body is left unaddressed.

### STORY-114 (`story-4300366a`) — the browser popup, 12 ACs (AC-1241…AC-1252)

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1241 `82487569` — toolbar colour control in **both** channels, bound to the displayed site, as an ordinary registered action; no site displayed opens nothing | REQ-133 §1, §7, AC-1 | aligned (the no-site clause is an implemented boundary condition, not in the body — see Notes) |
| AC-1242 `8ca89c72` — one swatch per entry with name, colour-as-colour and count at any position; unreferenced entry at zero, not omitted | REQ-133 §3, AC-1 | aligned |
| AC-1243 `286a20f5` — empty palette is a legitimate starting state: names the site, invites a first colour, offers the same add control, no error | REQ-133 §3, AC-2; REQ-140 §6 | aligned |
| AC-1244 `4fbdaf70` — no position control before a selection; then a **continuous** darkest↔lightest control with live preview, previewing with the renderer's own arithmetic | REQ-133 §3, AC-3, decision 4; REQ-137 | aligned |
| AC-1245 `19b91413` — in manage mode the position control writes nothing: definition byte-unchanged, opener answered with no value | REQ-133 §3, decision 6 | aligned |
| AC-1246 `e30441b0` — a pick resolves to a palette reference; position **omitted** (not zero) at the colour itself; never a typed colour, never transparency; confirm unavailable with nothing selected | REQ-133 §4, AC-4 | aligned |
| AC-1247 `8b77d10c` — cancel control, Escape and outside-click each close, resolve with no value, leave the definition unchanged, and answer the opener **exactly once** | REQ-133 §4, AC-4 | aligned |
| AC-1248 `67bfd97c` — opened over a reference the caller holds: that entry selected at that position; held entry absent from the palette = nothing selected and no error; position resets on moving entry and is restored on returning | REQ-133 §4 (`openPalette(slug, {mode:'pick', value})`) | **gap: intent-grounded and implemented, but STORY-114's body never describes it** — Finding 1 |
| AC-1249 `f46a6aac` — a colour is typed here: native control and text field are one value, either submittable; applying reports uses repainted and the displayed page shows the new colour without an operator refresh | REQ-133 §5a, §7, AC-13, decision 5 | aligned (the page-refresh half is the replacement for the withdrawn re-render, exactly as decision 5 directs) |
| AC-1250 `f608f01e` — after any accepted edit the surface redraws from the store's census: add appears at zero, remove leaves nothing selected, rename appears selected under its new name; each confirmed in words | REQ-133 §6; story body "redraws from the census that write answers with" | aligned |
| AC-1251 `046a5b98` — a refused edit leaves the surface open and its listing unchanged and shows the store's **own** message and hint verbatim, not a paraphrase | REQ-133 §5, §6; story body | aligned |
| AC-1252 `d4f2482a` — removal control shown-but-unavailable on an entry in use, giving the count as the reason; rename control states the count **before** it runs, the same number the swatch shows and the completed rename reports; the store refuses regardless of what the surface displayed | REQ-133 §5c, §5d "the count travels with it", AC-7, AC-10 | aligned |

Story-114 body coverage sweep — every behavioural paragraph is addressed:
Colors control in both channels (AC-1241); swatch with name and count, zero not
omitted (AC-1242); empty palette reads as an invitation (AC-1243); continuous
position control previewing with the renderer's arithmetic (AC-1244); manage
mode writes nothing but still shows the family (AC-1245); what a pick resolves
to, with the position omitted at zero (AC-1246); cancel answering exactly once
(AC-1247); typing a colour lives here (AC-1249); redraw from the census
(AC-1250); refusal in the store's own words and hint (AC-1251); greyed-out
removal as an explanation not the rule (AC-1252); page refreshed after a write
(AC-1249). The body's non-behavioural material — the "not a third channel"
framing, the shared dialog shell, the recorded `mount()`-ordering quirk, and the
"Divergence from intent — none of substance" note — correctly carries no AC.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-114 (`story-4300366a`) + AC-1248 (`acceptance_criterion-67bfd97c`) | story-body-edit | AC-1248 specifies a three-part behaviour for the surface **opened over a reference the caller already holds** — the held entry starts selected at the held position; a held entry no longer in the palette yields no selection and no error; moving the selection to another entry resets the position to the colour itself and returning restores the held one. STORY-114's body never mentions an incoming value: its only account of pick mode is "a colour field somewhere that needs a value. The surface additionally resolves to a selection and hands it back to whoever opened it." The AC is not inventing behaviour — REQ-133 §4 names the parameter (`openPalette(slug, {mode: 'pick', value})`) and the implementation carries all three parts (`apps/control-app/src/builder/palette-popup.js:63-64` seeds selection and shade from `value`; `:170` resets the shade only when the selection moves and restores `value.shade` on returning to the held entry; `:402` clears a selection the palette no longer holds). The incomplete artifact is the story body, not the AC | Add a paragraph to STORY-114's Description covering pick mode's incoming value: that the surface opens on the reference its caller holds so opening a picker cannot silently change the colour it was opened over, that a held entry the palette no longer declares opens on no selection rather than describing a colour the site does not have, and that a position belongs to one entry's family so moving entries resets it. Cite REQ-133 §4. Leave AC-1248 unchanged |

No violations and nothing requiring escalation: every other AC in both stories
follows from its story body, every behaviour in both bodies is addressed by at
least one AC, and no two ACs within a story state the same criterion.

## Notes for the Editor

- **The two disclosed divergences are landed correctly, and should not be
  "repaired".** STORY-113's Technical Context flags two places where the
  implementation reads more narrowly than REQ-133: only the origin returns the
  whole re-taken census on a write (the CLI and the assistant return the
  operation's result and the affected entry's count), and only the CLI sees the
  store's own count-naming refusal sentence (the assistant gets the `CONFLICT`
  code and the toolbox's declared text for it). AC-1237 and AC-1239 assert
  precisely the implemented shape, name the boundary, and point at where the
  count is still reachable. That is the correct handling — flagged in the story,
  asserted where observable — and neither is a finding. Both remain live if the
  operator ever wants the intent read strictly; closing the second would mean
  carrying the thrown error's message through the toolbox refusal renderer,
  which is upstream of this repository.

- **AC-1241's no-site clause and AC-1248 are the same species, handled
  differently.** Both add an implemented behaviour the story body omits. AC-1241's
  addition is a single degenerate-input clause ("activating it opens nothing and
  reports nothing"), implemented as the `if (!slug) return` guard at
  `apps/control-app/src/builder/toolbar.js:204`, and it follows directly from the
  body's "opens the palette surface for the site currently displayed" — not worth
  a body edit. AC-1248 is a three-behaviour cluster with a user-visible rule of
  its own (a position belongs to one entry's family), which is why only it is
  raised. If the editor is touching STORY-114's body for Finding 1 anyway, a
  clause on the no-site case is a cheap opportunistic addition.

- **Intent AC-13's exclusion half lives in another capability, by design — do
  not add a duplicate here.** REQ-133 AC-13 is two-sided: "Free hex entry exists
  only in this surface; no segment field can express one." The positive half is
  AC-1249 here. The exclusion half is carried by AC-08c7ebe8 under
  `story-37a3921b` in the structured-copy-editing capability ("There are exactly
  five shapes of field this surface can offer, and none of them can carry
  code... or a reference into the site's own palette"), reinforced by AC-97f5dee6
  (a colour outside the site's palette is refused rather than ignored) and
  REQ-140 AC-3. That split is exactly what CAP-98's own "Out of scope" prescribes
  — segment-level colour controls belong to the copy-editing capabilities — so
  the absence of an exclusion AC in this capability is correct, not a coverage
  gap. A grep of all 635 ACs in the store found no other AC claiming this
  behaviour, so there is no duplication risk either.

- **A near-duplicate pair that is not one.** AC-1245 (manage-mode position
  control writes nothing) and AC-1247 (every exit route resolves with no value)
  both end in "definition unchanged, opener answered with no value". They are not
  redundant: AC-1245's subject is the *control* (a position lives on a use, so
  there is nothing on an entry for it to write), AC-1247's is the *exit routes*
  and the answer-exactly-once property. REQ-133 separates them too (decision 6
  vs §4). Same judgment applies to AC-1234/AC-1236 — REQ-133 lists the rename
  rewrite (AC-8) and the single-traversal identity (AC-10) as separate criteria,
  and the ACs mirror that. Left alone deliberately.

- **AC-1240 is absent from the store.** The two stories' ACs run AC-1229…AC-1239
  and AC-1241…AC-1252, both contiguous. AC-1240 belongs to no ticket anywhere in
  the store. Numbering gap only — no element of this capability is missing.

- **Out of scope at this level, recorded for whoever owns it.** Eleven of
  STORY-113's twelve ACs (AC-1229…AC-1239) carry no `uat_coverage` field at all;
  only AC-1458 does, and it reads `pass`. Both stories and the capability itself
  read `uat_coverage: pass`. That field belongs to `check_uat_coverage` /
  `fix_uat_coverage`, so this check neither sets it nor treats it as a finding —
  but if a later uat-level cycle reports all-green off those story/capability
  rollups, the per-AC evidence behind AC-1229…AC-1239 is worth confirming rather
  than assuming.

- **STORY-113's read-listing sort order is an implementation fact, not an
  unmet intent.** The body's Technical Context says the stored palette keeps the
  operator's order while "the *listing* returned by a read is sorted by name".
  AC-1234 asserts the stored-order half (a rename moves the key in place); no AC
  asserts the sorted listing, and none needs to — REQ-133 §5d only ever asks that
  a palette an operator has arranged keeps its order, which is the stored
  property. Not a coverage gap.
