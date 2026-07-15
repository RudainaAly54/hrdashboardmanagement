import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'

function App() {
  

  return (
   
<>
<div className="w-12 h-12 rounded-full border-4 border-gray-300 border-t-blue-600 animate-spin"></div>
 <LoginPage/>
  <Routes>
    <Route path= '/login'  element = {<LoginPage/>}/>
    
  </Routes>
</>
  )
}

export default App
