---
uid: comment-05286da5
id: COMMENT-3274
type: comment
title: Comment on request REQ-283
created_by: xgd
created_at: '2026-09-19T19:57:12.167232+00:00'
updated_at: '2026-09-19T19:57:12.167232+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-7ccc3268
  kind: note
---

## Simplification: implement the store's PORT, keep our storage (2026-09-19)

An earlier note in this ticket said that storing the frame in the chat ticket's
frontmatter means writing our own `session.summary` provider. **That is not
required, and the correction removes work rather than adding it.**

`AgentToolbox` does not depend on `SummaryStore` the class. It takes it as an
injected option — *"`options.summary` — the REQ-124 store; `null` leaves the
summary operations unanswerable"* — and calls exactly three methods:

```js
summary(…)        → this._store().read(subject)
summary_frame(…)  → this._store().frame(subject, text)
summary_log(…)    → this._store().log(subject, text)
```

The shipped `session.summary` provider is equally narrow: `store.read(...)`, then
`summary.framing` and `summary.tail(n)`.

**So it is a port, not a dependency.** Implement `read` / `frame` / `log` over
this host's own storage — frame in the chat ticket's frontmatter, log from the
existing REQ-171 ledger body — returning the `{framing, tail(n)}` shape, pass it in
as `summary`, and we get:

- the `session.summary` provider **unchanged**, so no bespoke provider to write;
- `summary`, `summary_frame` and `summary_log` on the agent surface **unchanged**,
  so no narrow ledger verb to design either;
- the framework's cap semantics available to reuse (`checkFrame` raises rather
  than truncates — keep that rule whichever way it is enforced).

We take the interface and decline the layout. That is the seam this framework uses
everywhere, and it is why the frontmatter decision costs nothing.

**Do not delete `SummaryStore` upstream** on the strength of us not using it: it is
the reference implementation of that port, it is what an adopter with no ledger
should use, and its two-zone reasoning is the design record for why the frame is
bounded and the log is not.
