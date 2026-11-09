---
uid: bundle-7ba3af93
id: BUNDLE-42
type: bundle
title: BUG-73 + BUG-75 + REQ-216 + REQ-215 + REQ-223 + 1 more
created_by: xgd
created_at: '2026-11-08T20:38:01.654591+00:00'
updated_at: '2026-11-09T02:50:05.062963+00:00'
completed_at: '2026-11-09T02:43:30.288706+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  bundle_type: reconcile
  commits:
  - working_sha: null
    reconcile_sha: null
    main_sha: 9b4bf16e21ad91c89cb757230a07f3ef21fc7567
  auto_merge_back: true
  priority: medium
  regression_anchor_uid: report-0758e7c5
  session_planner: 119fb0b8-a509-4f50-be1f-30c7f349a56d
  session_planner_started_at: '2026-11-09T01:35:09.911618+00:00'
  session_builder: 71a2507f-cea4-4194-a042-98724241a0f4
  session_builder_started_at: '2026-11-09T02:20:16.118585+00:00'
  session_assessor: 63105d84-6691-4d9c-b985-a80de47dac91
  session_assessor_started_at: '2026-11-09T01:58:31.459302+00:00'
  merged_at_commit: 9b4bf16e21ad91c89cb757230a07f3ef21fc7567
---

# Bundle

This ticket bundles the following source tickets:


---

## BUG-73: Dev server: opaque `internal error; reference=…` bursts from the remote AI binding

## Symptom

`wrangler dev` (control-app, port 8788) prints bursts of

```
✘ [ERROR] Error: internal error; reference = 6knvuijid52gaa1eks2l9jl5
```

with no request line, no stack, and no indication of which binding or code path
produced them. Twelve appeared in one sitting.

## Evidence gathered (2026-09-10, not yet a confirmed root cause)

From `~/Library/Preferences/.wrangler/logs/wrangler-2026-09-10_19-01-21_076.log`:

- The bursts are **exactly three errors, same millisecond**, at four distinct
  times: 19:31:39, 19:32:47, 19:38:41, 19:38:58.
- The last remote-preview session was established at **19:23:21** (`⎔ Starting
  remote preview...` → `POST …/workers/scripts/1stcontact-control-app/edge-preview`).
  The first burst is **8m18s later**, and every burst after it also fails.
- No further `edge-preview` POST appears in the log — wrangler does **not**
  refresh the preview token on a timer. Its only handling of expiry
  (`handlePreviewSessionUploadError`, CF error code 10049, *"Preview token
  expired, fetching a new one"*) fires on **re-upload**, i.e. on a worker reload.
- `env.AI` is the **only remote binding** in `apps/control-app/wrangler.toml`
  (DB, SITES, BLOBS, BROWSER, ASSETS are all local). Everything else that could
  fail would fail locally.
- Workers AI itself is healthy: a direct REST call to
  `@cf/baai/bge-small-en-v1.5` on account `8feaadfce959…` returns vectors.
- `internal error; reference = <id>` is workerd's *sanitised* internal-error
  form. The detail is not surfaced anywhere wrangler writes.

## Leading hypothesis

wrangler's remote-binding preview session expires roughly 8–10 minutes after the
last worker reload and is never refreshed while the dev server sits idle. Every
`env.AI` call after that point fails, so **every knowledge-base search in the
chat panel fails** until a file is touched and the worker reloads.

Consequence for the operator: the chat's `search_knowledge` / `chunk_search`
stop working silently after a few idle minutes, and the only signal is an opaque
`internal error` in the console.

## Not yet established

- The three-per-burst count is unexplained. `CoRankedKnowledge.search` fans out
  over 2 KBs under `Promise.all` (which attaches handlers, so it produces no
  unhandled rejections); the third call is unaccounted for.
- No reproduction has been run. The diagnosis is from log timing plus the
  binding inventory, not from a triggered failure.

## Candidate fixes (undecided — operator to choose)

1. **Workaround only**: touch a source file (or restart `pnpm dev`) to force a
   re-upload and a fresh preview token.
2. **Stop using the remote binding in local dev.** `WorkersAiEmbedder` already
   supports `{accountId, apiToken}` over REST — the path `1c kb build` uses. If
   local dev selects the REST embedder when a token is present, `env.AI` is not
   needed locally at all: no preview session, no expiry, no per-call charges, and
   the standing *"AI bindings always access remote resources"* warning goes away.
3. **Make the failure legible.** Whatever the cause, an embedding call that fails
   should surface as a named error naming the binding and the KB, not as a bare
   workerd reference id.

Production is unaffected either way: a deployed Worker reaches Workers AI
in-datacentre with no preview session involved.


---

## Scope (decided 2026-09-10): fixes 2 and 3, together

Fix 1 (touch a file to force a reload) is the workaround and is not implemented.

### B1 — one place decides how this deployment embeds

Today three sites spell `new WorkersAiEmbedder({ binding: env.AI })`
(`knowledge.ts`, `system-knowledge.ts`, and the `env.AI` gate in
`session-knowledge.ts`, with a fourth `!env.AI` gate in `router.ts`'s
`defaultIndexer`). Four independent answers to "can this deployment embed, and
how" is four places to update and three places to forget. The decision moves
into one resolver the four call.

### B2 — a REST transport, selected by configuration

When **both** `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are present in
the environment, the embedder reaches Workers AI over REST — the transport
`WorkersAiEmbedder` already supports and `1c kb build` already uses — and
`env.AI` is not touched at all. This is what `apps/control-app/.dev.vars` sets,
so `wrangler dev` stops depending on the remote binding: no preview session, no
expiry, no per-call remote charges, and the standing *"AI bindings always access
remote resources"* warning goes away.

The variable names are the ones `resolveEmbedder` in `tools/generate/src/cli/kb.ts`
already uses, deliberately: it is the same credential reaching the same model,
and a second name for it would be a second thing to rotate. The account id is
**required** here rather than discovered from the token as the build discovers
it — a Worker has nowhere to cache a discovery, so the alternative is a REST
round-trip on every cold start to learn a value that never changes.

### B3 — the deployed Worker is unchanged

With neither variable set, the binding is used exactly as it is today. Production
sets neither, so nothing about a deployment changes: it still reaches Workers AI
in-datacentre, with no credential and no extra hop.

### B4 — half the configuration is an error, not a fallback

One of the two present without the other raises a named error naming the missing
one. Falling back to the binding would leave an operator who set the token and
forgot the account id with exactly the symptom this ticket exists to remove —
the remote binding failing — while believing they had switched it off.

### B5 — neither variable may appear in `wrangler.toml`

`CLOUDFLARE_API_TOKEN` is a bearer credential and `wrangler.toml` is committed;
`[vars]` would publish it and `[env.production.vars]` would push it to the
deployed Worker. Both are dev-only, so neither is named in that file in either
environment — the same rule the file already records for `RESEND_API_KEY`.

### B6 — an embedding failure says what failed

An embedding call that throws surfaces as a named error carrying **which
transport** (binding or REST) and **which knowledge base** it was embedding for,
with the underlying message preserved. For the binding transport specifically,
the message says that an `internal error; reference = …` under `wrangler dev`
means the remote preview session has expired, that a worker reload refreshes it,
and that setting the two variables above avoids the transport entirely.

This is the half that pays off whatever the cause turns out to be: the burst of
opaque reference ids that opened this ticket becomes a sentence naming the
binding, the KB, and the thing to do about it.

### B7 — the absent case degrades exactly as it does today

Nothing about "no embedder at all" changes. The project KB still raises
`AiNotConfiguredError`, because a client's uploads that embed nowhere are
invisible; the system KB still returns `null`, because a builder that cannot
answer a question about the design documents is still a builder; and a session
still opens with whichever halves it can.


### B1a — and nothing outside the resolver reaches for the model

`embedder.ts` is the only module that constructs a `WorkersAiEmbedder`, and no
module outside it decides anything from `env.AI` directly. That is what makes B1
hold over time rather than on the day it lands: the drift that produced the
four-way split was each site answering the question locally, and a fifth site
doing the same next month would reintroduce it silently.

### B6a — the wrapper is transparent apart from the message

The thing that names the failure delegates to the real embedder rather than
replacing it, and forwards the model identity (`name`) and vector width
(`dimension`) it carries. Those two are read by the index build to size its
vectors and by search to refuse an index built by another model, so a wrapper
that dropped them would turn this ticket's legibility fix into exactly the
model-comparability corruption `embedder.ts` opens by warning about.

An already-named failure is not renamed a second time.


---

## Landed 2026-09-10 — `apps/control-app/src/embedder.ts`, v0.2.153

`c5710f5` (code + 21 UATs), `884d634` (version bump). All of B1–B7 implemented;
fix 1 (touch a file to reload) remains the workaround and was not automated.

### Operator step still outstanding

The REST transport is CODE-COMPLETE but NOT SWITCHED ON. The sandbox that wrote
this cannot write outside the repository, so the credential half never landed:

```
printf 'CLOUDFLARE_API_TOKEN=%s\n' "$(tr -d ' \n' < ~/Documents/secrets/1c_Admin_Token)" \
  >> ~/Documents/secrets/1c.dev.env
```

then uncomment `CLOUDFLARE_ACCOUNT_ID` in `apps/control-app/.dev.vars`, where it
is already written with the account id and a note, and restart the dev server.
`1c_Admin_Token` specifically — the other two Cloudflare tokens in that directory
return `Authentication error` from `/ai/run/…`, which was confirmed by REST call
during the diagnosis above.

Until then the binding is still in use, so the bursts can still occur — but they
now arrive as a sentence naming the binding, the knowledge base and the reload,
instead of a reference id.

### Known-failing at the branch point, unrelated

`tests/test_UAT_FC_REQ-160_two_kb_session.workers.test.ts` fails 3 of 8 on a
clean `xgd-working` checkout and fails the same 3 after this change.


---

## BUG-75: capabilities.js is a syntax error — no behavior module client code runs

# `capabilities.js` is a syntax error — no behavior module has run since 2026-09-05

## Symptom

On every site, in the `draft` and `published` channels, **no behavior module's
client code runs at all**. Each module fails differently, and each failure reads
as its own separate design question rather than as one shared defect:

- **account-chrome** — the sign-in dialog renders inline at the top of the page,
  open, and never becomes an overlay. Clicking "Sign in" does nothing. This is
  the symptom that surfaced the bug, on 1st Contact's own home page.
- **contact-form** — submitting posts natively and navigates the visitor off the
  page instead of swapping the success message in inline.
- **carousel** — no autoplay, no dot indicator.
- **account-portal** — identity and holdings lines stay blank; the erasure
  explanation stays expanded.

## Root cause

`packages/framework/src/modules/module-assets.ts` exports `MODULE_CLIENT_JS`, the
concatenation of every catalogued behavior's `client.js`. `renderSiteFiles`
writes it as `capabilities.js` and the page references it as
`<script type="module" src="./capabilities.js">`.

The concatenation is `jsParts.join('\n\n')`
(`tools/generate/src/cli/module-assets.ts`) — a flat splice into **one module
scope**. Three behaviors each declare `ERROR_SELECTOR` at top level:

| behavior | value |
|---|---|
| `contact-form` | `'[data-contact-error]'` |
| `account-portal` | `'[data-account-error]'` |
| `account-chrome` | `'[data-account-chrome-error]'` |

Two `const` declarations of one name in one scope is a **parse-time** error, so
the browser discards the whole file before executing a line:

```
SyntaxError: Identifier 'ERROR_SELECTOR' has already been declared
```

Every behavior in the bundle dies, including the ones whose own names never
collided.

## Why it went unnoticed for five days

The bundle broke at `03f961b34c` (2026-09-05), where `account-portal` introduced
the second `ERROR_SELECTOR` alongside `contact-form`'s. `account-chrome`
(`9ff59758e8`) added the third the next day.

Each behavior's `client.js` is unit-tested **individually**, by importing the
source file. The [[REQ-145]] UAT asserts that `module-assets.ts` still matches
its sources — byte equality, not validity. **Nothing anywhere parses the composed
bundle.** Every input is correct; the composition is not, and the composition is
what ships.

The symptom was also disguised by the substrate working as designed. Each module
is built to fail VISIBLE ([[REQ-200]], [[REQ-183]], [[DOC-37]] §6.2): with no
script, `account-chrome`'s dialog is an ordinary in-flow part of the page, open,
and its address can still be submitted. So the broken page looked like a
deliberate no-JS baseline rather than a failure — which is exactly the property
that makes fail-visible safe, and exactly what let this sit unreported.

## What must change

**The composition must not depend on behaviors choosing unique top-level names.**
Renaming `ERROR_SELECTOR` fixes today's collision and re-breaks on the next
behavior that picks a common name; the identifiers are private to each file and
nothing about authoring one says the namespace is shared.

So each behavior's `client.js` is composed **into its own scope**:

1. Each behavior's source is wrapped in a block, so its top-level `const`, `let`,
   `function` and `class` declarations are block-scoped to it. Two behaviors may
   declare the same top-level name and the bundle still parses.
2. The `export ` prefix is stripped as part of that wrap, because `export` is not
   legal inside a block. This costs nothing: the bundle is self-wiring — every
   behavior ends with its own DOM-ready auto-init — and nothing imports it. The
   exports exist for the unit tests, which import each `client.js` source
   directly and are untouched.
3. Each behavior keeps its `/* behavior: <id> */` marker so the bundle stays
   readable and attributable.

**The composed bundle must be checked for validity, not just for freshness.** A
UAT parses `MODULE_CLIENT_JS` as an ES module and fails if it does not, so this
class of defect cannot return silently the next time two behaviors agree on a
name.

## Not in scope

[[REQ-212]]'s L1 dialog is unaffected: it emits its own inline `<script>` in the
body (`l1/render.ts`) rather than riding in `capabilities.js`, so modals authored
through the L1 overlay role were never touched by this. The fix does not change
that path.


---

## REQ-216: The AI must be able to drive the page before it photographs it

# The AI must be able to drive the page before it photographs it

## What prompted it

Asked to build a sign-in modal, the product AI styled it, was told it still did
not look like a modal, and replied that it could not check: *"I only have the
inline preview to work from"*, *"I can't personally click 'Sign in' and watch it
open, because I only ever get a picture, not an interactive page."*

The second half of that is true and is this ticket. The first half was not —
`kind: 'draft'` existed and it never tried it — but the true half is the one that
matters, because it is why the AI reasoned from a picture instead of from the
page, and then defended a story about "preview mode" that was invented rather
than observed.

A modal is the clearest case and not a special one. **Anything reached by an
interaction is invisible to the AI today**: a modal, a carousel past its first
slide, a disclosure, a form's success state, a hover treatment, a focus ring.

## The capability

`picture` gains a way to say **what state the page should be in before the
shutter opens**. On the `draft` channel the behaviour scripts are live, so the
state produced is the real one — the actual modal, opened the actual way, not a
reconstruction.

The minimum that answers the prompting case: name a control to activate before
the shot, so the AI can open the sign-in dialog and photograph it. The natural
generalisation is a short ordered list of interactions — activate this, then
this — because a success state needs a field filled and a form submitted, and a
carousel's third slide needs two advances.

## Constraints

- **The picture must remain evidence.** Whatever the AI asks for has to have
  actually happened to the page. If a requested interaction cannot be performed —
  no such control, nothing happened, the page never settled — that is a refusal
  that names what failed, not a picture of the page in the wrong state. A tool
  whose output is believed must not return a plausible wrong answer; that is the
  same reasoning [[REQ-154]] used to keep the browser off the network.
- **It names what the operator would name.** The AI should ask to activate "the
  Sign in control", not a CSS selector or an internal attribute. Selectors are
  substrate detail the document layer deliberately does not expose
  ([[REQ-100]], [[REQ-108]], [[REQ-212]] all turn on the AI never naming one),
  and a tool parameter is not the place to hand that back.
- **`edit` remains inert.** This is a `draft`-channel capability. The edit
  channel ships no behaviour by [[REQ-116]], and driving it is [[REQ-215]]'s
  problem, not this one.
- **Failure is loud.** An interaction that half-worked must not photograph
  quietly.

## The second, cheaper half

Independently of driving the page: **a picture should say which channel it is
of, and what that channel does not do.** A `kind: 'edit'` picture returned with
one sentence — *behaviour is off in this channel; panels, carousels and
disclosures show their settled state* — would have ended the prompting exchange
before it started, because the AI would have known the page it was looking at was
not the page a visitor gets.

This is worth shipping first. It is a caption, it costs nothing, and it converts
the failure mode from "the model invents a mechanism" to "the model reads the
label".

## Related

[[REQ-215]] is the operator-facing half of the same problem — carrying page
state across a channel switch. Both want a handle on "which panel is open" and
should be designed together even if they ship apart.


---

## What was built

### `after` — a short ordered list, in a closed grammar of two forms

A picture of the site's own draft may carry `after`: an ordered list of short
phrases saying what to do to the page before the shutter opens. There are
exactly two forms and no third, which is [[REQ-212]]'s own argument about its
two disclosure verbs applied here — every general *do X to Y* vocabulary ends as
a scripting language with a parser in front of it, at which point what a caller
can make a page do is no longer bounded:

- `click "Sign in"` — activate the control called that.
- `fill "Email" with "someone@example.com"` — put that text in the field called
  that.

The steps are carried out **in order**, one at a time, and the run stops at the
first failure — a panel's Close cannot be found until the panel is open, so
carrying on past a failure would produce a second, misleading refusal about the
state the first failure prevented.

Quoting a name is optional and is what to reach for when the name itself
contains the word `with`. Anything that is not one of the two forms is refused,
and the refusal states both forms rather than only saying no.

A menu is set by **the words a person reads on it** rather than by the value the
markup carries: `fill "Country" with "United Kingdom"` matches the option's
label first and its value second, because a value attribute is a developer's
word and this vocabulary is deliberately the operator's.

### Naming, and what "cannot be performed" covers

A control is named the way an operator would name it, matched against what the
page actually calls itself — a field's label, `aria-label`, a control's visible
words, a placeholder. There is no way to name a selector, an id or an attribute,
and the surface says so in its own absences.

Every one of the following is a refusal that names what failed, and produces
**no picture at all**:

| What happened | What the refusal says |
|---|---|
| Nothing on the page carries that name | lists what is actually there |
| Several things carry it | says how many and which, and asks for an exact name |
| Something carries it but is not visible yet | says so, and that whatever holds it must be opened first |
| A click that changed nothing | names the control it clicked |
| A field that did not take the value | says what it still reads |
| The page never settled | says how long it was given |

Visibility is decided by an ancestor walk over computed style, not by a
rectangle: a closed panel's own Close control is `display: none` through its
shell, which is exactly the case that has to be excluded so that a header's
"Sign in" is not read as ambiguous against the "Sign in" inside a panel nobody
has opened.

"Nothing happened" is decided by fingerprinting the page — its markup, its
scroll position and what holds focus — before and after. The element is focused
*before* the fingerprint is taken, because focusing is how a click arrives
rather than something the click did.

### Which pictures can be driven, and why the rest refuse

`draft` only, and each of the other four refuses for its own stated reason
rather than under a blanket rule: `edit` ships no behaviour at all ([[REQ-116]])
so there is nothing on it to open — driving that channel is [[REQ-215]]'s
problem; `reference` is a recording of a page rather than a page; and
`revision` and `url` are live systems belonging to the published site and to
strangers, where a click would really submit a form or really send a request.

Both the refusal by kind and the refusal of an unreadable phrase happen **before
a browser is leased**, so an obviously bad ask does not cost a metered session.

### Two technical consequences

- **A driven shot is laid out at the width it is driven at.** A control that
  only exists below 768px cannot be clicked on a page laid out at 1280, so a
  step named at `mobile` would refuse correctly and uselessly. An undriven shot
  keeps its existing load-wide-then-resize behaviour exactly.
- **The value gates are driven the same way.** `check_fidelity` reads a live
  page for its value manifest; a manifest read off the closed page while the
  picture beside it shows the open one would be two readings of two different
  states reported as one reading of one page.

## The second half, as shipped

An `edit` picture carries a caption — one sentence saying that the channel ships
no behaviour, that panels, carousels and disclosures show their settled state,
and that a `draft` picture is what shows a visitor's page. It travels on the
same text block that already says what was looked at, so a transcript with the
image redacted out still carries both.

It also travels with a **measurement**, not only with an image: `compare`
reports the caveat when either side came from that channel, because a comparison
against a page whose behaviour is off is exactly where a wrong conclusion gets
drawn confidently.

## Where the code is

- `tools/generate/src/cli/capture/interact.ts` — new. The grammar, the page-scope
  script, and `drivePage`.
- `tools/generate/src/cli/picture.ts` — `after` on a picture source, the
  draft-only rule, the channel caption.
- `tools/generate/src/cli/capture/screenshot.ts` — drives between navigate and
  shutter.
- `tools/generate/src/cli/ai/fidelity-core.ts` — the caption on the block the
  model reads and on a comparison; the value gates driven alike.
- `tools/generate/src/cli/ai/fidelity-surface.json` — `after`, the
  `INTERACTION_FAILED` refusal, the two new absences, surface_version 3.

## Test plan

`tests/test_UAT_FC_REQ-216_drive_the_page.test.ts`. The page is the sign-in
shape this ticket describes, put through the shipped L1 renderer with the vetted
modal script the renderer emits; the interaction script is the shipped one, run
in page scope. Only the browser is doubled, and it is jsdom rather than a stub.
The load-bearing observation is which panels stood open **at the moment the
shutter was called** — a picture taken of the closed page while reporting the
step succeeded is the failure this ticket exists to make impossible, and no
assertion about a return value would catch it.

## Deliberately not in scope

- Driving the edit channel — [[REQ-215]].
- A third verb, or any way to say something the two forms cannot.
- Naming any part of the page by selector.


---

## REQ-215: Switching channel must preserve what the page is showing

# Switching channel must preserve what the page is showing

## What prompted it

An operator building 1st Contact's sign-in modal was looking at the home page in
**View**, opened the sign-in dialog, and switched to **Edit** to change the copy
inside it. The dialog was not there. The edit render is a fresh load of a
different channel, so every piece of state the visitor's own interaction had
produced was gone — and the one thing they wanted to edit was reachable only
through an interaction the edit channel cannot perform.

The general shape: **the two channels are two renders of the same page, and the
operator experiences them as one page with a toggle.** Anything that breaks that
illusion reads as the builder losing their place.

## The rule

Switching between View and Edit shows **the same page in the same state**.

- Looking at the home page in View, switching to Edit shows the home page.
- Looking at the home page with the sign-in modal open in View, switching to Edit
  shows the home page with the sign-in modal open — and the copy inside the modal
  is editable, like any other copy on the page.
- Switching back returns to the page as it was.

Scroll position and which page of a multi-page site is showing are the same
question and are covered by the same rule.

## The tension this has to resolve

[[REQ-116]] makes the edit channel deliberately inert: it ships no behavior
client bundle and no L1 behaviour script, because the edit bridge resolves a
click to "edit this region" and a live page would resolve the same click to
"navigate" or "open the panel". That inertness is not incidental — it is what
makes a click unambiguous.

So the edit channel cannot simply run the behaviour and be driven into state the
way View is. Something has to carry the state across the switch and reproduce it
statically. The likely shape is that the panel-bearing surfaces declare their
open/closed state as something the edit render can be *told*, rather than
something it computes by running a script — but the design is open and belongs to
whoever picks this up.

Two constraints on any answer:

- **A click in Edit must still mean "edit this".** Whatever reproduces the state
  must not reintroduce a second meaning for a click.
- **The edit render's geometry must match the draft's.** [[REQ-116]] already
  turns on this; a modal reproduced in Edit has to lay out where it lays out in
  View, or the operator styles against a lie.

## Related

Carousels ([[REQ-96]]) and the account portal's erasure disclosure
([[REQ-183]]) have the same shape: content behind a behaviour, with a settled
state the edit channel shows instead. Today each declares its own settled state
in CSS keyed off `data-fc-edit`. A general answer to this ticket should say
whether that mechanism grows to carry *which* state, or is replaced.

[[REQ-216]] asks for the AI-facing half of the same capability — driving a page
into a state before photographing it. The two want the same underlying handle on
"which panel is open", and should be designed together even if they ship apart.
---

## The design

### 1. What is carried

Three things, and they are one question asked three ways — *what is this reader
looking at?*

| carried | read from | reproduced by |
|---|---|---|
| **which page** | the frame's own location, relative to the channel root | composing the other channel's URL with the same relative path |
| **where on it** | the document's scroll offset | scrolling the new document to it |
| **which panels are open** | the dialog shells carrying the open marker | see §3 |

The first two were simply never carried: the toggle recomputed the channel root
and threw the rest away, so switching channel on `/about` returned to the home
page at the top. Those are a URL and a number. The third is the one the ticket
was filed about.

### 2. The edit render gains the shell it was missing

Today the edit channel drops the whole modal apparatus, not just the script:
`isDialog` is false when rendering for edit, so there is no covering shell, no
`data-l1-dialog`, no `role`, and none of the overlay stylesheet. A panel is an
ordinary in-flow box and there is nothing in the document that could be *told*
anything.

So the edit render now emits **exactly what the draft render emits, minus the
script and minus the acting attribute**. The shell, its id, the `role`, and both
halves of the overlay stylesheet are channel-independent.

This changes nothing about how the edit render looks on its own. Every overlay
rule is gated on `data-l1-dialog-ready`, which only a script sets — so with no
script the shell is `display: contents` and the panel lays out in flow, open and
settled, byte-equivalent to today plus an inert wrapper. [[REQ-116]]'s
inertness is untouched: no script, no listener, no acting attribute, and a click
still means "edit this".

What it buys is that the edit document now carries **the same handle on
open/closed that the draft document does** — and REQ-212 already made that
handle a pair of plain attributes rather than script-held state, precisely
because the CSS had to be able to read it.

**This supersedes [[REQ-212]] §5.7 and its acceptance 12** in one narrow
respect: the edit render still emits no dialog script and an action node still
loses the attribute that would act, but "no shell, no role" is replaced by "the
shell and the role, always". §5.7's own goal — *the edit render differs from the
draft render by the missing behaviour and nothing else* — is what the change
serves; it was the one place the implementation fell short of it.

### 3. Reproducing the state is a client-side act, not a render input

The panel-bearing surface is *told* which state to be in by having the marker
set on it — `data-l1-dialog-ready` on the document, `data-l1-open` on the shells
that are open. That is the same instruction the script gives, given by the
builder instead, across the same-origin boundary it already reaches through to
mount the edit bridge.

It is deliberately **not** a render-time parameter on the preview URL. A render
input would have to thread through the router, the preview renderer, its
`(slug, channel)` memo, the page assembler and `L1RenderOptions`, and would
multiply the cached file set per state — to produce markup the client can
produce by setting two attributes. Nothing is shipped into the page: the code
runs in the builder, and the rendered document remains as inert as [[REQ-116]]
requires.

The two channels reproduce state differently, and the difference is the point:

- **Edit** — the markers are set directly. There is no script to run and none is
  wanted; the existing gated stylesheet does the rest, so the panel lands where
  it lands in View because it is laid out by the same rules.
- **View** — the opener is **activated**. The draft channel has the live script,
  so the panel opens the way a visitor opens it: focus moves in, the scroll lock
  goes on, `aria-expanded` tells the truth. Setting the attribute by hand would
  produce a panel that looked right and behaved like nothing had happened.
  Closing is the same act in reverse and for the same reason: a panel the state
  says is shut is shut by **activating what shuts it** — its own Close, or, for
  a panel that does not contain one, the scrim, which is the gesture of clicking
  beside it and which a panel that has opted out of scrim dismissal declines
  exactly as it declines a reader's. Removing the marker instead would leave the
  focus, the lock and the opener's `aria-expanded` all still saying it was open.

That asymmetry is the same distinction [[REQ-216]] draws for the AI's half —
drive the draft page, reproduce the edit one — and both are served by one shared
handle on "which panel is open", which is what this ticket contributes.

### 4. Does the `data-fc-edit` settled state grow to carry *which* state?

**No — it is left exactly as it is, and it is now the fallback rather than the
answer.**

The carousel's rule says out loud that the channel must not know what a carousel
is. A settled state is a surface saying *"with behaviour off, show everything"*,
which is the honest thing to render when nobody has said what state the page was
in. It cannot say *which* state, because saying which requires a name for the
state and modules do not have one.

So the two mechanisms stack rather than compete:

- **Nothing carried** — the edit render is opened on its own, in a new tab,
  outside the builder. Every surface shows its settled state exactly as before.
- **State carried** — the builder says which panels are open, by the id the
  document itself declared, and the panel-bearing surface obeys.

Inside the builder there is always a carried state, and its initial value is
*the page as a visitor first meets it* — no panel open. So Edit matches View
from the first frame, which is the rule.

### 5. Scope: L1 dialogs, not module-owned panels

The handle is the L1 dialog role's `id`. A behaviour module that hides content
behind its own behaviour — `account-chrome`'s sign-in dialog, the account
portal's erasure disclosure — has no such id and keeps its settled state.
Reaching into one from here would mean the channel knowing what an
`account-chrome` is, which is the thing §4 says it must not do; giving every
module a uniform panel handle is a behaviour-contract change and does not belong
inside this one. `account-chrome`'s migration onto the L1 dialog role is already
[[REQ-212]] §6's follow-up, and it is what makes that surface carry.

### 6. A way back out, and a way in

A modal reproduced in Edit covers the page, and every control in the edit render
is inert — including the panel's own Close. Without something in the chrome an
operator who switched to Edit with a panel open could only leave it by switching
back to View, closing it there and switching again.

So Edit gains one control: **a panel selector**, listing the panels this page
declares plus "No panel". It reads the document (the shells and their ids), so
it needs nothing from the definition and nothing new from the renderer. Picking
one re-applies the state to the document already loaded — no reload, because
applying is two attributes.

**A panel is named by what is written in it**, not by its id: its accessible
name if the role gave it one, else its first heading, else its opening words. An
id is an author's slug, and a list of slugs is a list nobody can read; the slug
is the last resort, for a panel with nothing in it to read.

**A page that declares no panel shows no control at all** — not an empty one.
Most pages have no modal, and a permanently inert select in the strip is chrome
that teaches the operator to stop looking at the strip.

It is the escape hatch and the entrance in one: it is also how you edit the copy
inside a modal you never opened in View. Single-select — a page may have several
panels open at once and the carry mechanism holds a list, but the control offers
one at a time, because choosing an arrangement of overlapping modals is not a
thing an operator wants to do.

### 7. Surviving a re-render

An edit that lands re-renders the page and reloads the frame. The carried state
is the builder's, not the document's, so it is re-applied on every load — which
is what makes *editing the copy inside an open modal* work at all, rather than
closing the panel on the first save.

**But only for the same page.** The carry answers "the same page in the same
state" and nothing wider, so a reader who follows a link out of an open panel
arrives at the next page with no panel over them and at the top of it. A channel
switch and a post-save reload both keep the path, which is exactly when the state
should survive — and a navigation does not, which is exactly when it should not.

Switching site resets it for the same reason: another site's page is not this
page in another state.

## What is built

- **`packages/framework/src/l1/dialog.ts`** (new) — the dialog attribute
  vocabulary, lifted out of `render.ts` so the emitter and the state module share
  one definition site rather than two spellings of `data-l1-open`.
- **`packages/framework/src/l1/page-state.ts`** (new) — reads a rendered page's
  state from a window and puts a window into one, branching on the channel as
  §3 describes. The one place that knows how a page is driven.
- **`packages/framework/src/l1/render.ts`** — the shell, the role and the
  overlay stylesheet stop being conditional on the channel; the script stays
  conditional on it.
- **`tools/generate/src/cli/assets.ts`** — `page-state` joins the framework
  entry points served to the browser, so the builder runs this implementation
  rather than a second copy of it.
- **`apps/control-app/src/builder/carry.js`** (new) — the builder's half:
  capture from the document that is going away, compose the next channel's URL,
  re-apply to the document that arrives.
- **`apps/control-app/src/builder/api.js`** — `previewUrl` takes the relative
  path within the channel.
- **`apps/control-app/src/builder/panel.js`** — announces that it is about to
  replace the document, and announces the document it has; both are what a
  capture and a re-apply hang off.
- **`apps/control-app/src/builder/toolbar.js`** — the panel selector action.
- **`apps/control-app/src/builder/app.js`** — the wiring.

## Acceptance

1. Switching channel keeps the page: the relative path within the channel is
   carried, so a reader on `/about` in View is on `/about` in Edit.
2. Switching channel keeps the scroll offset.
3. The edit render emits the covering shell, the panel's `role`, its declared
   `id` and the overlay stylesheet — and still emits no dialog script and no
   acting attribute on an action node.
4. With nothing telling it otherwise, the edit render lays a panel out in flow,
   open and settled, exactly as before: every overlay rule is gated on a marker
   only a script or the builder sets.
5. A page's state can be read from a loaded document as the ids of the panels
   that are open plus the scroll offset.
6. Applying a state to an edit document opens exactly the named panels and
   closes every other, as overlays, laid out by the same rules the draft render
   lays them out by.
7. Applying a state to a draft document opens the named panels by activating
   the control that opens them, and closes every other by activating what shuts
   it — its Close, or the scrim where it has none — so the page's own script
   does both, and the focus, the lock and `aria-expanded` are true afterwards.
8. Reading a state and applying it to the other channel round-trips: the same
   panels are open on both sides.
9. Edit mode offers a panel selector naming the panels the page declares plus
   "no panel"; View does not offer it. Each panel is named by what is written
   inside it rather than by its id, a page that declares none shows no control
   at all, and picking one changes what the loaded document shows without
   reloading it.
10. A re-render of the page — the reload after a save — re-applies the carried
    state rather than resetting it.
11. Switching site discards the carried state, and so does following a link to
    another page: the reader arrives with no panel over them and at the top.
    A channel switch and a post-save reload keep the path, and keep the state.
12. A behaviour module's own panel is unaffected and keeps its settled state.


---

## REQ-223: Public forms accept a submission: lead capture, asset delivery, and the controls that keep it safe

# Public forms accept a submission

A visitor fills in a form on a published site, their address lands in that
site's contact database, and any asset the form promised is delivered — without
the endpoint becoming a way to mail strangers, flood a contact list, or burn the
sending domain's reputation.

**Every public form in the product is currently broken, and none of them is
broken by a bug.** The endpoint they post to has never existed.

## 1. What is true today

Verified 2026-09-10 against the code and against production.

**There is no form-submission endpoint anywhere.** `public-site` answers any
method other than GET/HEAD with `405` by construction (`apps/public-site/src/index.ts`),
and `control-app` gates every request through `guardAccess` (`apps/control-app/src/index.ts`).
`/api/lead` does not exist; neither does `/beta-apply`.

**Three forms are shipped and pointed at nothing:**

| Site | Form | Action configured | Reality |
| --- | --- | --- | --- |
| `1stcontact` home | "Apply to join the early beta" | `https://app.1stcontact.io/beta-apply` | route does not exist; host is behind Access |
| `xgd` home | "Join the waitlist" | `/api/lead` | route does not exist |
| `xgd` whitepapers | "Send me both papers" | `/api/lead` | route does not exist |

The visitor sees **"Could not reach the server. Please try again."** — the
`catch` in `contact-form/client.js`, reached because the cross-origin JSON POST's
CORS preflight is answered `403` by Cloudflare Access before any Worker runs
([[BUG-78]] carries the full trace).

**The two sites disagree about where a form posts.** XGD uses a relative,
same-origin `/api/lead`; the 1st Contact homepage uses an absolute cross-origin
URL. §3 settles this: the relative form is correct and the absolute one is the
anomaly.

**Prior record.** [[CHAT-56]] already logged this: *"Whitepaper delivery has no
artifact and no backend. No PDFs exist in either repo; the papers are ticket
bodies. `/api/lead` does not exist. Deferred by the operator as 'easy
mechanics'."* This ticket un-defers it. The same entry records the missing
mailing-list opt-in (§7).

**The spam controls are half-built and unowned.** `contact-form/component.ts`
already renders both the honeypot (`hp_company_url` — hidden, off the tab order,
`data-fc-invariant` so a designer cannot restyle it visible) and the Turnstile
mount (`data-turnstile-target`). `client.js` deliberately sends the honeypot in
the payload, its comment saying *"the honeypot field rides along so the server
can reject filled-honeypot submissions"*. The server half has never existed
because the server has never existed. Code comments say Turnstile is "wired in
REQ-7"; **[[REQ-7]] is an abandoned D1-schema ticket**, so those references are
stale and nothing owns this work.

**The strategy is already written down.** [[DOC-5]] *Public Form Strategy*:
public forms must not require login, because *"lead capture must be as
frictionless as possible"*, and spam is handled by Turnstile, rate limiting,
honeypot fields, AI spam detection and reputation checks. This ticket implements
the first three; the last two are named as out of scope in §9 so their absence
is a decision.

## 2. What a visitor gets

Submitting a public form:

- **always returns the same acknowledgement**, whatever happened behind it. A
  known address, a new one, a rate-limited one and a discarded one are
  indistinguishable to the caller. This is the property `account-chrome`'s client
  already honours by never reading the response body, and it is what stops the
  endpoint being used to test whether an address is already a contact;
- **adds them to that site's contact database** as a `lead`, once;
- **delivers the asset the form promised**, if it promised one, exactly once
  (§5);
- **works with JavaScript disabled.** `contact-form` renders a real
  `<form method="post" action=…>` and the client only upgrades it. A no-JS
  submission must land the same row and receive an ordinary HTML confirmation
  page rather than JSON.

## 3. Where the endpoint lives

**`POST /api/lead`, served by `public-site`, on the same origin as the page.**

The site the submission belongs to is taken from the **URL**, through the
grammar `parseRoute` already implements — the apex site for a bare `/api/lead`,
and the keyed site for one under `/site/<siteKey>/`. It is never taken from the
request body.

Four reasons, and the fourth is the one that matters most:

1. **No CORS.** Same-origin, so no preflight, so nothing for Access to answer
   `403` to.
2. **The site key is not caller-controlled.** It arrives as part of the path
   the server resolves, so a spammer cannot retarget another tenant's contact
   list by editing the form's action.
3. **Relative URLs are environment-portable.** `/api/lead` is correct in local
   dev, in preview and in production. The absolute `https://app.1stcontact.io/…`
   on the 1st Contact homepage is broken locally for exactly that reason.
4. **No Access bypass policy is required.** The write is handed to `control-app`
   over a **service binding**, and a service-binding call never traverses the
   edge. This matters because the bypass policies are currently missing: I
   verified that `GET /sign-in` and `GET /api/email/webhook` both answer `302`
   to the Access login origin in production today, so both REQ-198's webhook and
   REQ-202's sign-in routes are unreachable there. Lead capture must not inherit
   that dependency.

### 3.1 `public-site` stops being read-only, narrowly and deliberately

`apps/public-site/src/index.ts` states that it serves pages and receives
nothing, and answers every non-GET with `405`. This ticket amends that for
**exactly one path and one method**. Everything else must still answer `405`,
and a UAT must prove it — the amendment is a doorway, not a change of character,
and the file's header comment must be updated to say so rather than left to
contradict the code.

### 3.2 The internal surface is an RPC entrypoint, not a path

`control-app` owns identity writes and must keep owning them: `addContact`
(`apps/control-app/src/people.ts`) is the one definition of how a person enters a
tenant, and a second implementation in `public-site` would be two answers to that
question, free to drift.

The seam between the two Workers **must not be an HTTP path.** A path is
something a request can name, so an internal route reachable at
`app.1stcontact.io/internal/…` is one Access misconfiguration away from being
public — the specific failure `access.ts` argues against at length. Use a named
`WorkerEntrypoint` RPC method instead: it is reachable over the binding and
there is no URL that reaches it at all.

## 4. What lands in the database

A submission calls `addContact` — it is not reimplemented. That gives, for free,
the properties this ticket needs:

- **idempotent on `(tenant_id, email)`**, so a resubmitted address never becomes
  a second person. [[DOC-42]] §9 names the duplicate row as the failure the one
  contacts table exists to prevent;
- `pipeline_stage = 'lead'`, which is what a captured visitor is;
- the person, their account and their address written as one batch.

**The submission itself is recorded as a contact event.** `contact_events` is
append-only (there is an `ABORT` trigger on UPDATE) and its `kind` is a dotted
string with no `CHECK` constraint — `builder/contact-events.js` says so
explicitly, anticipating exactly this kind of growth. So a new kind is added
there with its label, and no migration is needed.

The event's `detail` carries what the row cannot: **which site and page the
submission came from, which form instance, what the submit button said, the
other fields the visitor filled in (a `message` textarea, say), and the consent
wording they were shown (§7).** This is the provenance record. It is
unreconstructable later, and for an IE tenant it is what evidences consent.

Extra form fields must not be dropped on the floor. A form is authorable with
arbitrary `text|email|tel|textarea` fields, and a visitor who typed a paragraph
into "What are you building?" has said something the business needs to see.

## 5. Asset delivery, and why "at most once" is the design

The whitepaper forms promise *"Send me both papers"* and *"On their way — check
your inbox."* So the endpoint must mail an address it has never seen. That is
inherent to an email-gated asset and cannot be designed away.

**It is not an open relay**, because a relay is one where the attacker controls
the recipient *and* the content. The content here is ours entirely: our
template, our links, our sending domain. What remains is narrower and must be
addressed directly — mail-bombing a victim, damaging deliverability, burning
send quota, and poisoning the contact list.

**Deliverability is the one that hurts most.** Unsolicited mail earns spam
complaints, complaints degrade the sending domain, and the first casualty is
sign-in links not arriving. Abuse of a marketing form breaks the login.

The rule:

> A public endpoint sends **at most one** message per address per asset, with
> content we author, and never to an address that has bounced or complained.

- **At most one, ever.** A second request for the same asset by the same address
  is acknowledged identically and sends nothing. This bounds a victim's exposure
  to a single message — the same exposure as any newsletter signup, and the
  floor for an email-gated asset. It is answerable from data we already keep:
  the contact event log says whether this address has been sent this asset.
- **This is deliberately not a rate limit, and must not be "fixed" into one.**
  A per-day cap still permits sustained harassment. The cost is real — someone
  who loses the email cannot re-request it — and the intended remedy is an
  operator re-send from the contacts surface, which is a different, authenticated
  act. Do not add a public re-send path.
- **Suppression on bounce or complaint.** REQ-198's delivery webhook already
  brings outcomes back and records them against the contact. An address that
  hard-bounced or complained is never mailed again by this endpoint.

  **A complaint was not previously recordable, so this ticket makes it one.**
  REQ-198's webhook handles `email.delivered` and `email.bounced` and ignores
  everything else, and the message record's status vocabulary had no value for
  *the recipient reported this as spam*. Without both halves the suppression rule
  above is unreachable code — it could only ever fire for a status written by
  hand. So `complained` is added as a status of its own and the webhook maps
  `email.complained` onto it.

  **It is a separate status and deliberately not a synonym for `bounced`.** A
  bounce is the mailbox saying it could not take the message; a complaint is the
  person saying they did not want it, and an operator reading a contact's history
  needs to tell a full mailbox from somebody who pressed the spam button. What
  the two share is the only thing the suppression rule asks. The complaint is
  also the one that damages deliverability, which is the failure §5 opens with.

  **The status vocabulary becomes one definition rather than two.** The ticket
  schema that validates every message write spelled the list out a second time,
  independently of the constant the code reads. Adding a value to one and not the
  other is a runtime validation error naming a status the code believes in, so
  the schema now reads the constant.
- **Sending goes through what already exists** — the mail port, the templates,
  and the message recording — so a delivered asset appears in the contact's
  history beside their invites, and a bounce is as visible as any other. There is
  no second sender.

**The artifacts do not exist yet.** [[CHAT-56]]: no PDFs in either repo; the
papers are ticket bodies. This does not block the ticket: build delivery against
the asset as an abstraction, prove it with a test fixture, and leave the real
files to the content work. The 1st Contact beta form promises no artifact at
all — a place on a list is its whole deliverable — so it is fully satisfied by
capture alone and should be the first thing made to work.

## 6. The controls, and what each is actually for

None of these is sufficient alone; they fail in different directions.

**Honeypot.** Discard silently when `hp_company_url` is non-empty — same
acknowledgement, nothing written, nothing sent. Free, and catches only
unsophisticated bots. The field is already rendered and already arrives in the
payload; this is the missing server half.

**Turnstile.** Cloudflare's own product: free on every plan, and *not a new
dependency* — a script tag from `challenges.cloudflare.com` plus one server-side
`fetch` to the siteverify endpoint with a secret. Both halves are needed: the
widget rendered into the existing `data-turnstile-target` mount, and the token
verified server-side before anything is written. **A submission with a missing or
invalid token is refused** — verification that only runs when a token happens to
be present is not verification.

Configuration is a sitekey (public) and a secret, per deployment. **Absent
configuration must fail closed**, on `access.ts`'s reasoning: a deployment that
forgot the secret is refused, not opened.

**Rate limiting.** Cloudflare provides this natively and it should be used
rather than hand-rolled — the Workers rate-limiting binding is declared in
`wrangler.toml` and needs no external service. Key it on what the caller
*cannot* vary: the **site** and the **source IP**. Everything in the body is
caller-chosen and worthless as a key.

Note the tension, and record it rather than resolving it silently: a per-site cap
is itself a denial-of-service against that customer, since filling the bucket
refuses their real enquiries. So the cap is a backstop set generously, and
Turnstile is the sharp instrument. Zone-level WAF rate limiting rules are
complementary and are configuration, not code.

**Body limits, enforced before parsing.** A maximum body size, a maximum field
count and a maximum per-field length, refused early. A large body must be
rejected rather than read.

**Content that arrives in mail is attacker-controlled.** Nothing a visitor typed
may reach a mail header, and it must be escaped wherever it reaches a body.

**CORS is not a security control.** It constrains browsers and nothing else;
`curl` ignores it. Every control above must hold for a caller that is not a
browser at all, and the UATs should be written from that assumption.

## 7. The opt-in checkbox

`contact-form` supports `text|email|tel|textarea` only
(`packages/framework/src/modules/contact-form/meta.ts`). [[CHAT-56]] records
that the mailing-list opt-in is consequently absent from the XGD page and that a
checkbox, being behavioural, belongs as a module addition.

It is in this ticket because it is the **consent record**, not a separate
feature: it is how a captured address acquires a lawful basis, and the tenant is
IE. Add `checkbox` as a field type, render it with the same programmatic-label
treatment the other controls get, carry its value in the submission, and store
**both the answer and the wording the visitor was shown** in the contact event
detail (§4). Wording alone, stored later, cannot evidence what was on the page
that day.

Capture itself does not depend on the box being ticked — asking for a whitepaper
is its own request. What the box governs is being added to a mailing list, which
is a separate purpose and must be separately evidenced.

## 8. Acceptance criteria

1. `POST /api/lead` on a published site's own origin accepts a JSON submission
   and answers a single frozen acknowledgement.
2. The same acknowledgement is returned for: a new address, an address already a
   contact, a rate-limited submission, a filled honeypot, and an address that
   has already been sent the asset. A test asserts the responses are byte-identical.
3. A submission with no JavaScript — an ordinary form POST — lands the same row
   and receives an HTML confirmation rather than JSON.
4. The submission creates exactly one `users` row in the site's tenant, at
   `pipeline_stage = 'lead'`; a second submission of the same address creates
   none.
5. The tenant is derived from the request URL. A submission cannot name another
   tenant, and a body field claiming to is ignored. Asserted by attempting it.
6. A contact event records the submission with its provenance: site, page, form
   instance, the other fields submitted, and the consent wording if shown.
7. A filled honeypot writes nothing and sends nothing.
8. A missing or invalid Turnstile token is refused. With Turnstile unconfigured,
   the endpoint refuses rather than accepts.
9. Rate limiting is keyed on site and source IP, and exceeding it writes
   nothing, sends nothing, and is indistinguishable in the response.
10. An oversized body, an excessive field count, or an over-long field is
    refused before the body is parsed.
11. An asset-bearing form delivers its asset exactly once per address; a second
    request delivers nothing. Asserted by reading the message record, not the
    status code.
12. An address recorded as bounced or complained is never sent to. A provider
    complaint event reaches the record — asserted end to end through the real
    signed webhook, not by writing the status by hand — and `complained` is a
    distinct status rather than a second name for `bounced`.
13. Every method other than the one POST, on every other path of `public-site`,
    still answers `405`.
14. The internal seam to `control-app` is not reachable by any URL.
15. `contact-form` renders a `checkbox` field, and its answer and wording reach
    the stored provenance.

## 9. Out of scope

- **Notifying the business owner** that an enquiry arrived. Operator decision,
  2026-09-10: the contact database is the deliverable for now. Worth noting the
  cost — an enquiry in a list nobody logs into is a soft version of the failure
  [[DOC-47]] warns about — so this wants its own ticket before a customer relies
  on it.
- **AI spam detection and reputation checks**, the remaining two limbs of
  [[DOC-5]]'s strategy. Named here so their absence is a decision.
- **The whitepaper PDFs.** Content (§5).
- **Fixing sign-in in production.** `/sign-in` stays cross-origin on
  `control-app` and remains blocked by the missing Access bypass (§10). Routing
  it through `public-site` the way §3 routes lead capture would fix it, and is a
  reasonable follow-up, but it is not this ticket.
- **The `contact-form` configuration UI.** Authors set `action` by hand today.
  The builder offering the right endpoint for the current site is a real
  ergonomic gap and a separate piece of work.

## 10. Deployment steps (configuration, not code)

1. **Turnstile keys.** Create a Turnstile widget; set the sitekey and secret for
   each deployment. Absent them the endpoint fails closed, so this is required
   before the forms work anywhere.
2. **The Access bypass policies, which are owed regardless of this ticket.**
   `GET /sign-in` and `GET /api/email/webhook` both answered `302` to the Access
   login origin in production on 2026-09-10, meaning REQ-198's webhook and
   REQ-202's sign-in routes are unreachable there. Lead capture does not depend
   on this (§3), but sign-in does, and the homepage's sign-in dialog will stay
   broken until it is set.
3. **The service binding** between `public-site` and `control-app`, declared in
   both `wrangler.toml`s, including under `[env.production]` — a named
   environment inherits no bindings.

## 11. Once this lands

[[BUG-78]] closes by pointing the 1st Contact homepage's `beta-form.action` at
`/api/lead` and restoring `account-chrome.signIn` to `https://app.1stcontact.io/sign-in`,
the value [[REQ-200]] set before something replaced it with a route that has
never existed.


---

## REQ-218: The assistant can look at a stored image: a sixth picture kind

## The gap

The assistant cannot look at any picture in the Library. Not one it generated,
not one the client uploaded, not an SVG it drew itself.

`screenshot`'s `picture` type (`tools/generate/src/cli/ai/fidelity-surface.json`)
offers five kinds — `reference`, `draft`, `edit`, `revision`, `url`. Every one of
them is a *page*. Nothing addresses a stored image, so the one thing the client
is holding in their hand and asking about is the one thing the assistant is blind
to. An upload's one-time text description at ingest is the model's only access to
it, ever — and a generated image's surface says outright that the picture never
enters the conversation.

The client's experience of this is the assistant apologising for not being able
to see a picture it made ten seconds earlier.

## What changes

**`picture` gains a sixth kind: a stored image, named the way the Library names
it.** `screenshot` then answers for it exactly as it answers for a page — the
image comes back as an image, and the assistant is looking at the picture rather
than reading a description of it.

**`compare` gains it for free**, and that is the interesting half. The same
operation that measures a reproduction against a captured reference can now
measure a generated image against one — *"is this hero in the mood we captured
from their old site"* becomes a number and a list of places.

**It shows the picture as it currently stands**, which is the original with the
edit recipe applied, so the assistant that has just cropped something can look at
what it did. It can also ask for the original, because *"what did the crop take
away"* is a real question. Where no recipe exists the two are the same image.

**It is downscaled on the way in**, exactly as a page screenshot is. The
machinery and the argument are already in `fidelity-core.ts`.

## Why it is a deliberate act and not an automatic return

The picture is not handed back by whatever produced it. An image in context
costs real tokens **and stays in every subsequent turn** — `fidelity-core.ts`
already carries that warning. So the assistant asks when it has a reason to
look, which is the discipline the picture tools already impose, rather than
paying for a picture on every generation whether anyone needed it or not.

It also means the capability is about *stored images*, not about *generated*
ones: an uploaded photograph the client is asking about is reachable by the same
call, which is the larger half of the value.

## Depends on

The renderer that applies a recipe, from the recipe ticket — this operation needs
something to ask for the current state of an edited picture. Against an unedited
image it works on the bytes as stored, so it is not blocked on the editor.


---

## Answered from EPIC-1, 2026-09-10

**1. Which namespace: both, addressed the way each is already named.**

Restricting to site assets would exclude the epic's originating complaint. The
client's words were *"ask AI to create an image → AI says it can't see it"* — and
a generated image is **material** (`imagegen.ts`: `IMAGE_MATERIAL_TYPE =
'material'`), not a site asset. Restricting to material would exclude the
assistant's own drawings, which are site assets with no material record at all.
Both are pictures the assistant made, and the epic's rule is about pictures, not
about which store happens to hold them.

**The objection that the assistant cannot enumerate material does not bite.** It
does not need to: the handle arrives in the tool result that created the picture,
which is exactly the case this epic exists to fix. A material *listing* operation
is a different capability and is deliberately out of scope — the assistant can
look at a picture it was told about, and at any site asset `list_assets` shows.

**2. Raster lands after REQ-219. SVG does not, and takes the browser path.**

For raster formats the answer is the Images binding, and the `depends_on` already
records it. It normalises arbitrary stored bytes to PNG, which preserves both
things the cheap `describe.ts` path would give up — the downscale, whose *reason*
is the strongest argument in the epic, and the `size` field the `picture` shape
documents as "after any reduction" — and it is the only thing that makes
`compare` work at all.

**SVG cannot go that way** and must not wait for it. Cloudflare Images does not
transform SVG, so a drawn wordmark needs rasterising and the only rasteriser here
is the browser. `measure-core.ts` is the precedent to copy, and its reason is the
right one for this case specifically: it navigates the site's own draft preview
**because the page is the font context**, which is precisely what a wordmark
needs. Site assets are already served in-process at
`/preview/<slug>/<channel>/assets/<name>`, so no new plumbing is required.

So this ticket has two paths behind one kind, and the SVG path can be built
before REQ-219 exists.

**3. The CLI host omits the kind.**

Following `adoptCapture`, and following `imageSurface` returning `null` where the
deployment cannot do the thing — the property `imagegen.ts` states as its second:
a deployment without the capability has no tool, so the manual never mentions it
and the model cannot propose, apologise for, or probe for one. A CLI session
simply has five kinds.

## Corrections to the body above

Two sentences are wrong as written and the investigation is right about both.

- *"It is downscaled on the way in… the machinery and the argument are already in
  `fidelity-core.ts`."* The machinery is there and is **PNG-only** —
  `decodePng` / `refuseNonPng`, deliberately so since REQ-156. It works because
  all five existing kinds get their bytes from `driver.screenshot()`, which is
  always PNG. `ResolvedPicture.bytes` carries an unstated PNG contract that this
  kind is the first to break.
- *"`compare` gains it for free."* Free for a stored PNG. `compare` decodes
  **both** sides, so for any other format it needs a raster nothing in the repo
  can currently produce. It is free only once the binding normalises.

Also worth carrying into the implementation: `drivableSteps` needs its own
refusal sentence for the new kind — a stored image is not a page, so `after` is
meaningless against it — and `pictureUrl` must return `null`, since it is the
"has a live page" predicate the value gates read.


## The design, settled

**Both namespaces, one name.** The product stores pictures in two places and a
client does not know which. Site assets are what `list_assets` shows — a drawing
`write_image` made, a file already placed on the site — named by their filename.
Library items are material tickets — what the client dropped on the conversation,
what the generator made — named by their record and titled the way the Library
titles them. A stored image is addressable **however it is referenced**: the
site filename, the `/assets/…` handle a page holds, the bare name a drawing was
written under, the Library record, or the Library title. One rule, one place, so
the two namespaces cannot answer differently. A name that matches more than one
picture is refused and the candidates are named, because guessing between two
pictures is the one outcome worse than asking again.

**The assistant can see what is there.** `list_images` answers with every stored
picture across both namespaces and the name to ask for each by — the cheap first
move, exactly as `list_references` is for captures. Without it the Library half
is unreachable: nothing else on any surface the assistant holds lists material,
so a picture it was never told about could only be guessed at.

**Every stored picture is normalised to a screenshot on the way in.** A page
picture is PNG because a browser made it, and everything downstream — the
reduction, the diff, the value gates — is built on that. A stored picture is
whatever the client's camera or the generator produced, so it is put in front of
the same browser this surface already owns and comes back as a picture of itself.
That is what makes **`compare` gain it for free** true rather than aspirational,
and it is why the reduction argument in `fidelity-core.ts` applies unchanged
instead of being restated. A format the browser will not decode is refused by
name rather than returned blank.

**A drawing is rasterised outside the site's own page**, so its text renders in
the browser's default face rather than the site's. The picture says so, in the
same caption that says which channel it is of. `measure_drawing` is what reads a
drawing's real geometry, and looking is not a substitute for it.

**Asking for the original is accepted now.** Until the recipe exists every
picture is its own original, which is what "where no recipe exists the two are
the same image" means; the field is the seam the renderer fills in, not a
promise deferred.

**A stored picture cannot be driven.** `after` drives a page into a state, and a
stored picture is not a page — it refuses by name, as the other four
non-`draft` kinds do.

**A deployment that holds no image store does not answer for the kind.** The
builder in the cloud has both namespaces; the local `1c` has the site's assets
and no Library, because the Library is tickets and it has none. Each says which,
the same way a deployment with no browser says it cannot take pictures.


### What that normalisation means in detail

**A picture that is already a screenshot is left alone.** Every other kind of
picture is PNG because a browser made it, so a stored PNG is already the currency
and re-photographing it would cost a browser and flatten its transparency for
bytes no better than the ones we had. Only a picture that is something else goes
in front of the browser.

**The bytes travel to the browser; the browser is never sent to fetch them.** A
Library picture is in the client's private store behind the door that guards it,
and there is no address an unauthenticated browser could read it from — inventing
one would be a way into the client's confidential material. So the picture is
carried, which also means one path serves both namespaces instead of one each.

**It is pictures only.** The site's asset list holds fonts as well, and "look at
this" has no answer for a typeface — so a font is not in the picture list and
cannot be named as one. A picture the browser will not decode is refused by name
rather than returned as a blank rectangle, which is what a model would otherwise
report on as though it had seen something.

**The site's own type table gains the two image types it had been missing.**
`.gif` and `.avif` have counted as images in the asset listing for as long as it
has existed while the table that names their type had no entry for either, so
both were labelled as raw bytes. Nothing needed that answer until something
needed every image type rather than only the ones a page renders.


## Corrections to "The design, settled", after reading EPIC-1's answers

Those two sections were written before the epic's answers were on this ticket.
Where they disagree, the epic wins on the first and this implementation departs
from it on the other two, deliberately and for reasons recorded here.

**Retracted: "The assistant can see what is there."** There is **no**
`list_images` operation. A Library listing is a different capability, it is
deliberately out of scope, and the reason it does not need to exist is the one
the epic gives: a picture's handle arrives in the result of whatever made it,
which is exactly the case this ticket exists to fix. Everything else the
assistant can reach is already in `list_assets`. What survives is the naming
rule, which is what "however it is referenced" actually asks for: the handle it
was given, the Library title, the filename, the `/assets/…` handle, or the bare
drawing name.

**Departed from: "raster waits for the renderer."** Every stored picture — raster
as well as drawn — is normalised here and now, because the argument for waiting
does not survive carrying the bytes. The epic assumed the browser could only be
reached through a URL, and a Library picture has no URL an unauthenticated
browser may fetch. It does not need one: the picture travels to the browser
inside the document it is photographed in. So the downscale, the reported size
and `compare` all work today for a photograph, which is the ticket's own headline
claim about `compare` made true rather than deferred. When the renderer lands it
replaces this at one seam and nothing else moves.

**Departed from: "the CLI omits the kind."** The local builder answers for the
site's own assets and says it holds no Library. Omitting the kind outright is
right where a deployment cannot do the thing at all; this one can — a drawing it
has just written is on its own disk, and that is the very loop `measure_drawing`
was built for. What the epic's rule is protecting against is a model apologising
for a capability it does not have, and a kind that works for everything this host
holds does not produce that.

**And the cost of that departure, stated.** A drawing is photographed in a bare
document rather than inside the site's own page, so the `@font-face` rules the
site serves are out of scope and its text renders in the browser's default face.
The epic is right that the site's page is the better font context. The picture
says plainly that it is not that, and points at `measure_drawing`, which reads a
drawing's real geometry inside the draft. Moving the drawn path onto the draft
preview is a refinement this design leaves open at the same seam.



---

## Answered from EPIC-1, 2026-09-11 — the two departures reviewed

Both departures were flagged for epic review. **Both are accepted**, and one of
them carries a consequence the epic wants closed rather than left open.

### Departure 2 — raster now rather than after REQ-219: accepted, and the reasoning is better than the epic's

Accepted without reservation. The epic deferred raster to the Images binding on
the grounds that a Library blob has no URL an unauthenticated browser may fetch,
and the departure's answer — *"it doesn't need one: the picture travels inline in
the document it's photographed in"* — dissolves the premise rather than working
around it. That is the stronger argument, and it buys the downscale, the reported
`size` and a working `compare` today instead of behind a dependency.

The epic's note is corrected accordingly: the constraint it named was not a
constraint.

### Departure 3 — the CLI keeps the kind: accepted, but the stated cost is larger than judged

Accepted. The reasoning holds: the local builder has a site store, so a drawing it
just wrote is on its own disk, and refusing to look at it would be refusing the
`measure_drawing` loop the CLI exists to serve. Answering for site assets and
saying plainly that it holds no Library is the honest shape.

**The cost, though, lands squarely on the epic's motivating case, and the
surface's own prose says so.** The departure notes that a drawing photographed in
a bare document renders "in the browser's default face rather than the site's",
and judges wordmark fidelity as probably not worth the refinement. `write_image`'s
own description in `l1-surface.json` makes the opposite case, at length and
deliberately:

> **Name a real font.** `system-ui`, `-apple-system` and a bare `sans-serif` are
> not faces — each resolves to something different per platform, with different
> letter widths, **so a mark tuned against one is wrong nearly everywhere else.**
> Name a font the site has.

So the model is *instructed* to name a site font, and told why guessing is wrong.
A drawing it then inspects in a bare document resolves that font to whatever the
browser defaults to — which reproduces, inside the inspection tool, precisely the
failure the authoring prose exists to prevent. The assistant checking its own
wordmark would be looking at different letter widths from the ones the client sees,
and would have no way to know.

**This is the epic's motivating case.** "A picture you made is one you can see" is
about drawings with text in them more than about anything else, and
`measure-core.ts` already establishes the remedy: navigate the site's own draft
preview, *because the page is the font context*.

**So the refinement is wanted, not merely open.** The seam the departure left is
the right one and the change belongs at it: a drawing resolved for a host that has
a site should be photographed in that site's draft preview rather than a bare
document, so the fonts it names are the fonts it gets. Where there is no site to
navigate — a Library picture on a Worker host, or a CLI session with no draft —
the bare document remains correct and the caption already says so.

**Until it is done, the caption is load-bearing** and should say what is actually
wrong rather than that something is: a drawing shown here may not be in the site's
typeface, so letter widths and line breaks are not evidence. Pointing at
`measure_drawing` is right; pointing at it *without* saying the face may be wrong
invites the assistant to trust what it sees.

### Departure 1 — no `list_images`: complied, and correctly

Nothing to add. A picture's handle arrives in the result of whatever made it, and
the epic's reason for scoping the listing out stands.