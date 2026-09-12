---
uid: report-e9b0c2d4
id: REPORT-4133
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T20:41:28.994191+00:00'
updated_at: '2026-09-12T20:41:28.994191+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — class **UU**, rule **2e**
  (intent/bookkeeping ticket: `request-*.md`). Incoming commit `60dd71c053`
  ("xgd(ticket): update request request-b88b79fe", 2026-08-28), 156 insertions.
  Resolved by **per-fact composition: HEAD's frontmatter + incoming's body** —
  neither side was a whole-file winner.

### Why composition rather than picking a side

Diffing ours (`36e51a0c74`) against theirs (`ce69fd1a5d`) shows the two sides
carry **identical prose, word for word, in every section**. They differ in two
independent respects:

1. **Frontmatter (genuine facts)** — HEAD: `status: bundled`,
   `bundled_in: bundle-8eef3846`, `updated_at: 2026-08-31T05:05:09`,
   `last_field_updated: status`. Incoming: `status: free_coded`, no
   `bundled_in`, `updated_at: 2026-08-28T16:40:51`,
   `last_field_updated: story_points`.
   -> **Kept HEAD.** Its commit (`bc62f2857d`, 2026-09-11) is later than
   incoming's (2026-08-28), which is what both the 2e timeline rule and this
   file's auto-enriched rule ("take the more recent commit by timestamp")
   direct. `bundled` is also forward of `free_coded` in the lifecycle, and
   `bundled_in` is owned by the bundling automation — taking incoming here
   would have regressed the ticket's status and dropped the bundle linkage.

2. **Body (presentation of the same words)** — incoming is the developer's
   authored markdown: hard-wrapped, `*italics*`, and **real markdown tables**
   for `## Files` (9 rows) and `## AC status` (6 rows). HEAD's copy is a
   damaged round-trip of the same text: both tables flattened into loose
   one-cell-per-line paragraphs, and bold delimiters mangled — e.g. HEAD has
   ``- `storage/references/`** bytes have not moved to R2.**`` where incoming
   has the well-formed ``- **`storage/references/` bytes have not moved to
   R2.**``; likewise ``**vs. option 3 (**`setContent`**/**`data:`**)**`` vs
   incoming's ``**vs. option 3 (`setContent`/`data:`)**``.
   -> **Kept INCOMING.** Same information, strictly higher fidelity; HEAD's
   rendering has lost table structure that incoming still carries.

This is precisely what 2e means by resolving "per fact, not the whole file".
Taking HEAD wholesale (as the previous, genuinely-redundant attempt on this
same file correctly did) would this time have discarded the developer's intact
tables; taking incoming wholesale would have regressed `status` and dropped
`bundled_in`. No content was invented: every line in the resolved file comes
verbatim from one side or the other.

## Incoming changes preserved

Verified with `git diff --no-index` between the incoming blob `ce69fd1a5d` and
the resolved file. The **only** differences are the four frontmatter facts
deliberately taken from HEAD (`updated_at`, `last_field_updated`, `status`,
and the added `bundled_in`). Everything else is byte-identical to incoming.

Incoming's diff over its base `276781dcf2` was 159 changed lines:

- **156 lines** — the entire `# What was built` section (in-process request
  fulfilment, one-browser-per-run, the `1c shot` runtime split, what the CF
  driver does not do, deliberately-not-done, the Files table, the test plan,
  the AC status table). **PRESENT VERBATIM**, tables intact.
- **3 lines** — the `updated_at` / `last_field_updated` frontmatter scalars,
  deliberately superseded by HEAD's later-timestamped values per the per-fact
  rule above.

So the whole of the incoming commit's substantive content is preserved. No
BUG-1301 precedence exception was invoked; no hunk was dropped as obsolete.
No code or test files were involved in this conflict.

Staged diff vs HEAD is non-empty (156 insertions, 118 deletions), so this is
not the redundant-commit case that the previous attempt on this file hit.

Because this file's enrichment rule directs it, **the file is flagged for
post-merge review** — specifically to confirm that restoring the table markup
is wanted, in case the flattened HEAD rendering was produced deliberately by
a ticket-store serializer rather than by lossy round-tripping.

`git add --sparse` was used (path is outside the sparse-checkout cone,
DOC-986 section 2 / 4.1), preceded by `git checkout --theirs` to materialize
the incoming side. Those were the only git writes; `CHERRY_PICK_HEAD` is still
present for `cherry_pick_finalize_resolution`.
