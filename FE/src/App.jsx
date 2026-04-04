import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layouts/Header';
import Footer from './components/layouts/Footer';
import RegisterPage from './components/pages/RegisterPage';
import { AuthProvider } from './components/AuthContext';
import HomePage from './components/pages/HomePage';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/pages/LoginPage';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminLayout from './components/layouts/AdminLayout';
import AdminDashboard from './components/pages/admin/AdminDashboard';

function About() {
  return <h1>About Page</h1>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <>
                <Header />
                <HomePage />
                <Footer />
              </>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;