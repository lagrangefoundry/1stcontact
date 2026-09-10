---
uid: comment-fc674685
id: COMMENT-2611
type: comment
title: Comment on bug BUG-76
created_by: xgd
created_at: '2026-09-10T21:38:50.774404+00:00'
updated_at: '2026-09-10T21:50:54.163066+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-26ffd91c
  kind: chat_transcript
---

<!-- xgd-turn id="bc62824c-c325-4cc3-9f0c-484a5a114e1f-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T21:38:35.543962+00:00" -->
#### You
Please review the current transcript for the first contact builder the AI hit some friction points working with the modal - can you figure out what the problem was?

<!-- xgd-turn id="bc62824c-c325-4cc3-9f0c-484a5a114e1f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T21:44:12.523324+00:00" -->
#### Claude
I've traced it. Let me record the findings on the ticket.

Read the session transcript (`chat-5c9fd79b`) and traced each friction back to code. Three of the frictions are already owned — [[BUG-75]] (the `capabilities.js` syntax error, which is why the dialog really did sit inline and open — the "immediate bug" the operator says is fixed), [[REQ-215]] (View→Edit loses the open dialog), [[REQ-216]] (`picture` can't drive the page, which is *why* the AI reasoned from a still and then invented a "preview mode" story).

What's left is three genuine defects, all confirmed in the code. Written up on BUG-76.

**1. The AI filed a false bug against a component that works.** It reported that `account-chrome`'s "Please enter your email address" label "isn't rendering", told the operator to escalate to whoever owns the component, wrote its own copy of the line into the dialog slot, and warned it would show *twice* once fixed.

The label renders fine. It is deliberately `sr-only` — `styles.css` clips `.account-chrome__label` to 1×1px, and the comment says *"Obligation, not styling — which is why a designer cannot vary it."* But `meta.ts` documents the config key as *"visible unless L1 hides it"* — false in both directions; L1 can neither hide it nor unhide it. So the AI's workaround is actually the correct permanent answer, arrived at by accident, and its closing advice would cost another cycle to undo.

Underneath it: `account-chrome` has **no way to label that field at all** from config. `contact-form` has `labelMode: visible|placeholder`; `account-chrome` has nothing, so a config-only sign-in panel ships a bare box.

**2. Undeclared config keys are stored silently.** The AI passed `account:` (an `account-portal` key) to `account-chrome`; it was accepted and is still in the instance config. `validateBehaviorConfig` loops over `meta.config`'s declared names only — a key the contract has never heard of can't produce an error.

**3. Schema errors inside a behavior slot collapse to "Invalid input".** The ✕ change was refused with `/pages/0/modules/1/slots/dialog: Invalid input`; the real fault was `lineHeight` (vocabulary is `lineHeightPx`). The same mistake in the page's own `l1` tree reports precisely — `issues.ts` exists to unbury union failures and works there. It fails at slot positions because `schema.ts:489` wraps the node union in a *second* union (`z.union([l1NodeSchema, z.array(l1NodeSchema)])`); neither branch fails on a `kind` literal, so no discriminator is discovered and the outer union's default message survives. Behavior slots are exactly where modal authoring happens. Two smaller siblings: an unknown `kind` also reports bare "Invalid input" rather than naming the valid kinds, and `validateOrThrow` reports only `errors[0]`.

The unifying rule: a reference surface describing a component is generated from the component, or it's a liability. Defect 1 is a hand-written comment contradicting CSS three files away; defect 2 is a validator that can't see what it wasn't told to look for; defect 3 is a correct localiser defeated by a schema shape it was never shown.

One scope question on the ticket: these are three unrelated fixes in three packages (framework module, `behavior.ts`, `site-schema`). BUG-77 is open and untitled — happy to split into it, or keep all three on BUG-76. No code written yet.

<!-- xgd-turn id="1132ad71-7417-4632-a58c-1b6fcaf188b6-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T21:48:39.836669+00:00" -->
#### You
The modal is also NOT advancing to the second screen did you get that one?

<!-- xgd-turn id="1132ad71-7417-4632-a58c-1b6fcaf188b6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T21:50:54.095542+00:00" -->
#### Claude
No — I only carried forward the AI's own note that `sentMessage` was unverified. Chased it now. It's on the ticket as Defect 4. Three independent causes, any one sufficient:

**4a — it was never built to swap.** `client.js`'s `submitAddress` un-hides a paragraph and disables two controls. It never removes the address field, the Continue button, the ✕ or the label. So the panel doesn't *become* the confirmation, it grows a line under a greyed-out form. The brief was "replace that content in the modal with a message." `contact-form` hit the same requirement and answered it properly — `root.innerHTML = successHtml`, a real swap. Two components, one requirement, two answers, and the sign-in one doesn't meet its brief. `sentMessage`'s doc comment reasons carefully about *what the message says* and never about *what it replaces*.

**4b — the configured endpoint is not a route, and it's cross-origin.** The instance posts to `https://app.1stcontact.io/auth/request-link`. No such path exists anywhere in the codebase. The real endpoint is already built: `POST /sign-in` in `apps/control-app/src/sign-in.ts` (REQ-202), one of four routes deliberately matched ahead of the Access gate. The AI told the operator these were placeholders for the engineers to wire up, when a working endpoint was sitting there to be named.

The consequence isn't a quiet 404 — `client.js` never reads the response, so a 404 would still count as completed and show the sent message. But this POST is cross-origin with `Content-Type: application/json`, so it takes a CORS preflight, and with no CORS headers back the `fetch` **rejects**. A rejected fetch is the one case routed to the error paragraph, and it `return`s *before* the disable. So Continue produces the error state, the button doesn't even grey out, and nothing visibly happens.

**4c — even on the success path, the message paints outside the card.** `sent` and `error` are direct children of the `<form>`, siblings of the authored dialog subtree. Once enhanced, that form *is* the overlay (`position:fixed; inset:0; display:flex; …; background:rgba(0,0,0,0.5)`). So both paragraphs are column flex items **outside** the 380px card, centred on the scrim, styled only by `margin: 0` — default dark ink on a dark scrim. And neither can be fixed from the page: both are `data-fc-invariant`, bound to no slot node.

That last one is Defect 1 again on two more elements. Three of this component's four text surfaces — field label, confirmation, error — are component-painted, unstyleable, and positioned outside the region the author controls. That's now the spine of the ticket rather than one isolated bug.

**Why the tests missed it:** `test_UAT_FC_REQ_200_check_your_email_is_identical_either_way` asserts `sent.hidden === false` and identical text at 202/404/500. That's the REQ-134 non-disclosure property, and it genuinely holds. Nothing asks whether the panel then *reads* as a confirmation — form gone, message inside the card, legible against what's behind it. The test runs in JSDOM, where the overlay CSS doesn't apply and geometry doesn't exist.

Scope question on the ticket now lists four fixes across three packages. Still no code written — say how you want it split (BUG-77 is open and untitled) and I'll cut a branch.

<!-- xgd-chat-end -->