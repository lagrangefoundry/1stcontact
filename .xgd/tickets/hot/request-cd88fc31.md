---
uid: request-cd88fc31
id: REQ-389
type: request
title: 'Consultant conduct from Charlie 3: no unapproved contact details, finish before
  handing back, check every width, no parallel claims'
created_by: EPIC-19
created_at: '2026-10-04T23:20:00.726888+00:00'
updated_at: '2026-10-05T01:32:36.927328+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-1b250264
  commits:
  - working_sha: 5c3b6c64ac726f9170258fd8f9c683eab5e1c4d5
    reconcile_sha: null
    main_sha: null
  - working_sha: 1298430039fe7ab6600ec7cb88b1615058402574
    reconcile_sha: null
    main_sha: null
  version: 0.2.494
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



## What landed

**Guard (requirement 1).** The AI's site writes refuse an email address that the plan doesn't record as approved. The check runs at the single write choke point (`validateOrThrow` in `tools/generate/src/cli/edit.ts`).
- Detection: every string in the proposed site definition (base and every page) is scanned for an email pattern. That covers running text and `mailto:` links, and any field added later. Fields that name files (`src`, `srcset`, `poster`, `asset`, `handle`) are skipped, so `photo@2x.png` isn't read as an address. Addresses are compared case-insensitively.
- Only *introduced* addresses are refused, compared site-wide before and after the write. An address the site already showed is inherited, so moving it between pages, or editing a page that already has one, is not refused (the REQ-175 introduced-vs-inherited rule).
- Refusal: a new `NOT_APPROVED` code (exit code 7). It is declared in `l1-surface.json` with a message, and added to the error list of every content-writing op (`set_l1`, `group_l1`, `flow_l1`, `add_page`, `copy_page`, `update_page`, `add_component`, `configure_component`, `set_config`). The message names the address and says it isn't approved. The hint says to ask the client first, then record their yes. Nothing is written.
- Scope: AI writes only. The host binds approvals through `aiOptions` (`host-core.ts`) for the consultant, the builder worker and the coordinator. Approvals are read at write time, so a yes recorded mid-turn counts for the next write. A person editing their own site (builder routes, CLI) is not guarded. A host with no plan store is not guarded either, since there is nowhere to record an approval.

**Recording approval (per detail, in the plan).**
- `approve_detail(detail, quote)` is a new plan op in the `KeepAsks` group, so both the consultant and the coordinator have it. The consultant records the client's explicit yes. `quote` (the client's own words) is required, otherwise the call is refused with `PLAN_INVALID`. It is stored in the new plan field `public_details` (`{detail, quote, by, at}`), which is registered in the control-app plan store and its type pack.
- `set_ask` now takes an `approves: <detail>` parameter, which turns the ask into a yes/no approval ask. The host sets the two options (`APPROVAL_OPTIONS`). The detail is approved when the **client** answers "Yes, show it on the site". If the agent fills the ask in with `fill_ask`, that is not an approval. If the client changes the answer to no, the approval is withdrawn. `checkPlan` holds an approval ask to exactly that shape.
- `approvedDetails(fields)` (`plan-core.ts`) combines both sources.

**Priming (requirements 1–5).** A new `conduct` entry goes in both consultant priming orders (with and without corpus), after `plan-panel`:
- finish and check against the brief before the turn ends, and fix crops, alignment and missing sections in the same turn; never ask permission to fix your own mistakes;
- after a change to the header, navigation or hero, check desktop, tablet and phone, plus the width the client is viewing (REQ-388);
- no email address, personal phone number, home address or person's name without the client's yes. A letterhead is not a yes. The business phone number is the usual exception and is still confirmed once. Approval is recorded with `approve_detail` or an approval ask;
- ask questions about the client's real situation, offering concrete alternatives, never a metaphor;
- one piece of building work at a time; estimates add the durations together.

**`Delegate` description (requirement 4).** The `Delegate` tool's own declaration lives upstream (lagrange-framework `delegation_surface.json`). 1stcontact's description of it is the `delegation-method` template, and both delegation reminders. All three now say builders run one at a time, never in parallel, and that estimates add each build's time rather than overlapping them.

## Design decisions made during implementation
- A per-turn reminder for "finish before handing back" was tried and dropped. It pushed the standing reminder past REQ-171's 600-character budget, and it took the slot REQ-342 reserves after `act-rather-than-narrate`. The rules ride in the priming instead.
- A dedicated refusal code was used rather than reusing `SCHEMA_INVALID` or `CONFLICT`. Both of those carry declared messages ("not well-formed", "name taken") that would mislead the model.
- The `Delegate` declaration in lagrange-framework was left alone. Its one-at-a-time behaviour is this deployment's fact (EPIC-24), and the method prose is where this repository describes `Delegate`.

## UATs
- `tests/test_UAT_FC_REQ-389_no_unapproved_contact_details.test.ts`:
  - an unapproved email write is refused with `NOT_APPROVED`, naming the address and "ask the client", and nothing is written;
  - an approval without a quote is refused;
  - after `approve_detail`, the same write lands (case-insensitive), and a different address is still refused;
  - an approval ask answered yes by the client approves the address, and the agent's `fill_ask` does not;
  - an inherited address is not refused, and an owner write without AI options is not guarded.
- `tests/test_UAT_FC_REQ-389_consultant_conduct_priming.test.ts`:
  - both priming orders carry rules 1, 2, 3, 4 and 5;
  - the `delegation-method` (commissioning and choosing) and both reminders say builders run one at a time;
  - the plan surface declares `approve_detail` (detail, quote), `set_ask.approves` and the `KeepAsks` membership.
- `tests/test_UAT_FC_REQ-356_the_plan_is_the_sites.workers.test.ts`: the pinned plan-type field list is extended with `public_details`.