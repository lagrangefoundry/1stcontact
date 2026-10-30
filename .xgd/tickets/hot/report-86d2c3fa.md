---
uid: report-86d2c3fa
id: REPORT-5952
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T21:33:27.498916+00:00'
updated_at: '2026-10-04T21:33:27.498916+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` (UU, ticket path), resolved with `--ours`. Ours is a strict superset of theirs, so nothing changes from HEAD.
  - The picked commit is `a74ac03993` (2026-08-22 20:24:39). Its base `0dc6fa73d3` is the incoming blob from the previous pick (`7782255e4e`, REPORT-5951). Ours `85e97c817e` (== HEAD) has not changed since then.
  - Base→theirs (`de1dfccc70`): adds the "Follow-up: `bin/build` failed on a type-only reach into node" body section (AC 12, version note ending at 0.2.7). It also bumps `updated_at` and sets `last_field_updated: body`.
  - Ours already contains that whole section, plus the later follow-ups. Ours→theirs changes only five frontmatter fields, and theirs has the older value in each: `updated_at`, `completed_at`, `last_field_updated`, `status`, `version`.
  - As established for the previous pick, ours equals the 08-31 tip of `xgd-working` (`d93c0bf759`) except for a trailing newline.

## Incoming changes preserved

No code files were involved. The body section this pick adds is already in HEAD, unchanged.

## Forecast

The remaining picks on this ticket are expected to resolve to ours with no net change, or to auto-merge: `c9f82a85cd`, `e95404260a`, `51ac0d0a8c`, `0c554d53cb`, `67b8efddf4`, `6aa0e66fae`, `e611edba0b`, `f78f807296`, `d93c0bf759`. These SHAs come from `xgd-working`, and a pick may arrive under a different SHA, so match them by author date. Ours already holds the end state of this sequence.
