# @1stcontact/generate — the `1c` CLI

File-backed site storage, versioning, and the **server-side** render pipeline
(REQ-9, model defined in DOC-12; build pipeline in DOC-7 §2.4 / §11).

An operator authors sites as files under `sites/<slug>/`, renders them to static
HTML, views them in a browser, and versions them through publish / checkout.

## On-disk model

```
sites/<slug>/         real sites — TRACKED IN GIT
  draft/              working set: site.json + pages/*.json + assets/
  revisions/NNNN/     locked full snapshots (forward-only; live = highest)
  history.json        the publish log (DOC-12 §4)
  .draft-base.json    which revision draft/ descends from (lineage; not snapshotted)
sandbox/<slug>/       throwaway scratch sites — GITIGNORED (identical shape)
dist/<root>/<slug>/   rendered output — GITIGNORED (root = sites | sandbox)
  draft/      <- 1c render    (private preview)
  published/  <- 1c publish   (public)
```

One file per page; module instances are inline. A revision is a complete byte
copy of the whole working set.

## Commands

```
1c new <slug> [--sandbox]                                   scaffold an empty draft
1c list [--sandbox]                                         list sites + latest revision
1c render <slug> [--source draft|latest|<revId>] [--out d]  render (default: draft)
1c publish <slug> [-m "msg"] [--by <id>]                    snapshot → diff → history → render published
1c checkout <slug> [<revId>] [--force]                      copy a revision into draft/
1c revisions <slug>                                         print the publish log, newest-first
1c serve <slug> [--source draft|published] [--port n]       static preview server
```

Every command defaults to the git-tracked `sites/` tree; `--sandbox` targets the
gitignored `sandbox/` scratch tree. Rendered output always lands under
`dist/<root>/<slug>/<channel>/`.

## How it runs

The render path imports the framework's Astro module components, so the `1c`
binary loads its CLI through a Vite SSR server wired with Astro's plugin (the
same transform path the UATs use under Vitest). The renderer is **catalog-driven**
— it renders whatever modules a page contains via `getModule(type, version)` —
so new modules require no renderer change.
