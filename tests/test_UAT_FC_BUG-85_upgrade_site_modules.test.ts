/**
 * [[BUG-85]] 2c and 2f — the upgrade pass, over the `SiteStore` port.
 *
 * WHY THE PORT IS THE POINT. The store that orphaned an instance was D1, and
 * the only copy the bumping commit migrated was the filesystem fixture, because
 * that commit migrated by editing a file in the repo. A repair written against
 * `node:fs` would have had exactly the same reach and would have left the real
 * defect in place. Expressed over the port it runs wherever an adapter does —
 * which is what these tests exercise, against the in-memory one.
 *
 * The default run is also the audit (2f): "which stored instances no longer
 * resolve" and "what would an upgrade do" are the same question, answered in
 * one place so the report and the repair cannot disagree.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { memorySiteStore } from '../tools/generate/src/store/memory-store'
import { upgradeSiteModules } from '../tools/generate/src/store/upgrade-site'

const ORPHAN = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures/bug85/account-chrome-v1-orphan.json'), 'utf8'),
)

/** The real orphan, on a page, in a store. */
function storeWithOrphan(slug = 'demo') {
  const store = memorySiteStore()
  store.seed(slug, {
    siteJson: { name: slug },
    pages: {
      'home.json': { id: 'home', slug: 'home', modules: [structuredClone(ORPHAN)] },
      // A second page with nothing stale, so "only pages that changed" is a
      // claim with something to be wrong about.
      'about.json': { id: 'about', slug: 'about', modules: [] },
    },
  })
  return store
}

describe('BUG-85 2c — upgradeSiteModules', () => {
  it('reports every stale instance and writes NOTHING by default', async () => {
    const store = storeWithOrphan()
    const before = structuredClone(await store.readPages('demo'))

    const report = await upgradeSiteModules(store, 'demo')

    expect(report.stale).toBe(1)
    expect(report.written).toBe(false)
    expect(report.pages).toHaveLength(1)
    expect(report.pages[0].name).toBe('home.json')
    expect(report.pages[0].upgrades[0]).toMatchObject({
      id: 'signin',
      type: 'account-chrome',
      from: 1,
      to: 2,
      droppedConfigKeys: ['account'],
    })
    // THE PROPERTY THAT MATTERS: a facility whose whole subject is data nobody
    // had looked at must not rewrite that data the first time it is run.
    expect(await store.readPages('demo')).toEqual(before)
  })

  it('writes the upgraded pages back when asked', async () => {
    const store = storeWithOrphan()
    const report = await upgradeSiteModules(store, 'demo', { write: true })

    expect(report.written).toBe(true)
    const pages = await store.readPages('demo')
    const home = pages.find((p) => p.name === 'home.json')!
    const instance = (home.page.modules as { version: number; slots: object }[])[0]
    expect(instance.version).toBe(2)
    expect(Object.keys(instance.slots).sort()).toEqual([
      'businesses',
      'dialog',
      'error',
      'sent',
      'signedIn',
      'signedOut',
    ])
  })

  it('leaves pages that had nothing stale exactly as they were', async () => {
    const store = storeWithOrphan()
    const before = (await store.readPages('demo')).find((p) => p.name === 'about.json')!
    await upgradeSiteModules(store, 'demo', { write: true })
    const after = (await store.readPages('demo')).find((p) => p.name === 'about.json')!
    expect(after).toEqual(before)
  })

  it('reports nothing and writes nothing for a site already on the current contracts', async () => {
    const store = storeWithOrphan()
    await upgradeSiteModules(store, 'demo', { write: true })
    const settled = structuredClone(await store.readPages('demo'))

    // The second run is the one that proves the first was complete.
    const again = await upgradeSiteModules(store, 'demo', { write: true })
    expect(again.stale).toBe(0)
    expect(again.pages).toEqual([])
    expect(again.written).toBe(false)
    expect(await store.readPages('demo')).toEqual(settled)
  })

  it('ignores a page with no modules at all', async () => {
    const store = memorySiteStore()
    store.seed('demo', { siteJson: { name: 'demo' }, pages: { 'home.json': { id: 'home' } } })
    const report = await upgradeSiteModules(store, 'demo')
    expect(report.stale).toBe(0)
  })

  it('leaves a module type the catalog has never heard of alone', async () => {
    // A different failure — a module that was removed, or a page written by a
    // build that had one we do not. An upgrade pass inventing an opinion about
    // it would be the wrong place to decide.
    const store = memorySiteStore()
    store.seed('demo', {
      siteJson: { name: 'demo' },
      pages: {
        'home.json': { id: 'home', modules: [{ id: 'x', type: 'long-gone', version: 1 }] },
      },
    })
    const report = await upgradeSiteModules(store, 'demo')
    expect(report.stale).toBe(0)
    expect(report.written).toBe(false)
  })

  it('refuses a site with no draft rather than reporting it clean', async () => {
    const store = memorySiteStore()
    await expect(upgradeSiteModules(store, 'nope')).rejects.toThrow(/no draft/)
  })
})
