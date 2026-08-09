---
uid: comment-214c3fa5
id: COMMENT-887
type: comment
title: Comment on request REQ-129
created_by: xgd
created_at: '2026-08-09T23:07:21.905939+00:00'
updated_at: '2026-08-09T23:33:08.888818+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b1300473
  kind: chat_transcript
---

<!-- xgd-turn id="afc7bd5f-3a46-4ccb-8ccc-4cd2895cecdc-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T23:07:18.104666+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="afc7bd5f-3a46-4ccb-8ccc-4cd2895cecdc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-09T23:33:08.753518+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Ticket body is fully populated. Let me explore the relevant code.

Now let me implement. First the write counterpart to `resolveL1Node`:

Now the `edit.ts` operations:

Now the two L1 operations, after `editCopySet`:

Now the toolbox: widen the page map and rebind the operations.

Now the operation bindings:

Now the declaration. Replacing the `get_copy`/`set_copy` operations, shapes, groups, sequences and absences:

Now the shapes, `describe_page`, groups, sequences and absences:

Now let me typecheck before writing tests.

Clean. Now the UAT suite:

Now the test suite:

The framework's error renderer drops the host message, so the JSON-pointer never reaches the model. Let me check and handle that honestly:

Now fix the test seed and strengthen the round-trip assertion:

The nav bar renders — the renderer emits document-relative hrefs (DOC-12 §7 relocatable artifacts). Fixing the assertion:

All 13 pass. Now update the two suites that reference the retired operations:

Now the REQ-122 tool-surface suite:

Now the REQ-126 suite:

Now the full regression scope:

Now checking whether the three browser-suite failures pre-date my change:

All three browser failures (6 tests) are pre-existing on the clean tree — identical set. Confirming the regression scope:

Green. Version bump and commit:

Now updating the ticket body to reflect what was actually built:

Done. REQ-129 is at `free_coded` with commit `e46509db9`, version `0.1.33`.

**What landed**

- **Read side, two tiers.** `describe_page` now emits every node — `{path, kind, label}` — instead of only the 55% carrying copy fields; no axes reach it, so it stays affordable on a 3,872-line page. `get_l1(page, path)` returns the subtree verbatim: axes, palette refs, responsive tracks, link roles, exactly as stored.
- **Write side.** `set_l1(page, path, node)` replaces the subtree. Adding and removing are replacing a group with one child more or fewer — no insert/delete op, and the declaration's sequences say so. `replaceL1Node` lives beside `resolveL1Node` so the addressing rule stays stated once.
- **The retired pair.** `get_copy`/`set_copy` are gone from the AI surface; `WriteCopy` → `AuthorPages`; `surface_version` 1 → 2. The two absences that claimed appearance and structure were unreachable are deleted, since they are no longer true.
- **No new validation.** `validateOrThrow` already ran the full L1 envelope over the assembled site.

**Two things worth your attention**

The security guarantee moved as the ticket predicted — from "no operation accepts markup" to "the schema is closed" — and I measured it rather than asserting it: markup field, style field, `javascript:` through both the link role and `image.src`, an undeclared kind, and a mistyped axis are each refused whole with the draft byte-unchanged.

The ticket's claim that `validateOrThrow`'s JSON pointers let the model self-correct **does not hold through the Toolbox**. `_renderHostError` renders a declared code as code + declared meaning and drops the host message, with no per-call detail channel. Harmless for four known field names, not for a subtree. I can't fix it here (it's `@lagrangefoundry/ai`), so the declared `SCHEMA_INVALID` meaning now carries a recovery strategy instead of promising a hint it can't deliver, and it's recorded on `editL1Set` and in the ticket. REQ-122's chat-host suite already documents the same loss for `NOT_FOUND` — this is a second instance of one known gap.

**Acceptance passes**: through the chat surface, `describe_page` → `get_l1(root)` → `set_l1(root)` gives the site a nav bar of link-role text nodes, and it renders as real `<a>` elements.

**Modal invariants proven, not assumed** — both over the real `/api/copy` transport on AI-authored subtrees: the modal opens and saves on an AI-authored text node (and the assistant's axes survive the operator's edit), and an AI-authored container yields an empty field list rather than a form.

**Tests**: 13 new UATs, all green; 111 green across the 11 surface/edit/modal suites. Full suite is 1318 passed / 8 failed — I stashed and re-ran to confirm 6 of those (two browser modal suites plus `req115`) fail identically on the clean tree; the other 2 were REQ-127's scripted `set_copy` calls, now updated and passing.

<!-- xgd-chat-end -->