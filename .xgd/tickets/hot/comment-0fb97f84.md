---
uid: comment-0fb97f84
id: COMMENT-1908
type: comment
title: Comment on request REQ-163
created_by: xgd
created_at: '2026-08-31T21:50:18.634804+00:00'
updated_at: '2026-08-31T21:53:34.297436+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-439cd0c8
  kind: chat_transcript
---

<!-- xgd-turn id="d8a18f58-9d95-4822-9a6d-8dff388a3e09-user" -->

<!-- xgd-chat role="user" ts="2026-08-31T21:49:39.959475+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="d8a18f58-9d95-4822-9a6d-8dff388a3e09-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-31T21:53:34.077156+00:00" -->
#### Claude
I've read the ticket, REQ-162's landed store, the ticketing component's `attach` (blob-first, sha256-addressed, dedup, 25MB ceiling — step 1 is already done for us), the control-app router/AI wiring, and checked which sibling tickets exist. Seven questions, each with what I'd do absent an answer:

**1. Step 5 has nothing to call.** REQ-159 (project KB, tenant-scoped corpus + incremental index) is still `draft` — there is no project index, no embedder wiring, no corpus predicate in the Worker. "Indexed" and "searchable without a full reindex" cannot be *asserted* here.
→ **Recommendation:** ingestion declares the index hook as a seam (`deps.index?(uid)`) and a UAT proves the pipeline calls it exactly once per created material with the new uid; REQ-159 supplies the implementation. Anything else means building half of REQ-159 inside this ticket.

**2. Does this ticket own HTTP routes?** REQ-162 deliberately added none, and REQ-161 owns the Library surfaces — but this ticket's acceptance says "a file arriving *through the Worker*".
→ **Recommendation:** ingestion owns exactly two routes — `POST /api/material` (upload) and `POST /api/material/fetch` (URL) — because they are pipeline entry points, not Library surfaces. REQ-161 keeps `/api/tickets/*` listing/detail and the drop overlay.

**3. The image shadow needs a vision call the codebase does not have.** The AI component's backend surface is text-only (`promptStream(ref, text)`); there is no image content block anywhere, and REQ-157 (the fidelity/looking surface) is `draft`.
→ **Recommendation:** a narrow `describeImage` in control-app calling `@anthropic-ai/sdk` directly with an image block, behind an injectable seam so UATs don't hit the network. With `ANTHROPIC_API_KEY` absent the material is still created with an honest placeholder shadow (the type pack already makes `body` optional) rather than the upload failing. Confirm you're happy with a second LLM call path beside the AI host.

**4. PDF text extraction needs a new dependency.** Nothing in the repo can read a PDF.
→ **Recommendation:** add `unpdf` (pdf.js packaged for workerd, no native code). If you'd rather not take the dependency in this ticket, the fallback is document shadows limited to filename + size + content-type, which makes most background material effectively unfindable — I'd argue that guts step 3.

**5. Scanned PDFs** (your open question). → **Recommendation: never reject.** Store it, and write an honest shadow — *"Scanned document, 14 pages, no extractable text"* — plus `fields.shadow_status`. Rejecting a client's scanned brand book is the worse failure, and the honest shadow at least makes it visible in the Library. No OCR in v1.

**6. Shadow regeneration** (your open question). → **Recommendation: out of scope, but cheap to enable** — record `shadow_model` and `shadow_status` on the material so a later re-shadow pass can find candidates by predicate. No automatic regeneration.

**7. Fetch transport** (your open question) — and it carries a safety requirement nothing in the repo implements. → **Recommendation:** plain `fetch`, not Browser Rendering (a rendered fetch is capture, REQ-155/166). But that opens an SSRF surface, and there is no guard anywhere in the tree today, so this ticket must ship one: HTTPS only, no private/loopback/link-local/metadata addresses, redirect cap with re-validation, size cap at the 25MB ceiling.

One more, not in your open questions: **the asset-promotion gate** (§5, "the most damaging single action available"). There is currently no material→site-asset promotion path at all, so there is nothing to gate. → **Recommendation:** implement the promotion function *with* the gate in this ticket (refusing when the source bundle is not `republishable`), unrouted, so REQ-161 wires a surface to something that is already safe rather than inventing one later. Say if you'd rather defer it.

Tell me which of these to flip and I'll cut the branch and implement; if they all read right, say so and I'll proceed on the recommendations.

<!-- xgd-chat-end -->