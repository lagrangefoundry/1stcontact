---
uid: report-b47a698d
id: REPORT-3835
type: report
title: 'Fix Site Control Surface: Declared, Granted, Validated & Audited (story) —
  attempt 2'
created_by: xgd
created_at: '2026-09-11T01:08:41.897793+00:00'
updated_at: '2026-09-11T01:08:41.897793+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-00e77e55
  level: story
  fixes_applied: 4
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Site Control Surface: Declared, Granted, Validated & Audited (story)

**Attempt**: 2
**Fixes applied this call**: 4
**Violations remaining**: 0
**Needs more work**: false

Both actionable findings in REPORT-c70b5618 (1 violation, 1 warning) are
resolved. Findings 3 and 5 were `info` with resolution "none". Finding 4 is
`info` and explicitly scoped by the assessor to the `ac` and `uat` cycles; it is
forwarded below rather than acted on here.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-105 (`story-93905de4`), Technical Context → Divergences, bullet 2 | Replaced "later work **in this same bundle** extended the same declaration" with the actual extending intents: within BUNDLE-17, REQ-129 (`get_copy`/`set_copy` → `get_l1`/`set_l1`, `WriteCopy` → `AuthorPages`) and REQ-130 (five operations, `DrawImages` split from `ManageAssets` so it can be withheld — where that bundle closed); afterwards **BUNDLE-19** (`bundle-77b28def`) with REQ-133 (`get_palette` into `ReadSite` plus the new `ManagePalette` group of four writes, granted, read grantable separately from the writes) and REQ-131 (`list_changes` into `ReadSite`, untrusted slice, own sequence entry and overview paragraph). Kept the count-independence sentence verbatim, as the finding directs |
| 2 | story-body-edit (fields) | STORY-105 `fields.updated_by` | `["bundle-b3b7c399"]` → `["bundle-b3b7c399", "bundle-77b28def"]`, recording BUNDLE-19 as a bundle that changed the declaration this capability owns |
| 3 | story-body-edit | STORY-105, "## Dependencies" | Resolved the contradiction with Technical Context (finding 2). "None." replaced by an explicit entry for **CAP-86** (`story-37a3921b`, the single validated atomic write path), qualified as already built and depended on rather than redefined, plus **capability-c4c7a854** (the site store the audit is written through, likewise already built). The consumer note (CAP-90, authoring stories) is preserved as a trailing sentence, so nothing that was there was lost |
| 4 | story-body-edit | STORY-105, Technical Context (new final bullet) | Recorded the assessor's "pattern worth watching": REQ-131 and REQ-133 landed operations in this surface while filed under the capabilities owning the *reach*. The bullet states the rule going forward — anything extending the declaration belongs in `updated_by` even when no criterion moves — so the same omission does not recur when REQ-157 / REQ-158 / REQ-160 reconcile |

All four landed in a single `xgd ticket update` carrying `--fields` and
`--body-file` together. Everything outside the three edited regions is preserved
byte-for-byte.

## Verification

The rewritten bullet asserts facts about the shipped declaration, so each was
re-checked against the tree at HEAD before writing (not taken from the report):

| Claim now in the body | Checked against | Result |
|---|---|---|
| BUNDLE-19 is `bundle-77b28def`, `free_and_reconciled`, and carries REQ-133 + REQ-131 | `xgd ticket get bundle-77b28def` | holds |
| The tree carries more than sixteen operations | `l1-surface.json` — 27 operations, `surface_version: 4`, 9 groups | holds |
| REQ-133's `ManagePalette` is a group of four writes and `get_palette` sits in `ReadSite` | `l1-surface.json` `groups` — `ManagePalette` = `set_palette_color`, `add_palette_color`, `remove_palette_color`, `rename_palette_color`; `get_palette` listed under `ReadSite` | holds |
| `ManagePalette` is granted, the read separable from the writes | `instances.json` — `caretaker.l1.groups` = ReadSite, AuthorPages, ManagePages, ManageComponents, WriteConfig, **ManagePalette**, DrawImages; `ManageAssets` and `Publish` declared and withheld | holds (and re-confirms the in-scope bullet about the withheld pair) |
| REQ-131's `list_changes` is an untrusted read in `ReadSite` with its own sequence entry | `l1-surface.json` — `list_changes`: `effect: read`, `returns.provenance: "untrusted"`; `sequences` includes "Pick up after your user has been editing", and REQ-133's two palette sequences are present | holds |

No test or production code was touched, so no test run was implicated: this was a
citation repair in the matrix, exactly as the assessor categorised it.

## Code Edits

None this call.

## needs_review Items Forwarded

None ambiguous. One `info` item is forwarded by the assessor's own direction:

| Element | Assessor said | Where it belongs |
|---|---|---|
| AC-1411 (`acceptance_criterion-cb6e1b58`) | Finding 4: REQ-146 AC3's durability ask **is** expressed as its own criterion, so story-level coverage is satisfied — but the AC carries `status: pending` and no `uat_coverage`, while STORY-105 and CAP-92 both read `uat_coverage: pass`. REPORT-2055/2058/2059 (all 2026-08-16) predate the AC's creation (2026-08-31) and cannot have assessed it | The `ac` and `uat` cycles. Confirmed against the store this call: STORY-105 has 14 ACs — AC-1071…1082, AC-1142 all `active` / `uat_coverage: pass`, and AC-1411 alone `pending` with the field unset. `uat_coverage` is owned by the check/fix uat-coverage cycles and was deliberately not set here |

## Findings Requiring No Action

- **Finding 3** (info, publish declared-not-granted framed as a divergence): the
  assessor notes REQ-146 AC7/§4 ratified the shipped grant, so the Divergences
  bullet is historically accurate and "need not change". Left verbatim, and this
  report records why, so a future check does not re-open it as drift.
- **Finding 5** (info, exclusivity vs STORY-103 / 106 / 107 / 113 / 115): no
  overlap found; nothing to edit.
