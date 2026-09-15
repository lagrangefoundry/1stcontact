---
uid: request-4b60eae1
id: REQ-250
type: request
title: Publish refuses a site with no address, and the refusal offers the way out
created_by: EPIC-5
created_at: '2026-09-15T23:21:40.996562+00:00'
updated_at: '2026-09-15T23:21:40.996562+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-c5175c8f
  auto_merge_back: true
  needs_review: false
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
