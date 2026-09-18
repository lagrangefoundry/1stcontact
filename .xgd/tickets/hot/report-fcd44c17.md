---
uid: report-fcd44c17
id: REPORT-4287
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T04:36:04.258215+00:00'
updated_at: '2026-09-18T04:36:04.258215+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` (REQ-143, intent/bookkeeping ticket) — class **AA** (both added), outside the sparse-checkout cone. Rules applied: **2b** (both added) + **2e** (intent/bookkeeping ticket, per-fact judgment), consistent with the auto-enrichment rule for this file ("take the more recent commit by timestamp").

  Both sides added the same ticket. The 268-line markdown body is **byte-identical** on both sides — the add/add framing made it look like a whole-file insertion, but the only real divergence is in the YAML frontmatter, in two hunks:

  1. **Lifecycle scalars** (`updated_at` / `completed_at` / `status`) — same fields, different values, so a genuine per-fact conflict. HEAD side: `status: free_and_reconciled`, `updated_at`/`completed_at` `2026-08-31T14:22:42`, last written by `ecd40fbcbd` (2026-08-31 07:22:42 -0700). Incoming side: `status: ready_to_reconcile`, `completed_at: null`, `updated_at` `2026-08-17T20:06:08`, from `fb1d4d621e` (2026-08-23 12:41:55 -0700). **HEAD is the later-positioned commit by 8 days**, so HEAD wins this fact. Taking incoming would have demoted operator-owned lifecycle state from `free_and_reconciled` back to `ready_to_reconcile`.

  2. **`fields.commits`** — HEAD is a strict information superset, so 2e's superset rule applies. HEAD holds one entry (`working_sha: 96118c32`) whose `working_sha_history` is `[b71a8641, 7ebc721b, 761b7fbd]`, plus `bundled_in: bundle-b3b7c399`. Incoming holds the earlier, un-consolidated representation: the same primary entry with history `[b71a8641, 761b7fbd]` *plus* `7ebc721b` still standing as its own second entry with an empty history, and no `bundled_in` field. Every sha named on the incoming side is present on the HEAD side — `7ebc721b` is not dropped, it has been folded into `working_sha_history` — and HEAD additionally carries `bundled_in`, which the incoming side never had.

  No field was invented and none was taken from outside the two sides.

## Incoming changes preserved

Verified with `git diff fb1d4d621e:<path> :<path>` (incoming blob vs. staged resolution). The diff is confined to the six frontmatter lines described above; the whole ticket body — sections 1–14, the acceptance criteria, and the Origin note — appears verbatim in the resolved file. No developer-authored content was discarded.

No hunk was dropped under the BUG-1301 precedence exception; it did not arise here. No code, test or UAT files were part of this conflict.

## Net effect

The staged tree is identical to HEAD (`git status --porcelain` is empty, `git diff --cached HEAD` is empty) — this commit's effect on this ticket was already carried into HEAD in a later, refined form by `ecd40fbcbd`. Per STEP 4 this is staged and exited `@done`; `--skip` was **not** called, and the cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `fb1d4d621e`) is left intact for `cherry_pick_finalize_resolution`. STEP 3's discard check is satisfied independently: the incoming commit's content is present in HEAD, not merely absent.
