---
uid: report-f4815a4d
id: REPORT-5528
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T09:57:55.141764+00:00'
updated_at: '2026-09-29T09:57:55.141764+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — **UU**, class 2e (intent/bookkeeping
  ticket: `request-*`). Resolved to the HEAD side wholesale; staged via
  `git update-index --cacheinfo` (path is inside the sparse cone but the
  conflict had left no working-tree file), then materialised with
  `git checkout-index -f`.

  The two sides' only divergence was frontmatter. Per-fact resolution:

  | field | base | HEAD (kept) | incoming (9eb0360774) |
  |---|---|---|---|
  | `updated_at` | 2026-09-02T17:48:27 | **2026-09-09T21:32:50** | 2026-09-02T23:17:43 |
  | `last_field_updated` | status | **status** | body |
  | `bundled_in` | bundle-203b1dc2 | **bundle-87be4669** | bundle-203b1dc2 (unchanged) |

  Same-field-changed-differently on all three ⇒ genuine intent conflict ⇒
  later-positioned intent wins per fact. HEAD is later on every one, and is
  internally corroborated: `bundle-87be4669` exists in HEAD with
  `created_at: 2026-09-09T21:32:49`, one second before HEAD's `updated_at`,
  and has since reached `status: free_and_reconciled` with
  `main_sha: 66e172dd`. Taking the incoming side would have rolled the ticket
  back to the superseded `bundle-203b1dc2` and rewound `updated_at` by a week.

## Incoming changes preserved

- `.xgd/tickets/hot/request-3bc4b835.md` — **fully preserved.** The incoming
  commit's sole substantive change is the appended body section
  "## Note: the account/business split came after this ticket". Both sides had
  added that section independently and **identically**; diffed the resolved
  index blob against `9eb0360774:<path>` and the trailing section matches
  byte-for-byte. No incoming hunk was dropped.

No hunks were dropped under the BUG-1301 precedence exception; it did not apply
to this conflict.

## Staging state

`git status --porcelain` is empty — no UU/AA/DU/UD lines remain. The resolution
is a no-op against HEAD (HEAD already carried the incoming body note and the
newer frontmatter), so the staged diff is clean. `CHERRY_PICK_HEAD`
(`9eb0360774eb1788d9cd803699c170d4a5ba1836`) is left in place; no
`--continue`/`--skip`/`--quit`/`--abort` was issued. Python's finalize step
will detect the empty staged diff and skip the commit.
