---
uid: report-882c2b62
id: REPORT-4283
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T04:27:06.457358+00:00'
updated_at: '2026-09-18T04:27:06.457358+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` (REQ-149) — class **UU**, rule **2e (intent/bookkeeping ticket)**, sub-rule "one side is a strict superset of the other: keep the superset". Resolved to the **HEAD/ours** side on both hunks via `git checkout --ours` + `git add --sparse` (path is outside the sparse-checkout cone on this reconcile branch, DOC-986 §2/§4.1).

  The incoming commit being cherry-picked is `7782255e4ebcea00a8d9590dfe4c846e3067c175` ("xgd(ticket): update request request-554ac441", 2026-08-22 20:22 -0700). It touches exactly one file, and only that file's YAML frontmatter — no body/content change, no code.

  Per-fact comparison (HEAD side = 2026-08-31 bookkeeping, incoming = 2026-08-22 bookkeeping):

  | fact | incoming | HEAD (kept) |
  |---|---|---|
  | `status` | `free_coded` | `free_and_reconciled` |
  | `completed_at` | `null` | `2026-08-31T14:22:34.874054+00:00` |
  | `updated_at` | `2026-08-23T03:22:54Z` | `2026-08-31T14:22:34Z` |
  | `fields.version` | `0.2.7` | `0.2.9` |
  | `fields.commits` | 4 entries | 6 entries (superset of incoming's 4) |
  | `fields.bundled_in` | absent | `bundle-b3b7c399` |
  | `fields.chat_comment` | absent | `comment-98e86f10` |

  On every conflicted fact HEAD is the strictly later, strictly larger value; there is no field where the incoming side carries a fact HEAD lacks. No `working-timeline` tie-break was needed — this is not a competing-fact conflict but the same monotonic bookkeeping sequence observed at two points in time. No `intent_uid` / `story_uid` / `capability_uid` field was touched, and no content absent from both sides was introduced.

## Incoming changes preserved

No code or implementation file was in this conflict, so STEP 3's code-discard guard has no code target. For the one bookkeeping file, the incoming commit's changes are **present in HEAD via a later route**, not discarded:

- `commits` entries `932f362e4f60b8797557ba8f4cdd1fddeb1c9068` and `92fc26e7bcc2a941999ba0e55292cda6b092bd26` — the two entries the incoming commit appended — are both present in the resolved file, each additionally carrying the `working_sha_history: []` key HEAD later normalised onto them.
- `working_sha_history: []` added by the incoming commit to the `0e390334…` entry — present in the resolved file.
- `version: 0.2.1` → `0.2.7` — superseded in the resolved file by `0.2.9`, i.e. the incoming bump is on the path already travelled.
- `status: free_coding` → `free_coded` — superseded by `free_and_reconciled`, the later operator-owned status for this ticket; taking the incoming side would have reverted the ticket to mid-flight and dropped two commit entries plus `bundled_in` and `chat_comment`.

The BUG-1301 precedence exception was not invoked; no hunk was dropped as obsolete-refactor, and no test function on either side was deleted.

## Net effect

The staged tree is byte-identical to HEAD (`git status --porcelain` empty, `git ls-files -u` empty) — this cherry-pick is redundant, its bookkeeping having already been carried forward by the post-watermark sync. Per STEP 4 this is not a failure and `--skip` was **not** called; the sequencer state is untouched and `CHERRY_PICK_HEAD` (`7782255e4ebcea00a8d9590dfe4c846e3067c175`) is still present for `cherry_pick_finalize_resolution` to act on.
