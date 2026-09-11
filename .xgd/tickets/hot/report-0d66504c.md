---
uid: report-0d66504c
id: REPORT-3824
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T00:42:08.624482+00:00'
updated_at: '2026-09-11T00:42:08.624482+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — class **UU**, index-only
  (path is outside the sparse-checkout cone, so there was no working-tree file
  and no conflict markers; resolved by composing a blob and staging with
  `git add --sparse`). Rule applied: **2e — intent/bookkeeping ticket,
  per-fact resolution**, first bullet ("non-overlapping fields/sections
  changed on each side: apply BOTH").

### Why 2e's "apply BOTH" and not a timeline pick of one whole file

The two sides changed **disjoint facts**. Diffing each stage against the merge
base (`0b2fc295c6`) rather than against each other makes this unambiguous:

| fact | base | ours (HEAD, `57357427c8`) | theirs (incoming, `2ca0c4af0c`) |
|---|---|---|---|
| `status` | `ready_to_reconcile` | **`bundled`** | unchanged |
| `fields.bundled_in` | absent | **`bundle-8eef3846`** | absent |
| body | hard-wrapped | **unchanged** | **reflowed** |
| `last_field_updated` | `status` | unchanged | `body` |
| `updated_at` | `…08-30T20:37:44` | `…08-31T05:05:09` | `…08-31T00:52:48` |

Ours touched only lifecycle bookkeeping; theirs touched only the body. The
resolution therefore carries **both**: the incoming body verbatim, plus ours'
`status: bundled` and `fields.bundled_in: bundle-8eef3846`.

The auto-enrichment rule ("intent unknown on both sides — take the more recent
commit by timestamp") was read as applying **per fact**, per 2e, not to the
whole file. Taking theirs wholesale would have reverted `status: bundled` back
to `ready_to_reconcile` and dropped `bundled_in` — i.e. silently undone this
bundle's own bookkeeping, which is the exact failure mode BUG-1030 describes.

### The one genuinely contested fact

`updated_at` / `last_field_updated` is the only pair both sides wrote. Resolved
toward **ours**: `updated_at: '2026-08-31T05:05:09.416379+00:00'` with
`last_field_updated: status`.

Both available timeline signals agree that ours is the later edit:

- Ticket-store clocks: ours `08-31T05:05:09Z` vs theirs `08-31T00:52:48Z`.
- Committer dates: ours `2026-09-09 18:34:48 -0700` vs theirs
  `2026-08-30 17:52:48 -0700`. (Ours' *author* date, `2026-08-28`, is stale —
  the commit was replayed onto the reconcile branch, so committer date is the
  usable signal.)

`last_field_updated` is derived bookkeeping, not authored prose: it must name
whichever edit `updated_at` refers to. Pairing theirs' `body` with ours' later
timestamp would have been internally inconsistent. No authored content was
dropped by this choice.

The EOF newline ours added is kept (present on the ours side; theirs ends
without one).

`xgd working-timeline` was not consulted — neither side carries an
`intent_uid` for this request ticket, which is what the enrichment's "intent
unknown on one or both sides" is reporting.

## Incoming changes preserved

**Confirmed — the incoming commit `3b9156ae89` is preserved in full.**

`diff <theirs blob> <resolved file>` returns exactly five deltas, all four of
them the deliberate HEAD-side facts above plus the trailing newline:

    9c9    updated_at      → ours (later)
    11,12  last_field_updated / status → ours
    25a26  + bundled_in: bundle-8eef3846
    218c219 trailing newline

Every other byte, including the whole of the incoming body rewrite (lines
27–218), is theirs verbatim. Equivalently: `git diff --cached` against HEAD
shows *only* the incoming body hunks and no frontmatter hunk at all.

No hunk was dropped, so the BUG-1301 precedence exception was not invoked and
no UAT function was touched (the commit modifies one ticket file and nothing
else — `git show --stat` confirms a single-file commit).

## Flagged for post-merge review

The incoming body edit adds **no prose**. A word-level diff of base vs theirs
(whitespace-normalised) shows every difference is formatting:

- line unwrapping of hard-wrapped paragraphs and blockquotes;
- emphasis markers changed `*x*` → `_x_`, several of them **mangled** in the
  process — e.g. ``_"…behind the same _`BrowserDriver`_ seam."_``,
  ``(**`setContent`**/**`data:`**)**``, and ``` `storage/references/`** bytes
  have not moved to R2.** ```;
- **two markdown tables destroyed** — the "Files" table and the "AC status"
  table lost their `|` cell delimiters and `|---|---|` separator rows, and are
  now bare alternating lines.

This reads like a round-trip of the body through a renderer/editor rather than
an intentional rewrite. It was taken as-authored anyway: ours did not touch the
body, so the incoming side is the only side with a body edit, and reinstating
the tables from base would have been me partially reverting developer content
on my own formatting judgement — which STEP 3 forbids. Flagging it here instead,
as the enrichment rule directed. Re-running the body through `xgd ticket update`
would restore the table markup if someone wants it; it is presentation only, no
facts are at stake.
