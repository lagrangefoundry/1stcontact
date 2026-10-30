---
uid: report-7017a1c9
id: REPORT-5443
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T03:53:45.238994+00:00'
updated_at: '2026-09-29T03:53:45.238994+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `package.json` — **UU** (both modified), single-hunk scalar conflict on the `version` field. Class **2g / config file**, but resolved under the per-file enrichment rule supplied for this conflict ("Intent unknown on one or both sides. Take the more recent commit by timestamp and flag this file for post-merge review") rather than 2g's generic "scalar conflicts: incoming wins" default, because the enrichment is file-specific to this conflict and 2g's default would regress the version.
  - Ours (HEAD): `0.2.40`, introduced via `80c9342ac1` *"Merge branch 'free-BUG-43' into xgd-working"* — committed **2026-09-14 03:15:55 -0700**.
  - Theirs (CHERRY_PICK_HEAD `9ae7338430`): `0.2.30`, *"chore: bump version for REQ-165 projected reference [FREE-CODED]"* — committed **2026-09-01 11:30:32 -0700**.
  - More recent by timestamp = **ours**, by ~13 days. Resolved to `0.2.40`.
  - Staged with `git add package.json`. Resulting tree is byte-identical to HEAD, so the staged diff for this cherry-pick is empty.

## Incoming changes preserved

The incoming hunk's payload — claiming a version for REQ-165 — is **not** present as the literal string `0.2.30`, and that absence is correct rather than a discarded developer change. Justification:

- The incoming commit `9ae7338430` consists solely of `package.json: 0.2.29 -> 0.2.30` (1 file, 1 insertion, 1 deletion). Its stated intent is to claim a version number for REQ-165.
- That intent **is already satisfied on HEAD** by `2fbb0f5f0269098d199fa969495fa5c27fd7e261`, *"chore: bump version to 0.2.31 for REQ-165 [FREE-CODED]"* (**2026-09-11 02:58:20 -0700**), whose own commit body states it exists precisely because the `0.2.30` bump reached `xgd-working` through a merge commit that the `free_coded` gate could not attribute to the ticket's SHAs, so it re-bumped directly on `xgd-working` "so the version is introduced by a claimed commit."
- In other words, the superseding commit on HEAD is later than the incoming commit *and* was authored specifically to replace it. REQ-165's version claim is therefore intact on this branch as `0.2.31`; the branch has since advanced through REQ-156, BUG-43 and others to `0.2.40`.
- Applying the incoming side instead would roll `version` backwards by ten bumps and silently void the later claims. No non-version content exists in the incoming commit, so nothing else could be carried forward.

No test functions were touched; the BUG-1301 precedence exception was not invoked (this is not a test file and no HEAD-side deletion was involved — the incoming value was superseded, not deleted).

**Flagged for post-merge review** per the enrichment rule: `package.json` `version`. Reviewer should confirm `0.2.40` is the intended tip value and that REQ-165 is considered version-claimed at `0.2.31`.

## Staging state

`git status --porcelain` is empty: no `UU`/`AA`/`DU`/`UD` lines remain, working tree clean, `CHERRY_PICK_HEAD` (`9ae7338430`) left in place. Per STEP 4, `--continue`/`--skip`/`--quit`/`--abort` were NOT invoked; the empty staged diff is left for the finalize step to detect and skip.
