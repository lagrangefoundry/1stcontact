// @vitest-environment jsdom
/**
 * [[REQ-400]] — **the client sees the tab icon and share card on the Settings
 * tab, and can change them there.**
 *
 * THE SECTION AS THE PANE MOUNTS IT. The origin calls are injected at the
 * section's own transport seam, as every Settings suite does — the route behind
 * them is pinned through HTTP in `test_UAT_FC_REQ-400_launch_readiness`. What is
 * asserted here is what that suite cannot see: that the state the route answers
 * is drawn, that an empty box shows the default it will publish, and that the
 * two buttons send the request the route takes.
 */

import { describe, expect, it } from 'vitest'
import { createLaunchSection, ICON_LABEL, CARD_LABEL, NO_ICON } from '../apps/control-app/src/builder/launch.js'

const settle = () => new Promise((r) => setTimeout(r, 0))

const STATE = {
  favicon: null,
  shareCard: { image: 'team.jpg' },
  defaults: { title: 'Charlie’s Plumbing', description: 'Plumbing across Dublin' },
  images: ['logo.png', 'team.jpg'],
}

function mount(state: Record<string, unknown> = STATE) {
  const sent: Record<string, unknown>[] = []
  const section = createLaunchSection({
    site: () => 'studio',
    transport: {
      load: async () => state,
      save: async (body: Record<string, unknown>) => {
        sent.push(body)
        return body.op === 'icon'
          ? { ...state, favicon: { icon: 'favicon.png', appleTouchIcon: 'apple-touch-icon.png' } }
          : { ...state, shareCard: { image: body.image, title: body.title } }
      },
    },
  })
  document.body.replaceChildren(section.element)
  return { section, sent }
}

function button(label: string): HTMLButtonElement {
  return [...document.querySelectorAll('button')].find((b) => b.textContent === label) as HTMLButtonElement
}

describe('REQ-400 — the Settings section', () => {
  it('test_UAT_FC_REQ-400_settings_section_shows_the_card_with_its_defaults', async () => {
    const { section } = mount()
    await section.refresh()
    const text = document.body.textContent ?? ''
    expect(text).toContain('Tab icon and share card')
    expect(text).toContain(NO_ICON)
    const [title, description] = [...document.querySelectorAll<HTMLInputElement>('.builder-launch__input')]
    expect(title.value).toBe('')
    expect(title.placeholder).toBe('Charlie’s Plumbing')
    expect(description.placeholder).toBe('Plumbing across Dublin')
    const preview = document.querySelector<HTMLImageElement>('.builder-launch__card-preview')
    expect(preview?.getAttribute('src')).toContain('assets/team.jpg')
  })

  it('test_UAT_FC_REQ-400_settings_section_makes_the_icon_and_saves_the_card', async () => {
    const { section, sent } = mount()
    await section.refresh()
    const source = document.querySelector<HTMLSelectElement>('.builder-launch__icon select')!
    source.value = 'logo.png'
    button(ICON_LABEL).click()
    await settle()
    expect(sent[0]).toEqual({ site: 'studio', op: 'icon', image: 'logo.png' })
    expect(document.querySelector<HTMLImageElement>('.builder-launch__icon-preview')?.getAttribute('src')).toContain(
      'assets/apple-touch-icon.png',
    )

    const title = document.querySelector<HTMLInputElement>('.builder-launch__input')!
    title.value = 'Come on in'
    button(CARD_LABEL).click()
    await settle()
    expect(sent[1]).toEqual({ site: 'studio', op: 'card', image: 'team.jpg', title: 'Come on in', description: '' })
  })
})
