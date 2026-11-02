---
uid: report-f00b1193
id: REPORT-8027
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:34:10.749859+00:00'
updated_at: '2026-11-02T00:34:10.749859+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

Incoming commit 5e7c766951 ("Merge branch 'free-REQ-188' into xgd-working", 2026-09-05) is the earlier THREE-STATE version of REQ-188 (contact -> invited -> member, derived from invited_at/tos_accepted_at via builder/people-state.js). HEAD already contains aacdc97d5a ("feat(people): a contact sits on two axes, and the pipeline starts at Lead [FREE-CODED]", 2026-11-01). That later free-coded commit replaced the model with two independent axes (access / pipeline, builder/people-axes.js, stored pipeline_stage) and deleted people-state.js on purpose. Both sides are free_coded, so the later working-timeline position wins: HEAD.

- apps/control-app/src/builder/people.js — code UU — took HEAD (later free-coded two-axis rewrite; incoming hunks are three-state docs/imports/facet that HEAD superseded)
- apps/control-app/src/people.ts — code UU — took HEAD (same; doc-comment hunks only)
- package.json — config UU (version scalar) — took HEAD 0.2.81 over incoming 0.2.75 (incoming version is older; applying it would regress the version)
- tests/test_UAT_FC_REQ-186_invite.workers.test.ts — UAT UU — took HEAD (same test functions on both sides; only comments/assertions differ, HEAD's assert pipelineStage from the later model). No test function deleted.
- tests/test_UAT_FC_REQ-186_invite_control.test.ts — UAT UU — took HEAD (same function; HEAD asserts .builder-people__stage/__access, incoming asserted .builder-people__state, which HEAD no longer renders). No test function deleted.
- apps/control-app/src/builder/people-state.js — incoming add — dropped (git rm); deleted by aacdc97d5a
- tests/test_UAT_FC_REQ-188_membership_states.test.ts, tests/test_UAT_FC_REQ-188_membership_states.workers.test.ts — incoming adds — dropped (git rm); they import people-state.js and assert the three-state markup. HEAD covers REQ-188 with test_UAT_FC_REQ-188_contact_axes{,.workers}.test.ts.

## Incoming changes preserved

Not preserved, by design, under the BUG-1301 precedence exception. Every incoming hunk targets the three-state model that aacdc97d5a, already integrated into HEAD, removed in a legitimate, documented refactor. Its commit message and the doc comments in people.js/people.ts ("AND THE FIX FOR THAT WAS ITSELF ONE LINE TOO FEW. Contact / Invited / Member on a single axis cannot represent a member who was never invited...", DOC-44 §3) describe the incoming design as superseded. HEAD files (email-shape.js, tsconfig.json, BUG-53 test) refer to people-state.js and .builder-people__states in the past tense, which confirms the removal was deliberate and not churn. The parts of the incoming intent that still apply (an invite does not make a member; tos_accepted_at is the membership marker; invited_at is kept) are already in HEAD in their two-axis form. Staged diff vs HEAD is empty, so finalize should treat this commit as redundant.

## Arbitration of last resort (BUG-1460)

Not needed as the primary path (BUG-1301 precedence + both-free-coded later-timeline rule decide it). Tier 1 agrees: the later intent (aacdc97d5a, two-axis REQ-188) explicitly calls the incoming three-state model insufficient. Side dropped: incoming.

Flag for post-merge review: the five conflicted files, per the enrichment rule.
