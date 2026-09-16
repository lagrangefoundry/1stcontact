/**
 * The console's socket (REQ-254).
 *
 * Everything this file does is bind {@link ReproConsole.handle} to `node:http`
 * and to loopback. LOOPBACK IS THE POINT: the console spawns processes and
 * serves whatever is on this machine's disk, so it must not be reachable from
 * anywhere but the machine it runs on. `listen` is given an explicit
 * `127.0.0.1` rather than the default, which binds every interface.
 */
import http from 'node:http'
import { ReproConsole, type ReproConsoleOptions } from './console'

/**
 * The default port.
 *
 * Deliberately clear of the range this project's own dev servers sit in —
 * `1c builder`/`wrangler dev` take 8788 and Vite's HMR takes 24678 — so the
 * console can be left running beside them. `--port` is there for the day
 * something else has claimed it anyway.
 */
export const DEFAULT_PORT = 8710

/** Loopback, stated once. */
export const LOOPBACK = '127.0.0.1'

export interface ConsoleHandle {
  server: http.Server
  url: string
  console: ReproConsole
  close(): Promise<void>
}

export interface StartOptions extends ReproConsoleOptions {
  /** 0 picks an ephemeral port — what the suite uses. */
  port?: number
}

export async function startReproConsole(opts: StartOptions): Promise<ConsoleHandle> {
  const consoleState = new ReproConsole(opts)

  const server = http.createServer((req, res) => {
    void respond(consoleState, req, res)
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(opts.port ?? DEFAULT_PORT, LOOPBACK, resolve)
  })

  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : (opts.port ?? DEFAULT_PORT)

  return {
    server,
    url: `http://${LOOPBACK}:${port}/`,
    console: consoleState,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve())
      }),
  }
}

async function respond(
  consoleState: ReproConsole,
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const body = req.method === 'POST' ? await readBody(req) : undefined
    const response = await consoleState.handle({
      method: req.method ?? 'GET',
      path: url.pathname,
      body,
    })
    res.writeHead(response.status, response.headers)
    res.end(response.body)
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    res.end(err instanceof Error ? err.message : String(err))
  }
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => (body += chunk.toString()))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

/**
 * `bin/repro-console`'s entry point. Kept here rather than in the launcher so
 * the argument handling is TypeScript like the rest of the console, and the
 * launcher stays a bootstrap with no behaviour of its own.
 */
export async function main(argv: string[], cwd: string): Promise<void> {
  const portFlag = argv.indexOf('--port')
  const port = portFlag === -1 ? DEFAULT_PORT : Number(argv[portFlag + 1])
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`--port expects a port number, got '${argv[portFlag + 1]}'.`)
  }
  const handle = await startReproConsole({ cwd, port })
  console.log(`reproduction console → ${handle.url}`)
}
