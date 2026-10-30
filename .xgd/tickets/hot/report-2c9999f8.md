---
uid: report-2c9999f8
id: REPORT-5460
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T04:47:54.558426+00:00'
updated_at: '2026-09-29T04:47:54.558426+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e, `bug-*.md`). Incoming commit `d2b87a3946` ("xgd(ticket): update
  bug bug-3ade1af4", Martin Westhead, Tue Sep 1 12:27:33 2026 -0700).

  **Rule applied: superset.** Diffing the two index stages blob-to-blob
  (stage 3 `036c1169` vs stage 2 `4b1ec9bd`) shows the **prose bodies are
  byte-identical** — the entire conflict is confined to frontmatter plus a
  trailing-newline difference. Per-fact comparison:

  | fact | incoming (`d2b87a3946`) | HEAD | winner |
  |---|---|---|---|
  | `updated_at` | `2026-09-01T19:27:33Z` | `2026-09-19T15:15:31Z` | HEAD (later) |
  | `status` | `free_coding` | `free_and_reconciled` | HEAD (later) |
  | `completed_at` | `null` | `2026-09-14T10:29:13Z` | HEAD (later) |
  | `last_field_updated` | `body` | `status` | HEAD (later) |
  | `title` | "23 failures … ten UATs" | "27 failures + 30 collection errors … eleven UATs" | HEAD |
  | `fields.commits` / `.version` / `.bundled_in` | absent | `e5d76233…` / `0.2.33` / `bundle-8e1807f6` | HEAD (only side) |
  | trailing newline | present | absent | HEAD |

  No field is edited *disjointly* across the two sides — every differing
  fact is the same fact recorded later on HEAD, and the three metadata keys
  exist only on HEAD. So this is 2e's "one side a strict superset: keep the
  superset", not a per-fact timeline tiebreak.

  Worth noting the incoming `title` is stale against *its own body*: both
  sides' bodies enumerate **eleven** UATs and a Symptom block reading
  `27 failed … 30 errors`, while the incoming title still says "23 failures
  … ten UATs". HEAD's title is the corrected one, which independently
  confirms HEAD as the superseding revision rather than a competing edit.

  The lone incoming-only byte is a trailing newline. Left as HEAD has it —
  xgd's ticket writer normalises this on next write; deviating from HEAD
  for one whitespace byte would add churn without preserving any intent.

  Mechanics: `.xgd/tickets/` is outside this branch's sparse-checkout cone
  (DOC-986 §2/§4.1), so `git checkout --ours` refuses. Restored via
  `git show HEAD:<path>` and staged with `git add --sparse`.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is
a bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` code-hunk
check does not apply, and the BUG-1301 precedence exception was not needed.

Because the two sides' bodies are byte-identical, there is **no** narrative
content unique to the incoming side to preserve or discard. The only
incoming-only bytes are the four superseded frontmatter scalars listed
above (each a strictly earlier value of a field HEAD also sets) and the
trailing newline. Nothing the developer wrote is lost.

## Staging state

`git ls-files -u` empty; no conflict-class entries; zero conflict markers in
the working file. The staged tree is byte-identical to HEAD
(`git status --porcelain` empty), so this cherry-pick resolves to a no-op —
left for the finalize step to detect and skip, per instructions.
`CHERRY_PICK_HEAD` (`d2b87a3946177f799b99745e259f8ca53b6bbdf1`) is intact;
no `--continue`/`--skip`/`--quit`/`--abort` was issued.
