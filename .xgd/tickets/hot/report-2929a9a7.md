---
uid: report-2929a9a7
id: REPORT-3386
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T22:44:58.496427+00:00'
updated_at: '2026-09-03T22:44:58.496427+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — **UU**, index-only conflict
  (path is outside the sparse-checkout cone, 13% of tracked files present, so
  there were no working-tree markers). Class: **2e — intent/bookkeeping ticket**
  (`request-*`), resolved per-fact. Resolution: **ours**, staged with
  `git checkout --ours` + `git add --sparse`.

### Per-fact analysis

Three-stage blobs: base `0b2fc295` (parent of the picked commit), ours
`830421c6`, theirs `2ca0c4af`.

| Fact | Base | Ours (HEAD) | Theirs (incoming `3b9156ae`) | Kept |
|---|---|---|---|---|
| `status` | `ready_to_reconcile` | `bundled` | unchanged | **ours** — HEAD-only change |
| `fields.bundled_in` | absent | `bundle-8eef3846` | absent | **ours** — HEAD-only addition |
| `updated_at` | `2026-08-30T20:37:44Z` | `2026-08-31T05:05:09Z` | `2026-08-31T00:52:48Z` | **ours** — later timestamp |
| `last_field_updated` | `status` | `status` | `body` | **ours** — consistent with the later (status) edit |
| body prose | wrapped | wrapped (unchanged from base) | reflowed | **ours** — see below |

`status` and `bundled_in` are advanced only on the HEAD side. Taking theirs
wholesale would have silently reverted an operator-only status advancement,
which is the precise failure mode this per-fact rule exists to prevent.

### Why ours for the body

The incoming body edit is **content-identical to ours** — it is a formatting
round-trip, not an authored change. Verified mechanically rather than by eye:
both bodies were stripped of markdown emphasis/table punctuation and reduced to
word sequences, then compared with `difflib.SequenceMatcher`:

- ours 2036 words, theirs 2034 words, similarity **0.9995**
- the *only* two opcodes are deletions of the blockquote prefix `>` — an
  artifact of theirs joining a three-line wrapped blockquote onto one line.
  Ours has strictly *more* of these; nothing present in theirs is absent
  from ours.

What theirs additionally does, at zero content gain:

- flattens the two markdown pipe tables (the **Files** table and the
  **AC status** table) into loose unstructured lines, destroying both;
- mangles emphasis around inline code, e.g.
  `` *"…behind the same `BrowserDriver` seam."* `` becomes
  `` _"…behind the same _`BrowserDriver`_ seam."_ ``, and
  `` **`storage/references/` bytes have not moved to R2.** `` loses its
  bold delimiters.

HEAD already carries the *fix* for exactly this damage: commit `d5b1d6da65`
on the bundle branch takes the flat/mangled body as its pre-image and reflows
it into the wrapped, correct-emphasis, intact-table form. This file has
oscillated between the two renderings across commits on both branches, which
is the signature of a tool round-trip rather than deliberate authoring.

Under 2e this is the **superset clause** and the **timeline tie-break**
agreeing: ours carries the same body words, the intact table structure, and
the status advancement theirs lacks, and ours has the later `updated_at`.
No content from either side was invented, and none was dropped.

## Incoming changes preserved

No code or implementation files were in conflict — the sole conflicted path is
a `request-*` bookkeeping ticket, so STEP 3's code-file verification does not
apply and the BUG-1301 precedence exception was not invoked. No UAT test file
was touched, and no test function on either side was deleted.

The incoming commit `3b9156ae` touches exactly one file, this ticket
(`git show --stat`: 1 file changed, 120 insertions, 158 deletions). Its
substantive content is present in the staged result: every word of the incoming
body is in HEAD's copy, as demonstrated by the 0.9995 word-level match above.
The incoming commit's changes are therefore **redundant, not discarded** —
STEP 4's distinction. The staged tree consequently shows no net diff against
HEAD (`git diff --cached HEAD` is empty).

Per STEP 4 this was staged and exited normally; `--skip` was **not** called, and
no cherry-pick state transition was performed. `CHERRY_PICK_HEAD` remains
present (`git status` reports "You are currently cherry-picking commit
3b9156ae89 / all conflicts fixed") for `cherry_pick_finalize_resolution`.

## Flagged for post-merge review

The conflict enrichment classified this file as "intent unknown on one or both
sides — flag for post-merge review." Flagging accordingly:

- REQ-154's body is being rewritten back and forth between two renderings by
  something in the ticket toolchain (a rich-text/HTML→markdown round-trip is
  the likely culprit). It is lossy in one direction: it destroys pipe tables
  and inline-code emphasis. It will keep producing spurious conflicts on this
  and other long-bodied tickets until the round-trip is fixed.
- `fields.bundled_in` on the resolved ticket reads `bundle-8eef3846`, whereas
  the current reconcile bundle is `bundle-203b1dc2`. This value was carried
  from HEAD unchanged rather than invented or edited; worth confirming it is
  the intended bundle.
