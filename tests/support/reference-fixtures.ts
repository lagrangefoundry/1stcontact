import type { L1Document } from '@1stcontact/site-schema'
import type { Capture } from '../../tools/generate/src/cli/capture/types'
import type { MultiStateCapture } from '../../tools/generate/src/cli/capture/values-diff'

/**
 * Synthetic bundle members for the {@link registerReferenceStoreContract} suite
 * — REQ-155.
 *
 * DELIBERATELY MINIMAL, AND NOT A FAKE OF ANYTHING. What the contract asserts is
 * that a member written through one adapter reads back as the same *artifact*
 * through the codec, so these need to be real values of the real types and
 * nothing more: a richer capture would make the round-trip assertions harder to
 * read while proving exactly the same thing. Every suite that needs a
 * semantically interesting capture already builds one (`req83`, `req88`), and
 * those are about the fold rather than about storage.
 *
 * THEY ARE FUNCTIONS, NOT CONSTANTS, so a test that mutates one cannot leak into
 * the next — the contract runs the same assertions three times over three
 * adapters and a shared mutable literal would couple them.
 */

export function syntheticCapture(): Capture {
  return {
    url: 'https://example.test/pricing',
    host: 'example.test',
    path: '/pricing',
    capturedAt: '2026-09-01T00:00:00.000Z',
    viewport: { width: 1280, height: 800 },
    theme: {
      colors: [],
      fonts: [],
      typeScale: [16],
      spacingScalePx: [8],
      containerMaxWidthPx: 1120,
      subScales: {},
    },
    sections: [],
    assets: [
      {
        id: 'a1',
        kind: 'image',
        src: 'https://example.test/hero.jpg',
        localPath: 'assets/hero.jpg',
      },
    ],
  }
}

export function syntheticMultiState(): MultiStateCapture {
  return {
    url: 'https://example.test/pricing',
    projections: [
      {
        engine: 'chromium',
        viewport: { width: 375, height: 667 },
        state: 'rest',
        manifest: {
          source: 'example.test/pricing',
          elements: [],
          sections: [],
          viewport: { width: 375, height: 667 },
        },
      },
    ],
    notes: [],
  }
}

export function syntheticL1(): L1Document {
  return {
    widths: [375],
    root: { kind: 'box', children: [] },
  } as L1Document
}
