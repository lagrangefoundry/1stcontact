---
uid: comment-a82b008c
id: COMMENT-8045
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T23:18:09.886400+00:00'
updated_at: '2026-11-08T23:18:09.886400+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d903aa54
  kind: note
---

I filed the iteration 11 fix plan as **REPORT-11612** (report-d903aa54). It has one batch, built around the one failing test, AC-2487 (41 of 42 tests pass). One `github.com:22` connection was blocked by the sandbox after the create. The report was still created locally, so this looks like a failed attempt to sync it.

**Why it fails:** two pieces of the stored-picture code are missing. The test is correct, so the plan keeps it as written.
1. **No ENVIRONMENT code when there is no image store.** `PictureEnvironmentError` in `tools/generate/src/cli/picture.ts` is never turned into the `ENVIRONMENT` code. The refusal text is right but the code is missing (`Error: screenshot failed. this deployment…`). The surface already declares `ENVIRONMENT` for "no image store" (`fidelity-surface.json:126`), and the class's own comment says that is what it means. The code just isn't attached.
2. **The CLI doesn't say it has no Library.** The not-found refusal uses the same sentence on every host. On the `1c` CLI, which only holds the site's own images (`host.ts:252`), it still tells the model to use "the name it appears under in the Library". It should say that this host has no Library pictures, only the site's own assets.

**The fix the plan asks for:**
- Find the existing place that gives the other two picture errors their codes (`PICTURE_INVALID` and `NOT_FOUND`), and map `PictureEnvironmentError` to `ENVIRONMENT` there.
- Let the image library report whether it holds a Library. `mergeImageLibraries` in `image-library.ts` already knows which parts it was given. The CLI then refuses with the "no Library" wording, and the Worker keeps its current wording, which AC2484's test pins.

**Who decides:** rung 1 of the resolution ladder. REQ-218 is in this bundle's scope and EPIC-1 accepted it. It says the local builder "answers for the site's own assets and says it holds no Library", and that a deployment without an image store says so "the same way a deployment with no browser says it cannot take pictures". The reference state doesn't decide the other way; it just never finished the wiring.

**Override:** I granted a `code_frozen` override on rung 1. The builder may edit three files: `picture.ts`, `image-library.ts` and `ai/fidelity-core.ts`. The batch must also keep 16 neighbouring picture and looking-surface ACs green, including AC2484, AC2028/AC2033 and AC2024/AC2025.

AC-2487 has not been in any earlier fix plan, so no hypothesis is being repeated. I flagged two weak-evidence issues, both in `tests/reconciliation-assistant-sees-a-stored-picture.test.ts`:
- The `original: true` check can't yet tell a resolver that ignores the flag from one that honours it.
- AC2026, AC2027 and AC2028 now have duplicate UATs across this file and the existing looking-surface tests.