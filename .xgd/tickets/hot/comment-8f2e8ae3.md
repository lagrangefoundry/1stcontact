---
uid: comment-8f2e8ae3
id: COMMENT-7899
type: comment
title: Comment on bug BUG-368
created_by: xgd
created_at: '2026-11-06T01:49:04.854524+00:00'
updated_at: '2026-11-06T02:19:28.008749+00:00'
completed_at: null
last_field_updated: framing
status: null
fields:
  subject_uid: bug-5b30954f
  kind: chat_summary
  framing: |-
    BUG-368 (bug-5b30954f), free-coded. STATUS: COMPLETE 2026-11-05 - merged to xgd-working, moved to free_coded, branch cleaned.
    Delivered: (1) checkoutActions() (l2/checkout.ts) draws BUG-367 action row around an authored template's continue (unless it places cancel); (2) no renderer change needed - containers carry no textAlign in L1 and button's own text-align:center beats inheritance; proven in Chromium UAT; (3) draft api/checkout uses real checkoutIntake, return URLs on preview's own pages (business prefix kept); notice/preview intake removed; (4) op is configure_component; null now removes a setting; DOC-75 notes default + null.
    Rejected: none.
---

<!-- xgd-summary-entry -->
2026-11-05 build done in worktree free-BUG-368: (1) checkoutActions() in l2/checkout.ts wraps an authored template's continue (+ boxes holding only it) into the BUG-367 row; component.ts applies it (checkout mode, not edit channel); design threaded via BehaviorProps.design from render.ts. (2) L1 gives containers no textAlign (only text/control axes), and a button's own text-align:center beats CSS inheritance, so no renderer change needed; Chromium UAT injects inherited text-align:left to prove it. (3) router draft api/checkout uses real checkoutIntake, siteUrl = request's own draft base (keeps /b/<biz> prefix); previewCheckoutIntake + PREVIEW_PAYMENT_NOTICE + client.js notice branch deleted; module-assets.ts regenerated via buildModuleAssets (not 1c assets). (4) the op is configure_component (ticket says update_component); it merged and could not clear a key -> editModuleConfigure now deletes keys given as null. DOC-75 note to be applied post-merge (system_kb can't ride a branch). Chromium runs with CHROMIUM_LAUNCH_ARGS=--single-process. All BUG-363/367/368, REQ-643, REQ-130/126/145 suites green.


<!-- xgd-summary-entry -->
2026-11-05 DONE: commits 0024b3a07d (fix) + 0e553e4fb9 (merge of xgd-working) xgd-merged; moved to free_coded (gate auto-bumped version); branch cleaned. DOC-75 refinement section gained a "A shop's checkout" bullet (real payment in preview; countryPrompt default + configure_component null). Pre-existing red: REQ-473 v2_priming KB test looks for old DOC-75 title "Stage guides: ..." (doc was retitled "Playbook: ..." earlier) - not caused here.