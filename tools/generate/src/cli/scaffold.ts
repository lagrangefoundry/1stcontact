import { defaultTokens } from '@1stcontact/framework'

/**
 * Starter content for `1c new`: a minimal but valid draft exercising the
 * modules representable in a schema-valid definition today (header logo, hero,
 * footer). One `site.json` (everything but pages) and one page file.
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
    modules: [
      {
        id: 'header',
        type: 'header',
        version: 1,
        variant: 'top-nav',
        dials: {},
        content: { logo: slug, entries: [] },
      },
      {
        id: 'hero',
        type: 'hero',
        version: 1,
        variant: 'bg-color',
        dials: { size: 'lg', align: 'center' },
        content: {
          eyebrow: 'New site',
          heading: `Welcome to ${slug}`,
          subhead: 'Edit `draft/` and run `1c render` to preview.',
        },
      },
      {
        id: 'footer',
        type: 'footer',
        version: 1,
        variant: 'minimal',
        dials: {},
        content: { copyrightHolder: slug },
      },
    ],
  }
}
