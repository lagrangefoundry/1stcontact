---
uid: request-f26cbe32
id: REQ-93
type: request
title: L1 pages must be able to host behavior modules in their slots
created_by: xgd
created_at: '2026-07-25T20:23:19.017752+00:00'
updated_at: '2026-08-05T17:38:10.028693+00:00'
completed_at: '2026-08-05T17:38:10.028693+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  story_points: 8
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 0e9f4a4938249153fdb75ec1f37d496cb6c79baf
    reconcile_sha: null
    main_sha: null
  version: 0.0.203
  bundled_in: bundle-4ff83a8b
  chat_comment: comment-506604c6
---

## Problem

A captured marketing page is **100% L1 layout plus one behavior module**. That
combination is currently unrepresentable, so the behavioural part of every
reproduction is permanently stranded as a residual.

`pageSchema`'s `superRefine` (added by REQ-88) enforces a strict XOR:

> a page is either a module stack or a raw L1 document, not both

On gigabytealchemy.ai this shows up as four form controls the reproduction can
never render. It is **not** a folder-power gap — the capture already carries
everything the `contact-form` behavior module needs:

| field | a11yRole | accessibleName | nameSource | box @1280 |
|---|---|---|---|---|
| mailing list | textbox | `Your email address` | placeholder | 88, 3900, 313×50 |
| contact | textbox | `Your name` | placeholder | 664, 3784, 528×50 |
| contact | textbox | `Your email` | placeholder | 664, 3850, 528×50 |
| contact | textbox | `Your message` | placeholder | 664, 3916, 528×146 |

(plus `border: 1px solid`, `borderRadiusPx: 8` on each; two distinct forms.)

The fold correctly declines to synthesize raw `<input>` leaves — per DOC-25/26 a
form control belongs to a vetted behavior module, not to L1. So the fold is
right, the capture is sufficient, and the page shape is the only thing missing.

`l1SlotSchema` already anticipates the seam: it carries `name` and `behavior`.
What does not exist is the page's ability to **bind a module instance to a slot
inside its L1 tree**.

## Why the XOR was right, and what it should say instead

The XOR's real intent is *no two competing page bodies* — a page must not have a
module stack and a raw L1 document each claiming to be the whole page. That
intent is preserved by a narrower rule:

> modules may accompany `l1` when each is bound by name to a `slot` present in
> the L1 tree

The L1 document remains the single page body; modules are mounted *into* it at
declared seams, which is exactly the composition DOC-25/26 describe.

## Scope

1. **Schema** — relax the XOR to slot-bound mounting; validate that every module
   instance names a `slot` that exists in the L1 tree, and that no slot is bound
   twice. An unbound module or a dangling slot name is an error, not a silent
   no-op (same principle as REQ-88's `anchor`-without-`column` check).
2. **Fold** — emit a `slot` node (`behavior: 'contact-form'`) at the captured
   controls' union rect instead of a `field` residual. Group controls into forms
   by their enclosing `<form>` / geometric cluster: this page has **two**.
3. **`repro`** — derive the module config from the capture: `fields[]` from
   `accessibleName` + `a11yRole` (+ `type` from the control's input type where
   available, else `text`/`textarea` by height), `action` from the captured form
   action. Absent an action, record a residual rather than inventing an endpoint.
4. **`render`** — mount the module's rendered fragment into the slot, replacing
   the inert `data-l1-slot` placeholder. `renderL1Fragment`'s prefix namespacing
   already exists for exactly this.
5. **Conformance** — the mounted result carries the behavior module's declared
   obligations (safety / security / x-browser / responsive / isolation).

## Acceptance

- The gigabytealchemy reproduction renders both forms with real, a11y-labelled
  controls; `values-diff` reports **0** `missing` deltas for the four fields
  (currently 4 per cell, the worst delta on every cell of the ladder).
- `l1-gate` reports **0** `field` fold residuals for that page.
- A page binding a module to a non-existent slot fails validation with a
  machine-readable error.
- A page with `l1` and an *unbound* module still fails — the XOR's intent holds.

## Notes

Diagnosed in REQ-88 round 8 while closing the operator's list; recorded there in
full so this ticket starts from the diagnosis rather than re-deriving it. REQ-88
introduced the XOR, so this is its natural successor rather than a defect against
it: the XOR was correct for a pure-layout page and is now the binding constraint
on the first page that needs behaviour.


---

## Implementation (delivered)

Landed as one commit (`259f9eb8`, `[FREE-CODED]`, version `0.0.203`).

### Schema — `packages/site-schema`
- `moduleInstanceSchema` gains an optional `slot: string`.
- `pageSchema`'s REQ-88 XOR is replaced by the narrower rule: modules may
  accompany `l1` when **each** resolves to exactly one existing seam.
  `l1/slots.ts` walks the tree and collects slot names; the page refine rejects,
  each with a machine-readable `path`:
  - a module with `l1` present but no `slot` (the XOR's intent — an unbound
    module still fails);
  - a `slot` naming a seam that is not in the tree (dangling);
  - two modules binding the same seam (double-bound);
  - a seam present in the tree that no module binds (orphan);
  - a `slot` on a module when the page has no `l1` at all.
  Duplicate slot *names* inside one tree are rejected as ambiguous.

### Capture — `tools/generate/src/cli/capture`
A captured `field` now carries the two behavioural facts no painted axis can
hold: `controlType` (the resolved `<input type>` / `textarea`) and `formAction`
(the enclosing `<form action>`, absent when the form declares none). Both flow
through `extract` → `sections` → `bundle` and are ignored by `values-diff`
(behavioural, not painted).

### Fold — `tools/generate/src/l1/forms.ts` (new) + `fold.ts`
Captured controls cluster into the forms they visibly belong to — grouped by
`formAction` where present, otherwise by rect proximity at the widest sample —
and each group becomes an L1 `slot` node (`behavior: 'contact-form'`, name
`form-N`) pinned at the group's union rect across the width ladder. Previously
each control was dropped as a `field` fold residual.

### Repro — `tools/generate/src/cli/repro.ts`
The same fold that writes `l1.json` writes `forms.json` beside it, so the two
artifacts cannot disagree (an earlier attempt re-folded inside `repro` and had
too wide a blast radius on tests it does not own; a part-stale bundle now fails
loudly instead of silently stranding). `repro` reads `forms.json` and derives
each `contact-form` instance's config from the capture only:
- `fields[]` — `name` slugged from `accessibleName`, `label` verbatim, `type`
  from `controlType` (falling back to `textarea` by height, else `text`),
  `required` from the captured control;
- `action` from `formAction`. **An endpoint never seen is reported as a
  residual, never invented.**

### Render — `packages/framework/src/l1/render.ts`, `tools/generate/src/render`
`renderL1Document` accepts the page's module instances; a `slot` node emits the
bound module's rendered fragment inside the same positioned box instead of the
inert `data-l1-slot` placeholder. `renderL1Fragment`'s existing prefix
namespacing keeps per-instance CSS collision-free.

### Conformance — `tools/generate/src/conformance`
A new `mountInL1` fixture mode runs the universal ACs (safety / security /
x-browser / responsive / isolation) against the *mounted* shape, so a behavior
inherits its obligations in the position it actually ships in.

### Evidence
- `tests/req93-l1-slot-mounted-behaviors.test.ts` — 10 UATs
  (`test_UAT_FC_REQ-93_*`) covering each validation rejection, the fold's
  two-form clustering on the real gigabytealchemy capture, config derivation
  including the missing-action residual, the mounted render, the
  `l1.json`/`forms.json` consistency gate, and the conformance mount.
- `l1-gate` on gigabytealchemy: **0** `field` fold residuals (was 4),
  `contact-form@form-0` and `contact-form@form-1` mounted.
- Full suite green: 111 files / 773 tests.