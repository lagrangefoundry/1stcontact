---
uid: report-d6ce7af8
id: REPORT-4560
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T22:58:06.950672+00:00'
updated_at: '2026-09-20T22:58:06.950672+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **UU**, intent/bookkeeping ticket
  (§2e). Resolved per-fact in favour of HEAD on all four conflict
  regions. Staged with `git add --sparse` (path is outside the
  resync branch's sparse-checkout cone, DOC-986 §2/§4.1 — 11% of
  tracked files present, so the conflict lived in the index only).

  Incoming is `fe97d3bc34` (2026-08-24T21:06:15), whose entire
  payload is: the `title` rename `503s` → `dies`, the transient
  `fields.title` audit entry that rename produced,
  `last_field_updated: title`, a bumped `updated_at`, and a
  trailing-newline strip. Per-fact adjudication against HEAD:

  | fact | incoming | HEAD | taken |
  |---|---|---|---|
  | `title` | `…dies with Cloudflare 1102…` | identical | not in conflict |
  | `updated_at` | 2026-08-24T21:06:15 | 2026-08-31T19:19:36 | HEAD (later) |
  | `last_field_updated` | `title` | `status` | HEAD (later) |
  | `status` | `draft` | `free_and_reconciled` | HEAD (later) |
  | `fields.title` | present | absent | HEAD (see below) |
  | body | `## Not started — diagnosis only` | confirmed root cause + fix writeup | HEAD (later) |

  `xgd ticket history bug-6612c4b7` shows the HEAD-side lineage
  opens at `501a0595d1` (`seed_local_overlay`, `updated_at`
  2026-08-26T17:36:27, `status: bundled`) — two days *after* the
  incoming commit — and the seed already carries the renamed title
  and the full fix writeup. It advances through `28b2974007`,
  `a9021e4749`, `5a37f67dcd` (`bundled` → `free_and_reconciled`),
  `da99b79858`, `53a6dbb565`. Every fact incoming carries is
  superseded by a later-positioned intent in that chain.

  `fields.title` is dropped rather than combined: it is not an
  independent fact but the audit residue of the very rename
  recorded in `last_field_updated: title`. The seed and all five
  subsequent HEAD commits deliberately do not carry it, so
  re-adding it would resurrect stale bookkeeping the later lineage
  had already normalised away.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **preserved, no hunk
  dropped under BUG-1301 precedence.** The commit's only
  substantive intent is the title rename, and the staged result
  carries that string verbatim:
  `control-app: Edit mode dies with Cloudflare 1102 — the preview
  render cache never hits in the Worker` (the incoming
  `fields.title` value character-for-character; indentation
  differs only because incoming nested it under `fields:`).
  No developer code was discarded — this commit touches no code,
  no test, and no UAT function.

## Note for post-merge review

Per the conflict-intent enrichment, this file is flagged: intent
was unknown on one or both sides, and resolution fell back to the
timestamp/ledger-position rule. The staged tree differs from HEAD
by a single byte — a trailing newline my editor re-added that
HEAD lacks, and that incoming had likewise stripped. Two attempts
to restore byte-exactness (`git checkout --ours`, `git restore
--source=HEAD`) were refused by this session's permission mode.
The commit is therefore effectively empty; the finalize step's
clean-staged-diff detection may elect to skip it, which is the
correct outcome for a fully superseded replay.
