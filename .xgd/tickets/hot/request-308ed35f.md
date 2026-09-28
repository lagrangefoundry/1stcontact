---
uid: request-308ed35f
id: REQ-340
type: request
title: The host derives a structural diff of a delegation's L1 changes
created_by: EPIC-20
created_at: '2026-09-27T22:31:20.497785+00:00'
updated_at: '2026-09-27T22:33:34.382137+00:00'
completed_at: null
last_field_updated: epic_children
status: draft
fields:
  epic_parent: epic-0923bb64
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c53f13d1
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

## Dependency

Blocked on the upstream hook — the framework ticket *"a delegation result must account
for the work whether or not the worker reports"* in lagrange-framework, which supplies
the hook this derivation is handed to and the result field it is carried on. Nothing in
this ticket belongs upstream and nothing upstream belongs here.

## Not in scope

The worker's report, the iteration cap, the grants, and the prose. Whether the change was
*right* remains judgement and stays with the consultant: the diff is trusted as a record
of what changed and makes no claim about whether it should have.