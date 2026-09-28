---
uid: request-308ed35f
id: REQ-340
type: request
title: The host derives a structural diff of a delegation's L1 changes
created_by: EPIC-20
created_at: '2026-09-27T22:31:20.497785+00:00'
updated_at: '2026-09-28T19:25:20.475664+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  epic_parent: epic-0923bb64
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c53f13d1
  story_points: 5
  commits:
  - working_sha: d16e92d920b14b46042d6bd1741cf39b0fa5f896
    reconcile_sha: null
    main_sha: null
  - working_sha: 2f2c0b0b1b13e56118c3e9a95f31cebfa25fc47e
    reconcile_sha: null
    main_sha: null
  version: 0.2.398
---

## Why

**DOC-60** §"1. The host derives a diff, and returns it beside the self-report" — the
design's keystone.

Everything in a delegation result today is the worker's word; the `delegate` operation
declares `provenance: "untrusted"`. So a worker that reports nothing leaves nothing, and
a worker that reports wrongly is not contradicted. Two of the seven delegations that have
ever run returned `outcome: silent` with real element writes committed on the site.

## Behaviour

1. **When a delegation begins the host captures the state of the site's draft; when it
   ends the host compares the two and derives a structural diff.** The diff is the
   host's own record, read from the store, and no part of it comes from anything the
   worker says.

2. **The diff names, for each difference, the page, the element address, the field path
   within that element, and the value before and after.** A field that did not change
   does not appear in it. An element in which nothing changed does not appear in it. A
   field that did not exist before is shown as newly present rather than as a change
   from nothing.

3. **A delegation that changed nothing yields an empty diff**, and an empty diff is
   distinguishable from a diff that was never taken.

4. **The diff is returned beside the worker's self-report, not instead of it.** Both are
   present on the result; the worker's account and the host's record are separate fields
   and are never merged.

5. **The diff is derived by comparing document state, not by accumulating per-write
   records.** Two reasons, both in DOC-60: the brief template itself warns that element
   addresses regenerate after every write, so path-keyed per-write records can misalign
   against a tree that has moved under them; and the existing change journal records a
   *text rendering* of before and after, bounded at 300 characters, which is identical
   on **276 of the 337 `l1.set` records (82%)** on the real log — because a padding,
   colour, font-size or layout edit does not change an element's text, and that is most
   of what a worker does.

6. **The diff speaks for the window between the two captures and attributes nothing to
   an actor.** If something other than the worker writes to the draft while the
   delegation is in flight, that write appears in the diff. This is a stated property
   rather than a defect: the delegating session is blocked awaiting its worker, so the
   only other writer is a different session or the page editor. It must be documented
   where the diff is described, so a reader never mistakes the diff for an attribution.

7. **The diff costs what the change costs, not what the page costs.** Both captures and
   the comparison are host-side and add no tokens; only the diff enters the
   conversation. Measured on a real run: the complete diff for one element write was
   **287 bytes, 15% of the 2,582-byte element**, about 72 tokens.

## Dependency — resolved

The upstream hook landed: lagrange-framework `561fe47a28`, *"a delegation result accounts
for unreported work"* (BUG-71). It settles the contract this ticket was waiting on —
`account: {from, to, changed}` on the result, a bracket the caller can check the record
against, and the rule that the derivation is the host's because what the work touched is
a fact about the host's domain.

## What was built

A new `tools/generate/src/cli/ai/account-core.ts`. Nothing else was added; every read it
makes is an existing `SiteStore` verb and every path-level comparison is the one
`1c status` and the per-turn digest already make.

**A capture is the whole draft definition, not only its L1 element trees.** `site.json`,
every page, and every asset — the last by content digest through `assetManifest`, which
reads no bytes and answers with a real SHA-256 on every adapter, rather than through
`draftOutline`'s own stamp, which is documented as opaque and is the byte length on two
of the three tiers. Behaviour 3's empty diff is only *honest* if the capture is
comprehensive: a worker that moved only a page's background would otherwise return an
empty diff, which is the exact false negative the record exists to prevent. It also means
the record still works after REQ-341 widens the builder's grant.

**The cheap question runs first.** `diffOutlines` already answers *which paths moved*, so
the expensive descent happens only into the pages that actually changed. A worker that
touched one element on one page of forty costs one page's walk.

**Siblings are aligned, not indexed.** One minimal-cost alignment serves both the element
tree and every list below an element. A band inserted at the top of a page is one
addition; a position-wise walk would report every band behind it as rewritten — a page's
worth of difference for a page's worth of nothing, which is exactly the cost behaviour 7
forbids. The cost function is the whole of the judgement: identical nodes cost nothing,
same-kind nodes cost one (so an edited heading reports the field that changed), and
different-kind nodes cost more than the add/remove pair that replaces one with the other.

**Locators, in four vocabularies.** `page` + `address` (+ `module`/`slot` when the element
sits inside a component instance, because an address without that scope reaches somewhere
else) for a field of an element; `page` alone for a field of the page's own definition;
`asset` for a file; none of them for `site.json`. `field` is the dotted path within
whatever the locators named, and `''` means the thing itself — an element that was added
or removed has no field that changed, it *is* the change. `before` and `after` are
**absent**, never null, when the thing did not exist on that side.

**Values stay structured** rather than being rendered into DOC-60 §1's hand-compacted
form. The Toolbox already serialises results; a bespoke renderer would be a second thing
to maintain and a lossy one. Measured cost is still a small fraction of the element.

**A bounded total, stated when it bites** — `DIFFERENCE_LIMIT` entries and
`DIFFERENCE_BUDGET` serialised characters, with an explicit `truncated: N` count rather
than a silent cut. It exists for the case the requirement cannot otherwise bound: a whole
page added or removed inside the window carries its whole definition, honestly, because
that *is* the change.

## How it reaches the result — and the one upstream thing left

BUG-71's field and its prose are reused exactly; what is **not** used is
`DelegationRuntime`'s `account: {mark, changes}` hook. Both of its functions are called
**synchronously** — `mark(ctx)` and `changes(ctx, from, to)` are used as values, never
awaited — and this host's record comes from a `SiteStore` whose every verb is async
because D1 and R2 are. A hook returning a promise would put a promise on the result,
which serialises to `{}`: worse for the caller than no field at all.

So the bracket is taken by subclassing `DelegationToolbox` and overriding its public
`delegate` operation, where an await is available. That is the framework's own documented
extension mechanism (`ToolboxSurface` says to subclass it and define one method per
declared operation; `invoke` resolves the method per call), so it is composition rather
than a reach past the API. The window is marginally wider than the framework's — it opens
before the worker's session is opened rather than just after — and encloses exactly the
same work, because opening a session writes nothing to the draft. The record never fails
the delegation: a capture or a comparison that throws costs the field and nothing else.

**The upstream fix is one word in two places** — `await this._mark(ctx)` and
`await hook.changes(...)`, which a synchronous hook passes through unchanged. When it
lands, this class becomes a `runtime.account` pair and the override is deleted. Not filed
here; it belongs to lagrange-framework.

**One install step is outstanding and is the operator's.** The shared artifact store at
`/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai` predates BUG-71, so its
`delegation_surface.json` does not yet declare `account` in `shapes.result`. The field
still reaches the caller — the end-to-end UATs below prove it does — but the model is not
yet *told what it means* until `bin/install --lang js --component ai` is run from
lagrange-framework. That install updates a store shared with sibling projects, so it was
not run unasked.

## Test plan

**`tests/test_UAT_FC_REQ-340_the_host_records_what_a_delegation_changed.test.ts`** — 11
UATs, every one driving a real `edit*` entry point against the real store port:

- a worker that reports nothing still leaves a record (behaviour 1);
- a difference names page, address, field and both values — over a *paint* change, which
  is precisely the case a journal-derived record cannot see (behaviours 2 and 5);
- a field that did not exist is newly present, with `before` absent (behaviour 2);
- an unchanged element and an unchanged field never appear (behaviour 2);
- a delegation that changed nothing yields an empty diff, with the bracket still moved so
  it is distinguishable from a record never taken (behaviour 3);
- an inserted band costs one addition, not a rewritten page (behaviour 7);
- the record costs a fraction of the page it is about (behaviour 7);
- a write inside a component carries the `module` and `slot` its address needs;
- a change that is not on a page — a setting, a picture — is named in its own vocabulary;
- the record speaks for the window and attributes nothing: two writers, both reported
  (behaviour 6);
- a record that hit its budget says how much it left out.

**`tests/test_UAT_FC_REQ-340_the_result_carries_the_hosts_record.workers.test.ts`** — 2
UATs for behaviour 4, driving the real `POST /api/ai/prompt` route inside workerd: the
real session manager, the real delegation surface out of the shared store, the real tool
loop on both sides, a real D1 and R2, and a real `set_l1` through the builder's own grant.
The only double is the Anthropic client, which is the network.

- the record and the self-report are both present and separate — `summary`/`changed` are
  the worker's claims, `account.changed` is the host's, and neither is folded into the
  other;
- a worker that reports nothing still returns what it changed, which is the failure the
  requirement was written for.

Regression scope run green: the four delegation workerd suites (REQ-295, BUG-145,
REQ-296, this one) and the node-side store/digest suites REQ-303, REQ-304 and the storage
port reconciliation.

## Not in scope

The worker's report, the iteration cap, the grants, and the prose. Whether the change was
*right* remains judgement and stays with the consultant: the diff is trusted as a record
of what changed and makes no claim about whether it should have.