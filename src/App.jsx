import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import EmpDetails from './pages/EmpDetails'
import Departments from './pages/Departments'
import DepartmentDetails from './pages/DepartmentsDetails'
import Attendance from './pages/Attendance'
import LeaveRequest from './pages/LeaveRequest'
import Payroll from './pages/Payroll'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Layout from './components/Layout'
/* import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import TermsPage from './pages/TermsPage' */

function App() {
  return (
    <main className='bg-[#f9f9f8] max-w-screen h-screen'>
      <Routes>
      {/* Login Route */}
      <Route path='/' element={<LoginPage />} />
      {/* <Route path='/forgot-password' element={<ForgotPasswordPage />} />
      <Route path='/reset-password' element={<ResetPasswordPage />} />
      <Route path='/terms' element={<TermsPage />} />
      <Route path='/unauthorized' element={<UnauthorizedPage />} /> */}

      {/* Protected Routes — ProtectedRoute guards everything nested below, once */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/employees' element={<Employees />} />
        <Route path = '/employees/empDetails/:id' element = {<EmpDetails/>}/>
        <Route path='/departments' element={<Departments />} />
        <Route path = '/departments/deptDetails/:id' element ={<DepartmentDetails/>}/>
        <Route path='/attendance' element={<Attendance />} />
        <Route path='/leave-request' element={<LeaveRequest />} />
        <Route path='/payroll' element={<Payroll />} />
        <Route path='/reports' element={<Reports />} />
        <Route path='/settings' element={<Settings />} />
      </Route>
    </Routes>
    </main>
  )
}
export default App