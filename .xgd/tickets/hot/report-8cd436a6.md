---
uid: report-8cd436a6
id: REPORT-11364
type: report
title: 'Report: blocked_by_handoff for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T08:36:58.589439+00:00'
updated_at: '2026-11-08T08:36:58.589439+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: blocked_by_handoff
  subject_uid: report-d87c1fe2
  rule: code_frozen
  evidence: "# Reconciliation Review: Story Coverage\n\n**Result**: FAIL\n**Mode**:\
    \ commits\n**Surface**: \n**Anchor**: bundle-c0301347\n**Stories Reviewed**: 7\
    \ (story-7d255580, story-58b2cec4, story-a58a0974, story-4cabde9a, story-39c992d3,\
    \ story-d2bee21c, plus story-3cf3d57b as plan item 3's second target). story-7b1025b8\
    \ (STORY-146) was also checked because the last fix pass edited it.\n\n2 overrides\
    \ audited, 0 touched a trust boundary.\n\nThis is a re-review after fix pass report-e09677c5,\
    \ which answered review report-ccc38228. Two of that review's three findings are\
    \ now resolved. The third, misjudged override report-7519d965, is the same report\
    \ with the same diff, so the same mechanical verdict follows (see Mode Override\
    \ Audit). **The story coverage and evidence are now sufficient. The only reason\
    \ for this FAIL is the override audit.**\n\n## Behavior Inventory\n\n34 behaviours\
    \ across the 11 bundled commits. For each of the 7 source tickets I read these\
    \ intent sections: Acceptance, Implementation scope / As built, Amendments and\
    \ How it landed.\n\n## Coverage Map\n\n| # | Behavior | Coverage | Story | Notes\
    \ |\n|---|----------|----------|-------|-------|\n| 1 | Derived text part; every\
    \ href kept; anchor-equals-URL renders once | Covered | story-7d255580 | AC-2369,\
    \ AC-2281 |\n| 2 | Non-derivable body refused by both adapters before network\
    \ | Covered | story-7d255580 | AC-2370 |\n| 3 | Per-template from, MAIL_FROM fallback,\
    \ resolved once, record agrees, modal read-only, POST from ignored | Covered |\
    \ story-7d255580 | AC-2371, AC-2282 |\n| 4 | MAIL_FROM display name; invite seed\
    \ names invite@ | Covered | story-7d255580 | AC-2279, AC-2286 |\n| 5 | REQ-199's\
    \ invite-sender pin retracted | Covered (fixed) | story-7b1025b8 | AC-2337 superseded\
    \ (superseded_by_uid bundle-c0301347); AC-2409 active with the template sender\
    \ |\n| 6 | Looking surface per business: own bucket, adoption, preview at own\
    \ origin, no new route | Covered | story-58b2cec4 | AC-2372 |\n| 7 | Missing browser\
    \ or bucket is ordinary | Covered | story-58b2cec4 | AC-2024 |\n| 8 | 40-look\
    \ budget counted at lease; reads free; refusal blocks only that operation | Covered\
    \ | story-58b2cec4 | AC-2373 |\n| 9 | Screenshots as image content blocks through\
    \ the Toolbox on both hosts | Covered | story-58b2cec4 | AC-2031 |\n| 10 | Priming\
    \ as config; start-up validation naming the entry | Covered | story-a58a0974 |\
    \ AC-2374 |\n| 11 | Null-provider entry drop with separator; 60k budget | Covered\
    \ | story-a58a0974 | AC-2375, AC-2109 |\n| 12 | Empty product tier (REQ-182 implementation\
    \ scope's 'omit' decision) | Covered | story-a58a0974 | AC-2107 |\n| 13 | Single\
    \ trailing cache boundary; landscape read once a session | Covered (fixed) | story-3cf3d57b\
    \ | AC-2376 active, 5 AC UATs pass |\n| 14 | No document ids or titles in priming\
    \ (BUG-65) | Covered (fixed) | story-3cf3d57b | AC-2377 active, 9 AC UATs pass\
    \ |\n| 15 | Image describer as a tool-less session; image block sent | Covered\
    \ | story-4cabde9a | AC-2097 |\n| 16 | Image and document describers registered\
    \ separately | Covered | story-4cabde9a | AC-2378 |\n| 17 | create_image to Library\
    \ material; credential optional; aiConfigured unaffected | Covered | story-39c992d3\
    \ | AC-2379, AC-2381, AC-2382 |\n| 18 | Vendor never named to the model | Covered\
    \ | story-39c992d3 | AC-2380 |\n| 19 | Material fields from first visible moment;\
    \ origin=generated; findable by prompt | Covered | story-39c992d3 | AC-2383 to\
    \ AC-2385 |\n| 20 | Cap of 10 attempts per session; refusal, shape, separate promote,\
    \ scoped store, secret scrub, deploy hook | Covered | story-39c992d3 | AC-2386\
    \ to AC-2392 |\n| 21 | Anchor vocabulary (17 names, 4 families, inferred axis)\
    \ | Covered | story-d2bee21c | AC-2393, matches REQ-209's table; the commit's\
    \ \"fifteen\" is recorded as prose drift |\n| 22 | measure_drawing, relate, solve,\
    \ assert, browserless refusal, authoring rules, read-effect group | Covered |\
    \ story-d2bee21c | AC-2394 to AC-2408 |\n\n## Ungrounded Stories\n\nNone found.\
    \ Every story has a `## Reconciliation Decisions` section recording the intent-silent\
    \ behaviours it formalizes: the relation syntax and 0.05 tolerance, solve's movable\
    \ kinds, the deploy-hook outcomes, rights/republishable, attach scope, and the\
    \ entity table. None contradicts the intent.\n\n## Plan Item Accounting\n\n| Plan\
    \ Item | Expected Story | Status |\n|-----------|---------------|--------|\n|\
    \ 1. Outgoing Mail | story-7d255580 | ✓ AC-2369, 2370 and 2371 added; 2279, 2281,\
    \ 2282 and 2286 modified |\n| 2. Looking surface | story-58b2cec4 | ✓ AC-2372\
    \ and 2373 added; 2024 and 2031 modified |\n| 3. Session priming | story-a58a0974\
    \ + story-3cf3d57b | ✓ AC-2374 and 2375 on STORY-103; AC-2376 and 2377 on STORY-149,\
    \ now active; 2107 and 2109 modified |\n| 4. Material description | story-4cabde9a\
    \ | ✓ AC-2378 added; 2097 modified |\n| 5. Generated pictures | story-39c992d3\
    \ | ✓ AC-2379 to AC-2392 |\n| 6. Drawing geometry | story-d2bee21c | ✓ AC-2393\
    \ to AC-2408 |\n\n## Supersession Check (Step 4c)\n\nPASS. AC-2337 (STORY-146)\
    \ is now `status: superseded` with `superseded_by_uid: bundle-c0301347`. Its replacement,\
    \ AC-2409, is active and restates every clause that was not retracted, with From\
    \ as the invite template's resolved sender. Its UATs are `tests/test_reconciliation_contacts_add_invite.workers.test.ts:698`,\
    \ which asserts draft.from and every sent message's from equal `SEED_TEMPLATES.invite.from`\
    \ and that a spoofed `from` on the request is ignored, and `tests/test_reconciliation_contacts_add_invite_tab.test.ts:257`.\
    \ I found no other active AC that pins retracted behaviour. REQ-171's \"the purpose\
    \ names the documents\" claim was only ever an FC test, and BUG-65 deleted it.\n\
    \n## Evidence Sufficiency (Step 5b)\n\n- Latest scoped gate: REPORT report-60c312cb\
    \ at 6dadc10758, 224 passed, 0 failed, 0 skipped. Every active AC in the seven\
    \ reviewed stories that this bundle added or modified has passing AC-tagged UATs\
    \ there: AC-2369 to AC-2408, plus 2024, 2031, 2097, 2107, 2109, 2279, 2281, 2282\
    \ and 2286. The REQ-209 browser-backed ACs (AC-2395 to AC-2398) ran with 0 skipped,\
    \ so they are real-browser evidence, not skip-as-pass.\n- No internal mocking\
    \ in the new UAT files. The only `vi.fn` uses are provider `fetch` doubles at\
    \ the external Resend boundary, and the model doubles are scripted Anthropic clients.\n\
    - Two file reads are acceptable:\n  - AC-2279's UAT reads `wrangler.toml` because\
    \ the configured value is what the AC is about, and it also drives a real send\
    \ through `resendMailer`.\n  - AC-2374's source-prose scan sits beside runtime\
    \ assertions on what the model actually receives.\n- **AC-2409 has not been through\
    \ a gate.** Its story is outside this run's scoped filter, so neither AC-2409\
    \ UAT is in report-60c312cb.\n  - I ran the tab UAT directly and it passes (1\
    \ passed).\n  - I could not run the workers UAT, because the sandbox refuses local\
    \ port binding (`listen EPERM 127.0.0.1`).\n  - By inspection it asserts the right\
    \ observables, and the same behaviour is gate-evidenced by the passing AC-2371\
    \ UAT.\n  - Not a failure. The next gate should include `test_UAT_AC2409_`.\n\
    - The superseded AC-2337 UAT at `tests/test_reconciliation_contacts_add_invite.workers.test.ts:646`\
    \ still asserts `from === FROM`, which now contradicts the seeded invite sender.\
    \ The fix pass left it in place deliberately (supersession rule). It sits outside\
    \ the scoped filter, but a full-suite run will see it fail until its superseded\
    \ tests are retired.\n\n## Mode Override Audit\n\n2 overrides audited, 0 touched\
    \ a trust boundary.\n\n- **report-483291fe** (code_frozen, `apps/control-app/src/imagegen.ts`,\
    \ story-39c992d3, rung 1): PASS on all items.\n  - Item 1: only the named file\
    \ was touched (`unnamed_files_touched` empty).\n  - Item 2: the gate is green.\n\
    \  - Item 3: `vendorless()` (imagegen.ts:294, applied at :404) implements REQ-208's\
    \ \"no error sentence names a vendor\" and serves AC-2380, which passes.\n  -\
    \ Item 4: it keeps the declared shape sentence and ratio list, as the planner\
    \ required.\n  - Item 5: no trust boundary.\n  - Item 6: confined to the named\
    \ file, and adds only what AC-2380 demands.\n- **report-7519d965** (code_frozen,\
    \ `apps/control-app/src/ai.ts`, story-4cabde9a, rung 2): **MISJUDGED**, items\
    \ 4 and 6. This is the same verdict as report-ccc38228, because the report and\
    \ its diff are unchanged.\n  - The production fix itself is correct and in scope:\
    \ ai.ts:195 passes `lib.ClaudeAPIBackend.capabilities`, matching the tip evidence,\
    \ and AC-2097 and AC-2378 pass.\n  - The planner's stated scope was \"No test\
    \ or AC changes\", but the recorded diff also edits `tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts`,\
    \ loosening the router error-scrub assertion, and `tests/support/scripted-model-client.ts`.\
    \ No AC in scope demands the REQ-146 edit, and the in-loop conformance verdict\
    \ was already `fail`.\n  - What is left at HEAD:\n    - The REQ-146 edit is reverted:\
    \ that file has no diff against main.\n    - The `systemText()` helper (scripted-model-client.ts:80)\
    \ is **legitimately needed** and should NOT be removed. The bundle's own reference\
    \ commit 59e2b440 has `tests/test_UAT_FC_REQ-208_the_assistant_can_make_pictures.workers.test.ts:22`\
    \ importing `systemText` from that support file, but the support file at 83d43791\
    \ never exported it. FC REQ-206, FC REQ-207 and the AC-2380/2385 image-generation\
    \ UAT file import it too.\n  - The denial of code_frozen for batch 0 of story-4cabde9a\
    \ is already recorded (report-40bf3ba2). **No further code, test or matrix remediation\
    \ is available or needed.** If the fix loop cannot clear a historical misjudgment,\
    \ it needs an operator waiver rather than another builder pass.\n\n## Judgment\
    \ Calls\n\n- These internal details have no AC, which is acceptable: the guarded\
    \ capture factory without an origin resolver (REQ-206), captures marked third-party,\
    \ the `@anthropic-ai/sdk` removal, the grant derived from the plugin declaration,\
    \ and the entity-decoding table.\n- AC-2025 (\"with a browser binding is offered\
    \ the looking surface\") reads alongside the amended AC-2024 (both browser and\
    \ bucket are required). They are consistent, and not a gap.\n- The scoped filter's\
    \ FC patterns `test_UAT_FC_REQ_205`, `_206`, `_208`, `_182` and `_BUG_65` match\
    \ nothing, because those suites use hyphens. The previous review raised this;\
    \ it is still true. Only FC_REQ_207 (8) and FC_REQ_209 (35) ran. The AC-tagged\
    \ UATs now carry the evidence, so this is not a failure, but the filter is misleading.\n\
    - REQ-182's deferred items (one Role per site, `session.summary`, `LEGACY_ROLE_NAMES`)\
    \ are correctly absent from the stories, as the intent's implementation scope\
    \ declares them out of scope.\n\n## Verdict\n\nFAIL, on the override audit only.\
    \ Stories now faithfully and completely document the bundle. The AC-2337 supersession\
    \ and the AC-2376/AC-2377 evidence gaps from report-ccc38228 are resolved, every\
    \ plan item produced output, and every in-scope active AC has passing, non-mocked\
    \ UAT evidence in report-60c312cb.\n\nRemaining items:\n1. Override report-7519d965\
    \ is still misjudged (items 4 and 6, out-of-scope test edits in its recorded diff).\
    \ Its consequence is already applied, and nothing is left to fix in code, tests\
    \ or matrix. Do not remove `systemText()` from tests/support/scripted-model-client.ts;\
    \ the bundle's own FC suites import it.\n2. Advisory: add `test_UAT_AC2409_` to\
    \ the next gate. Its workers UAT has not run in any gate, and this sandbox cannot\
    \ run it."
  proposed_change: Apply the production-code remediation items in the review that
    need a `code_frozen` grant or an operator ruling, and add the UAT each one requires
    (see evidence).
  batch_index: -1
  parent_report_uid: ''
  anchor_ticket: bundle-c0301347
---

# Review gaps blocked by `code_frozen`

**Evidence**: # Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: 
**Anchor**: bundle-c0301347
**Stories Reviewed**: 7 (story-7d255580, story-58b2cec4, story-a58a0974, story-4cabde9a, story-39c992d3, story-d2bee21c, plus story-3cf3d57b as plan item 3's second target). story-7b1025b8 (STORY-146) was also checked because the last fix pass edited it.

2 overrides audited, 0 touched a trust boundary.

This is a re-review after fix pass report-e09677c5, which answered review report-ccc38228. Two of that review's three findings are now resolved. The third, misjudged override report-7519d965, is the same report with the same diff, so the same mechanical verdict follows (see Mode Override Audit). **The story coverage and evidence are now sufficient. The only reason for this FAIL is the override audit.**

## Behavior Inventory

34 behaviours across the 11 bundled commits. For each of the 7 source tickets I read these intent sections: Acceptance, Implementation scope / As built, Amendments and How it landed.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Derived text part; every href kept; anchor-equals-URL renders once | Covered | story-7d255580 | AC-2369, AC-2281 |
| 2 | Non-derivable body refused by both adapters before network | Covered | story-7d255580 | AC-2370 |
| 3 | Per-template from, MAIL_FROM fallback, resolved once, record agrees, modal read-only, POST from ignored | Covered | story-7d255580 | AC-2371, AC-2282 |
| 4 | MAIL_FROM display name; invite seed names invite@ | Covered | story-7d255580 | AC-2279, AC-2286 |
| 5 | REQ-199's invite-sender pin retracted | Covered (fixed) | story-7b1025b8 | AC-2337 superseded (superseded_by_uid bundle-c0301347); AC-2409 active with the template sender |
| 6 | Looking surface per business: own bucket, adoption, preview at own origin, no new route | Covered | story-58b2cec4 | AC-2372 |
| 7 | Missing browser or bucket is ordinary | Covered | story-58b2cec4 | AC-2024 |
| 8 | 40-look budget counted at lease; reads free; refusal blocks only that operation | Covered | story-58b2cec4 | AC-2373 |
| 9 | Screenshots as image content blocks through the Toolbox on both hosts | Covered | story-58b2cec4 | AC-2031 |
| 10 | Priming as config; start-up validation naming the entry | Covered | story-a58a0974 | AC-2374 |
| 11 | Null-provider entry drop with separator; 60k budget | Covered | story-a58a0974 | AC-2375, AC-2109 |
| 12 | Empty product tier (REQ-182 implementation scope's 'omit' decision) | Covered | story-a58a0974 | AC-2107 |
| 13 | Single trailing cache boundary; landscape read once a session | Covered (fixed) | story-3cf3d57b | AC-2376 active, 5 AC UATs pass |
| 14 | No document ids or titles in priming (BUG-65) | Covered (fixed) | story-3cf3d57b | AC-2377 active, 9 AC UATs pass |
| 15 | Image describer as a tool-less session; image block sent | Covered | story-4cabde9a | AC-2097 |
| 16 | Image and document describers registered separately | Covered | story-4cabde9a | AC-2378 |
| 17 | create_image to Library material; credential optional; aiConfigured unaffected | Covered | story-39c992d3 | AC-2379, AC-2381, AC-2382 |
| 18 | Vendor never named to the model | Covered | story-39c992d3 | AC-2380 |
| 19 | Material fields from first visible moment; origin=generated; findable by prompt | Covered | story-39c992d3 | AC-2383 to AC-2385 |
| 20 | Cap of 10 attempts per session; refusal, shape, separate promote, scoped store, secret scrub, deploy hook | Covered | story-39c992d3 | AC-2386 to AC-2392 |
| 21 | Anchor vocabulary (17 names, 4 families, inferred axis) | Covered | story-d2bee21c | AC-2393, matches REQ-209's table; the commit's "fifteen" is recorded as prose drift |
| 22 | measure_drawing, relate, solve, assert, browserless refusal, authoring rules, read-effect group | Covered | story-d2bee21c | AC-2394 to AC-2408 |

## Ungrounded Stories

None found. Every story has a `## Reconciliation Decisions` section recording the intent-silent behaviours it formalizes: the relation syntax and 0.05 tolerance, solve's movable kinds, the deploy-hook outcomes, rights/republishable, attach scope, and the entity table. None contradicts the intent.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Outgoing Mail | story-7d255580 | ✓ AC-2369, 2370 and 2371 added; 2279, 2281, 2282 and 2286 modified |
| 2. Looking surface | story-58b2cec4 | ✓ AC-2372 and 2373 added; 2024 and 2031 modified |
| 3. Session priming | story-a58a0974 + story-3cf3d57b | ✓ AC-2374 and 2375 on STORY-103; AC-2376 and 2377 on STORY-149, now active; 2107 and 2109 modified |
| 4. Material description | story-4cabde9a | ✓ AC-2378 added; 2097 modified |
| 5. Generated pictures | story-39c992d3 | ✓ AC-2379 to AC-2392 |
| 6. Drawing geometry | story-d2bee21c | ✓ AC-2393 to AC-2408 |

## Supersession Check (Step 4c)

PASS. AC-2337 (STORY-146) is now `status: superseded` with `superseded_by_uid: bundle-c0301347`. Its replacement, AC-2409, is active and restates every clause that was not retracted, with From as the invite template's resolved sender. Its UATs are `tests/test_reconciliation_contacts_add_invite.workers.test.ts:698`, which asserts draft.from and every sent message's from equal `SEED_TEMPLATES.invite.from` and that a spoofed `from` on the request is ignored, and `tests/test_reconciliation_contacts_add_invite_tab.test.ts:257`. I found no other active AC that pins retracted behaviour. REQ-171's "the purpose names the documents" claim was only ever an FC test, and BUG-65 deleted it.

## Evidence Sufficiency (Step 5b)

- Latest scoped gate: REPORT report-60c312cb at 6dadc10758, 224 passed, 0 failed, 0 skipped. Every active AC in the seven reviewed stories that this bundle added or modified has passing AC-tagged UATs there: AC-2369 to AC-2408, plus 2024, 2031, 2097, 2107, 2109, 2279, 2281, 2282 and 2286. The REQ-209 browser-backed ACs (AC-2395 to AC-2398) ran with 0 skipped, so they are real-browser evidence, not skip-as-pass.
- No internal mocking in the new UAT files. The only `vi.fn` uses are provider `fetch` doubles at the external Resend boundary, and the model doubles are scripted Anthropic clients.
- Two file reads are acceptable:
  - AC-2279's UAT reads `wrangler.toml` because the configured value is what the AC is about, and it also drives a real send through `resendMailer`.
  - AC-2374's source-prose scan sits beside runtime assertions on what the model actually receives.
- **AC-2409 has not been through a gate.** Its story is outside this run's scoped filter, so neither AC-2409 UAT is in report-60c312cb.
  - I ran the tab UAT directly and it passes (1 passed).
  - I could not run the workers UAT, because the sandbox refuses local port binding (`listen EPERM 127.0.0.1`).
  - By inspection it asserts the right observables, and the same behaviour is gate-evidenced by the passing AC-2371 UAT.
  - Not a failure. The next gate should include `test_UAT_AC2409_`.
- The superseded AC-2337 UAT at `tests/test_reconciliation_contacts_add_invite.workers.test.ts:646` still asserts `from === FROM`, which now contradicts the seeded invite sender. The fix pass left it in place deliberately (supersession rule). It sits outside the scoped filter, but a full-suite run will see it fail until its superseded tests are retired.

## Mode Override Audit

2 overrides audited, 0 touched a trust boundary.

- **report-483291fe** (code_frozen, `apps/control-app/src/imagegen.ts`, story-39c992d3, rung 1): PASS on all items.
  - Item 1: only the named file was touched (`unnamed_files_touched` empty).
  - Item 2: the gate is green.
  - Item 3: `vendorless()` (imagegen.ts:294, applied at :404) implements REQ-208's "no error sentence names a vendor" and serves AC-2380, which passes.
  - Item 4: it keeps the declared shape sentence and ratio list, as the planner required.
  - Item 5: no trust boundary.
  - Item 6: confined to the named file, and adds only what AC-2380 demands.
- **report-7519d965** (code_frozen, `apps/control-app/src/ai.ts`, story-4cabde9a, rung 2): **MISJUDGED**, items 4 and 6. This is the same verdict as report-ccc38228, because the report and its diff are unchanged.
  - The production fix itself is correct and in scope: ai.ts:195 passes `lib.ClaudeAPIBackend.capabilities`, matching the tip evidence, and AC-2097 and AC-2378 pass.
  - The planner's stated scope was "No test or AC changes", but the recorded diff also edits `tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts`, loosening the router error-scrub assertion, and `tests/support/scripted-model-client.ts`. No AC in scope demands the REQ-146 edit, and the in-loop conformance verdict was already `fail`.
  - What is left at HEAD:
    - The REQ-146 edit is reverted: that file has no diff against main.
    - The `systemText()` helper (scripted-model-client.ts:80) is **legitimately needed** and should NOT be removed. The bundle's own reference commit 59e2b440 has `tests/test_UAT_FC_REQ-208_the_assistant_can_make_pictures.workers.test.ts:22` importing `systemText` from that support file, but the support file at 83d43791 never exported it. FC REQ-206, FC REQ-207 and the AC-2380/2385 image-generation UAT file import it too.
  - The denial of code_frozen for batch 0 of story-4cabde9a is already recorded (report-40bf3ba2). **No further code, test or matrix remediation is available or needed.** If the fix loop cannot clear a historical misjudgment, it needs an operator waiver rather than another builder pass.

## Judgment Calls

- These internal details have no AC, which is acceptable: the guarded capture factory without an origin resolver (REQ-206), captures marked third-party, the `@anthropic-ai/sdk` removal, the grant derived from the plugin declaration, and the entity-decoding table.
- AC-2025 ("with a browser binding is offered the looking surface") reads alongside the amended AC-2024 (both browser and bucket are required). They are consistent, and not a gap.
- The scoped filter's FC patterns `test_UAT_FC_REQ_205`, `_206`, `_208`, `_182` and `_BUG_65` match nothing, because those suites use hyphens. The previous review raised this; it is still true. Only FC_REQ_207 (8) and FC_REQ_209 (35) ran. The AC-tagged UATs now carry the evidence, so this is not a failure, but the filter is misleading.
- REQ-182's deferred items (one Role per site, `session.summary`, `LEGACY_ROLE_NAMES`) are correctly absent from the stories, as the intent's implementation scope declares them out of scope.

## Verdict

FAIL, on the override audit only. Stories now faithfully and completely document the bundle. The AC-2337 supersession and the AC-2376/AC-2377 evidence gaps from report-ccc38228 are resolved, every plan item produced output, and every in-scope active AC has passing, non-mocked UAT evidence in report-60c312cb.

Remaining items:
1. Override report-7519d965 is still misjudged (items 4 and 6, out-of-scope test edits in its recorded diff). Its consequence is already applied, and nothing is left to fix in code, tests or matrix. Do not remove `systemText()` from tests/support/scripted-model-client.ts; the bundle's own FC suites import it.
2. Advisory: add `test_UAT_AC2409_` to the next gate. Its workers UAT has not run in any gate, and this sandbox cannot run it.

**Proposed change**: Apply the production-code remediation items in the review that need a `code_frozen` grant or an operator ruling, and add the UAT each one requires (see evidence).
