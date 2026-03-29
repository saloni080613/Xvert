import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeContext'
import { ToastProvider } from './components/ToastContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import UpdatePassword from './pages/UpdatePassword'
import Profile from './pages/Profile'
import History from './pages/History'
import About from './pages/About'
import DeveloperPortal from './pages/DeveloperPortal'
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
        <Route path="/developer" element={<DeveloperPortal />} />
      </Routes>
      {isAuthPage ? <MiniFooter /> : <MegaFooter />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/history" element={<History />} />
              <Route path="/developer" element={<DeveloperPortal />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
