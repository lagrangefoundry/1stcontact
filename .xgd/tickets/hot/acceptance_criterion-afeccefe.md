---
uid: acceptance_criterion-afeccefe
id: AC-2472
type: acceptance_criterion
title: An embedding failure is a named error carrying transport and knowledge base,
  keeping the original message, with operator advice on the binding
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:06:06.739679+00:00'
updated_at: '2026-11-08T21:06:06.739679+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

When an embedding call fails, the failure surfaces as a named embedding-failed
error, not as the underlying exception or a bare workerd reference id. The error
carries:

- **the transport** that failed (`binding` or `REST`), both as a field a caller can
  branch on and in the message text;
- **the knowledge base** it was embedding for (e.g. project or system), both as a
  field and in the message text;
- **the underlying message, preserved** (on REST this is the useful part, e.g. an
  authentication failure; on the binding it is at least the reference id), with
  the original error kept as its cause.

On the binding transport only, the message also tells the operator what to do.
Under `wrangler dev`, an `internal error; reference = …` means the remote preview
session proxying the binding has expired. A worker reload (touching a source file)
refreshes it, and setting `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` avoids
the session entirely. A REST failure does not carry that advice.

An error that is already an embedding-failed error is passed through unchanged,
not wrapped a second time.

## Verification

Drive an embedder whose underlying model call throws `internal error; reference =
X`, once on each transport and for a named knowledge base. Assert the raised
error is the named embedding-failed error, its transport and knowledge-base
fields match, and its message contains the transport, the knowledge base and `X`.
Assert that the binding advice is present on the binding transport and absent on
REST. Assert that an inner failure that is already an embedding-failed error
arrives with its original transport, knowledge base and message.
