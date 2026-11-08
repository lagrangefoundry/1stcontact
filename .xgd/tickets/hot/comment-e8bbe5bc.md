---
uid: comment-e8bbe5bc
id: COMMENT-7993
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T10:50:09.370495+00:00'
updated_at: '2026-11-08T10:50:09.370495+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4e5456e5
  kind: note
---

I filed the iteration-11 fix plan as **REPORT-11401** (`report-4e5456e5`). It turns down the request for a `code_frozen` exception, so the image-vendor leak stays in the code for now. It is recorded as a known gap and tracked as BUG-381. The sandbox blocked the push to github.com, so all of this is only in this worktree.

**Why the request was turned down.**
- **The exception itself:** the validator had already refused the exception for `imagegen.ts` in this batch, so it can't be requested again.
- **The other two rulings don't fit:** no criterion or test changed after the builder's report, so the block isn't superseded. Making the spec match the current code (`aligned_to_tip`) isn't allowed either, because REQ-208 says the code is the thing that's wrong.
- **The code on the reference branch:** at `reconcile-src-BUNDLE-40`, `generatedMaterialStore.create` (`imagegen.ts:354-375`) stores the plugin's description, `Provider:` and `Model:` lines included. `attach` (`:377-410`) then adds it to the assistant's searchable knowledge. Reconciliation doesn't change production code, so it stays as it is.

**Changes to tickets:**
- **AC-2380** now covers only what the image tool itself tells the model: its manual entry, its parameters, and its results and error messages. The earlier attempt had widened it to include the stored description, and I narrowed it back. Its scope note points to BUG-381.
- **STORY-172** has a Reconciliation Decision recording the leak as a known gap against REQ-208. Its "no contradictions found" line now names it.
- **BUG-381** (`bug-da5f9050`) holds the fix: strip only the plugin's provider and model lines in `generatedMaterialStore.create`, keep the prompt and `description_model`, and widen AC-2380 again. Its new test searches the assistant's knowledge after an image is generated.

**The batch:** a single batch that only reruns tests. It covers the AC-2380 test, AC-2381 to AC-2392, and the `test_UAT_FC_REQ-208_` suite. I expect it to need no edits, because the existing AC-2380 test already checks exactly the narrowed scope. If a test does fail, the only file the builder may edit is `tests/reconciliation-consultant-image-generation.workers.test.ts`.

**Other things to know:**
- I filed an earlier version of this same plan a few minutes before, as REPORT-11400 (`report-fc083d99`). It makes the same ruling but is missing the required body sections. REPORT-11401 is the complete one.
- The shipped product keeps exposing the vendor's name to the assistant until BUG-381 is done. Fixing it inside this bundle would need you to approve the `imagegen.ts` exception yourself.
- The validator appears to match denials by batch number alone. A denial recorded for `story-4cabde9a` batch 0 blocked this plan's batch 0, which may be worth reporting as an XGD bug.
- **Still outstanding:**
  - Review gap 3(f) needs test runs scoped to `story-3cf3d57b` and `story-a58a0974`.
  - The old override report-7519d965 is still recorded as a failure, and only an operator waiver clears it.