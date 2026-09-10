---
uid: report-ad42960c
id: REPORT-3794
type: report
title: 'Fix UAT Coverage: Site Materials & Starting Point: Scaffold, Assets, Provenance
  & Palette — attempt 4'
created_by: xgd
created_at: '2026-09-10T20:47:31.033312+00:00'
updated_at: '2026-09-10T20:47:31.033312+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_uat_coverage
  subject_uid: capability-b4ac88fc
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix UAT Coverage: Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette

**Attempt**: 4
**Fixes applied**: 3
**Violations remaining**: 0
**Needs more work**: false

The single violation in report-3655d279 was story-body drift, not a coverage
gap. It is closed, together with the one warning that shared its resolution
category, and one AC-body residue of the same intent that the assessor's table
did not list (see *Editor-initiated edit* below).

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-97 (`story-5e7eb0c5`) | Rewrote the Technical Context bullet "two of the four sites are vacuously retrofitted". The false present tense is gone; the history and the durable property are kept. `uat_coverage` set `stale` → `pass` in the same call. |
| 2 | story-body-edit | STORY-102 (`story-c46abfa6`) | Repointed both stale CAP-80 references (warning 4) at STORY-92, the sibling story the consolidation left the concern in. Boundary statement itself untouched — it was correct. |
| 3 | ac-edit *(editor-initiated)* | AC-932 (`acceptance_criterion-9f1e7baf`) | Removed the same REQ-140 residue from the AC's Criterion and Verification: they still told a reader to census a **stored** colourless site. |

### 1 — STORY-97, the violation

The bullet claimed, in the present tense, that `1stcontact` and `harbor-cafe`
"census at zero colour literals". Verified in the tree: `storage/sites/` holds
`gigabytealchemy` and `xgd` only, so neither site can census anything. Rewritten
to:

> **Intent/observation note — the colourless floor case no longer rests on a
> stored site.** REQ-114's AC6 asked for all four `storage/sites/*` retrofitted.
> Two of them — `1stcontact` and `harbor-cafe` — censused at zero colour
> literals, so there was nothing to convert and no palette was written; both were
> later deleted as dead examples by REQ-140 §7, and `storage/sites/` now holds
> `gigabytealchemy` and `xgd` only. The durable property outlived them: a
> colourless site retrofits to an *empty* palette rather than refusing, and it is
> pinned by AC-932 against a synthesised colourless page. A test author should
> neither read "every site carries a palette" into the retrofit nor go looking
> for a stored site with no colours.

This follows the assessor's suggested edit, with the audience note ("a test
author should not read…") preserved and extended, since misleading a test author
was the bullet's stated failure mode.

The neighbouring "retrofit reach" bullet needed no requalification — it names
`xgd` and `gigabytealchemy` individually and carries no four-site denominator.
The "upper population" bullet's phrase "the two stored sites" is now literally
accurate and was left alone.

### 2 — STORY-102, warning 4

`capability-745b9a6c` (CAP-80) was re-read this run: `status: superseded`,
`superseded_by_uid: capability-b4ac88fc`. Both references were pointers to a
capability that no longer exists as one, over substance that is still correct.

- Out of scope: "a project-level question (CAP-80)" → "a project-level question,
  owned by this capability's sibling story STORY-92 (story-8685be2d)".
- Technical Context: the heading is now "Relationship to the project-level
  licence index (STORY-92 / story-8685be2d)", and the bullet records that asset
  provenance *was* CAP-80 when the story was written and has since been
  consolidated here. The licence-attaches-to-the-asset / listing-attaches-to-the-
  site distinction is verbatim.

CAP-70 and CAP-86 were confirmed live and their references left untouched, as
the assessor directed.

### 3 — AC-932, editor-initiated

The assessor wrote "No AC or UAT is wrong — AC-932 and its test are correct and
passing", which is true of the *behaviour* AC-932 asserts. But its prose carried
the identical REQ-140 residue:

- Criterion: "Stored sites in this state exist — the ones whose pages carry no
  colour axes census at zero literals — so the case is the ordinary outcome for
  them rather than a contrived one." No stored site is in this state; both that
  were are deleted.
- Verification: "Census a **stored** site whose pages declare no colour axes…"
  — which contradicts the AC's own test, which synthesises the specimen
  (`tests/reconciliation-colour-retrofit-shade-model.test.ts:996`,
  `paintedSite(cwd, 'small-bare', [])`, carrying the comment `SYNTHESISED, not
  stored (REQ-140)`).

Fixing STORY-97's bullet to say the sites were deleted while leaving an AC under
that same story instructing a reader to census one of them would have left the
matrix internally inconsistent — the exact pairing the prompt asks for. Both
clauses now state the claim as being about a document with no colour axes,
synthesised directly, and cite REQ-140 §7 for the deletion. The asserted
behaviour, the AC's `status`, and its `uat_coverage: pass` are unchanged, and
its test was not touched.

## Code Edits

None this call. No file outside `.xgd/tickets` was modified.

## Verification

All three suites that this session can execute were run after the edits, on the
same tree:

| Suite | Result |
|---|---|
| `tests/reconciliation-colour-retrofit-shade-model.test.ts` | **12 passed** |
| `tests/reconciliation-font-provenance.test.ts` + `tests/reconciliation-scaffold-starter-l1.test.ts` | **19 passed, 1 skipped** (the skip is AC-871's browser gate — warning 2) |

`tests/reconciliation-site-asset-listing.test.ts` was not re-run: its `beforeAll`
starts a real builder and fails with `listen EPERM` under this sandbox's network
policy (warning 3), and nothing in this call touched it or the code it exercises.
Its 5 executable tests were green in the coverage check.

The edits were ticket-body only, so the passes confirm the tree was not disturbed
rather than proving anything new about the code.

## Field Writes

| Element | Field | Before → After |
|---|---|---|
| STORY-97 (`story-5e7eb0c5`) | `uat_coverage` | `stale` → `pass` |

Nothing else. STORY-92, STORY-93, STORY-102 and all 38 ACs already carried the
verdict this call agrees with; re-writing identical values would only churn
commits. **The capability's own `uat_coverage` was deliberately left at `fail`** —
the aggregate belongs to `check_uat_coverage`, which recomputes it on the
re-check this call hands back to. All four stories now read `pass`, so the
aggregate is expected to flip there.

## Warnings Not Actioned (unchanged, by the assessor's own reasoning)

| # | Element | Why no matrix edit |
|---|---|---|
| 2 | AC-871 | The `it.runIf(await chromiumAvailable())` gate is sanctioned by AC-871's own Verification clause; criterion and test agree. Unconditional evidence would need the AC body changed **and** a browser guaranteed in the regression environment — an environment decision, not an editor one. Chromium is unavailable here for named sandbox (Mach bootstrap) reasons, not a missing install. |
| 3 | AC-1023 | Environment artifact: `startBuilder` cannot `listen` in this sandbox. The test is unconditional and substantive; gating it on port availability would trade a loud failure for a silent skip, which is an `ac`-level call. Recorded so the red suite line is not read as a product regression. |

## needs_review Items Forwarded

None. No finding in report-3655d279 was categorised `needs_review` or
`needs_review-default`, and none was reclassified into either.

## For the Next Round

REQ-155 (`request-01ea4eec`) is still `draft` and so counts toward nothing, but
the assessor's flag stands: it ports the *reference* store off the filesystem,
and `storage/references/` is exactly the tree STORY-92's on-disk scan exists to
catch. If it reconciles, STORY-92's "the check scans the source trees on disk"
and AC-860 both need re-reading in the same pass.

Separately, `.xgd/uat_index.json` still carries `"acs": {}` on this branch — the
second consecutive round. The AC→test mapping used here was recovered by
scanning `test_UAT_AC<n>_` across the tree. Tooling observation, not a capability
finding.
