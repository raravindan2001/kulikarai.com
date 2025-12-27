import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

// Pages
import Landing from './pages/Landing';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Photos from './pages/Photos';
import PhotoDetail from './pages/PhotoDetail';
import Messages from './pages/Messages';
import Events from './pages/Events';
import FamilyTree from './pages/FamilyTree';
import FamilyTreeNew from './pages/FamilyTreeNew';
import Settings from './pages/Settings';
import HomeRemedies from './pages/HomeRemedies';
import CookingTips from './pages/CookingTips';
import DivineUpdates from './pages/DivineUpdates';
import BookReviews from './pages/BookReviews';
import Hobbies from './pages/Hobbies';
import GamingSpace from './pages/GamingSpace';
import Tournaments from './pages/Tournaments';
import WellDone from './pages/WellDone';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-2xl font-semibold text-amber-400">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, API }}>
      <div className="App min-h-screen bg-black noise-bg">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={!user ? <Landing /> : <Navigate to="/home" />} />
            <Route path="/home" element={user ? <Home /> : <Navigate to="/" />} />
            <Route path="/profile/:userId?" element={user ? <Profile /> : <Navigate to="/" />} />
            <Route path="/photos" element={user ? <Photos /> : <Navigate to="/" />} />
            <Route path="/photos/:photoId" element={user ? <PhotoDetail /> : <Navigate to="/" />} />
            <Route path="/messages/:conversationId?" element={user ? <Messages /> : <Navigate to="/" />} />
            <Route path="/events" element={user ? <Events /> : <Navigate to="/" />} />
            <Route path="/family-tree" element={user ? <FamilyTree /> : <Navigate to="/" />} />
            <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" />
      </div>
    </AuthContext.Provider>
  );
}

export default App;