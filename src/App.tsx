import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MarketCentrePage from './pages/marketCentre'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/market-centre" replace />} />
        <Route path="/market-centre" element={<MarketCentrePage />} />
        <Route path="*" element={<Navigate to="/market-centre" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
