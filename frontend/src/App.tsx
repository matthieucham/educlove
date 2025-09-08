import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SearchCriteriaPage from './pages/SearchCriteriaPage';
import ProfilesPage from './pages/ProfilesPage';
import EditProfilePage from './pages/EditProfilePage';
import DashboardPage from './pages/DashboardPage';
import MyMatchesPage from './pages/MyMatchesPage';
import WelcomePage from './pages/WelcomePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Check authentication status on app load
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/search-criteria" element={<SearchCriteriaPage />} />
          <Route path="/profiles" element={<ProfilesPage />} />
          <Route path="/profile/:profileId" element={<ProfilesPage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/my-matches" element={<MyMatchesPage />} />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
