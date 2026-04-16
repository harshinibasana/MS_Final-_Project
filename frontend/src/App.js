import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout     from './components/common/Layout';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Dashboard  from './pages/Dashboard';
import Trips      from './pages/Trips';
import TripDetail from './pages/TripDetail';
import NewTrip    from './pages/NewTrip';
import Profile    from './pages/Profile';
import Explore    from './pages/Explore';
import Admin       from './pages/Admin';
import SharedTrip  from './pages/SharedTrip';
import TripStats  from './pages/TripStats';
import BucketList from './pages/BucketList';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loader"/></div>;
  return user ? children : <Navigate to="/login" replace/>;
};
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loader"/></div>;
  if (!user) return <Navigate to="/login" replace/>;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace/>;
  return children;
};
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace/> : children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
      <Route path="/login"    element={<PublicRoute><Login/></PublicRoute>}/>
      <Route path="/register" element={<PublicRoute><Register/></PublicRoute>}/>
      <Route path="/" element={<ProtectedRoute><Layout/></ProtectedRoute>}>
        <Route path="dashboard"   element={<Dashboard/>}/>
        <Route path="trips"       element={<Trips/>}/>
        <Route path="trips/new"   element={<NewTrip/>}/>
        <Route path="trips/:id"   element={<TripDetail/>}/>
        <Route path="explore"     element={<Explore/>}/>
        <Route path="profile"     element={<Profile/>}/>
        <Route path="stats"       element={<TripStats/>}/>
        <Route path="bucket-list" element={<BucketList/>}/>
      </Route>
      <Route path="/admin"        element={<AdminRoute><Admin/></AdminRoute>}/>
      <Route path="/shared/:token" element={<SharedTrip/>}/>
      <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes/>
        <Toaster position="top-right" toastOptions={{ style:{ fontFamily:'DM Sans, sans-serif', borderRadius:'12px' } }}/>
      </Router>
    </AuthProvider>
  );
}
