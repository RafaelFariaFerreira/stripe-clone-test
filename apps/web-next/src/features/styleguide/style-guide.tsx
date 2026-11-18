import { ICONS } from '@stripe-clone/icons';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { COMPONENTS, CONTRIBUTING_RULES, type ComponentDoc } from './catalog';
import { ComponentDemo } from './demos';
import styles from './styleguide.module.css';
import { readTokenGroups, type TokenGroup } from './tokens';

/** A real payment from the mock dataset, used for the "details page" link. */
export const EXAMPLE_PAYMENT_ID = 'pi_3WFgxRt8vB2wQjKozQkDRgR0';

const TYPE_SCALE = [
  {
    token: 'Display',
    size: '--font-size-28',
    line: '--line-height-36',
    weight: 700,
    usage: 'Page title, detail amount',
    sample: 'Transactions',
  },
  {
    token: 'Heading',
    size: '--font-size-20',
    line: '--line-height-28',
    weight: 700,
    usage: 'Detail page sections',
    sample: 'Recent activity',
  },
  {
    token: 'Subheading',
    size: '--font-size-16',
    line: '--line-height-24',
    weight: 600,
    usage: 'Payment breakdown rows',
    sample: 'Net amount',
  },
  {
    token: 'Body strong',
    size: '--font-size-14',
    line: '--line-height-20',
    weight: 600,
    usage: 'Amounts, tabs, buttons',
    sample: '$21.98',
  },
  {
    token: 'Body',
    size: '--font-size-14',
    line: '--line-height-20',
    weight: 400,
    usage: 'Table cells, nav, inputs',
    sample: 'Subscription update',
  },
  { token: 'Button small', size: '--font-size-13', line: '--line-height-20', weight: 600, usage: 'Pagination buttons', sample: 'Previous' },
  {
    token: 'Label',
    size: '--font-size-12',
    line: '--line-height-20',
    weight: 600,
    usage: 'Table headers, filter pills',
    sample: 'Payment method',
  },
  { token: 'Caption', size: '--font-size-12', line: '--line-height-16', weight: 500, usage: 'Badges, tooltips', sample: 'Succeeded' },
] as const;

const BREAKPOINTS = [
  { name: 'xs', query: '< 490px', behavior: 'Header actions become icon buttons; banner stacks; search collapses.' },
  { name: 'sm', query: '≥ 490px', behavior: 'Single column, 20px gutters.' },
  { name: 'md', query: '768 – 1039.9px', behavior: 'Sidebar becomes a drawer (menu button); status cards and table scroll horizontally.' },
  { name: 'lg', query: '≥ 1040px', behavior: 'Fixed 235px sidebar, 40px gutters.' },
  { name: 'xl', query: '≥ 1440px', behavior: 'Same as lg with a wider table; the reference was captured at ~1490px.' },
] as const;

const COLOR_GROUPS = new Set(['Text colors', 'Surfaces', 'Borders', 'Brand', 'Badge tones', 'Misc accents']);

function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.sectionTitle}>
        {title}
      </h2>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
      {children}
    </section>
  );
}

function ColorGroup({ group }: { group: TokenGroup }) {
  return (
    <div className={styles.block}>
      <h3 className={styles.blockTitle}>{group.title}</h3>
      <div className={styles.swatches}>
        {group.tokens.map((token) => (
          <figure key={token.name} className={styles.swatch}>
            <span className={styles.swatchColor} style={{ background: `var(${token.name})` }} />
            <figcaption>
              <code>{token.name}</code>
              <span>{token.value}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function TokenTable({ group, preview }: { group: TokenGroup; preview?: (name: string) => ReactNode }) {
  return (
    <div className={styles.block}>
      <h3 className={styles.blockTitle}>{group.title}</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Value</th>
            {preview ? <th scope="col">Preview</th> : null}
          </tr>
        </thead>
        <tbody>
          {group.tokens.map((token) => (
            <tr key={token.name}>
              <td>
                <code>{token.name}</code>
              </td>
              <td>
                <code className={styles.value}>{token.value}</code>
              </td>
              {preview ? <td>{preview(token.name)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComponentEntry({ doc, iconNames }: { doc: ComponentDoc; iconNames: readonly string[] }) {
  return (
    <article id={doc.id} className={styles.component} aria-labelledby={`${doc.id}-title`}>
      <header className={styles.componentHeader}>
        <h3 id={`${doc.id}-title`} className={styles.componentTitle}>
          {doc.name}
        </h3>
        <span className={styles.tag}>{doc.group}</span>
      </header>
      <p className={styles.lead}>{doc.summary}</p>
      <div className={styles.demo}>
        <ComponentDemo id={doc.id} iconNames={iconNames} />
      </div>
      <div className={styles.apiGrid}>
        <div>
          <h4 className={styles.apiTitle}>React (Next.js)</h4>
          <pre className={styles.code}>
            <code>{`${doc.react.importPath}\n\n${doc.react.usage}`}</code>
          </pre>
        </div>
        <div>
          <h4 className={styles.apiTitle}>
            Angular <code className={styles.selector}>{doc.angular.selector}</code>
          </h4>
          <pre className={styles.code}>
            <code>{doc.angular.usage}</code>
          </pre>
        </div>
      </div>
      {doc.props.length ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Prop / input</th>
              <th scope="col">Type</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            {doc.props.map((prop) => (
              <tr key={prop.name}>
                <td>
                  <code>{prop.name}</code>
                </td>
                <td>
                  <code className={styles.value}>{prop.type}</code>
                </td>
                <td>{prop.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <dl className={styles.meta}>
        <div>
          <dt>CSS classes</dt>
          <dd>
            {doc.classes.map((name) => (
              <code key={name}>{name}</code>
            ))}
          </dd>
        </div>
        <div>
          <dt>States</dt>
          <dd>
            {doc.states.map((state) => (
              <span key={state} className={styles.chip}>
                {state}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt>Accessibility</dt>
          <dd>{doc.a11y}</dd>
        </div>
      </dl>
    </article>
  );
}

/**
 * The design system documentation. Foundations are read from the shared
 * tokens file at build time and every component demo renders the real
 * component, so this page is always in sync with what ships.
 */
export function StyleGuide() {
  const groups = readTokenGroups();
  const find = (title: string) => groups.find((group) => group.title.startsWith(title));
  const iconNames = Object.keys(ICONS).filter((name) => !ICONS[name as keyof typeof ICONS].multicolor);
  const componentGroups = ['Primitives', 'Payments', 'States', 'Details'] as const;
  const spacing = find('Spacing');
  const radii = find('Radii');
  const elevation = find('Elevation');
  const layout = find('Layout');
  const sizes = find('Component sizes');
  const motion = find('Motion');
  const typography = find('Typography');

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/styleguide" className={styles.brand}>
          <span className={styles.logo} aria-hidden="true" />
          Payments clone <span className={styles.muted}>/ Design system</span>
        </Link>
        <nav className={styles.topLinks} aria-label="Project pages">
          <Link href="/payments">Payments</Link>
          <Link href={`/payments/${EXAMPLE_PAYMENT_ID}`}>Payment details</Link>
          <Link href="/styleguide" aria-current="page">
            Design system
          </Link>
        </nav>
      </header>

      <div className={styles.layout}>
        <nav className={styles.toc} aria-label="On this page">
          <p className={styles.tocTitle}>Getting started</p>
          <a href="#overview">Overview</a>
          <a href="#principles">Principles</a>
          <p className={styles.tocTitle}>Foundations</p>
          <a href="#colors">Colors</a>
          <a href="#typography">Typography</a>
          <a href="#spacing">Spacing & radii</a>
          <a href="#elevation">Elevation</a>
          <a href="#layout">Layout & breakpoints</a>
          <a href="#icons">Icons</a>
          {componentGroups.map((group) => (
            <div key={group} className={styles.tocGroup}>
              <p className={styles.tocTitle}>{group}</p>
              {COMPONENTS.filter((doc) => doc.group === group && doc.id !== 'icons').map((doc) => (
                <a key={doc.id} href={`#${doc.id}`}>
                  {doc.name}
                </a>
              ))}
            </div>
          ))}
          <p className={styles.tocTitle}>Team</p>
          <a href="#patterns">Patterns</a>
          <a href="#contributing">Contributing</a>
        </nav>

        <main className={styles.content}>
          <section id="overview" className={styles.hero}>
            <p className={styles.eyebrow}>Design system</p>
            <h1 className={styles.title}>Style guide & components</h1>
            <p className={styles.lead}>
              The single reference for everyone working on the Payments clone. Both apps (Next.js and Angular) render the same markup
              classes from <code>@stripe-clone/styles</code>, read the same tokens and share the same domain logic. Values on this page are
              read from the source files at build time, and every demo renders the real component.
            </p>
            <div className={styles.cards}>
              <div className={styles.card}>
                <h3>Use the styles</h3>
                <pre className={styles.code}>
                  <code>{`/* globals.css (Next) or styles.css (Angular) */\n@import '@stripe-clone/styles';`}</code>
                </pre>
              </div>
              <div className={styles.card}>
                <h3>Use the domain</h3>
                <pre className={styles.code}>
                  <code>{`import { applyQuery, formatMoney,\n  STATUS_META } from '@stripe-clone/domain';`}</code>
                </pre>
              </div>
              <div className={styles.card}>
                <h3>Use an icon</h3>
                <pre className={styles.code}>
                  <code>{`<Icon name="search" size={12} />   // React\n<svg appIcon="search"></svg>       // Angular`}</code>
                </pre>
              </div>
            </div>
          </section>

          <Section id="principles" title="Principles">
            <ul className={styles.list}>
              <li>
                <strong>The reference is the spec.</strong> Hierarchy, sizes, spacing and copy match the Stripe Dashboard reference; live
                Dashboard measurements fill in states the screenshot can&apos;t show.
              </li>
              <li>
                <strong>Tokens, not values.</strong> Components only use custom properties from the tokens file.
              </li>
              <li>
                <strong>One contract, two frameworks.</strong> Same component names, inputs and CSS classes in React and Angular.
              </li>
              <li>
                <strong>System fonts.</strong> The platform UI font, like the Dashboard: SF Pro on macOS, the native UI font elsewhere.
              </li>
              <li>
                <strong>Every state is designed.</strong> Hover, focus, disabled, loading, empty and error are part of done.
              </li>
            </ul>
          </Section>

          <Section
            id="colors"
            title="Colors"
            lead="Sampled from the reference and cross-checked with the live Dashboard. Never use raw hex in components."
          >
            {groups
              .filter((group) => COLOR_GROUPS.has(group.title))
              .map((group) => (
                <ColorGroup key={group.title} group={group} />
              ))}
          </Section>

          <Section
            id="typography"
            title="Typography"
            lead="System font stack, 4 sizes in practice, tabular numbers for amounts, dates and ids."
          >
            <div className={styles.block}>
              {TYPE_SCALE.map((style) => (
                <div key={style.token} className={styles.typeRow}>
                  <span
                    className={styles.typeSample}
                    style={{ fontSize: `var(${style.size})`, lineHeight: `var(${style.line})`, fontWeight: style.weight }}
                  >
                    {style.sample}
                  </span>
                  <span className={styles.typeMeta}>
                    <strong>{style.token}</strong>
                    <code>
                      {style.size} / {style.line} · {style.weight}
                    </code>
                    <span>{style.usage}</span>
                  </span>
                </div>
              ))}
            </div>
            {typography ? <TokenTable group={typography} /> : null}
          </Section>

          <Section
            id="spacing"
            title="Spacing & radii"
            lead="A 4px grid. Radii stay small: 4px for badges, 6px for controls and cards, pill for filters."
          >
            {spacing ? (
              <TokenTable group={spacing} preview={(name) => <span className={styles.spaceBar} style={{ width: `var(${name})` }} />} />
            ) : null}
            {radii ? (
              <TokenTable
                group={radii}
                preview={(name) => <span className={styles.radiusBox} style={{ borderRadius: `var(${name})` }} />}
              />
            ) : null}
          </Section>

          <Section
            id="elevation"
            title="Elevation"
            lead="Rings instead of borders for controls; soft layered shadows for floating surfaces."
          >
            {elevation ? (
              <TokenTable
                group={elevation}
                preview={(name) => <span className={styles.shadowBox} style={{ boxShadow: `var(${name})` }} />}
              />
            ) : null}
            {motion ? <TokenTable group={motion} /> : null}
          </Section>

          <Section id="layout" title="Layout & breakpoints" lead="Breakpoints are the Dashboard's own, read from its stylesheets.">
            {layout ? <TokenTable group={layout} /> : null}
            {sizes ? <TokenTable group={sizes} /> : null}
            <div className={styles.block}>
              <h3 className={styles.blockTitle}>Breakpoints</h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Query</th>
                    <th scope="col">Behavior</th>
                  </tr>
                </thead>
                <tbody>
                  {BREAKPOINTS.map((breakpoint) => (
                    <tr key={breakpoint.name}>
                      <td>
                        <code>{breakpoint.name}</code>
                      </td>
                      <td>
                        <code className={styles.value}>{breakpoint.query}</code>
                      </td>
                      <td>{breakpoint.behavior}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {COMPONENTS.filter((doc) => doc.id === 'icons').map((doc) => (
            <Section
              key={doc.id}
              id="icons"
              title="Icons"
              lead={`${iconNames.length} glyphs plus card and wallet marks, from packages/icons/svg.`}
            >
              <ComponentEntry doc={doc} iconNames={iconNames} />
            </Section>
          ))}

          {componentGroups.map((group) => (
            <Section key={group} id={`components-${group.toLowerCase()}`} title={group}>
              {COMPONENTS.filter((doc) => doc.group === group && doc.id !== 'icons').map((doc) => (
                <ComponentEntry key={doc.id} doc={doc} iconNames={iconNames} />
              ))}
            </Section>
          ))}

          <Section id="patterns" title="Patterns">
            <div className={styles.cards}>
              <div className={styles.card}>
                <h3>State in the URL</h3>
                <p>
                  Filters, view, search, sort and paging serialize with <code>serializeQuery</code> and parse with <code>parseQuery</code>.
                  Write with replace (not push) and build quick successive updates on the pending query.
                </p>
              </div>
              <div className={styles.card}>
                <h3>Data & caching</h3>
                <p>
                  The list dataset is fetched once, kept in memory and persisted to IndexedDB. Details load per shard on demand and are
                  prefetched on row hover. Static files ship with long-lived cache headers.
                </p>
              </div>
              <div className={styles.card}>
                <h3>Lazy loading</h3>
                <p>
                  Routes, filter panels (<code>next/dynamic</code> / <code>@defer</code>) and below-the-fold detail sections load on demand
                  behind local loading states.
                </p>
              </div>
              <div className={styles.card}>
                <h3>Accessibility</h3>
                <p>
                  Semantic table with <code>aria-sort</code>, focus-managed overlays, tooltips on hover and focus, visible focus rings,
                  <kbd>/</kbd> to search and <kbd>Shift</kbd>+click to multi-sort.
                </p>
              </div>
            </div>
          </Section>

          <Section id="contributing" title="Contributing" lead="Checklist for every pull request.">
            <ol className={styles.list}>
              {CONTRIBUTING_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
          </Section>
        </main>
      </div>
    </div>
  );
}
