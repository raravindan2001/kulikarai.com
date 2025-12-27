import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  LogOut, User, Bell, Shield, HelpCircle, 
  BookOpen, Palette, Gamepad2, Trophy, Award,
  Heart, UtensilsCrossed, Flower2, Sun, Users
} from 'lucide-react';

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
    { icon: HelpCircle, title: 'Help & Support', desc: 'Get help with Kulikarai', link: '#' },
  ];

  const contentSections = [
    { icon: Users, title: 'Family Tree', desc: 'View and manage your family tree', link: '/family-tree', color: 'from-blue-500 to-purple-500', emoji: '🌳' },
    { icon: Sun, title: 'Divine Updates', desc: 'Spiritual and religious updates', link: '/divine-updates', color: 'from-yellow-500 to-orange-500', emoji: '🙏' },
    { icon: Sun, title: 'Perumal Utsavam', desc: 'Temple festivals and events', link: '/perumal-utsavam', color: 'from-amber-500 to-yellow-500', emoji: '🛕' },
    { icon: Heart, title: 'Home Remedies', desc: 'Traditional home remedies', link: '/home-remedies', color: 'from-green-500 to-emerald-500', emoji: '🌿' },
    { icon: UtensilsCrossed, title: 'Cooking Tips', desc: 'Family recipes and cooking tips', link: '/cooking-tips', color: 'from-orange-500 to-red-500', emoji: '👨‍🍳' },
    { icon: Flower2, title: 'Kolam Tips', desc: 'Traditional kolam patterns', link: '/kolam-tips', color: 'from-pink-500 to-rose-500', emoji: '🎨' },
    { icon: BookOpen, title: 'Book Reviews', desc: 'Share and discover books', link: '/book-reviews', color: 'from-indigo-500 to-purple-500', emoji: '📚' },
    { icon: Palette, title: 'Hobbies', desc: 'Share your hobbies and interests', link: '/hobbies', color: 'from-teal-500 to-cyan-500', emoji: '🎭' },
    { icon: Gamepad2, title: 'Gaming Space', desc: 'Online gaming discussions', link: '/gaming-space', color: 'from-violet-500 to-fuchsia-500', emoji: '🎮' },
    { icon: Trophy, title: 'Tournaments', desc: 'Family internal tournaments', link: '/tournaments', color: 'from-amber-500 to-orange-500', emoji: '🏆' },
    { icon: Award, title: 'Well Done', desc: 'Appreciate family members', link: '/well-done', color: 'from-rose-500 to-pink-500', emoji: '👏' },
  ];

  return (
    <Layout>
      <div data-testid="settings-page" className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-4xl font-fraunces font-bold text-gray-100 mb-8">Settings & Sections</h1>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 border border-gray-700 rounded-3xl p-6 shadow-lg mb-8"
        >
          <div className="flex items-center space-x-4">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-500"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-fraunces font-bold text-gray-100">{user?.name}</h2>
              <p className="text-gray-400 font-nunito">{user?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Content Sections */}
        <h2 className="text-2xl font-fraunces font-bold text-gray-100 mb-4">Browse Sections</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {contentSections.map((section, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => navigate(section.link)}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg hover:scale-105 transition-all text-center group"
            >
              <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-br ${section.color} flex items-center justify-center text-white text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                {section.emoji}
              </div>
              <h3 className="font-nunito font-semibold text-gray-100 text-sm mb-1">{section.title}</h3>
              <p className="text-gray-500 text-xs">{section.desc}</p>
            </motion.button>
          ))}
        </div>

        {/* Settings Options */}
        <h2 className="text-2xl font-fraunces font-bold text-gray-100 mb-4">Account Settings</h2>
        <div className="space-y-3 mb-8">
          {settingsOptions.map((option, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => option.link !== '#' && navigate(option.link)}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg hover:bg-gray-750 transition-all text-left flex items-center space-x-4"
            >
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-amber-400">
                <option.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-nunito font-semibold text-gray-100">{option.title}</h3>
                <p className="text-gray-500 text-sm">{option.desc}</p>
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
          className="w-full bg-red-600 text-white rounded-2xl p-4 shadow-lg hover:bg-red-700 transition-all flex items-center justify-center space-x-3 font-nunito font-semibold"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </motion.button>
      </div>
    </Layout>
  );
};

export default Settings;