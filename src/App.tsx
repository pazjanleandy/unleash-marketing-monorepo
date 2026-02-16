import { useState } from 'react'
import MarketingHero from './components/marketing/MarketingHero'
import MarketingToolsPanel from './components/marketing/MarketingToolsPanel'
import { toolSections } from './components/marketing/data'
import type { ToolCard } from './components/marketing/types'
import VouchersPage from './components/vouchers/VouchersPage'

type AppView = 'marketing' | 'vouchers'

function App() {
  const [activeView, setActiveView] = useState<AppView>('marketing')

  const handleToolSelect = (tool: ToolCard) => {
    if (tool.id === 'vouchers') {
      setActiveView('vouchers')
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffe7db_0%,_#f9fbff_42%,_#edf3fb_100%)] pb-16 pt-10 text-slate-900">
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {activeView === 'marketing' ? (
          <>
            <MarketingHero />
            <MarketingToolsPanel
              sections={toolSections}
              onToolSelect={handleToolSelect}
            />
          </>
        ) : (
          <VouchersPage onBack={() => setActiveView('marketing')} />
        )}
      </main>
    </div>
  )
}

export default App
