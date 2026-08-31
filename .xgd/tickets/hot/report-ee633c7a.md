---
uid: report-ee633c7a
id: REPORT-3101
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T22:09:05.461147+00:00'
updated_at: '2026-08-31T22:09:05.461147+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — UU, intent/bookkeeping ticket (rule 2e,
  "non-overlapping fields/sections changed on each side: apply BOTH", composed
  per-fact across frontmatter and body). Path is outside the sparse-checkout
  cone, so the conflict existed in the index only, with no working-tree markers;
  materialised with `git checkout --theirs`, frontmatter edited to HEAD's
  values, staged with `git add --sparse`.

  Incoming commit `163924e9` (`xgd(ticket): update bug bug-23d1ec27`,
  2026-08-25 16:27 -0700) is the developer's body rewrite: 99 insertions, 43
  deletions off base `593d49b2`. It declares its own operation in frontmatter —
  `last_field_updated: body`.

  HEAD (`01eb488d`, written by `9a853c57`,
  `xgd(ticket): seed_local_overlay bug bug-23d1ec27`, 2026-08-31) carries the
  same body text, but declares `last_field_updated: status` — it does not claim
  a body edit of its own. Its copy of the body is a carried-forward
  round-trip through the overlay-seed serializer, and that round-trip was
  lossy:
  - the markdown table under "Fix — as landed" is destroyed — the pipes are
    gone and every header and cell sits on its own line as bare prose
    (`suite` / `before` / `after` / `test_UAT_FC_REQ-122_chat_host` / `5
    failing` / `8/8 pass` / …), so eight rows of before/after evidence read as
    a meaningless 40-line list
  - the ` ```ts ` fence lost its language tag and gained a stray blank line
  - `**One double, in `tests/support/scripted-model-client.ts`**` became
    `**One double, in **`tests/support/scripted-model-client.ts`,` — the bold
    span closes in the wrong place
  - hard wraps collapsed and list items gained interleaved blank lines

  Composition applied:
  - **Frontmatter → HEAD.** `updated_at` (2026-08-31 vs 2026-08-25),
    `last_field_updated: status`, `status: bundled` (downstream of incoming's
    `free_coding`), plus `commits`, `version: 0.2.15`, `story_points: 3`,
    `bundled_in: bundle-8eef3846` — fields the incoming side never had.
    `bundled_in` names this very reconcile bundle.
  - **Body → incoming.** Neither side's narrative claims a body edit later than
    incoming's, and incoming is the authored rendering while HEAD's is the
    damaged automated copy. Taking it restores the table and the fences without
    losing any HEAD content, since the two bodies say the same thing.

  Nothing was invented: every line of the result comes from one side or the
  other. Verified mechanically — the resolved file is byte-identical to
  incoming `5db68a01` except for the frontmatter block, and its first 25 lines
  are byte-identical to HEAD `01eb488d`.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-23d1ec27.md` — the incoming commit's substantive change
  IS the body rewrite, and it is preserved in full, byte for byte. `git diff`
  between the incoming blob and the resolved file shows a single hunk, entirely
  within the YAML frontmatter; every one of the 99 inserted body lines is
  present. The three frontmatter facts incoming also touched (`updated_at`,
  `last_field_updated`, `status`) are the ones superseded by HEAD's later
  bookkeeping, per the per-fact timeline rule.

No hunks were dropped, so the BUG-1301 precedence exception was not used.

Unlike the two preceding commits in this bundle, this resolution does produce a
net change vs HEAD (staged as `M`): it restores the markdown structure the
overlay seed flattened.
