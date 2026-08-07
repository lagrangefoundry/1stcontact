---
uid: comment-f963a479
id: COMMENT-751
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-07T04:51:13.629302+00:00'
updated_at: '2026-08-07T04:51:13.629302+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-65ca9439
  kind: note
---

All 9 new UATs pass and each one bites under mutation. Two pre-existing tests in the untouched file fail — they are the superseded versions of ACs this upgrade rewrote.

**Test file created**
- `tests/reconciliation-copy-edit-image-selection.test.ts` — 9 UATs, one per AC that plan item 2 adds or modifies.

| AC | Covered |
|---|---|
| AC-1024 | image region exposes `src` (enum, required, images only, deduped, stable order) + `alt`; same over the origin |
| AC-1025 | current handle always among its own options (off-disk `REMOTE`); alt-only save keeps the handle |
| AC-1026 | image save updates draft + re-renders; idempotent re-submit reports no change; `src`+`alt` = one diff; both channels current via origin |
| AC-1027 | asset store byte-identical (contents/size/mtime), no new file, node identical apart from `src` (`id`/`axes` survive) |
| AC-981 | container + module instance → empty list, exit 0; copy = 1 field, image = 2 |
| AC-986 | copy edit, image edit and `config set` all fail with identical code/message/path |
| AC-988 | unknown field, non-text value, and safe-but-absent enum choice all refused, field named, draft untouched |
| AC-991 | markup literal in copy *and* in image alt; every field is `string` or `enum`, every enum carries its list |
| AC-992 | origin reads match CLI (incl. option list); 4xx faults for words and image carry the validator's own code/path/hint; both renderings current |

**Verification**
- New file: **9 passed, 0 failed** (`npx vitest run`).
- Mutation check — reverted afterwards, `git diff` clean: dropping the current-handle rule, the enum-membership check and the image-kind narrowing failed AC-1024/1025/988/992; making an image expose nothing failed all 9. The tests are load-bearing, not constant-checking.
- No runtime code changed (`git status` shows only the new untracked test file).
- Typecheck: the new file produces only the two errors every sibling test file already has (`jsdom` types, `@1stcontact/site-schema` alias unresolved under `tsconfig.base.json` — resolved by vitest). No new class of error.
- Neighbouring suites still green: `req118-image-selection`, `req117-copy-editing`, `reconciliation-site-asset-listing`, `reconciliation-copy-edit-gesture` — 32 passed, 4 skipped (webui not installed).

**⚠️ Two pre-existing failures I did not fix, because fixing them requires editing an existing test file**

`tests/reconciliation-copy-edit-write-path.test.ts` fails on the cherry-picked code, and failed before I wrote anything:

- `test_UAT_AC981_a_region_with_nothing_editable_succeeds_with_an_empty_field_list` — asserts an **image** region returns `fields: []`. AC-981 as rewritten by this upgrade says the opposite ("an image region, which returns two").
- `test_UAT_AC991_markup_saved_as_copy_stays_literal_text_and_every_field_is_plain_string` — asserts every field's `type === 'string'`. AC-991 as rewritten allows `'string' | 'enum'`.

Both are the superseded versions of ACs whose bodies plan item 2 modified; both now have current, passing replacements under the same names in the new file. The fix is to **delete those two `it` blocks** from `reconciliation-copy-edit-write-path.test.ts` (and its now-unused `A_IMAGE` constant at line 48). I left the file untouched per the "no existing test modifications" constraint — flagging it here for the downstream fix-it/review step rather than silently leaving a red suite unexplained.

```
UATs generated for story story-37a3921b (plan item 2 of 2)

Story: story-37a3921b
Test file(s) created:
  - tests/reconciliation-copy-edit-image-selection.test.ts

Tests written: 9
Tests passed: 9
Tests failed: 0

test_files_created:
  - "tests/reconciliation-copy-edit-image-selection.test.ts"
```
