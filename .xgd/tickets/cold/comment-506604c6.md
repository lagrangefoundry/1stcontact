---
uid: comment-506604c6
id: COMMENT-519
type: comment
title: Comment on request REQ-93
created_by: xgd
created_at: '2026-07-25T20:31:57.736067+00:00'
updated_at: '2026-07-25T21:05:41.491212+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-f26cbe32
  kind: chat_transcript
---

<!-- xgd-turn id="ace0ce65-f602-4b0b-ab9d-a95d65f30df7-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T20:31:55.586547+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="ace0ce65-f602-4b0b-ab9d-a95d65f30df7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T21:01:58.399460+00:00" -->
#### Claude
I'll start by reading the ticket and getting oriented in the codebase.

Now I have the full picture. Let me implement — starting with the schema layer.

Now the module instance `slot` field and the page binding rules:

Now the framework renderer — mounting a rendered fragment into a slot:

Now the page render path in `tools/generate`:

Good. Now the persisted `Field` type and its projections:

Now the fold itself — emitting `slot` nodes instead of `field` residuals:

Now the post-loop slot construction:

Now export the new surface and wire `repro`:

Move the font-resource derivation to a shared home so `repro` can fold with the same substance `capture` does:

Now add a bundle reader for the captured theme fonts:

Now `repro` — fold once, from the retained oracle, and bind the recovered forms:

Now finish the `repro` result and the gate:

Now let me check the CLI command output surfaces for `repro`/`l1-gate`:

Now conformance — exercising the mounted shape (scope item 5):

Now let's typecheck and see what breaks.

Now update the REQ-92 expectation that REQ-93 supersedes:

Now let me run the full suite to find the rest of the blast radius:

The re-fold in `repro` has too wide a blast radius on tests it doesn't own. Let me switch to persisting the forms beside `l1.json` — same fold, two artifacts written together, so they can't disagree:

Now revert `repro` to reading the bundle's artifacts:

Let me revert the now-unneeded font-helper relocation and the unused reader:

Now update the module-instance construction in `repro` and re-run:

Green. Now let me verify the real acceptance criteria against the actual gigabytealchemy capture:

All 9 pass. Let me confirm the whole suite is still green and typecheck cleanly:

Let me update the module doc header and add a UAT for that consistency gate:

Now bump the version and run a final clean verification:

Both real captures gate clean. Committing:

<!-- xgd-turn id="3e319fad-b8cc-4e2a-80cb-143362111fe4-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T21:03:27.424142+00:00" -->
#### You
Please continue

<!-- xgd-turn id="3e319fad-b8cc-4e2a-80cb-143362111fe4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T21:05:41.458875+00:00" -->
#### Claude
REQ-93 is complete and parked at `free_coded`.

**What landed** (`259f9eb8`, `[FREE-CODED]`, v0.0.203):

- **Schema** — REQ-88's XOR replaced by the narrower rule: modules may accompany `l1` when each binds by name to exactly one existing `slot`. Unbound, dangling, double-bound, orphan-slot, ambiguous-name, and slot-without-`l1` each fail with a machine-readable path.
- **Capture** — a field now carries `controlType` and `formAction`, the two behavioural facts no painted axis can hold; `values-diff` ignores both.
- **Fold** — captured controls cluster into the forms they visibly belong to (by `formAction`, else rect proximity at the widest sample) and become `slot` seams pinned at each group's union rect, instead of `field` residuals.
- **Repro** — `forms.json` is written by the *same* fold that writes `l1.json`, so they cannot disagree; a part-stale bundle fails loudly. Config is derived from the capture only — an endpoint never seen is a reported residual, never an invented one.
- **Render** — the bound module's fragment replaces the inert `data-l1-slot` placeholder inside the same positioned box.
- **Conformance** — a `mountInL1` fixture mode runs the universal ACs against the mounted shape.

**Evidence**: 10 UATs in `tests/req93-l1-slot-mounted-behaviors.test.ts`; full suite green (111 files / 773 tests, re-verified this turn); `l1-gate` on gigabytealchemy reports 0 `field` fold residuals (was 4) with `contact-form@form-0` and `@form-1` mounted.

The ticket body now carries an `## Implementation (delivered)` section appended below the original scope. Promotion to `ready_to_reconcile` is yours to make when you're ready.

<!-- xgd-chat-end -->