---
uid: comment-dc0a968d
id: COMMENT-7904
type: comment
title: Comment on bug BUG-370
created_by: xgd
created_at: '2026-11-06T16:53:39.445287+00:00'
updated_at: '2026-11-06T17:05:36.001636+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-8788f921
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "fb8bc4d2-2328-4c25-90be-a9bf815817be",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="76aabf10-8c31-49ca-9d41-eb4fef401b05-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T16:53:23.976996+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="76aabf10-8c31-49ca-9d41-eb4fef401b05-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T17:05:34.455715+00:00" -->
#### Claude
Not a duplicate (it supersedes part of BUG-368). Now reading the checkout/form templates and the layout check to scope the code.

Only checkout has a primary/secondary pair today (contact form and account forms have only a submit), so item 1 already holds. Next: the layout check and the consultant's design guidance.

Still scoping: finding how a rendered page marks a `button.primary` node so the layout check can tell primary from secondary.

Branch cut worked. Making the worktree runnable (node_modules links per earlier notes).

Worktree has its own install. Now reading the BUG-368 Chromium UAT to reuse its harness.

Note: BUG-368's last UAT pins "keeps its placement", which this ticket explicitly supersedes — I'll update it. Now the `checkoutActions` change.

Now the renderer marker for `button.primary`/`button.secondary`.

I split a doc comment from its constant; moving mine above it.

Now the layout check. Reading the in-page helpers and thresholds file.

Writing the `action_order` check, after `button_rows`.

Now the guidance line in builder priming (both variants, spliced textually per the mixed-escapes note).

Now typecheck.

Typecheck is clean for my files (the two errors are pre-existing in control-app). Writing the UATs.

Updating BUG-368's superseded assertion, then running the suites.

Order is right; my fixture's column is shrink-wrapped so one assertion was wrong, and the page already carries `dir="ltr"` so my RTL injection was ignored. Fixing the test fixture.

All 7 new UATs pass. Running the regression scope (checkout, contact-form, layout-check, priming suites).

Checking whether these two fail on clean xgd-working too.

Node scope is green. Now the workers suites (priming budgets and checkout).

These are about the consultant's prompt, which I didn't touch (I edited builder priming). Baselining in the main checkout.

Same three failures with identical figures on clean xgd-working, so they're pre-existing. Committing.

Updating the ticket body first (the UATs must be motivated by its text), then committing.

Now the merge-back sequence (lock → merge working into branch → bump → fast-forward → free_coded), with retries for the tip race.

BUG-370 is implemented, merged into xgd-working (0.2.801) and parked at `free_coded`. It isn't a duplicate: it supersedes BUG-368's "a template that places its own Cancel keeps its own placement".

**What changed**
1. **Checkout buttons are now in the right order on every site.** When a site's own checkout template places its own Cancel, the renderer takes it out and draws the standard row. That row is right-aligned with Cancel to the left of Continue. On phones the two stack with Continue on top, and a right-to-left page mirrors it. Cancel keeps its own look and only its position changes. A template that already has the standard row, such as the default page, is left as it is.
2. **The layout check reports two new problems** (new check `action_order`):
   - a `button.primary` sitting left of a `button.secondary` in the same row;
   - a form's or checkout's row of two or more buttons pushed to the left.

   Both messages state the rule. To make the first one possible, the renderer now adds a `data-l1-component` attribute to primary and secondary buttons.
3. **The design guidance states the rule in one line:** "Action buttons: primary on the right, secondary to its left, primary on top when stacked; a right-to-left page mirrors it."

**Where I departed from the ticket**
- **Forms:** no form today has a Cancel or Back control; the contact and account forms only have a submit. So there was no form default to change, and the test plan's "form with submit and cancel" case can't be built. A left-aligned action row in a form is caught by the layout check instead.
- **Where the rule line went:** I put it in the builder's guidance, which writes the pages, not in the consultant's own prompt. The consultant's prompt is already over its size budget on clean xgd-working. If you want the line in the consultant's prompt as well, something there has to be cut to make room.
- **BUG-368's test:** I replaced the BUG-368 UAT that checked "keeps its own placement" with one checking the new behaviour.

**Tests**
- The 8 new UATs in `tests/test_UAT_FC_BUG-370_action_order.test.ts` pass, 7 of them in real Chromium. They cover the order at 1024px, Continue on top at 375px, the right-to-left mirror, the layout check reporting and passing, and the guidance line.
- The regression suites for BUG-367, BUG-368, REQ-643, contact form, the layout check, REQ-622, REQ-655 and builder priming all pass.
- Three workers tests on the consultant's prompt size (REQ-466 and REQ-473) fail, with identical figures on clean xgd-working, so the failures were already there.

The site whose checkout you saw will show the new order once it's re-rendered and dev is redeployed. The ticket body is up to date, and promoting it to `ready_to_reconcile` is up to you.

<!-- xgd-chat-end -->