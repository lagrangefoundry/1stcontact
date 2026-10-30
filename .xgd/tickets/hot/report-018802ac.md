---
uid: report-018802ac
id: REPORT-4707
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T10:53:26.774763+00:00'
updated_at: '2026-09-21T10:53:26.774763+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e). Resolved by per-fact composition of the two intent ledgers, which
  evaluates to HEAD's blob verbatim (`9c6d321c8b13840940fd0f2800f0edab053050f4`).
  Path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict
  existed only in the index with no working-tree markers; resolved with
  `git checkout --ours` + `git add --sparse`, each issued as the sole content of
  its own call per BUG-1294.

Incoming commit: `60e4959eb7e13e84e8856502e5e2a59ed079d07c`
(Aug 31 17:54:01, `xgd(ticket): update request request-78370159`).

### Ledgers compared

- **Incoming** — a single-fact edit on the xgd-working line: `story_points: 8 → 13`,
  with the accompanying bookkeeping (`last_field_updated: status → story_points`,
  `updated_at → 2026-09-01T00:54:01`). No free-text `--commit-message` narrative
  on either side; `xgd ticket history --rev 60e4959eb` confirms the standard
  subject only.
- **HEAD** (`58ee785188`, Sep 9 14:35, `xgd(ticket): seed_local_overlay`) — the
  bundling operation on the main-rooted line: `draft → bundled`,
  `story_points 8 → 13`, adding `bundled_in: bundle-87be4669`.

Note the conflict base (stage 1, `c6f18583c5`) is the blob that was stage 3
in the immediately preceding attempt — i.e. this queue is replaying the
working-line ledger commit by commit, and HEAD is still `5ca2cc9482`.

### Per-fact resolution

| Fact | Incoming | HEAD | Applied | Why |
|---|---|---|---|---|
| `story_points` | `8 → 13` | already `13` | `13` | **both sides agree** — the incoming commit's entire substantive intent; already carried by HEAD via the Sep 9 bundling operation. Not a conflict in outcome. |
| `status` | `free_coded` (unchanged from base) | `bundled` | `bundled` | HEAD-only change relative to base; `bundled` is also downstream of `free_coded` in the lifecycle |
| `bundled_in` | absent | `bundle-87be4669` | present | HEAD-only addition, preserved |
| `updated_at` | `2026-09-01T00:54:01` | `2026-09-09T21:32:50` | HEAD's | same-fact divergence → later-positioned intent wins |
| `last_field_updated` | `story_points` | `status` | HEAD's | travels with the winning `updated_at`/`status` facts |
| body prose | identical (no trailing newline) | identical (trailing newline) | HEAD's | byte-identical apart from the trailing newline |

No non-overlapping edit on the incoming side was discarded. The one fact the
incoming commit actually asserts (`story_points: 13`) is present in the staged
result; the remaining divergences are HEAD-only additions or same-fact
divergences resolved to the later-positioned side, consistent with both STEP 2e's
per-fact timeline rule and the auto-enriched resolution rule for this file.

## Incoming changes preserved

Verified against `git show :.xgd/tickets/hot/request-78370159.md`:

- `story_points: 13` — present (line 15). This is the incoming commit's sole
  substantive change and it is preserved.

No hunk was dropped under the BUG-1301 precedence exception. No code files,
config files, or UAT test files were involved in this conflict — the sole
conflicted path is a bookkeeping ticket, so STEP 3's code-file verification
loop has no other members.

## Post-merge review flag

Per the auto-enriched metadata ("Intent unknown on one or both sides … flag
this file for post-merge review"), `.xgd/tickets/hot/request-78370159.md` is
flagged. The specific thing worth a human glance is unchanged from the previous
attempt's report: the ticket reads `status: bundled` while the working-line
records that set `free_coding`/`free_coded` are superseded. That is correct only
if `bundle-87be4669` genuinely subsumes this ticket's free-coded work, which the
Sep 9 `seed_local_overlay` asserts but which this step cannot independently
confirm.

## Cherry-pick state

`CHERRY_PICK_HEAD` (`60e4959eb7e13e84e8856502e5e2a59ed079d07c`) left intact.
`git ls-files -u` is empty and `git status --porcelain` is clean. Because the
composition equals HEAD, `git diff --cached HEAD` is empty — the finalize step
will detect the clean staged diff and skip the commit. No
`--continue`/`--skip`/`--quit`/`--abort` was invoked.
