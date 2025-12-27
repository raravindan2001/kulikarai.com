import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Sun, Plus, Search, Trash2, Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';

const PerumalUtsavam = () => {
  const { user, API } = useContext(AuthContext);
  const [utsavams, setUtsavams] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', date: '', place: '', time: '', links: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUtsavams();
  }, []);

  const fetchUtsavams = async () => {
    try {
      const response = await axios.get(`${API}/perumal-utsavam`);
      setUtsavams(response.data);
    } catch (error) {
      console.error('Failed to fetch utsavams:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.date || !formData.place) {
      toast.error('Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        links: formData.links.split(',').map(l => l.trim()).filter(l => l)
      };
      await axios.post(`${API}/perumal-utsavam`, payload);
      toast.success('Utsavam added!');
      setFormData({ name: '', date: '', place: '', time: '', links: '', description: '' });
      setShowCreate(false);
      fetchUtsavams();
    } catch (error) {
      toast.error('Failed to add utsavam');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this utsavam?')) return;
    try {
      await axios.delete(`${API}/perumal-utsavam/${id}`);
      toast.success('Utsavam deleted');
      fetchUtsavams();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredUtsavams = utsavams.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.place?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-fraunces font-bold text-amber-100 flex items-center space-x-3">
            <span>🙏</span>
            <span>Perumal Utsavam</span>
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Utsavam</span>
          </button>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search utsavams by name or place..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-stone-800 border-2 border-amber-700/50 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-yellow-900/30 backdrop-blur-sm border-2 border-yellow-700/50 rounded-3xl p-6 mb-8 shadow-xl"
          >
            <h3 className="text-xl font-fraunces font-bold text-amber-100 mb-4">Add Perumal Utsavam</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Utsavam Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                    placeholder="e.g., Vaikunta Ekadasi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Place *</label>
                  <input
                    type="text"
                    value={formData.place}
                    onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                    placeholder="e.g., Tirumala, Srirangam"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 focus:border-amber-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Time</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                    placeholder="e.g., 4:00 AM - 10:00 PM"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Related Links (comma separated)</label>
                <input
                  type="text"
                  value={formData.links}
                  onChange={(e) => setFormData({ ...formData, links: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                  placeholder="https://link1.com, https://link2.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all resize-none"
                  rows={3}
                  placeholder="Details about the utsavam..."
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-8 py-3 rounded-full font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Adding...' : 'Add Utsavam'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUtsavams.map((utsavam, idx) => (
            <motion.div
              key={utsavam.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gradient-to-br from-yellow-900/40 to-orange-900/30 backdrop-blur-sm border-2 border-yellow-700/50 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-transform"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">🙏</span>
                {utsavam.user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(utsavam.id)}
                    className="text-amber-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h3 className="text-xl font-fraunces font-bold text-amber-100 mb-3">{utsavam.name}</h3>
              <div className="space-y-2 mb-3">
                <p className="text-yellow-300 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {utsavam.place}
                </p>
                {utsavam.date && (
                  <p className="text-yellow-300 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> {utsavam.date}
                  </p>
                )}
                {utsavam.time && (
                  <p className="text-yellow-300 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" /> {utsavam.time}
                  </p>
                )}
              </div>
              {utsavam.description && (
                <p className="text-amber-200/90 text-sm leading-relaxed mb-3">{utsavam.description}</p>
              )}
              {utsavam.links && utsavam.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {utsavam.links.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Link {i + 1}
                    </a>
                  ))}
                </div>
              )}
              <p className="text-amber-400/60 text-xs mt-4">Added by {utsavam.user_name}</p>
            </motion.div>
          ))}
        </div>

        {filteredUtsavams.length === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🙏</span>
            <p className="text-amber-200 text-lg mb-4">
              {searchTerm ? 'No utsavams found' : 'No utsavams added yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-yellow-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-yellow-700 transition-all"
              >
                Add First Utsavam
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PerumalUtsavam;
