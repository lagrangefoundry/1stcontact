---
uid: report-ac2a7012
id: REPORT-7781
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T16:10:41.879758+00:00'
updated_at: '2026-11-01T16:10:41.879758+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/bug-61165116.md` (BUG-51): intent/bookkeeping ticket (2e). Rule: one side is a strict superset, so keep the superset. Kept OURS (HEAD, updated 2026-11-01, status `bundled`, bundled_in bundle-39edf66d). The incoming commit ac0145bb27 ("update bug bug-61165116", 2026-09-05T18:42) is an intermediate draft. It rewrote the Mechanism sentence (SiteWrite.expect opt-in) and replaced "Scope — to be agreed" with Required behaviour B1–B3, Out of scope and a Test plan. HEAD already contains all of these, in the same or a later, refined form. HEAD adds the B1 `force` wire/scope details, the B2 structural-guard rationale, the B3 already-absent and port-probe wording, an expanded test plan, and the commits, version and bundled_in fields. The only incoming test-plan line not present verbatim in HEAD ("`1c reset` refuses when the dev port is answering") was revised in HEAD to "The port probe answers true for a listening port and false for a closed one". That is the same fact, refined later. HEAD is also the more recent commit by timestamp, matching the enrichment rule. Staged via `git checkout --ours` + `git add --sparse`. Flagged for post-merge review per the enrichment rule.

## Incoming changes preserved

No code files were involved. All incoming content is already in HEAD, in the same or a later, refined form. The commit is redundant rather than discarded, and the staged result has no diff vs HEAD (finalize will skip it).
