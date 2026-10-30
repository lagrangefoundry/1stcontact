---
uid: report-eca9e072
id: REPORT-5749
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T13:34:59.735488+00:00'
updated_at: '2026-09-30T13:34:59.735488+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-8e1807f6.md` — class **UU**, intent/bookkeeping ticket
  (`bundle-*`), **rule 2e**. ONE conflict region, entirely in the YAML frontmatter.
  Resolved by keeping the **strict superset (ours / HEAD)**.

  Path is outside this branch's sparse-checkout cone (DOC-986 §2/§4.1), so the
  conflict lived in the index with working-tree markers materialised; staged with
  `git add --sparse` as a standalone Bash call (BUG-1294).

  Three-way facts:

  | fact | base (`d9d9554def^`) | incoming (`d9d9554def`) | ours (HEAD) | taken |
  |---|---|---|---|---|
  | `updated_at` | `2026-09-16T01:48:46.102488` | `2026-09-16T21:58:07.519410` | `2026-09-19T15:19:02.855469` | ours |
  | `completed_at` | `2026-09-14T10:28:59.383699` | `2026-09-14T10:28:59.383699` | `2026-09-14T10:28:58.377424` | ours |
  | `last_field_updated` | `status` | `status` | `result` | ours |
  | `status` | `ready_to_reconcile` | `reconciling` | `free_and_reconciled` | ours |

  Post-resolution state: resolved file is **byte-identical to `HEAD:<path>`**
  (including the absence of a trailing newline); `git status --porcelain` empty;
  `git ls-files -u` empty; no conflict markers remain; `git diff --cached HEAD`
  empty (**zero net change**); `CHERRY_PICK_HEAD` intact at `d9d9554def`.
  Per STEP 4, `--skip` was NOT called — finalize will detect the clean staged
  diff and skip the commit.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole file is an
intent/bookkeeping ticket — so STEP 3's per-code-file verification is not
applicable. The BUG-1301 PRECEDENCE exception was **not** invoked, and no UAT
test file or test function was touched or deleted.

**Incoming is a strict prefix of ours, so no incoming content is lost.** Verified
on the ours-vs-incoming diff rather than on lifecycle `status`, because `status`
oscillates across this bundle's pick series (`free_and_reconciled` →
`ready_to_reconcile` → `reconciling` → …), making it useless as an ordering signal
in either direction.

`git diff 23fbaeabac8d6a5982ba8a50bd0dbf5d4bcd5df3 d9d9554def:<path>` yields
**five `+` lines, every one a lower-valued version of a field ours already holds;
incoming introduces no field ours lacks:**

- `updated_at` — ours leads by ~3 days (09-19 vs 09-16).
- `completed_at` — incoming is 1.006 s *later* than ours, but this is **not** a
  later decision: incoming writes `completed_at` equal to base's own value, i.e.
  the same reconcile-completion event ours stamps 1.006 s earlier. This is the
  recurring "one reconcile event stamped twice ~1 s apart" pattern already
  adjudicated at earlier positions in this series and at the `bundle-87be4669` tip.
- `last_field_updated` / `status` — superseded; ours continued past them to `result`.
- `reconcile_sha: null` where ours carries the real
  `2cd4e5865d1926bedf35fa7bd946639c58c9e555`.

Fields present on ours and **absent from incoming entirely**: `skipped_commits`,
`orphan_commits` (5 `old_sha`→`new_sha` entries), `regression_anchor_uid:
report-3b8d3d7e`, `merged_at_commit`, `session_assessor`,
`session_assessor_started_at`, `result: pass`.

The 1253-line body and the `commits` list are untouched by incoming, so the
earlier adjudication of the `working_sha` / `orphan_commits` structure is not
reopened.

**No out-of-marker regression.** Checked explicitly, because git silently
auto-takes theirs for lines only theirs moved (typically `status`). Stripping the
three marker lines from the working-tree file and diffing against `HEAD:<path>`
surfaced **only the four incoming frontmatter lines and nothing else** — the whole
remainder was already HEAD's. Incoming's entire delta from base is those 4 lines
(`2 insertions / 2 deletions` per `--stat`), all inside the marked region, so there
was no out-of-marker surface to regress.

Ours' blob `23fbaeabac8d6a5982ba8a50bd0dbf5d4bcd5df3` is **unmoved** and
byte-identical to `HEAD:<path>`, confirming that the preceding zero-net-change
resolutions on this path really did net to nothing.

## Flagged for post-merge review

The auto-enrichment classified both sides' intent as unknown and prescribed
"take the more recent commit by timestamp and flag this file for post-merge
review." Flagging accordingly. Note that the naive timestamp rule *incidentally*
agrees with this resolution on `updated_at` (ours 09-19 vs incoming 09-16), but it
is not what settles the file: the strict-prefix relation plus the duplicate-stamp
analysis of `completed_at` is the decision. The bare timestamp rule would have
handed `completed_at` to incoming on a 1.006 s margin, against the documented
single-event pattern.
