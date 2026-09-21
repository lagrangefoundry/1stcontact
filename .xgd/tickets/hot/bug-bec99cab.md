---
uid: bug-bec99cab
id: BUG-134
type: bug
title: copy-to-cloud sends one Access token to two ends that need different ones
created_by: EPIC-16
created_at: '2026-09-21T01:05:49.302220+00:00'
updated_at: '2026-09-21T01:08:38.870766+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-49f51bb4
---

Found while walking the operator through the first go-live, 2026-09-20. Defect in
[[REQ-289]] as shipped. Parent epic: [[EPIC-16]].

## What happens

`bin/copy-to-cloud "Lagrange Foundry"` cannot authenticate both of its ends.

A copy touches two builders. The deployed one is behind Cloudflare Access and needs a
service token from `bin/access-token`. The local one, when it is run behind
`bin/access-sim` — which is how the operator's machine is actually set up, and the
only local configuration that can reach a business other than `TENANT_ID` — is *also*
behind Access, and accepts **only the simulator's own pair**:

```
access-sim: that CF-Access-Client-Id / CF-Access-Client-Secret pair is not this
simulator's. Run ./bin/access-sim --print-token for the one it accepts.
```

`copy.ts` carries one `access` field and sends it to both ends. Its own comment states
the reasoning — "sending it to whichever end was asked for costs nothing when that end
does not care" — which is true whenever the other end has no credential, and false in
exactly the configuration the command was written for. So the two ends need different
pairs and there is one slot to put them in.

The workaround is to restart `access-sim` with the production token's values so both
ends accept one pair. That puts a production credential in a local process's argv to
work around a missing parameter.

## The second half: the refusal points at the wrong variable

When the local end refuses, `getJson` says:

> That end is behind Cloudflare Access. Set `CF_ACCESS_CLIENT_ID` and
> `CF_ACCESS_CLIENT_SECRET` to a service token…

Those are already set, correctly, to the cloud's pair — the operator set them for the
end that is not the problem. The message names neither which end refused nor which
credential that end wants, and following it makes things worse.

## Behaviour

**A copy carries two credentials, one per end, chosen by direction the way origins
already are.** `endsFor` maps a direction onto `{source, destination}`; the credentials
are mapped by the same function over the same two inputs, so "from-cloud is to-cloud
with the ends swapped" stays one fact about the code rather than two.

**The cloud end keeps the names it has.** `CF_ACCESS_CLIENT_ID` /
`CF_ACCESS_CLIENT_SECRET`, and `--client-id` / `--client-secret`. That is the real
Cloudflare credential and nothing about it changes.

**The local end gains its own.** `LOCAL_ACCESS_CLIENT_ID` / `LOCAL_ACCESS_CLIENT_SECRET`,
and `--local-client-id` / `--local-client-secret`. Named for the END rather than for
`source`/`destination`, because which end is which depends on direction and the
operator configures a machine, not a role.

**Absent, the local end falls back to the cloud pair.** That is today's behaviour, and
it is right whenever one credential genuinely serves both — a UAT aiming both ends at a
single fake, or a local builder with no gate at all, which ignores the headers. The fix
adds a way to say the ends differ; it does not force everyone to say so.

**Half a local pair is refused exactly as half a cloud pair is**, by the same function
and with the same sentence, naming the local variables. Half a credential is not a
weaker credential.

**A refusal names the end that refused and the credential that end wants.** A copy has
two ends and the operator has two pairs; a message that names neither is what turned a
one-line fix into a diagnosis. The local end's refusal names the local variables and
mentions `bin/access-sim --print-token`; the cloud end's names the cloud variables and
`bin/access-token`.

## Acceptance

With the simulator's pair in `LOCAL_ACCESS_CLIENT_*` and the production pair in
`CF_ACCESS_CLIENT_*`, `bin/copy-to-cloud --origin http://127.0.0.1:8799 "<business>"`
authenticates both ends in one run, with no credential shared between them and nothing
retyped into `access-sim`.

`bin/copy-to-cloud --help`, `bin/copy-from-cloud --help` and `1c` help describe both
pairs and which end each reaches.

## Boundaries

- No change to `bin/access-sim`, to `/api/export`, or to `/api/import`.
- No change to what `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` mean.
- `--contacts`' asymmetry is untouched.

## Findings from reading the code — handed over, not decided

These came out of tracing the credential path. They are facts the implementing session
would otherwise rediscover; the design calls are still yours.

**`postSitePayload` has the same wrong-variable bug, and it is shared.**
`tools/generate/src/cli/push.ts:314` refuses with "Set `CF_ACCESS_CLIENT_ID` and
`CF_ACCESS_CLIENT_SECRET`…" unconditionally. On `copy-from-cloud` the DESTINATION is
the local end, so that sentence names the wrong credential there too — the same defect
as `getJson`'s, one layer down. It cannot be fixed by editing the text, because
`1c push` shares the function and its target really is the cloud; the end has to reach
it as a parameter.

**The credential mapping wants to be the same shape as `endsFor`.** That function maps
a direction onto `{source, destination}` over two origins, and its comment says why it
is one function: so "from-cloud is to-cloud with the ends swapped" is a fact about the
code rather than a claim in a comment. The credentials are the same mapping over two
different inputs. Written out by hand a second time, the swap gets reversed in the
direction nobody runs daily.

**Name the pairs after the END, not the role.** `source`/`destination` swap with
direction; `local`/`cloud` are the two machines an operator configures, and they are
what the variables should be named for. A refusal that said "the source end" makes the
reader work out which machine that is this time.

**The variable names appear in five places** — `serviceToken`'s refusal, `getJson`'s
refusal, `postSitePayload`'s refusal, the two `bin/*.help` texts and `1c` help. This
bug is what one of them naming the wrong credential costs. Worth one table rather than
five string literals.

**`bin/access-sim --print-token` emits `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET`.**
If the local end gets its own variable names, that output now sets the CLOUD pair to the
simulator's values — which is the original confusion wearing the opposite jacket. Either
`--print-token` learns to emit the local names, or the help text has to be explicit about
which pair it is setting. **This is a question, not a decision**: the Boundaries section
says not to change `bin/access-sim`, and that boundary may need to move. Raise it rather
than route around it.

**The simulator's defaults are fixed, not minted**: `local-dev.access` /
`local-dev-secret` (`bin/access-sim:104-105`, overridable by `SIM_CLIENT_ID` /
`SIM_CLIENT_SECRET`). So a UAT can exercise the two-pairs case with known values and
without starting the simulator.