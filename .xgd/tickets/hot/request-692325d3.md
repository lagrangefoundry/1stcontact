---
uid: request-692325d3
id: REQ-249
type: request
title: 'Choosing the 1stc.site hostname: the field, the check, and the lock-in'
created_by: EPIC-5
created_at: '2026-09-15T23:21:28.341246+00:00'
updated_at: '2026-09-16T00:25:11.995302+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  epic_parent: epic-c5175c8f
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-21a54d2d
---

## What this is

The field a business chooses its `1stc.site` hostname in, on the Settings pane.

[[REQ-238]] built both operations, both routes and the refusals. It built no UI,
and said so: *"when this ticket lands, nothing owns building the field... where it
goes is the operator's call."* This is that ticket. **Nothing here decides what a
hostname is, what is refused, or whether a name is free** — all of that is
[[REQ-238]]'s and is called, not restated.

## What already exists and is not to be rebuilt

- `GET /api/hostname/check` — always 200, including for a name it refuses
  (`router.ts:2902`). "Taken" is an answer, not an error.
- `POST /api/hostname/claim` — 200, or 409 `taken`, or 409 `held`, or 400
  (`router.ts:2927`).
- `createModalShell` / `modalFooter` / `modalButton` (`builder/modal.js`) — the
  dialog chrome every builder modal wears. The confirm dialog below wears it too;
  a second dialog implementation is a falsifier.
- The pane itself (`builder/settings.js`), written by [[REQ-239]] as *"a list of
  settings sections so that one is an addition rather than a rewrite."* This is
  that addition.

## The section

**It is called `Your free web address`, and it is not called a domain.** The word
matters more than it looks: a `1stc.site` hostname is not a domain, and
[[EPIC-6]] is going to sell the customer a real one. Teaching them "domain" here
means unteaching it there — *"but I already have a free domain"* is the support
conversation this wording buys. `free` stays, because it is true and it is worth
saying. `domain` goes.

The same phrase is what the assistant says ([[EPIC-5]]'s ticket C reconciles the
declaration against it), so the customer hears one noun from the field and from
the conversation beside it.

The field shows **the whole host as it will be**, never a bare label —
[[REQ-238]]'s own requirement, and the reason is that a permanent name typed by a
low-tech customer is a permanent typo waiting to happen:

```
Your free web address:  [ alice            ] .1stc.site   [ Check availability ]
```

## Checking

**The button fires the check, and so does Enter in the box.** [[REQ-238]] already
says this — *"what the field on the settings pane calls on every return press"* —
and it is restated because a check reachable only by mouse is the same field with
the registrar experience taken out of it.

A check answers with exactly one line under the box, and **there are four of
them, not two.** The route already distinguishes the refusals and collapsing them
loses the only thing that tells the customer what to do next:

| State | The line |
| --- | --- |
| available | `✓ alice.1stc.site is available` — followed by `[ Lock it in ]` |
| taken | `✗ Sorry, alice.1stc.site is taken — try something else or ask the AI for help` |
| reserved | `✗ Sorry, mail.1stc.site is kept for 1st Contact itself — please choose a different word` |
| invalid | `✗ ` and the rule that was broken, as the route states it |

**Reserved is not taken, and saying it is sends the customer the wrong way.** A
customer told `mail` is *taken* goes looking for `mail2`, which is also reserved,
and so is every other variation on the word. The refusal has to say *this word is
ours* so they change the word rather than decorate it.

**The taken line names the assistant as plain text and nothing more.** It sits
beside the chat, on the same tab, in the same split — so it names something the
customer can already see. Priming that conversation with the candidate they just
tried is a later refinement and is deliberately not built here.

## Locking it in

`[ Lock it in ]` opens the confirm dialog, in the shell from `modal.js`:

> You have chosen **alice.1stc.site** as your free 1st Contact web address.
>
> Are you sure this is correct? Once you lock it in, this is **your business's
> address for good** and cannot be undone — not by you, not by us on request.
>
> `[ Cancel ]`  `[ Lock in alice.1stc.site ]`

Three things about that dialog are behaviour rather than decoration:

- **It says *your business*, not *this site*.** [[REQ-238]]'s rule is one
  platform address per business, and this dialog is the moment that promise is
  made. Saying "this site" would promise something narrower than what is enforced.
- **The confirming button names the act**, and is not called OK. This is the most
  irreversible action in the product and `OK` is the weakest label available for
  it; the customer should be able to read the button alone and know what they are
  about to do.
- **Cancel takes focus when the dialog opens.** A return press that was aimed at
  the check box must not land on the permanent choice.

## Losing the race, after the dialog

A check reserves nothing, so the claim can be refused after the customer has read
and accepted the dialog. [[REQ-238]] supplies the sentence and this is where it is
said:

**409 `taken`** → the dialog closes, the pane returns to the field with the
candidate still in it, and the line beneath reads
`✗ alice.1stc.site went while you were deciding — try another one.`

It is not an error dialog and it is not a stack trace. It is the ordinary outcome
of a first-come namespace, said in one sentence, with the customer left exactly
where they can try again.

## The state most businesses are in most of the time

**A business that has already claimed sees no text box.** The section shows the
host it holds and says the choice was permanent:

> Your free web address is **alice.1stc.site**.
> This was chosen once and cannot be changed.

No field, no check button, no lock-in. A box that can only be refused is worse
than no box ([[DOC-47]] — never build a fake), and the 409 `held` refusal exists
for callers that get there another way, not as this pane's ordinary path.

The section reads its state from the addresses the pane already has, so
"claimed or not" is not a second question asked of the server.

## Not in scope

- **Custom domains.** The section is about the `1stc.site` address. A domain the
  customer owns is [[EPIC-6]] and [[EPIC-5]]'s own work, and the section must not
  imply the free address is a lesser substitute for one.
- **Any path that changes or releases a claimed hostname.** [[REQ-238]] has no
  such operation and this pane must not appear to want one.
- **Priming the assistant** from the taken line. Named above, deliberately later.
- **A read-only variant for non-owners.** `provisionBusiness` writes `owner` for
  every membership it creates (`identity.ts:833`) and nothing creates a `support`
  membership today, so everyone who can reach this pane owns the business. The
  owner-only gate on the claim route is defence for a role that does not exist
  yet, and building a state for that role now would be building for nobody.

## Falsifiers

- A bare label field, or any rendering that does not show the whole host.
- The check reachable by the button but not by Enter.
- One refusal line standing for `taken`, `reserved` and `invalid`.
- The word `domain` anywhere in this section.
- A confirm dialog that says *this site*, or whose confirming button is labelled
  `OK`, or that opens with focus on the confirming button.
- A dialog built from anything other than `createModalShell`.
- A 409 at claim rendered as an error dialog, a console line, or a page reload
  rather than as the one sentence beside the field.
- A text box shown to a business that already holds a hostname.
- Any re-implementation of the syntax rules, the reserved list, or availability
  in the client.
## What building it required that the section above does not state

Recorded because it is behaviour, and because reconciliation would otherwise find
it with no language to attach it to.

**The check route now says WHICH refusal it hit.** `GET /api/hostname/check`
answered `{host, available, refusal}` — a sentence and not a class — and the four
lines above cannot be told apart from a sentence without reading its prose or
carrying a copy of the reserved list, which is this ticket's own falsifier.
`checkHostname` already makes the distinction internally (`claimHostname` throws
`ReservedHostnameError` where it would otherwise throw `InvalidHostnameError`), so
it is now said out loud: the answer carries `reason: 'taken' | 'reserved' |
'invalid'`, and null when the name is free. The decision stays [[REQ-238]]'s; only
the wording is this pane's.

**Editing the box withdraws `Lock it in`.** The button commits the host the LAST
check answered about, so leaving it up beside an edited box would offer to make
permanent a name nobody has been told is free.

**An empty box asks nothing.** The route would answer it — with the rule about
needing at least one character — but reporting a rule as broken to somebody who
has not typed yet is a refusal they did not earn.

**The apex is read from the same answer as the addresses.** `GET /api/hostname`
returns both, so `.1stc.site` is never composed in the browser: a second place that
string is written is a second place it can fall out of step with the host the
Worker actually issues.

**A custom domain is not mistaken for the platform address.** The section picks the
`platform` address out of the list, so a business holding only an [[EPIC-6]] domain
still sees the field — it has not chosen its free address yet.

## Where it landed

- `apps/control-app/src/builder/hostname.js` — the section, its four sentences and
  the confirm dialog. Its own module rather than more of `settings.js`, which is a
  pane over a text field and would otherwise be a pane and a registrar at once.
- `apps/control-app/src/builder/settings.js` — the second section, and the one
  address read per business (generation-guarded, so a switch mid-flight cannot draw
  the previous business's address under this one's name).
- `apps/control-app/src/builder/api.js` — `fetchAddresses`, `checkHostname`,
  `claimHostname` and `HostnameClaimError`, which carries the route's own
  `taken`/`held` distinction rather than a status code.
- `apps/control-app/src/hostname.ts` — `HostnameCheck.reason`.
- `apps/control-app/src/builder/builder.css` — the box, the apex beside it, the
  line and the dialog's prose. Everything paints from `--shell-*`.

## Test plan

- `tests/test_UAT_FC_REQ-249_free_web_address.test.ts` — the shipped section in a
  real document over the real dialog shell: the wording, the whole host, Return and
  the button, the four lines, the dialog's promise and its focus, the lost race, the
  held state, and a scan proving no rule is re-implemented in the client. Two cases
  mount the whole builder, so "it is on the Settings pane" is the assembled product.
- `tests/test_UAT_FC_REQ-249_check_names_its_refusal.workers.test.ts` — the `reason`
  classification against real D1, over every reserved label the product ships.
