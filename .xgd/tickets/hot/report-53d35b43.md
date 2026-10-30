---
uid: report-53d35b43
id: REPORT-5781
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T08:52:46.532104+00:00'
updated_at: '2026-10-02T08:52:46.532104+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — pick `64fd8db5ae`

- Branch: `resync-377b581e`, HEAD `737014b9d6`
- Picked commit: `64fd8db5aea9ce63e916d3352df62cd8b1463779` — `fix(digest): derive the per-turn digest afresh instead of caching it [FREE-CODED]` (2026-09-20 13:19:28 -0700, BUG-128)
- Apply target: `ec118d67626fd31cfce67ca88dc9908ecdde70ed`
- Retry count: 1 (`prior_stage_failure` empty)
- The stage prompt arrived with no mission body; arguments were recovered from `session-r36f21cf3.jsonl` seq 15682.

## Conflict

One file, one line: `package.json` `version`.

| side | blob | version |
|---|---|---|
| base (pick's parent) | `7d85da5237` | 0.2.290 |
| ours (HEAD) | `e46d5ae245` | 0.2.292 |
| theirs (incoming) | `cbcc90b736` | 0.2.293 |

`git diff :1: :2:` and `git diff :1: :3:` are each exactly that one line, so nothing else in the file needed adjudicating.

## Resolution: incoming (`--theirs`) → `0.2.293`

`version` is a monotone counter. Ours' `0.2.292` comes from `2e50a3ff7c` (`chore: bump version for BUG-127 [FREE-CODED]`, `-0.2.291` / `+0.2.292`), an xgd-working commit already integrated earlier in this resync queue. Incoming's `0.2.293` is the next value past it, and HEAD has not consumed it, so incoming wins. This agrees with §2g (config scalar: incoming wins) and with the enrichment's timestamp rule (13:19:28 vs ours' 13:10:35), though the counter order is what decides it, not the wall clock.

Taking ours would have dropped the pick's version bump and left the branch one behind.

## Result

- `package.json` staged with `0.2.293`; no conflict markers remain.
- The pick's four auto-merged content files are staged untouched: `tests/test_UAT_FC_BUG-128_the_digest_cannot_lag.test.ts` (new), `tools/generate/src/cli/ai/digest-core.ts`, `host-core.ts`, `priming.json`.
- `CHERRY_PICK_HEAD` intact, HEAD unmoved; the commit is left to the workflow's finalize step.
- No tests were run: the conflict was a version scalar only and the code files merged cleanly without resolver edits.

Nothing here needs post-merge review.
