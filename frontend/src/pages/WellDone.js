import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Award, Plus, Search, Trash2, Heart, Star } from 'lucide-react';

const WellDone = () => {
  const { user, API } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ recipient_name: '', title: '', description: '', category: 'general' });
  const [loading, setLoading] = useState(false);

  const categories = ['general', 'academic', 'sports', 'arts', 'career', 'kindness', 'milestone', 'other'];
  const categoryEmojis = {
    general: '⭐', academic: '📚', sports: '🏅', arts: '🎨', career: '💼', kindness: '💖', milestone: '🎯', other: '✨'
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API}/well-done`);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.recipient_name || !formData.title || !formData.description) {
      toast.error('Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/well-done`, formData);
      toast.success('Appreciation posted!');
      setFormData({ recipient_name: '', title: '', description: '', category: 'general' });
      setShowCreate(false);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to post appreciation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appreciation?')) return;
    try {
      await axios.delete(`${API}/well-done/${id}`);
      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredPosts = posts.filter(p =>
    p.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-fraunces font-bold text-amber-100 flex items-center space-x-3">
            <span>👏</span>
            <span>Well Done!</span>
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-gradient-to-r from-rose-600 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:from-rose-700 hover:to-pink-700 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Appreciate Someone</span>
          </button>
        </div>

        <p className="text-amber-200/80 text-center mb-8 max-w-2xl mx-auto">
          Celebrate family members' achievements, big or small! Show appreciation and spread positivity.
        </p>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search appreciations..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-stone-800 border-2 border-amber-700/50 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-rose-900/30 backdrop-blur-sm border-2 border-rose-700/50 rounded-3xl p-6 mb-8 shadow-xl"
          >
            <h3 className="text-xl font-fraunces font-bold text-amber-100 mb-4">Share Appreciation</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Who deserves appreciation? *</label>
                  <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                    placeholder="Family member's name"
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
                <label className="block text-sm font-semibold text-amber-200 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                  placeholder="e.g., Amazing performance!"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Why are you appreciating them? *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all resize-none"
                  rows={4}
                  placeholder="Share what they did and why it's awesome..."
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="bg-gradient-to-r from-rose-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:from-rose-700 hover:to-pink-700 transition-all disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Posting...' : 'Share Appreciation'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gradient-to-br from-rose-900/40 to-pink-900/30 backdrop-blur-sm border-2 border-rose-700/50 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-transform relative overflow-hidden"
            >
              {/* Decorative stars */}
              <div className="absolute top-2 right-2 text-yellow-400/30 text-4xl">✨</div>
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">{categoryEmojis[post.category] || '⭐'}</span>
                {post.user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-amber-400 hover:text-red-400 transition-colors z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="bg-rose-600/30 rounded-xl p-3 mb-4 text-center">
                <p className="text-xs text-rose-200 mb-1">Well done to</p>
                <h3 className="text-xl font-fraunces font-bold text-white">🎉 {post.recipient_name} 🎉</h3>
              </div>
              
              <h4 className="text-lg font-semibold text-amber-100 mb-2">{post.title}</h4>
              <span className="inline-block bg-rose-600/50 text-rose-200 px-3 py-1 rounded-full text-xs mb-3 capitalize">
                {post.category}
              </span>
              <p className="text-amber-200/90 text-sm leading-relaxed">{post.description}</p>
              <p className="text-amber-400/60 text-xs mt-4 flex items-center gap-1">
                <Heart className="w-3 h-3" fill="#FDA4AF" /> Appreciated by {post.user_name}
              </p>
            </motion.div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">👏</span>
            <p className="text-amber-200 text-lg mb-4">
              {searchTerm ? 'No appreciations found' : 'No appreciations yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-rose-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-rose-700 transition-all"
              >
                Appreciate Someone
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WellDone;
