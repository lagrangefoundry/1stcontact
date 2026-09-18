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
 * So the subprocess has to happen in a Node process, and there is already
 * exactly one Node process sitting beside the dev server for its whole life:
 * `1c builder`, which starts `wrangler dev` and waits on it. This listener runs
 * IN THAT PROCESS. It is not a daemon, it has no lifecycle of its own, and it
 * cannot outlive or be orphaned by the thing it serves.
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
 * repository's ticket store. The token costs one header, closes it, and is
 * minted fresh per run, so there is nothing durable to leak.
 *
 * A DECLARED FAILURE ANSWERS 200. Non-200 is reserved for "this listener could
 * not serve you", because the Worker's client maps that to the declared
 * `project_unreachable` — whose contract says NOTHING WAS FILED and a single
 * retry is reasonable. A refusal wearing that code would invite the model to
 * file the same ticket twice.
 */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'

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

/** A running service, and the two values the Worker needs to reach it. */
export interface FilingService {
  url: string
  token: string
  port: number
  close(): Promise<void>
}

/**
 * How `wrangler dev` is told where the service is.
 *
 * A FUNCTION RATHER THAN TWO `push` CALLS IN THE COMMAND, so the names the
 * Worker reads and the names the CLI writes are one list in one place. They are
 * the only contract between a Node process and a workerd one, and the failure
 * mode of getting them apart is silent: no var, no surface, no error anywhere.
 *
 * `--var` AND NOT `.dev.vars`, because both values are minted per run — the port
 * is whatever was free and the bearer is a fresh uuid. A file would be a stale
 * copy of both the moment the process exits, and a committed one would point
 * every clone at a listener that is not there.
 */
export function filingVars(service: Pick<FilingService, 'url' | 'token'>): string[] {
  return [
    '--var',
    `DEVELOPMENT_TICKETS_URL:${service.url}`,
    '--var',
    `DEVELOPMENT_TICKETS_TOKEN:${service.token}`,
  ]
}

/** Largest request body accepted — a ticket body, with room, and not a stream. */
export const MAX_BODY_BYTES = 256 * 1024

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
 * PORT 0 MEANS "ANY FREE ONE", and it is the default for a reason. A fixed
 * default port would collide between two checkouts and fail the dev server it is
 * attached to; the address is handed to `wrangler dev` as a var, so nothing has
 * to guess it.
 *
 * @param options.root the project directory — the one holding `.xgd/`
 * @param options.port a fixed port, or 0 for any free one
 * @param options.token a fixed bearer, or absent for a fresh one
 * @param options.project an injected project handle, for tests
 */
export async function startFilingService(options: {
  root: string
  port?: number
  token?: string
  project?: FilingProject
}): Promise<FilingService> {
  const project = options.project ?? (await xgdProjectFor(options.root))
  const token = options.token ?? randomUUID()

  const server: Server = createServer((request, response) => {
    void (async () => {
      if (request.method !== 'POST') {
        answer(response, 405, { ok: false, error: 'POST only' })
        return
      }
      const offered = String(request.headers.authorization ?? '')
      if (offered !== `Bearer ${token}`) {
        answer(response, 401, { ok: false, error: 'bad token' })
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
    server.listen(options.port ?? 0, '127.0.0.1', () => resolve())
  })
  const address = server.address()
  const port = typeof address === 'object' && address !== null ? address.port : (options.port ?? 0)

  // UNREF'D, so a listener never keeps `1c` alive on its own. The dev server is
  // what the process is waiting on; this rides along with it and must not
  // outlast it by so much as a keystroke.
  server.unref()

  return {
    url: `http://127.0.0.1:${port}/`,
    token,
    port,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections?.()
        server.close(() => resolve())
      }),
  }
}
