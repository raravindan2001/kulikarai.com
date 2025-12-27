import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Sparkles, Plus, Search, Trash2 } from 'lucide-react';

const KolamTips = () => {
  const { user, API } = useContext(AuthContext);
  const [tips, setTips] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ title: '', difficulty: 'easy', description: '', dots_pattern: '', image_url: '' });
  const [loading, setLoading] = useState(false);

  const difficulties = ['easy', 'medium', 'hard', 'expert'];

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      const response = await axios.get(`${API}/kolam-tips`);
      setTips(response.data);
    } catch (error) {
      console.error('Failed to fetch kolam tips:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/kolam-tips`, formData);
      toast.success('Kolam tip added!');
      setFormData({ title: '', difficulty: 'easy', description: '', dots_pattern: '', image_url: '' });
      setShowCreate(false);
      fetchTips();
    } catch (error) {
      toast.error('Failed to add kolam tip');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this kolam tip?')) return;
    try {
      await axios.delete(`${API}/kolam-tips/${id}`);
      toast.success('Kolam tip deleted');
      fetchTips();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredTips = tips.filter(t =>
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const difficultyColors = {
    easy: 'bg-green-600', medium: 'bg-yellow-600', hard: 'bg-orange-600', expert: 'bg-red-600'
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-fraunces font-bold text-amber-100 flex items-center space-x-3">
            <span>🎨</span>
            <span>Kolam Tips</span>
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-3 rounded-full font-semibold hover:from-pink-700 hover:to-rose-700 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Kolam</span>
          </button>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search kolam patterns..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-stone-800 border-2 border-amber-700/50 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-pink-900/30 backdrop-blur-sm border-2 border-pink-700/50 rounded-3xl p-6 mb-8 shadow-xl"
          >
            <h3 className="text-xl font-fraunces font-bold text-amber-100 mb-4">Share Kolam Pattern</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Kolam Name *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                    placeholder="e.g., Padi Kolam"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 focus:border-amber-500 focus:outline-none transition-all"
                  >
                    {difficulties.map(d => (
                      <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Dots Pattern</label>
                <input
                  type="text"
                  value={formData.dots_pattern}
                  onChange={(e) => setFormData({ ...formData, dots_pattern: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                  placeholder="e.g., 5x5 pulli, 7x1 sikku"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all resize-none"
                  rows={4}
                  placeholder="Step by step instructions to draw this kolam..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Image URL (optional)</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                  placeholder="https://example.com/kolam-image.jpg"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-8 py-3 rounded-full font-semibold hover:from-pink-700 hover:to-rose-700 transition-all disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Adding...' : 'Add Kolam Tip'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTips.map((tip, idx) => (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gradient-to-br from-pink-900/40 to-rose-900/30 backdrop-blur-sm border-2 border-pink-700/50 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-transform"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">🎨</span>
                {tip.user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(tip.id)}
                    className="text-amber-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {tip.image_url && (
                <img 
                  src={tip.image_url} 
                  alt={tip.title} 
                  className="w-full h-40 object-cover rounded-xl mb-4"
                />
              )}
              <h3 className="text-xl font-fraunces font-bold text-amber-100 mb-2">{tip.title}</h3>
              <div className="flex items-center gap-2 mb-3">
                <span className={`${difficultyColors[tip.difficulty]} text-white px-3 py-1 rounded-full text-xs capitalize`}>
                  {tip.difficulty}
                </span>
                {tip.dots_pattern && (
                  <span className="bg-pink-600/50 text-pink-200 px-3 py-1 rounded-full text-xs">
                    {tip.dots_pattern}
                  </span>
                )}
              </div>
              <p className="text-amber-200/90 text-sm leading-relaxed">{tip.description}</p>
              <p className="text-amber-400/60 text-xs mt-4">Shared by {tip.user_name}</p>
            </motion.div>
          ))}
        </div>

        {filteredTips.length === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🎨</span>
            <p className="text-amber-200 text-lg mb-4">
              {searchTerm ? 'No kolam patterns found' : 'No kolam patterns yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-pink-700 transition-all"
              >
                Add First Kolam
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default KolamTips;
