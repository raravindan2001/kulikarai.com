import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { Home, Image, MessageCircle, Calendar, Users, Settings, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout = ({ children }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/home', testId: 'nav-home' },
    { icon: Image, label: 'Photos', path: '/photos', testId: 'nav-photos' },
    { icon: MessageCircle, label: 'Messages', path: '/messages', testId: 'nav-messages' },
    { icon: Calendar, label: 'Events', path: '/events', testId: 'nav-events' },
    { icon: Users, label: 'Family', path: '/family-tree', testId: 'nav-family' },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-warmPaper noise-bg">
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button
              data-testid="logo-btn"
              onClick={() => navigate('/home')}
              className="flex items-center space-x-2"
            >
              <Heart className="w-7 h-7 text-coral" fill="#FF6B6B" />
              <span className="text-2xl font-fraunces font-bold text-textPrimary">Kulikarai</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  data-testid={item.testId}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full font-nunito font-semibold transition-all ${
                    isActive(item.path)
                      ? 'bg-coral text-white'
                      : 'text-textSecondary hover:text-coral hover:bg-warmPaper'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Profile */}
            <button
              data-testid="profile-btn"
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <span className="hidden sm:block font-nunito font-semibold text-amber-100">{user?.name}</span>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold border-2 border-amber-500">
                  {user?.name?.charAt(0)}
                </div>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50">
        <div className="flex justify-around items-center h-16 px-4">
          {navItems.map((item) => (
            <button
              key={item.path}
              data-testid={`${item.testId}-mobile`}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center space-y-1 transition-colors ${
                isActive(item.path) ? 'text-coral' : 'text-textMuted'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-nunito font-medium">{item.label}</span>
            </button>
          ))}
          <button
            data-testid="settings-btn-mobile"
            onClick={() => navigate('/settings')}
            className={`flex flex-col items-center space-y-1 transition-colors ${
              isActive('/settings') ? 'text-coral' : 'text-textMuted'
            }`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-nunito font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Spacing for mobile nav */}
      <div className="md:hidden h-16"></div>
    </div>
  );
};

export default Layout;