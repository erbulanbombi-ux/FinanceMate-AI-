import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Forecast from './pages/Forecast';
import Insights from './pages/Insights';
import Simulator from './pages/Simulator';
import Chat from './pages/Chat';
import './App.css';

function RequireAuth({ children }) {
  const { currentUser, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-300 flex items-center justify-center">
        Restoring your session...
      </div>
    );
  }
  return currentUser ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/chat" element={<Chat />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
