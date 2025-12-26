import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Heart, Plus, Search, Trash2 } from 'lucide-react';

const HomeRemedies = () => {
  const { user, API } = useContext(AuthContext);
  const [remedies, setRemedies] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ title: '', ailment: '', remedy: '', ingredients: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRemedies();
  }, []);

  const fetchRemedies = async () => {
    try {
      const response = await axios.get(`${API}/home-remedies`);
      setRemedies(response.data);
    } catch (error) {
      console.error('Failed to fetch remedies:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.remedy) {
      toast.error('Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/home-remedies`, formData);
      toast.success('Remedy added!');
      setFormData({ title: '', ailment: '', remedy: '', ingredients: '' });
      setShowCreate(false);
      fetchRemedies();
    } catch (error) {
      toast.error('Failed to add remedy');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this remedy?')) return;
    try {
      await axios.delete(`${API}/home-remedies/${id}`);
      toast.success('Remedy deleted');
      fetchRemedies();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredRemedies = remedies.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ailment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-amber-100 flex items-center space-x-3">
            <span>🌿</span>
            <span>Home Remedies</span>
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full font-semibold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Remedy</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search remedies or ailments..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-stone-800 border-2 border-amber-700/50 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-amber-900/30 backdrop-blur-sm border-2 border-amber-700/50 rounded-3xl p-6 mb-8 shadow-xl"
          >
            <h3 className="text-xl font-serif font-bold text-amber-100 mb-4">Share Home Remedy</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                    placeholder="e.g., Turmeric Milk"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">For Ailment</label>
                  <input
                    type="text"
                    value={formData.ailment}
                    onChange={(e) => setFormData({ ...formData, ailment: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                    placeholder="e.g., Cold, Cough"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Ingredients</label>
                <input
                  type="text"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="e.g., Turmeric, Milk, Honey"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">How to Prepare & Use</label>
                <textarea
                  value={formData.remedy}
                  onChange={(e) => setFormData({ ...formData, remedy: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                  rows={4}
                  placeholder="Step by step instructions..."
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-full font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Adding...' : 'Add Remedy'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRemedies.map((remedy, idx) => (
            <motion.div
              key={remedy.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gradient-to-br from-green-900/40 to-emerald-900/30 backdrop-blur-sm border-2 border-green-700/50 rounded-3xl p-6 shadow-xl hover-lift"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">🌿</span>
                {remedy.user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(remedy.id)}
                    className="text-amber-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h3 className="text-xl font-serif font-bold text-amber-100 mb-2">{remedy.title}</h3>
              {remedy.ailment && (
                <p className="text-green-300 text-sm mb-3">For: {remedy.ailment}</p>
              )}
              {remedy.ingredients && (
                <p className="text-amber-200 text-sm mb-3">
                  <strong>Ingredients:</strong> {remedy.ingredients}
                </p>
              )}
              <p className="text-amber-200/90 text-sm leading-relaxed">{remedy.remedy}</p>
            </motion.div>
          ))}
        </div>

        {filteredRemedies.length === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🌿</span>
            <p className="text-amber-200 text-lg mb-4">
              {searchTerm ? 'No remedies found' : 'No home remedies yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-all"
              >
                Add First Remedy
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HomeRemedies;