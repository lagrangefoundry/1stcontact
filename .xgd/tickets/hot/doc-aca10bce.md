---
uid: doc-aca10bce
id: DOC-30
type: doc
title: L1 Control Surface API — the documented, maintained way to change a site
created_by: xgd
created_at: '2026-08-08T21:12:39.376838+00:00'
updated_at: '2026-08-31T19:43:19.599354+00:00'
completed_at: null
last_field_updated: system_kb
status: null
fields:
  doc_kind: architecture
---

# L1 Control Surface API — the documented, maintained way to change a site

Design record for a **clean, clearly identified control surface** over L1: a set of named
operations with declared inputs, outputs and failure modes, documented and maintained as an
API rather than discovered by reading `edit.ts`.

Related: **DOC-23** (L1 substrate), **DOC-8** (builder UI architecture — §5.2 forbidden list by
absence, §5.3 enums spelled literally, §6 structured edits), **DOC-2** (security policy),
**DOC-12** (storage and rendering model), **REQ-122** (the builder chat panel and today's local
declaration format). Upstream: lagrange-framework **DOC-20** (*The Toolbox*, `doc-5de13501`) and
**REQ-74** (its implementation, `request-22e5b9f3`).

## Why now — and what changed

The original trigger was that a generic tooling object was *being designed* in
lagrange-framework, and a tool configuration would name into this surface, promoting internal
function names to identifiers that configuration, documentation and priming all depend on.

**That object is now designed and built.** DOC-20 specifies the Toolbox; REQ-74 shipped it in
`lagrangefoundry.ai` and its JS peer — declaration ingest, configuration validation, group
expansion, wire-spec projection, manual projection, schema validation, policy gating, provenance
marking, audit, and a standalone validator, with a two-language conformance corpus.

The consequence for this document is structural, and it is a simplification:

> **The declaration format is no longer ours to design.** DOC-30 is no longer "invent an API
> discipline for the L1 control surface"; it is **"declare the L1 control surface as a Toolbox
> surface, and say how far today's code is from that."**

DOC-20 names us explicitly, twice. We are **the first external surface** — "1stcontact declares
its L1 control surface in the 1stcontact repository" — and we are a listed refactor target: *"its
closed-over site slug and unenforced `writes` flag become a declared scope axis and an effect
classification."* DOC-20's call-type analysis also checked us by name: 1stcontact L1 holds its
API in-process, so `inproc` — the one shipped call type — covers us with nothing further needed.

The requirement this document opened with still stands on its own: the surface that can change a
customer's site should be documented, versioned and deliberately maintained. What has changed is
that most of the machinery for that now exists upstream, and our remaining job is a declaration,
a toolbox class, an instance configuration, and the deletion of the local format that duplicates
the framework's.

## What exists today

`tools/generate/src/cli/edit.ts` and `tools/generate/src/cli/ai/` are the de-facto surface.

**The genuinely good part: `edit.ts` is already the single write path.** The `1c` CLI, the
click-to-edit modal, and the AI tool surface all dispatch to the same functions, so validation,
atomicity and re-render happen in one place and cannot be bypassed by adding a new caller. That
property is the foundation of this document, it is *strengthened* rather than threatened by the
Toolbox (a toolbox class is a caller like any other), and it must survive.

Three further assets are real and should be recognised as such rather than rebuilt:

- **`CommandError` / `ErrorCode`** already carry a stable code, a path and an actionable hint,
  with deterministic exit codes — the failure contract REQ-11 set up for exactly this purpose.
- **`declare.ts`'s `ERROR_MEANINGS`** already states each code *in terms of what the caller
  should do next*, which is precisely what DOC-20's `errors:` block asks a surface to declare.
  It ports nearly verbatim.
- **`declare.ts`'s `absent`** already declares deliberate absences with an answer to give, which
  is DOC-20's `absences:` under a different field name.

What is missing is everything that makes this a surface rather than a module:

- **The declaration is not data.** `ToolDeclaration` carries a `handler` closure, so the surface
  is a TypeScript value. It cannot be moved, diffed as a surface, reviewed by anyone who does not
  read TypeScript, validated by the framework's standalone validator, or shown to a customer as
  "here is everything this AI can do". This is the single structural gap; every other gap below
  is downstream of it.
- **No declared output contract.** A handler returns a pre-serialized `string` — `guarded()`
  JSON-stringifies whatever it got. There is no `returns` shape, so nothing documents what comes
  back and the manual cannot describe it.
- **No stability contract or version** of any kind.
- **The declaration covers the AI-facing subset only.** `edit.ts` exports asset add/remove and
  gap-fix operations that no declaration mentions.
- **No read/write enforcement.** `writes` is declared and enforced by nothing.
- **No scope declaration.** Site binding is a closure, not a declared constraint.
- **No provenance and no audit.** Site copy re-enters the model's context unmarked, and nothing
  records what the AI did to a customer's site.

## The requirements, discharged by the Toolbox format

R1–R7 were written before the format existed. They survive, but most of them now name a field
rather than a design problem.

| | Requirement | Where it now lives |
|---|---|---|
| **R1** | Named operations with declared schemas, as data | `operations:` — `op`, `tool`, `params`, plus `shapes:` for what comes back |
| **R2** | Declared error taxonomy, in caller-facing terms | `errors:` on the surface; per-operation `errors: [...]`. **Policy refusals are not ours** — the Toolbox renders them from the policy vocabulary |
| **R3** | Read/write classification, enforced | `effect: read \| write`, enforced by the Toolbox at projection *and* dispatch |
| **R4** | Stable addressing | **Not covered by the format.** See below |
| **R5** | Documented semantics beside the code | `overview:`, per-operation `summary` / `description`, `sequences:` |
| **R6** | A version | **Partially covered.** `version:` is the *declaration format* version, not the surface's own. See below |
| **R7** | Declared absences | `absences:` |

Two requirements are not simply satisfied, and they are this document's contribution back
upstream rather than a local workaround.

**R4 — addressing is a semantic contract the format has no field for.** The correspondence is
real and load-bearing: `formatL1Path` (`packages/site-schema/src/l1/edit.ts`) stamps
`data-l1-path` and produces the addresses `describe_page` hands out; `parseL1Path` /
`resolveL1Node` consume them on the write path. The address a listing hands out *is* the address
a write resolves, by construction. Equally load-bearing is its **render-scoped lifetime**: an
address is read, not remembered, and re-reading after any structural change is mandatory
(DOC-28 §5.2 — the addresses regenerate on every render, which is what makes a structural path
safe in the first place).

The Toolbox has two places to put this and needs both:

- a **declared parameter type** — `l1_address`, `base: string`, whose `description` states the
  form and the render-scoped lifetime, so every operation taking an address inherits one
  sentence rather than restating it;
- the surface **`overview:`**, which is the manual's preamble and the only place a cross-cutting
  rule ("re-read addresses; never remember one across an edit") can be stated once.

No new framework capability is required — but it is worth recording that the format expresses
addressing as *prose in the right two places*, not as a checkable contract, and that our
guarantee remains a property of the code.

**R6 — a surface version is not in DOC-20's envelope.** DOC-20's `version:` is explicitly the
declaration format version, so a surface cannot state its own. Some of R6's motivation is
absorbed: configuration is a projection rather than a copy, so there is no second document to
fall out of step, and startup validation catches a configuration naming something the surface no
longer declares. What is *not* absorbed is the external reference — priming documents,
customer-facing descriptions and any future third-party consumer still want to say which surface
they were written against. Recommended: the surface declares its own version alongside the
format version. Raised upstream as a finding, not decided here.

## What the L1 surface declaration must contain

Concretely, and in DOC-20's vocabulary.

**Envelope.** `surface: l1`, the format `version:`, a `title:`, and an `overview:` carrying the
worldview no individual operation makes sense without: a site is a draft plus published
revisions; a page is an L1 tree; addresses are render-scoped; a write validates the whole
resulting definition before touching disk, so a refusal leaves the draft byte-unchanged;
publishing is a separate, deliberate act.

**Operations.** The surface declares everything `edit.ts` can do — *not* only what the chat is
granted. This is the payoff that removes today's "documents the AI-facing subset only" complaint:
the surface declares the whole API and the **grant** narrows it, so asset add/remove can be
declared, documented and validated while remaining ungranted to the builder chat session.

- read: `describe_site`, `list_pages`, `describe_page`, `get_copy`, `list_assets`, `get_config`,
  `get_asset`, `status`
- write: `set_copy`, `add_page`, `update_page`, `remove_page`, `set_config`, `add_asset`,
  `remove_asset`, `publish`

**Parameter types.** `l1_address` (above); `page_id`; `config_key`. Declaring these is what lets
one description of a value's *nature* serve every operation that takes it, and is where a scope
projection would attach if one is ever needed.

**Shapes.** The genuinely new work. `edit.ts` returns `EditOutput { data: unknown; human: string }`
and the AI path stringifies `data`. A declared shape per return — `site`, `page`, `page_map`
(the segment list), `copy_target`, `asset_list`, `config_value`, `publish_result` — is what makes
the manual able to say what comes back. Shapes document rather than validate (DOC-20), so this is
a documentation obligation, not a runtime one.

**Errors.** Our six `ErrorCode` values with `ERROR_MEANINGS`' text, promoted out of the AI adapter
into the surface, because a CLI user and a model need the same information. Refusals for
"operation not enabled", "write attempted in a read-only session" and "out of scope" are **not
declared here** — they belong to the Toolbox and are rendered from the policy vocabulary.

**Capability groups**, effect-homogeneous: `ReadSite` (the six read operations), `WriteCopy`
(`set_copy`), `ManagePages` (`add_page`, `update_page`, `remove_page`), `WriteConfig`,
`ManageAssets`, `Publish`. Splitting the writes matters: the builder chat gets copy and pages;
publish is the one operation whose blast radius is the public internet, and it should be a grant
an operator makes deliberately rather than a member of a set called "write".

**Scope axes.** A `site` axis over the slug. See the open question below — this is the one place
the format and our current design disagree.

**Sequences.** `describe_page` → `set_copy` (read the map, then write to an address from it);
`get_copy` → `set_copy` (read the fields a place accepts before offering values); `status` →
`publish`. Today's per-tool `reads:` list is the same information in a weaker form — it says what
to call first but cannot carry the note explaining *why*, and it is not projected away when a
step is ungranted.

**Absences.** Today's five entries port directly. `ask`/`answer` becomes `name`/`note`.

## Security obligations we inherit

DOC-20's S1–S6 are the section refactors must conform to. Three items are new obligations for us
rather than restatements of what we already do.

- **S3 — validation before invocation.** Today's parameter checking is hand-rolled inside each
  handler (`str()`, `optStr()`, the `values`-is-an-object check), raising `SCHEMA_INVALID`. It
  works, but it is per-handler and duplicated. Under the Toolbox it is done once from the
  declared schema, before anything reaches `edit.ts`.
- **S5 — results are an injection vector, and this surface is a textbook case.** Every read
  returns text a third party wrote: site copy, a config value, an asset name, a page title. The
  `inproc` default is *trusted*, and it would be wrong here — a customer's site copy is other
  people's prose entering the model's context. Every operation returning site content must
  declare `provenance: untrusted` and the Toolbox will wrap it in its declared markers. Nothing
  in today's code does anything of the kind.
- **S6 — audit.** DOC-20 calls the audit record "the minimum needed to operate an AI that edits
  customer-facing sites". That is a description of this product. We have none: nothing records
  which operation ran, against which site, with which parameters, allowed or refused and by which
  predicate. This lands for free once the surface is data, and it is arguably the single largest
  operational gain in the whole exercise.

**Call type: `inproc`, checked.** Every operation bottoms out in a synchronous or async function
call over the operator's store in the same process. DOC-20's own survey confirms this. S2
(structural substitution) is satisfied by construction — no string is ever built — and S1 needs
nothing from us.

## The two rules REQ-74 added

REQ-74 records two rules the implementation forced that DOC-20 does not state. Both apply to us.

- **The quantifier rule.** A *projection* yields alternative denotations of one value (any
  admitted denotation admits the value); a *list parameter* yields distinct selections (every one
  must be admitted). We have no projections today, but the moment a scope axis reads anything
  derived from an address, this is the rule that decides whether the check is a security bug in
  one direction or unusable in the other.
- **Narrowing needs somewhere to put the values.** An optional parameter under an `allow_set`
  axis must declare base `array`, checked at startup. This bears directly on the site-binding
  question below: an optional `slug` under a `site` allow_set would have to be an array, which is
  a strange shape for a single-site session and is part of why that question is open.

## Open question: how site binding is declared

DOC-20 lists our "closed-over site slug and unenforced `writes` flag" together as things to be
replaced by "a declared scope axis and an effect classification". The `writes` flag half is
correct without qualification — it is declared and enforced by nothing, and it should be
`effect`.

The slug half deserves a distinction the upstream sentence flattens. The slug is **not**
unenforced. `builderTools(slug, opts)` closes over it and *no tool declares a `slug` parameter at
all* — REQ-122 chose this deliberately, and it is a strictly stronger guarantee than a scope
predicate: the model cannot address another site because there is no hole to fill, which is
DOC-20's own S2 reasoning applied one level up. A predicate refuses a bad value; an absent
parameter has no bad value to refuse.

So the two designs genuinely disagree, and the resolution is worth deciding rather than
defaulting into:

1. **Make `slug` a declared parameter under a one-value `allow_set`.** Fully inspectable and
   Toolbox-enforced; costs a parameter the model must get right on every call and re-opens the
   error class REQ-122 removed for free. The narrowing rule then wants it typed `array`.
2. **Keep the construction-time binding, and declare it as such.** The toolbox class is
   constructed with the slug exactly as `TicketToolbox(store)` is constructed with its store.
   This needs a way to declare a constraint over a value that is *not* a parameter — which
   DOC-20's `scope_axes` (`applies_to: {param: …}`) cannot currently express.
3. **Extend the Toolbox vocabulary** with construction-scoped bindings, making option 2
   declarable and inspectable.

**Recommended: option 3, raised upstream as a finding from the first external surface.** Option 2
is what we should ship in the meantime, because it preserves the stronger guarantee; option 1
trades a real safety property for a declarative one and should not be adopted just to fit the
current field set.

## What this replaces

`tools/generate/src/cli/ai/declare.ts` is superseded in full. It was built for exactly the reason
DOC-20 was built — write the enum once, render it twice, make drift unrepresentable — and it
solved that problem locally and well. It is now a second implementation of a framework capability,
which the no-legacy-modes rule settles: it is replaced, not kept beside.

| `declare.ts` | Becomes |
|---|---|
| `ToolDeclaration` | a declared operation, as JSON on disk |
| `handler` closure | a method on an `L1Toolbox` class constructed with slug + store context |
| `writes?: boolean` | `effect: read \| write`, enforced |
| `errors?: ErrorCode[]` | per-operation `errors:`, against the surface's `errors:` block |
| `ERROR_MEANINGS` | the surface's `errors:` block, ported nearly verbatim |
| `absent` / `AbsentCapability` | `absences:` |
| `category` | capability groups (which also become the grant vocabulary) |
| `reads` | `sequences:` |
| `composeDescription`, `composeParamDescription`, `toolSpec`, `toolSpecs` | Toolbox wire-spec projection |
| `renderManual` | Toolbox manual projection, per role and per scope |
| `examples` | no equivalent in DOC-20's operation fields — see open questions |

`guarded()` splits: rendering a `CommandError` is the Toolbox's job (errors are declared, so
rendering them anywhere else guarantees drift), while the "return, never throw" property is
inherited unchanged — one bad call must not break a turn.

**Declarations are ingested as JSON.** REQ-74 ships no YAML parser in either language, and JSON is
a subset of YAML, so ours is a `.json` file. The **JS validator is reachable through the SDK-free
`@lagrangefoundry/ai/core` entry point and loads no backend**, so the declaration can be checked
at author time in this repository, which is the condition DOC-20 attaches to the startup-failure
rule being useful at all. That check belongs in CI.

## Gap list

Per requirement: what today satisfies, and what is missing. This is what the build request is
scoped from.

| | Satisfied today | Missing |
|---|---|---|
| **R1** operations as data | Every operation named, with typed params, required lists, and enum support; duplicate-name and undeclared-required checks already fail at startup | The declaration is a TypeScript value carrying closures, not data on disk. No `returns` / shapes. No `array` base type, no parameter types, no projections, no `sensitive`. Declares the AI-facing subset only |
| **R2** error taxonomy | `ErrorCode` is closed and typed; per-operation `errors` typed against it so a declaration cannot promise a code the validator never raises; `ERROR_MEANINGS` already caller-facing | Lives in the AI adapter, not the surface, so the CLI's own users never see it. No split between surface errors and policy refusals — `guarded()` renders both locally |
| **R3** effect classification | `writes` declared per tool | Enforced by nothing, at neither projection nor dispatch. No read-only grant is expressible |
| **R4** addressing | The correspondence holds by construction — `formatL1Path` stamps and produces, `parseL1Path`/`resolveL1Node` consume; the segment map is generated from the same walk | Stated nowhere as a contract. Render-scoped lifetime is documented in DOC-28 and in code comments, but the model is never told it. No `l1_address` parameter type; no `overview` to carry the rule once |
| **R5** documented semantics | Per-tool `summary`, per-param descriptions, structured `examples`, a generated manual that cannot fall behind the tools | No surface-level `overview`. `reads` is a weaker `sequences` — no note, and not projected away when a step is ungranted |
| **R6** version | — | Nothing, anywhere. And DOC-20's envelope has no field for a surface's own version |
| **R7** absences | Five declared entries with an answer to give; rendered into the manual | Field-name difference only |
| **S3** validate before invoke | Per-handler checks raising `SCHEMA_INVALID` with path and hint | Hand-rolled and duplicated per handler; not driven by the declared schema; runs inside the call rather than before it |
| **S4** one policy vocabulary | — | No groups, no scope axes, no enforcement. Site binding is a closure — strong, but undeclared and uninspectable |
| **S5** provenance | — | Nothing. Site copy, config values and page titles re-enter the model's context unmarked, and `inproc` would default them *trusted*, which is wrong for every read this surface offers |
| **S6** audit | — | Nothing. No record of which operation ran against which site, with which parameters, allowed or refused |
| **Single write path** | Fully satisfied, and the load-bearing asset of the whole design | Must survive the refactor. A toolbox class is a caller like any other and does not threaten it |

**Reading of the gap.** It is larger than the optimistic case DOC-30 originally allowed for, and
smaller than it looks, because most of it is *upstream code we now get for free*. The
irreducibly local work is: write the declaration as data; write `L1Toolbox` as a thin class over
`edit.ts`; declare shapes for the eight return types; write the instance configuration for the
builder chat role; wire the author-time validator into CI; and delete `declare.ts`, `tools.ts`'s
declaration bodies, and the local manual renderer. Provenance, audit, schema validation, policy
gating, group expansion, manual rendering and wire projection are not written here at all.

The migration is predominantly **deletion**, matching what DOC-20 predicted for the ticketing and
knowledge bridges.

## Out of scope

- The Toolbox machinery itself (lagrange-framework, DOC-20 / REQ-74 — built).
- The L1 typed element tree and its expressive vocabulary (DOC-23, DOC-27).
- Behaviour-module configuration surfaces (DOC-25) — a likely second consumer of the same
  declaration discipline, but not this document.
- **Structural L1 writes.** No operation sets an axis, adds a node, or moves anything, because no
  such write path exists (REQ-122). The absences declare this, so the assistant answers cleanly
  rather than flailing. When that write path is built it is an addition to this surface, not a
  change to its shape.

## Open questions

1. **Site binding** — the three options above. Recommended: keep construction-time binding, raise
   construction-scoped declaration upstream.
2. **A surface's own version** — does DOC-20's envelope gain one, or is R6 discharged by the
   declaration being versioned data in git?
3. **Worked examples.** `declare.ts`'s structured `examples` (input plus outcome, executable by a
   test) have no equivalent field in DOC-20's operations. They are demonstrably useful for a
   model's first call. Either the format gains an `examples:` field or they move into the
   operation `description`, which loses their testability.
4. **Where the CLI fits.** DOC-20 makes `ai_ticketing`'s CLI a Toolbox host in its own right so
   the security boundary lives in the CLI's re-check of the same declared policy. `1c` has the
   same shape and the same option; worth deciding when the declaration lands rather than after.