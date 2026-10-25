---
uid: comment-0e70aa37
id: COMMENT-3672
type: comment
title: Comment on request REQ-311
created_by: xgd
created_at: '2026-09-23T18:02:40.179037+00:00'
updated_at: '2026-09-23T18:28:35.614956+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-9cb17465
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d708e051-5da1-4ea2-b51e-9783a1c762e7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="23e41871-55b8-4c3c-b3bd-e3e62c32d560-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T18:01:28.833104+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="23e41871-55b8-4c3c-b3bd-e3e62c32d560-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T18:28:34.037759+00:00" -->
#### Claude
Now let me look at the KB projection system — DOC-56 and how doc bodies are generated.

Now the catalogue.json and CATALOGUE.md:

I have enough to proceed — no blocking questions. One finding worth stating up front (I'll implement the ticket's stated rule and report it loudly):

Reading each family's own `METADATA.pb` **also** fails for the same six `Edu *` families — their repo directories still carry the pre-rename names (`edunswactfoundation`), and the live service serves `edunswactcursive` from a directory that does not exist in `google/fonts` at all. So under "excluded and reported, never defaulted" those six drop out: 1,946 → 1,940 catalogued, 1,941 → 1,935 in DOC-56.

Now the DOC-56 projection module:

Now wire into the CLI dispatcher and usage:

Now typecheck:

Idempotent. Now the doc projection:

Now the UATs:

Now version bump and commit:

Now release the lock and tear down the branch:

Done. Ticket REQ-311 is at `free_coded`.

## What landed

**`1c fonts catalogue [--json] [--metadata <url|file>] [--repo <url|dir>]`** — `tools/generate/src/cli/font-catalogue.ts`

Existence from `fonts.google.com/metadata/fonts`; licence from each family's own `METADATA.pb`, joined on the name that file declares for itself. `licence_source` records that file's repo-relative path (`ofl/roboto/METADATA.pb`) — a checkable path instead of a word for a kind of guess.

The ~2,031 `METADATA.pb` files are read via a blobless partial clone + sparse checkout: **~5 MB and ~2 seconds**, against gigabytes for a full clone or 2,000 round trips for individual fetches.

**`1c fonts doc [--json] [--stdout]`** — `tools/generate/src/cli/font-doc.ts`

Projects DOC-56's body and writes it into the system-KB `doc` ticket carrying `fields.source: fonts/catalogue.json` — found by what it declares, not a hard-coded uid. Reproduces the committed shape: 8 groups (Slab Serif from `stroke`, Symbols and Noto split out of category), 91 sub-headings of 22 by usage, 98 KB. OFL 1.1 and Apache 2.0 only; the five UFL families are catalogued and absent from the document.

## Real run, against live upstream

```
fonts catalogue — 1,940 families, retrieved 2026-09-23
Excluded — licence could not be determined (6):
  Edu NSW ACT Cursive, Edu NSW ACT Hand Pre, Edu QLD Hand,
  Edu SA Hand, Edu VIC WA NT Hand, Edu VIC WA NT Hand Pre
fonts doc — 1,935 servable families, 91 sub-headings → DOC-56
```

The six `Edu` families are excluded, as the ticket's rule requires. Reading `METADATA.pb` does not rescue them: their repo directories still carry the pre-rename names, and the live service serves `Edu NSW ACT Cursive` from a directory (`edunswactcursive`) that does not exist in `google/fonts` at all. The old catalogue had defaulted them to OFL from their neighbours — exactly the silent misattribution the ticket names.

Two findings worth recording:
- **`classifications` and `subsets` come back in unstable order.** Without sorting them, every refresh was a diff, which would have defeated the no-change-no-write rule. `designers` is deliberately *not* sorted — attribution order is upstream's own statement.
- **The ticket store strips trailing whitespace on write**, so a byte comparison made `1c fonts doc` rewrite DOC-56 on every run. The comparison now normalises it.

## Tests

8 UATs in `tests/test_UAT_FC_REQ-311_font_catalogue_generator.test.ts`, driven through the real CLI entry point against fixture sources on disk — all pass, plus the REQ-101 / KB / CLI-bootstrap regression scope.

Two pre-existing failures in `req101-font-registry` and `reconciliation-font-provenance` appear on `xgd-working` only: they scan the operator's gitignored `storage/sandbox/` tree, where `testimonials` pins `carousel` v1 below its migration floor. Unrelated to this change — those suites passed in the branch worktree, which has no local sandbox.

Commits `00675d47ba` + auto-bump `8b63196` on `xgd-working`, version 0.2.343, branch cleaned up. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->