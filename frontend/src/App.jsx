import { Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Header, Footer } from './components/Layout/Header';
import { AnimatedBg, FloatingElements } from './components/common';
import { HeroIntro } from './components/common/HeroIntro';
import { Home } from './components/Home/Home';
import { LoginPage } from './components/Auth/LoginPage';
import { RequireAuth } from './components/Auth/RequireAuth';
import { HistoryPage } from './components/History/HistoryPage';
import { AdminPage } from './components/Admin/AdminPage';
import { DashboardRoute } from './components/Dashboard/DashboardRoute';

import { useAuth } from './hooks/useAuth';

function App() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <>
      <AnimatedBg />
      <Header />
      
      {location.pathname === '/login' && <HeroIntro />}
      {user && location.pathname !== '/login' && <FloatingElements />}

      {/* Main Website */}
      <motion.div 
        className="app relative z-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5 }}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          } />

          <Route path="/history" element={
            <RequireAuth allowedRoles={['officer', 'supervisor', 'admin', 'auditor']}>
              <HistoryPage />
            </RequireAuth>
          } />

          <Route path="/dashboard/:id" element={
            <RequireAuth allowedRoles={['officer', 'supervisor', 'admin', 'auditor']}>
              <DashboardRoute />
            </RequireAuth>
          } />

          <Route path="/admin" element={
            <RequireAuth allowedRoles={['admin', 'supervisor']}>
              <AdminPage />
            </RequireAuth>
          } />
        </Routes>

        <Footer />
      </motion.div>
    </>
  );
}

export default App;
