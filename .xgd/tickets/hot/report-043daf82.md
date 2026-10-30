---
uid: report-043daf82
id: REPORT-5234
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T00:49:56.459699+00:00'
updated_at: '2026-09-28T00:49:56.459699+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-01ea4eec.md` — **AA** (both added; no stage 1, path is
  outside the sparse cone `!/.xgd/tickets/**` but had materialized on disk with
  markers). Class 2e (intent/bookkeeping ticket, `request-*`). Resolved by taking
  **ours (HEAD)** wholesale; staged with `git add --sparse`.

  Rule applied, per fact:

  | Fact | Ours (HEAD) | Incoming (`1e813620`) | Taken |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `draft` | ours — incoming-wins would regress the lifecycle |
  | `updated_at` | `2026-09-19T15:15:32Z` | `2026-08-20T23:16:33Z` (== `created_at`) | ours (later) |
  | `completed_at` | `2026-09-14T10:29:15Z` | `null` | ours |
  | `last_field_updated` | `status` | `created_at` | ours |
  | `fields.commits` / `fields.version` (0.2.32) / `fields.bundled_in` (`bundle-8e1807f6`) | present | absent | ours — incoming-wins would drop the bundle linkage |
  | body prose (§"The shape of the port", 5 design decisions, non-determinism, blast radius, test plan) | expanded rewrite | earlier short draft (§"What the port has to add that `SiteStore` did not") | ours (strict superset in intent) |

  Frontmatter is otherwise byte-identical on both sides (`links`/`depends_on`,
  `chat_comment`, `priority`, `story_points`, `auto_merge_back`, `needs_review`).

## Incoming changes preserved

No incoming developer content was discarded. The incoming commit is a **duplicate of
an operation already applied on this branch**:

- `CHERRY_PICK_HEAD` = `1e813620337fe8ca09c21d90cc41bf47297cbdfb`,
  subject `xgd(ticket): update request request-01ea4eec`, author date
  `Sun Aug 23 16:28:01 2026 -0700`, touching only this file (`+89`, no deletions).
- The same operation is already in this branch's ancestry as
  `a85ff47461a28b3fd475936d6dbc6df6e7ab7325` — identical subject and identical author
  date — and its resulting blob for this path is
  `beafdf2ee6cb25c75587d00f8b301a2077fefceb`, **byte-identical to the incoming
  (stage 3) blob**. Verified via
  `git rev-parse a85ff474:.xgd/tickets/hot/request-01ea4eec.md`.

So everything the incoming commit produced is already reachable from HEAD. `xgd ticket
history request-01ea4eec` shows four later ledger operations layered on top of that
state, which is why ours is the richer side:

1. `2026-08-20 16:16` `create` (draft, short body)
2. `2026-08-23 16:28` `update` ← **the incoming commit; already applied as `a85ff474`**
3. `2026-09-11 14:08` `seed_local_overlay` — expanded the body (shape of the port,
   design decisions 1–5, non-determinism, blast radius, test plan), added
   `fields.commits` / `fields.version`
4. `2026-09-17 13:23` `seed_local_overlay`
5. `2026-09-19 08:15` `update` — advanced `status` to `free_and_reconciled`

The only incoming-side text absent from the resolved file is the earlier
§"What the port has to add that `SiteStore` did not" bullets, including their
`[[REQ-157]]` wikilink. That is supersession by later ledger operations on the same
ticket, not a dropped edit: the three topics those bullets raised are each carried
forward in more depth (list verb → `ReferenceBundle.list` + design decision 1;
bundle identity → design decision 4, which *explicitly settles* the
capture-time-in-the-name question the `[[REQ-157]]` bullet had left open, choosing
URL-derived `<host>/<pathSlug>` instead; tenancy → design decision 5). `[[CHAT-27]]`
remains cited in §Origin.

No code files, no UAT test files, and no spec tickets were involved, so neither the
BUG-1301 precedence exception nor rule 2f applies.

## Staging state

`git status --porcelain` is empty; `git ls-files -u` is empty; staged blob for the
path is `e5c0842463dec5e006632c82eabd7e82e32ceb52` (== ours == HEAD). The staged diff
against HEAD is therefore **empty** — this resolution leaves no net change, because
the incoming operation already landed via `a85ff474`. Per STEP 4 I did not call
`--skip`; `CHERRY_PICK_HEAD` (`1e813620`) is still present for the finalize step,
which should detect the clean staged diff and skip the commit.
