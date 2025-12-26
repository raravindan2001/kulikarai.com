import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, Users, Camera, MessageCircle } from 'lucide-react';

const Landing = () => {
  const { login, API } = useContext(AuthContext);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API}${endpoint}`, formData);
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      login(response.data.token);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warmPaper relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-coral/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-sage/10 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8 flex justify-between items-center"
        >
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-coral" fill="#FF6B6B" />
            <h1 className="text-3xl font-fraunces font-bold text-textPrimary">Kulikari</h1>
          </div>
          <button
            data-testid="auth-toggle-btn"
            onClick={() => setShowAuth(true)}
            className="bg-coral text-white px-8 py-3 rounded-full font-nunito font-semibold hover:bg-[#FF8787] transition-all hover:scale-105"
          >
            Get Started
          </button>
        </motion.header>

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-20 grid lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-fraunces font-bold text-textPrimary leading-tight mb-6">
              Your family's <span className="gradient-text">home</span> on the web
            </h2>
            <p className="text-xl text-textSecondary font-nunito mb-10 leading-relaxed">
              Share photos, chat with loved ones, and keep everyone connected. 
              Kulikari brings your family closer, no matter the distance.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                data-testid="get-started-hero-btn"
                onClick={() => setShowAuth(true)}
                className="bg-coral text-white px-10 py-4 rounded-full font-nunito font-semibold text-lg hover:bg-[#FF8787] transition-all hover:scale-105 shadow-lg"
              >
                Create Family Network
              </button>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.pexels.com/photos/5638677/pexels-photo-5638677.jpeg?auto=compress&cs=tinysrgb&w=800" 
              alt="Happy family" 
              className="rounded-3xl shadow-2xl w-full h-[500px] object-cover"
            />
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-32 mb-20"
        >
          <h3 className="text-4xl font-fraunces font-bold text-center text-textPrimary mb-16">
            Everything your family needs
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Camera, title: 'Photo Sharing', desc: 'Upload and share precious memories with albums, tags, and comments' },
              { icon: MessageCircle, title: 'Live Chat', desc: 'Stay connected with private messages and group conversations' },
              { icon: Users, title: 'Family Tree', desc: 'Visualize your family connections and relationships' },
              { icon: Heart, title: 'Events', desc: 'Plan gatherings, birthdays, and special occasions together' },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="bg-white rounded-3xl p-8 shadow-lg hover-lift"
              >
                <feature.icon className="w-12 h-12 text-coral mb-4" />
                <h4 className="text-xl font-fraunces font-semibold text-textPrimary mb-2">{feature.title}</h4>
                <p className="text-textSecondary font-nunito">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-fraunces font-bold text-textPrimary">
                {isLogin ? 'Welcome Back' : 'Join Kulikari'}
              </h3>
              <button
                data-testid="close-auth-modal-btn"
                onClick={() => setShowAuth(false)}
                className="text-textMuted hover:text-textPrimary"
              >
                ✕
              </button>
            </div>
            <form data-testid="auth-form" onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-nunito font-semibold text-textSecondary mb-2">Name</label>
                  <input
                    data-testid="name-input"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border-transparent focus:border-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all"
                    required={!isLogin}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-nunito font-semibold text-textSecondary mb-2">Email</label>
                <input
                  data-testid="email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border-transparent focus:border-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-textSecondary mb-2">Password</label>
                <input
                  data-testid="password-input"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border-transparent focus:border-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all"
                  required
                />
              </div>
              <button
                data-testid="submit-auth-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-coral text-white py-3 rounded-full font-nunito font-semibold hover:bg-[#FF8787] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>
            <p className="text-center mt-6 text-textSecondary font-nunito">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                data-testid="toggle-auth-mode-btn"
                onClick={() => setIsLogin(!isLogin)}
                className="text-coral font-semibold hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Landing;