---
uid: comment-6c695ea6
id: COMMENT-2647
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-09-11T00:53:10.489705+00:00'
updated_at: '2026-09-11T00:53:10.489705+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a23a833c
  kind: note
---

UAT coverage assessment complete for **CAP-87 / capability-12fee326**.

## Verdict: PASS — 0 violations, 2 warnings, 0 blocking needs_review

**Report**: REPORT-3828 (`report-a23a833c`)

### What was written
- **54 ACs** now all read `uat_coverage: pass` (14 under STORY-98, 40 under STORY-101). Nine were actually re-judged and re-stamped — AC-1039 and AC-1138 (stale `fail`), and AC-1143 + AC-1279…AC-1284 (never stamped, they postdate the last coverage check at 2026-08-16). The other 45 were spot-checked and deliberately **not** re-written, so `updated_at` stays a usable signal for the alignment check.
- **STORY-98** → `pass` (unchanged). **STORY-101** → `pass`, correcting a `stale` stamp that predated the body rewrite by three weeks; I walked every in-scope bullet against the AC list and found no retired behavior and no unclaimed claim.
- **Capability** → `pass`.

### Intent ledger
18 reconciled intents, REQ-116/117 through BUNDLE-19. Nothing retired, nothing intent-silent, no `needs_review`.

### The two warnings
1. **AC-1044, `ac-edit`** — its second bullet ("a box with more than one field opens none") is unexercised *and unreachable*: `edit.ts` derives exactly one `string` field per region kind. The fix is an AC-body edit, not a test. Carried at warning since REPORT-2062.
2. **AC-1143, `uat-edit`** — the AC claims the glyph paint is "drawn on the words themselves", but that last hop is proven by regexing `builder.css` for the declarations. The custom-property half is genuinely behavioral; this half would survive a later cascade override. Fix is additive — a Chromium leg on the pattern AC-1138 and AC-1284 already use.

### Execution caveats (in the report, and they matter)
- **20/20 passed** on the five socket-free suites, so AC-948…958, AC-1007/1008/1135 and AC-1279…1284 were executed, not just read.
- Seven suites need a listening socket and die on `EPERM` here — `live-preview` reported *3 skipped, 0 run* after a 240s timeout. AC-1039, AC-1138, AC-1040, AC-1050, AC-1123 and the picker ACs were judged by **source reading only** this session.
- AC-1284's browser leg printed its loud `NOT VERIFIED here` — correct behavior, environment limit, not a coverage gap.
- `WEBUI_INSTALLED` is true only via a gitignored symlink; on a clean checkout those gated assertions early-return and still report green.
