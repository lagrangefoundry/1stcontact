---
uid: report-7004a3cd
id: REPORT-5302
type: report
title: 'Resync resolve conflicts: 89e17d73445d61fa09640d078b6bbf4ec089554a'
created_by: xgd
created_at: '2026-09-28T06:30:40.082095+00:00'
updated_at: '2026-09-28T06:30:40.082095+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/doc-e70ef718.md` (DOC — "Chat Session Persistence and AI Memory") — **AA**, ticket/bookkeeping file, resolved **ours wholesale**.
  - Rule applied: the sequencer's guidance was *"Intent unknown on one or both sides. Take the more recent commit by timestamp and flag this file for post-merge review."* Ours is the more recent side on every available clock, so ours wins.
  - Path is outside the sparse-checkout cone, so `git checkout --ours` + `git add` were refused ("paths ... exist outside of your sparse-checkout definition"). Resolved at index level instead: `git update-index --cacheinfo 100644,7d8369d7…,<path>`. Index now holds a single stage-0 entry at the ours blob; `git ls-files -u` is empty.

## Why the AA, and why ours

The incoming commit `89e17d73` sits directly on top of `0d11a014`
(`xgd(resync): strip .xgd/tickets, … from main snapshot (BUG-904)`), which had
deleted the file. So its 408-line "insertion" is a strip restore, not a
creation — which is why git saw add/add against a HEAD that never lost the file.

The two sides' **bodies are byte-identical**. The whole diff is five frontmatter
lines:

| | ours (stage 2, HEAD) | theirs (stage 3, incoming) |
|---|---|---|
| `updated_at` | `2026-08-31T19:42:51` | `2026-08-31T00:50:27` |
| `last_field_updated` | `system_kb` | `body` |
| `fields.system_kb` | *(absent)* | `true` |

Ours is strictly the later state. Taking theirs would have regressed the field
state by re-adding a retired `system_kb: true`.

## Incoming changes preserved

Yes — in full, and already present before this resolution.

The picked commit's message is *"content edit: correct 6.3 — the corpus was seed
material for testing, never a curation policy; cite DOC-39 for what the KB should
hold."* That exact edit is already on HEAD as `fcf96a0a71`, same subject, same
author date (`Sun Aug 30 17:50:28 2026 -0700`) — the pre-strip twin of the picked
commit, carried in by the post-watermark sync. Verified in the ours blob:

- §6.3 reads "**Seed material, not a policy.** Corrected here because the original
  wording of this section read as a settled principle and has since been cited as
  one." (ours blob line 238)
- The DOC-39 citation is present: "What the system KB should actually hold is
  settled in [[DOC-39]] §3, which…" (ours blob line 255)

On top of that, HEAD carries one further commit the incoming side predates:
`93713dfb2a` — *"field: retire system_kb boolean; membership moves to doc_kind
(DOC-39 3.3)"* — which is precisely what removes `fields.system_kb` and sets
`last_field_updated: system_kb`. That is a deliberate operator field change
following the same DOC-39 that the incoming commit cites, so it must not be
reverted.

No hunk was dropped. Nothing was taken under the BUG-1301 precedence exception.

## Post-merge review flag

The resolution rule asks that this file be flagged for post-merge review. Flagging
it here for completeness, though the ambiguity resolved cleanly: the picked commit
is already on HEAD under another sha, so **this cherry-pick is expected to be
empty** — `git status` is clean after staging, because the resolved index for this
path equals HEAD. The sequencer should expect the empty-pick path.

## Sequencer state

Untouched. No `--continue` / `--skip` / `--quit` / `--abort` was run.
`CHERRY_PICK_HEAD` is still `89e17d73445d61fa09640d078b6bbf4ec089554a`.
