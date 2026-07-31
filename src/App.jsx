import { Route, Routes } from 'react-router-dom'
/* import ProtectedRoute from './components/ProtectedRoute' */
import LoginPage from './pages/LoginPage'
/* import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import TermsPage from './pages/TermsPage' */

function App() {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
{/*       <Route path='/forgot-password' element={<ForgotPasswordPage />} />
      <Route path='/reset-password' element={<ResetPasswordPage />} />
      <Route path='/terms' element={<TermsPage />} />
      <Route path='/unauthorized' element={<UnauthorizedPage />} />
      <Route
        path='/dashboard'
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      /> */}
    </Routes>
  )
}
export default App