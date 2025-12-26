import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, Users, Camera, MessageCircle, Volume2, VolumeX } from 'lucide-react';

const Landing = () => {
  const { login, API } = useContext(AuthContext);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [voicePlayed, setVoicePlayed] = useState(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  // Function to play welcome voice message
  const playWelcomeVoice = () => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance('Welcome to Kulikari Family');
      
      // Configure voice settings
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.1; // Slightly higher pitch for warmth
      utterance.volume = 0.8; // 80% volume
      
      // Try to use a female voice if available
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Google UK English Female')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.onstart = () => {
        setIsVoicePlaying(true);
      };
      
      utterance.onend = () => {
        setIsVoicePlaying(false);
        setVoicePlayed(true);
      };
      
      utterance.onerror = () => {
        setIsVoicePlaying(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Initialize voices
  React.useEffect(() => {
    if ('speechSynthesis' in window) {
      // Load voices
      window.speechSynthesis.getVoices();
      
      // Some browsers need this event
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Auto-play voice after a delay
  React.useEffect(() => {
    if (!voicePlayed) {
      const timer = setTimeout(() => {
        playWelcomeVoice();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [voicePlayed]);

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

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsMusicPlaying(true);
          setMusicInitialized(true);
        }).catch(err => {
          console.log('Play failed:', err);
        });
      }
    }
  };

  // Handle page click to start music if not playing
  const handlePageClick = () => {
    if (!musicInitialized && audioRef.current) {
      audioRef.current.play().then(() => {
        setIsMusicPlaying(true);
        setMusicInitialized(true);
      }).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 relative overflow-hidden" onClick={handlePageClick}>
      {/* Background music - Soothing Violin Melody */}
      <audio 
        ref={audioRef}
        loop 
        className="hidden"
        preload="auto"
      >
        <source src="https://cdn.pixabay.com/audio/2022/10/26/audio_24593e2af8.mp3" type="audio/mpeg" />
        <source src="https://assets.mixkit.co/active_storage/sfx/2490/2490-preview.mp3" type="audio/mpeg" />
        <source src="https://cdn.pixabay.com/audio/2023/02/28/audio_01b702e6b7.mp3" type="audio/mpeg" />
      </audio>
      
      {/* Music Control Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMusic();
        }}
        className="fixed top-24 right-8 z-50 bg-yellow-500/90 backdrop-blur-sm text-blue-900 p-3 rounded-full shadow-xl hover:bg-yellow-400 transition-all hover:scale-110 group"
        title={isMusicPlaying ? "Pause Music" : "Play Music"}
      >
        {isMusicPlaying ? (
          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5" />
            <span className="hidden group-hover:inline-block text-xs font-semibold pr-2">Pause</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 animate-pulse">
            <VolumeX className="w-5 h-5" />
            <span className="hidden group-hover:inline-block text-xs font-semibold pr-2">Play</span>
          </div>
        )}
      </button>
      
      {/* Music Prompt - Shows if not playing */}
      {!isMusicPlaying && !musicInitialized && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2 }}
          className="fixed top-40 right-8 z-40 bg-yellow-500 text-blue-900 px-4 py-3 rounded-2xl shadow-xl text-sm font-nunito font-semibold cursor-pointer hover:bg-yellow-400 transition-all"
          onClick={toggleMusic}
        >
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Click to enable violin melody 🎻</span>
          </div>
        </motion.div>
      )}
      
      {/* Music Info Badge */}
      {isMusicPlaying && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-40 right-8 z-40 bg-blue-950/80 backdrop-blur-sm text-yellow-400 px-4 py-2 rounded-full shadow-lg text-xs font-nunito"
        >
          🎻 Soothing Violin Melody
        </motion.div>
      )}
      
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-300/5 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8 flex justify-between items-center"
        >
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-yellow-400" fill="#FBBF24" />
            <h1 className="text-3xl font-fraunces font-bold text-white">Kulikari</h1>
          </div>
          <button
            data-testid="auth-toggle-btn"
            onClick={() => setShowAuth(true)}
            className="bg-yellow-500 text-blue-900 px-8 py-3 rounded-full font-nunito font-semibold hover:bg-yellow-400 transition-all hover:scale-105 shadow-lg"
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
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-fraunces font-bold text-white leading-tight mb-6">
              Your family's <span className="text-yellow-400">divine home</span> on the web
            </h2>
            <p className="text-xl text-blue-100 font-nunito mb-10 leading-relaxed">
              Share photos, chat with loved ones, and keep everyone connected. 
              Kulikari brings your family closer, no matter the distance.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                data-testid="get-started-hero-btn"
                onClick={() => setShowAuth(true)}
                className="bg-yellow-500 text-blue-900 px-10 py-4 rounded-full font-nunito font-semibold text-lg hover:bg-yellow-400 transition-all hover:scale-105 shadow-xl"
              >
                Create Family Network
              </button>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://customer-assets.emergentagent.com/job_family-moments-11/artifacts/8k2sbwz2_oppiliappan-39-1.jpg" 
              alt="Divine blessings for your family" 
              className="rounded-3xl shadow-2xl w-full h-[500px] object-cover border-4 border-yellow-400/30"
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
          <h3 className="text-4xl font-fraunces font-bold text-center text-white mb-16">
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
                className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-lg hover-lift border border-white/20"
              >
                <feature.icon className="w-12 h-12 text-yellow-400 mb-4" />
                <h4 className="text-xl font-fraunces font-semibold text-white mb-2">{feature.title}</h4>
                <p className="text-blue-100 font-nunito">{feature.desc}</p>
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