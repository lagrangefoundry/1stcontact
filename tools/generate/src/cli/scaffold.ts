import { defaultTokens } from '@1stcontact/framework'

/**
 * Starter content for `1c new`: a minimal, valid, **empty** draft. Since the
 * framework pivot (REQ-79/REQ-84) layout is owned by the L1 substrate and the
 * catalog holds only capability modules — there are no header/hero/footer
 * layout modules to seed a starter with. The starter is therefore an empty home
 * page (a schema-valid draft with no module instances); the author fills it in
 * by authoring L1 / adding capability modules, then `1c render` to preview.
 */

export function starterSiteJson(slug: string): Record<string, unknown> {
  return {
    id: slug,
    config: {
      businessName: slug,
      tagline: `${slug} — built with 1st Contact`,
    },
    theme: defaultTokens,
    nav: { pattern: 'top-tabs', entries: [] },
    assets: [],
  }
}

export function starterHomePage(slug: string): Record<string, unknown> {
  return {
    id: 'home',
    slug: 'home',
    title: 'Home',
    seoMeta: {
      title: `${slug} — Home`,
      description: `Welcome to ${slug}.`,
    },
    modules: [],
  }
}
