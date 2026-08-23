---
uid: comment-422ff2d4
id: COMMENT-1439
type: comment
title: Comment on request REQ-157
created_by: xgd
created_at: '2026-08-23T23:44:16.672211+00:00'
updated_at: '2026-08-23T23:51:56.905592+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3f8737f2
  kind: chat_transcript
---

<!-- xgd-turn id="dfe2e648-f8f7-4b8e-be46-f82edea45ac3-user" -->

<!-- xgd-chat role="user" ts="2026-08-23T23:43:00.882042+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="dfe2e648-f8f7-4b8e-be46-f82edea45ac3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-23T23:51:56.751979+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

## REQ-157 — investigation findings

I read the ticket, the toolbox layer (local + upstream `@lagrangefoundry/ai`), the fidelity CLI verbs, and the three tickets this stands on. Summary: **the ticket's diagnosis is accurate, but it understates two things and gets one detail wrong.**

---

### 1. The image-return question — the ticket is right that it's unsettled, and it's bigger than "declare it"

The ticket's transport claim checks out exactly. `AnthropicWire.record` (`backends/api_tools.js:409`) is `content: o.output` — straight passthrough, so an array of blocks would reach the wire intact.

But the blocker isn't only that `returns` has no vocabulary for bytes. **The whole result path is typed as a string, in four places:**

| Where | What it does |
|---|---|
| `toolbox/provenance.js` `serialize()` | every branch returns a string; objects → `JSON.stringify` |
| `toolbox/provenance.js` `mark()` | string-concatenates the `<<<untrusted>>>` markers |
| `toolbox/provenance.js` `normalise()` | `max_bytes` checked via `TextEncoder().encode(payload).length` |
| `toolbox/runtime.js` `Toolbox.run()` | returns `payload`, records `payload.length` as `resultBytes` |

And `declaration.js:438` `parseReturns` accepts exactly `{shape, provenance, max_bytes}`. There is no `image`/`media`/`base64` token anywhere under `src/toolbox/`.

**The part the ticket doesn't name:** `OpenAIWire.record` (`api_tools.js:499`) pushes `{role:'tool', content: o.output}`. OpenAI's tool-role message does **not** accept image blocks. So this is not a passthrough change — upstream needs either a per-wire capability negotiation ("can this provider carry media in a tool result?") or an explicit, documented Anthropic-only capability with a stated degradation. That decision is the real content of the upstream ticket, and the ticket should say so.

Second unnamed consequence: provenance. A captured third party's screenshot is untrusted content, and `mark()` has no rule for wrapping a non-text block. Prompt-injection-via-rendered-image is a live technique. That needs an answer, not an omission.

---

### 2. The largest finding: **every operation in this ticket is Node-only today, and a naive grant would break the cloud assistant at boot**

`1c preflight` already declares this (`preflight.ts:64`):

```
capture: ['playwright']          shot:  ['playwright']
diff:    ['playwright','sharp']  gate:  ['playwright','sharp']
```

Concretely:
- `cmdShot` (`shot.ts`) → `cmdRender` (Astro) + `startServe` (`node:http`) + Playwright + `writeFile`.
- `cmdCapturePage` (`capture/capture.ts`) → **four** browser passes + fourteen `mkdirSync`/`writeFileSync` sites.
- `cmdDiff`/`cmdGate` → `sharp`, a native module that cannot run in workerd at all.

The toolbox's only escape hatch is `extraOps`. Today it holds exactly one operation (`add_asset`) and that operation is **ungranted** — `instances.json` withholds `ManageAssets` — so its absence in the Worker is invisible. The fidelity surface would be granted. And `Toolbox._checkBindings` (`runtime.js`) throws `ConfigurationError` for any *enabled* operation the surface implements no method for.

**So a fidelity surface granted to the caretaker but implemented only in Node's `extraOps` doesn't degrade in the cloud — it fails the Toolbox constructor and the assistant never boots.** That is a hard sequencing constraint, not a nice-to-have.

REQ-154 (browser), REQ-155 (ReferenceStore), REQ-156 (sharp removal) are **all still `draft`**. Only REQ-149 is `free_coded`. This ticket cannot ship into the cloud ahead of them.

---

### 3. The picture-source vocabulary is the right idea, but three of the five sources aren't addressable yet

| Source | State today |
|---|---|
| captured reference (bundle id + viewport) | **No id exists.** `bundleDirFor` produces a *path* (`storage/references/<host>/<pathslug>`); every verb takes `--ref <dir>`. REQ-155 AC explicitly owns minting bundle identity. Blocked. |
| authored draft (slug + **page** + viewport) | **No page parameter.** `cmdShot` serves the site and shoots `handle.url` — the root, always. Per-page shooting is new. |
| the edit channel | `RenderChannel` is `'draft'\|'published'\|'edit'`, but `cmdShot` collapses to `flags.source === 'published' ? 'published' : 'draft'`. `edit` is unreachable. |
| a published **revision** | `SiteSource` supports `'latest' \| number \| string`, but `cmdShot` maps `published → 'latest'` only. A named revision is not shootable. |
| any URL | works today (`--url`). |

So "resolve all five through one function" is ~60% new plumbing under `cmdShot`, not a re-parameterisation. Worth stating in the ticket so it isn't discovered mid-build.

---

### 4. AC6 (SSRF) is entirely greenfield, and the guard can't live where you'd expect

The only URL guard in the repo is `assertSafeUrl` (`packages/framework/src/modules/safety.ts:53`) — a **scheme allowlist for rendered markup**. No IP-range logic, no redirect cap, no size cap, no timeout. `cmdCapturePage` validates nothing at all.

The design constraint the ticket doesn't state: **the browser follows redirects itself.** A pre-flight check on the typed URL cannot see a 302 to `169.254.169.254`, and cannot see DNS rebinding. The guard has to sit at or below the `BrowserDriver` seam (request interception / per-navigation allowlist), which makes it partly REQ-154's problem — Cloudflare Browser Rendering and Playwright intercept differently. Worth settling alongside REQ-154's Access-credential question rather than after it.

---

### 5. AC1 has a concrete shape problem worth deciding now

`createL1Toolbox` takes `knowledgeSurface?: {surface, granted} | null` as a **named slot** and merges grants by spread. A third surface makes that a list — `extraSurfaces: {surface, granted}[]`. Small, but it's the difference between "registered alongside" being true and being true-for-two.

Related: the knowledge grant *travels with the surface* because it's an imported bridge whose two scope axes must not drift. The fidelity surface is **local** (like `l1-surface.json`), so its grant belongs in `instances.json` as a second key under `caretaker`. Different mechanism, deliberately — worth writing down so a later reader doesn't "unify" them.

---

### 6. AC5 is factually off by two

`1c gate` names **five** verdicts, not three causes (`gate.ts:131`, `:286`):

`pass` · `structural-failure` · `capture-incomplete` · `reproduction-wrong` · `unexplained-disagreement`

AC5 says "which of the three causes it names." As written, `structural-failure` and `pass` are unspecified. Small fix, but an AC that under-describes the thing it's pinning is exactly how a reproduction quietly loses a verdict.

---

### 7. AC8 has a clean mechanism already available

Declare every operation `effect: 'read'`. The declaration parser enforces effect-homogeneous groups (`declaration.js:498`) and the policy gate refuses a write in a read-only grant. The *assertable* UAT: snapshot `store.counter(slug)` and the draft bytes before and after every fidelity operation, assert both unchanged. That satisfies "asserted, not asserted-by-inspection" mechanically.

---

### 8. One risk nobody has named: volume on the SSE wire

`router.ts:658` frames **every** stream event as `data: ${JSON.stringify(event)}`, and `toolEvent` carries `meta.output` verbatim (`api_tools.js:290`). A full-page desktop screenshot is routinely 0.5–3 MB; base64 adds a third. So a `screenshot` operation would push megabytes to the browser *and* into the model, per call, per tool-loop iteration — and the loop runs up to `MAX_TOOL_ITERATIONS` times per turn.

Three levers worth deciding in the ticket: a viewport/scale cap on the model's copy, JPEG rather than PNG for it, and stripping `meta.output` from the SSE frame for media-bearing results. Note upstream already has `cardEvent` (`stream.js:42`) — a structured widget payload with a renderer discriminator. That's the right route for showing the *operator* the picture, and it is a genuinely different concern from the model's copy. Conflating them is how this gets expensive.

---

### Recommended sequencing

1. **Settle the upstream media-return contract first**, as the ticket says — but scope it as "result normalisation grows a block form, with per-wire capability", not "`returns` grows a token."
2. **Do not grant the surface in the cloud until 154/155/156 land.** If you want value before then, the honest intermediate is a CLI-host-only grant with the Worker's `instances.json` withholding the group — which keeps `_checkBindings` happy and makes the absence a stated fact rather than a boot failure.
3. Fold the SSRF guard's *placement* decision into REQ-154 rather than here.
4. Fix AC5's verdict list and add the picture-source gaps (page, edit channel, named revision, bundle id) to the ticket body before implementation.

---

Nothing changed on disk. Want me to record these findings on REQ-157 (a comment, or an appended `## Investigation` section preserving the existing body), and/or raise the two upstream questions as their own tickets?

<!-- xgd-chat-end -->