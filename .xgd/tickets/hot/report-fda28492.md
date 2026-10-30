---
uid: report-fda28492
id: REPORT-5355
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T19:40:15.290459+00:00'
updated_at: '2026-09-28T19:40:15.290459+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` (REQ-164) — **UU, intent/bookkeeping ticket (STEP 2e)**. Incoming `ac5bb44191` ("xgd(ticket): update request request-909e42f8", 2026-08-31 15:10:20 -0700). **Five** conflict regions: one frontmatter, four body. Resolved by the 2e non-overlapping-sections rule — **applied BOTH sides**, because the two sides edited genuinely different sections:

  - **Frontmatter → HEAD.** `status` (`bundled` over `free_coded`), `updated_at` (`2026-09-09T21:32:49` over `2026-08-31T22:10:20`), `last_field_updated` (`status` over `body`), and `fields.bundled_in: bundle-87be4669` (HEAD-only, incoming's diff deletes it). HEAD is later by nine days on the ticket clock and by commit timestamp (`3bb3a8c547` @ 2026-09-11 02:58 vs incoming @ 2026-08-31 15:10). `bundled` is downstream of `free_coded`; replaying incoming would roll the lifecycle backwards and orphan the ticket from its bundle.

  - **Body (4 regions) → INCOMING.** `git diff --word-diff --ignore-all-space` between the two sides proves the prose is **word-for-word identical**; every delta is a markdown emphasis marker, plus a code-fence language tag. Incoming is the authored form; HEAD's is a store-normalization byproduct.

  - Path is outside the sparse-checkout cone (DOC-986 §2/§4.1): resolved via `git checkout --theirs`, frontmatter facts re-applied by edit, staged with `git add --sparse`.

### Why the body goes to incoming rather than to the later side

The enrichment rule ("take the more recent commit by timestamp") would hand the whole file to HEAD. That is right for the lifecycle fields and wrong for the body, and BUG-1030 is exactly the failure it would cause — picking the later side wholesale discards a legitimate, disjoint edit on the other side. The operation narratives disambiguate:

- HEAD's commit is `seed_local_overlay` with `last_field_updated: status` — a **lifecycle/overlay** operation. Its body text is not authored content; it is what xgd's markdown round-trip re-emitted in passing.
- Incoming's commit declares `last_field_updated: body` — the body **is** its stated operation.

The round-trip damage in HEAD's rendition is visible and objective:

| | HEAD (normalized) | Incoming (authored) |
|---|---|---|
| emphasis | `_**_also_**_` — renders as literal punctuation | `**also**` |
| bold span | `` `kb status`** shells out to the ticket store.** `` — opener misplaced | `` **`kb status` shells out to the ticket store.** `` |
| code fence | ```` ``` ```` — no language | ```` ```js ```` |
| italics | `_starting_`, `_is_`, `_not_`, `_command_` | `*starting*`, `*is*`, `*not*`, `*command*` |
| inline code emphasis | `` `doc_kind: system_kb` `` | `` **`doc_kind: system_kb`** `` |

Two of those (`_**_also_**_`, the misplaced bold opener) are broken markdown that renders wrong. Taking HEAD's body would have discarded the developer's authored formatting *and* kept the damaged forms.

## Incoming changes preserved

No code files were in conflict — the sole conflicted path is a ticket, so STEP 3's code-file verification does not apply. Incoming's content was nonetheless verified present after resolution:

- ```` ```js ```` fence tag — line 78 ✓
- `**also**` — line 49 ✓
- `` **`kb status` shells out to the ticket store.** `` — line 173 ✓
- Full body prose — confirmed identical to incoming's blob by word-diff.

Nothing from incoming's diff was dropped except the frontmatter facts HEAD had already superseded (`status`/`updated_at`/`last_field_updated`) and its deletion of `bundled_in`, which is a HEAD-side fact incoming simply predates.

No BUG-1301 precedence exception was invoked; no test function on either side was deleted.

## Verification

- `grep -c "<<<<<<<"` → 0; `grep -c ">>>>>>>"` → 0.
- `git status --porcelain` → `M  .xgd/tickets/hot/request-909e42f8.md` — staged, no conflict class.
- `git diff --cached HEAD` hunk header opens at line 33, **past the frontmatter** — confirming `updated_at`, `status`, `last_field_updated` and `bundled_in` are byte-identical to HEAD and only the body changed.
- Index copy (`git show :0:`) re-read: valid YAML frontmatter, `status: bundled`, `bundled_in: bundle-87be4669` intact.
- `CHERRY_PICK_HEAD` re-read after staging, still `ac5bb441913dfa243838e54519873c8cfe4a5ebc`. No `--continue` / `--skip` / `--quit` / `--abort` was run.

Unlike the two preceding attempts in this queue, this resolution carries a **real net staged change** against HEAD (the body-formatting restoration), so the finalize step should produce an actual commit rather than detecting a clean diff.
