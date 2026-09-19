---
uid: report-2ef46f07
id: REPORT-4358
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T09:19:22.382354+00:00'
updated_at: '2026-09-19T09:19:22.382354+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — **UU**, intent/bookkeeping ticket
  (rule **2e**). Outside the sparse-checkout cone, so the conflict existed in the index
  only with no working-tree markers; resolved by composing the three stages and staging
  with `git add --sparse`.

  **The two sides touch disjoint facts, so BOTH were applied:**

  - *Ours* (HEAD, bundling commit) changed **frontmatter only** — `status:
    ready_to_reconcile` → `bundled`, added `fields.bundled_in: bundle-8eef3846`,
    `updated_at` → `2026-08-31T05:05:09Z`, plus a trailing newline. Its body is
    byte-identical to the merge base.
  - *Theirs* (incoming free_coded `3b9156ae`) changed **body only** — a whole-body
    markdown reflow (hard-wrapped lines unwrapped, `*emph*` → `_emph_`, blank lines
    between list items). Its frontmatter is unchanged from base apart from `updated_at`
    / `last_field_updated`.

  Resolution = theirs' body verbatim + ours' four frontmatter deltas.

  **Same-fact conflicts (`updated_at`, `last_field_updated`) — per-fact timeline rule:**
  ours `2026-08-31T05:05:09Z` vs theirs `2026-08-31T00:52:48Z`. Ours is 4h later, so ours
  wins for that pair. The composed result is self-consistent: the body edit (00:52) came
  first, the status change (05:05) was genuinely the last field updated.

  **Independent confirmation:** the composed blob hashes to `36e51a0c74`, a blob that
  already existed in this branch's own history — the reformat-plus-bundling state that
  sat on the branch before replay churn (commit `6c9d3189`, author-dated 2026-08-28 but
  committed 2026-09-18) reverted the body to the older snapshot. The resolution is not a
  novel hybrid; it reconstructs a state the branch genuinely held.

## Incoming changes preserved

- `.xgd/tickets/hot/request-b88b79fe.md` — **fully preserved.** `git diff` between the
  incoming stage-3 blob and the resolved file shows *only* the four ours-side frontmatter
  lines plus the trailing newline; every byte of the incoming body reflow is present
  verbatim. No hunk of the incoming diff was dropped, so the BUG-1301 precedence
  exception was not invoked and does not apply here.

No code files were involved in this conflict, and no test function on either side was
touched or deleted.

## Flagged for post-merge review

The conflict enrichment asked that this file be flagged, and there is a substantive
reason beyond the boilerplate:

**The incoming body reflow is lossy — it destroys two markdown tables.** The "## Files"
table (9 rows, `| File | What |`) and the "## AC status" table (6 rows, `| AC | Status |`)
are both flattened into sequences of bare one-line paragraphs, losing the header row, the
column separators and the cell pairing. The prose is preserved verbatim throughout; only
these two tables degrade. The signature (line-unwrapping, `*` → `_`, blank lines inserted
between list items) is a round-trip through a rich-text editor rather than a deliberate
rewrite, so the table loss reads as collateral damage, not intent.

It was **not** repaired here on purpose: ours made no competing body edit, so 2e gives the
body to the incoming side, and reinstating the base tables inside the reflowed prose would
have manufactured a body that exists on neither side — which 2e explicitly prohibits
("inventing content not present on either side"). Restoring the two tables is a one-commit
content fix for a human, best done against the ticket after the bundle lands.

Note also that this ticket has been oscillating between the 08-28 and 08-30 body snapshots
across repeated replays (`bc62f285` 09-11, `d86cbfd7` 09-14, `6c9d3189` 09-18). This
resolution settles it on the later-authored (08-30) body; if the oscillation recurs on a
future bundle, the underlying replay ordering — not this resolution — is the thing to fix.
