---
uid: comment-1c9627f2
id: COMMENT-2615
type: comment
title: Comment on request REQ-217
created_by: xgd
created_at: '2026-09-10T22:08:15.541627+00:00'
updated_at: '2026-09-10T22:14:57.659901+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-fd68ef61
  kind: chat_transcript
---

<!-- xgd-turn id="aa220855-dc2d-40c5-be8b-2cf9295460d5-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T22:07:37.485221+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="aa220855-dc2d-40c5-be8b-2cf9295460d5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T22:14:57.370817+00:00" -->
#### Claude
Now the chat pane: how markdown renders and what the sanitizer allows.

I read the ticket, the surface, the tool, the chat pane, and the router. Findings below — no code changed.

## The ticket's factual claims all check out

| Claim | Verified |
|---|---|
| `write_image` is ours | `tools/generate/src/cli/ai/toolbox-core.ts:538`, declared at `ai/l1-surface.json` op `write_image` |
| `create_image`'s prose forbids it | `lagrange-framework/components/ai_imagegen/js/src/imagegen_surface.json` overview: *"the picture itself never enters this conversation"*; op description repeats *"The image is never returned here as data."* |
| Local workaround is out of bounds | `apps/control-app/src/imagegen.ts:10-16` states exactly the rule quoted |
| Upstream ticket exists | lagrange-framework REQ-149 (`request-a295affc`), `status: draft` — asks for both halves (drop the promise, add a host display-handle seam) |
| The sanitizer already permits `<img>` | `webui-chat/src/sanitize.js` calls `purify.sanitize(html)` with **no config** — stock DOMPurify, `img`/`src`/`alt` allowed. `renderBlock` is stock `marked.parse` |
| It survives a reload | `chat.js:216` replays `{role, markdown}` turns through `appendMessage` → `renderSafe`; the picture is inside the turn text, so nothing on the replay path changes |
| Clicking → modal is REQ-220's | Confirmed, sibling ticket under EPIC-1 |

## The one thing the ticket gets wrong, and it's the whole implementation

> *"The handle is a same-origin URL the builder already serves. `library.js` renders material with `transport.fileUrl(uid)`."*

That's true for **material** (`create_image`'s half). A `write_image` drawing is not material — it's a **site asset**. `editAssetWrite` returns `src: '/assets/wordmark.svg'` (`edit.ts:2333`, `assetHandle` at `edit.ts:2088`), and the builder loads those through `assetUrl(slug, handle)` = `previewUrl(slug,'draft') + handle` (`builder/api.js:164`).

And `previewUrl` runs it through `scoped()` (`api.js:63`), which prefixes `/b/<businessId>`. That prefix is **not optional**:

- The builder document URL stays `/` — `selectBusiness` only calls `setBusinessScope`, it never navigates (`app.js:919-921`). So a relative or root-absolute URL in a chat bubble arrives **unscoped**.
- An unscoped `/preview/…` doesn't 404, it resolves through `resolveScope`'s fallback to **the first admissible business** (`scope.ts:262-266`). For a multi-business operator that is precisely the "one business's page rendered with another's assets" failure `scope.ts:161-171` exists to prevent.

So the tool cannot compose a correct URL from what it has today. `write_image` runs in `l1Operations(slug, opts, …)` and knows the slug and nothing about the business. **A seam is needed — locally, the same shape we're asking lagrange-framework for in REQ-149.**

**The seam that fits the existing grain:** an optional factory on `HostDeps`, alongside `fidelity` and `ledger` (`host-core.ts:297,308`), threaded into `createL1Toolbox`'s deps beside `measurer` (`toolbox-core.ts:693`), so `write_image` can append the markdown line when the deployment can show a picture and omit it when it can't. Absence stays the default, exactly as REQ-149 asks upstream.

The Worker's wiring is trivial and correct: `chatHost` is already keyed on `scope.businessId` (`router.ts:2450`), so `/b/${scope.businessId}/preview/${slug}/draft/assets/<file>` is stable for the cached host and names the business **explicitly** rather than leaning on the fallback. `1c builder` now starts `wrangler dev` (`builder.ts:42`), so there is no second production path to satisfy — the Node transport is test infrastructure, and a terminal session with no browser simply supplies nothing.

## Three smaller findings

**1. Nothing constrains the image's size today.** There is no `img` rule in `webui-markdown/src/markdown.css` or `webui-chat/src/chat.css` — I grepped both, zero hits. So "constrained by the stylesheet" means adding one to `builder.css`. Mild tension with the comment at `builder.css:876-882`, which says the pane deliberately declines to restyle a component that ships its own look. I'd argue a `max-width`/`max-height` on content the component never anticipated is a different act from restyling it, but it's worth saying out loud rather than slipping in.

**2. Caching is a non-issue.** Every router response carries `no-store` (`index.ts:117`, `router.ts:1150`), and `servePreview` streams asset bytes straight from the store. A `replace: true` redraw shows the new bytes with no cache-buster.

**3. Streaming renders the line twice.** `webui-chat/src/index.js:289` re-runs `renderSafe(record.markdown)` on every chunk, so a half-arrived `![wordmark](/b/…` renders as literal text until the closing paren lands, then becomes an image. Harmless, but it means a truncated-yet-parseable URL could fire one wasted request mid-stream. Not worth engineering around; worth knowing.

## What the change looks like, concretely

1. `HostDeps` + `createL1Toolbox` deps gain the optional display-URL factory; `router.ts` supplies it from `scope.businessId`; Node/CLI supplies nothing.
2. `write_image` adds one field to its result — the exact markdown line — present only when the seam is.
3. `l1-surface.json`: the new field in `shapes.image` (*"absent when this deployment cannot show it"*, mirroring `asserted`'s existing conditional wording), the paste-it-verbatim instruction in the op description, and the reinforcement in `absences` the ticket asks for. Bump `surface_version` (8 → 9) — `reconciliation-assistant-control-surface.test.ts:209` and `test_UAT_FC_BUG-44` both read it.
4. One CSS rule in `builder.css`.
5. No click handler — REQ-220.

Two things I'd like your call on before I touch anything: whether the display line should be **only** for `write_image` now (leaving `create_image` genuinely untouched until REQ-149 lands), and whether baking a business-scoped absolute URL into the **archived transcript** is acceptable to you — it's durable text that names `/b/<id>`, and the alternative (a site-relative handle rewritten at render time) would require the chat pane to learn what site it is showing, which `chat.js:7-12` deliberately refuses to know.

<!-- xgd-chat-end -->