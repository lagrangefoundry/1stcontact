# The L1 conformance corpus

Three hand-authored sites — `1stcontact`, `gigabytealchemy`, `xgd` — kept as a
**frozen test input**. Fourteen suites read them to assert properties of the L1
envelope, the renderer and the colour system against documents a person wrote,
rather than against documents a test built to pass itself.

## This is not an authoring tier

`storage/sites/` used to be one: author a site as JSON on disk, render it, freeze
revisions, copy it up with a push script. REQ-290 retired all of that. **Every real
site now lives in the builder's store** — D1 and R2, local or deployed — and new
sites are made in the builder, not here.

The `storage/sites/` path survives *inside this directory only*, and only because
`loadSite({ cwd, root: 'sites' }, …)` resolves `<cwd>/storage/<root>/<slug>`. Keeping
repo shape is what lets each suite swap one constant — its repo root for this
directory — and change not one assertion. It is a path shape, not a tier.

## Rules

- **Read-only.** Nothing writes here. A suite that needs to mutate a site copies it
  into a temp `cwd` first; several already do.
- **Don't add sites to make a test pass.** The value of this corpus is that it was
  authored for its own sake. A document written to satisfy an assertion proves the
  assertion, not the renderer. Build that fixture in the suite that needs it.
- **Changing a document here changes what fourteen suites assert.** Expect to explain
  why in whichever ticket you are on.
