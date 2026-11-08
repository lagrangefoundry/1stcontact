---
uid: comment-5703a0ac
id: COMMENT-7966
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T04:42:45.636590+00:00'
updated_at: '2026-11-08T04:42:45.636590+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4f50681d
  kind: note
---

I wrote 3 new UATs for story-58b2cec4 and all 3 pass inside workerd. Lint and the type check did not run, because eslint isn't installed locally and the sandbox blocked downloading it.

The story's other 15 ACs already had passing UATs in `tests/reconciliation-assistant-looking-surface.test.ts` and its `.workers.test.ts` sibling. I added tests only for the parts nothing covered yet: AC-2372, AC-2373, and AC-2024's new no-private-bucket case.

**What each test proves.** All three run through the Worker's own `route()` with real D1 and R2. Only the model and the browser are faked.

- **`test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route`**
  - A capture is stored only under business A's area of the private bucket: not in the published-site bucket, and not under business B.
  - Adoption creates a `reference` in A's records with the description and third-party rights. Adopting again returns the same reference without creating a second one.
  - A turn in A lists the capture. A turn in B neither lists it nor gets a picture of it.
  - A `draft` screenshot loads `https://app.test/preview/<slug>/draft/` and is answered by our own preview renderer with A's draft HTML. The model receives an image.
  - Eleven candidate looking paths, tried with GET and POST, get exactly the same answer as a path that is no route at all, and none of them starts a browser.
- **`test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working`**
  - In one real turn, 41 draft screenshots start the browser exactly 40 times and return 40 images.
  - The 41st returns a `BUDGET:` refusal that names the 40 looks, says not to retry, and lists what still works.
  - A later `set_l1` in the same turn still lands in the store, and `list_references` and a `reference` screenshot still work without starting a browser.
  - A launcher that throws still spends one per attempt.
  - Listing, describing, picturing and comparing references never start the browser.
- **`test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_opens_an_editing_assistant_with_no_eyes`**: with a browser but no private bucket, the session opens, `set_l1` is offered and lands, none of the six looking operations is offered, and the browser is never started.

**Two places where I tested less than the AC's Verification section asks:**
- **AC-2372: `capture_site` is not run through a live turn.** The fake browser cannot produce a real capture, so I wrote the bundle into A's store the way the capture command writes one. Adoption then ran through the shipped `sessionFidelity` code. The AC's case where adoption is unavailable is not covered.
- **AC-2024 (no private bucket): the session only opens with help from the test.** The chat's transcript store also needs the private bucket, and without it opening a session returns 500. I supplied that store through the router's existing `tickets` hook, so what the test isolates is the looking surface being left out. **This needs a decision:** in a real deployment without the private bucket, no chat session opens at all. That contradicts the AC's "still opens a session", so either the AC or the code should change.

Lint and the type check still need to run before the quality gate.

```
UATs generated for story story-58b2cec4 (plan item 2 of 6)

Story: story-58b2cec4
Test file(s) created:
  - tests/reconciliation-assistant-looking-surface-business.workers.test.ts

Tests written: 3
Tests passed: 3
Tests failed: 0

test_files_created:
  - "tests/reconciliation-assistant-looking-surface-business.workers.test.ts"
```