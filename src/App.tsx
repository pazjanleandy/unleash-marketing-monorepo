import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MarketCentrePage from './pages/marketCentre'
import LoginPage from './pages/login'
import SignUpPage from './pages/signup'
import ShopDemoPage from './pages/shopDemo'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/marketing-centre" element={<MarketCentrePage />} />
        <Route path="/market-centre" element={<MarketCentrePage />} />
        <Route path="/shop-demo" element={<ShopDemoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
