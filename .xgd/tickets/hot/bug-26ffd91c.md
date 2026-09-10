---
uid: bug-26ffd91c
id: BUG-76
type: bug
title: 'Sign-in modal: three defects that made a working component look broken'
created_by: martin-github@westhead.me
created_at: '2026-09-10T21:28:05.411826+00:00'
updated_at: '2026-09-10T21:50:36.493430+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-fc674685
  severity: medium
---

# Sign-in modal: three defects that made a working component look broken

## What prompted it

Session `chat-5c9fd79b` (1st Contact's own home page, 2026-09-10). The operator
asked for a sign-in modal. Building it took nine turns, produced a **false bug
report against a component that works**, a duplicate label written into the page,
and a closing message from the AI that was itself wrong.

Three of the frictions in that session are already owned elsewhere and are not
this ticket:

- [[BUG-75]] — `capabilities.js` was a syntax error, so no client script ran and
  the dialog really did sit inline and open. Fixed; this is the "immediate bug"
  the operator refers to at 21:26.
- [[REQ-215]] — switching View→Edit loses the open dialog.
- [[REQ-216]] — `picture` cannot drive the page before photographing it, which is
  why the AI reasoned from a still image and then invented a story about
  "preview mode" to explain what it saw.

What remains is below. All three are confirmed in the code, and all three share a
shape: **the AI was told something false by a reference surface, and had no way
to find out.**

---

## Defect 1 — `emailLabel` is documented as visible and is `sr-only` by design

The operator asked why the sign-in panel showed nothing but a field and a
Continue button. The AI concluded the component's label span "isn't rendering",
told the operator to report a defect to whoever owns the component, wrote its own
copy of the line into the `dialog` slot as a workaround, and warned that the line
would appear **twice** once the component was fixed.

None of that is true. The label renders correctly, with the configured text, and
is **deliberately invisible**:

`packages/framework/src/modules/account-chrome/component.ts`
```html
<label class="account-chrome__label" data-fc-invariant for="…">{emailLabel}</label>
```

`packages/framework/src/modules/account-chrome/styles.css`
```css
.account-chrome__label { position:absolute; width:1px; height:1px; margin:-1px;
                         overflow:hidden; clip-path:inset(50%); … }
```

That is the standard screen-reader-only clip, and the CSS comment says so
plainly — *"removed from the visual flow so it neither paints nor displaces the
L1 layout. Obligation, not styling — which is why a designer cannot vary it."*

Every surface the AI could read said the opposite:

| Surface | What it says |
|---|---|
| `meta.ts` config doc | *"The dialog's field label — programmatic, and **visible unless L1 hides it**."* |
| REF-behaviors (`kb-projection.ts`) | *"`emailLabel` — an HTML `span` element; painted by the component itself, never by the page"* |
| `styles.css` | clipped to 1×1px, unconditionally |

The meta comment is simply false — L1 cannot hide it, because it is already
hidden and L1 cannot unhide it. The reference doc says who paints it but never
that it does not paint *visibly*. And the declared element is `span` while the
component emits `<label>`.

Two consequences worth separating:

- **The AI's workaround is the correct permanent answer**, arrived at by
  accident. Its parting advice — "tell me when the component is fixed and I'll
  pull mine out, or it will show twice" — is wrong and would cost another cycle.
- **A false defect was escalated to the operator** about a component that is
  behaving exactly as designed.

### Defect 1b — the field cannot be labelled at all from config

Follows directly. `account-chrome`'s only label is the clipped one, and unlike
`contact-form` it has no in-field option:

- `contact-form` — `labelMode: 'visible' | 'placeholder'`, and `placeholder`
  puts the words inside the box.
- `account-chrome` — no equivalent. `emailLabel` sets text that never paints.

So a sign-in panel authored purely from config ships a bare field with no visible
prompt of any kind. The AI reported this half correctly.

**Note the two surfaces already disagree about invariant controls**, which is
what let the AI think it might style this one: `editBehaviorList`
(`tools/generate/src/cli/edit.ts`) *filters invariant controls out* of the
catalogue — its comment says offering one "would invite a caller to try — which
the contract then refuses, for a reason that reads as a bug" — while
`kb-projection.ts` lists them. The AI read the doc, not the tool.

---

## Defect 2 — undeclared config keys are accepted silently

The AI passed `account: "https://app.1stcontact.io/account"` to `account-chrome`.
That key belongs to `account-portal`. It was stored, echoed back in `changed`,
and never questioned — it is still in the instance config today.

`packages/framework/src/modules/behavior.ts`
```ts
export function validateBehaviorConfig(meta, config) {
  const errors = []
  for (const [name, spec] of Object.entries(meta.config)) {
    validateConfigField(`config.${name}`, spec, c[name], errors)
  }
  return errors            // ← nothing ever looks at keys of `c` not in meta.config
}
```

The loop is over the *declared* names only. A key the contract has never heard of
cannot produce an error, so a typo or a misremembered setting is stored, reads
back verbatim, and does nothing. This is the one failure mode the L1 side is
strict about (`.strict()` everywhere) and the component side is not.

---

## Defect 3 — a schema error inside a slot collapses to "Invalid input"

Asked to move Close to an ✕ in the top right, the AI's `set_l1` was refused with:

```
/pages/0/modules/1/slots/dialog: Invalid input
```

That names the slot root and nothing else. The actual fault was `lineHeight` on a
control node's `axes` — the vocabulary is `lineHeightPx`, and axes are `.strict()`.
The AI had to search the reference and re-derive; its own account was *"I used a
couple of field names that don't exist."*

The same class of mistake **in the page's own `l1` tree** reports precisely:

```
/pages/0/l1/root/children/1/axes: Unrecognized key: "backgroundGradient"
```

The difference is not accidental. `packages/site-schema/src/issues.ts` exists
specifically to unbury union failures, and it works — but it needs to identify a
discriminator, and the slot position wraps the node union in a *second* union:

`packages/site-schema/src/schema.ts:489`
```ts
slots: z.record(z.string(), z.union([l1NodeSchema, z.array(l1NodeSchema)])).optional(),
```

`chooseBranch` looks for a branch excluded by a mismatched literal at path
length 1 (`kind`). Neither branch of *this* union fails that way — one fails
`invalid_type` (expected array), the other fails `invalid_union` — so no tag is
discovered, `chooseBranch` returns `null`, and the outer union's own default
message ("Invalid input") is kept at the slot's path.

**So every schema error anywhere inside a behavior slot's subtree is opaque,
while the identical error in the page tree is precise.** Behavior slots are
exactly where modal and dialog authoring happens.

### Defect 3b — an unknown `kind` reports "Invalid input" too

Earlier in the same session, `kind: "picture"` (the real name is `image`)
produced:

```
/pages/0/l1/root/children/0/children/0/children/0/children/1: Invalid input
```

Here `issues.ts` behaves as designed — no branch survives, so nothing is guessed.
But the message retained is Zod's default. The path is right and the sentence is
useless; naming the tag (`kind 'picture' is not one of: text, image, slot,
control, box, container`) costs nothing and is the single most self-correctable
message the envelope could emit.

### Defect 3c — only the first error is reported

`validateOrThrow` (`tools/generate/src/cli/edit.ts:294`) throws on
`result.errors[0]`. A payload with two invented field names takes two round
trips to discover both.

---

## Defect 4 — the modal has no second screen, and three separate things stop it

The operator's brief, verbatim: *"clicking the continue will replace that content
in the modal with a message — 'Please check your email. If you are already a
member we have just sent you a sign up link.'"*

It does not advance. Three independent causes, any one of which is enough.

### 4a — it was never built to swap; the message is additive

`client.js` `submitAddress` un-hides a paragraph and disables two controls. It
never removes or hides the address field, the Continue button, the ✕ or the
label:

```js
if (sent) sent.hidden = false
for (const node of [email, form.querySelector('button[type="submit"]')]) {
  if (node) node.disabled = true
}
```

So the panel does not *become* the confirmation — it grows one more line beneath a
greyed-out form. `contact-form` faced the same requirement and answered it with a
real swap:

```js
root.innerHTML = successHtml || '<p>Thanks — your message has been sent.</p>'
```

Two components, one requirement, two different answers, and the sign-in one
does not satisfy the brief it was given. `sentMessage`'s own doc comment reasons
carefully about *what* the message says and never about *what it replaces*.

### 4b — the configured endpoint is not a route, and it is cross-origin

The instance is configured with:

```
signIn: "https://app.1stcontact.io/auth/request-link"
```

There is no such path anywhere in the codebase. The real endpoint already exists
and is `POST /sign-in` (`apps/control-app/src/sign-in.ts`, [[REQ-202]]) — one of
four routes deliberately matched ahead of the Access gate. The AI told the
operator these were "placeholders your engineers will need to point at whatever
actually handles sign-in", when a working endpoint was already there to be named.

The consequence is not a quiet 404. `client.js` deliberately never reads the
response, so a 404 would still count as *completed* and show the sent message.
But this POST is **cross-origin** and carries `Content-Type: application/json`,
so it takes a CORS preflight; with no CORS headers coming back the `fetch`
**rejects**, and a rejected fetch is the one case routed to the error paragraph
instead:

```js
} catch (_e) {
  if (error) error.hidden = false
  return          // ← returns before the sent message and before disabling
}
```

So on the draft preview, Continue produces the error state, not the sent state —
and because the `return` precedes the disable, the button does not even grey out.
Nothing visibly happens.

### 4c — even on the success path, the message paints outside the card

`sent` and `error` are emitted as direct children of the `<form>`, siblings of
the authored dialog subtree:

```html
<form class="account-chrome__dialog" …>
  <label class="account-chrome__label" …>          <!-- clipped, Defect 1 -->
  {the L1 dialog slot — the 380px card the AI styled}
  <p class="account-chrome__sent"  data-fc-invariant hidden>…</p>
  <p class="account-chrome__error" data-fc-invariant hidden>…</p>
</form>
```

Once enhanced, that form *is* the overlay:

```css
.account-chrome[data-account-chrome-enhanced] .account-chrome__dialog {
  position:fixed; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center; background:rgba(0,0,0,0.5);
}
```

So the two message paragraphs are column flex items **outside** the card,
centred on the 50%-black scrim. Their only styling is
`.account-chrome__sent, .account-chrome__error { margin: 0 }` — no background, no
colour — so they render in the page's default dark ink on a dark scrim.

And they cannot be fixed from the page: both are `data-fc-invariant`, painted by
the component, bound to no slot node. **This is Defect 1 again, on two more
elements.** Three of this component's four text surfaces — the field label, the
confirmation, the error — are component-painted, unstyleable, and positioned
outside the region the author controls.

### Why the tests did not catch it

`test_UAT_FC_REQ-200_account_chrome.test.ts` asserts exactly what the code does:

```ts
expect(outcomes[0]).toBe('false|Check your email for a sign-in link.|true')
```

`sent.hidden === false` is true, and the message is identical at 202/404/500 —
which is the [[REQ-134]] property that test exists to defend, and it holds. What
no test asks is whether the panel now *reads* as a confirmation: whether the form
is gone, whether the message is inside the card, whether it is legible against
what is behind it. The unit test is in JSDOM, where the overlay CSS does not
apply and geometry does not exist.
---

## What this cost

The component was correct throughout. Every turn spent on it went to
distinguishing "the component is broken" from "the documentation is wrong" from
"my field name is wrong" — and the AI got that call wrong twice: once inventing a
preview-mode story ([[REQ-216]]), once filing a false defect (Defect 1).

The unifying rule this argues for: **a reference surface that describes a
component is generated from the component, or it is a liability.** Defect 1 is a
hand-written doc comment that contradicts the CSS three files away. Defect 2 is
a validator that cannot see what it was not told to look for. Defect 3 is a
correct error-localiser defeated by a schema shape it was never shown.

---

## Scope question for the operator

This is one investigation and four unrelated fixes, in three packages:

1. `account-chrome`'s three invariant text surfaces — the field label, the sent
   message, the error — none of which the page can style or position
   (Defects 1, 1b, 4c)
2. The sign-in dialog does not swap to a confirmation state (Defect 4a), and the
   site is configured against an endpoint that does not exist when a real one
   does (Defect 4b — arguably a config fix, not a code one)
3. Behavior config strictness (`behavior.ts`, Defect 2)
4. Slot-error localisation (`site-schema`, Defect 3)

They can be one free-coded cycle or several. [[BUG-77]] is open and untitled —
say the word and I'll split, or keep all four here.

## Test plan

To be decided once scope is settled. Sketch, per defect:

1. Render `account-chrome` and assert the configured `emailLabel` text is present
   and clipped; assert the catalogue/reference text matches that behaviour.
   Plus, for 1b, whatever the chosen answer is (a `labelMode`, or documenting
   page-authored text as the route).
2. `configure_component` with a key the behavior does not declare is refused,
   naming the key and the declared set.
3. `set_l1` into a behavior slot with a bad axis key reports the offending path
   and key, matching what the same node reports in the page's own `l1` tree; an
   unknown `kind` names the valid kinds.
4. After a completed submit the address field and submit control are no longer
   presented, and the confirmation is inside the authored card rather than a
   sibling of it — asserted on rendered geometry, not only on `hidden`, since
   `hidden` is precisely what the existing UAT already proves and it was not
   enough.
