---
uid: comment-61cbea1c
id: COMMENT-2698
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-11T03:11:18.852507+00:00'
updated_at: '2026-09-11T03:11:18.852507+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-fb30eaf3
  kind: note
---

Done. Both violations and both warnings from `report-f08cca9a` are repaired in one coherent pass — **5 mutations**, matrix-only, no code or test edits.

**Findings 1 + 2 (violations) — retired palette vocabulary.** REQ-137 deleted the stored `steps`/family shape (`packages/site-schema/src/l1/palette.ts:78-85`: an entry is `{ value: <opaque hex> }`, `.strict()`, and the light↔dark family is generated from `L1PaletteRef.shade`). Three matrix elements still described that shape:
- STORY-107 Settings ¶ → "a colour palette **and its named entries**"; "an **entry** left unnamed is not silently deleted". Merge rule untouched.
- CAP-94 body → "palette **entries**".
- Per finding 5, the deep-merge justification now rides on the theme's typography instead of the palette — which is what the UAT at `:137` already demonstrates, and avoids reading as advice to edit colours by blind merge now that STORY-113 owns a guarded palette surface.

**Finding 3 (warning) — same drift in AC bodies.** AC-1095 and AC-1097 rewritten to entry vocabulary. Worth noting: the tests were already correct for REQ-137, so the ACs were behind their own UATs — AC-1097's "palette family whose steps are not the declared form" is now the two refusals the test at `:185` actually makes.

**Finding 4 (warning) — the ownership call.** I resolved it toward CAP-94 rather than leaving it to resurface a third time. The evidence is in REQ-130's own body (`:146-153`): it declares the modal's contract "Untouched", then asks for "Additionally proven rather than assumed: copy inside a component the assistant instantiated is addressable and editable in the modal." The originating intent asks for the proof, and the UAT sits in this capability's test file under a REQ-130 describe block. So the Components ¶ now carries the guarantee, **AC-1650** states it, and a new Technical Context bullet records the reasoning and explicitly disclaims the modal's own contract — so the next story-level check sees it decided.

Two things for the assessor, both in REPORT-3888 (`report-fb30eaf3`):
- The **ac** level should be re-run for CAP-94 as finding 3 asked; its last check (`report-10ed4fd2`) passed with this drift in place, and it hasn't seen AC-1650.
- AC-1650 was created **without** `uat_coverage` on purpose — that field belongs to the coverage check, and it should bind to the already-passing `test_UAT_FC_REQ_130_copy_inside_the_component_is_addressable_and_editable` (`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:670`); no new test needs writing. I did not run that suite: it stands up a real builder over a socket, which this sandbox denies, and I changed no code or test for it to prove.
