---
uid: comment-46a94fc0
id: COMMENT-922
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-12T16:15:18.961755+00:00'
updated_at: '2026-08-12T16:15:18.961755+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-65ca9439
  kind: note
---

All green, and the tree holds only the new untracked test file — no runtime code and no existing test touched.

**Scope note:** 22 of the story's 23 injected ACs already had UATs from prior reconcile runs. Only **AC-1111** (`acceptance_criterion-285dd8d6`) — the AC this run created — was uncovered. Writing UATs for the other 22 would have produced duplicates, violating "one test per AC, no extras," so this invocation added exactly one.

```
UATs generated for story story-37a3921b (plan item 1 of 2)

Story: story-37a3921b
Test file(s) created:
  - tests/reconciliation-copy-edit-field-format.test.ts

Tests written: 1
Tests passed: 1
Tests failed: 0

test_files_created:
  - "tests/reconciliation-copy-edit-field-format.test.ts"
```

`test_UAT_AC1111_an_image_fields_options_are_declared_as_images_without_narrowing_them` proves AC-1111's two opposing halves at real boundaries — `run(argv)` for the CLI, `startBuilder` over HTTP for the origin, and bytes on disk:

- **Attached by kind of field, not kind of region** — `format: 'image'` rides an image region's `src` and a painted panel's `backgroundImageUrl`; the alt text *on the same region* carries none (asserted via `Object.hasOwn`, so an explicit `undefined` wouldn't pass), and nor does a run of copy's words.
- **Narrows nothing** — both option lists are still exactly the site's images (no font, no stylesheet), each handle once despite `beta` being named by both the registry and the directory, in the same sorted order, stable across reads, and still including a current handle no file mirrors — on both an image region and a panel.
- **Membership still enforced against the list alone** — a well-formed, *safe* handle outside the options is still refused at the field on both region kinds with the draft byte-unchanged; an offered handle is still accepted.
- **Reaches every client** — the origin's `fields` are asserted `toEqual` the CLI's for all three region kinds, so the declaration travels with the field rather than being a CLI-side flourish.

Per Step 6, I confirmed the test is not vacuous rather than assuming it: removing `format: 'image'` from `packages/site-schema/src/l1/edit.ts` made it fail on exactly that assertion, and I restored the file with `git checkout --` (tree verified clean above). The full story set is 28/28 across all 4 files.

Two findings for the downstream loop, neither caused by this work:

- **13 pre-existing failures**, unrelated to this story, in `reconciliation-assistant-conversation.test.ts`, `test_UAT_FC_REQ-122_chat_host.test.ts`, and `test_UAT_FC_REQ-127_session_binding.test.ts`. I verified they reproduce identically on a pristine tree with my file removed.
- Those `test_UAT_FC_REQ-12x_*` files are **FC orphans** still on disk. The Phase-2 `check_fc_orphans` gate will loop the review prompt until they are renamed or deleted, and they currently fail — which may complicate closing that loop.

Also worth flagging: five ACs (981, 986, 988, 991, 992) carry two differently-named UATs each, split across the image-selection and write-path files. That predates this invocation and existing test files are off-limits here, but it breaks the 1:1 test↔AC mapping the matrix link depends on.
