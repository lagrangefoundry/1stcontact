/**
 * The filing service — how a Worker reaches the project that builds it
 * ([[REQ-273]]).
 *
 * THE PROBLEM THIS EXISTS TO SOLVE, stated once. The builder assistant runs in
 * workerd, both deployed and under `wrangler dev`. The project that builds this
 * product is an xgd project on a developer's disk, reached by spawning its CLI.
 * `node:child_process` does not exist in workerd, and upstream's
 * `@lagrangefoundry/ai-ticketing` splits that reach behind its `./node` subpath
 * precisely so that a Workers build fails at the import rather than at the first
 * ticket somebody files.
 *
 * SO THE SUBPROCESS HAS TO HAPPEN IN A NODE PROCESS. That is the whole of the
 * genuine difficulty, and it is the only part of this arrangement that is forced.
 *
 * ## The address is a SETTING, not a launch artefact ([[BUG-124]])
 *
 * This listener used to hang off `1c builder`: it bound port 0, minted a fresh
 * bearer per run, and handed both to `wrangler dev` as `--var`. Both values were
 * therefore knowable only by the process that had just minted them, which made
 * being able to file a defect A PROPERTY OF HOW THE DEV SERVER WAS LAUNCHED.
 * Launch wrangler any other way — by hand, with `bin/access-sim`'s extra
 * `--env-file`, from an editor — and the Worker saw no address, composed no
 * surface, and the assistant silently had no filing tool at all. That is how the
 * defect this comment replaces actually bit: the operator had to choose between a
 * signed-in local session and a consultant that could file.
 *
 * The old code justified the per-run values by saying a committed value would be
 * a stale one. It is circular — a value is only stale because it was randomised
 * in the first place. So:
 *
 *   - the port has a FIXED DEFAULT ({@link DEFAULT_FILING_PORT}), overridable;
 *   - the bearer is a per-clone value in `.dev.vars`, minted ONCE and kept;
 *   - the Worker reads both from the env files it already reads, so every launch
 *     path sees the same address and `--var` is gone.
 *
 * A fixed loopback address is never stale, and the security argument survives
 * intact — see "Why loopback and a bearer" below.
 *
 * ## What it is, and what it deliberately is not
 *
 * It is a TRANSPORT over upstream's `XgdProject` and nothing else. Every piece
 * of judgement — the two-call create-then-read-back, the translation of xgd's
 * error codes into the surface's declared ones, `WrittenButUnreadable` for the
 * write that landed and could not be read — stays in the one place upstream
 * wrote it. This file forwards three method calls and serialises what comes
 * back.
 *
 * It is NOT a ticket API. Three operations, no query, no list, no delete, and no
 * way to name a project: the root is fixed when the service starts. A second
 * consumer wanting more is a reason to build a real ticket server, which is the
 * shape upstream already anticipates — "the same three methods can be served
 * over HTTP by a ticket server" — and on that day the Worker keeps its HTTP
 * client and this file goes away.
 *
 * ## Why loopback and a bearer
 *
 * Loopback keeps other machines out. It does NOT keep out a page in the
 * operator's own browser, which can POST JSON cross-origin without ever reading
 * the answer — and what that page could do is file tickets into this
 * repository's ticket store. The token costs one header and closes it.
 *
 * A FIXED TOKEN CLOSES THAT HOLE EXACTLY AS WELL AS A RANDOM ONE, provided it is
 * not a well-known one. That is why it is minted per clone into `.dev.vars` — a
 * gitignored, per-clone file — and never committed to `wrangler.toml`. A page in
 * the operator's browser cannot read that file, so it cannot guess the header,
 * which is the entire protection the per-run uuid was buying.
 *
 * A DECLARED FAILURE ANSWERS 200. Non-200 is reserved for "this listener could
 * not serve you", because the Worker's client maps that to the declared
 * `project_unreachable` — whose contract says NOTHING WAS FILED and a single
 * retry is reasonable. A refusal wearing that code would invite the model to
 * file the same ticket twice.
 */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'

import { sharedModuleUrl } from './webui'

/** The untyped shared-store handle; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** The three methods the `development` surface calls, and no others. */
export interface FilingProject {
  create(spec: { type: string; title: string; body?: string; status?: string | null }): Promise<Untyped>
  append(spec: { uid: string; body: string }): Promise<Untyped>
  get(spec: { uid: string }): Promise<Untyped>
}

/** The operations this listener will dispatch — an allow list, not a lookup. */
export const FILING_OPS = ['create', 'append', 'get'] as const
export type FilingOp = (typeof FILING_OPS)[number]

/**
 * The two names the Worker reads, and the only contract between a Node process
 * and a workerd one.
 *
 * NAMED CONSTANTS RATHER THAN LITERALS AT EACH SITE, for the reason the
 * `--var` composer they replace gave: the failure mode of two copies drifting is
 * silent — no var, no surface, no error anywhere. They now travel through a file
 * rather than through an argv, which changes where they are written and not how
 * much a typo costs.
 */
export const FILING_URL_VAR = 'DEVELOPMENT_TICKETS_URL'
export const FILING_TOKEN_VAR = 'DEVELOPMENT_TICKETS_TOKEN'

/**
 * The fixed default port ([[BUG-124]]).
 *
 * ONE CLEAR STEP FROM THE THING IT SERVES. `1c builder`/`wrangler dev` take
 * 8788, public-site takes 8787 and `bin/access-sim` takes 8799, so 8790 sits in
 * the control-app's own band — which is where an operator will look for it —
 * without colliding with any of them. (It is deliberately NOT beside
 * `tools/repro-console`'s 8710: 8711 and 8712 are routinely taken on a working
 * machine, which is the kind of collision a FIXED port has to avoid by choosing
 * well rather than by re-randomising.)
 *
 * `--port` and `DEVELOPMENT_TICKETS_URL` are there for the checkout that wants a
 * different one; two checkouts wanting to run at once is what the override is
 * for, and is the whole cost of a fixed port.
 */
export const DEFAULT_FILING_PORT = 8790

/** Loopback, stated once: this never binds anything else. */
export const LOOPBACK = '127.0.0.1'

/** A running service, and the two values the Worker needs to reach it. */
export interface FilingService {
  url: string
  token: string
  port: number
  close(): Promise<void>
}

/** Largest request body accepted — a ticket body, with room, and not a stream. */
export const MAX_BODY_BYTES = 256 * 1024

/**
 * What answers a GET, and why a POST-only listener answers one at all.
 *
 * A CREDENTIAL-FREE FINGERPRINT ([[BUG-124]] item 3). Something has to be able to
 * ask "is a filing service listening here?" so that an absent one is legible
 * rather than inferred from which command was typed — and the asker is sometimes
 * a `1c` that has no token, because the token lives in a file it may not have
 * read. A 405 is what this listener owed a GET anyway; naming itself in the body
 * costs one key and makes the answer mean something. It reveals nothing a caller
 * did not already have: reaching this listener at all means knowing its address,
 * and a refusal is all any unauthenticated caller gets either way.
 */
export const FILING_SERVICE_MARKER = 'filing'

/**
 * Upstream's reach to a local xgd project, loaded through the single resolution
 * point.
 *
 * A DYNAMIC IMPORT BY FILE URL, like every other shared-store load in this CLI
 * (`ai/host.ts`, `kb.ts`): a bare specifier resolves by walking up from the
 * importing file, which finds the store from the main checkout and finds nothing
 * from a linked `git worktree`.
 *
 * THE `./node` SUBPATH, which is the one rung that spawns a subprocess. Naming
 * it here — in a module only the CLI imports — is what keeps it out of the
 * Worker's import graph, where it would be a build error by upstream's design.
 */
export async function xgdProjectFor(root: string): Promise<FilingProject> {
  const nodeRung = (await import(sharedModuleUrl('ai-ticketing', './node'))) as Untyped
  return new nodeRung.XgdProject({ root }) as FilingProject
}

/** What came back from a call: the result, or a declared failure. */
type Answer =
  | { ok: true; result: unknown }
  | { ok: false; error: { code: string; message: string; detail: string } }

/**
 * Dispatch one call onto the project.
 *
 * SEPARATE FROM THE LISTENER so a UAT can drive the whole translation — the op
 * allow list, the argument shapes, the failure projection — without a socket.
 * That is the same seam upstream gives `XgdProject` for the same reason.
 *
 * THE FAILURE PROJECTION READS `code` AND `detail` off whatever was thrown and
 * invents neither. Upstream's four exception classes each carry a code the
 * declaration also declares; an error carrying none is a fault in this listener
 * rather than in the project, and `project_unreachable` is what says so.
 */
export async function dispatchFiling(
  project: FilingProject,
  call: { op?: unknown; [key: string]: unknown },
): Promise<Answer> {
  const op = String(call.op ?? '')
  if (!(FILING_OPS as readonly string[]).includes(op)) {
    return {
      ok: false,
      error: {
        code: 'project_unreachable',
        message: `the filing service has no operation '${op}'`,
        detail: '',
      },
    }
  }
  try {
    const result = await (op === 'create'
      ? project.create({
          type: String(call.type ?? ''),
          title: String(call.title ?? ''),
          body: typeof call.body === 'string' ? call.body : '',
          status: typeof call.status === 'string' ? call.status : null,
        })
      : op === 'append'
        ? project.append({ uid: String(call.uid ?? ''), body: String(call.body ?? '') })
        : project.get({ uid: String(call.uid ?? '') }))
    return { ok: true, result }
  } catch (error) {
    const thrown = error as { code?: unknown; detail?: unknown; message?: unknown }
    return {
      ok: false,
      error: {
        code: typeof thrown.code === 'string' ? thrown.code : 'project_unreachable',
        message: String(thrown.message ?? error),
        detail: typeof thrown.detail === 'string' ? thrown.detail : '',
      },
    }
  }
}

/** Read a bounded request body, or `null` where it ran over the cap. */
function readBody(request: IncomingMessage): Promise<string | null> {
  return new Promise((resolve, reject) => {
    let text = ''
    let bytes = 0
    request.on('data', (chunk: Buffer) => {
      bytes += chunk.length
      if (bytes > MAX_BODY_BYTES) {
        resolve(null)
        request.destroy()
        return
      }
      text += chunk.toString('utf8')
    })
    request.on('end', () => resolve(text))
    request.on('error', reject)
  })
}

function answer(response: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(Buffer.byteLength(body)),
  })
  response.end(body)
}

/**
 * Start the listener.
 *
 * ON 127.0.0.1 EXPLICITLY, never on every interface: a service that files
 * tickets into somebody's source repository has no business being reachable from
 * the network the laptop is on.
 *
 * THE PORT DEFAULTS TO {@link DEFAULT_FILING_PORT} AND NOT TO 0 ([[BUG-124]]). A
 * port nobody can predict has to be told to the Worker at launch, and that is the
 * coupling this ticket removes; a fixed one can simply be written down. Two
 * checkouts that both want to run get `--port`.
 *
 * @param options.root the project directory — the one holding `.xgd/`
 * @param options.port a fixed port; {@link DEFAULT_FILING_PORT} when absent
 * @param options.token the bearer; a fresh uuid when absent
 * @param options.project an injected project handle, for tests
 * @param options.unref whether the listener may keep the process alive — `true`
 *   (the default) for a service riding along with a dev server, `false` for
 *   `1c filing`, whose whole job is to stay up
 */
export async function startFilingService(options: {
  root: string
  port?: number
  token?: string
  project?: FilingProject
  unref?: boolean
}): Promise<FilingService> {
  const project = options.project ?? (await xgdProjectFor(options.root))
  const token = options.token ?? randomUUID()

  const server: Server = createServer((request, response) => {
    void (async () => {
      if (request.method !== 'POST') {
        // NAMED, so a probe can tell this listener from whatever else might be
        // holding the port. See {@link FILING_SERVICE_MARKER}.
        answer(response, 405, { ok: false, service: FILING_SERVICE_MARKER, error: 'POST only' })
        return
      }
      const offered = String(request.headers.authorization ?? '')
      if (offered !== `Bearer ${token}`) {
        answer(response, 401, { ok: false, service: FILING_SERVICE_MARKER, error: 'bad token' })
        return
      }
      const body = await readBody(request)
      if (body === null) {
        answer(response, 413, { ok: false, error: 'body too large' })
        return
      }
      let call: Record<string, unknown>
      try {
        call = JSON.parse(body || '{}') as Record<string, unknown>
      } catch {
        answer(response, 400, { ok: false, error: 'not JSON' })
        return
      }
      answer(response, 200, await dispatchFiling(project, call))
    })().catch(() => {
      // A THROW HERE IS THIS LISTENER'S FAULT, NOT THE PROJECT'S, and 500 is
      // what says so: the Worker's client maps a non-200 to
      // `project_unreachable`, whose declared meaning is "a fault in how this
      // product is set up" — which is exactly right for a bug in this file.
      try {
        answer(response, 500, { ok: false, error: 'filing service failed' })
      } catch {
        // The response was already sent or the socket is gone; nothing to do.
      }
    })
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(options.port ?? DEFAULT_FILING_PORT, LOOPBACK, () => resolve())
  })
  const address = server.address()
  const port =
    typeof address === 'object' && address !== null ? address.port : (options.port ?? DEFAULT_FILING_PORT)

  // UNREF'D BY DEFAULT, so a listener riding along with a dev server never keeps
  // `1c` alive on its own: the dev server is what that process is waiting on, and
  // this must not outlast it by so much as a keystroke. `1c filing` passes
  // `false`, because there the listener IS the thing being waited on.
  if (options.unref !== false) server.unref()

  return {
    url: `http://${LOOPBACK}:${port}/`,
    token,
    port,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections?.()
        server.close(() => resolve())
      }),
  }
}

/** Where the filing service is configured to be, however that was decided. */
export interface FilingAddress {
  url: string
  token: string
  /** The port {@link url} names, or {@link DEFAULT_FILING_PORT} where it names none. */
  port: number
}

/**
 * Resolve the address from configuration and overrides.
 *
 * THE VARS WIN OVER THE DEFAULT AND THE FLAGS WIN OVER THE VARS, which is the
 * ordinary precedence and is worth stating only because the thing being resolved
 * used to have no configured value to begin with.
 */
export function filingAddress(
  vars: Record<string, string>,
  overrides?: { port?: number; token?: string },
): FilingAddress {
  const configured = (vars[FILING_URL_VAR] ?? '').trim()
  return {
    url: overrides?.port !== undefined || !configured ? `http://${LOOPBACK}:${portOf(configured, overrides?.port)}/` : configured,
    token: overrides?.token ?? (vars[FILING_TOKEN_VAR] ?? '').trim(),
    port: portOf(configured, overrides?.port),
  }
}

/**
 * The port a configured address names, defaulted.
 *
 * A MALFORMED VALUE FALLS BACK RATHER THAN THROWING. `DEVELOPMENT_TICKETS_URL`
 * is hand-editable configuration, and a typo in it must not stop a dev server
 * from starting — {@link filingStatus} will report the address as unreachable,
 * which is both true and the thing that says what to fix.
 */
function portOf(configured: string, override?: number): number {
  if (override !== undefined) return override
  if (!configured) return DEFAULT_FILING_PORT
  try {
    return Number.parseInt(new URL(configured).port, 10) || DEFAULT_FILING_PORT
  } catch {
    return DEFAULT_FILING_PORT
  }
}

/**
 * Put the address in the file the Worker reads, once ([[BUG-124]]).
 *
 * WHY THE CLI WRITES IT RATHER THAN THE README ASKING FOR IT. `.dev.vars` is
 * gitignored and per-clone, which is exactly what keeps the bearer unguessable —
 * and it also means no clone has these two lines until something puts them there.
 * A setup step nobody performs is the same silence this ticket is about, one
 * remove. So the first `1c filing` or `1c builder` in a clone mints the token and
 * writes both lines, says that it did, and every launch after that — including a
 * bare `wrangler dev`, which reads `.dev.vars` by itself — sees them.
 *
 * APPEND-ONLY AND NEVER A REWRITE. The file is the operator's, it carries hand-
 * written local-dev configuration, and a tool that reformatted it to add two
 * lines would be trading their file for its own idea of one.
 *
 * AND NEVER A CREATE. A `.dev.vars` that did not exist is already a broken local
 * dev — `devEnvLayering` says so, and Access will refuse every request — so
 * conjuring one holding only filing config would answer a question nobody asked
 * while leaving the one they did ask unanswered. {@link FilingProvision.note}
 * carries the two lines instead, for an operator to paste beside the rest.
 */
export interface FilingProvision {
  address: FilingAddress
  /** Whether these two lines were just written into `.dev.vars`. */
  wrote: boolean
  /** What to tell the operator, or `''` where there is nothing to say. */
  note: string
}

export function provisionFilingVars(opts: {
  devVarsPath: string
  vars: Record<string, string>
  overrides?: { port?: number; token?: string }
  mintToken?: () => string
  exists?: (p: string) => boolean
  append?: (p: string, text: string) => void
}): FilingProvision {
  const exists = opts.exists ?? ((p: string) => fs.existsSync(p))
  const append = opts.append ?? ((p: string, text: string) => fs.appendFileSync(p, text, 'utf8'))

  const configured = (opts.vars[FILING_URL_VAR] ?? '').trim()
  if (configured) return { address: filingAddress(opts.vars, opts.overrides), wrote: false, note: '' }

  const token = opts.overrides?.token ?? (opts.mintToken ?? randomUUID)()
  const port = opts.overrides?.port ?? DEFAULT_FILING_PORT
  const url = `http://${LOOPBACK}:${port}/`
  const lines =
    `\n# Where the assistant files a defect in THIS software ([[REQ-273]], [[BUG-124]]).\n` +
    `# Written once by \`1c filing\`. A fixed loopback address, so every launch path —\n` +
    `# \`1c builder\`, a bare \`wrangler dev\`, \`bin/access-sim\`'s recipe — sees the same\n` +
    `# one. The bearer is per-clone and lives here rather than in wrangler.toml so that\n` +
    `# a page in your own browser cannot read it. Start the listener with \`1c filing\`.\n` +
    `${FILING_URL_VAR} = "${url}"\n${FILING_TOKEN_VAR} = "${token}"\n`

  if (!exists(opts.devVarsPath)) {
    return {
      address: { url, token, port },
      wrote: false,
      note:
        `  no ${opts.devVarsPath} — the assistant will be offered no filing tool.\n` +
        `  Create it (see apps/control-app/.dev.vars in any working clone) and add:\n` +
        `    ${FILING_URL_VAR} = "${url}"\n    ${FILING_TOKEN_VAR} = "${token}"`,
    }
  }

  append(opts.devVarsPath, lines)
  return {
    address: { url, token, port },
    wrote: true,
    note: `  wrote ${FILING_URL_VAR} and ${FILING_TOKEN_VAR} to ${opts.devVarsPath}`,
  }
}

/** What an operator is told about filing, and the only place that is decided. */
export type FilingStatusKind = 'answering' | 'unreachable' | 'unconfigured'

export interface FilingStatus {
  kind: FilingStatusKind
  /** The address that was asked, or `''` where none is configured. */
  url: string
  /** One line, ready to print. */
  line: string
}

/**
 * Ask the configured address whether a filing service is there.
 *
 * A GET, WITH NO TOKEN. The prober is sometimes a `1c` that has not read the
 * file holding the bearer, and "is anything listening" is not a question a
 * credential should be needed to ask. {@link FILING_SERVICE_MARKER} is what makes
 * the answer mean "a filing service" rather than "something".
 *
 * A SHORT TIMEOUT. This runs on the way to starting a dev server and its answer
 * is a banner line; a loopback address that does not answer promptly is not
 * answering.
 */
export async function probeFiling(
  url: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 1500,
): Promise<boolean> {
  try {
    const response = await fetchImpl(url, { method: 'GET', signal: AbortSignal.timeout(timeoutMs) })
    const payload = (await response.json()) as { service?: unknown }
    return payload?.service === FILING_SERVICE_MARKER
  } catch {
    return false
  }
}

/**
 * The state of filing for this clone, as a thing that can be asserted on
 * ([[BUG-124]] item 3).
 *
 * WHY THIS IS A VALUE AND NOT A `console.log`. The old signal was a `filing:
 * on/off` line printed by `1c builder` — which is to say, printed by the command
 * that in the failing case was NEVER RUN. An operator who launched wrangler some
 * other way got no line at all, and could not tell a capability this product does
 * not have from a dev server they started the wrong way. Returning the state lets
 * the banner render it, a UAT assert it, and any future surface read it, without
 * three descriptions of the same fact.
 */
export async function filingStatus(
  address: FilingAddress,
  fetchImpl: typeof fetch = fetch,
): Promise<FilingStatus> {
  if (!address.url) {
    return {
      kind: 'unconfigured',
      url: '',
      line: `  filing: OFF — no ${FILING_URL_VAR} in apps/control-app/.dev.vars, so the assistant is offered no filing tool. \`1c filing\` writes one.`,
    }
  }
  if (await probeFiling(address.url, fetchImpl)) {
    return {
      kind: 'answering',
      url: address.url,
      line: `  filing: on — ${address.url} is answering; the assistant can report a defect into this project`,
    }
  }
  return {
    kind: 'unreachable',
    url: address.url,
    line: `  filing: OFF — nothing is answering at ${address.url}, so the assistant will be told the project is unreachable. Start one with \`1c filing\`.`,
  }
}
