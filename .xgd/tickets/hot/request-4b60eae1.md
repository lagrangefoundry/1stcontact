---
uid: request-4b60eae1
id: REQ-250
type: request
title: Publish refuses a site with no address, and the refusal offers the way out
created_by: EPIC-5
created_at: '2026-09-15T23:21:40.996562+00:00'
updated_at: '2026-09-16T00:39:35.284891+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  epic_parent: epic-c5175c8f
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-93dde5b3
  story_points: 2
  commits:
  - working_sha: 1834af666346960da6d50a54dff28e1db04ea855
    reconcile_sha: null
    main_sha: null
  - working_sha: 59a08042ba955b455725c94acbf833695e29237e
    reconcile_sha: null
    main_sha: null
  version: 0.2.209
---

## What this is

**The refusal already exists. This ticket is where the customer finds out.**

[[REQ-238]] put the publish gate on the server: `POST /api/publish` refuses a
site with no address with 409 and a sentence naming the two things that would fix
it (`router.ts:3093`, and the route comment at `:3056` explains why the second
409 came back). That part is built and correct and is not touched here.

What happens to the refusal today is that `app.js:541` hands it to
`block.fail(message)` — the publish progress block — so the most consequential
refusal in the product is delivered in the same place as *"the ladder was larger
than one request."* It is a line of grey text where the site was going to appear.

## The modal

Hitting Publish with no address opens a dialog, in the shell from `modal.js`:

> **Your site needs an address before it can go live.**
>
> There is nowhere for anyone to type yet. Choose your free web address, or
> connect a domain you already own — either one is enough.
>
> `[ Not now ]`  `[ Choose my web address ]`

**The modal is not the point. The button is.** A dialog that only says no leaves
the customer exactly where they were, and the customer who hits this is by
definition the one who does not know what an address is — so the refusal carries
the route out of itself. `[ Choose my web address ]` opens the Settings tab with
the hostname section in view, which is [[REQ-249]]'s section.

**It names both fixes and does not name one.** The gate asks *does this site have
at least one address*, over a list that has two kinds ([[REQ-238]]'s own
falsifier). The sentence says the same thing, so the day custom domains land the
copy is already right. The second half is not yet a button, because there is not
yet anywhere for it to go.

## What it is refusing on

**The 409 the server already sends, and nothing computed in the client.** The
builder does not read the business's addresses to decide whether to offer the
Publish button, does not grey it out, and does not check anything before posting.
A client-side pre-check would be a second implementation of the gate that can
disagree with the real one, and the disagreement would be invisible until it let
a publish through.

So: Publish is always pressable, the post always happens, and the modal is a
rendering of the answer.

## Where it is distinguished from every other publish failure

`streamPublish` throws an `Error` carrying `parsed.error` for any pre-stream
refusal (`api.js:611`), so by the time `app.js` sees it, a missing address and an
invalid draft are the same shape. **The status has to survive the throw** for this
modal to know it is the one to open. Everything that is not the address refusal
goes on reaching `block.fail` exactly as it does now — this ticket adds one
branch and changes no existing path.

## How it tells this refusal from the others

**On the code the Worker already names, not on the prose and not on the bare
status.** `router.ts` answers this 409 with `code: 'NO_PUBLIC_ADDRESS'` beside the
sentence. `streamPublish` now attaches both the `code` and the HTTP `status` to
the `Error` it throws, and `app.js` branches on the code. Reading the class of a
refusal out of its sentence would be a second copy of a rule the Worker already
applied, and it would break the day somebody improved the sentence; branching on
`409` alone would be wrong the first time this route grows a second refusal with
that shape.

The code is declared twice — `NO_PUBLIC_ADDRESS_CODE` beside the error that
raises it, and `NO_PUBLIC_ADDRESS` in the builder — because the browser client
cannot import the Worker's module. A static UAT pins the two to the same string
and pins the route to sending the constant rather than a third literal. That is
the closest thing to one declaration the runtime boundary allows.

## What the two buttons do

**`Choose my web address`** selects the Settings tab and then reveals
[[REQ-249]]'s hostname section: the section is scrolled into view and its box
takes focus. Either half alone is half a route — the tab without the section
leaves the customer on a pane to search, and the section without the tab is a
scroll inside a panel nobody is looking at. The dialog closes after the move, so
it is not sitting over the thing it just asked them to look at. The `reveal()`
this needs is a small addition to the hostname section, safe on a business that
has already chosen (there is no box to focus, so it only scrolls).

**`Not now`** closes the dialog and leaves the builder exactly as it was: the
lock is already off, no failure banner is drawn, and Publish is pressable again —
one press, the same answer, one dialog rather than two.

**`Not now` takes focus**, for the reason the hostname confirm dialog's Cancel
does: a Return press aimed at the Publish button behind the dialog must not land
on a navigation nobody asked for.

## Not in scope

- **Any change to the gate itself**, its wording on the wire, or when it fires.
- **Disabling or hiding Publish.** Named above; it is the falsifier.
- **A route to connecting a custom domain.** The sentence names it; nothing
  behind it is built.

## Falsifiers

- A client-side check of whether the site has an address, anywhere.
- The Publish button disabled, hidden or greyed on the strength of one.
- The address refusal rendered in the publish progress block.
- A modal with no way forward from it.
- Copy that names the `1stc.site` hostname as the only fix.
- Any other publish failure diverted into this modal.
- A dialog built from anything other than `createModalShell`.
- The code branched on as a bare `409`, or read out of the refusal's prose.
- A third copy of `NO_PUBLIC_ADDRESS` anywhere, unpinned by a test.
- The Settings tab opened without the hostname section put in view.