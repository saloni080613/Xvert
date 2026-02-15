import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import UpdatePassword from './pages/UpdatePassword'
import Profile from './pages/Profile'
import History from './pages/History'
import About from './pages/About'
import Footer from './components/Footer'
import MegaFooter from './components/MegaFooter'
import MiniFooter from './components/MiniFooter'
import ScrollToTop from './components/ScrollToTop'
import './styles/index.css'

function AppContent() {
  const location = useLocation();
  const authPaths = ['/login', '/signup', '/forgot-password', '/update-password'];
  const isAuthPage = authPaths.includes(location.pathname);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
        <Route path="/about" element={<About />} />
      </Routes>
      {isAuthPage ? <MiniFooter /> : <MegaFooter />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  )
}

export default App
