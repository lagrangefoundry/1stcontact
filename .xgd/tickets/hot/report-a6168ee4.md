---
uid: report-a6168ee4
id: REPORT-4570
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:23:11.243257+00:00'
updated_at: '2026-09-20T23:23:11.243257+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **UU**, intent/bookkeeping ticket (kind `bug`, STEP 2e). Resolved to **ours** under 2e's "one side a strict superset: keep the superset" rule. Staged with `--sparse` (path is outside the resync branch's sparse-checkout cone, DOC-986 §2/§4.1, so the conflict existed only in the index with no worktree markers).

Incoming commit this attempt: `e81f695ea6c9e1c321f78f9afcd3aad2947048ac`
(Mon Aug 24 14:57:20 2026 -0700). Ours/HEAD: `2b85aca40a`.

Stage blobs: base `c78eab15d3`, ours `29cfe4b6b9`, theirs `6862504041`.
Note the base blob is the *previous* attempt's incoming blob, and ours is
byte-identical to the previous attempt's ours — this resync queue is
replaying a run of sequential `xgd(ticket): update bug bug-6612c4b7`
commits whose cumulative effect already landed in HEAD via `2b85aca40a`.

Per-fact analysis (2e requires fact-level, not whole-file, adjudication):

| Fact | Ours (HEAD `2b85aca40a`) | Theirs (`e81f695e`) | Resolution |
|---|---|---|---|
| `coding_sessions` entry 1 `working_sha_history: []` | present | present | identical — no conflict |
| `coding_sessions` entry `0fe586d1f6…` | present | present | identical — no conflict |
| `coding_sessions` entry `999579b3fb…` | present | present | identical — no conflict |
| `version` | `0.2.13` | `0.2.13` | identical — no conflict |
| `last_field_updated` | `status` | `status` | identical — no conflict |
| body (all prose sections) | identical | identical | no conflict |
| `status` | `free_and_reconciled` | `free_coded` | ours (later lifecycle state) |
| `updated_at` | `2026-08-31T19:19:36` | `2026-08-24T21:57:19` | ours (later intent) |
| `completed_at` | `2026-08-31T19:19:36` | `null` | ours (superset) |
| `bundled_in` | `bundle-78f4e2fe` | absent | ours (superset) |
| trailing newline at EOF | present | absent | ours |

No fact was changed differently-but-incomparably on the two sides, so no
later-positioned-intent tiebreak was needed beyond the timestamps above.

Note on ordering signal: `git log` makes theirs the later *commit*
(14:57:20 vs 14:06:15 on 2026-08-24). That ordering is not the governing
fact here — these are resync-rewritten commits, and ours carries the
strictly later *ledger* state in-file (`updated_at` 2026-08-31,
`completed_at` set, reconciled and bundled). Taking theirs wholesale on
commit timestamp would have regressed the ticket from
`free_and_reconciled` back to `free_coded`, blanked `completed_at`, and
dropped the `bundled_in` link — the exact silent-discard failure BUG-1030
warns against. The auto-enrichment's "take the more recent commit by
timestamp" rule was therefore applied to the ledger fact, not the commit
header; flagging here for post-merge review as that rule directs.

## Incoming changes preserved

Yes — fully, and verbatim. Diffing base→theirs isolates exactly what
`e81f695e` contributes, and it is entirely a `coding_sessions` expansion
plus one scalar:

- add `working_sha_history: []` to the `2058a16449…` session entry
- add session entry `0fe586d1f67c678efd5a1ff02f5978948a41bb11`
- add session entry `999579b3fbef0757cf5e715691c9aaa9ecdf329e`
- bump `version` `0.2.11` → `0.2.13`
- set `last_field_updated` `body` → `status`
- bump `updated_at` to `2026-08-24T21:57:19`

Every one of those is already present byte-for-byte in the resolved file
(frontmatter lines 11, 19–30), verified by direct read. The ours→theirs
diff confirms it: across the whole `coding_sessions` block the only
delta is that ours carries one *additional* line (`bundled_in:
bundle-78f4e2fe`) — theirs contributes nothing ours lacks.

The `updated_at` bump is the sole incoming value not literally retained,
and it is superseded rather than discarded: ours holds `2026-08-31`,
strictly later on the same field, which is the correct per-fact outcome
under 2e.

Nothing incoming was dropped, so the BUG-1301 PRECEDENCE exception was
not invoked and no hunk was discarded under it.

No UAT test file was touched by this conflict — the file is a ticket,
and no test function was added, modified, or deleted. STEP 2f is not
implicated.

## Staging state

`git status --porcelain` is empty and `git ls-files -u` reports no
unmerged entries. Because the resolution equals HEAD, `git diff --cached
HEAD` is also empty — this cherry-pick is a no-op whose payload already
landed in HEAD via `2b85aca40a`. Per STEP 4 this was staged and left
alone: `--skip`/`--continue`/`--quit`/`--abort` were NOT called, and
`CHERRY_PICK_HEAD` (`e81f695e…`) remains present for the finalize step,
which will detect the clean staged diff and skip the commit.
