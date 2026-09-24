---
uid: request-fec4b115
id: REQ-312
type: request
title: 'The font catalogue promises 1,941 families whose bytes do not exist: mirror
  + registry platform tier'
created_by: EPIC-21
created_at: '2026-09-23T03:18:55.065108+00:00'
updated_at: '2026-09-24T01:45:02.591988+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  epic_parent: epic-b9b27697
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d77dd94e
  commits:
  - working_sha: b02340216aa3a86b6f57a8ae9c015f3002f267c6
    reconcile_sha: null
    main_sha: null
  - working_sha: f62cf1b0f7359261cb025f176d659fb656c65998
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.346
  story_points: 21
---

uid: request-fec4b115
id: REQ-312
type: request
title: 'The font catalogue promises 1,941 families whose bytes do not exist: mirror
  + registry platform tier'
created_by: EPIC-21
created_at: '2026-09-23T03:18:55.065108+00:00'
updated_at: '2026-09-23T21:51:44.600572+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  epic_parent: epic-b9b27697
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d77dd94e
  commits:
  - working_sha: f62cf1b0f7359261cb025f176d659fb656c65998
    reconcile_sha: null
    main_sha: null
  version: 0.2.344
  story_points: 18
---

## The gap

[[DOC-56]] tells the assistant 1,941 families are available to serve. **None of their bytes
exist anywhere in the system.** The catalogue is a promise nothing keeps.

Font files today live per-site under `draft/assets/`, and every one of them arrived either
by hand (Satoshi, JetBrains Mono) or as a side effect of a capture. There is no platform
tier at all.

## Operator decision (2026-09-22)

**Platform fonts are platform-wide and shared. Tenant fonts are per-site, uploaded by the
tenant, and the tenant's licence responsibility.**

> "I was assuming this would be platform wide and shared — fonts may be small but copying
> them around is just going to get fiddly."

Copy-on-select is closed. It would have made font takedown an N-tenant sweep with N
rebuilds; shared serving makes it a registry flip plus a purge.

## Wanted

### 1. The mirror

Every OFL 1.1 / Apache 2.0 family in `fonts/catalogue.json`, mirrored into a **shared
platform R2 prefix** and served from a platform origin.

- **`woff2`, converted by us from the upstream TTFs.** See "Format" below — the upstream
  repo ships no `woff2`, so this is a conversion step we own rather than bytes we mirror.
- **Variable where the family ships variable** — though this saves nothing in bytes; see
  sizing.
- **Eager, not on demand.** Removes cold-start latency on first use of a family, removes a
  runtime dependency on Google's servers at authoring time, and avoids leaking which tenant
  is building what.
- **`LICENSES.txt` served alongside**, carrying each family's copyright notice and licence
  text. OFL requires the notice to travel with the distribution; this is the obligation
  discharged rather than recorded.

### 2. A platform tier in the registry

`fonts/registry.yaml` records provenance per font file and is joined by `1c fonts check`.
It currently describes per-site files only, and hand-writing 1,941 entries is not an
option.

- Platform entries are **generated from the catalogue**, not authored:
  `redistribute_in_product: true` follows from the licence field, so no family needs an
  individual legal decision.
- The registry gains a **tier** distinction — `platform` vs `site` — because the two carry
  different obligations. A platform font is cleared by construction; a site font is
  attested by a tenant we cannot audit.

### 3. `1c fonts check` resolves platform-origin `src`

Today a page pointing at a platform origin URL would be reported `unregistered-file`,
because the check resolves a `src` to an asset basename and looks for it on disk. It must
resolve a platform-origin `src` against the platform tier instead.

The existing four violation kinds keep their meaning for the site tier. The gate that
matters — a `distribution: product` site referencing a font whose
`redistribute_in_product` is not `true` — is unchanged and still fires.

## Format — convert upstream TTFs to `woff2` ourselves

**Settled 2026-09-23.** Operator: *"We need to download and convert these."*

`github.com/google/fonts` ships **TTF only**. Verified: `ofl/inter` contains two variable
TTFs (1.78MB) and no `woff2`; `ofl/lato` contains 18 static TTFs (11.9MB). Across the whole
OFL tree there are 3,808 TTF/OTF files and zero `woff2`. An earlier draft of this ticket
specified "unmodified upstream release `woff2`", which does not exist as a thing to mirror.

So we convert. **This is compression and a container change — no glyph removed, no name
altered** — which keeps us clear of OFL's Reserved Font Name clause, since the font is not
modified in any sense that clause is about.

Rejected: mirroring `fonts.gstatic.com`'s `woff2`. Smaller and common practice, but those
bytes are Google's per-unicode-range **subsets**, so serving them would mean redistributing
a modified version — the exact question converting ourselves avoids. Subsetting by us is
rejected for the same reason.

### The conversion is invertible, and the mirror proves it per file

Only WOFF2's **null transform** is used — transformation version 3 for `glyf`/`loca`,
version 0 for everything else — so every table is handed to Brotli literally. The
repackaging is therefore reversible, and that reversibility is the whole argument: a
transformation that inverts exactly has not modified the font, it has packaged it.

So it is **checked rather than asserted**. Every file is decoded back before it is written
and compared table by table against the upstream `.ttf`; a file that does not reverse is not
written, and its family is reported as a gap. An unmirrored family is a stated absence,
while a silently altered one is a redistribution of a modified font under its reserved name.

**Two differences are the specification's, not ours,** and both are `MUST`s on any WOFF2
encoder:

- **`DSIG` is dropped.** A digital signature over the old table offsets cannot survive
  repackaging, so keeping it would mean shipping a signature that no longer verifies.
- **`head.flags` bit 11 is set** — the format's own marker for "losslessly repackaged".
  That changes `head`, so a conforming decoder recomputes `checkSumAdjustment` too.

Everything else — every glyph, the whole `name` table, the embedded copyright string —
survives byte for byte.

### No new dependency for the conversion

The encoder is written here, over Node's built-in Brotli. The alternative was `wawoff2`, a
1.4MB emscripten WASM blob. The WOFF2 container is a frozen format, so a from-scratch
encoder costs almost nothing to maintain, and it keeps a GB-scale build step off the supply
chain. The inversion check above is also the encoder's own test: it is verified against real
upstream fonts rather than against a fixture of its own making.

### Upstream is read from a checkout, not from ten thousand HTTP requests

`1c fonts mirror --repo <dir>` reads a `google/fonts` checkout from disk. Fetching 2.45 GB
across ~3,800 files by individual HTTPS request is the slowest and least reliable way to get
it — `raw.githubusercontent.com` rate-limits an unauthenticated caller within minutes — and
a checkout is what "acquired like a dependency" already means everywhere else. The
checkout's own commit is then the pin: the provenance of every mirrored byte is a git sha
rather than whatever a CDN served that afternoon.

The catalogue says where to look. Each family's `licence_source` records the very
`METADATA.pb` its licence was read from, so the mirror never infers a directory from a slug
— the inference that missed six renamed `Edu *` families.

## Sizing — measured, and larger than first stated

An earlier draft said "a few hundred MB". **Measured from the recursive OFL tree:**

| | |
|---|---|
| OFL font files | **3,808 files, 2.45 GB** of TTF |
| of which variable | 773 files, 0.71 GB |
| of which static | 3,035 files, 1.74 GB |
| converted to `woff2` (~55%) | **~1.35 GB** |

Plus the Apache tree (44 families), which is small by comparison.

**Preferring variable files and dropping redundant statics saves nothing** — 2.44 GB against
2.45 GB. Families that ship variable overwhelmingly ship *only* variable, so the statics are
not duplicates waiting to be dropped. That optimisation is closed.

**None of this is a performance concern, and the cost is negligible.** ~1.35 GB in R2 is
about $0.02/month at ~$0.015/GB-month, R2 charges no egress, and a visitor downloads only
the one or two faces their page uses — which was already true before any of this. The
mirror is R2 objects rather than bundle content, so it does not interact with the Worker
bundle limit and persists across deploys independently of them.

Sizing is recorded here because the earlier figure was wrong, not because it gates
anything. **Operator decision (2026-09-23): pull everything.**

## How the mirror runs — part of the system build toolset

**Operator direction (2026-09-23):** *"on running the mirror — that should be part of the
system build, not sure its something we want/need to do every build but it needs to be in
that tool set just like any other dependency."*

So the mirror is **acquired like a dependency, not rebuilt like an artifact**:

- A verb in the build toolset — `1c fonts mirror` — alongside `1c kb build` and the other
  release-time commands, so an operator provisioning a deployment reaches it the same way
  they reach everything else.
- **Not run on every build.** The corpus changes when upstream does, not when our code
  does. Upstream added 202 families in 2024, 122 in 2025 and 42 so far in 2026 — roughly
  120–200 a year — so an **annual refresh** is ample, with an ad-hoc run whenever something
  new is wanted sooner. Nothing breaks by being a few months behind: a family not yet
  pulled is simply one the assistant cannot name yet.
- **Populating R2 is not deploying a bundle.** Mirrored objects persist independently of
  Worker deploys, so a deploy neither re-uploads them nor waits on them.
- **Pinned and reproducible.** The mirror is pinned to a catalogue version so two
  deployments built from the same commit serve the same faces. An unpinned mirror would
  make a site's typography depend on the day it was built.
- **Incremental.** Re-running against an unchanged catalogue transfers nothing; a refresh
  moves only what changed upstream.
- **Absence is legible, not silent.** A deployment whose mirror has never been populated
  must say so plainly — the same way an operator who has never run `1c kb build` gets a
  null KB rather than a KB that silently answers nothing.

## Where the platform entries live — a separate generated file

Platform entries do **not** go into `fonts/registry.yaml`. That file is hand-authored, it
is nine entries long, and it carries the reasoning behind each licence judgement in prose
comments. Generating 1,941 entries into it would drown the authored content and make every
diff unreadable.

Instead: a **separate generated file** carrying the platform tier, which `1c fonts check`
loads alongside the authored registry. One producer each, no file that is half-generated
and half-authored. `fonts/registry.yaml` keeps describing the site tier and stays
reviewable by a person.

That file is **`fonts/platform.json`** — the sibling of `fonts/catalogue.json`, generated
JSON beside generated JSON. It is the manifest the mirror writes, the provenance record the
check reads, and the pin that makes two builds of the same commit serve the same faces:
every mirrored family, path, size and digest, plus the catalogue and the upstream commit the
run was taken at. There is deliberately no second serialisation of it as registry entries —
the platform tier is *derived* from this manifest when the check loads it, so there is no
pair of files that can disagree.

**The bytes are not in the repository.** `fonts/platform.json` is committed; the staged
`woff2` under `fonts/mirror/` is gitignored. A GB of fonts in git is the thing a shared
origin exists to avoid, and the manifest's digests are what let the repo describe bytes it
does not carry.

## The serving origin — RE-REVIEWED AND SETTLED 2026-09-23 (`COMMENT-3711`)

**A site is self-contained: every font it serves comes from its own domain.**

> **Operator:** *"I think it is highly desirable that a site is self-contained and everything
> it needs comes from its domain."*

An earlier reading of this section had a page carry an **absolute platform-origin URL**, on
the grounds that the renderer's root-relative → document-relative rewrite ruled a
root-relative path out. `COMMENT-3711` sent that back, correctly: that rewrite rules out
root-relative paths **for a server that only answers at the origin root** — it does not
choose a host. Four things then favour the site's own domain, and none of them was weighed
the first time:

1. **A shared origin buys no cache reuse.** Every major browser has partitioned the HTTP
   cache by top-level site since ~2020. *"The visitor already has this face from another
   tenant"* has not been true for years. The year-long immutable caching is still right;
   what it does not deliver is sharing across sites.
2. **A second origin costs a connection** — DNS, TCP and TLS before the first font byte, on
   the path that decides whether text paints in the real face or a fallback.
3. **CORS stops being load-bearing.** Same-origin, a font is an ordinary subresource.
4. **No third-party request from a visitor's browser** — the thing the German Google-Fonts
   judgments were about, and the thing our customers, who are small businesses, get asked
   about.

### The question the re-review asked, and its answer

`COMMENT-3711` named hostname stability as the one real argument for a platform origin — an
absolute self-host URL baked into rendered bytes goes stale when a site later binds or
changes a custom domain — and asked whether pages are re-rendered when a binding changes.

**They are not.** Published pages are pre-rendered bytes in R2, and `attachCustomHosts` /
`releaseCustomHosts` are pure `site_domains` writes: one D1 batch, no re-render, no
republish. An absolute self-host URL in a page therefore WOULD be stranded by a later
domain change.

So neither absolute form survives. **The `src` is root-relative and names no host at all**
(`/_fonts/<slug>/<file>.woff2`) — same-origin by construction, and immune to a rebinding
because there is no hostname in it to go stale.

### What that costs, and it is the whole of the cost

The renderer reduces a root-relative `url()` to a document-relative one so a snapshot is
relocatable (REQ-109), and every page sits flat at its snapshot root — so `/_fonts/x` is
read as `<snapshot-root>/_fonts/x`. The invariant that follows is owed by every serving
surface:

> **Every channel that serves a rendered snapshot must answer `_fonts/…` at that snapshot's
> own root.**

That is four roots, not one, and each resolves the tail through the same one function:

| Root | Server |
|---|---|
| `/` — a bound customer domain, and the apex | `public-site` |
| `/site/<key>/` — the platform's own host | `public-site` |
| `/preview/<key>/<channel>/` and `/portal/` | `control-app` |
| the directory the capture fixture binds an origin over | `startServe` (`1c shot`, `1c aligned-crops`, module conformance) |

The second of those is the one the first reading would have broken outright: a whole channel
404ing every font. The third is the one that matters most day to day — an operator picks a
font in the builder, and a preview that cannot answer for it shows them a fallback face
while telling them they chose Roboto. Nothing else in the system can see that failure: the
manifest is right, the page validates, and `1c fonts check` passes.

### The rest of the arrangement, unchanged

- **R2 layout**: `platform/fonts/<slug>/<file>` in the existing `1stcontact-sites` bucket.
  One copy, no per-tenant duplication; takedown is still a registry flip plus a purge. No new
  bucket and no new binding: `sites/` is that bucket's only other key root, so the prefix
  cannot collide, and both Workers that need it already hold the binding.
- **Matched ahead of the site route grammar**, exactly as `/api/download/…` is. `_fonts` is a
  reserved first segment of a *snapshot*, so no published page can shadow it.
- **Answered before the cross-tenant guard, and that is not an optimisation.** A platform
  font belongs to no site, so resolving `/site/<key>/_fonts/x` through `siteOfRoute` would
  ask whether this host may serve *that site* — and on a bound customer domain the correct
  answer to that question is "no", which is the wrong answer to this one. Nothing leaks by
  skipping it: the bytes are identical for every tenant and the key in the path selects none
  of them. The guard still refuses the site's own pages, which is what keeps the exemption
  scoped to `_fonts` rather than a hole in the guard.
- **What is served at each root**: `_fonts/<slug>/<file>.woff2`, each family's own licence
  file at `_fonts/<slug>/OFL.txt`, and the aggregate index at `_fonts/LICENSES.txt`.
- **Cacheable for a year on the published channels.** The bytes are immutable — a file's name
  changes when its content does. `Access-Control-Allow-Origin: *` is kept although it is no
  longer load-bearing: it costs nothing and still covers the case that genuinely is
  cross-origin, a preview served from a different host than the one a page finally lives on.
  A preview's own copy is not cached immutably — every other byte that router returns is
  stamped uncacheable, and a font is not the place to make an exception.
- **The preview's byte source is injected, because the two runtimes share nothing below it.**
  Deployed, it is the R2 binding. In the Node builder transport `env.SITES` is a Proxy that
  throws by design, and the bytes are the staged mirror on the operator's own disk — a
  different reader, not a different code path, so it arrives as a `RouterDeps` entry beside
  the store and the ladder rather than as a branch in the route.
- **The check matches on the path and admits no host.** One site definition checks the same
  against a local preview, a staging deployment and production — and a page can never carry a
  hostname that a later domain change strands. `use_font` ([[REQ-313]]) writes the `src`
  through the same one definition the check and all four servers resolve it with.

### Off-origin fonts are refused, not merely discouraged

Self-containment is a **checked** property. A font `src` naming any host — `fonts.gstatic.com`,
a CDN, or this platform's own hostname — is a violation in its own right
(`off-origin-font`), reported with its own sentence. One rule covers all three, because from
the visitor's browser they are the same fact: a third-party request, made before any text
can paint, disclosing their IP to somebody the customer never named.

Reported separately because the alternative is worse than silence. With no host admitted, an
absolute `src` falls to the site tier and surfaces as *"the registry does not list
`Roboto[wght].woff2`"* — true, about the wrong problem, and with the wrong obvious fix
(register the file, rather than stop fetching it from somebody else).

## How the bytes reach R2

`1c fonts publish` uploads the staged mirror to the platform prefix over Cloudflare's R2
REST API, using the same `CLOUDFLARE_API_TOKEN` and the same account discovery `1c kb build`
already uses — one credential for the release-time toolset, not a second. The resolver is
extracted out of `kb.ts` so both commands ask the same question the same way.

It is deliberately **not** routed through a Worker endpoint the way a site payload is. That
rule exists because a site is a *store* with schema semantics, where a second writer could
disagree with the first about what a site is made of. A platform font is an opaque byte
object in a prefix nothing else writes — there is no second opinion available to have — and
a Worker upload path for a GB of fonts would be an endpoint built for exactly one caller.

It is **incremental and resumable**: each object's digest is compared before it is sent, so
an interrupted publish resumes by being re-run and a re-publish of an unchanged mirror
transfers nothing.

## Licence text — per family, plus an index

Every upstream family directory ships its own `OFL.txt` (2,379 licence files across the OFL
tree). Mirror each family's licence file **alongside that family's bytes**, so the notice
travels with the font exactly as OFL requires, and generate an aggregate index at the origin
root naming every mirrored family and its licence. The per-family file discharges the
obligation; the index makes it auditable.

## Behaviour

- Every family listed in [[DOC-56]] resolves to served bytes. A family in the document with
  nothing behind it is the failure this ticket exists to prevent, so the mirror and the
  document are checked against each other.
- A page referencing a platform font passes `1c fonts check` without that font appearing in
  any site's `draft/assets/`.
- A page referencing a platform-origin `src` for a family **not** in the mirror fails the
  check, naming the family.
- `LICENSES.txt` is reachable from the serving origin and names every mirrored family.
- Re-running the mirror against an unchanged catalogue transfers nothing.
- A family removed upstream is reported rather than silently dropped — a live site may be
  serving it.
- Two deployments built from the same commit serve the same faces.
- A refresh that adds families leaves already-served faces byte-identical.
- A deploy does not re-upload the mirror and does not wait on it.
- A deployment whose mirror has never been populated reports that plainly rather than
  serving nothing silently.
- Each mirrored family's licence file is served alongside its bytes.
- `fonts/registry.yaml` is not rewritten by the mirror; the platform tier is a separate
  generated file.
- A mirrored file inverts back to the upstream font: every table byte-identical but the two
  the WOFF2 specification requires an encoder to change. A file that fails to invert is not
  written, and its family is reported as a gap rather than served altered.
- The same family name may exist in both tiers without colliding. Five of the nine authored
  entries are Google families the mirror also holds, so a registry indexed across both tiers
  would refuse to load at all; a site `src` resolves against the site tier and a platform
  `src` against the platform tier.
- A platform font is served so one shared copy can serve every tenant's own domain:
  cacheable for a year, readable cross-origin, and reachable on a customer's host as on the
  platform's own.
- **A page's font `src` names no host.** It is root-relative, so a site is self-contained,
  no visitor's browser makes a third-party request for a face, and no published page carries
  a hostname that a later domain binding could strand.
- **Every channel that serves a rendered snapshot answers `_fonts/…` at that snapshot's own
  root** — the two `public-site` serves (`/` on a bound domain or the apex, and
  `/site/<key>/` on the platform's host), the `control-app` preview and portal roots, and the
  directory the capture fixture binds an origin over. All four resolve the tail through one
  shared definition, so none can come to disagree about what a platform font path is.
- **The cross-tenant guard does not refuse a platform font.** A bound customer domain serves
  `/site/<another key>/_fonts/…` and still refuses `/site/<another key>/`'s own pages.
- A preview shows the face the operator actually chose, reading it from R2 when deployed and
  from the staged mirror on disk in the Node builder transport — so picking a font in the
  builder does not render as a fallback while the builder says otherwise.
- A path the mirror does not hold is a 404 at every root, never a fall-through into the
  renderer or the site grammar.
- **A font `src` naming any host is a violation** (`off-origin-font`), reported as what it is
  rather than as a missing registry entry — whether the host is a third party's, Google's, or
  this platform's own.
- A platform `src` is recognised by its path, and a site-relative path is never read as a
  platform reference whatever its tail looks like — so a site cannot claim the platform
  tier's licence clearance for bytes it holds itself.
- A page referencing a platform-origin `src` for a *file* the mirrored family does not hold
  fails the check naming the file, the same way an unregistered site file does.
- The font origin is read-only and reaches no site: a path the mirror does not hold is a
  404 rather than a request that falls through into the site grammar, and a non-GET method
  is refused exactly as every other path on this Worker refuses one.
- A family the mirror cannot take is named in the run's report, never silently omitted, and
  whatever it had is retained.

## Notes

- Five UFL 1.0 families are **excluded** pending individual clearing; their modification
  terms differ from OFL.
- Delisted and sandboxed families are excluded — the live list is the authority.
- Sizing is measured above, not estimated. Storage is not the constraint; the format
  decision and correctness of what is served are.
- The serving origin was re-reviewed on `COMMENT-3711` and settled as same-origin,
  root-relative. `use_font` ([[REQ-313]]) writes the `src`, all four snapshot roots serve it
  and `1c fonts check` resolves it; every one of them shares a single definition of the path
  shape, so none can drift from the others.
- **Running the real 1,941-family transfer is an operator action, not part of this ticket's
  code landing.** The machinery is proved end to end against a checkout fixture; populating
  production is a GB-scale dependency fetch taken deliberately, which is the whole point of
  the build-toolset framing above. Until it is run, `1c fonts check` reports the mirror as
  NOT POPULATED and names how many documented families have nothing behind them.