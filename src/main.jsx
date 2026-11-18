import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import {AuthProvider} from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx';
import { PreferencesProvider } from './context/PreferencesContext.jsx';
import { Provider } from 'react-redux'
import { store } from './store/store' 

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <Provider store={store}>
    <PreferencesProvider>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </PreferencesProvider>
  </Provider>
</BrowserRouter>
)