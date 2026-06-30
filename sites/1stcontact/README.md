# sites/1stcontact

The 1st Contact marketing site — a real, git-tracked example site for the `1c`
CLI (`@1stcontact/generate`, REQ-9).

- `draft/` — the working set (`site.json` + `pages/*.json`).
- `revisions/0001/` — the first locked, published revision.
- `history.json` — the publish log.

Render a private preview, or publish a new locked revision:

```
1c render 1stcontact            # → dist/sites/1stcontact/draft/
1c publish 1stcontact -m "..."  # snapshot + render → dist/sites/1stcontact/published/
1c serve 1stcontact             # browse the published output
```

> Copy and assets here are placeholder scaffolding (operator follow-up per the
> REQ-9 out-of-scope note); the site exists to exercise the storage, versioning,
> and render pipeline end-to-end.
