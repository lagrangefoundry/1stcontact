import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { spawn, type ChildProcess } from 'node:child_process'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * BUG-228 — **`bin/access-sim` passes a response through as it arrives**.
 *
 * WHAT WAS BROKEN. The simulator read every upstream body to the end before
 * sending a byte of it. The chat's `text/event-stream` carries the consultant's
 * words, the working line and every step as events inside one response, so in
 * local dev none of them reached the browser until the turn was over — and every
 * "she goes quiet" observation was measured through that.
 *
 * WHAT IS DRIVEN. A real `bin/access-sim` process in front of a stub builder this
 * suite controls. The stub holds its second SSE frame back until the test has
 * already read the first through the simulator, so a buffering proxy cannot pass:
 * the first frame would never arrive and the read would time out.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SIM = path.join(REPO, 'bin', 'access-sim')
const COOKIE = 'CF_Authorization=bug228'

let sim: ChildProcess | undefined
let builder: http.Server | undefined
let origin = ''

/** Releases the stub's held-back second frame. */
let releaseSecond: () => void = () => {}
/** Resolves when the stub sees its streaming caller go away. */
let upstreamClosed: Promise<void> = Promise.resolve()

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      server.close(() => resolve(port))
    })
  })
}

async function waitForCerts(url: string, attempts = 60): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`access-sim did not answer ${url}`)
}

function startStubBuilder(port: number): http.Server {
  return http
    .createServer((req, res) => {
      if (req.url === '/stream') {
        let markClosed: () => void = () => {}
        upstreamClosed = new Promise((r) => (markClosed = r))
        res.on('close', () => markClosed())
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' })
        res.write('data: first\n\n')
        releaseSecond = () => {
          res.write('data: second\n\n')
          res.end()
        }
        return
      }
      res.writeHead(201, {
        'content-type': 'application/json',
        'set-cookie': ['a=1; Path=/', 'b=2; Path=/'],
      })
      res.end(JSON.stringify({ ok: true, saw: req.url }))
    })
    .listen(port, '127.0.0.1')
}

/** Reads from `reader` until the decoded text contains `needle`, or fails after `ms`. */
async function readUntil(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  needle: string,
  ms = 3000,
): Promise<string> {
  const decoder = new TextDecoder()
  let text = ''
  const deadline = Date.now() + ms
  while (!text.includes(needle)) {
    const left = deadline - Date.now()
    if (left <= 0) throw new Error(`no "${needle}" within ${ms}ms; got ${JSON.stringify(text)}`)
    const next = await Promise.race([
      reader.read(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`no "${needle}" within ${ms}ms`)), left)),
    ])
    if (next.done) break
    text += decoder.decode(next.value, { stream: true })
  }
  return text
}

beforeAll(async () => {
  const simPort = await freePort()
  const builderPort = await freePort()
  origin = `http://127.0.0.1:${simPort}`
  builder = startStubBuilder(builderPort)
  sim = spawn(
    process.execPath,
    [SIM, '--port', String(simPort), '--aud', 'bug228-aud', '--builder', `http://127.0.0.1:${builderPort}`],
    { stdio: 'ignore' },
  )
  await waitForCerts(`${origin}/cdn-cgi/access/certs`)
}, 30_000)

afterAll(() => {
  sim?.kill()
  builder?.close()
})

describe('BUG-228 — bin/access-sim streams the response through', () => {
  it('test_UAT_FC_BUG-228_the_first_sse_frame_arrives_before_the_upstream_writes_the_second', async () => {
    // The deadline is what a buffering proxy fails on: it holds the headers
    // back with the body, so without one this read would wait forever.
    const abort = new AbortController()
    const deadline = setTimeout(() => abort.abort(), 3000)
    const res = await fetch(`${origin}/stream`, { headers: { cookie: COOKIE }, signal: abort.signal })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/event-stream')
    expect(res.headers.get('content-length')).toBeNull()
    const reader = res.body!.getReader()

    const first = await readUntil(reader, 'data: first')
    clearTimeout(deadline)
    expect(first).not.toContain('second')

    releaseSecond()
    const rest = await readUntil(reader, 'data: second')
    expect(rest).toContain('data: second')
  })

  it('test_UAT_FC_BUG-228_a_plain_json_response_arrives_intact_with_status_and_cookies', async () => {
    const res = await fetch(`${origin}/api/thing?x=1`, { headers: { cookie: COOKIE } })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ ok: true, saw: '/api/thing?x=1' })
    expect(res.headers.getSetCookie()).toEqual(['a=1; Path=/', 'b=2; Path=/'])
  })

  it('test_UAT_FC_BUG-228_a_client_that_disconnects_closes_the_upstream_connection', async () => {
    const abort = new AbortController()
    const deadline = setTimeout(() => abort.abort(), 3000)
    const res = await fetch(`${origin}/stream`, { headers: { cookie: COOKIE }, signal: abort.signal })
    const reader = res.body!.getReader()
    await readUntil(reader, 'data: first')
    clearTimeout(deadline)

    abort.abort()
    await expect(
      Promise.race([
        upstreamClosed.then(() => 'closed'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('upstream still open')), 3000)),
      ]),
    ).resolves.toBe('closed')
  })
})
