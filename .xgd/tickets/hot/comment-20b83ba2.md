---
uid: comment-20b83ba2
id: COMMENT-645
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-05T18:45:22.194133+00:00'
updated_at: '2026-08-05T18:45:22.194133+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a74f499b
  kind: note
---

Assessment complete. **REPORT-1289** (`report-a74f499b`) — result **fail**, 1 violation, 2 warnings, 0 needs_review.

## What I found

**This capability is empty by ticket truth.** CAP-69 was absorbed into CAP-70 (`capability-ae9d65d6`) by the 2026-08-05 structural rebalance — it carries `merged_into` and an ABSORBED banner, and STORY-82's `capability_uid` now points at CAP-70. The workflow routed STORY-82 here anyway because the branch worktree's index resolves to the canonical main store holding the pre-merge value — the same `stale_index_on_branch` defect REPORT-1266 already flagged as an xgd system-repo bug. I assessed STORY-82 and its ACs in full regardless, since they were the only elements in scope.

**Intent ledger** — all eight relevant intents are `free_and_reconciled`. REQ-58 forced the original module dials; REQ-84 deleted `services-grid`/`footer` and re-homed the card veil/border and footer colour departures onto L1 leaf axes; REQ-85 reframed `contact-form`, removing `fieldLabels`/`submitInline`/`submitColor` and making a programmatic `<label>` a fixed accessibility obligation of the vetted core.

**Coverage is genuinely sound.** Both live ACs pass — I ran the tests rather than trusting the index (2 passed, 469ms). AC-719 authors a real L1 document through the real `validateL1`/`renderL1Document` and asserts against the live module registry; AC-718 SSR-renders the real `ContactForm.astro` through a real `AstroContainer` in both slot-dressed and plain paths. Real entry points, no internal mocking. The eight legacy ACs (AC-674..681) are already archived — a stronger disposition than `lifecycle: deprecated`, so I left them alone.

**The one violation is a stale story body.** STORY-82's title and its user-story "so that" clause still promise "placeholder & inline contact form" / "compact placeholder-labelled or single-row contact forms". REQ-85 retired both. Verified in code: `contact-form/index.astro` always emits a visible `<label>` and never a `placeholder` attribute, and its scoped CSS pins both `.contact-form__form` and `.contact-form__field` to `flex-direction: column`. The story's own Description section already says those dials "is gone" — the body contradicts itself. Classic post-pivot drift: the Description was reconciled, the title and preamble were not.

Resolution is a **story-body-edit**, not new UATs — the affordance was retired deliberately as an accessibility decision, so promising it is the bug, not the missing test.

## Verdicts written

| Element | `uat_coverage` |
|---|---|
| AC-719 | pass |
| AC-718 | pass |
| STORY-82 | stale |
| CAP-69 | fail |

Since STORY-82 now hangs off CAP-70, that capability's aggregate should pick up the same `stale` verdict — one edit resolves both. Worth sweeping STORY-80/81/83/85 for the same title-vs-Description mismatch in one batch.

Two warnings are xgd system defects with no project-side fix: CAP-69 still `status: active` (deprecation blocked by the index defect), and `.xgd/uat_index.json` recording both tests as `status: "missing"` despite them existing and passing. Also worth noting the prompt's index-lookup snippet uses `.upper()` while the index keys are lowercase (`ac718`), so it silently returns `{}` for every AC.

Unrelated to this task: the claude.ai Gmail/Calendar/Drive connectors reported as needing authorization. They weren't needed here, but if you want them available you'll have to authorize them from your claude.ai connector settings — this session can't run the OAuth flow.
