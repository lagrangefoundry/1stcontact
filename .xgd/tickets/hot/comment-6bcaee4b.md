---
uid: comment-6bcaee4b
id: COMMENT-2318
type: comment
title: Comment on request REQ-208
created_by: xgd
created_at: '2026-09-08T22:37:35.580726+00:00'
updated_at: '2026-09-08T22:47:16.605202+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-68718201
  kind: chat_transcript
---

<!-- xgd-turn id="5d5042e4-dd0b-435a-bf15-142c0d9997e2-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T22:37:13.886477+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="5d5042e4-dd0b-435a-bf15-142c0d9997e2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T22:44:50.559646+00:00" -->
#### Claude
I've read the ticket, the framework plugin (`ai_imagegen` + `imagegen`), the plugin layer in `@lagrangefoundry/ai`, and this repo's material/ticket/host wiring. I have a clear plan and have recorded the implementation decisions on the ticket body. **One hard blocker and two questions before I code.**

## Blocker — the shared component store

`bin/install` writes `/Users/martin/lagrangefoundry/node_modules`, which this session cannot write to (`Operation not permitted`). Right now:

- the installed `@lagrangefoundry/ai` **predates the plugin layer** — no `resolvePlugins`, no `AbsentPlugin`
- `@lagrangefoundry/ai-imagegen` **is not installed at all** (`imagegen` is)

Both are on the framework's `xgd-working` and `bin/install --list` offers `ai-imagegen`, so this is one command from your shell:

```
cd /Users/martin/lagrangefoundry/lagrange-framework && bin/install --lang js --component all
```

(Then I run `./bin/1c assets` on this side.) Two notes: this also lifts `ticketing`, `knowledge`, `webui-*` etc. to current, which may surface unrelated breakage I'd then have to work through; and the alternative — `--env /Users/martin/lagrangefoundry/1stcontact`, which I *can* write to — would shadow the shared store for this repo only. **I'd rather not do that silently**, since it diverges 1stcontact from every sibling. Say the word if you'd prefer it.

## Two questions

1. **Do you have an OpenAI image key?** I've chosen `openai`/`gpt-image-1` (it declares transparency and three ratios; Google declares fewer, and the ticket names it first). The wiring works absent-first — no key means no `create_image` tool, session opens normally — so I can land and test it with no live key. But the deploy hook I add will be a no-op until `OPENAI_API_KEY` exists.

2. **Per-session image budget** — the framework default is 10. Keep it, or lower it (I'd suggest 4 for a real client session) ?

## Decisions I've taken (correct me cheaply, otherwise I proceed)

- **The plugin gets a wrapped, scoped ticket store as its `options.store`** — the seam the framework declares. It refuses any type but `material`, merges this product's `§9` fields into the plugin's `create` (so the record is never visible carrying the plugin's fields alone), and completes `content_type`/`filename` on `attach` from the same resolved values the attachment takes. The plugin's own write is untouched.
  - This is also **forced**, not merely tidy: `rights`, `republishable`, `exportable`, `origin` and `kind` are `required: true` on `material`, so a bare plugin write would be rejected by the type pack outright.
- **"It was generated" is `origin: generated`** — a new value on the existing enum, not a new field. The Library already renders `origin` as *Where it came from*, and predicates already select on it. One enum value instead of a field, a column and a label.
- `description_model` = the model id, read off the constructed backend (not parsed out of the body). `kind: image`, `description_status: ok`, `rights: owned`, `republishable: true`, `exportable: false`, `role: site`.
- Generated material is **indexed on creation** via the same `onMaterialWritten` an upload uses.
- `aiConfigured` untouched; `OPENAI_API_KEY` added to `secretsOf()` for redaction; deploy hook **never fails a deploy** on absence (unlike the Anthropic one).
- Surface assembled in `router.ts`'s `chatHost` and passed to `workerHost`, exactly as `fidelity` is; grant `imagegen: {groups:["CreateImages"]}` in `instances.json` beside fidelity's; new `ai-imagegen` shim in `1c assets`, plus `resolvePlugins` added to `AI_WORKER_EXPORTS`.

I'll cut `free-REQ-208` and write the UATs against `route()` end-to-end (the REQ-206 pattern), faking only the two genuinely external boundaries: the Anthropic client and the image provider's `fetch` — which the plugin already accepts via `options.fetch` precisely so it runs with no live credential.

<!-- xgd-turn id="73ae3c94-0f42-40f7-bd08-8c0d794560c4-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T22:47:04.236522+00:00" -->
#### You
I have a ChatGPT API key does that work?

I have no idea what the image budget really means

<!-- xgd-turn id="dbfebd5a-664c-477a-aa60-aacd92752094-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T22:47:15.892118+00:00" -->
#### You
I have a ChatGPT API key does that work?

I have no idea what the image budget really means what do I get for 10 vs 4?

<!-- xgd-chat-end -->