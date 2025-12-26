import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { ChefHat, Plus, Search, Trash2, Clock } from 'lucide-react';

const CookingTips = () => {
  const { user, API } = useContext(AuthContext);
  const [tips, setTips] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ title: '', category: 'vegetarian', ingredients: '', instructions: '', cooking_time: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      const response = await axios.get(`${API}/cooking-tips`);
      setTips(response.data);
    } catch (error) {
      console.error('Failed to fetch cooking tips:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.instructions) {
      toast.error('Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/cooking-tips`, formData);
      toast.success('Recipe added!');
      setFormData({ title: '', category: 'vegetarian', ingredients: '', instructions: '', cooking_time: '' });
      setShowCreate(false);
      fetchTips();
    } catch (error) {
      toast.error('Failed to add recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    try {
      await axios.delete(`${API}/cooking-tips/${id}`);
      toast.success('Recipe deleted');
      fetchTips();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredTips = tips.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-amber-100 flex items-center space-x-3">
            <ChefHat className="w-10 h-10 text-amber-400" />
            <span>Cooking Recipes</span>
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-full font-semibold hover:from-orange-700 hover:to-red-700 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Recipe</span>
          </button>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search recipes or categories..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-900 border-2 border-amber-600/50 text-amber-50 placeholder-amber-400/50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gray-900 border-2 border-amber-600/50 rounded-3xl p-6 mb-8 shadow-xl"
          >
            <h3 className="text-xl font-serif font-bold text-amber-100 mb-4">Share Your Recipe</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Recipe Name</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border-amber-600 text-amber-50 placeholder-amber-400/50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                    placeholder="e.g., Sambar, Dosa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border-amber-600 text-amber-50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  >
                    <option value="vegetarian">Vegetarian</option>
                    <option value="non-vegetarian">Non-Vegetarian</option>
                    <option value="snacks">Snacks</option>
                    <option value="desserts">Desserts</option>
                    <option value="breakfast">Breakfast</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Cooking Time</label>
                <input
                  type="text"
                  value={formData.cooking_time}
                  onChange={(e) => setFormData({ ...formData, cooking_time: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border-amber-600 text-amber-50 placeholder-amber-400/50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="e.g., 30 minutes"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Ingredients</label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border-amber-600 text-amber-50 placeholder-amber-400/50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                  rows={3}
                  placeholder="List all ingredients..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border-amber-600 text-amber-50 placeholder-amber-400/50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                  rows={5}
                  placeholder="Step by step cooking instructions..."
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-full font-semibold hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Adding...' : 'Add Recipe'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTips.map((tip, idx) => (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gradient-to-br from-orange-900/30 to-red-900/20 border-2 border-orange-600/50 rounded-3xl p-6 shadow-xl hover-lift"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl">🍳</span>
                  <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase">
                    {tip.category}
                  </span>
                </div>
                {tip.user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(tip.id)}
                    className="text-amber-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <h3 className="text-2xl font-serif font-bold text-amber-100 mb-3">{tip.title}</h3>
              {tip.cooking_time && (
                <div className="flex items-center space-x-2 text-amber-300 text-sm mb-3">
                  <Clock className="w-4 h-4" />
                  <span>{tip.cooking_time}</span>
                </div>
              )}
              {tip.ingredients && (
                <div className="mb-3">
                  <p className="text-amber-200 text-sm font-semibold mb-1">Ingredients:</p>
                  <p className="text-amber-200/90 text-sm">{tip.ingredients}</p>
                </div>
              )}
              <div>
                <p className="text-amber-200 text-sm font-semibold mb-1">Instructions:</p>
                <p className="text-amber-200/90 text-sm leading-relaxed">{tip.instructions}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-amber-700/30 text-amber-300/70 text-xs">
                <span>By {tip.user_name}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredTips.length === 0 && (
          <div className="text-center py-20">
            <ChefHat className="w-20 h-20 text-amber-500 mx-auto mb-4" />
            <p className="text-amber-200 text-lg mb-4">
              {searchTerm ? 'No recipes found' : 'No recipes yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-orange-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-700 transition-all"
              >
                Add First Recipe
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CookingTips;