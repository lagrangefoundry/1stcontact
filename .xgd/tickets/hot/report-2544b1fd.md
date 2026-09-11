---
uid: report-2544b1fd
id: REPORT-3891
type: report
title: 'Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings,
  Components, Page Metadata & Generated Images (level=ac)'
created_by: xgd
created_at: '2026-09-11T03:24:08.281703+00:00'
updated_at: '2026-09-11T03:24:08.281703+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-2d32662d
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata & Generated Images
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

CAP-94 (`capability-2d32662d`) holds exactly one story — STORY-107 (`story-b3de4571`,
`story_kind=feature`, `intent_uid=bundle-e59210c5`, status `completed`) — with **16** ACs:
AC-1095 … AC-1109 (`active`) and AC-1650 (`pending`, created 2026-09-11T03:09Z).

**This check follows the story-level repair of 2026-09-11.** REPORT-3886 (`report-f08cca9a`,
03:06Z) failed CAP-94 at story level with two violations and, in its finding 3, named this
level's work explicitly: AC-1095 and AC-1097 carried the palette vocabulary REQ-137 retired,
and the previous ac-level check (`report-10ed4fd2`, 2026-08-16, PASS) had not caught it. The
repair landed (story body 03:08:55Z, AC-1095 / AC-1097 bodies 03:09:12Z / 03:09:16Z, AC-1650
created 03:09:49Z) and the story level then passed (`report-0f0d51b9`, 03:17Z). **Both
ac-level items REPORT-3886 flagged are now repaired** — verified below, not assumed.

## Cumulative Intent Considered

Statuses and dates below were read from the ticket store for this check, not carried over.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 (`request-d9407f80`) | free_and_reconciled | 2026-08-08 | Control surface declared as a governed API. Reconciled to STORY-105 (`story-93905de4`), a different capability; STORY-107 depends on it. | YES (as dependency) |
| REQ-129 (`request-b1300473`) | free_and_reconciled | 2026-08-09 | `get_l1` / `set_l1` element-tree authoring. Reconciled to STORY-106 (`story-189fc1ac`); STORY-107 depends on it. | YES (as dependency) |
| **REQ-130** (`request-ed6ba145`, bundled in BUNDLE-17 `bundle-e59210c5`, merged `0198704b7e29db3c53cf569070042cec0eb467bc`) | free_and_reconciled | 2026-08-09 | **The originating intent for CAP-94.** §1 structured `set_config` (object `settings` + optional `key`, deep merge, list/scalar replaces); §2 `add_component` / `configure_component` / `remove_component` / `list_behaviors` + `describe_page` instance listing, optional `presentation` via `presetSlots`, `validateBehaviorInstance` ahead of `validateOrThrow`, closed catalog; §3 `seo` on `add_page` / `update_page`, merged; §4 `write_image` under its own `DrawImages` grant with a closed-by-construction SVG validator, generated filename, conflict-unless-`replace`; plus the "⚠️ The operator's editor must not break" clause — copy inside an assistant-instantiated component addressable over `/api/copy`. | YES |
| REQ-131 (`request-5d3bf630`) | free_and_reconciled | 2026-08-11 | Draft change journal over the same `edit.ts` write path (every CAP-94 write returns a `now` counter; `list_changes` added to the surface). Reconciled to STORY-115 under `capability-702b7c02`. Retires nothing CAP-94's ACs claim. | YES (elsewhere) |
| REQ-133 (`request-8467b1a3`) | free_and_reconciled | 2026-08-12 | Palette as an editable subject with its own `ManagePalette` group. Reconciled under `capability-a0bba4ec`. Does not retire the settings path over the palette — `edit.ts:1474-1482` records why both exist. | YES (elsewhere) |
| **REQ-137** (`request-d2980a95`) | free_and_reconciled | 2026-08-12 | **L1 palette model change** — an entry becomes one colour; `steps` deleted, no dual path. **This is the intent whose retirement drove the AC repair checked here.** | YES (retiring) |
| REQ-134 (`request-ba3e3fba`) | abandoned | 2026-08-12 | Provider-backed raster image *generation*. Retired — CAP-94's generated-image scope correctly remains assistant-composed SVG only. | NO |
| REQ-141 … REQ-153 (free_and_reconciled), REQ-154 / REQ-162, REQ-155-161 / REQ-163-166 (draft) | mixed | 2026-08-15 → 08-31 | Workers-runtime substrate, async/Cloudflare `SiteStore`, builder + AI host in workerd, Vite SSR, locale identity, money/time seam, product ticket store; then the draft fidelity/KB/Library set. All own other capabilities, or are not yet active. | YES (elsewhere) / NO (draft) |

No `request` or `bug` ticket other than those reached through BUNDLE-17 references
`capability-2d32662d` or `story-b3de4571`; neither CAP-94 nor STORY-107 carries an
`updated_by` chain. **REQ-130 is the sole intent this level's ACs must express**, with
REQ-137 acting on it as a retirement and REQ-126 / REQ-129 as dependencies.

## Alignment Ledger

Story body is the working reference at this level (per the level cascade); intent was
consulted where an AC asserts a mechanism the story's prose does not spell out. Code
citations are spot-checks made during this check, not inherited.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1095 (`acceptance_criterion-3e72e4c7`) — whole settings group, deep merge | REQ-130 §1; **REQ-137 repair applied** | **aligned (repaired)** — now reads "several named entries, each one colour" and illustrates depth with "one field inside the theme's typography"; the retired "families / steps" wording is gone. Merge rule matches `editConfigSet` / `mergeConfigValue` (`tools/generate/src/cli/edit.ts:1440-1452`). |
| AC-1096 (`acceptance_criterion-61fb6823`) — omitted group → top level; non-object refused | REQ-130 §1 | aligned — `scoped && !isMapping(merged)` raises `SCHEMA_INVALID` with a hint naming the key-plus-object form (`edit.ts:1445-1451`), exactly the AC's two clauses. |
| AC-1097 (`acceptance_criterion-411cb7f0`) — schema refusal is whole | REQ-130 §1; **REQ-137 repair applied** | **aligned (repaired)** — now exemplifies with "a palette entry whose colour is not an opaque hex value"; the retired "palette family whose steps…" wording is gone. `validateOrThrow` runs before `store.write` (`edit.ts:1454-1457`), so refusal is pre-write. |
| AC-1098 (`acceptance_criterion-4807267c`) — catalog listable and closed | REQ-130 §2 | aligned — `list_behaviors` reports per-field `type` / `required` / `values` / `itemSchema`, `slots`, bindable `controls`, and `hasDefaultPresentation` (`edit.ts:1186-1218`); catalog is `[contactFormMeta, carouselMeta]` (`packages/framework/src/modules/catalog.ts:30`). |
| AC-1099 (`acceptance_criterion-775579b2`) — add with config alone, or a supplied presentation | REQ-130 §2 | aligned — `opts.slots ?? presetSlots(meta.id, config)`; a kind with no preset is refused naming its slots (`edit.ts:1268-1277`). The AC's carousel example is sound: `PRESETS` holds `contact-form` only (`packages/framework/src/l2/presets.ts:23-29`), so `carousel` is genuinely a no-default-look kind. |
| AC-1100 (`acceptance_criterion-d27d0a92`) — contract check ahead of the site validator | REQ-130 §2 | aligned — `assertBehaviorInstance` precedes `validateOrThrow` on add (`edit.ts:1278`, `:1289`) and on configure (`edit.ts:1333-1341`), which is precisely the AC's ordering claim. |
| AC-1101 (`acceptance_criterion-8b83dcaa`) — configure merges, remove leaves the seam | REQ-130 §2 | aligned — merge on configure (`edit.ts:1332`) re-checked before store; removal filters `modules` only and the code says so in terms ("Its `slot` node in the L1 tree is left alone", `edit.ts:1362`); `NOT_FOUND` on both paths (`edit.ts:1323-1329`, `:1375-1381`). |
| AC-1102 (`acceptance_criterion-37a212b2`) — describe_page lists instances with config | REQ-130 §2 | aligned — matches the story's "a page reports the instances already on it with their configuration". |
| AC-1103 (`acceptance_criterion-16b410ef`) — seo written, merged, rendered | REQ-130 §3 | aligned — write on add (`edit.ts:979`), merge on update (`edit.ts:1028`), and the refusal clause the AC's last sentence asserts exists verbatim (`edit.ts:1009-1012`). One evidence gap under it — finding 1. |
| AC-1104 (`acceptance_criterion-651ded8e`) — drawing as an ordinary site image | REQ-130 §4 | aligned. |
| AC-1105 (`acceptance_criterion-ca166956`) — executable / external / embedding refused whole | REQ-130 §4 + security section | aligned — the AC's category list (script, event handler, embedded document, external reference, stylesheet/`style`, DOCTYPE/ENTITY, non-XML entities) reproduces REQ-130's enumeration one-for-one, including "never rewritten". |
| AC-1106 (`acceptance_criterion-320ec80e`) — closed by construction; caps bounded | REQ-130 §4 + security section | aligned — expresses the *closure* property ("every byte accounted for… no skip-what-we-do-not-recognise branch") and the 64 KiB / 2000-element caps. Distinct from AC-1105, which enumerates disallowed categories; see exclusivity note below. |
| AC-1107 (`acceptance_criterion-92ec2ccc`) — generated filename, conflict unless replace | REQ-130 §4 ("Generated filename: one lowercase word → `<stem>.svg`… Conflict unless `replace`") | aligned — the mechanism the story's prose summarises as "written into the site as an image"; grounded directly in intent. |
| AC-1108 (`acceptance_criterion-a1107c40`) — `DrawImages` is its own grantable group | REQ-130 §4 | aligned — matches "Its own capability group (`DrawImages`), separate from `ManageAssets`, so it can be withheld". |
| AC-1109 (`acceptance_criterion-b2825a04`) — all four reachable from the CLI | REQ-130 §1 (CLI `parseConfigValue` — "argv is the one place a setting genuinely arrives as text") + the story's Technical Context naming note | aligned — the AC states the four families in surface vocabulary while the story's naming note records the CLI's `module add\|set\|rm` / `behavior list` spelling for the same operations. |
| AC-1650 (`acceptance_criterion-3eae0d6b`) — modal reaches copy inside an assistant-instantiated component | REQ-130 "⚠️ The operator's editor must not break" | **aligned (new)** — closes REPORT-3886 finding 4. Its criterion mirrors the story's Technical Context claim ("claimed here, not borrowed… nothing is added to the modal's own contract"). Its cited evidence **verifies**: `test_UAT_FC_REQ_130_copy_inside_the_component_is_addressable_and_editable` is at `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:670`, under the describe block at `:645`, both line numbers exact. |
| Coverage of the story's four paragraphs | REQ-130 §1-4 | **complete** — Settings → AC-1095/1096/1097; Components → AC-1098/1099/1100/1101/1102/1650; Page metadata → AC-1103; Generated images → AC-1104/1105/1106/1107/1108; the cross-cutting "same conversation and the same command line" → AC-1109. The "Out of scope" paragraph's closed-catalog absence is expressed inside AC-1098; the other two absences (extending L1, binary/font upload) are correctly declared rather than criteria. |
| Exclusivity within STORY-107 | — | satisfied. The two near-pairs were examined: AC-1105 vs AC-1106 (what the grammar *disallows* vs whether an *unanticipated* construct fails closed — REQ-130 argues these as separate design claims, and "that property is tested directly rather than by a sample of payloads"), and AC-1097 vs AC-1100 (site-definition schema vs the behaviour's own contract, different validators at different points in the write). Neither is a duplicate. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | AC-1103 (`acceptance_criterion-16b410ef`) | uat-add | AC-1103's final clause — "An update naming none of title, path or search metadata is refused with a message saying what may be passed" — is real in production code (`tools/generate/src/cli/edit.ts:1009-1012`, `SCHEMA_INVALID` / "Nothing to update; pass --title, --path and/or --seo.") but **no test asserts it**: a repo-wide grep for `Nothing to update` returns the implementation line and nothing else, and neither UAT under this AC (`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:336` merge-on-update, `:358` reaches-the-render) exercises the empty-update path. AC-1103 carries `uat_coverage: pass`, so this clause is passing on the strength of its siblings. Held at **warning**: the AC text is correct and intent-supported, the gap is evidentiary and belongs to the uat level. | Add one case to the existing describe block at `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:332` asserting `update_page` with only `page:` set is rejected with the accepted-fields message. No AC or story edit. |
| 2 | info | — | AC-1095, AC-1097 | — | REPORT-3886 finding 3 is **discharged**. A sweep of all 16 AC bodies for `famil` / `steps` returns nothing, and `steps` is gone from `packages/site-schema/src/l1/palette.ts` except in comments explaining its removal (`:33`, `:36`, `:224`). The retired REQ-137 vocabulary no longer appears anywhere in this capability's matrix — capability body, story body, or AC bodies. | none |
| 3 | info | — | AC-1650 (`acceptance_criterion-3eae0d6b`) | — | Status is `pending` and it carries no `uat_coverage` field, while STORY-107 and CAP-94 both read `uat_coverage: pass` — an aggregate that predates this AC by minutes. Not drift and not this level's field to set (`uat_coverage` is owned by check/fix_uat_coverage); recorded so the aggregate is not read as covering AC-1650. `pending` is an ordinary AC status here (27 of 663 ACs in the store carry it). | none — the uat level's next run over CAP-94 will settle it against the already-passing test at `:670` |
| 4 | info | exclusivity | AC-1650 vs AC-1093 (`acceptance_criterion-d1bda2c2`, STORY-106) | — | Both concern the operator's modal over assistant-authored content, in adjacent capabilities. They are **not** duplicates: AC-1093 is an element the assistant *composed through `set_l1`* (its subject is the derived-field form and the survival of typed appearance properties across a save); AC-1650 is copy *inside a module slot* of a component the assistant *instantiated* (its subject is that the page's segment walk enters a module slot at all). Different subjects, different tests. Checked because REPORT-3886 finding 4 left the ownership question open and the repair resolved it toward CAP-94. | none |
| 5 | info | — | AC-1107 | — | AC-1107 asserts the generated-filename rule and conflict-unless-`replace`, which the STORY-107 body's prose does not spell out (its Technical Context details the validator, not the naming). Not drift: REQ-130 §4 states both rules in terms, and the AC is the mechanism behind the story's "written into the site as an image". Recorded so a future reader does not mistake the prose gap for an unsupported AC. | none |

## Notes for the Editor

**Nothing at this level blocks.** The two ac-level items REPORT-3886 named — the retired
palette vocabulary in AC-1095 / AC-1097, and the missing criterion for the modal's reach into
an assistant-instantiated component — are both closed, and both were verified by reading the
current AC bodies rather than by trusting the fix report. The single warning is evidentiary,
not a matrix defect, and is one test case at a known line.

**Why the AC-1105 / AC-1106 pair was left alone.** It is the most duplicate-looking pair in
the story and the judgment is deliberate: REQ-130's security section separates "element and
attribute allowlists… no `style`… no DOCTYPE/ENTITY" from "closed by construction, not by
blocklist… every byte must be accounted for", and argues the second is what makes the first
worth having. Collapsing them into one AC would lose the closure property, which is the
capability body's own load-bearing claim ("a validator closed by construction"). Same reasoning
for AC-1097 vs AC-1100 — two validators, two points in the write, two failure shapes.

**One thing to carry to the uat level when it next runs CAP-94.** Its last run
(`report-c461de60`, 2026-08-16, PASS) predates AC-1650 entirely and predates the AC-1095 /
AC-1097 rewrites. Finding 1 here is the concrete item to pick up; finding 3 is the
bookkeeping one.

**Cross-cutting, unchanged from the story level.** STORY-107's deferral of the
`presetSlots(behaviorId, config)` index to CAP-70 / `story-179b8c06` is still correctly
attributed — `packages/framework/src/l2/presets.ts` names REQ-130 as the requester but sits in
the framework's L2 layer. It should surface when CAP-70 is reconciled, not as a finding here.
