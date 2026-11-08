---
uid: comment-1606e1dc
id: COMMENT-7893
type: comment
title: Comment on bug BUG-367
created_by: xgd
created_at: '2026-11-06T00:07:57.556399+00:00'
updated_at: '2026-11-06T01:22:31.907482+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b6fb57f6
  kind: chat_summary
  framing: 'Implementing BUG-367 (builder draft checkout) via FREE CODING. Ticket
    body = spec, 9 fix items. Branch free-BUG-367, worktree /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367.
    Status set free_coding 2026-11-05. Not a dupe (BUG-363 is predecessor). Agent
    CLI python: ~/.xgd/releases/current/bin/python. Plan: preview route in apps/control-app/src/router.ts
    mirrors BUG-78 api/lead (handleCheckout imported from public-site with identified:true
    skipping rate limit; start replaced by owner-only notice).'
---

<!-- xgd-summary-entry -->
2026-11-05 code drafted on free-BUG-367: router.ts draft-only POST api/checkout/<verb> via public-site handleCheckout(identified:true) + previewCheckoutIntake (checkout-intake.ts; start answers PREVIEW_PAYMENT_NOTICE + quote, no order; cancel/status 404). client.js NO_ANSWER/UNREACHABLE, notice. orders.ts singleRate: quote.singleRate, zone falls back to first zone, ship_country provisional zone.countries[0] (column NOT NULL, rebuild migration rejected as too heavy), corrected from Stripe address on paid; start passes all countries. component.ts: DEFAULT_COUNTRY_PROMPT, no ship-to select when single rate, continue disabled until quote (edit: !buyable), cancel control (a, product page else ./), cancelLabel config. l2 default: removed static Ship to label; actions row stack->row at 768, distribution end, Cancel drawn twice with visibility so phone stack has Continue on top (no reverse axis in L1; schema change rejected). render.ts: :disabled opacity 0.45 + not-allowed, control hover :not(:disabled), button text-align center. Item 6 site override is DATA in remote dev site (not in code/local D1) -> must ask operator.


<!-- xgd-summary-entry -->
2026-11-05 tests: workers UAT (4) red with route disabled; jsdom UAT tests/test_UAT_FC_BUG-367_checkout_page.test.ts (6); Chromium UAT tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts (4) needs CHROMIUM_LAUNCH_ARGS=--single-process,--no-sandbox else skips; fixture injects :root design vars (module fragments size from page-level --l1-content; bare catalogSeed has none -> 0px column). 3/4 red on HEAD render/l2 (centring held by UA default). Regenerated module-assets.ts via buildModuleAssets: committed copy also lacked BUG-363 blocked guard. req99 hover pin updated to :hover:not(:disabled). 8 failures in generate/req105/AC718/REQ-269/308/349 are pre-existing (same with src reverted).


<!-- xgd-summary-entry -->
2026-11-05 promoted: merged b26df9ecf2 into xgd-working, move-to-free-coded (gate auto-bumped to 0.2.795), implementation notes appended to the body, branch cleaned. Item 6 (remote dev site countryPrompt override) is still open for the operator. The commit lacks the [FREE-CODED] tag and was not rewritten.
