import './App.css'
import { BrowserRouter } from "react-router-dom";
import AppRoutes from './routes/AppRoutes';
import { AppProvider } from '@/context/AppContext';
import AmbientSound from './components/AmbientSound';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <AppRoutes />
          <AmbientSound />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
