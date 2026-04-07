import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/layouts/Header";
import Footer from "./components/layouts/Footer";
import RegisterPage from "./components/pages/RegisterPage";
import { AuthProvider } from "./components/AuthContext";
import HomePage from "./components/pages/HomePage";
import BookingPage from "./components/pages/BookingPage";
import BookingListPage from "./components/pages/BookingListPage";
import BookingDetailPage from "./components/pages/BookingDetailPage";
import LatestBookingDetailPage from "./components/pages/LatestBookingDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./components/pages/LoginPage";
import MomoReturnPage from "./components/pages/MomoReturnPage";
import VnpayReturnPage from "./components/pages/VnpayReturnPage";
import VoucherPage from "./components/pages/VoucherPage";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminLayout from "./components/layouts/AdminLayout";
import AdminDashboard from "./components/pages/admin/AdminDashboard";
import BookingManagement from "./components/pages/admin/BookingManagement";
import UserManagement from "./components/pages/admin/UserManagement";
import ServiceManagement from "./components/pages/admin/ServiceManagement";

function MainLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
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
              <MainLayout>
                <HomePage />
              </MainLayout>
            }
          />
          <Route
            path="/booking"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <BookingPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <BookingListPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/details/latest"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <LatestBookingDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/details/:bookingId"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <BookingDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/momo/return"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MomoReturnPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/vnpay/return"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <VnpayReturnPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vouchers"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <VoucherPage />
                </MainLayout>
              </ProtectedRoute>
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
            <Route path="bookings" element={<BookingManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="services" element={<ServiceManagement />} />
          </Route>
          <Route
            path="*"
            element={
              <MainLayout>
                <div className="container py-5 text-center">
                  <h2 className="mb-3">Trang không tồn tại</h2>
                  <p className="text-muted mb-0">
                    Đường dẫn bạn truy cập chưa được cấu hình trong ứng dụng.
                  </p>
                </div>
              </MainLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
