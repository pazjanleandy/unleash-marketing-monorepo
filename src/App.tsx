import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MarketCentrePage from './pages/marketCentre'
import LoginPage from './pages/login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/market-centre" element={<MarketCentrePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
