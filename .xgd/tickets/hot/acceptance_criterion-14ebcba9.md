---
uid: acceptance_criterion-14ebcba9
id: AC-2377
type: acceptance_criterion
title: 'Priming names no knowledge-base document by id: the purpose names the subjects
  the method covers and points at the awareness map, and the per-turn reminder points
  to the method without naming a document'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T05:11:33.534754+00:00'
updated_at: '2026-11-08T05:11:33.534754+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

**Which documents exist reaches a session only through the awareness map the knowledge-base build generates.** No authored text names one. That covers every text a session can be sent: each priming entry in both declared orders, each reminder entry, and each template.

- **No id and no title.** No authored text contains a system-KB document id (`DOC-<n>`), a projected reference id (`REF-<name>`), or the title of a corpus document.
- **The obligation stays.** The purpose still says the assistant's method is written down and is to be read before starting rather than improvised. It names the **subjects** the method covers, which are what retrieval matches on: how a consultation runs and what to ask when, who the client is and how to pitch it, what separates work worth paying for from something off the shelf, and what this product is for. It also names the further subjects worth searching: the vocabulary a page is written in, what the components will and will not do, and how the system stores and publishes a site. It points the session at the map above it for which documents exist ("work from the map, not from a title you think you remember"). It still frames both corpora, the system's and the client's own, as what is searched. It stays under 900 characters.
- **The reminder points without naming.** The per-turn method line says the rest of the method is in the knowledge base. It names no document.
- **Membership changes cost no authored edit.** Add a document to the system knowledge base and rebuild: it appears in the next session's priming. Demote one out of the corpus and rebuild: it disappears. In both cases the authored configuration is unchanged byte for byte, and the assembled priming still fits the declared budget.

## Verification

Over every `text` in both priming orders and the reminders, and every template value: no match for `DOC-\d+`, `REF-[a-z]`, or the retired titles ("consultation playbook", "personas, modes and registers", "differentiation audit"). The purpose contains the obligation to read the method first, the subjects and both corpora, and is under 900 characters. Next, build a fixture corpus with the real store, index, chunker, clustering and access-point validation, and assemble a consultant priming through the framework's own loader with the real landscape and mechanism providers. Then add one document, demote another, and rebuild. The added document is absent from the first priming and present in the second. The demoted one is present in the first and absent from the second. The configuration file is byte-identical across both builds, and both primings carry the purpose verbatim, declared once.
