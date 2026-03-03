// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import CreateContract from "./pages/CreateContract";
import BilingualContract from "./pages/BilingualContract";
import Archive from "./pages/Archive";
import Drafts from "./pages/Drafts";
import Counterparties from "./pages/Counterparties";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { userProfile } = useAuth();
  return userProfile?.isAdmin ? children : <Navigate to="/dashboard" />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Private */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/create" element={<PrivateRoute><CreateContract /></PrivateRoute>} />
      <Route path="/create/bilingual" element={<PrivateRoute><BilingualContract /></PrivateRoute>} />
      <Route path="/archive" element={<PrivateRoute><Archive /></PrivateRoute>} />
      <Route path="/drafts" element={<PrivateRoute><Drafts /></PrivateRoute>} />
      <Route path="/counterparties" element={<PrivateRoute><Counterparties /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" toastOptions={{
          style: { background: "#1a1033", color: "#F0EDFF", border: "1px solid rgba(255,255,255,0.1)" }
        }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
