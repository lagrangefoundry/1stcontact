---
uid: report-65b617e8
id: REPORT-5292
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T04:24:55.060303+00:00'
updated_at: '2026-09-28T04:24:55.060303+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, class **2e** (intent/bookkeeping
  ticket; a `bug-*` ticket, which lives in `hot/` in this store). Incoming
  commit `5a68fc8db7` (2026-08-26T16:21 -0700). Resolved to the **HEAD side**,
  per fact. Three-way stages: base `ad25504e54`, ours `52bab41f`,
  theirs `df68f1cf47`.

  | fact | base | ours | theirs | resolution |
  |---|---|---|---|---|
  | `status` | `ready_to_reconcile` | `bundled` | `ready_to_reconcile` | **ours** — theirs did **not** touch this field (base == theirs); only ours moved it. One-sided change, not a conflict at all. |
  | `bundled_in` | (absent) | `bundle-8eef3846` | (absent) | **ours** — one-sided addition by ours |
  | `updated_at` | 2026-08-26T18:31:09 | 2026-08-31T05:05:09 | 2026-08-26T23:21:08 | **ours** — later |
  | `last_field_updated` | `status` | `status` | `body` | **ours** — ours' edit is the later one (08-31 vs 08-26), so `status` is genuinely the last field updated |
  | `body` | (well-formed) | (well-formed, == base) | reflowed, structure destroyed | **ours** — see below |
  | trailing newline | absent | present | absent | **ours** — well-formed file |

  The only fact the incoming side touched substantively is the **body**, and
  its contribution there is **pure destructive formatting churn with zero
  semantic delta**. Verified mechanically, not by eye: after normalising away
  whitespace/line-wrapping and table pipes, both bodies reduce to **966 words,
  identical and in identical order**. The complete set of non-whitespace
  differences is two markdown-integrity regressions on the incoming side:

  1. The ` ```ts ` code-fence language tag is dropped to a bare ` ``` `.
  2. A bold span is mangled: ours ``**One double, in `tests/support/scripted-model-client.ts`**,``
     (bold correctly spans the phrase including the path) becomes theirs
     ``**One double, in **`tests/support/scripted-model-client.ts`,`` — the
     bold closes early after "in ", leaving the path unbolded and a stray
     marker. This renders as broken markdown.

  Plus the structural damage that normalisation deliberately masked so the
  prose could be compared at all:

  | marker | ours | theirs |
  |---|---|---|
  | markdown table rows (`^\|...\|$`) | 10 | **0** — the `suite / before / after` table is destroyed; its cells spill out as bare unlabelled lines |
  | ` ```ts ` fences | 1 | 0 |

  `base` and `ours` bodies are **byte-identical** apart from the trailing
  newline, so ours is the unmodified well-formed body and theirs is the
  reflowed one. This is the known `seed_local_overlay` body-reflow signature —
  a fat, alarming-looking hunk that is entirely rewrap churn. Keeping ours is
  therefore not a timeline tiebreak; it is choosing the side that did not
  corrupt the document, on a fact where the two sides carry the same content.

  Mechanics: `.xgd/tickets/` is outside the sparse-checkout cone on this resync
  branch (DOC-986 §2/§4.1), so the conflict existed only in the index with no
  working-tree markers. Resolved with `git checkout --ours --` then
  `git add --sparse --` (plain `git add` silently refuses an out-of-cone path
  and leaves all three stages in place). Verified stage 0 is blob `52bab41f` —
  ours exactly, no hand-merged hybrid.

## Incoming changes preserved

No code/implementation files were in conflict, so there is no code-hunk
preservation check to perform. The sole conflicted path is a bookkeeping
ticket.

One incoming edit is intentionally not carried forward: the body reflow
(and the `last_field_updated: body` that records it). This is not a discarded
developer change — the incoming body contains **no content the HEAD-side body
lacks** (966/966 words identical, proven above). Carrying it forward would
have destroyed a 10-row markdown table, dropped a code-fence language tag, and
left a mis-nested bold span, while adding nothing.

The incoming side did **not** contest `status`: base and theirs agree on
`ready_to_reconcile`, and only ours advanced it to `bundled`. So no lifecycle
regression was even at stake on this pick — unlike the preceding iteration.

The BUG-1301 precedence exception was **not** invoked: no hunk was dropped on
the grounds of a prior HEAD-side refactor, and no test function on either side
was deleted.

## Note for the sequencer

`git diff --cached HEAD` is **empty** — HEAD already holds this exact content,
so the pick is a no-op. Per STEP 4 this was staged and exited `@done` without
calling `--skip`; the finalize step should detect the clean staged diff and
skip the commit.

`CHERRY_PICK_HEAD` (`5a68fc8db7`) was left intact. No `--continue`, `--skip`,
`--quit`, or `--abort` was issued.
