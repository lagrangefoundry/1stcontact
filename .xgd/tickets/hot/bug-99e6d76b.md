---
uid: bug-99e6d76b
id: BUG-65
type: bug
title: Priming hardwires system-KB document ids; corpus membership must come from
  the build
created_by: CHAT-44
created_at: '2026-09-08T22:01:47.769621+00:00'
updated_at: '2026-09-08T22:23:26.769949+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-beaf61fd
  commits:
  - working_sha: 70612b3feb6f08b49c701959f2f6eea746ffaf2d
    reconcile_sha: null
    main_sha: null
  version: 0.2.138
---

---

## What changed

**`priming.json` — the `purpose` entry.** Rewritten so it names no document. It
now names **subjects** instead: how a consultation runs and what to ask when, who
you are talking to and how to pitch it, what separates work worth paying for from
something off the shelf, what this product is for, the vocabulary a page is
written in, what the components will and will not do, and how the system stores
and publishes a site. Subjects are what the `km.mechanism` trigger ("pick the
territories above that bear on your purpose") actually bites on, and what
retrieval matches — an id is not a word. It keeps the obligation the map cannot
carry: the method is written down, and is to be read before starting rather than
improvised around. It keeps naming both corpora. It now points the session at the
map for *which* documents exist — "work from the map, not from a title you think
you remember".

**`priming.json` — the `method` reminder.** It said "the rest of your method is in
DOC-33". That is the same defect one tier down and it rides every turn, so it now
says the method is in the knowledge base. In scope because the reminder is text a
session is sent, and an id there drifts exactly as an id in the purpose does.

**`priming.json` — the `about` block.** A new paragraph states the rule for
future authors: no entry names a document; membership is the build's answer;
entries name subjects.

**`roles.ts` — the `PURPOSE_ENTRY` docstring.** Its "IT NAMES DOCUMENTS (REQ-171)"
paragraph argued for the enumeration. Replaced with "IT NAMES SUBJECTS AND NEVER A
DOCUMENT", carrying the reason the original gave for naming *something* (the
trigger needs a subject) and the reason it must not be a document (membership is
decided at build time, and an id list drifted).

**The KB was rebuilt** (`bin/kb-release`: `1c kb build` then `1c assets`). The
corpus went from 4 exported + 3 projected to 8 exported + 3 projected; DOC-17 and
DOC-31 were removed as no longer members, and DOC-46–DOC-51 were added. The
awareness map is regenerated over 11 documents in 5 territories with 17 validated
access points, replacing the 2026-08-31 map that described 4 documents in 2
territories and mentioned none of the `REF-*` projections. These are gitignored
build artefacts, so they are not part of the commit.

## Design decisions made during implementation

**The invariant is scoped to text a session is sent, not to the whole file.** The
ticket's verification says "grep `priming.json` for `DOC-`: no matches". Two
matches remain, both in the file's `about` block, both citing `DOC-22` — the
framework's role-configuration *format* specification. That block is a comment the
loader never reads and the model never sees, and the citation is provenance a
maintainer needs rather than a claim about who is in the corpus. The UAT therefore
asserts over every `text` in `priming`, `priming_without_corpus` and `reminders`
plus every `templates` value — everything that can reach a model — and says why in
the test. Every id and title that a session is now sent comes from the awareness
map the build generates.

**Both id namespaces are guarded, not just `DOC-`.** The projected reference ships
under `REF-`, and a `REF-` id in authored prose is the same defect with the same
failure mode.

**Titles are guarded as well as ids.** An id list drifts on a demotion; a title
list drifts on a retitle. The retired entry carried both, so the replacement bars
both.

**Two superseded REQ-171 assertions were retired.**
`test_UAT_FC_REQ-171_the_purpose_names_the_documents_this_role_must_read` asserted
the exact behaviour this ticket removes and is deleted, with a comment in its place
naming what replaces it. `test_UAT_FC_REQ-171_nothing_is_stated_in_two_places`
asserted the reminder contained `DOC-33`; its real claim — the reminder points at
the method rather than carrying it — survives, so the assertion was retargeted to
the pointer and a `not.toMatch(/DOC-\d/)` added.

**The fixture KB build was extracted rather than copied.** REQ-123's suite carried
a private `buildIndexesAndMap` mirroring `buildKb`'s body from the index onwards
(the release build minus the ticket-store export). BUG-65's UAT needs the same
thing, and a second copy is a second build that only half tracks the real one, so
it moved to `tests/support/kb-fixture.ts` and both suites import it. It stays out
of `kb.ts` for the reason REQ-123 already gave: production has no caller for
"build over a corpus somebody else wrote".

## Test plan

`tests/test_UAT_FC_BUG-65_priming_names_no_documents.test.ts`.

Static, over what ships:

- `..._no_shipped_priming_text_names_a_corpus_document` — no `text` in any tier
  and no template value matches `DOC-\d+` or `REF-[a-z]`.
- `..._no_shipped_priming_text_names_a_document_by_title` — nor the three titles
  the retired entry carried.
- `..._the_purpose_still_carries_the_obligation_and_the_subjects` — the method is
  written down and is to be read before starting; the subjects the trigger bites
  on are present; both corpora are still framed; still under 900 characters.
- `..._the_reminder_points_at_the_method_without_naming_it` — the per-turn
  reminder points at the knowledge base and names no id.

All four fail against the pre-change `priming.json` (verified by reverting the file
and re-running).

End-to-end, over a real build: a fixture corpus is indexed, chunked and mapped
with the real store, index, chunker, search, clustering and access-point
validation (only the embedder and describer are the deterministic stubs the build
already supports through its own environment variables). A consultant priming is
then assembled through the framework's own loader and assembler with the real
`km.landscape` and `km.mechanism` providers — the artefact the model is actually
sent. The corpus is then changed (one document demoted out, one added) and rebuilt,
and nothing else is touched.

- `..._a_document_added_to_the_corpus_reaches_the_session` — absent from the first
  priming, present in the second.
- `..._a_document_demoted_from_the_corpus_leaves_the_session` — the failure this
  bug was: present in the first, absent from the second.
- `..._neither_change_cost_an_edit_to_the_authored_priming` — `priming.json` is
  byte-identical across both builds, the two primings differ, and the assembled
  priming still fits `MAX_PRIMING_CHARS`.
- `..._the_session_is_still_told_to_go_and_read_its_method` — both primings carry
  the purpose verbatim, and it is declared once.

Regression scope run green: `test_UAT_FC_BUG-65_*`, `test_UAT_FC_REQ-171_session_texts`,
`test_UAT_FC_REQ-182_priming_is_configuration`, `test_UAT_FC_REQ-123_system_kb`,
`test_UAT_FC_REQ-123_session_knowledge`, `test_UAT_FC_BUG-48_corpus_and_index_agree`,
`test_UAT_FC_BUG-48_the_reference_covers_its_source`,
`test_UAT_FC_REQ-158_system_kb_bundle`, `test_UAT_FC_REQ-174_consultant_role`,
`test_UAT_FC_BUG-63_priming_configuration`, `test_UAT_FC_REQ-122_chat_host`,
`reconciliation-assistant-conversation`,
`reconciliation-assistant-conversation-knowledge`.

Assembled against the rebuilt real KB, the priming is 10,343 characters with the
tool manual elided (~21k with it) against a 60,000 cap, and every `DOC-`/`REF-` in
it comes from the awareness map.