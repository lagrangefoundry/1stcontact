---
uid: report-ccc38228
id: REPORT-11349
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-08T07:59:40.648471+00:00'
updated_at: '2026-11-08T07:59:40.648471+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-c0301347
  anchor_uid: bundle-c0301347
  overrides_audited: 2
  trust_boundary_overrides: 0
  override_misjudged:
  - report_uid: report-7519d965
    rule: code_frozen
    batch_index: '0'
    reason: 'Items 4 and 6: the planner''s stated scope was one production change
      in apps/control-app/src/ai.ts with ''No test or AC changes'', and `files` names
      only ai.ts. The diff also edited tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts,
      loosening the router error-scrub assertion, and added a systemText() helper
      to tests/support/scripted-model-client.ts. Neither file is named and no AC in
      scope (AC-2097, AC-2378, FC_REQ-207, FC_REQ-173) demands the REQ-146 change.
      The in-loop conformance verdict was already ''fail''. The REQ-146 edit has since
      been reverted, but the helper is still at HEAD (scripted-model-client.ts:80,
      used by the AC2378 UAT).'
  gaps:
  - type: supersession
    ac: AC-2337
    story: story-7b1025b8 (STORY-146)
    authoring_intent: REQ-199 invite flow (story intent bundle-87be4669, last updated
      by bundle-4164b433)
    superseding_intent: bundle-c0301347 (REQ-205)
    detail: 'AC-2337 is still active and pins ''From is the deployment''s sending
      address ... every message goes out from the deployment''s sending address''.
      REQ-205 explicitly retracts this: ''Four assertions in REQ-199''s suites pinned
      the invite''s sender to MAIL_FROM ... They now pin the invite template''s own
      address.'' AC-2371 and AC-2286 now say the invite sends from ''1st Contact <invite@1stcontact.io>''.
      Set AC-2337 to status: superseded with superseded_by_uid: bundle-c0301347. Re-state
      its unretracted clauses (checkbox-gated Invite, read-only From display, template-prefilled
      Subject/Body, read-only To-List with hover, ''Send N'', one recipient per message,
      request `from` ignored) in a replacement AC under story-7b1025b8, with From
      being the invite template''s resolved address. Retarget test_UAT_AC2337_* (tests/test_reconciliation_contacts_add_invite.workers.test.ts:646,
      asserts at :667 and :694 against FROM=''no-reply@example.test''; tests/test_reconciliation_contacts_add_invite_tab.test.ts:214)
      to the replacement AC. As written, the :646 UAT contradicts the seeded invite
      sender (apps/control-app/src/templates.ts:442), and it was not in the scoped
      quality filter.'
  - type: evidence
    ac: AC-2376
    story: story-3cf3d57b
    plan_item: 3
    detail: AC-2376 (single cache boundary, last in each priming list; whole priming
      one cached prefix; landscape and manual assembled once per session; the marker
      renders nothing) is still 'pending' and has no test_UAT_AC2376_* UAT anywhere
      in tests/. The scoped quality run matched zero tests for it. The behaviour is
      exercised only by unlinked FC tests (tests/test_UAT_FC_REQ-182_priming_is_configuration.test.ts:299
      the_whole_priming_is_one_cached_prefix, :318 exactly_one_boundary_is_declared_and_it_is_last,
      :329 the_landscape_is_read_once_a_session_not_once_a_turn). Add AC-tagged UATs
      covering both declared orders (with and without a knowledge base) and the 'renders
      nothing' claim, then activate the AC.
  - type: evidence
    ac: AC-2377
    story: story-3cf3d57b
    plan_item: 3
    detail: 'AC-2377 (BUG-65: no authored priming, reminder or template text names
      a DOC-/REF- id or a corpus title; the purpose keeps the obligation, names subjects,
      points at the map and stays under 900 chars; the reminder points to the method
      without naming a document) is still ''pending'' and has no test_UAT_AC2377_*
      UAT. The scoped quality run matched zero tests for it. The only evidence is
      unlinked FC tests (tests/test_UAT_FC_BUG-65_priming_names_no_documents.test.ts:61,
      :77, :86, :108, :258). Add AC-tagged UATs covering both declared orders, every
      reminder entry and the 900-char bound, then activate the AC.'
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: 
**Anchor**: bundle-c0301347
**Stories Reviewed**: 7 (story-7d255580, story-58b2cec4, story-a58a0974, story-4cabde9a, story-39c992d3, story-d2bee21c, plus story-3cf3d57b as plan item 3's second target)

2 overrides audited, 0 touched a trust boundary.

## Behavior Inventory

34 behaviours identified across the 11 bundled commits (REQ-205: 7; REQ-206: 5; REQ-182 + BUG-65: 9; REQ-207: 3; REQ-208: 8; REQ-209: 8, overlapping). The intent sections read were Acceptance, Implementation scope, As built, Amendments and How it landed for each of the 7 tickets.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Derived text part; every href kept; anchor-equals-URL renders once | Covered | story-7d255580 | AC-2369, AC-2281 |
| 2 | Non-derivable body refused by both adapters before network | Covered | story-7d255580 | AC-2370 |
| 3 | Per-template from, MAIL_FROM fallback, resolved once, record agrees, modal read-only, POST from ignored | Covered | story-7d255580 | AC-2371, AC-2282; blank-from-means-fallback recorded as a Reconciliation Decision |
| 4 | MAIL_FROM display name; invite seed names invite@ | Covered | story-7d255580 | AC-2279, AC-2286 |
| 5 | REQ-199's invite-sender pin retracted | **Absorbed contradiction** | story-7b1025b8 | AC-2337 still active and pins the deployment-wide From (see gaps) |
| 6 | Looking surface per business: own bucket, adoption, preview at own origin, no new route | Covered | story-58b2cec4 | AC-2372 |
| 7 | Missing browser or bucket is ordinary | Covered | story-58b2cec4 | AC-2024 |
| 8 | 40-look budget at lease; reads free; one-op refusal | Covered | story-58b2cec4 | AC-2373 |
| 9 | Screenshots as image content blocks through the Toolbox on both hosts | Covered | story-58b2cec4 | AC-2031 |
| 10 | Priming as config; start-up validation naming the entry | Covered | story-a58a0974 | AC-2374 |
| 11 | Null-provider entry drop with separator; 60k budget; loud overflow | Covered | story-a58a0974 | AC-2375, AC-2109 |
| 12 | Empty product tier | Covered | story-a58a0974 | AC-2107 |
| 13 | Single trailing cache boundary | Partial (no evidence) | story-3cf3d57b | AC-2376 pending, no AC UAT |
| 14 | No document ids or titles in priming (BUG-65) | Partial (no evidence) | story-3cf3d57b | AC-2377 pending, no AC UAT |
| 15 | Image describer as a tool-less session; image block sent | Covered | story-4cabde9a | AC-2097 |
| 16 | Image and document describers registered separately | Covered | story-4cabde9a | AC-2378; the UAT shows distinct outcomes in both build orders |
| 17 | create_image to material in the Library, credential optional, aiConfigured unaffected | Covered | story-39c992d3 | AC-2379, AC-2381, AC-2382 |
| 18 | Vendor never named to the model | Covered | story-39c992d3 | AC-2380 |
| 19 | Material fields from first visible moment; origin=generated; findable by prompt | Covered | story-39c992d3 | AC-2383 to AC-2385 |
| 20 | Cap of 10 per session; refusal, shape, promote separate, scoped store, secret scrub, deploy hook | Covered | story-39c992d3 | AC-2386 to AC-2392 |
| 21 | Anchor vocabulary (17 names, 4 families, inferred axis) | Covered | story-d2bee21c | AC-2393; matches REQ-209's table |
| 22 | measure_drawing, relate, solve, assert, browserless refusal, authoring rules, read-effect group | Covered | story-d2bee21c | AC-2394 to AC-2408 |

## Ungrounded Stories

None found.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Outgoing Mail | story-7d255580 | ✓ (AC-2369, 2370, 2371 added; 2279, 2281, 2282, 2286 modified) |
| 2. Looking surface | story-58b2cec4 | ✓ (AC-2372, 2373 added; 2024, 2031 modified) |
| 3. Session priming | story-a58a0974 + story-3cf3d57b | ✓ produced, but AC-2376 and AC-2377 are pending with no UAT |
| 4. Material description | story-4cabde9a | ✓ (AC-2378 added; 2097 modified) |
| 5. Generated pictures | story-39c992d3 | ✓ (AC-2379 to AC-2392) |
| 6. Drawing geometry | story-d2bee21c | ✓ (AC-2393 to AC-2408) |

## Supersession Check (Step 4c)

FAIL. REQ-205's ticket body states unambiguously that it retracts REQ-199's invite-sender-is-MAIL_FROM pin. AC-2337 (story-7b1025b8 / STORY-146) is still active and says the invite modal's From and every sent message use the deployment's sending address. Its UAT at tests/test_reconciliation_contacts_add_invite.workers.test.ts:646 asserts draft.from and message.from equal FROM='no-reply@example.test'. The seeded invite now names '1st Contact <invite@1stcontact.io>' (templates.ts:442), so the matrix holds two contradictory active ACs (AC-2337 against AC-2371/AC-2286). AC2337 was not in this run's scoped test filter, so the gate never exercised the conflict. Fix: set AC-2337 to superseded (superseded_by_uid: bundle-c0301347), re-state its non-sender clauses in a replacement AC, and retarget the two UATs. AC-1692's supersession (by bundle-fd009b93) is already recorded correctly.

## Evidence Sufficiency (Step 5b)

- The new UAT files have no vi.mock/spyOn and no source-text reads: reconciliation-consultant-image-generation*, test_reconciliation_measure_drawing, reconciliation-material-description-session, reconciliation-assistant-looking-surface-business, test_reconciliation_outgoing_messages_text_part_and_sender, reconciliation-assistant-session-priming and reconciliation-assistant-priming-delivery*. Model and provider doubles sit at the external boundary.
- Every new or modified active AC has a passing AC-tagged UAT in REPORT-11348 (210 passed, 0 failed).
- **Gap:** AC-2376 and AC-2377 have no test_UAT_AC* UAT. They are plan item 3's cache-boundary and BUG-65 claims. Their FC tests exist and pass when run directly (REQ-182 and BUG-65 node FC suites, 20/20, run by this reviewer), but they are not AC evidence.

## Mode Override Audit

2 overrides audited, 0 touched a trust boundary.

- **report-483291fe** (code_frozen, imagegen.ts, story-39c992d3): PASS on all items. Only the named file was touched. The scrub (vendorless() wrapping create_image/edit_image) is what AC-2380 demands and keeps the declared shape sentence and ratio list as the planner required. Conformance verdict was pass. The AC-2380 and REQ-208 AC UATs pass in the scoped run.
- **report-7519d965** (code_frozen, ai.ts, story-4cabde9a): **MISJUDGED**, items 4 and 6. The production fix is correct and in scope: it passes lib.ClaudeAPIBackend.capabilities at ai.ts:195, so the AC2097/AC2378 image path works. But the planner declared 'No test or AC changes' and the diff also edited tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts (loosening the error-scrub assertion) and tests/support/scripted-model-client.ts (adding systemText). Neither file is named and no in-scope AC demands those edits. The REQ-146 edit has since been reverted, but the helper is still at HEAD. The in-loop conformance verdict was already 'fail'.

## Judgment Calls

- The internal details not given ACs are acceptable omissions: the entity-decoding table (recorded as a Reconciliation Decision), the @anthropic-ai/sdk removal, and the grant being derived from the plugin declaration.
- AC-2364 is pending but has passing UATs on both hosts; it is not a finding for this review.
- **Uneasy, not a failure:** the scoped quality filter lists FC suites with underscores (FC_REQ_205, FC_REQ_206, FC_REQ_208, FC_REQ_182, FC_BUG_65), but those suites name their tests with hyphens (test_UAT_FC_REQ-205_...). So 53 FC tests matched nothing and did not run in REPORT-11348; only FC_REQ_207 and FC_REQ_209, which use underscores, ran. I ran the REQ-182 and BUG-65 node suites directly (20/20 pass). I could not run the workers FC suites for REQ-205, REQ-206 and REQ-208, because the sandbox refuses local port binding (listen EPERM). Their pass status on this branch is unverified by this review.
- **Uneasy, not a failure:** test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed fails at HEAD ('unscrubbed error value: string'). The cause is the type annotation at router.ts:1144 (`error: string`), from commit fc7ae70124, which is already on main. The failure is pre-existing and not caused by this bundle, but it is the defect report-7519d965's out-of-scope test edit tried to paper over. It should be fixed in its own scope.

## Verdict

FAIL. The stories document the bundle's behaviour faithfully and every plan item produced output, but:
1. AC-2337 (story-7b1025b8) still actively pins the deployment-wide invite sender that REQ-205 explicitly retracts. Supersede it (superseded_by_uid: bundle-c0301347), re-state its other clauses, and retarget its UATs.
2. AC-2376 and AC-2377 (story-3cf3d57b, plan item 3) have no AC-tagged UAT and remain pending. Add test_UAT_AC2376_* and test_UAT_AC2377_* UATs (the FC_REQ-182 and FC_BUG-65 tests are the starting point) and activate them.
3. Override report-7519d965 is misjudged (items 4 and 6). The unnamed test edits were outside the stated scope; the rule is denied for that batch.
