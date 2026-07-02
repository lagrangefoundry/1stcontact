# sites/harbor-cafe

A second example site for the `1c` CLI (`@1stcontact/generate`, REQ-9) — a demo
café, used to prove multi-site rendering and give the UATs a real second fixture.

- `draft/` — the working set (`site.json` + `pages/*.json`).
- `revisions/0001/` — the first locked, published revision.
- `history.json` — the publish log.

```
1c render harbor-cafe
1c publish harbor-cafe -m "..."
```
