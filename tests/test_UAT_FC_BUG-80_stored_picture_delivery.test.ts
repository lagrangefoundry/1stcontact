import { describe, expect, it } from 'vitest'
import {
  ImageNotRenderableError,
  INJECT_CHUNK_CHARS,
  MAX_DRIVER_ERROR_CHARS,
  MAX_STORED_PICTURE_BYTES,
  rasterizeImage,
  safeDriverMessage,
} from '../tools/generate/src/cli/capture/screenshot'
import type {
  BrowserDriver,
  CapturedResponse,
  Viewport,
} from '../tools/generate/src/cli/capture/types'

/**
 * BUG-80 — **a failed picture render must not be able to end the conversation,
 * and an ordinary photograph must be photographable at all.**
 *
 * THE FAILURE THIS SUITE IS ABOUT. A client uploaded a ~12 MB camera JPEG and
 * asked the assistant to look at it. The picture travelled to the browser inside
 * a `data:text/html;base64,…` URL with its bytes base64'd twice, Chromium refused
 * the URL for being longer than `url::kMaxURLChars`, and Playwright's navigation
 * error — which is `"<code> at <url>"` — handed the entire 22.6 MB URL back as
 * the tool result. The turn died with `prompt is too long: 22131466 tokens`, and
 * every turn after it died the same way.
 *
 * Two independent guarantees are under test, and they are independent on purpose:
 * one is that the bytes get there at all, the other is that when something goes
 * wrong the thing that comes back is a sentence rather than a payload. Either
 * alone leaves the incident reachable.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT. `rasterizeImage` is the shipped function —
 * the shell, the chunking, the media-type guard, the sanitiser and the refusals
 * are all production code. The browser is the double, which is the seam the whole
 * `BrowserDriver` design exists to have injected.
 */

/** Bytes that sniff as a JPEG and are as big as asked for. */
function photograph(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  bytes[0] = 0xff
  bytes[1] = 0xd8
  bytes[2] = 0xff
  for (let i = 3; i < length; i++) bytes[i] = i % 251
  return bytes
}

interface DriverOptions {
  /** Reject the navigation with this message. */
  navigateError?: string
  /** Reject the Nth (0-based) evaluated script, echoing it back. */
  failQueryEchoingScript?: boolean
  /** Report the picture as undecodable. */
  undecodable?: boolean
}

class FakeDriver implements BrowserDriver {
  navigated: string[] = []
  queried: string[] = []
  closed = 0
  constructor(private readonly opts: DriverOptions = {}) {}

  async navigate(url: string, _viewport?: Viewport): Promise<void> {
    this.navigated.push(url)
    if (this.opts.navigateError) throw new Error(`${this.opts.navigateError} at ${url}`)
  }
  async screenshot(viewport?: Viewport): Promise<Uint8Array> {
    return new Uint8Array([viewport?.width ?? 0, viewport?.height ?? 0])
  }
  async query<T>(script: string): Promise<T> {
    this.queried.push(script)
    if (this.opts.failQueryEchoingScript) {
      // What Playwright actually does when an evaluation throws: it quotes the
      // script it was given back at you.
      throw new Error(`Evaluation failed: SyntaxError\n=== evaluated ===\n${script}`)
    }
    if (this.opts.undecodable && script.includes('img.decode')) return { ok: false } as T
    return { ok: true, width: 800, height: 600, naturalWidth: 4000, naturalHeight: 3000 } as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<html></html>'
  }
  async close(): Promise<void> {
    this.closed++
  }
}

/** Nothing that escapes this path may carry a payload. */
function expectNoPayload(message: string): void {
  expect(message.length).toBeLessThanOrEqual(MAX_DRIVER_ERROR_CHARS + 200)
  expect(message).not.toMatch(/data:[a-z]/)
  expect(message).not.toMatch(/[A-Za-z0-9+/=]{120,}/)
}

// ── the error path ───────────────────────────────────────────────────────────

describe('BUG-80 — a browser failure comes back as a sentence, never as its payload', () => {
  it('test_UAT_FC_BUG_80_a_failed_navigation_does_not_return_the_document', async () => {
    const driver = new FakeDriver({ navigateError: 'net::ERR_ABORTED' })

    const err = await rasterizeImage(
      photograph(4_000_000),
      'image/jpeg',
      async () => driver,
      "'material-aa46d9cb'",
    ).catch((e: unknown) => e)

    // A NAMED FAILURE, NOT A PAYLOAD. This is the assertion the incident is
    // about: 22.6 MB of base64 reached the model and the conversation could not
    // be continued afterwards.
    expect(err).toBeInstanceOf(ImageNotRenderableError)
    const message = (err as Error).message
    expectNoPayload(message)

    // Still useful: it names the picture and keeps the driver's own diagnosis,
    // which is what lets the assistant say something true to the client.
    expect(message).toContain('material-aa46d9cb')
    expect(message).toContain('net::ERR_ABORTED')

    // And the lease is released on the failure path, as it is on every other.
    expect(driver.closed).toBe(1)
  })

  it('test_UAT_FC_BUG_80_a_failed_evaluation_does_not_return_its_script', async () => {
    // The bound has to be on the PATH, not on one call. A driver that rejects an
    // evaluation commonly quotes the script back, and the script is where the
    // picture now travels — so the same prompt bomb is reachable by a second
    // route unless every interaction is wrapped.
    const driver = new FakeDriver({ failQueryEchoingScript: true })

    const err = await rasterizeImage(
      photograph(4_000_000),
      'image/jpeg',
      async () => driver,
      "'DSC_7975.jpg'",
    ).catch((e: unknown) => e)

    expect(err).toBeInstanceOf(ImageNotRenderableError)
    const message = (err as Error).message
    expectNoPayload(message)
    expect(message).toContain('DSC_7975.jpg')
  })

  it('test_UAT_FC_BUG_80_the_sanitiser_bounds_a_message_it_has_never_seen', async () => {
    // The strips catch the two shapes already observed; the truncation is what
    // makes the guarantee hold for a failure nobody has seen yet.
    const novel = `something went wrong: ${'x'.repeat(50_000)}`
    expect(safeDriverMessage(new Error(novel)).length).toBeLessThanOrEqual(
      MAX_DRIVER_ERROR_CHARS + 1,
    )
  })
})

// ── the capability ───────────────────────────────────────────────────────────

describe('BUG-80 — an ordinary photograph is photographable', () => {
  it('test_UAT_FC_BUG_80_a_picture_past_the_old_url_ceiling_is_photographed', async () => {
    // Comfortably past the ~1.1 MB the double-base64 URL used to cap this at —
    // which is to say, an ordinary phone photograph.
    const bytes = photograph(4_000_000)
    const driver = new FakeDriver()

    const shot = await rasterizeImage(bytes, 'image/jpeg', async () => driver, "'holiday.jpg'")

    expect(shot.width).toBe(800)
    expect(shot.naturalWidth).toBe(4000)

    // THE URL IS CONSTANT AND SMALL, so the picture's size can no longer reach
    // it — neither to be refused by the browser, nor to be quoted in an error.
    expect(driver.navigated).toHaveLength(1)
    expect(driver.navigated[0].startsWith('data:text/html;base64,')).toBe(true)
    expect(driver.navigated[0].length).toBeLessThan(2000)

    // The bytes arrived over the evaluation channel instead, in bounded chunks:
    // no single message a driver could echo back is unbounded.
    const chunks = driver.queried.filter((s) => s.includes('window.__pic=window.__pic'))
    expect(chunks.length).toBeGreaterThan(0)
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(INJECT_CHUNK_CHARS + 200)
    }

    // And what was assembled is THIS picture, not an empty one: every chunk
    // joined back up is the whole base64 of the bytes handed in.
    const joined = chunks
      .map((s) => /push\("([A-Za-z0-9+/=]*)"\)/.exec(s)?.[1] ?? '')
      .join('')
    expect(joined.length).toBe(Math.ceil(bytes.length / 3) * 4)
  })

  it('test_UAT_FC_BUG_80_an_absurd_picture_is_refused_before_a_browser_is_leased', async () => {
    let leased = 0
    const err = await rasterizeImage(
      photograph(MAX_STORED_PICTURE_BYTES + 1),
      'image/jpeg',
      async () => {
        leased++
        return new FakeDriver()
      },
      "'enormous.tif'",
    ).catch((e: unknown) => e)

    expect(err).toBeInstanceOf(ImageNotRenderableError)
    expect((err as Error).message).toContain('enormous.tif')
    // NO BROWSER WAS TAKEN. A lease is a local process or a metered session, and
    // an input this code was always going to refuse should cost neither.
    expect(leased).toBe(0)
  })

  it('test_UAT_FC_BUG_80_a_stored_media_type_cannot_escape_the_src_it_goes_into', async () => {
    // The stored content type is a field somebody wrote down — `material.ts`
    // repairs it from the filename when it is silent — so it is data, and data
    // reaches a document only after everything that is not a media type is out.
    const driver = new FakeDriver()
    await rasterizeImage(
      photograph(1000),
      "image/png';alert(document.cookie);//",
      async () => driver,
      "'odd.png'",
    )

    const decode = driver.queried[driver.queried.length - 1]
    expect(decode).not.toContain('alert(')
    expect(decode).toContain("img.src = 'data:application/octet-stream;base64,'")
  })

  it('test_UAT_FC_BUG_80_an_undecodable_picture_still_says_so_in_its_own_words', async () => {
    // No regression on the decode path: a picture the browser will not read is a
    // named failure, because a blank picture reads to a model exactly like a
    // picture it saw.
    const err = await rasterizeImage(
      photograph(1000),
      'image/jpeg',
      async () => new FakeDriver({ undecodable: true }),
      "'broken.jpg'",
    ).catch((e: unknown) => e)

    expect(err).toBeInstanceOf(ImageNotRenderableError)
    expect((err as Error).message).toContain('the browser would not decode it')
    expect((err as Error).message).toContain('broken.jpg')
  })
})
