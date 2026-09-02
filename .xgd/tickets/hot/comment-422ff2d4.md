---
uid: comment-422ff2d4
id: COMMENT-1439
type: comment
title: Comment on request REQ-157
created_by: xgd
created_at: '2026-08-23T23:44:16.672211+00:00'
updated_at: '2026-09-02T21:21:53.863514+00:00'
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

<!-- xgd-turn id="e0158f95-2aa6-4067-9b2b-9a5eb14e3ce6-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T20:23:47.343448+00:00" -->
#### You
Are we ready to code this?

<!-- xgd-turn id="e0158f95-2aa6-4067-9b2b-9a5eb14e3ce6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T20:27:14.896033+00:00" -->
#### Claude
## Nearly — three decisions and one body fix stand between here and coding

I re-checked everything against the tree as it stands today (2026-09-02). **The blocking finding from August is gone**: all four dependencies have landed.

| | Aug 23 | Today |
|---|---|---|
| REQ-149 revisions | `free_coded` | `free_and_reconciled` |
| REQ-154 browser | **draft** | `free_and_reconciled` |
| REQ-155 ReferenceStore | **draft** | `ready_to_reconcile` |
| REQ-156 sharp | **draft** | `ready_to_reconcile` |

And they landed *well* — better than the ticket assumes in three places:

- `apps/control-app/src/shot.ts` already gives the Worker `shotUrl(url, viewport)` and `shotPreview({slug, channel, path, viewport})`. Its own header says *"No route answers this yet, on purpose… it belongs to REQ-157."* Four of the five picture sources are already reachable.
- `capture/capture.ts` now takes an injected `ReferenceStore` + `driverFactory` and has **no `node:fs` in its import graph**. Capture runs in workerd.
- `perceptual-core.ts` was split out from `perceptual.ts` precisely so the maths imports cleanly into an isolate; `png.ts` is a pure-JS codec. Diff and gate are portable — only their CLI wrappers still touch `node:fs`.

So the "grant it and the Toolbox constructor throws at boot" risk is retired.

---

### What still has to be decided before code

**1. How the image reaches the model — the ticket's own "settle this first", and it is now a *choice*, not a wait.**

Upstream **REQ-111 landed** (`cb17ec80d7`) — but it widened the **input** side: `promptStream`/`prompt` accept `{type:'image', mediaType, data}` blocks, with a `vision` capability and a shared refusal gate. It did **not** touch the tool-result path. I verified: `toolbox/declaration.js::parseReturns` still accepts only `{shape, provenance, max_bytes}`; `provenance.serialize/mark/normalise` are still string-only; `runtime.run` still returns `payload` and records `payload.length`.

That leaves two routes:

- **(a) Upstream again** — grow the toolbox result path a block form. Correct, but it's a second round-trip, and it drags in the two problems I flagged in August that REQ-111 sidestepped: `OpenAIWire.record` pushes `{role:'tool', content}`, which cannot carry images at all, and `mark()` has no rule for wrapping a non-text block in the untrusted markers.
- **(b) Host-side injection, available *today*** — `screenshot` returns a handle; the host attaches the bytes as a `{type:'image'}` block via REQ-111's widened surface. No upstream work, works on OpenAI (REQ-111 already translates to `image_url` on a user message), and provenance is labellable separately from the block.

The cost of (b) is real and should be stated rather than discovered: **the image lands on the next turn, not inside the same tool-loop iteration.** "Shoot → look → adjust" then costs a turn per look instead of an iteration. Whether that's acceptable is the decision.

AC3 as written — *"a UAT asserts an image content block reaches the backend; asserting that a key or a URL was returned does not satisfy this"* — is satisfied by **either** route, which I don't think was intended. It needs to say which.

**2. Published revisions are still not shootable.** `PreviewChannel = 'draft' | 'edit'` — no published member, and nothing renders a *named* revision to a preview URL. Four of the five rows in the picture-source table work; that one is new plumbing. Either add a published channel to `PreviewRenderer` or drop the row.

**3. SSRF has a home now, but nothing in it.** `shotPreview` proves the driver can intercept per-request (`driverFactory({ origin: resolver })`), which is exactly where the guard must sit — a pre-flight check on the typed URL cannot see a 302 to `169.254.169.254`. So AC6 is buildable here rather than deferred to REQ-154, but it is entirely greenfield: the only URL guard in the repo is `assertSafeUrl`, a scheme allowlist for markup.

**Body fix:** AC5 says *"which of the three causes it names"*. `gate.ts` names **five** verdicts — `pass`, `structural-failure`, `capture-incomplete`, `reproduction-wrong`, `unexplained-disagreement`.

---

### Two small things that are just work, not decisions

- `createL1Toolbox` still takes `knowledgeSurface?: {surface, granted} | null` as a **named slot** (`toolbox-core.ts:502`), not a list. AC1's "registered alongside" needs it generalized to `extraSurfaces[]`. Ten lines.
- The fidelity grant is a *local* surface, so it belongs in `instances.json` under `caretaker` — not travelling with the surface the way the knowledge grant does. Worth a comment so nobody later "unifies" them.
- Still unaddressed and still real: `router.ts:658` frames every stream event as `data: ${JSON.stringify(event)}` and `toolEvent` carries `meta.output` verbatim. A desktop screenshot is 0.5–3 MB before base64, per call, per loop iteration. Route (b) above partly dodges this; either way, decide whether `meta.output` is stripped for media-bearing results and whether the operator's copy goes via `cardEvent` instead.

---

**My recommendation:** take route (b), pin AC3 to it explicitly, drop the published-revision row (or split it out), fix AC5's verdict list, and code it in this session. That makes REQ-157 self-contained — no upstream dependency — at the price of a stated turn-boundary in the look-and-adjust loop.

Want me to write those decisions into the ticket body and start?

<!-- xgd-turn id="cfc59f46-dbf5-4492-bc28-6616786eb9e5-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T20:44:40.145264+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="cfc59f46-dbf5-4492-bc28-6616786eb9e5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T21:14:41.516684+00:00" -->
#### Claude
I'll state my assumptions up front so you can redirect me early, then start. Reading the protocol and the precedent surface now.

Now the key implementation questions. Let me check how object params are declared, and the store/preview seams I'll build on.

I have what I need on the transport question — and it changes my recommendation. Checking the store port for revisions, then I'll scope and start.

I have everything I need. One finding changes my earlier recommendation, so let me put the questions to you before I commit to it — but I'll scope the ticket and start on the parts that don't depend on the answer.

**The transport is already open — I was wrong that this needs upstream work.** Our tools are registered as closure `Tool`s (`host-core.ts:470`), and `ToolSet.run` returns a closure handler's value *unmodified* (`api_tools.js:127`). So an array of content blocks returned from `screenshot` flows straight through `ToolOutcome` → `AnthropicWire.record` → `content: [{type:'image',…}]`. No `@lagrangefoundry/ai` change, and the image lands **inside the tool loop** — same turn, no turn boundary.

The catch is on the other side of the same value: `api_tools.js:308` also yields it as `toolEvent(meta.output)`, and `manager.js:367` appends that as a `TOOL` record — which is in `CONTENT_KINDS`, so it is drained to the durable transcript and carried across recycles. There is no `turn_start`-style redaction for tool records.

So the real trade is **transcript weight**, not turn latency. My answers:

**Q1 — Cap the screenshot, go inline?** I propose `screenshot` downsamples to 1024px longest edge (~200–300 KB base64) and returns real image blocks in-turn. Anthropic downscales above ~1568px server-side anyway, so the cap costs no fidelity the model could have used, and it bounds what lands in the transcript. I'll also strip `meta.output` in our own `streamPrompt` before it reaches the SSE, which fixes the browser-bandwidth half outright. **Default: yes.**

**Q2 — Published revisions.** I can close the fifth picture source properly rather than dropping it: `store.readRevision(slug, id)` returns a `StoredSnapshot`, so a `rev-<id>` channel on `PreviewRenderer` renders it through the same `renderSiteFiles` and `previewOriginResolver` serves it to the browser. Assets come from the snapshot's own bytes, not the draft's, so a revision shot shows that revision's logo. **Default: build it.**

**Q3 — Scope check.** This is a new surface + 5 operations + SSRF guard + revision channel + UATs. That is large for free-coding. **Default: proceed as one free-coded ticket** — say the word if you'd rather it went through `xgd develop`.

Starting on the ticket scope now.

Ticket scoped and at `free_coding`. Cutting the branch.

Now let me read the pieces I'll build on.

Design is settled. Writing code now, starting with the portable primitives.

Now the SSRF guard — the piece AC6 asks for.

Now wiring the guard into the driver's request seam.

Now the revision channel — the fifth picture source.

Now the picture-source vocabulary — the one resolver every operation takes.

Now the surface declaration.

Now the operations themselves.

Now generalising `createL1Toolbox` to a list of surfaces, and the grant.

Now the caretaker grant, and the Worker composition root.

Now the Worker composition root — where the browser, the store and the origin come together.

Now the real Worker composition root.

Now the UATs. Checking the fixtures I can build on.

Now writing the UATs.

Real finding: `capture_site` was retrying three times against a link-local address before the guard stopped it. Adding the pre-flight check.

Now AC5 — the verdict reconciliation.

27 passing. Now checking I haven't broken the suites around this.

Real regression — the static grant names a surface a browserless deployment won't have. Checking how a surface reports its name.

Now the full node suite, to see what else this touched.

<!-- xgd-turn id="98dab462-c4e4-451a-9f37-40100f661659-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T21:21:53.168187+00:00" -->
#### You
please complete the free-coding of this ticket

<!-- xgd-chat-end -->