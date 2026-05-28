import './App.css'
import { BrowserRouter } from "react-router-dom";
import AppRoutes from './routes/AppRoutes';
import { AppProvider } from '@/context/AppContext';
import AmbientSound from './components/AmbientSound';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
        <AmbientSound />
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
