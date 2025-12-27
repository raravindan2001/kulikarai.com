import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Gamepad2, Plus, Search, Trash2, Trophy } from 'lucide-react';

const GamingSpace = () => {
  const { user, API } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ game_name: '', content: '', score: '', game_type: 'online' });
  const [loading, setLoading] = useState(false);

  const gameTypes = ['online', 'mobile', 'pc', 'console', 'board', 'card'];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API}/gaming-space`);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch gaming posts:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.game_name || !formData.content) {
      toast.error('Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/gaming-space`, formData);
      toast.success('Gaming post added!');
      setFormData({ game_name: '', content: '', score: '', game_type: 'online' });
      setShowCreate(false);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to add post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axios.delete(`${API}/gaming-space/${id}`);
      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredPosts = posts.filter(p =>
    p.game_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const gameTypeEmojis = {
    online: '🌐', mobile: '📱', pc: '💻', console: '🎮', board: '🎲', card: '🃏'
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-fraunces font-bold text-amber-100 flex items-center space-x-3">
            <span>🎮</span>
            <span>Gaming Space</span>
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 py-3 rounded-full font-semibold hover:from-violet-700 hover:to-fuchsia-700 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Share Gaming</span>
          </button>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search games..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-stone-800 border-2 border-amber-700/50 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-violet-900/30 backdrop-blur-sm border-2 border-violet-700/50 rounded-3xl p-6 mb-8 shadow-xl"
          >
            <h3 className="text-xl font-fraunces font-bold text-amber-100 mb-4">Share Gaming Experience</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Game Name *</label>
                  <input
                    type="text"
                    value={formData.game_name}
                    onChange={(e) => setFormData({ ...formData, game_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                    placeholder="e.g., Minecraft"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Game Type</label>
                  <select
                    value={formData.game_type}
                    onChange={(e) => setFormData({ ...formData, game_type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 focus:border-amber-500 focus:outline-none transition-all"
                  >
                    {gameTypes.map(type => (
                      <option key={type} value={type}>{gameTypeEmojis[type]} {type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Score/Achievement</label>
                <input
                  type="text"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                  placeholder="e.g., Level 50, Diamond Rank"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">What's happening? *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all resize-none"
                  rows={4}
                  placeholder="Share your gaming experience, looking for teammates, or tips..."
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-8 py-3 rounded-full font-semibold hover:from-violet-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Posting...' : 'Post'}
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
              className="bg-gradient-to-br from-violet-900/40 to-fuchsia-900/30 backdrop-blur-sm border-2 border-violet-700/50 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-transform"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">{gameTypeEmojis[post.game_type] || '🎮'}</span>
                {post.user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-amber-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h3 className="text-xl font-fraunces font-bold text-amber-100 mb-2">{post.game_name}</h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-violet-600/50 text-violet-200 px-3 py-1 rounded-full text-xs capitalize">
                  {post.game_type}
                </span>
                {post.score && (
                  <span className="bg-yellow-600/50 text-yellow-200 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> {post.score}
                  </span>
                )}
              </div>
              <p className="text-amber-200/90 text-sm leading-relaxed">{post.content}</p>
              <p className="text-amber-400/60 text-xs mt-4">Posted by {post.user_name}</p>
            </motion.div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🎮</span>
            <p className="text-amber-200 text-lg mb-4">
              {searchTerm ? 'No gaming posts found' : 'No gaming posts yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-violet-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-violet-700 transition-all"
              >
                Share First Post
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GamingSpace;
