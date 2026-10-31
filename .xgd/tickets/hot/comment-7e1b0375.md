---
uid: comment-7e1b0375
id: COMMENT-5771
type: comment
title: Comment on request REQ-474
created_by: xgd
created_at: '2026-10-27T18:36:14.419061+00:00'
updated_at: '2026-10-27T18:52:15.554797+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-f9bf7c59
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "4d057363-3498-4b0b-b83b-cb13d5fd59ec",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="328b389a-878b-43af-9fa2-252f0a0200e7-user" -->

<!-- xgd-chat role="user" ts="2026-10-27T18:34:39.346524+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="328b389a-878b-43af-9fa2-252f0a0200e7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-27T18:52:09.576931+00:00" -->
#### Claude
I'm reading the existing capture, Library and upload-description code so the import reuses them rather than adding a second store.

Still mapping the capture bundle: checking what asset metadata (URLs, sizes, types) a capture records, so the import can filter noise from it.

Now the surface declaration and an existing workers UAT to model the tests on.

Checking how the chat links to a tab (for the "your Library" line), then I'll write the code.

Writing code now. First the reference-store write API, so tests can build a captured bundle.

Now the entry point beside `ingestFetch`, and `ingest` carrying the source page and a quality note.

Now the port: types and the two operations in `library-core.ts`, with site-import using the port's types.

Now the router: pass the reference store to the Library, and record a capture of the client's own site as theirs at adoption.

Now the surface declaration — summaries kept short for the priming budget, detail in descriptions.

Now typecheck.

Typecheck is clean. Now the UATs — a workers test driving the consultant's Library surface over real D1/R2.

Running the new UATs.

All 5 pass. Now the regression scope: surface validators, the talker classification, slow-tools, the priming budget (BUG-129), and the capture/Library suites I touched.

The validator forbids naming tools across groups in prose; rewording, giving the group a short description, and extending REQ-228's grant expectation.

Now the AC1095 failure — checking whether it's pre-existing on clean xgd-working.

Pre-existing on clean xgd-working, so not mine. Now the workers regression scope, including BUG-129's priming budget and the talker classification.

Fixing the classification: by rule every Library write is withheld from the talker, so `import_from_site` moves to `withhold`. Then updating REQ-386's slow-tool list.

Baselining the two remaining REQ-386/REQ-416 failures in the main checkout while I re-run mine.

Those three fail on clean xgd-working too (pre-existing). Re-running the branch's workers scope.

Only the 3 pre-existing failures remain; BUG-129's priming budget passes. One last check: whether the Library tab treats `origin: 'captured'` specially (it's used for reference captures).

Code is done. Committing on the branch, then updating the ticket body before the merge-back.

Now the ticket body: keeping everything already there and appending what was built and the design decisions.

The append didn't land (body still ~3.5k chars). Checking the CLI quirk notes.

`--append-body -` appended a literal "-". Rewriting the body from the on-disk copy plus the new sections via `--body-file`.

Ticket body updated (8.5k chars). Now the merge-back: lock, merge xgd-working into the branch, bump, fast-forward back.

REQ-474 is built and merged into xgd-working. The ticket is at `free_coded` with commits `b8189b59…` (the feature) and `8f761f6b…` (version 0.2.678), and the branch is cleaned up.

**How it works for the consultant**

The Library gets two new tools:
- **`site_material`** looks at a captured page and lists what it has worth bringing in: its pictures, and the PDFs it links to (menus, price lists). It leaves out stylesheets, scripts, fonts, icons and tracking pixels (anything under 64px), duplicate files, and smaller copies of a picture the page also has larger. Pictures under 1000px on their longer side are marked low resolution.
- **`import_from_site`** brings in the items the consultant names, at most 30 per call. Each one goes through the same pipeline as an upload, so it arrives described (photo or graphic, focal point), numbered, and ready for `place_on_site`. It records the page, the address it came from and its original file name. Importing the same picture again doesn't add a second copy. The answer includes one line for the client naming the new Library numbers. Those numbers already open the item from the chat, so I didn't build a separate link to the Library tab.

**Decision for you: what counts as "the client's own site"**

I used the existing site recorded in the plan brief (`existing_site.url`, which the consultant sets with `update_brief`). That host and its subdomains are the client's; every other page is refused, which covers comparison sites. Until now every capture was marked as somebody else's, because nothing recorded which site was the client's. With this change, a capture of the brief's site is marked as theirs when it's taken, and an older capture is re-marked when it's first used. If you'd rather the client confirm it a different way, that's one function to change.

**Limitation:** linked PDFs are only offered if they're on the client's own site or on a host the page's pictures come from. A PDF hosted anywhere else isn't offered, and plain-http links fail at import because the existing fetch only allows https.

**Tests**
- The 5 new UATs pass, covering every point in the ticket's test plan, against real D1/R2 storage.
- I updated two existing tests whose expectations legitimately grew: REQ-228's list of Library permissions, and REQ-386's list of slow tools.
- The priming-budget test (BUG-129) passes.
- Four tests fail in this scope, and they fail the same way on a clean xgd-working checkout: REQ-386's 20-second-rule wording, two REQ-416 talker tests that time out, and a settings test (AC1095) that crashes on `spacing`.

I've written the design and decisions into the ticket body. It stays at `free_coded` until you promote it.

<!-- xgd-chat-end -->