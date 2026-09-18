---
uid: report-94ecdae2
id: REPORT-4353
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T08:23:37.120777+00:00'
updated_at: '2026-09-18T08:23:37.120777+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — class **UU**, rule **2e** (intent/bookkeeping ticket, `request-*`). Resolved per-fact, composing both sides: **HEAD's frontmatter + the incoming commit's body**.

Incoming commit: `60dd71c0533f493ff8a9dee945f5201af056d393` ("xgd(ticket): update request request-b88b79fe", 2026-08-28, 156 insertions / 3 deletions). This is the second half of a commit pair — the predecessor `04d4a984` (resolved in the previous step) announced the `free_coded` promotion in frontmatter, and this one delivers the content under an identical subject.

Four conflicted hunks. Resolved per fact:

**Frontmatter (hunk 1) — kept HEAD.**
- `status`: incoming `free_coded` vs HEAD `bundled`. Not competing edits to one fact — sequential lifecycle states. HEAD already passed through `free_coded` (it carries this branch's `commits[0].working_sha: 29c0e86d…` and `version: 0.2.16`) and advanced to `bundled`. Taking incoming would walk an operator-owned status backwards.
- `updated_at`: HEAD's 2026-08-31 is later and consistent with the kept status.
- `last_field_updated`: incoming `story_points` vs HEAD `status`. Kept HEAD's — it is the breadcrumb for HEAD's own later `status` write.
- `fields.bundled_in: bundle-8eef3846`: HEAD-only field the incoming side never had. Non-overlapping addition, kept.

**Body (hunks 2, 3, 4) — took INCOMING.**

Both sides already carry the full `# What was built` implementation record, so the conflict is not about content. I verified this mechanically: stripping line-wrapping, emphasis markers, blockquote/list prefixes and table punctuation from both sides yields **2026 words on each side with zero differences** — the prose is word-for-word identical, including all three `vs. option 1/2/3` bullets.

The two sides differ only in markdown structure, and HEAD's copy is the degraded one — it has been through a lossy render round-trip that:
- flattened both markdown tables (`## Files`, `## AC status`) into loose one-cell-per-paragraph text, losing the `|` delimiters and the `|---|---|` separator rows entirely;
- dropped the `>` prefix from the continuation lines of the DOC-13 §2 blockquote, breaking the quote;
- unwrapped every paragraph and swapped `*emphasis*` for `_emphasis_`.

The incoming side is the developer-authored `free_coded` original with all of that structure intact, so it is the superset under 2e and it is what the resolved file uses.

No content was invented, and no `intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

Confirmed by diffing the resolved file against the incoming blob `ce69fd1a5de289f190de46c4bc252c01f00a6920` directly. The only differences are the four frontmatter facts deliberately kept from HEAD:

```
-updated_at: '2026-08-28T16:40:51.842861+00:00'
+updated_at: '2026-08-31T05:05:09.416379+00:00'
-last_field_updated: story_points
-status: free_coded
+last_field_updated: status
+status: bundled
+  bundled_in: bundle-8eef3846
```

Every one of the commit's 156 inserted body lines is present byte-for-byte as authored — the `# What was built` record in full, including the `## Files` table (9 rows) and the `## AC status` table (6 rows), both verified present with their pipe delimiters at lines 201–211 and 250–257 of the resolved file.

Nothing was discarded. No BUG-1301 precedence exception was invoked; no test files were involved.
