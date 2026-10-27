---
uid: report-4f50681d
id: REPORT-6782
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-10-27T19:51:43.899845+00:00'
updated_at: '2026-10-27T19:51:43.899845+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-58b2cec4
---

I've written one UAT per acceptance criterion for story-58b2cec4 (14 in total). 9 pass. The 5 that fail are not test errors: each one fails because the landed code does something different from what the criterion says, so I left the assertions as the criteria state them.

```
UATs generated for story story-58b2cec4 (plan item 4 of 9)

Story: story-58b2cec4
Test file(s) created:
  - tests/reconciliation-assistant-looking-surface.test.ts                   (AC2022–AC2024, AC2026–AC2035 — node)
  - tests/reconciliation-assistant-looking-surface-worker.workers.test.ts    (AC2025 — workerd)

Tests written: 14
Tests passed: 9
Tests failed: 5
```

⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - **test_UAT_AC2025** (worker offers the looking surface): the Worker's chat host offers 31 tools and none of the six looking operations. This is the code issue the story already flagged: `workerHost` in `apps/control-app/src/ai.ts` never hands the host the looking surface's dependencies (`shot.ts` builds them, but nothing uses them). One more thing for the fix: the router gives no way to swap in a fake browser launcher. Once the surface is wired, the test's stub `BROWSER` binding cannot take a real picture, so the fix needs to add such a seam or this test needs a fake launcher.
  - **test_UAT_AC2028** (incomplete picture refused by field; unknown one not found): refusals do name the kind and field, but carry no error code. They read `"Error: screenshot failed. a picture of kind 'reference' needs 'bundle'…"`, with no `PICTURE_INVALID`. Similarly an unknown bundle never gets `NOT_FOUND`, and an unknown revision becomes a screenshot of the 404 page.
  - **test_UAT_AC2031** (image reaches the model in the same turn): through the real host, the `tool_result` the model receives is a string: the content blocks as JSON inside an `<<<untrusted>>>` wrapper. It is not an image block. The Toolbox's `run` turns the operation's return value into text. The existing FC test only passed because it called the operations directly, without going through the Toolbox.
  - **test_UAT_AC2033** (picture over the byte ceiling refused): the message gives both byte counts and says to use a narrower viewport or compare, but has no `PICTURE_INVALID` code.
  - **test_UAT_AC2034** (operator stream drops the image bytes): same root cause as AC2031. The streamed tool output is a string, so the image-stripping step (`withoutImageData`) never finds an image to remove. The full base64 PNG goes out on the operator's stream.

Two notes on how the tests run:
- **Fakes:** only the browser and the model are faked. Every test drives the Worker's own `fidelityDeps` (from `shot.ts`), the real preview renderer and the real Toolbox, with the existing fake puppeteer returning real PNGs. The turn-based tests go through the host's own `openSession` / `streamPrompt`, with the live session store kept in memory. That keeps them clear of the separate Node host bug where `logDir` is refused.
- **Not done:** I couldn't run eslint, because it isn't installed locally and the sandbox blocks the npm registry. I also copied the gitignored `apps/control-app/src/generated/` folder in from the main checkout so the workers suite could run. It won't be committed. No runtime code or existing tests were modified.

test_files_created:
  - "tests/reconciliation-assistant-looking-surface.test.ts"
  - "tests/reconciliation-assistant-looking-surface-worker.workers.test.ts"
