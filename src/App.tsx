import { useEffect } from 'react'
import { GROUPS } from './data/rules'
import { cls } from './lib/labels'
import { link, useRoute } from './lib/router'
import { Catalog } from './pages/Catalog'
import { Home } from './pages/Home'
import { Runner } from './pages/Runner'
import type { GroupId } from './types'

const asGroup = (value?: string) => GROUPS.find((g) => g.id === value)?.id as GroupId | undefined

export function App() {
  const route = useRoute()
  const [page, param] = route
  const group = asGroup(param)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page, param])

  let content = <Home />
  if (page === 'regeln') content = <Catalog group={group} />
  else if (page === 'ueben' && group) content = <Runner key={`learn-${group}`} mode="learn" group={group} />
  else if (page === 'test') content = <Runner key="test" mode="test" />

  const nav = [
    { label: 'Start', href: link(), active: !page || page === 'ueben' },
    { label: 'Regelkatalog', href: link('regeln'), active: page === 'regeln' },
    { label: 'Test', href: link('test'), active: page === 'test' },
  ]

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href={link()}>
            <svg viewBox="0 0 32 22" width="28" height="19" aria-hidden="true">
              <polygon className="brand-mark" points="1,11 8,1 24,1 31,11 24,21 8,21" />
            </svg>
            EPK-Trainer
          </a>
          <nav aria-label="Hauptnavigation">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cls(item.active && 'is-active')}
                aria-current={item.active ? 'page' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main>{content}</main>
      <footer className="footer">
        Regelsammlung nach Prof. Dr. Frank Lehmann, Vorlesung Prozessmodellierung, DHBW Ravensburg, bzw. Lehmann:
        Integrierte Prozessmodellierung mit ARIS, dpunkt.verlag 2008. Studentisches Semesterprojekt.
      </footer>
    </div>
  )
}
