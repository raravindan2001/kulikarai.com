import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Sparkles, Plus, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const DivineUpdates = () => {
  const { user, API } = useContext(AuthContext);
  const [updates, setUpdates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', category: 'prayer' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      const response = await axios.get(`${API}/divine-updates`);
      setUpdates(response.data);
    } catch (error) {
      console.error('Failed to fetch divine updates:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/divine-updates`, formData);
      toast.success('Divine update shared!');
      setFormData({ title: '', content: '', category: 'prayer' });
      setShowCreate(false);
      fetchUpdates();
    } catch (error) {
      toast.error('Failed to create update');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this update?')) return;
    try {
      await axios.delete(`${API}/divine-updates/${id}`);
      toast.success('Update deleted');
      fetchUpdates();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-amber-100 flex items-center space-x-3">
            <Sparkles className="w-10 h-10 text-amber-400" />
            <span>Divine Updates</span>
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:from-amber-700 hover:to-orange-700 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Share Update</span>
          </button>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-amber-900/30 backdrop-blur-sm border-2 border-amber-700/50 rounded-3xl p-6 mb-8 shadow-xl"
          >
            <h3 className="text-xl font-serif font-bold text-amber-100 mb-4">Share Divine Update</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="Upcoming festival, prayer, or blessing..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                >
                  <option value="prayer">Prayer</option>
                  <option value="festival">Festival</option>
                  <option value="blessing">Blessing</option>
                  <option value="teaching">Teaching</option>
                  <option value="quote">Quote</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                  rows={4}
                  placeholder="Share your divine message..."
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-3 rounded-full font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Sharing...' : 'Share Update'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-6">
          {updates.map((update, idx) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gradient-to-br from-amber-900/40 to-orange-900/30 backdrop-blur-sm border-2 border-amber-700/50 rounded-3xl p-6 shadow-xl hover-lift"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">
                    {update.category === 'prayer' && '🙏'}
                    {update.category === 'festival' && '🎉'}
                    {update.category === 'blessing' && '✨'}
                    {update.category === 'teaching' && '📿'}
                    {update.category === 'quote' && '💫'}
                  </span>
                  <span className="bg-amber-600 text-amber-50 px-3 py-1 rounded-full text-xs font-semibold uppercase">
                    {update.category}
                  </span>
                </div>
                {update.user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(update.id)}
                    className="text-amber-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <h3 className="text-2xl font-serif font-bold text-amber-100 mb-3">{update.title}</h3>
              <p className="text-amber-200 font-sans leading-relaxed mb-4 whitespace-pre-wrap">{update.content}</p>
              <div className="flex items-center space-x-4 text-amber-300/70 text-sm">
                <span>{update.user_name}</span>
                <span>•</span>
                <span>{format(new Date(update.created_at), 'MMM d, yyyy')}</span>
              </div>
            </motion.div>
          ))}
          {updates.length === 0 && (
            <div className="text-center py-20">
              <Sparkles className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <p className="text-amber-200 text-lg mb-4">No divine updates yet</p>
              <button
                onClick={() => setShowCreate(true)}
                className="bg-amber-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-amber-700 transition-all"
              >
                Share First Update
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DivineUpdates;