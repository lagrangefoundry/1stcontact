#!/usr/bin/env node
/**
 * `bin/deploy.d/lib/probe.mjs` — **does this credential actually work?**
 * ([[REQ-264]]).
 *
 * WHAT WAS WRONG. Every hook under `bin/deploy.d/secrets/` decided between
 * push, keep and fail on one question — *is there a value* — and a key with the
 * wrong scope passed all three outcomes and shipped. A `RESEND_API_KEY` minted
 * with **Sending access** sends mail and 401s on `GET /domains`, so the domain
 * section offered a sending toggle it could never honour: the exact condition
 * `apps/control-app/src/resend.ts` already names as *"worse than not offering
 * it"*. Presence had been checked. Capability had not.
 *
 * SO A PROBE IS THE CALL THE PRODUCT MAKES, and that is the selection rule
 * rather than a coincidence. `GET /domains` is the request that failed in the
 * field; a synthetic health check against some other endpoint would have
 * returned 200 for a sending-only key and proved the wrong thing.
 *
 * READ-ONLY, ALWAYS. A deploy must not create a DNS record to prove it can
 * write one. Where a permission cannot be proven without writing — `Zone:DNS:
 * Edit` is the only one here — the nearest read is proven and the report says
 * the edit is INFERRED rather than verified. {@link PROBES} is checked by a UAT
 * for exactly this: every request below is a `GET`, except the one Workers AI
 * inference that has no `GET` form and changes nothing.
 *
 * WHAT IT CANNOT DO, said here because the report has to say it too. A secret
 * that lives only in Cloudflare's store CANNOT BE READ BACK — `wrangler secret
 * list` answers with names — so a credential the operator did not supply this
 * run is recorded `stored`, which reads as *unverified* and never as *ok*. The
 * probe therefore runs on a rotation and on the first deploy of a value, and a
 * deploy that changes nothing reports honestly that it proved nothing.
 *
 * WHY PLAIN JAVASCRIPT, and the reason is `tools/generate/bin/smoke.mjs`'s
 * exactly: this runs from a shell, before a deploy, at the moment the toolchain
 * is least likely to be warm. It takes no transform, no bundler and no
 * dependency — `node` and `fetch`. Every probe is a pure function of a `fetch`,
 * so the UATs drive them with a fake and no suite ever holds a real key.
 *
 * WHERE THE POLICY LIVES. Not here. This answers *what can this credential do*;
 * the hook that owns the secret decides whether that is a warning or a refusal,
 * because the answer differs per credential and is a statement about the SURFACE
 * — a missing sending credential costs a feature, a missing zone credential
 * costs the whole section ([[REQ-259]]).
 *
 * Usage, from a hook:
 *
 *   node bin/deploy.d/lib/probe.mjs probe RESEND_API_KEY   # value read from env
 *   node bin/deploy.d/lib/probe.mjs record RESEND_API_KEY stored
 *   node bin/deploy.d/lib/probe.mjs report                 # print and reset
 *
 * `probe` and `record` append one JSON line to `$DEPLOY_CAPABILITY_REPORT` when
 * that is set, so `bin/deploy` can print the whole picture in one place at the
 * end. `probe` exits 0 capable, 2 insufficient, 3 invalid, 4 unreachable.
 */

import { appendFileSync, readFileSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** How long a probe waits before calling the provider unreachable. */
export const PROBE_TIMEOUT_MS = 8000

/**
 * How close to expiry is close enough to say so.
 *
 * THIRTY DAYS AND NOT SEVEN. The thing being warned about is *"a deploy that
 * will start failing on a date nobody wrote down"*, and the operator who has to
 * act is the one who mints Cloudflare tokens by hand — a week is not enough
 * notice for a task that needs a dashboard, a scope decision and a rotation.
 */
export const EXPIRY_WARNING_DAYS = 30

/** Exit codes. The hook reads these; nothing else does. */
export const EXIT = { capable: 0, insufficient: 2, invalid: 3, unreachable: 4 }

/**
 * One answer, in the shape the report prints.
 *
 * `can` AND `cannot` ARE BOTH LISTS AND BOTH ARE FILLED. A report that only
 * named what worked would be the presence check again with more words; the
 * column that changes an operator's mind is the one that says what this
 * deployment will refuse to do.
 *
 * `expiry` IS NEVER EMPTY. Resend keys do not expire and neither Anthropic nor
 * OpenAI exposes an expiry over the API, so *"up to date"* is answerable for
 * Cloudflare and unanswerable for the rest. A blank column would read as
 * *checked and fine*, which is the one thing it must not say.
 *
 * @typedef {object} CapabilityRecord
 * @property {string} credential
 * @property {'capable'|'insufficient'|'invalid'|'unreachable'|'stored'|'absent'|'unreadable'|'local'} verdict
 * @property {string[]} can
 * @property {string[]} cannot
 * @property {string} expiry
 * @property {string} effect what is consequently off in the shipped product
 * @property {boolean} [expiring] inside {@link EXPIRY_WARNING_DAYS}
 */

const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4'

/** A refusal's body, trimmed to something worth printing. */
const DETAIL_LIMIT = 200

/**
 * One request, with a timeout, and never a thrown network error.
 *
 * A PROVIDER THAT DOES NOT ANSWER IS NOT A CREDENTIAL THAT DOES NOT WORK, so a
 * transport failure comes back as `{ reached: false }` and every probe below
 * turns that into `unreachable` rather than into a verdict about the key. The
 * deploy must not stop because somebody's laptop lost its wifi.
 */
async function ask(fetchImpl, url, options = {}) {
  let response
  try {
    response = await fetchImpl(url, {
      ...options,
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    })
  } catch (err) {
    return { reached: false, why: err instanceof Error ? err.message : String(err) }
  }
  const body = await response.json().catch(() => null)
  return { reached: true, status: response.status, ok: response.ok, body }
}

/** Whatever the provider said about a refusal, trimmed — for the operator only. */
function said(body) {
  const message =
    body?.message ??
    body?.error?.message ??
    (Array.isArray(body?.errors) ? body.errors[0]?.message : undefined) ??
    ''
  return String(message).slice(0, DETAIL_LIMIT).trim()
}

/** `unreachable`, said the same way by every probe. */
function unreachable(answer, effect) {
  return {
    verdict: 'unreachable',
    can: [],
    cannot: [`nothing was proven — the provider did not answer (${answer.why})`],
    expiry: 'not read — the provider did not answer',
    effect,
  }
}

/** Days from now to an ISO instant, or null when there is no instant. */
function daysUntil(iso, now) {
  if (!iso) return null
  const at = Date.parse(iso)
  if (Number.isNaN(at)) return null
  return Math.floor((at - now) / 86400000)
}

/**
 * The probes, one per credential, keyed by the environment variable that holds
 * it.
 *
 * `needs` IS A LIST BECAUSE ONE OF THEM IS A PAIR. The Workers AI transport is
 * both-or-neither — a token with no account id selects REST and 401s on every
 * embed — so the probe has to be able to say *half of this is missing* rather
 * than answer about a URL it cannot compose.
 */
export const PROBES = {
  RESEND_API_KEY: {
    needs: ['RESEND_API_KEY'],
    /** Resend keys are minted for a lifetime and the API exposes no expiry. */
    expiry: 'Resend does not expose key expiry',
    effect:
      "the Settings pane's `Your domain` section cannot configure sending: the toggle is " +
      'not offered and mail continues to come from 1st Contact',
    whenAbsent:
      'the Worker runs the local mail adapter — messages are recorded and none are ' +
      'delivered — and sending cannot be configured for a customer domain',
    /**
     * `GET /domains` — THE CALL THAT FAILED IN THE FIELD, which is what makes it
     * the right probe. It is also the first call `createDomain` makes on the
     * attach path, so a key that passes here passes the operation a customer
     * actually presses.
     */
    async probe(fetchImpl, env, now) {
      const answer = await ask(fetchImpl, 'https://api.resend.com/domains', {
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}` },
      })
      if (!answer.reached) return unreachable(answer, this.effect)
      if (answer.ok) {
        return {
          verdict: 'capable',
          can: ['send mail', 'register and read sending domains (full access)'],
          cannot: [],
          expiry: this.expiry,
          effect: 'nothing — sending can be configured',
        }
      }
      if (answer.status === 401 || answer.status === 403) {
        // SENDING-ONLY IS NOT INVALID, and the two must not arrive as one. A
        // restricted key still sends every invite this product sends; an
        // unrecognised one sends nothing, and the hook refuses the deploy for
        // the second and warns for the first.
        const restricted = /restrict|only send|sending/i.test(said(answer.body))
        if (restricted) {
          return {
            verdict: 'insufficient',
            can: ['send mail'],
            cannot: [
              'manage sending domains — this key is a Resend *Sending access* key, ' +
                'and the domain API needs *Full access*',
            ],
            expiry: this.expiry,
            effect: this.effect,
          }
        }
        return {
          verdict: 'invalid',
          can: [],
          cannot: ['anything — Resend does not recognise this key'],
          expiry: this.expiry,
          effect: 'no mail is sent and no domain can be configured for sending',
        }
      }
      return unreachable({ why: `Resend answered ${answer.status}` }, this.effect)
    },
  },

  CLOUDFLARE_DNS_TOKEN: {
    needs: ['CLOUDFLARE_DNS_TOKEN'],
    expiry: 'read from the token itself',
    effect:
      "the Settings pane's `Your domain` section cannot draw its selector, attach a " +
      'domain or release one',
    whenAbsent:
      "the Settings pane's `Your domain` section cannot draw its selector, attach a " +
      'domain or release one',
    /**
     * TWO READS, AND BOTH ARE LOAD-BEARING. `/user/tokens/verify` is the only
     * endpoint that answers *is this token active, and when does it stop being
     * active* — the *"up to date"* half of the ticket — and it answers 200 for
     * a token scoped to something else entirely. `/zones` is the call
     * `cloudflare.ts` makes to fill the selector, so it is what proves the scope.
     *
     * `Zone:DNS:Edit` IS INFERRED AND SAID TO BE. Proving it would mean writing
     * a record, which this file must never do; a token that can list zones and
     * was minted to the documented scope can edit them, and a report that
     * claimed to have verified it would be lying about a request it never made.
     */
    async probe(fetchImpl, env, now) {
      const headers = { authorization: `Bearer ${env.CLOUDFLARE_DNS_TOKEN}` }
      const verify = await ask(fetchImpl, `${CLOUDFLARE_API}/user/tokens/verify`, { headers })
      if (!verify.reached) return unreachable(verify, this.effect)
      if (verify.status === 401 || verify.status === 403 || verify.body?.success === false) {
        return {
          verdict: 'invalid',
          can: [],
          cannot: ['anything — Cloudflare does not recognise this token'],
          expiry: 'not read — the token was refused',
          effect: this.effect,
        }
      }
      const status = String(verify.body?.result?.status ?? '')
      const expiresOn = verify.body?.result?.expires_on ?? null
      const notBefore = verify.body?.result?.not_before ?? null

      const startsIn = daysUntil(notBefore, now)
      if (status !== 'active' || (startsIn !== null && startsIn > 0)) {
        return {
          verdict: 'invalid',
          can: [],
          cannot: [
            status === 'expired'
              ? 'anything — this token has expired'
              : startsIn !== null && startsIn > 0
                ? `anything yet — this token is not valid until ${notBefore}`
                : `anything — Cloudflare reports this token as \`${status || 'unknown'}\``,
          ],
          expiry: expiresOn ? `expired on ${expiresOn}` : `Cloudflare reports \`${status}\``,
          effect: this.effect,
        }
      }

      const left = daysUntil(expiresOn, now)
      const expiry =
        expiresOn === null
          ? 'no expiry set on this token'
          : left === null
            ? `expires on ${expiresOn}`
            : `expires on ${expiresOn} — ${left} day${left === 1 ? '' : 's'} away`
      const expiring = left !== null && left <= EXPIRY_WARNING_DAYS

      const zones = await ask(fetchImpl, `${CLOUDFLARE_API}/zones?per_page=1`, { headers })
      if (!zones.reached) return unreachable(zones, this.effect)
      if (!zones.ok || zones.body?.success === false) {
        return {
          verdict: 'insufficient',
          can: ['authenticate against Cloudflare'],
          cannot: [
            'read the account\'s zones — this token is not scoped to them, so the ' +
              'selector would draw an empty pool',
          ],
          expiry,
          expiring,
          effect: this.effect,
        }
      }
      return {
        verdict: 'capable',
        can: [
          `read the account's zones (${(zones.body?.result ?? []).length > 0 ? 'at least one is visible' : 'the account has none yet'})`,
          'write DNS records and Worker routes — INFERRED from the read, not verified, ' +
            'because proving it would mean writing one',
        ],
        cannot: [],
        expiry,
        expiring,
        effect: expiring
          ? 'nothing yet — but this deploy will start failing when the token expires'
          : 'nothing — the domain section can do its whole job',
      }
    },
  },

  ANTHROPIC_API_KEY: {
    needs: ['ANTHROPIC_API_KEY'],
    expiry: 'Anthropic does not expose key expiry',
    effect: 'the assistant cannot take a turn — the builder is a shell',
    whenAbsent: 'the assistant cannot take a turn — the builder is a shell',
    /**
     * `GET /v1/models` AND NOT A MESSAGE. The key's authentication and its
     * organisation are exactly what a turn needs and exactly what this proves;
     * taking a turn to find out would bill the account on every deploy, and the
     * only extra thing it would establish — that there is credit left — is not
     * a permission and goes stale before the deploy finishes.
     */
    async probe(fetchImpl, env) {
      const answer = await ask(fetchImpl, 'https://api.anthropic.com/v1/models?limit=1', {
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
      })
      if (!answer.reached) return unreachable(answer, this.effect)
      if (answer.ok) {
        return {
          verdict: 'capable',
          can: ['authenticate against Anthropic and list models'],
          cannot: [
            'no statement is made about remaining credit — the API does not expose it ' +
              'and a probe that spent some would be a mutation',
          ],
          expiry: this.expiry,
          effect: 'nothing — the assistant can take a turn',
        }
      }
      if (answer.status === 401 || answer.status === 403) {
        return {
          verdict: 'invalid',
          can: [],
          cannot: [`anything — Anthropic refused this key (${answer.status})`],
          expiry: this.expiry,
          effect: this.effect,
        }
      }
      return unreachable({ why: `Anthropic answered ${answer.status}` }, this.effect)
    },
  },

  OPENAI_API_KEY: {
    needs: ['OPENAI_API_KEY'],
    expiry: 'OpenAI does not expose key expiry',
    effect: "the assistant's `create_image` tool is offered and every call to it fails",
    // ABSENT IS NOT BROKEN HERE, and this hook is the only one where the two
    // genuinely differ: with no key the plugin drops out of the tool surface and
    // out of the manual, which is an ordinary deployment. With a dead one the
    // tool is offered and every call fails.
    whenAbsent:
      'the assistant has no image tool — the plugin drops out of the tool surface ' +
      'cleanly, which is an ordinary deployment',
    /** `GET /v1/models` for `ANTHROPIC_API_KEY`'s reason, and not an image. */
    async probe(fetchImpl, env) {
      const answer = await ask(fetchImpl, 'https://api.openai.com/v1/models', {
        headers: { authorization: `Bearer ${env.OPENAI_API_KEY}` },
      })
      if (!answer.reached) return unreachable(answer, this.effect)
      if (answer.ok) {
        return {
          verdict: 'capable',
          can: ['authenticate against OpenAI and list models'],
          cannot: [
            'no statement is made about remaining credit — the API does not expose it',
          ],
          expiry: this.expiry,
          effect: 'nothing — the assistant has its image tool',
        }
      }
      if (answer.status === 401 || answer.status === 403) {
        return {
          verdict: 'invalid',
          can: [],
          cannot: [`anything — OpenAI refused this key (${answer.status})`],
          expiry: this.expiry,
          effect: this.effect,
        }
      }
      return unreachable({ why: `OpenAI answered ${answer.status}` }, this.effect)
    },
  },

  CLOUDFLARE_API_TOKEN: {
    needs: ['CLOUDFLARE_API_TOKEN'],
    expiry: 'read from the token itself',
    effect:
      'the knowledge index cannot be built — `1c kb build` and any REST-transport ' +
      'embedding fail',
    whenAbsent:
      "nothing in the deployed Worker — production embeds through its own `AI` binding. " +
      'This pair is the operator\'s build credential for `1c kb build`',
    /**
     * THE ONE NON-`GET`, AND IT STILL CHANGES NOTHING. Workers AI has no read
     * endpoint that proves the model is reachable, so the probe runs the model —
     * an inference, which creates no record, sends no message and registers no
     * domain. The vector's WIDTH is checked as well as the status because
     * `embedder.ts` and `kb.ts` both size their index at 384: a model that
     * answered 200 with some other width would produce an index whose vectors
     * are not comparable with the Worker's, and the failure would not be an
     * error — it would be plausible-looking nonsense.
     *
     * IT IS NOT A DEPLOYED SECRET AND HAS NO HOOK. Production selects the `AI`
     * binding ([[BUG-73]]); this pair is the operator's own build credential, so
     * it is probed when the environment carries it and reported as *not
     * configured* when it does not.
     */
    async probe(fetchImpl, env) {
      const accountId = (env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
      if (accountId === '') {
        return {
          verdict: 'insufficient',
          can: [],
          cannot: [
            'compose the Workers AI URL — `CLOUDFLARE_ACCOUNT_ID` is missing, and the ' +
              'pair is both-or-neither',
          ],
          expiry: 'not read — the pair is incomplete',
          effect: this.effect,
        }
      }
      const answer = await ask(
        fetchImpl,
        `${CLOUDFLARE_API}/accounts/${encodeURIComponent(accountId)}/ai/run/@cf/baai/bge-small-en-v1.5`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ text: ['probe'] }),
        },
      )
      if (!answer.reached) return unreachable(answer, this.effect)
      if (answer.status === 401 || answer.status === 403 || answer.body?.success === false) {
        return {
          verdict: 'insufficient',
          can: [],
          cannot: [
            'run Workers AI — this token is not scoped to it, so every embedding 401s',
          ],
          expiry: 'not read — the token was refused',
          effect: this.effect,
        }
      }
      const width = answer.body?.result?.data?.[0]?.length ?? 0
      if (width !== 384) {
        return {
          verdict: 'insufficient',
          can: ['reach Workers AI'],
          cannot: [
            `produce comparable vectors — the model answered with ${width} dimensions, ` +
              'and the index and the Worker are both built at 384',
          ],
          expiry: 'not read — the model answered unexpectedly',
          effect: this.effect,
        }
      }
      return {
        verdict: 'capable',
        can: ['run Workers AI and embed at 384 dimensions'],
        cannot: [],
        expiry: 'no expiry read — this token is not read back from a deploy',
        effect: 'nothing — the knowledge index can be built',
      }
    },
  },
}

/** What a hook reports when it did not probe, and why that is not a pass. */
const UNPROBED = {
  stored: {
    can: [],
    cannot: [
      'nothing was proven — the value is on the Worker and a stored secret cannot be ' +
        'read back, so supply it in your environment to have it probed',
    ],
    expiry: 'not read — the value was not available to probe',
  },
  absent: {
    can: [],
    cannot: ['anything — there is no value anywhere'],
    expiry: 'not read — there is no value',
  },
  unreadable: {
    can: [],
    cannot: ["nothing was proven — the Worker's secrets could not be read to check"],
    expiry: 'not read — the store could not be read',
  },
  // [[REQ-318]] — the local dev target, which has no `wrangler secret` store at
  // all. Its secrets are the `--env-file` layering `wrangler dev` reads, and the
  // deploy has no way to read a value it was not handed, so this says so instead
  // of claiming either a pass or an absence.
  local: {
    can: [],
    cannot: [
      'nothing was proven — the local environment reads this from .dev.vars or ' +
        '$ONECONTACT_SECRETS, and it was not in this deploy\u2019s environment to probe',
    ],
    expiry: 'not read — the value was not available to probe',
  },
}

/**
 * Run one probe and answer as a {@link CapabilityRecord}.
 *
 * `env` IS AN ARGUMENT AND SO IS `fetchImpl`, which is what lets the UATs prove
 * every branch without a network and without a suite ever holding a real key.
 */
export async function runProbe(credential, env = process.env, fetchImpl = fetch, now = Date.now()) {
  const probe = PROBES[credential]
  if (probe === undefined) throw new Error(`no probe for '${credential}'`)
  const missing = probe.needs.filter((name) => (env[name] ?? '').trim() === '')
  if (missing.length > 0) return record(credential, 'absent', probe)
  const answer = await probe.probe(fetchImpl, env, now)
  return { credential, ...answer }
}

/** A record for an outcome nobody probed. */
export function record(credential, verdict, probe = PROBES[credential]) {
  const shape = UNPROBED[verdict]
  if (shape === undefined) throw new Error(`'${verdict}' is not an unprobed verdict`)
  return {
    credential,
    verdict,
    can: shape.can,
    cannot: shape.cannot,
    expiry: shape.expiry,
    // AN UNPROBED CREDENTIAL HAS AN UNKNOWN EFFECT AND SAYS SO. It may be
    // perfectly scoped; nobody asked it. Naming a consequence here would be the
    // presence check claiming a capability again, which is the defect.
    effect:
      verdict === 'absent'
        ? (probe?.whenAbsent ?? probe?.effect ?? '')
        : 'unknown — nothing was probed, so nothing is claimed either way',
  }
}

/**
 * The capability report.
 *
 * ONE BLOCK PER CREDENTIAL AND NOT A TABLE, because the sentences are the
 * content: *"cannot manage sending domains — this key is a Sending access key"*
 * does not fit a column and is the whole reason an operator reads this.
 */
export function formatReport(records) {
  if (records.length === 0) {
    return '  (nothing was probed — no hook with a credential ran for this app)'
  }
  const mark = {
    capable: 'ok',
    insufficient: 'DEGRADED',
    invalid: 'BROKEN',
    unreachable: 'unproven',
    stored: 'unverified',
    absent: 'absent',
    unreadable: 'unverified',
    local: 'unverified',
  }
  const lines = []
  for (const row of records) {
    lines.push(`  ${row.credential} — ${mark[row.verdict] ?? row.verdict}`)
    for (const can of row.can) lines.push(`      can      ${can}`)
    for (const cannot of row.cannot) lines.push(`      cannot   ${cannot}`)
    lines.push(`      expiry   ${row.expiry}${row.expiring ? '  ← inside the warning window' : ''}`)
    if (row.effect) lines.push(`      effect   ${row.effect}`)
  }
  return lines.join('\n')
}

/** One line of the report file, parsed. Unreadable lines are dropped, not thrown. */
export function readRecords(text) {
  const records = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '') continue
    try {
      records.push(JSON.parse(trimmed))
    } catch {
      // A corrupt line is a lost row, not a failed deploy.
    }
  }
  return records
}

/** Append one record to the report, when there is a report to append to. */
function append(row, env) {
  const file = env.DEPLOY_CAPABILITY_REPORT
  if (!file) return
  appendFileSync(file, `${JSON.stringify(row)}\n`)
}

/** One line for the hook to print while the deploy is still running. */
export function oneLine(row) {
  const head = `    ${row.credential}: `
  if (row.verdict === 'capable') return `${head}probed — ${row.can[0] ?? 'works'}`
  if (row.verdict === 'stored') return `${head}on the Worker — not probed, so not verified`
  return `${head}${row.cannot[0] ?? row.verdict}`
}

/**
 * Was this run as a command, rather than imported by a suite?
 *
 * BOTH SIDES ARE RESOLVED THROUGH `realpath`, and that is not fussiness. `/tmp`
 * is a symlink to `/private/tmp` on macOS and a worktree checkout can sit under
 * one too, so comparing the string `bin/deploy` passed against the path Node
 * loaded answers *false* for a file that is plainly being run — and the symptom
 * is not an error. It is a report that prints nothing and exits 0.
 */
function invokedAsCommand() {
  if (process.argv[1] === undefined) return false
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

const invokedDirectly = invokedAsCommand()

if (invokedDirectly) {
  const [command, ...rest] = process.argv.slice(2)
  if (command === 'probe') {
    const row = await runProbe(rest[0])
    append(row, process.env)
    console.log(oneLine(row))
    process.exit(EXIT[row.verdict] ?? EXIT.unreachable)
  } else if (command === 'record') {
    const row = record(rest[0], rest[1])
    append(row, process.env)
    process.exit(0)
  } else if (command === 'report') {
    let text = ''
    try {
      text = readFileSync(process.env.DEPLOY_CAPABILITY_REPORT ?? '', 'utf8')
    } catch {
      text = ''
    }
    console.log(formatReport(readRecords(text)))
    process.exit(0)
  } else {
    console.error(`probe.mjs: unknown command '${command ?? ''}' — probe|record|report`)
    process.exit(1)
  }
}
