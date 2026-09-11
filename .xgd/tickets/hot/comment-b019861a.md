---
uid: comment-b019861a
id: COMMENT-2685
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-11T02:05:38.219193+00:00'
updated_at: '2026-09-11T02:05:38.219193+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-dee9edac
  kind: note
---

Done. REPORT-3865 (`report-dee9edac`) filed: `fixes_applied: 3`, `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`.

## What I did

The report had exactly one violation (finding 1) plus four `info` findings needing no action. The violation: STORY-106's first "Divergences and known limits" bullet claimed a refusal can't name the offending field — behavior the system no longer has.

**Three mutations:**

1. **story-body-edit on STORY-106** — rewrote the bullet as closed-with-lineage rather than deleting it ("was a limit under REQ-129; the upstream fix has landed; a refused `set_l1` now names the offending pointer as well as the strategy"). Everything else preserved verbatim.
2. **`tools/generate/src/cli/edit.ts:800-814`** — the `UPSTREAM FINDING` comment on `editL1Set`, retitled `CLOSED` with the resolution. Comment only.
3. **`tests/test_UAT_FC_REQ-129_l1_authoring.test.ts:377-390`** — the "until it lands" comment. Assertions untouched.

## I verified the finding rather than trusting it

The report flagged its own key evidence as living in unpinned `node_modules` and asked future runs to re-read. Read and `sed` are denied there under don't-ask, but `grep` isn't — so I re-read the whole chain, and found `usableDetail:556` is actually *stronger* than the report claimed (it returns the bare pointer even when the message adds nothing).

Then I proved it by execution: temporarily added `expect(answer).toMatch(/fontSizePx/)` to the refusal UAT → **13/13 pass**, reverted → **13/13 pass** again. The rewritten bullet asserts observed behavior, not an inference — which mattered, since replacing a stale false limit with a *new* false claim would have been worse than leaving it.

## One thing deliberately left

**AC-1090 still carries the same stale "Known limit" paragraph.** The assessor routed it explicitly to the ac-level cycle, and there's a real reason: strengthening the criterion needs the matching uat-edit in the same breath, or its `uat_coverage: pass` would overstate what its test proves. I flagged in the report that the strengthened form **would pass today** — my probe *is* that assertion, and it was green — so that cycle is pure matrix/test work with no code behind it. The story body now points forward at the outstanding edit, so the matrix isn't in a state where story and AC both assert something false.

One durability caveat carried into the report: `@lagrangefoundry/ai` is unpinned, so if a future cycle finds the pointer gone again, that's upstream regression, not matrix drift.
