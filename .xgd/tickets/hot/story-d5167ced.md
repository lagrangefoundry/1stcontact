---
uid: story-d5167ced
id: STORY-119
type: story
title: 'Platform Build, Deploy & Smoke: One Path To Ship A Worker, And Proof It Serves'
created_by: xgd
created_at: '2026-08-20T05:29:12.423310+00:00'
updated_at: '2026-08-20T15:29:27.911493+00:00'
completed_at: null
last_field_updated: uat_coverage
status: completed
fields:
  intent_uid: bundle-77b28def
  capability_uid: capability-5d07b533
  story_kind: feature
  story_points: 3
  uat_coverage: pass
---

## Story

**As an** operator responsible for the platform's own Workers,
**I want** one command that builds every deployable artifact and refuses before emitting a broken
one, one that deploys them — rehearsal and real deploy on the same path, with migrations and
secrets arriving as seams rather than as edits — and one that afterwards asserts against the live
origin and fails naming the assertion that did not hold,
**so that** a deploy done by me and a deploy done by automation are the same deploy, and a
deployment that reported success has been shown to actually serve rather than merely to have
uploaded bytes.

## Description

A deploy that reported success has proved that bytes were uploaded. It has not proved that the
build was complete, that the deployed Worker can see its configuration, or that anything serves.
This story covers the three commands that close each of those gaps, and the configuration rule
whose omission had already made one of them impossible.

**Build — refuse before you emit.** The build command runs three stages in order: an environment
preflight, the workspace package builds, then a per-Worker bundle. The preflight exists because
the shared component store is populated out of band — nothing in the package manifests records
it, so the installer cannot supply it and the lockfile cannot notice it gone. Its absence is not
loud where it bites: the builder composes a browser import map from those components, so a
missing one yields a document that loads, renders chrome, and then dies at the first import, in
the operator's browser, with their site on screen. The preflight reports every shared component
and every declared package with its status and refuses an incomplete tree with an environment-
specific exit code, naming what is absent and the command that installs it. The bundle stage
builds each Worker **against the production environment**, deliberately: a configuration error
that exists only under the production environment is the whole subject of this story, and
building the default environment would miss every one.

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

**Smoke — prove it serves.** Nine HTTP checks against a live origin, exiting non-zero naming the
ones that failed: the apex resolves; an unknown site is not found; a site that exists but has
published nothing is **indistinguishable** from one that does not exist, in status *and* body,
because a 404 that says which would answer questions about sites the asker has no business
knowing exist; the trailing-slash redirect holds on both the published and the preview channel;
the preview index serves HTML; the preview channel's caching and robots policy are right; a miss
inside a preview is a non-indexable 404; and every same-origin asset the rendered page references
resolves with the content type its extension implies — following attribute references **and one
level into stylesheets**, where web fonts hide, because a missing font is invisible in a
screenshot and obvious to a reader. A check with nothing to test against reports **skip**, never
quiet success, and skips are counted in the summary: a run that skipped everything has proved
nothing and says so. The check engine is drivable against a supplied origin, so its failure path
is exercised without breaking a real deploy.

**The configuration rule behind all of it.** A named deployment environment inherits neither
variables nor bindings. The control application declared its builder origin only at the top level,
so the deployed Worker would have seen no configuration at all and answered its own service-
unavailable response to every request — and the tool warns rather than errors, so nothing
mechanical stopped it. The repository already recorded this rule for a storage binding on the
other Worker and simply had not followed it. It is now a checked property of **every** Worker in
the tree, with bindings identified structurally — anything declaring a binding name — rather than
from a list that would silently stop covering the first binding kind nobody remembered to add.

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
- Building every discovered Worker against the production environment, and the artifacts reported.
- Deploying discovered Workers, with rehearsal and real deploy on one path; target selection and
  the refusal of an unknown app.
- The hook contract: discovery by executability, sorted order, the context each hook receives,
  and abort-before-upload on failure.
- The nine live-origin checks, their pass, fail and skip reporting, and the failure naming.
- Every named environment repeating every top-level variable and binding, checked across the tree.
- A documented secret mechanism that commits and echoes nothing.

### Out of scope

- **Any live deployment of the control application.** It has never been deployed and its hostname
  does not resolve; both are deliberately left alone here (see Technical Context).
- **The migration and secret hooks themselves.** This story owns the seam and its contract; the
  database migrations and the assistant's API key each arrive as their own hook file, changing
  nothing here. That separation is what keeps this work free of a dependency on the storage chain.
- **Wiring continuous integration to the build command**, which cannot run the preflight because
  the shared component store is absent there.
- **Shipping a site's rendered snapshot, or serving one to a visitor** — a different store on the
  far side of a deploy, owned by CAP-82.

## Technical Context

**Relationship to existing capabilities.** CAP-82 (Site Delivery: Deploy & Public Serving) owns
`1c deploy` shipping a *site's* snapshot to shared storage and the Worker that serves it; this
capability owns building, deploying and verifying the *platform's own* Workers, including their
deployment configuration. The two meet at exactly one point: the live-origin checks assert the
serving behaviour CAP-82 specifies, and the content-type expectations here are deliberately a
*second statement* of the serving Worker's own table, because this check runs outside the Worker
bundle and cannot import it — the pair is pinned together rather than left to drift, the same
arrangement already recorded for `1c deploy`. CAP-101 (Site Storage Port) and this story are
independent. The environment preflight is a second, separate check beside the existing install
preflight, which answers "is this tree installed at its lockfile?" for declared packages; these
are different kinds of dependency that fail in different ways, and the report says which.

**Where the intent's premise was wrong on the facts, and what was found instead.** The intent
stated production had been "returning 503 since it was deployed". Investigation against the live
account established that it had not:

1. The control application's hostname does **not resolve at all** — the route is declared against
   a zone that has no DNS record for it, where the other Worker's apex uses a custom domain
   precisely for this reason.
2. The control application **has never been deployed** to the account at all.

So the configuration bug was never live; it was a trap set for the first deploy, now sprung
harmlessly. Neither finding is fixed here, and deliberately: creating the record and deploying
would make the builder publicly reachable, and the access-control ticket that gates that exposure
depends on this one precisely so it can. The sequence is: these scripts → the access policy →
DNS → deploy. **No acceptance criterion here claims a live control-application deploy.**

**A residual honest failure, recorded rather than absorbed.** Repeating the builder origin under
the production environment makes the failure *diagnosable*, not *working*: the value still points
at a local address, which a deployed Worker cannot reach by any value of that variable. Production
therefore answers a bad-gateway rather than a missing-configuration response until a later ticket
moves the routes into the Workers runtime and deletes the proxy. That is the intended outcome of
this work, not a shortfall of it.

**Outstanding at reconciliation time, and why.** The secret mechanism is documented and its
rehearsal path is exercised, but it has **not** been proved end-to-end with a throwaway value
against the live account — that means writing to production configuration, which was left for the
operator to authorise, and is in any case blocked by finding 2 (there is no Worker to put a secret
on). The acceptance criterion here is therefore written about what is observable: nothing is
committed, and the documented mechanism never echoes a value.

**The build artifact is evidence, not input.** The per-Worker bundle produced by the build stage is
not consumed by the deploy, which rebuilds from source. It exists to prove the artifact builds and
the configuration resolves. It becomes a genuinely needed artifact when the builder client stops
being served off disk.

**Suite state at the time of reconciliation, and its attribution.** The full node suite has
pre-existing failures unrelated to this work (assistant and toolbox surfaces), verified identical
at the baseline commit with this work stashed. Closing them belongs to whichever intent owns the
upstream toolbox upgrade.

## Dependencies

None.

## Story Points

3