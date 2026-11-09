---
uid: comment-bba6b2e4
id: COMMENT-8149
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-11-09T20:27:36.886711+00:00'
updated_at: '2026-11-09T20:27:36.886711+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-8af7989d
  kind: note
---

I acted on all nine gaps from the failed reconciliation review of BUNDLE-43 and filed the completion report (REPORT-12015). None of the new or changed tests have been run: the instructions said not to, and the workflow runs the suite next. Lint didn't run either, because the sandbox blocks the npm registry, so eslint couldn't be downloaded.

**What changed, by gap:**
1. **STORY-94:** removed the false claim that other stories own the publish lock, progress stream, concurrency limit and rendition budget. A new decision records them as decided in REQ-222 but not built, which I confirmed in the code.
2. **AC-2528** is now active with a new test: a real laddered publish, where renditions under `assets/d/` are served immutable and the original picture, pages and a clean-URL page are not. The AC-909 test now also requests an original picture and a page with account chrome.
3. **AC-2538 and AC-2539** are now active with new builder tests: the file picker's accept list (names HEIC, no `image/*`), and the Library's refusal notice (shows the platform's own reason, clears on the next upload, not repeated for chat uploads).
4. **Publish tests renamed** to the right ACs (2523, 2524, 2526, 2527, including the cloud test). The AC-2523 test now includes a PNG, so it can tell "keeps its source format" apart from "always writes JPEG".
5. **AC-2533 reworded:** an image node refuses delivery keys, but an asset reference silently drops them, because REQ-222 leaves its schema unchanged. The test now asserts the drop unconditionally.
6. **AC-2537:** the check that read source code is replaced by a test that builds the converter from the binding name declared in the config, and confirms that no binding, or one under another name, gives no converter.
7. **AC-2542 and AC-2544 reworded:** a missing edits list, a recipe that isn't a list, and an entry that isn't an object are rejected as tool-parameter errors before `edit_image` runs, not with `REFUSED`. The test now asserts that difference both ways.
8. **AC-2551 reworded:** the orphan sweep isn't in this repository, so it can't be run. The AC now claims only that renditions sit outside the keyspace the sweep lists, which the existing test checks.
9. **AC-2515:** a new end-to-end test loads the draft preview page, resolves the form's `action` the way a browser would, posts to it, and checks that exactly one lead lands. It also checks that the edit channel's form can't submit.

I also reworded AC-2529: the renderer keeps the manifest's order rather than sorting, and the publish writes that order ascending. The other minor items (AC-2531, 2546, 2547, 2559) are not addressed; the review said they don't fail on their own.

**A bug I couldn't fix, because production code is frozen in this phase:** the contact form writes its configured `action` into the page unchanged. A form set to `/api/lead` therefore posts to the builder's own `/api/lead` from the draft preview, where nothing handles leads. On a published site it would post to the apex site's endpoint instead of its own. Only `api/lead` without the leading slash works in both places, and that's what the new AC-2515 test uses. I noted this on STORY-177 and in the report. Whether the renderer should rewrite form actions the way it rewrites image and link URLs is a decision for you or the planner.

**Risks for the next run:**
- The AC-2539 and AC-2515 tests depend on rendering details I checked only by reading the code, so they are the most likely to fail.
- `tests/test_UAT_FC_REQ-222_width_ladder.test.ts` is still on disk, and the later FC orphan gate will flag it.