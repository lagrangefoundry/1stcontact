/**
 * BUG-214 — **an uploaded image is described, not refused for lacking vision**.
 *
 * THE FAILURE. The describer registered its backend with no capabilities, so the
 * session manager (which admits content against the registry, not the adapter
 * instance) refused every image block: material ended `failed` with "declares no
 * vision capability". Text passed because it carries no image.
 *
 * ONE DOUBLE, AND IT IS THE NETWORK — the Anthropic client. The manager's
 * admission gate, which is where this broke, is the real thing.
 */

import { describe as suite, expect, it } from 'vitest'
import { sessionImageDescriber } from '../apps/control-app/src/ai'
import { describe as describeMaterial } from '../apps/control-app/src/describe'
import { says, scriptedClient } from './support/scripted-model-client'

/** A one-pixel PNG. Real bytes, because the port validates what it is handed. */
const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
)

suite('BUG-214 — the image describer is admitted as vision-capable', () => {
  it('test_UAT_FC_BUG_214_an_uploaded_image_is_described_and_the_model_receives_the_picture', async () => {
    const client = scriptedClient([says('Salon chair by the window\n\nA styling chair in daylight.')])

    const description = await describeMaterial(
      { bytes: PNG, kind: 'image', contentType: 'image/png', filename: 'salon.png' },
      { describeImage: sessionImageDescriber('sk-not-a-real-key', { client }) },
    )

    // The symptom: before the fix this was `failed`, body naming the vision gate.
    expect(description.status).toBe('ok')
    expect(description.body).not.toMatch(/vision capability/)
    expect(description.body).toContain('styling chair')

    // The request reached the model WITH the picture as an image block.
    expect(client.seen).toHaveLength(1)
    const user = client.seen[0].messages.find((m: { role: string }) => m.role === 'user')
    const blocks = Array.isArray(user?.content) ? (user.content as { type: string }[]) : []
    expect(blocks.some((b) => b.type === 'image')).toBe(true)
  })
})
