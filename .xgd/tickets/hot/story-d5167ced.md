---
uid: story-d5167ced
id: STORY-119
type: story
title: 'Platform Build, Deploy & Smoke: One Path To Ship A Worker, And Proof It Serves'
created_by: xgd
created_at: '2026-08-20T05:29:12.423310+00:00'
updated_at: '2026-08-31T17:18:39.084728+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-77b28def
  capability_uid: capability-5d07b533
  story_kind: upgrade
  story_points: 3
  updated_by:
  - bundle-b3b7c399
  - bundle-78f4e2fe
---

## Story

**As an** operator responsible for the platform's own Workers,
**I want** one command that builds every deployable artifact and refuses before emitting a broken
one, one that deploys them — rehearsal and real deploy on the same path, with migrations and
secrets arriving as seams rather than as edits — and one that afterwards asserts against the live
origin and fails naming the assertion that did not hold, over a deployment configuration whose
named environments repeat everything the top level declares and whose deployed Workers keep a log
of every invocation,
**so that** a deploy done by me and a deploy done by automation are the same deploy, a deployment
that reported success has been shown to actually serve rather than merely to have uploaded bytes,
and when it does not serve I can read what happened rather than infer it.

## Description

A deploy that reported success has proved that bytes were uploaded. It has not proved that the
build was complete, that the deployed Worker can see its configuration, that the artifact its own
source imports exists, or that anything serves — and, once the operator surface is private, it has
not proved the surface is actually shut. This story covers the three commands that close each of
those gaps, and the configuration rule whose omission had already made one of them impossible.

**Build — refuse before you emit.** The build command runs four stages in order: an environment
preflight, the control application's generated assets, the workspace package builds and
typechecks, then a per-Worker bundle. The preflight exists because the shared component store is
populated out of band — nothing in the package manifests records it, so the installer cannot
supply it and the lockfile cannot notice it gone. Its absence is not loud where it bites: the
builder composes a browser import map from those components, so a missing one yields a document
that loads, renders chrome, and then dies at the first import, in the operator's browser, with
their site on screen. The preflight reports every shared component and every declared package with
its status and refuses an incomplete tree with an environment-specific exit code, naming what is
absent and the command that installs it. The asset stage runs **before** the typecheck, not after:
the Worker's own source imports generated artifacts that are deliberately not committed — a
checked-in copy of a generator's output is a second definition site — so on a fresh checkout the
typecheck has nothing to read until the generator has run. The bundle stage builds each Worker
**against the production environment**, deliberately: a configuration error that exists only under
the production environment is the whole subject of this story, and building the default
environment would miss every one.

**Build — and one refusal a bundle graph cannot see.** A Worker's *type* program is a second,
wider graph than its bundle: a bundler erases a type-only import before it resolves it, and the
typechecker does not. So a Worker package that declares no platform types can still acquire a
filesystem dependency through a type-only edge — the bundle stays correct, the build fails, and a
guard that walks only runtime imports stays green while it happens. That is not hypothetical: it
is how this build broke, on a single specifier reaching a module that merely re-exported the type
it wanted. The build therefore refuses a Worker whose type program reaches a filesystem-bound
module, walking every import the typechecker does and naming the import chain that got there.

**Deploy — one path, and seams instead of knowledge.** A rehearsal is a *target*, not a second
script: the same hooks run in the same order and the same command line is composed, with one
flag appended. A rehearsal that took a different route would prove nothing about the real thing.
The deploy command knows nothing about any database and no secret's name; both arrive as hooks —
any executable file in the migration or secret hook directories, run in sorted order **before**
the upload, each receiving the app, its directory, the environment, the deployed Worker's name,
whether this is a rehearsal, and the repository root. A hook that exits non-zero aborts that
app before anything is uploaded, because a migration that fails must stop the code that assumes
it ran. Non-executable files are ignored, so each directory's documentation lives beside its
hooks. Apps are **discovered** from the tree rather than read from a list, whose failure mode is
an app that silently never gets built.

**Smoke — prove it serves, and prove the private half does not.** Eleven HTTP checks against a
live origin, exiting non-zero naming the ones that failed. Nine are about what the public site
serves: the apex resolves; an unknown site is not found; a site that exists but has published
nothing is **indistinguishable** from one that does not exist, in status *and* body, because a 404
that says which would answer questions about sites the asker has no business knowing exist; the
trailing-slash redirect holds on both the published and the preview channel; the preview index
serves HTML; the preview channel's caching and robots policy are right; a miss inside a preview is
a non-indexable 404; and every same-origin asset the rendered page references resolves with the
content type its extension implies — following attribute references **and one level into
stylesheets**, where web fonts hide, because a missing font is invisible in a screenshot and
obvious to a reader.

The other two are the inverse assertion, about the operator surface: an unauthenticated caller to
the control origin is **challenged rather than served**, and the Worker's platform-default
hostname — the door no hostname policy can cover — does not answer at all. Both are stated as a
negative, "this did not serve", rather than as one expected status, because every way the gate can
hold looks different: a browser gets redirected to the identity provider, a non-browser is
refused, an unconfigured Worker refuses itself, and a retired default hostname does not resolve.
Only a success is a failure. Each of the two is selected by its **own** option and, against an
origin it does not apply to, is reported **skipped by name** rather than failing there — the
control surface and the public site are independent axes, and a run against one must not be
reported as a failure of the other.

A check with nothing to test against reports **skip**, never quiet success, and skips are counted
in the summary: a run that skipped everything has proved nothing and says so. The check engine is
drivable against a supplied origin, so its failure path is exercised without breaking a real
deploy.

**The configuration rule behind all of it.** A named deployment environment inherits neither
variables nor bindings. The control application declared its builder origin only at the top level,
so the deployed Worker would have seen no configuration at all and answered its own service-
unavailable response to every request — and the tool warns rather than errors, so nothing
mechanical stopped it. The repository already recorded this rule for a storage binding on the
other Worker and simply had not followed it. It is now a checked property of **every** Worker in
the tree, with bindings identified structurally — anything declaring a binding name — rather than
from a list that would silently stop covering the first binding kind nobody remembered to add.
The rule carries exactly **one stated exception**, and it is the inverse of the rule rather than a
hole in it: a variable whose whole purpose is to relax a security control for local development is
required to be *absent* from the named environment, because non-inheritance is what makes that
safe. The exception is named in the check itself, so it reads as a decision rather than as a
weakening nobody wrote down.

The rule is stated over every top-level declaration, not only the two kinds the check counts.
Some keys the tool *does* inherit, and those are repeated anyway: the repeat is redundant today
and costs one line, whereas a rule that holds only for the keys someone remembered do not inherit
is one refactor from a silent hole. Two such declarations are repeated on the operator surface —
the platform-default-hostname control, which is a security control, and invocation-log retention.
Each is pinned by its own criterion, and neither may join the variable or binding sets the
repetition check enumerates, or the criteria asserting an exact binding set would start failing on
a declaration that binds nothing.

**Keep the record of what the deployed Worker did.** Without a retention declaration the platform
keeps no per-invocation log at all, only aggregate counters — so a Worker that was killed can be
observed to have been killed and never identified by URL. That absence is what made one production
diagnosis an inference chain across source and a billing page rather than one log read. The
operator surface therefore declares retention at the top level and again for its named production
environment, unsampled, because it serves one operator's builder and a sampled log is a log
missing exactly the request the reader came for. **Where that declaration sits is load-bearing:**
a table header ends the table above it, so a retention table written before the production route
list captures the route — the configuration still parses, the tool still deploys, and the
production route silently stops being declared. It is placed after that environment's bare keys,
and the property is asserted against the *parsed* configuration, because the broken form is
indistinguishable by eye.

**Secrets are a documented mechanism, never a committed value.** A secret value lives in exactly
two places: the platform's own secret store and wherever the operator keeps it. The documented
push pipes the value rather than passing it as an argument (an argument is visible in the process
list and in shell history) and uses a form that does not append a newline (which would otherwise
become part of the secret). Only the *names* are ever listed. No script, hook document or Worker
configuration in the repository carries a credential shape, and the documented mechanism never
echoes a value back.

### In scope

- The environment preflight: what it reports, what it refuses, its distinct exit code and its
  named remedy.
- Generating the control application's build artifacts before the typecheck that consumes them.
- Building every discovered Worker against the production environment, and the artifacts reported.
- Refusing a Worker whose type program reaches a filesystem-bound module, naming the chain.
- Deploying discovered Workers, with rehearsal and real deploy on one path; target selection and
  the refusal of an unknown app.
- The hook contract: discovery by executability, sorted order, the context each hook receives,
  and abort-before-upload on failure.
- The eleven live-origin checks — nine public-serving and two asserting the operator surface is
  private — their pass, fail and skip reporting, their per-axis option selection, and the failure
  naming.
- Every named environment repeating every top-level declaration, checked across the tree for
  variables and bindings, with the single stated exception for a local-development relaxation that
  must stay absent.
- Unsampled invocation-log retention on the operator surface, declared for the top level and for
  the named production environment, and placed so the production route survives it.
- A documented secret mechanism that commits and echoes nothing.

### Out of scope

- **Any live deployment of the control application.** It has never been deployed and its hostname
  does not resolve; both are deliberately left alone here (see Technical Context). The two
  control-surface checks are therefore provable against a supplied origin and against a local
  deploy, not against production.
- **The migration and secret hooks themselves.** This story owns the seam and its contract; the
  database migrations and the assistant's API key each arrive as their own hook file, changing
  nothing here. That separation is what keeps this work free of a dependency on the storage chain.
- **The access gate itself** — the JWT verification, the refusal codes and the policy record are a
  capability of their own. This story owns only the live-origin checks that assert, from outside,
  that the gate is shut.
- **Wiring continuous integration to the build command**, which cannot run the preflight because
  the shared component store is absent there.
- **Shipping a site's rendered snapshot, or serving one to a visitor** — a different store on the
  far side of a deploy, owned by CAP-82.
- **Whatever the retained logs are then read with**, and any alerting built on them. This story
  owns the declaration that the record exists; consuming it is nobody's criterion yet.
- **The runtime cost that made those logs worth having.** The preview work that removed it is a
  property of the site store and is owned by CAP-101, not here.

## Technical Context

**Relationship to existing capabilities.** CAP-82 (Site Delivery) owns publishing a *site's*
revision to shared storage and the Worker that serves it; this capability owns building, deploying
and verifying the *platform's own* Workers, including their deployment configuration. The two meet
at exactly one point: the live-origin checks assert the serving behaviour CAP-82 specifies, and
the content-type expectations here are deliberately a *second statement* of the serving Worker's
own table, because this check runs outside the Worker bundle and cannot import it — the pair is
pinned together rather than left to drift. The access gate is likewise a separate capability: it
owns whether the builder refuses, this story owns the check that observes the refusal from a live
origin. CAP-101 (Site Storage Port) and this story are independent. The environment preflight is a
second, separate check beside the existing install preflight, which answers "is this tree
installed at its lockfile?" for declared packages; these are different kinds of dependency that
fail in different ways, and the report says which.

**Where the intent's premise was wrong on the facts, and what was found instead.** The intent
stated production had been "returning 503 since it was deployed". Investigation against the live
account established that it had not:

1. The control application's hostname does **not resolve at all** — the route is declared against
   a zone that has no DNS record for it, where the other Worker's apex uses a custom domain
   precisely for this reason.
2. The control application **has never been deployed** to the account at all.

So the configuration bug was never live; it was a trap set for the first deploy, now sprung
harmlessly. Neither finding is fixed here, and deliberately. **No acceptance criterion here claims
a live control-application deploy**, including the two control-surface checks: they are asserted
against a supplied origin, which is the same seam every other check in this set already used.

**A residual honest failure, recorded rather than absorbed.** The origin-repetition fix made the
control application's first-deploy failure *diagnosable* rather than *working*; the runtime
relocation that makes it actually serve is owned elsewhere and has since happened. Nothing in this
story's checks depends on which side of that relocation the tree is on — they are HTTP assertions
against an origin.

**Outstanding at reconciliation time, and why.** The secret mechanism is documented and its
rehearsal path is exercised, but it has **not** been proved end-to-end with a throwaway value
against the live account — that means writing to production configuration, which was left for the
operator to authorise. The acceptance criterion here is therefore written about what is
observable: nothing is committed, and the documented mechanism never echoes a value.

**The build artifact is evidence, not input.** The per-Worker bundle produced by the build stage is
not consumed by the deploy, which rebuilds from source. It exists to prove the artifact builds and
the configuration resolves.

**Retention is a declaration, not a deployed fact.** Neither retention block is live until the
operator surface is redeployed — it is deploy-time configuration, and the built artifact is
evidence rather than input. The criteria here are consequently written about the parsed
configuration, which is what this story can observe and what a regression can hold.

## Reconciliation Decisions

*Decided 2026-08-31, reconciling BUNDLE-20 (REQ-147, REQ-149) against this story.*

1. **The two control-surface checks are ACs of this story, not of the access gate.** The intent
   (REQ-147) lists them as evidence for its own AC1 and AC3, so it is silent on which capability
   owns them. Decided here: the gate's *behaviour* belongs to the gate; a live-origin HTTP check
   belongs to the check set, which this story already owns end to end — its options, its
   pass/fail/skip vocabulary and its summary are all this story's. Splitting the check set across
   two capabilities would leave neither able to state how many checks there are.

2. **"Nothing skipped" is no longer a property of a passing run.** The original criterion asserted
   that a correct origin passes all nine checks with none skipped. With two checks on an
   independent axis that is no longer achievable in one run against one origin, and the intent
   states the widening explicitly ("the two new control-app checks skip against a public-site
   origin, which the assertion now names rather than forbids"). Decided: the criterion asserts
   every check *applicable to the supplied origin* passes, and that any skip is named rather than
   merely counted. This is a sharpening, not a weakening — a skip that must be named cannot hide.

3. **The single exception to the environment-repetition rule is stated in the criterion.** The
   intent (REQ-145's implementation note) introduces a local-development relaxation variable and
   requires it to stay absent from the production environment, asserting that absence elsewhere.
   The intent does not say what that means for *this* rule. Decided: the rule keeps its universal
   form and names the one exception and its inverse justification, rather than being quietly
   softened to "most variables" — an unexplained hole in this check is how the original bug got in.

4. **The type-program refusal is a build criterion, not a Worker-portability one.** The intent
   files it under REQ-149 because that is where it was found, and describes it as a `bin/build`
   failure the suite could not see. Decided: it belongs to "refuse before you emit", which this
   story owns, and is stated as an observable build outcome — the build fails and names the import
   chain — rather than as a description of the walker.

*Decided 2026-08-31, reconciling BUNDLE-21 (BUG-37) against this story.*

5. **Invocation-log retention is a criterion of this story, not of the bug that needed it.** BUG-37
   is a preview-performance defect whose behaviour lives in the site store; the retention block it
   added is deployment configuration for the operator surface, which is this story's subject and
   nobody else's. Decided: retention and its placement rule are ACs here, and nothing in this story
   asserts the runtime cost that motivated them — that is CAP-101's, and the free-plan CPU ceiling
   that actually caused the outage was resolved by a billing change the matrix cannot hold.

6. **Retention must not join the counted binding set, and that is a criterion rather than an
   implementation note.** The intent is silent on it: it argues for the declaration and for its
   placement, and says nothing about how the environment-repetition check should see it. Decided
   now, because the check identifies bindings *structurally* — by any block naming a binding — and
   that generality is only safe if non-binding blocks stay invisible to it. Left unstated, the
   first future block that looks binding-shaped would break the criteria asserting an exact
   production binding set, and the reason would be nowhere. Stated as an observable property of the
   parsed configuration.

7. **AC-1341's rule is restated to cover inheritable declarations, without claiming the check
   enforces them.** The configuration's own standing rule — written in its comments and followed
   for the platform-default-hostname control before this bundle — is that nothing depends on
   remembering which keys inherit. Decided: the criterion states that scope explicitly, and states
   just as explicitly that what the mechanical check *enumerates* is variables and bindings, with
   inheritable declarations pinned by the criteria that own them. Claiming the check covered them
   would have been false; leaving the rule implicit is how the repeat gets dropped as redundant by
   the next reader who is technically correct.

## Dependencies

Depends on the builder access gate existing, since two of the live-origin checks assert its
effect. No code dependency: the checks are HTTP assertions against a supplied origin.

## Story Points

3