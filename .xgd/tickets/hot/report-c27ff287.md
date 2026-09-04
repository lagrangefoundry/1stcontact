---
uid: report-c27ff287
id: REPORT-3341
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T20:08:48.763515+00:00'
updated_at: '2026-09-02T20:08:48.763515+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — class **AA** (both added), out-of-cone
  under sparse-checkout. Rule **2e** (intent/bookkeeping ticket), per-fact
  timeline resolution → **kept ours (HEAD)**; staged with `git add --sparse`.

  Incoming (`4677b816199d596f493093d78959d5e6c778d6a3`,
  `xgd(ticket): create bug bug-6612c4b7`, authored 2026-08-24 14:06:08 -0700)
  is the *creation* revision of BUG-37: `status: draft`,
  `last_field_updated: created_at`, body ending "## Not started — Diagnosis
  only. No branch cut, no code written."

  HEAD carries the same ticket at a strictly later working-timeline position.
  Its chain for this file, already replayed into this bundle:

  | commit | authored | subject |
  |---|---|---|
  | `501a0595d1` | 2026-08-31 07:24:25 | seed_local_overlay bug bug-6612c4b7 |
  | `28b2974007` | 2026-08-24 14:06:15 | update bug bug-6612c4b7 |
  | `a9021e4749` | 2026-08-24 14:06:30 | update bug bug-6612c4b7 |
  | `5a37f67dcd` | 2026-08-31 12:19:36 | update bug bug-6612c4b7 |

  `28b2974007` — authored 7 seconds *after* the incoming create and already
  applied — is the wholesale rewrite of this ticket from draft hypothesis to
  confirmed root cause. Every field the create sets is later re-set by that
  commit and its successors: `status` draft → bundled → `free_and_reconciled`,
  `updated_at`, `last_field_updated`, plus fields the create never had
  (`completed_at`, `commits`, `version: 0.2.13`, `bundled_in`,
  `chat_comment`). There is no field or section on the incoming side that HEAD
  leaves unaddressed, so no fact is genuinely contested — the incoming side is
  uniformly the earlier value of facts HEAD already advanced.

  No `fields.intent_uid` / `story_uid` / `capability_uid` was touched; no
  content was invented.

## Incoming changes preserved

The incoming commit is a ticket creation, not a code change — no
implementation, test, or config files are in its diff (`--stat`: 1 file,
144 insertions, this ticket only). Its substance is preserved in HEAD:

- **Identity/provenance facts** — `uid: bug-6612c4b7`, `id: BUG-37`,
  `created_by: xgd`, `created_at: '2026-08-24T21:06:08.727702+00:00'`,
  `severity: high`, `priority: high`, `needs_review: false`,
  `auto_merge_back: true` — all present byte-identical in the resolved file.
- **Narrative** — the create's diagnosis was superseded by the developer's own
  later commits in this same working timeline, and HEAD deliberately retains it
  rather than dropping it: the section "## Superseded — the original
  hypothesis, recorded because it was wrong" preserves and annotates each of
  the create's claims (dead `PREVIEWS` WeakMap, isolate-memory exhaustion,
  "Edit is the larger render", the 94 ms CPU inference), recording why
  measurement falsified them. The `## Relationship to BUG-36` section and the
  reproduction `curl` survive verbatim.

Nothing from the incoming side was discarded by this resolution: it was
superseded by already-applied commits authored by the same developer later in
the same timeline. This is the BUG-1109/BUG-1122 redundant-commit shape, so the
staged tree nets to no diff vs HEAD. Per STEP 4 no `--skip` was issued; the
finalize step will detect the clean staged diff. STEP 3's discard guard is
satisfied — the incoming commit's key changes are *present in HEAD*, not merely
absent. No BUG-1301 precedence drops were needed; no test functions were
touched.
