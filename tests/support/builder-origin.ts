import http from 'node:http'
import { run, startBuilder, type BuilderHandle } from '../../tools/generate/src/cli'

/**
 * The workspace origin the edit dialog talks to, over whichever transport this
 * machine can actually provide.
 *
 * WHY THIS EXISTS. The copy dialog reaches its origin over same-origin HTTP
 * (`/api/copy`, `/api/palette`), so every suite that drives the real dialog needs
 * a real origin behind it. `startBuilder` is that origin and is what these suites
 * use whenever a socket can be opened. Some hardened environments refuse
 * `listen()` outright — the call fails `EPERM` before a port is ever chosen — and
 * there the choice is between producing no evidence at all and producing the
 * evidence minus the socket.
 *
 * THE FALLBACK IS NOT A DOUBLE OF THE ORIGIN. `/api/copy` and `/api/palette` are
 * documented in `builder.ts` as *thin transports over the same functions `1c`
 * dispatches to* — `editCopyGet` / `editCopySet` / `editPalette*` — and this
 * routes to those same functions through the real `1c` entry point, reproducing
 * the handler's own status codes and envelope shapes (including the census the
 * palette route merges into every write). What is lost is the HTTP hop and
 * nothing else: derivation, validation, atomicity and the refusal shape are the
 * production ones either way. {@link OriginHandle.overHttp} says which transport
 * a run got, so a suite can report the narrower evidence rather than imply the
 * wider one.
 */

/** Whether this process is allowed to open a listening socket at all. */
export async function canListen(): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = http.createServer()
    probe.on('error', () => resolve(false))
    try {
      probe.listen(0, () => probe.close(() => resolve(true)))
    } catch {
      resolve(false)
    }
  })
}

/** One request the dialog issued — the wire evidence "nothing was posted" reads. */
export interface OriginCall {
  url: string
  method: string
  body: string | undefined
}

export interface InstalledFetch {
  calls: OriginCall[]
  restore: () => void
}

export interface OriginHandle {
  /** True when the dialog really spoke HTTP to `startBuilder`. */
  overHttp: boolean
  /** Where a real browser engine can reach it; absent when there is no socket. */
  url?: string
  /** A one-line description of the transport, for an honest report. */
  transport: string
  /** Replace `globalThis.fetch` with the browser's own resolution, recording every call. */
  install: () => InstalledFetch
  close: () => Promise<void>
}

/** The `1c` entry point, argv in, envelope out — the CLI half of the fallback. */
async function cliJson(
  cwd: string,
  argv: string[],
): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: Record<string, unknown> }> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const out: string[] = []
  process.chdir(cwd)
  process.exitCode = 0
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run([...argv, '--json'])
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
  }
  process.exitCode = 0
  return JSON.parse(out[out.length - 1]) as { ok: boolean; data?: Record<string, unknown> }
}

/** The shape `api.js` reads: `ok`, `status`, `json()`. */
function reply(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response
}

/** `builder.ts`'s own 400 body for a refused command: flat, carrying path and hint. */
function refusal(error: Record<string, unknown> | undefined): Response {
  return reply(400, { error: error?.message, ...(error ?? {}) })
}

/** `/api/copy` and `/api/palette`, as `handleBuilderRequest` routes them. */
async function inProcess(cwd: string, url: URL, init?: RequestInit): Promise<Response> {
  const method = init?.method ?? 'GET'
  const body =
    typeof init?.body === 'string'
      ? (JSON.parse(init.body) as Record<string, string>)
      : ({} as Record<string, string>)
  const scope = (src: { module?: string; slot?: string }): string[] => [
    ...(src.module ? ['--module', src.module] : []),
    ...(src.slot ? ['--slot', src.slot] : []),
  ]

  if (url.pathname === '/api/copy') {
    if (method === 'GET') {
      const q = url.searchParams
      const out = await cliJson(cwd, [
        'copy',
        'get',
        q.get('slug')!,
        q.get('page')!,
        q.get('path')!,
        ...scope({ module: q.get('module') ?? undefined, slot: q.get('slot') ?? undefined }),
      ])
      return out.ok ? reply(200, out.data) : refusal(out.error)
    }
    const out = await cliJson(cwd, [
      'copy',
      'set',
      body.slug,
      body.page,
      body.path,
      '--values',
      JSON.stringify((body as unknown as { values: unknown }).values),
      ...scope(body),
    ])
    return out.ok ? reply(200, out.data) : refusal(out.error)
  }

  if (url.pathname === '/api/palette') {
    const slug = method === 'GET' ? url.searchParams.get('slug')! : body.slug
    if (method === 'GET') {
      const out = await cliJson(cwd, ['palette', 'get', slug])
      return out.ok ? reply(200, out.data) : refusal(out.error)
    }
    const argv: Record<string, string[]> = {
      set: ['palette', 'set', slug, body.name, String(body.value)],
      add: ['palette', 'add', slug, body.name, String(body.value)],
      rm: ['palette', 'rm', slug, body.name],
      rename: ['palette', 'rename', slug, body.name, String(body.to)],
    }
    if (!argv[body.op]) return reply(400, { error: `unknown palette op '${body.op}'` })
    const out = await cliJson(cwd, argv[body.op])
    if (!out.ok) return refusal(out.error)
    // The census travels back with every write, exactly as the route does it, so
    // the popup redraws from what the store now holds rather than from its guess.
    const census = await cliJson(cwd, ['palette', 'get', slug])
    return reply(200, { ...out.data, ...(census.data ?? {}) })
  }

  return reply(404, { error: `no in-process route for ${url.pathname}` })
}

/**
 * Open the origin the dialog will talk to.
 *
 * Prefers the real HTTP origin; falls back to the in-process transport only when
 * this machine refuses to open a socket at all.
 */
export async function openOrigin(cwd: string): Promise<OriginHandle> {
  if (await canListen()) {
    const builder: BuilderHandle = await startBuilder({ cwd })
    return {
      overHttp: true,
      url: builder.url,
      transport: `the real builder origin at ${builder.url}`,
      install: () => {
        const real = globalThis.fetch
        const calls: OriginCall[] = []
        globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = typeof input === 'string' ? new URL(input, builder.url) : input
          calls.push({
            url: String(url),
            method: init?.method ?? 'GET',
            body: typeof init?.body === 'string' ? init.body : undefined,
          })
          return real(url as URL, init)
        }) as typeof fetch
        return {
          calls,
          restore: () => {
            globalThis.fetch = real
          },
        }
      },
      close: () => builder.close(),
    }
  }

  return {
    overHttp: false,
    transport: 'the origin route handlers in-process (this machine refuses to listen on a socket)',
    install: () => {
      const real = globalThis.fetch
      const calls: OriginCall[] = []
      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? new URL(input, 'http://origin.test/') : (input as URL)
        calls.push({
          url: String(url),
          method: init?.method ?? 'GET',
          body: typeof init?.body === 'string' ? init.body : undefined,
        })
        return inProcess(cwd, new URL(String(url)), init)
      }) as typeof fetch
      return {
        calls,
        restore: () => {
          globalThis.fetch = real
        },
      }
    },
    close: async () => {},
  }
}
