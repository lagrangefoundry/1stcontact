---
uid: bug-6fc72f53
id: BUG-308
type: bug
title: 'Builder: the progress area lights up blue again while the consultant works;
  the hero effect is proposed as intro plus loop'
created_by: EPIC-19
created_at: '2026-10-28T02:32:04.291342+00:00'
updated_at: '2026-10-28T02:53:44.868035+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-4a39d838
  story_points: 2
  commits:
  - working_sha: d82f6426cc3f7ae209d20b078a4891a1dda674fc
    reconcile_sha: null
    main_sha: null
  - working_sha: 8c8ac6a565dbc8205fa4105719eff0f44053d08a
    reconcile_sha: null
    main_sha: null
  version: 0.2.693
---

## Why

The operator's review of First-Draft-Test Dina's Diner 9 (2026-10-28) raised two issues.

## 1. The working highlight has regressed

**Agreed in BUG-245 (2026-10-21):** while the consultant works, the area at the top of the chat column lights up in the progress banner's in-progress blue, gently animated (static under reduced motion), so the client can see it's active. Blue means "in progress" everywhere; green means "done".

**Cause:** the rule is `.plan-panel--working .plan-stages` (`apps/control-app/src/builder/builder.css`, the BUG-245 block). REQ-431 moved the progress banner (`planPanel.tracker`, `.plan-stages`, with the status line under it) out of the plan panel and into the chat column's progress area (`app.js`: `progressArea.append(planPanel.tracker, help.element)`). `.plan-stages` is no longer inside `.plan-panel`, so the rule matches nothing. `setBusy` still runs and still sets `tracker.dataset.busy`.

**Fix:**
- Key the highlight on the tracker itself (`.plan-stages[data-busy="true"]`), so it works wherever the banner is mounted. That covers the banner and the status line joined under it.
- Keep the blue, the gentle animation, the reduced-motion static form, and the screen-reader line.
- Remove the dead `.plan-panel--working .plan-stages` rule. The panel's own inset edge stays only if the panel is still on screen beside it; otherwise remove it too, and record which.

## 2. The hero effect is offered as a menu instead of the agreed shape

On Dina 9, the consultant (under BUG-306's hold) offered three options: steam rising, a slow push-in, or nothing. That doesn't match what was agreed in DOC-71 §12.9 and DOC-74 §5:
- **The shape:** an eye-catcher that plays once and **ends on the client's original photo**, then a quieter ongoing loop (for example, pepper ground over the eggs, then steam keeps rising). REQ-470's intro-plus-loop is how it's built.
- **How it's put:** cohort zero gets one enthusiastic suggestion in that shape, and the consultant goes ahead unless they object. A client-driven client gets it offered with a recommendation, with alternatives only if they want them.

**Fix:**
- DOC-75's first-draft guide and BUG-306's refusal text give the intro-plus-loop shape as the default recommendation: name the eye-catcher and the loop for the client's own photo.
- One proposal for cohort zero; a recommendation with alternatives available for client-driven clients.
- "Nothing moving" is the client's choice to make, not one of the listed options.
- The hold still needs the client's answer (a yes to the proposal counts), so BUG-306's guarantee is unchanged.

## What landed

- **Highlight:** `builder.css` keys the BUG-245 block on `.plan-stages[data-busy='true']` (in-progress blue `#2563eb` background, blue bottom edge, gentle `plan-stages-working` animation; `animation: none` under `prefers-reduced-motion: reduce`). The status line sits inside the banner, so it lights up too. **The panel's inset edge was removed**, along with `setBusy`'s `plan-panel--working` class toggle: the plan panel lives in the input board's Questions tab, not beside the banner, so the progress area is the one place that says "working". `setBusy` still sets the panel's `aria-busy` and its screen-reader line.
- **Effect:** DOC-75's first-draft guide (the signature-effect bullet) and the `effect_first` refusal (`account-core.ts`) now give the default shape: an eye-catcher that plays once and ends on the original photo, then a subtle loop, named for the client's photo. They say one enthusiastic proposal asking for the go-ahead when the client prefers the consultant to lead; a recommendation, with alternatives only if wanted, when the client leads. They say no motion at all is the client's choice, never one of the options, and that a yes to the proposal counts as a choice. The hold itself (`effectUndecided`) is unchanged.

## Test plan

- `test_UAT_FC_BUG-308_progress_area_lights_up_while_working` (jsdom, the real builder with the shipped stylesheet): the banner is in `.progress-area`, outside `.plan-panel`. With `setBusy(true)`, a stylesheet rule painting `#2563eb` with the working animation matches the banner, and a reduced-motion rule sets `animation: none`. With `setBusy(false)`, no such rule matches. No rule selector still names `plan-panel--working`. (jsdom resolves no `color-mix()`, so the rule is read instead of computed style.)
- `test_UAT_FC_BUG-308_effect_proposed_as_intro_plus_loop` (node, the shipped DOC-75): the first-draft guide gives the intro-plus-loop shape, one proposal when the consultant leads, a recommendation when the client leads, and "no motion" as the client's choice. The old menu wording is gone.
- The refusal text is pinned through the real routes by BUG-306's workers test `first_build_held_until_effect_decided`, now also asserting the intro-plus-loop proposal and the absence of the "two or three effects" menu.
- Retargeted: BUG-245's working-state test (now `tracker.dataset.busy` and the new selector), BUG-306's guide test and REQ-477's first-draft guide test (new wording).