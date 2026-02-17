import { useState } from 'react'
import MarketingHero from './components/marketing/MarketingHero'
import MarketingToolsPanel from './components/marketing/MarketingToolsPanel'
import { toolSections } from './components/marketing/data'
import type { ToolCard } from './components/marketing/types'
import VouchersPage from './components/vouchers/VouchersPage'
import CreateVoucherPage from './components/vouchers/create/CreateVoucherPage'

type AppView = 'marketing' | 'vouchers' | 'create-voucher'

function App() {
  const [activeView, setActiveView] = useState<AppView>('marketing')
  const appBackground =
    activeView === 'vouchers' || activeView === 'create-voucher'
      ? 'bg-[linear-gradient(180deg,_#F0F9FF_0%,_#FFFFFF_70%)]'
      : 'bg-[radial-gradient(circle_at_top,_#ffe7db_0%,_#f9fbff_42%,_#edf3fb_100%)]'

  const handleToolSelect = (tool: ToolCard) => {
    if (tool.id === 'vouchers') {
      setActiveView('vouchers')
    }
  }

  return (
    <div className={`min-h-screen ${appBackground} pb-16 pt-10 text-slate-900`}>
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
          <>
            {activeView === 'vouchers' ? (
              <VouchersPage
                onBack={() => setActiveView('marketing')}
                onCreate={() => setActiveView('create-voucher')}
              />
            ) : (
              <CreateVoucherPage onBack={() => setActiveView('vouchers')} />
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
