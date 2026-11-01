---
uid: report-7ccabc88
id: REPORT-7212
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T02:22:02.108702+00:00'
updated_at: '2026-11-01T02:22:02.108702+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: STORY-144
---

UATs generated for story STORY-144 (plan item 4 of 7)

Story: STORY-144
Test file(s) created:
  - `tests/reconciliation-library-capture-file.workers.test.ts`: AC-1723 (Workers pool, real D1/R2, called through `route()`)
  - `tests/reconciliation-library-capture-detail.test.ts`: AC-2085, AC-2086, AC-2087 (jsdom, mounted against the installed `library.js` and webui components)

Tests written: 4
Tests passed: 4
Tests failed: 0

| Test | What it checks |
|---|---|
| `test_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name` | A real capture is written and adopted. The screenshot and the JSON file can each be fetched by name, with their own bytes, type and inline filename. Asking for a file the capture doesn't hold gets a 400 naming both the file and the capture. An ordinary single file with no name given comes back as before. |
| `test_UAT_AC2085_the_preview_is_the_named_screenshot_member_with_no_reader_and_a_missing_screenshot_says_so` | The capture row is listed. The picture's address names the screenshot file, and its alt text is the capture's title. There is no reader window, even though the row's type is JSON. When the image fails to load, it is replaced by the "no longer in storage" message. |
| `test_UAT_AC2086_the_count_replaces_the_file_field_once_known_and_the_download_is_the_screenshot` | The count line is empty while the detail is still loading, then reads "5 files captured". A one-file capture reads "1 file captured"; a capture with no files known shows an empty line. The *File* row is gone and every other record row is still there. The download link points at the screenshot, is labelled with its name and saves under it. Ordinary material is unchanged. |
| `test_UAT_AC2087_description_links_open_in_a_new_context_without_opener_or_referrer_after_every_repaint` | Links in a capture's description and in an ordinary material's description open in a new tab with `noopener noreferrer`. That still holds after a saved correction, after a failed save is rolled back, and after an edit cancelled with Escape. |

Notes:
- **AC-1723 already had a test.** `test_UAT_AC1723_…` in `reconciliation-library-surface.workers.test.ts` covers the single-file half. I didn't edit that file, as the rules require, so the new test covers the capture half and the single file with no name given.
- **Single-file uploads now need an Anthropic key.** The upload route refuses with no `ANTHROPIC_API_KEY` set; that block comes from REQ-173 (plan item 7). So the single-file part of my AC-1723 test stores its material with the ticket store's own `create` and `attach` instead of uploading. The existing surface tests that still upload through the route will probably fail now; that's for plan item 7's ACs to deal with, not this story.
- **Lint wasn't run.** eslint isn't installed in this worktree, and fetching it from npm was blocked by the sandbox, so the downstream quality gate will be the first lint check on these files.
- No runtime code, existing tests or tickets were changed.

test_files_created:
  - "tests/reconciliation-library-capture-file.workers.test.ts"
  - "tests/reconciliation-library-capture-detail.test.ts"
