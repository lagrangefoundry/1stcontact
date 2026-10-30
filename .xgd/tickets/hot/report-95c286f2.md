---
uid: report-95c286f2
id: REPORT-5233
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T00:41:53.309795+00:00'
updated_at: '2026-09-28T00:41:53.309795+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — **AA** (both added), intent/bookkeeping ticket
  (`request-*`), rule **2e**: *"One side a strict superset: keep the superset."* Resolved to
  **ours** (stage-2 blob `36e51a0c`).

  Out-of-sparse-cone path (`sparse-checkout` excludes `/.xgd/tickets/**`), so resolved with
  `git checkout --ours` + `git add --sparse`.

### Why ours, in detail

Incoming (`CHERRY_PICK_HEAD` = `97327f55c1d75dfef7bf44d407e7b73949eef6e6`,
*"xgd(ticket): update request request-b88b79fe"*) is an **earlier lifecycle snapshot** of the
same ticket, not a competing edit:

| Field | ours (HEAD) | theirs (incoming) |
|---|---|---|
| `updated_at` | `2026-08-31T05:05:09Z` | `2026-08-20T23:16:27Z` |
| `status` | `bundled` | `draft` |
| `last_field_updated` | `status` | `body` |
| `fields.commits` | `working_sha: 29c0e86d…` | *absent* |
| `fields.version` | `0.2.16` | *absent* |
| `fields.bundled_in` | `bundle-8eef3846` | *absent* |

Taking incoming would regress `bundled` → `draft` and drop the `commits` / `version` /
`bundled_in` provenance that the bundling step wrote — the same class of overlay-vs-incoming
status regression seen elsewhere in this resync.

Ours additionally carries a ~120-line `# What was built` implementation record (AC3's fourth
option — in-process request fulfilment via `OriginResolver`, the `withBrowserSession` lease,
the `1c shot` split, the files table, the 25-UAT test plan and per-AC status table). Incoming
has none of it.

### Nothing from incoming was discarded

Every remaining line-level difference on the **shared** prose is pure presentation churn from
the overlay reflow, not content:

- hard-wrap at ~95 columns vs. unwrapped paragraphs (blockquote, "Two transports", "the part
  that is NOT mechanical", "Sessions are billed and capped", "Origin");
- emphasis-marker style swap `_"…"_` ↔ `*"…"*` (DOC-13 §8 quote, "Screenshots — the AI's eyes",
  the blank-screenshot-bug quote in candidate 3);
- blank lines between numbered list items (the three Access candidates; acceptance criteria
  1–6) vs. a tight list;
- incoming's file lacks a trailing newline.

Item-by-item comparison of the three Access candidates and all six acceptance criteria
confirms identical wording on both sides. Incoming contributes **no** prose, field or section
that ours lacks, so the superset rule applies cleanly with no per-fact timeline tie-break
needed.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping
(`request-*`) ticket, so STEP 3's `git show $CPHEAD -- <file>` verification of developer code
does not apply.

For the ticket itself: incoming's every field is either present in the resolved version at an
equal-or-later value, or is a strictly older value of a field ours advances (`status`,
`updated_at`, `last_field_updated`). No BUG-1301 precedence exception was invoked; no test
function on either side was deleted.

Note: because ours was taken verbatim, the staged tree is identical to HEAD and
`git status --porcelain` reports no change. Per the workflow contract this is left for the
finalize step to detect and skip — `--skip` was not called here, and `CHERRY_PICK_HEAD`
remains present.
