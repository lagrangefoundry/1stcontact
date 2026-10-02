import type { FidelityDeps } from '../../tools/generate/src/cli/ai/fidelity-core'
import { egressGuard } from '../../tools/generate/src/cli/capture/egress-guard'
import type { EgressGuard } from '../../tools/generate/src/cli/capture/egress-guard'
import { memoryReferenceStore } from '../../tools/generate/src/store/memory-reference-store'
import { VIEWPORTS } from '../../tools/generate/src/cli/capture/screenshot'
import type {
  BrowserDriver,
  CapturedResponse,
  Viewport,
} from '../../tools/generate/src/cli/capture/types'
import { signalsFor } from './fake-capture-driver'

/**
 * `capture_site` with ONE double — the browser — that asks the production egress
 * guard about every request (BUG-127). Shared by the suites that assert what the
 * operation reports about refused requests ([[REQ-361]]), so they drive the same
 * browser rather than two that agree by inspection.
 */

const ORIGIN = 'https://app.example.test'
/** A 1×1 PNG. The pixels are not what these tests are about. */
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

/** What a page pulls and how it arrived — the facts a URL does not carry. */
export interface PageScript {
  /** Redirect hops the main document arrived after. */
  redirectDepth?: number
  /** Subresource URLs the page requests, on every navigation pass. */
  subresources?: string[]
}

/**
 * A browser that asks the real guard about every request, and answers a refused
 * document with the refusal page rather than by throwing.
 *
 * THE 403 IS THE WHOLE POINT. Production fulfils a refused request with `403
 * refused by egress policy`, which the browser renders — so a refused navigation
 * does not fail, it *succeeds and returns the wrong page*. A double that threw
 * instead would hand the pipeline an error to retry and the bug under test could
 * not occur.
 */
export class GuardedFakeDriver implements BrowserDriver {
  static refusedPages: string[] = []
  private refused = false
  constructor(
    private readonly guard: EgressGuard,
    private readonly script: PageScript,
  ) {}

  async navigate(url: string, _viewport?: Viewport): Promise<void> {
    const allowed = this.guard.allow(url, {
      kind: 'document',
      redirectDepth: this.script.redirectDepth ?? 0,
    })
    this.refused = !allowed
    if (!allowed) {
      GuardedFakeDriver.refusedPages.push(url)
      return
    }
    for (const sub of this.script.subresources ?? []) {
      this.guard.allow(sub, { kind: 'subresource' })
    }
  }

  async screenshot(_viewport?: Viewport): Promise<Uint8Array> {
    return PNG
  }
  async query<T>(_script: string): Promise<T> {
    return signalsFor(VIEWPORTS.desktop.width) as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return this.refused
      ? '<html><body>refused by egress policy</body></html>'
      : '<html><body><h1>Pricing</h1></body></html>'
  }
  async close(): Promise<void> {}
}

/** The surface's dependencies, with the browser doubled and nothing else. */
export function guardedCaptureDeps(script: PageScript): FidelityDeps & { adopted: string[] } {
  const adopted: string[] = []
  return {
    slug: 'studio',
    origin: ORIGIN,
    references: memoryReferenceStore(),
    driverFactory: async () => new GuardedFakeDriver(egressGuard(), script),
    guardedDriver: (guard) => async () => new GuardedFakeDriver(guard, script),
    adoptCapture: async (bundle: string) => {
      adopted.push(bundle)
      return { uid: `reference-${adopted.length}`, created: true }
    },
    adopted,
  }
}

