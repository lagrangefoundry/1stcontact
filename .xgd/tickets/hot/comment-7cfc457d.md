---
uid: comment-7cfc457d
id: COMMENT-37
type: comment
title: Comment on request REQ-17
created_by: xgd
created_at: '2026-07-03T18:06:34.269085+00:00'
updated_at: '2026-08-20T21:36:51.355575+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-f5aad951
  kind: chat_transcript
---

<!-- xgd-turn id="130c8548-9bb3-4253-8fe0-1a0b8ac75293-user" -->

<!-- xgd-chat role="user" ts="2026-07-03T18:06:32.457727+00:00" -->
#### You
Are you ready to free code this ticket?

<!-- xgd-turn id="130c8548-9bb3-4253-8fe0-1a0b8ac75293-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-03T18:09:24.819679+00:00" -->
#### Claude
I'll do the legwork first — let me understand the current state of the `1c` CLI, module resolution, and publish path before saying I'm ready.

Now let me look at the actual `1c` CLI implementation — render, publish, and module resolution.

Let me read the CLI structure — commands, render, and the module registry.

Now the render pipeline and module registry — the core of module resolution.

Let me examine the module types, the store layout, and how the schema models module instances — this determines how site-local/draft modules can even be resolved.

Let me read the store paths, loadSite, and how the schema validates module instances — the last pieces I need.

This is a well-specified ticket, but there's one genuinely hard design question at its center — how a site-local `.astro` module gets *loaded and rendered* at runtime. Let me check the test/build harness to see what's feasible.

I've done the legwork. Here's what I found and the design I'd build — I want to confirm a few decisions before writing code, since they shape both the implementation and the ticket body.

## What exists today

- **`1c` CLI** (`tools/generate/src/cli/`) with `render`/`publish`/`checkout` in `commands.ts`. It runs through a **Vite SSR server** (`bin/1c.mjs` → `ssrLoadModule`), and UATs run under the same Astro-Vite plugin (`vitest.config.mts`).
- **Module registry** (`packages/framework/src/modules/registry.ts`) is a *static compile-time map* of `.astro` components; `getModule(id, version)` resolves only from it and throws `"Module not found in catalog"` on a miss.
- **Render** (`tools/generate/src/render/render.ts`) calls `getModule` directly, then `AstroContainer.renderToString(Component, …)`.
- **Store** (`tools/generate/src/store/`): draft lives at `storage/sites/<slug>/draft/`, snapshots copy the *whole* draft into `revisions/NNNN/`, `publish` validates → snapshots → renders to `dist/.../published/`.

**Feasibility confirmed:** because both the CLI and the UATs execute through Vite's Astro transform, a site-local `.astro` can be loaded with a dynamic `import()` and rendered for real — no faking, no separate compile step.

## Design (my recommendations)

**D1 — Where site-local modules live:** `draft/modules/<id>/` — inside `draft/`, so they ride snapshots into revisions (matches DOC-14 "modules ride draft/published" and DOC-12's whole-snapshot model). Each dir: `module.json` (`id, version, hardened, variants, dials, contentSchema`) + `index.astro`.

**D2 — Resolution:** a resolver that checks site-local modules first, falls back to the framework `getModule`. Render loads the site-local component via dynamic `import()` (the async render path already supports this).

**D3 — Hardened marker:** `hardened: boolean` in `module.json` (authored `false`; the out-of-scope XGD harden pass flips it). I'd add a tiny `1c module harden <slug> <id>` command as the *seam* that pass (and the UAT) calls — cleaner than hand-editing JSON, and it gives the future harden workflow a real entry point.

**D4 — Publish gate:** in `cmdPublish`, before any snapshot write, collect the module types used across all pages, resolve each, and throw a typed `UnhardenedModuleError` (structured: lists offending modules) if any *site-local* dependency has `hardened !== true`. Framework modules always pass. Keeps publish atomic.

**D5 — Capability spec (the one I most want your call on):** DOC-14 §3 says the *composer* emits a spec when it hits a gap. Two trigger models:
- **(a) explicit** — `1c module gap <slug> --describe "…" [--screenshot <f>]` writes a structured capability-spec JSON to a gap-log.
- **(b) auto** — an unresolvable module type during render/resolve auto-writes a spec.

I recommend **(a) as primary** (matches "the trigger emits a spec" during composition). **Where should the gap-log live** — under the site (`storage/sites/<slug>/gap-log/`) or the shared `storage/references/` gap-log DOC-13 references? That's my main open question.

## Questions before I code
1. D5: explicit `1c module gap` command (recommended), auto-on-miss, or both? And gap-log location?
2. D3: OK to add the small `1c module harden` seam command, or keep it manifest-only?
3. Anything in D1/D2/D4 you'd steer differently?

Once you confirm, I'll populate the REQ-17 body with the finalized design, then free-code it (UATs `test_UAT_FC_REQ-17_*`, `[FREE-CODED]` commit, version bump, `move-to-free-coded`). I have **not** touched code yet.

<!-- xgd-turn id="95720d2b-58e8-40ab-8bc7-6c11cb5d34b1-user" -->

<!-- xgd-chat role="user" ts="2026-07-03T18:14:43.581632+00:00" -->
#### You
Actually this ticket goes further than I realized, I'm not sure we are reeady for it. Lets talk about the design a little (1) does it assume that when there is a gap we go straight to a new module or can it accommodate extending existing modules? (ideally 90% of our changes will be extensions) (2) Tell me more about the gap analysis in D5 I don't understand what that is exactly - can you look at REQ-33 for example and create an example based on some of the deltas that we found and resolved

<!-- xgd-turn id="95720d2b-58e8-40ab-8bc7-6c11cb5d34b1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-03T18:16:04.351067+00:00" -->
#### Claude
Good — let me ground this in real data before answering. Let me pull REQ-33 and the fidelity/values-diff deltas it resolved.

This is the right conversation to have. REQ-33 is the perfect lens — let me use its actual deltas to answer both questions, because they expose a framing problem in REQ-17.

## (1) Extend-first vs. new-module — the design as I pitched it is biased wrong

You've caught a real flaw. My D1–D5 was framed around "gap → **site-local module**," i.e. the Tier-B bespoke path. But REQ-33 shows that's the *rare* case. Look at how its four deltas actually resolved:

| Delta | How it was resolved | Path |
|---|---|---|
| Title size + gradient + anchor | site-def values (`fontSizePx`, `gradient`, `contentAnchor`) | **config** — no code, no gap |
| Paragraph white→gold, size | site-def values (`color`, `fontSizePx`) | **config** |
| Subtitle "Intentional Software" too large / mis-placed | **new `subheadSize` dial on the *existing* hero module** | **extension** |
| Smartypants curling, submit font, checklist tick | fixes to existing markdown/contact-form/services-grid | **extension (correctness)** |

**Zero new modules.** The one genuine capability gap — hero had no way to render a prominent lead subtitle over a smaller body — was closed by *extending hero with a dial*, exactly the CLAUDE.md "generalize before adding" rule.

So the design must treat **extension as the default resolution and a new bespoke module as the last resort.** A capability spec should describe *the capability needed*, not presuppose a new module. Its resolution field should be `extend <module> (add dial/variant/treatment/field)` **or** `new-module`, defaulting to extend. The site-local-module rendering + hardening gate (D1–D4) only ever engages for the ~10% that are truly new modules.

## (2) What "gap analysis" / a capability spec actually is — REQ-33 example

First, the key distinction values-diff *doesn't* currently make:

- A **delta** = a value mismatch the operator can fix by editing the site-def (color, size, gradient). `1c values-diff` already flags these.
- A **capability gap** = a delta with **no capability to fix it** — no dial, variant, or field exists that would close it. That's what needs a capability spec: a structured request saying "here's the target, here's what we can't express, someone extend a module (or, rarely, build one)."

Concretely, take the REQ-33 subtitle delta *at the moment before `subheadSize` existed*. values-diff flags the subtitle as ~40px vs our base ~24px. The operator tries — and finds no hero dial changes subtitle sizing. That's a gap. The emitted capability spec:

```json
{
  "id": "gap-gigabytealchemy-hero-subhead",
  "site": "gigabytealchemy",
  "source": "values-diff",
  "target": {
    "screenshot": "storage/references/gigabytealchemy.ai/index/shot.png",
    "region": "hero subtitle 'Intentional Software' above the body line",
    "measured": { "fontSizePx": 40, "role": "secondary/gold" }
  },
  "have": "hero subhead renders every line at one base size",
  "need": "a prominent lead-subtitle size — large lead line, smaller body run beneath",
  "proposedResolution": { "kind": "extend", "module": "hero", "change": "add dial subheadSize: base|lg" },
  "status": "open"
}
```

That record is the DOC-13 gap-log entry / DOC-14 capability spec. It's the bridge between "I hit a wall composing/matching" and "resolve it" — and its `proposedResolution.kind` is where extend-vs-new-module gets decided. In REQ-33's case a human closed it by adding the dial; the spec is what would have made that hand-off structured instead of tacit.

## My read on "are we ready"

You're right to hesitate. REQ-17 as written **conflates two things at very different readiness levels:**

- **Capability spec / gap-log (D5)** — serves the 90% extension path, is useful *right now* (it structures what REQ-33 did by hand), and depends on nothing unbuilt.
- **Bespoke-module lifecycle (D1–D4: site-local render + `hardened` marker + publish gate)** — serves only the 10%, and its whole reason for existing is the **XGD harden pass, which is out of scope and doesn't exist yet.** A publish gate on "unhardened" is gating against a state nothing produces.

**Recommendation: split REQ-17.** Keep the capability-spec/gap-log as the near-term piece (extend-first, resolution-agnostic), and defer the site-local-module rendering + hardening gate into its own ticket that lands alongside the harden pass. That also fixes the framing bug — the gap-log stops being "the on-ramp to new modules" and becomes "the on-ramp to *extensions*, occasionally new modules."

Want me to reframe the REQ-17 body around the extend-first capability-spec (and file the bespoke-lifecycle half as a separate deferred ticket)? I'll only touch the ticket once you confirm the direction — no code yet.

<!-- xgd-turn id="224de269-d930-414d-be28-56f1e37df9ad-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T21:36:51.220760+00:00" -->
#### You
I think this ticket has been superseeded by development that went in a different direction. If so please move it to abandoned.

<!-- xgd-chat-end -->