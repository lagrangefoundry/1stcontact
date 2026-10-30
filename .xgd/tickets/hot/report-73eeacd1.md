---
uid: report-73eeacd1
id: REPORT-5281
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T03:45:53.317274+00:00'
updated_at: '2026-09-28T03:45:53.317274+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket (BUG-39), sparse-excluded (`.xgd/tickets/**`, DOC-986 §2/§4.1) but materialized on disk. Rule applied: **§2e first clause — "non-overlapping fields/sections: apply BOTH"**, composed per section. Resolved by writing ours' frontmatter + incoming's body, then `git add --sparse`.

  Incoming commit `163924e9fd` (Aug 25 16:27 -0700) is large — 99 insertions / 43 deletions, five conflict hunks — but it is a **single-section edit**: its own metadata says `last_field_updated: body`, and its diff is the draft write-up being replaced by the as-landed write-up ("Fix — as landed", the suite table, "### The evidence for this ticket", "Watch for — resolved", "Out of scope", ✅-marked ACs, the `./bin/1c assets` note).

  The two sides are authoritative for **different sections**, so neither side's whole file is the answer:

  | section | incoming `163924e9fd` | ours (HEAD) | authoritative side | why |
  |---|---|---|---|---|
  | body | rewrote it (`last_field_updated: body`) | **did not touch it** (`last_field_updated: status`) | **incoming** | incoming is the side that actually authored the body; ours' own metadata says its last edit was to `status` |
  | `status` | `free_coding` | `bundled` | **ours** | later lifecycle state, Aug 31 vs Aug 25; `bundled` is strictly downstream of `free_coding` |
  | `updated_at` | Aug 25 23:27 | Aug 31 05:05 | **ours** | later |
  | `last_field_updated` | `body` | `status` | **ours** | the composed result's most recent *event* is ours' status change |
  | `fields` | `chat_comment` only | + `commits` / `version: 0.2.15` / `story_points: 3` / `bundled_in: bundle-8eef3846` | **ours** | strict superset; these fields only exist post-bundling |

  **Why the body went to incoming rather than to the later timestamp.** I first established that the two bodies carry the *same prose*: `git diff --word-diff` over the two blobs shows **zero** wording differences below the frontmatter. Every apparent body change is mechanical damage on ours' side, consistent with the known `seed_local_overlay` body reflow:

  - the markdown **table was destroyed** — pipes and the `|---|---|---|` separator row stripped, each cell demoted to its own paragraph, so `5 failing` / `8/8 pass` are no longer bound to `test_UAT_FC_REQ-122_chat_host` by anything but adjacency. That is lost *information*, not lost formatting.
  - the code fence lost its language tag (` ```ts ` → ` ``` `).
  - one bold span was corrupted: `in \`tests/support/scripted-model-client.ts\`**,` became `in **\`tests/support/scripted-model-client.ts\`,`.

  So there was only ever **one** authoring intent for this body (Aug 25 16:27), present on both sides in two renderings — one intact, one damaged in transit. §2e's later-`updated_at` tie-break exists for *competing intents*; it does not apply, and ours' Aug 31 timestamp records the bundling status change, not a re-authoring. Choosing the intact rendering loses no content in either direction and recovers the table.

## Incoming changes preserved

**Yes — in full, verbatim.** Verified mechanically rather than by eye:

- `git diff --no-index <incoming blob> <staged blob>` produces a diff confined entirely to the frontmatter — the four facts deliberately taken from ours (`updated_at`, `last_field_updated`, `status`, and ours' superset `fields` additions). **Below the closing `---` there is zero diff**: the staged body is byte-identical to `163924e9fd`'s.
- `git diff --cached HEAD` opens at `@@ -27,139 +27,143 @@`, i.e. frontmatter lines 1–26 are untouched from HEAD — ours' `status: bundled`, `version: 0.2.15` and `bundled_in` are preserved exactly, so this resolution does not regress the lifecycle state or strip the operator-set fields.

No hunk was dropped, and the BUG-1301 precedence exception was neither invoked nor needed. No code, test, or spec-ticket (`story-`/`acceptance_criterion-`/`capability-`) files were in conflict.

## Note for the finalize step

Unlike the previous two picks in this queue, this one is **not** empty: `git status --porcelain` shows `M  .xgd/tickets/hot/bug-23d1ec27.md` — a real staged body change relative to HEAD. `git ls-files -u` is empty and no conflict markers remain. `CHERRY_PICK_HEAD` is intact at `163924e9fdc98127c7b09fdddf88d7f695d0231f`; no `--continue`/`--skip`/`--quit`/`--abort` was run.
