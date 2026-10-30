---
uid: report-09112cf7
id: REPORT-4663
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T05:57:05.371921+00:00'
updated_at: '2026-09-21T05:57:05.371921+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU**, intent/bookkeeping ticket
  (`request-*`, STEP 2e). Outside the sparse-checkout cone, so the conflict
  existed only in the index with no working-tree markers; resolved with
  `git checkout --ours` + `git add --sparse` (DOC-986 §2/§4.1).

  **Rule applied:** one side is a strict superset — keep the superset.
  The incoming commit (`a473afd7fa`, CHERRY_PICK_HEAD) is a pure
  `shadow` → `description` terminology rename across the ticket body plus
  an `updated_at` bump to `2026-08-31T22:57:11`. HEAD (blob `a8c14c1e`)
  already contains that entire rename verbatim — `git grep -i shadow` against
  `:2:` returns nothing — and additionally carries everything written since:
  the "What was built, and where it departs from the decisions above" section
  (five departures), the REQ-158 bundle-size measurement table, the Evidence
  section, "Resolved after implementation (2026-08-31)", a rewritten
  "Open questions", and frontmatter advanced to `status: bundled` with
  `commits` / `version: 0.2.24` / `bundled_in: bundle-87be4669` and
  `updated_at: 2026-09-09T21:32:49`.

  No field or section is changed differently on the two sides, so 2e's
  genuine-conflict branch (later-positioned intent, per fact) never engages —
  every incoming fact is already present in the superset.

## Incoming changes preserved

- `.xgd/tickets/hot/request-439cd0c8.md` — verified. Every incoming
  substantive change is present in the resolved version:
  - §3 heading `**Shadow.**` → `**Describe.**` and the table column
    `| Input | Shadow |` → `| Input | Description |` ✓
  - §4 "with the shadow as body" → "with that description as its body" ✓
  - "Why the body matters more than it looks": both `shadow` → `description`
    substitutions ✓
  - Acceptance: "usable shadow" → "usable description"; "A degraded shadow …
    selectable by `shadow_status`" → "A degraded description … selectable by
    `description_status`" ✓
  - Decisions section: "image shadow" → "image description";
    `shadow_status` → `description_status`; "later re-shadow pass" →
    "later re-describe pass"; `shadow_model` → `description_model`;
    "no automatic re-shadow" → "no automatic re-describe" ✓
  - The incoming "Open questions" rename ("re-shadow pass" → "re-describe
    pass") has no counterpart line in HEAD because HEAD **resolved and
    deleted both of those open questions**, replacing them with the
    "Resolved after implementation (2026-08-31)" section, which answers the
    same two questions at length (vision consolidates onto
    lagrange-framework REQ-111, not REQ-157; re-describe splits by field).
    This is a superset subsuming the renamed text, not a discarded change.

  No hunk was dropped under the BUG-1301 precedence exception; no code files
  and no UAT test files were involved in this conflict.

## Resulting state

Index matches HEAD exactly — `git status --porcelain` is empty and
`git ls-files -u` reports no unmerged entries. The cherry-pick's content is
already fully contained in HEAD, so the staged diff is clean and the finalize
step should skip the commit. `CHERRY_PICK_HEAD` (`a473afd7fa`) is left intact;
no `--continue` / `--skip` / `--quit` / `--abort` was issued.
