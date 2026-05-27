import './App.css'
import { BrowserRouter } from "react-router-dom";
import AppRoutes from './routes/AppRoutes';
import { AppProvider } from '@/context/AppContext';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
