import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Palette, Plus, Search, Trash2 } from 'lucide-react';

const Hobbies = () => {
  const { user, API } = useContext(AuthContext);
  const [hobbies, setHobbies] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ title: '', category: 'general', description: '', skill_level: 'beginner' });
  const [loading, setLoading] = useState(false);

  const categories = ['general', 'arts', 'sports', 'music', 'crafts', 'outdoor', 'technology', 'cooking', 'gardening', 'reading'];
  const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

  useEffect(() => {
    fetchHobbies();
  }, []);

  const fetchHobbies = async () => {
    try {
      const response = await axios.get(`${API}/hobbies`);
      setHobbies(response.data);
    } catch (error) {
      console.error('Failed to fetch hobbies:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/hobbies`, formData);
      toast.success('Hobby shared!');
      setFormData({ title: '', category: 'general', description: '', skill_level: 'beginner' });
      setShowCreate(false);
      fetchHobbies();
    } catch (error) {
      toast.error('Failed to add hobby');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hobby?')) return;
    try {
      await axios.delete(`${API}/hobbies/${id}`);
      toast.success('Hobby deleted');
      fetchHobbies();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredHobbies = hobbies.filter(h =>
    h.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryEmojis = {
    general: '🎯', arts: '🎨', sports: '⚽', music: '🎵', crafts: '✂️',
    outdoor: '🏕️', technology: '💻', cooking: '👨‍🍳', gardening: '🌱', reading: '📚'
  };

  const skillColors = {
    beginner: 'bg-green-600', intermediate: 'bg-blue-600', advanced: 'bg-purple-600', expert: 'bg-red-600'
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-fraunces font-bold text-amber-100 flex items-center space-x-3">
            <span>🎨</span>
            <span>Hobbies</span>
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-3 rounded-full font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Share Hobby</span>
          </button>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search hobbies..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-stone-800 border-2 border-amber-700/50 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-teal-900/30 backdrop-blur-sm border-2 border-teal-700/50 rounded-3xl p-6 mb-8 shadow-xl"
          >
            <h3 className="text-xl font-fraunces font-bold text-amber-100 mb-4">Share Your Hobby</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Hobby Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                    placeholder="e.g., Photography"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 focus:border-amber-500 focus:outline-none transition-all"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{categoryEmojis[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Skill Level</label>
                <select
                  value={formData.skill_level}
                  onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 focus:border-amber-500 focus:outline-none transition-all"
                >
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all resize-none"
                  rows={4}
                  placeholder="Tell us about your hobby..."
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-8 py-3 rounded-full font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Sharing...' : 'Share Hobby'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHobbies.map((hobby, idx) => (
            <motion.div
              key={hobby.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gradient-to-br from-teal-900/40 to-cyan-900/30 backdrop-blur-sm border-2 border-teal-700/50 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-transform"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">{categoryEmojis[hobby.category] || '🎯'}</span>
                {hobby.user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(hobby.id)}
                    className="text-amber-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h3 className="text-xl font-fraunces font-bold text-amber-100 mb-2">{hobby.title}</h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-teal-600/50 text-teal-200 px-3 py-1 rounded-full text-xs capitalize">
                  {hobby.category}
                </span>
                <span className={`${skillColors[hobby.skill_level]} text-white px-3 py-1 rounded-full text-xs capitalize`}>
                  {hobby.skill_level}
                </span>
              </div>
              <p className="text-amber-200/90 text-sm leading-relaxed">{hobby.description}</p>
              <p className="text-amber-400/60 text-xs mt-4">Shared by {hobby.user_name}</p>
            </motion.div>
          ))}
        </div>

        {filteredHobbies.length === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🎨</span>
            <p className="text-amber-200 text-lg mb-4">
              {searchTerm ? 'No hobbies found' : 'No hobbies shared yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-teal-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-teal-700 transition-all"
              >
                Share First Hobby
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Hobbies;
