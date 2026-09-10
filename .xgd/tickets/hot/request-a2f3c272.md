---
uid: request-a2f3c272
id: REQ-216
type: request
title: The AI must be able to drive the page before it photographs it
created_by: REQ-212
created_at: '2026-09-10T20:23:43.136350+00:00'
updated_at: '2026-09-10T21:40:40.213636+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6bc952d2
---

# The AI must be able to drive the page before it photographs it

## What prompted it

Asked to build a sign-in modal, the product AI styled it, was told it still did
not look like a modal, and replied that it could not check: *"I only have the
inline preview to work from"*, *"I can't personally click 'Sign in' and watch it
open, because I only ever get a picture, not an interactive page."*

The second half of that is true and is this ticket. The first half was not —
`kind: 'draft'` existed and it never tried it — but the true half is the one that
matters, because it is why the AI reasoned from a picture instead of from the
page, and then defended a story about "preview mode" that was invented rather
than observed.

A modal is the clearest case and not a special one. **Anything reached by an
interaction is invisible to the AI today**: a modal, a carousel past its first
slide, a disclosure, a form's success state, a hover treatment, a focus ring.

## The capability

`picture` gains a way to say **what state the page should be in before the
shutter opens**. On the `draft` channel the behaviour scripts are live, so the
state produced is the real one — the actual modal, opened the actual way, not a
reconstruction.

The minimum that answers the prompting case: name a control to activate before
the shot, so the AI can open the sign-in dialog and photograph it. The natural
generalisation is a short ordered list of interactions — activate this, then
this — because a success state needs a field filled and a form submitted, and a
carousel's third slide needs two advances.

## Constraints

- **The picture must remain evidence.** Whatever the AI asks for has to have
  actually happened to the page. If a requested interaction cannot be performed —
  no such control, nothing happened, the page never settled — that is a refusal
  that names what failed, not a picture of the page in the wrong state. A tool
  whose output is believed must not return a plausible wrong answer; that is the
  same reasoning [[REQ-154]] used to keep the browser off the network.
- **It names what the operator would name.** The AI should ask to activate "the
  Sign in control", not a CSS selector or an internal attribute. Selectors are
  substrate detail the document layer deliberately does not expose
  ([[REQ-100]], [[REQ-108]], [[REQ-212]] all turn on the AI never naming one),
  and a tool parameter is not the place to hand that back.
- **`edit` remains inert.** This is a `draft`-channel capability. The edit
  channel ships no behaviour by [[REQ-116]], and driving it is [[REQ-215]]'s
  problem, not this one.
- **Failure is loud.** An interaction that half-worked must not photograph
  quietly.

## The second, cheaper half

Independently of driving the page: **a picture should say which channel it is
of, and what that channel does not do.** A `kind: 'edit'` picture returned with
one sentence — *behaviour is off in this channel; panels, carousels and
disclosures show their settled state* — would have ended the prompting exchange
before it started, because the AI would have known the page it was looking at was
not the page a visitor gets.

This is worth shipping first. It is a caption, it costs nothing, and it converts
the failure mode from "the model invents a mechanism" to "the model reads the
label".

## Related

[[REQ-215]] is the operator-facing half of the same problem — carrying page
state across a channel switch. Both want a handle on "which panel is open" and
should be designed together even if they ship apart.


---

## What was built

### `after` — a short ordered list, in a closed grammar of two forms

A picture of the site's own draft may carry `after`: an ordered list of short
phrases saying what to do to the page before the shutter opens. There are
exactly two forms and no third, which is [[REQ-212]]'s own argument about its
two disclosure verbs applied here — every general *do X to Y* vocabulary ends as
a scripting language with a parser in front of it, at which point what a caller
can make a page do is no longer bounded:

- `click "Sign in"` — activate the control called that.
- `fill "Email" with "someone@example.com"` — put that text in the field called
  that.

The steps are carried out **in order**, one at a time, and the run stops at the
first failure — a panel's Close cannot be found until the panel is open, so
carrying on past a failure would produce a second, misleading refusal about the
state the first failure prevented.

Quoting a name is optional and is what to reach for when the name itself
contains the word `with`. Anything that is not one of the two forms is refused,
and the refusal states both forms rather than only saying no.

A menu is set by **the words a person reads on it** rather than by the value the
markup carries: `fill "Country" with "United Kingdom"` matches the option's
label first and its value second, because a value attribute is a developer's
word and this vocabulary is deliberately the operator's.

### Naming, and what "cannot be performed" covers

A control is named the way an operator would name it, matched against what the
page actually calls itself — a field's label, `aria-label`, a control's visible
words, a placeholder. There is no way to name a selector, an id or an attribute,
and the surface says so in its own absences.

Every one of the following is a refusal that names what failed, and produces
**no picture at all**:

| What happened | What the refusal says |
|---|---|
| Nothing on the page carries that name | lists what is actually there |
| Several things carry it | says how many and which, and asks for an exact name |
| Something carries it but is not visible yet | says so, and that whatever holds it must be opened first |
| A click that changed nothing | names the control it clicked |
| A field that did not take the value | says what it still reads |
| The page never settled | says how long it was given |

Visibility is decided by an ancestor walk over computed style, not by a
rectangle: a closed panel's own Close control is `display: none` through its
shell, which is exactly the case that has to be excluded so that a header's
"Sign in" is not read as ambiguous against the "Sign in" inside a panel nobody
has opened.

"Nothing happened" is decided by fingerprinting the page — its markup, its
scroll position and what holds focus — before and after. The element is focused
*before* the fingerprint is taken, because focusing is how a click arrives
rather than something the click did.

### Which pictures can be driven, and why the rest refuse

`draft` only, and each of the other four refuses for its own stated reason
rather than under a blanket rule: `edit` ships no behaviour at all ([[REQ-116]])
so there is nothing on it to open — driving that channel is [[REQ-215]]'s
problem; `reference` is a recording of a page rather than a page; and
`revision` and `url` are live systems belonging to the published site and to
strangers, where a click would really submit a form or really send a request.

Both the refusal by kind and the refusal of an unreadable phrase happen **before
a browser is leased**, so an obviously bad ask does not cost a metered session.

### Two technical consequences

- **A driven shot is laid out at the width it is driven at.** A control that
  only exists below 768px cannot be clicked on a page laid out at 1280, so a
  step named at `mobile` would refuse correctly and uselessly. An undriven shot
  keeps its existing load-wide-then-resize behaviour exactly.
- **The value gates are driven the same way.** `check_fidelity` reads a live
  page for its value manifest; a manifest read off the closed page while the
  picture beside it shows the open one would be two readings of two different
  states reported as one reading of one page.

## The second half, as shipped

An `edit` picture carries a caption — one sentence saying that the channel ships
no behaviour, that panels, carousels and disclosures show their settled state,
and that a `draft` picture is what shows a visitor's page. It travels on the
same text block that already says what was looked at, so a transcript with the
image redacted out still carries both.

It also travels with a **measurement**, not only with an image: `compare`
reports the caveat when either side came from that channel, because a comparison
against a page whose behaviour is off is exactly where a wrong conclusion gets
drawn confidently.

## Where the code is

- `tools/generate/src/cli/capture/interact.ts` — new. The grammar, the page-scope
  script, and `drivePage`.
- `tools/generate/src/cli/picture.ts` — `after` on a picture source, the
  draft-only rule, the channel caption.
- `tools/generate/src/cli/capture/screenshot.ts` — drives between navigate and
  shutter.
- `tools/generate/src/cli/ai/fidelity-core.ts` — the caption on the block the
  model reads and on a comparison; the value gates driven alike.
- `tools/generate/src/cli/ai/fidelity-surface.json` — `after`, the
  `INTERACTION_FAILED` refusal, the two new absences, surface_version 3.

## Test plan

`tests/test_UAT_FC_REQ-216_drive_the_page.test.ts`. The page is the sign-in
shape this ticket describes, put through the shipped L1 renderer with the vetted
modal script the renderer emits; the interaction script is the shipped one, run
in page scope. Only the browser is doubled, and it is jsdom rather than a stub.
The load-bearing observation is which panels stood open **at the moment the
shutter was called** — a picture taken of the closed page while reporting the
step succeeded is the failure this ticket exists to make impossible, and no
assertion about a return value would catch it.

## Deliberately not in scope

- Driving the edit channel — [[REQ-215]].
- A third verb, or any way to say something the two forms cannot.
- Naming any part of the page by selector.
