import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'

function App() {
  

  return (
   
<>


  <Routes>
    <Route path= '/login'  element = {<LoginPage/>}/>
    
  </Routes>
</>
  )
}

export default App
