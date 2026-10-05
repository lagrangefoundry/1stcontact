---
uid: request-cd88fc31
id: REQ-389
type: request
title: 'Consultant conduct from Charlie 3: no unapproved contact details, finish before
  handing back, check every width, no parallel claims'
created_by: EPIC-19
created_at: '2026-10-04T23:20:00.726888+00:00'
updated_at: '2026-10-04T23:20:00.726888+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-1b250264
---

## What changes

Five consultant habits seen in the Charlie's Plumbing 3 debrief (2026-10-04, EPIC-19) are corrected. One of them gets a host-side guard as well as a priming rule.

## Requirements

1. **No contact detail goes public without the owner's explicit approval** (operator: "we should never put a customer email address on a webpage without explicit approval — it's a spam magnet"). The consultant put `office@…` from the letterhead into the published contact section without asking. Priming: an email address, a personal phone number, a home address or a person's name only appears on a page after the client has said yes to that specific detail appearing publicly. The public phone number from the client's answers or materials is the normal exception, and the consultant still confirms it once. **Guard:** a site write that introduces an email address (a `mailto:` link, or text matching an email pattern) not recorded as approved in the plan is refused, with a message saying to ask the client first. Approval is recorded per detail in the plan, by the client's answer or by the consultant on the client's explicit say-so.
2. **Finish and check before handing back** (operator: "the funky cropping and alignment is a pretty disappointing first impression. Why not spend longer to correct those in the first turn rather than asking permission to go back"). Priming: a first rough cut, or any requested change, is checked by the consultant against the brief before the turn ends, and visible defects (bad crops, misalignment, missing sections the brief named) are fixed in the same turn. The consultant asks the client about choices, never for permission to fix its own mistakes.
3. **Check every width after a change to the top of the page.** The call button was made visible only on narrow screens, and the consultant checked the phone view alone, so on desktop the button disappeared. Priming: after any change to the header, navigation or hero, check desktop, tablet and phone before reporting done. REQ-388's width reporting makes "the width the client is viewing" one of them.
4. **Never claim parallel work.** The consultant said again that "the three looks are being built at the same time". Builder sessions run one at a time (EPIC-24). Until EPIC-24 lands, the `Delegate` description and the priming say so, and the consultant's estimates add the sessions' durations together rather than overlapping them.
5. **Questions in the client's terms.** The consultant asked Charlie a question as if he'd put the site on the side of his van, which he found strange ("why would I put a web page on the side of my van"). Priming: a positioning or brand question is asked about the client's real situation, offering concrete alternatives (REQ-378's comps, rendered options), never as a metaphor the client has to translate.

## Test plan

UATs named `test_UAT_FC_<TICKET-ID>_*`:
- A site write adding an unapproved email address is refused, naming the rule; after the plan records approval for that address, the same write succeeds.
- The priming and the `Delegate` description contain the rules in 1–5 (one-at-a-time builder sessions, all-widths check after header changes, no unapproved contact details, finish-before-handing-back).