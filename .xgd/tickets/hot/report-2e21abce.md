---
uid: report-2e21abce
id: REPORT-3729
type: report
title: 'Fix Framework Substrate: L1 Layout, Values & Behavior Modules (ac) — attempt
  9'
created_by: xgd
created_at: '2026-09-10T12:13:49.396752+00:00'
updated_at: '2026-09-10T12:13:49.396752+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-ae9d65d6
  level: ac
  fixes_applied: 2
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Framework Substrate: L1 Layout, Values & Behavior Modules (ac)

**Attempt**: 9
**Fixes applied this call**: 2
**Violations remaining**: 0
**Needs more work**: false

Both findings REPORT-95952096 raised as actionable are applied — the one violation
(finding 1) and the four-cycle-old warning (finding 2). Both were `ac-edit`, and both
were applied as scoping edits, not rewrites, exactly as the finding's "Notes for the
Editor" instructed.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-723 (`acceptance_criterion-8db8ef76`, STORY-83) | Qualified the placeholder claim to the unmounted state; deferred the mounted state to AC-1622. |
| 2 | ac-edit | AC-716 (`acceptance_criterion-1eaa93b8`, STORY-80) | Narrowed to the literal; the palette-acceptance half of the colour bullet and the literal-only paragraph replaced by pointers to AC-928 / AC-931. |

### Finding 1 — AC-723 (violation, consistency)

The `ac-edit` half of REPORT-2093 finding 3, unapplied since 2026-08-09, is now
applied. Confirmed the defect first-hand before editing: `packages/framework/src/l1/render.ts:2164-2168`
emits `<div … data-l1-slot="…">${mounted}</div>` with `const mounted = state.mounts?.[node.name] ?? ''`,
so the element is empty only when nothing is bound — AC-723's unconditional "the
placeholder is **an empty element**" was false in the mounted case under REQ-93
(`request-f26cbe32`, free_and_reconciled).

What changed, in the Criterion:

- The opening claim now begins "**When no behavior module is mounted into it**, a
  `slot` leaf reaches the published page as an inert, labelled placeholder …", and
  the "empty element" clause is folded into that same qualified sentence rather
  than left standing as its own absolute.
- One added sentence defers the other state: "The mounted state — where a
  caller-supplied fragment becomes the seam's content — is AC-1622's claim and is
  not described here."
- The attribute half is **untouched in substance**, moved to its own paragraph
  under a lead-in stating it holds "identically in **both** states" — which is what
  AC-1622 independently asserts ("the seam itself is emitted identically in both
  states"). The `data-l1-slot` / `data-l1-behavior` / omission / escaping sentences
  and the REQ-87 rename paragraph are carried verbatim.

In the Verification, the render step is qualified to "with no mount supplied for any
seam" and the observation adds "each is an empty element"; the three cases, their
attribute assertions and the `data-l1-capability` negative are unchanged. A closing
sentence points the mounted state at AC-1622.

**AC-1622 was not touched**, per the finding's explicit instruction — it is the newer
and correct element, and reversing the direction of the fix would restore the false
absolute the story-level cycle removed from STORY-83's body over two attempts.

**No parallel `story-body-edit` was needed.** STORY-83's body already states the
qualified form ("With no mount supplied it is the inert labelled placeholder"), so
the matrix is consistent at this call boundary rather than inconsistent in the other
direction.

A first draft of this edit also added a Verification clause asserting the attribute
rules under a mount. It was trimmed before the final write: AC-1622's Verification
already owns the both-states seam comparison, and carrying it in AC-723 too would
have re-opened precisely the duplication finding 4 records as resolved.

### Finding 2 — AC-716 (warning, exclusivity)

Carried unrepaired since 2026-08-08 and unblocking, but STORY-80 was open for this
pass, so it was taken. Both duplicated clauses are removed and replaced by named
pointers, keeping AC-716's own uncovered subject — the literal as the base of the
value model, envelope-bounded:

- Colour bullet: the `**or** a reference into the site palette which resolves to a
  hex before anything paints` half is deleted (AC-928's headline claim in full) and
  replaced with "That the same axis *also* accepts a reference into the site palette
  is AC-928's claim, not restated here." The hex-literal acceptance and the non-hex
  rejection stay, since they are AC-716's own.
- The literal-only paragraph — near-verbatim AC-931 bullet 2 — is replaced by "What
  a literal-only document is guaranteed against the palette widening … is AC-931's
  claim", with the retained half ("a captured site's concrete values land verbatim,
  with no inference") kept as AC-716's own framing.
- The length / geometry / radius bullet is untouched, as the finding directed.
- Verification loses "the same document validates and renders identically with no
  palette declared" (AC-931's to verify) and gains a pointer to AC-928 / AC-931.

## Code Edits

None this call. No production code was read as defective — `render.ts:2150-2168` was
read only to confirm which of the two contradicting ACs was wrong, and it agrees with
AC-1622.

## Verification

Ticket bodies re-read after write; both landed as intended. The retained claims were
re-confirmed against the implementation on this branch rather than assumed:

| Suite | Result |
|---|---|
| `tests/req93-l1-slot-mounted-behaviors.test.ts` | 10 passed |
| `tests/reconciliation-l1-substrate.test.ts` | 6 passed, 2 skipped |

Both ACs keep `uat_coverage: pass`: neither edit adds a verification obligation (both
were pure narrowings), and `tests/req93-l1-slot-mounted-behaviors.test.ts:352-357`
already exercises the seam attributes in both the bare and the mounted state.

## Not Actioned (deliberate)

| Element | Why |
|---|---|
| AC-1622, AC-1623, AC-1624 status `pending` (finding 5, info) | Resolution "none". The report identifies this as the ticket type's creation default and states the uat-level cycle is the natural place for promotion. Setting it here would be field-ownership drift, not progress. |
| Findings 3, 4, 6 | Info rows recording closed REPORT-2093 items; no action requested. |

## needs_review Items Forwarded

None. Both actioned findings cite `free_and_reconciled` intent (REQ-93 for finding 1;
REQ-114 / REQ-137 for the AC-928 / AC-931 ownership finding 2 rests on) and were
settled against the implementation on this branch.
