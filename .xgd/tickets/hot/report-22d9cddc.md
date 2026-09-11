---
uid: report-22d9cddc
id: REPORT-3546
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T22:33:32.467908+00:00'
updated_at: '2026-09-09T22:33:32.467908+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` (REQ-147) — class **AA** (both added; index stages 2 and 3, no base). Kind is `request`, so rule **2e** (intent/bookkeeping ticket) applies, resolved **per fact**, not by picking a whole-file winner. Path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so it was materialized with `git checkout --ours` and staged with `git add --sparse`.

### Per-fact resolution

`git diff <ours-blob> <theirs-blob>` produced exactly two hunks, both inside the YAML frontmatter. The entire markdown body — the request text, the six ACs, and the whole free-coded `## Implementation (free-coded, REQ-147)` section — is **byte-identical on both sides**. There is no body-level conflict at all.

| Fact | Ours (HEAD, commit `02c0d390`, 2026-08-31 07:22:44 -0700) | Theirs (incoming `7fb57728`, 2026-08-23 13:30:38 -0700) | Kept | Why |
|---|---|---|---|---|
| `status` | `free_and_reconciled` | `reconciling` | **ours** | Same field changed differently → genuine per-fact conflict → later-positioned intent wins. HEAD's commit is 8 days later, and `free_and_reconciled` is the forward state; taking theirs would rewind the ticket to `reconciling`. |
| `completed_at` | `2026-08-31T14:22:44.216414+00:00` | `null` | **ours** | Slaved to the `status` fact above; kept with it. |
| `updated_at` | `2026-08-31T14:22:44.216414+00:00` | `2026-08-20T12:51:32.113872+00:00` | **ours** | Same; it is the stamp of the winning `status` write. |
| `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* | **ours** | Non-overlapping — the incoming side never had this field. Keeping it loses nothing from theirs. |
| Body (request + ACs + free-coded Implementation) | identical | identical | both | No difference to resolve. |

Ours is a strict superset on every differing fact, so the resolution is the ours blob verbatim. No content was invented, and no `intent_uid` / `story_uid` / `capability_uid` field was touched.

The auto-enrichment flagged this file as "intent unknown on one or both sides — take the more recent commit by timestamp and flag for post-merge review." Both readings agree: by commit timestamp the HEAD side (2026-08-31) is the more recent. **Flagged for post-merge review** as the rule directs, though the review surface is small — the only facts in dispute are ticket bookkeeping, and the substantive content is identical on both sides.

## Incoming changes preserved

Confirmed. The incoming commit `7fb57728` adds this file whole (183 `+` lines, one file, no other paths in the commit — `git show --stat` shows `1 file changed, 182 insertions(+)`). Every one of those content lines is present in the resolved file: spot-checked `## Implementation (free-coded, REQ-147)`, `apps/control-app/src/access.ts`, `tests/support/access.ts`, `guardAccess`, `No local-development bypass`, and `### Superseded matrix behaviour (intent conflict, deliberate)` — all present.

The only incoming-side lines *not* in the resolution are the three superseded bookkeeping values (`status: reconciling`, `completed_at: null`, `updated_at: '2026-08-20…'`). Those are older values of facts HEAD advanced afterwards, not developer code.

**Staged diff vs HEAD is empty.** This is the redundant-commit case (BUG-1109 / BUG-1122), not a discard, and STEP 3's test is what separates them: the incoming commit's key changes are *present in HEAD*, having already landed there through a later route — HEAD's copy of the free-coded body is byte-identical to the incoming one. Per STEP 4, `--skip` was **not** called; the file is staged and the finalize step will detect the clean staged diff and skip the commit itself.

No UAT test file was involved, so neither rule 2f nor the BUG-1301 precedence exception is in play; no hunk was dropped under that exception.

## Git state

`CHERRY_PICK_HEAD` (`7fb577286f7919b819583a27f010f5e11167060d`) is intact. The only git writes issued were `git checkout --ours` and `git add --sparse` on this single path — no `--continue`, `--skip`, `--quit`, `--abort`, `reset`, or `checkout <branch>`. `git status --porcelain` shows no remaining conflict-class (UU/AA/DU/UD) lines; the residue is pre-existing untracked `.xgd/_changes/`, `comment-*.md`, and `report-*.md` files that were untracked before this step and were not touched.
