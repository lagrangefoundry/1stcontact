---
uid: comment-fc674685
id: COMMENT-2611
type: comment
title: Comment on bug BUG-76
created_by: xgd
created_at: '2026-09-10T21:38:50.774404+00:00'
updated_at: '2026-09-10T21:44:13.227499+00:00'
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

<!-- xgd-chat-end -->