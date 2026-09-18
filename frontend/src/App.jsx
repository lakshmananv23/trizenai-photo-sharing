import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import TeamDashboard from "./pages/TeamDashboard";
import CreateEvent from "./pages/CreateEvent";

import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import CustomerGallery from "./pages/CustomerGallery";
import Home from "./pages/Home";

function App() {
  return (
    <AuthProvider>

      <BrowserRouter>

        <Routes>

          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Create Event */}
          <Route
            path="/admin/create-event"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <CreateEvent />
              </ProtectedRoute>
            }
          />

          {/* Team Dashboard */}
          <Route
            path="/team"
            element={
              <ProtectedRoute allowedRole="TEAM_MEMBER">
                <TeamDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/gallery" element={<CustomerGallery />} />

        </Routes>

      </BrowserRouter>

    </AuthProvider>
  );
}

export default App;