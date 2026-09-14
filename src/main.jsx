import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store.js';
import './index.css'
import App from './App.jsx'
import {AuthProvider} from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx';

createRoot(document.getElementById('root')).render(
<Provider store = {store}>
    <StrictMode>
  <BrowserRouter>
  <ToastProvider>
    <AuthProvider>
      <App />
  </AuthProvider>
  </ToastProvider>
  </BrowserRouter>
  </StrictMode>
</Provider>,
)
