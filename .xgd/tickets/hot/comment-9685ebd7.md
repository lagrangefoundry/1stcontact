---
uid: comment-9685ebd7
id: COMMENT-7992
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T10:39:11.590187+00:00'
updated_at: '2026-11-08T10:39:11.590187+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a564c80c
  kind: note
---

I filed the iteration-11 fix plan as **REPORT-11399 (`report-a564c80c`)**. The sandbox blocked the push to github.com, so the plan and the AC change are only in this worktree for now.

**No tests are failing.** The scoped quality run passed 244 tests with 0 failures (`report-ca8d211d`). This iteration only had to rule on the blocked `code_frozen` request in `report-ddb736df`, which I've granted.

**The defect:** the model can find out which company made a generated image. The image plugin writes `- Provider:` and `- Model:` lines into each picture's stored description. `generatedMaterialStore.create` (`apps/control-app/src/imagegen.ts:218-231`) saves that text unchanged, and `attach` adds it to the session's searchable knowledge (`:260`). So the model can search for the vendor's name, which breaks REQ-208's rule that it never learns which vendor drew an image.

**Spec change:** I widened AC-2380 (`acceptance_criterion-07b3ae73`) and recorded an erratum note in it. Until now it only checked the tool's manual entry, its parameters and tool results, which is why its test passed despite the leak. It now also covers:
- the stored description of a generated picture, and anything the session's knowledge search returns for it;
- the prompt staying in the description, word for word;
- `description_model` still naming the model, because the client is shown it in the Library.

**Batch 0 (the only batch):**
- **Order of work:** first extend `test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor` to match the widened AC, so it fails on the current code. Then remove exactly the plugin's provider and model lines in `generatedMaterialStore.create` before the description is stored. Leave the prompt untouched and don't change the plugin.
- **Override:** `code_frozen` lifted for `apps/control-app/src/imagegen.ts` only, which is the same scope as the earlier `report-483291fe` override. `trust_boundary` is false.
- **Who decided:** rung 1 of the ladder. REQ-208 is in scope, requires that no channel reveal the vendor, and says this product's store is where the plugin's record gets adapted.
- **Tests that must stay green:** the rest of the image-generation story, `test_UAT_AC2381_` through `test_UAT_AC2392_`, plus the `test_UAT_FC_REQ-208_` suite.

**Still outstanding:** review gap 3(f) needs scoped quality runs for `story-3cf3d57b` and `story-a58a0974` before the next review. That's a test run, not something this plan can fix.