import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { LogOut, User, Bell, Shield, HelpCircle } from 'lucide-react';

const Settings = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const settingsOptions = [
    { icon: User, title: 'Profile Settings', desc: 'Manage your account details', link: '/profile' },
    { icon: Bell, title: 'Notifications', desc: 'Configure notification preferences', link: '#' },
    { icon: Shield, title: 'Privacy & Security', desc: 'Control your privacy settings', link: '#' },
    { icon: HelpCircle, title: 'Help & Support', desc: 'Get help with Kulikari', link: '#' },
  ];

  return (
    <Layout>
      <div data-testid="settings-page" className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-4xl font-fraunces font-bold text-textPrimary mb-8">Settings</h1>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-coral to-sunshine flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-fraunces font-bold text-textPrimary">{user?.name}</h2>
              <p className="text-textSecondary font-nunito">{user?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Settings Options */}
        <div className="space-y-4 mb-6">
          {settingsOptions.map((option, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => option.link !== '#' && navigate(option.link)}
              className="w-full bg-white rounded-2xl p-6 shadow-lg hover-lift text-left flex items-center space-x-4"
            >
              <div className="w-12 h-12 rounded-full bg-warmPaper flex items-center justify-center text-coral">
                <option.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-nunito font-semibold text-textPrimary mb-1">{option.title}</h3>
                <p className="text-textSecondary text-sm">{option.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleLogout}
          data-testid="logout-btn"
          className="w-full bg-coral text-white rounded-2xl p-6 shadow-lg hover:bg-[#FF8787] transition-all flex items-center justify-center space-x-3 font-nunito font-semibold"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </motion.button>
      </div>
    </Layout>
  );
};

export default Settings;