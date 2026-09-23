---
uid: request-fec4b115
id: REQ-312
type: request
title: 'The font catalogue promises 1,941 families whose bytes do not exist: mirror
  + registry platform tier'
created_by: EPIC-21
created_at: '2026-09-23T03:18:55.065108+00:00'
updated_at: '2026-09-23T18:28:57.666992+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  epic_parent: epic-b9b27697
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d77dd94e
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

- **Format: OPEN — see "The woff2 problem" below.** An earlier draft of this ticket
  specified "unmodified upstream release `woff2`". **That was wrong: the upstream repo
  ships no `woff2` at all.** The decision this ticket rested on has to be retaken.
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

## The woff2 problem — OPEN, needs an operator decision

`github.com/google/fonts` ships **TTF only**. Verified: `ofl/inter` contains two variable
TTFs (1.78MB) and no `woff2`; `ofl/lato` contains 18 static TTFs (11.9MB). Across the whole
OFL tree there are 3,808 TTF/OTF files and zero `woff2`.

The `woff2` files the web actually uses are served by `fonts.gstatic.com`, and **those are
subsetted by Google per unicode-range**. So "unmodified upstream woff2" does not exist as a
thing to mirror, and the Reserved Font Name reasoning this ticket and [[REQ-314]] both lean
on rests on a premise that is false.

Three routes, and the choice is a licence-posture decision as much as a technical one:

1. **Mirror repo TTFs and convert to `woff2` ourselves.** Compression and container change
   only — no glyph removed, no name altered. The strongest RFN position, since the font is
   not modified in any sense the clause is about. Costs a conversion step in the toolchain
   and the most bytes.
2. **Mirror `fonts.gstatic.com` `woff2`.** Smallest by far and universal practice — this is
   what `google-webfonts-helper` and thousands of self-hosting sites do. But the bytes are
   Google's subsets, so we would be redistributing a modified version, which is exactly the
   question route 1 avoids.
3. **Convert and subset ourselves.** Smallest and most controlled, and the most clearly a
   modification.

No route is selected. Route 1 is the conservative default if no other consideration
intervenes.

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

This is a GB-scale dependency, which is what makes the build-integration decision below
matter.

## How the mirror runs — part of the system build toolset

**Operator direction (2026-09-23):** *"on running the mirror — that should be part of the
system build, not sure its something we want/need to do every build but it needs to be in
that tool set just like any other dependency."*

So the mirror is **acquired like a dependency, not rebuilt like an artifact**:

- A verb in the build toolset — `1c fonts mirror` — alongside `1c kb build` and the other
  release-time commands, so an operator provisioning a deployment reaches it the same way
  they reach everything else.
- **Not run on every build.** At GB scale a per-build fetch is not viable, and there is no
  reason for one: the corpus changes when upstream does, not when our code does.
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
- A deployment whose mirror has never been populated reports that plainly rather than
  serving nothing silently.
- Each mirrored family's licence file is served alongside its bytes.
- `fonts/registry.yaml` is not rewritten by the mirror; the platform tier is a separate
  generated file.

## Notes

- Five UFL 1.0 families are **excluded** pending individual clearing; their modification
  terms differ from OFL.
- Delisted and sandboxed families are excluded — the live list is the authority.
- Sizing is measured above, not estimated. Storage is not the constraint; the format
  decision and correctness of what is served are.
- **Open, not settled here:** the `woff2` route (above), and the serving origin — which
  hostname and path shape platform fonts are served from. `use_font` ([[REQ-313]]) writes
  that `src` and `1c fonts check` resolves it, so both depend on it.