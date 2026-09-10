---
uid: bug-af5e6965
id: BUG-75
type: bug
title: capabilities.js is a syntax error — no behavior module client code runs
created_by: REQ-212
created_at: '2026-09-10T20:23:03.804692+00:00'
updated_at: '2026-09-10T20:23:03.804692+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
---

# `capabilities.js` is a syntax error — no behavior module has run since 2026-09-05

## Symptom

On every site, in the `draft` and `published` channels, **no behavior module's
client code runs at all**. Each module fails differently, and each failure reads
as its own separate design question rather than as one shared defect:

- **account-chrome** — the sign-in dialog renders inline at the top of the page,
  open, and never becomes an overlay. Clicking "Sign in" does nothing. This is
  the symptom that surfaced the bug, on 1st Contact's own home page.
- **contact-form** — submitting posts natively and navigates the visitor off the
  page instead of swapping the success message in inline.
- **carousel** — no autoplay, no dot indicator.
- **account-portal** — identity and holdings lines stay blank; the erasure
  explanation stays expanded.

## Root cause

`packages/framework/src/modules/module-assets.ts` exports `MODULE_CLIENT_JS`, the
concatenation of every catalogued behavior's `client.js`. `renderSiteFiles`
writes it as `capabilities.js` and the page references it as
`<script type="module" src="./capabilities.js">`.

The concatenation is `jsParts.join('\n\n')`
(`tools/generate/src/cli/module-assets.ts`) — a flat splice into **one module
scope**. Three behaviors each declare `ERROR_SELECTOR` at top level:

| behavior | value |
|---|---|
| `contact-form` | `'[data-contact-error]'` |
| `account-portal` | `'[data-account-error]'` |
| `account-chrome` | `'[data-account-chrome-error]'` |

Two `const` declarations of one name in one scope is a **parse-time** error, so
the browser discards the whole file before executing a line:

```
SyntaxError: Identifier 'ERROR_SELECTOR' has already been declared
```

Every behavior in the bundle dies, including the ones whose own names never
collided.

## Why it went unnoticed for five days

The bundle broke at `03f961b34c` (2026-09-05), where `account-portal` introduced
the second `ERROR_SELECTOR` alongside `contact-form`'s. `account-chrome`
(`9ff59758e8`) added the third the next day.

Each behavior's `client.js` is unit-tested **individually**, by importing the
source file. The [[REQ-145]] UAT asserts that `module-assets.ts` still matches
its sources — byte equality, not validity. **Nothing anywhere parses the composed
bundle.** Every input is correct; the composition is not, and the composition is
what ships.

The symptom was also disguised by the substrate working as designed. Each module
is built to fail VISIBLE ([[REQ-200]], [[REQ-183]], [[DOC-37]] §6.2): with no
script, `account-chrome`'s dialog is an ordinary in-flow part of the page, open,
and its address can still be submitted. So the broken page looked like a
deliberate no-JS baseline rather than a failure — which is exactly the property
that makes fail-visible safe, and exactly what let this sit unreported.

## What must change

**The composition must not depend on behaviors choosing unique top-level names.**
Renaming `ERROR_SELECTOR` fixes today's collision and re-breaks on the next
behavior that picks a common name; the identifiers are private to each file and
nothing about authoring one says the namespace is shared.

So each behavior's `client.js` is composed **into its own scope**:

1. Each behavior's source is wrapped in a block, so its top-level `const`, `let`,
   `function` and `class` declarations are block-scoped to it. Two behaviors may
   declare the same top-level name and the bundle still parses.
2. The `export ` prefix is stripped as part of that wrap, because `export` is not
   legal inside a block. This costs nothing: the bundle is self-wiring — every
   behavior ends with its own DOM-ready auto-init — and nothing imports it. The
   exports exist for the unit tests, which import each `client.js` source
   directly and are untouched.
3. Each behavior keeps its `/* behavior: <id> */` marker so the bundle stays
   readable and attributable.

**The composed bundle must be checked for validity, not just for freshness.** A
UAT parses `MODULE_CLIENT_JS` as an ES module and fails if it does not, so this
class of defect cannot return silently the next time two behaviors agree on a
name.

## Not in scope

[[REQ-212]]'s L1 dialog is unaffected: it emits its own inline `<script>` in the
body (`l1/render.ts`) rather than riding in `capabilities.js`, so modals authored
through the L1 overlay role were never touched by this. The fix does not change
that path.
