import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Trophy, Plus, Search, Trash2, Users, Calendar, Crown } from 'lucide-react';

const Tournaments = () => {
  const { user, API } = useContext(AuthContext);
  const [tournaments, setTournaments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', game: '', start_date: '', participants: '', status: 'upcoming' });
  const [loading, setLoading] = useState(false);

  const statusColors = {
    upcoming: 'bg-blue-600', ongoing: 'bg-green-600', completed: 'bg-gray-600', cancelled: 'bg-red-600'
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await axios.get(`${API}/tournaments`);
      setTournaments(response.data);
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.game) {
      toast.error('Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        participants: formData.participants.split(',').map(p => p.trim()).filter(p => p)
      };
      await axios.post(`${API}/tournaments`, payload);
      toast.success('Tournament created!');
      setFormData({ name: '', game: '', start_date: '', participants: '', status: 'upcoming' });
      setShowCreate(false);
      fetchTournaments();
    } catch (error) {
      toast.error('Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tournament?')) return;
    try {
      await axios.delete(`${API}/tournaments/${id}`);
      toast.success('Tournament deleted');
      fetchTournaments();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API}/tournaments/${id}`, { status: newStatus });
      toast.success('Status updated!');
      fetchTournaments();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredTournaments = tournaments.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.game?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-fraunces font-bold text-amber-100 flex items-center space-x-3">
            <span>🏆</span>
            <span>Family Tournaments</span>
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:from-amber-700 hover:to-orange-700 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Create Tournament</span>
          </button>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tournaments..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-stone-800 border-2 border-amber-700/50 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-amber-900/30 backdrop-blur-sm border-2 border-amber-700/50 rounded-3xl p-6 mb-8 shadow-xl"
          >
            <h3 className="text-xl font-fraunces font-bold text-amber-100 mb-4">Create Tournament</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Tournament Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                    placeholder="e.g., Kulikarai Chess Championship"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Game/Activity *</label>
                  <input
                    type="text"
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                    placeholder="e.g., Chess, Carrom, Ludo"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 focus:border-amber-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 focus:border-amber-500 focus:outline-none transition-all"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">Participants (comma separated)</label>
                <input
                  type="text"
                  value={formData.participants}
                  onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border-amber-700 text-amber-50 placeholder-amber-300/50 focus:border-amber-500 focus:outline-none transition-all"
                  placeholder="e.g., Ravi, Priya, Kumar, Lakshmi"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-3 rounded-full font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Creating...' : 'Create Tournament'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament, idx) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gradient-to-br from-amber-900/40 to-orange-900/30 backdrop-blur-sm border-2 border-amber-700/50 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-transform"
            >
              <div className="flex justify-between items-start mb-4">
                <Trophy className="w-10 h-10 text-yellow-400" />
                {tournament.user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(tournament.id)}
                    className="text-amber-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h3 className="text-xl font-fraunces font-bold text-amber-100 mb-2">{tournament.name}</h3>
              <p className="text-amber-300 text-sm mb-3">🎯 {tournament.game}</p>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`${statusColors[tournament.status]} text-white px-3 py-1 rounded-full text-xs capitalize`}>
                  {tournament.status}
                </span>
                {tournament.start_date && (
                  <span className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {tournament.start_date}
                  </span>
                )}
              </div>
              {tournament.participants && tournament.participants.length > 0 && (
                <div className="mb-3">
                  <p className="text-amber-200 text-xs mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Participants ({tournament.participants.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {tournament.participants.slice(0, 5).map((p, i) => (
                      <span key={i} className="bg-stone-700 text-amber-100 px-2 py-0.5 rounded-full text-xs">
                        {p}
                      </span>
                    ))}
                    {tournament.participants.length > 5 && (
                      <span className="bg-stone-700 text-amber-100 px-2 py-0.5 rounded-full text-xs">
                        +{tournament.participants.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              {tournament.winner && (
                <div className="flex items-center gap-2 bg-yellow-600/30 rounded-lg p-2 mt-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-200 text-sm">Winner: {tournament.winner}</span>
                </div>
              )}
              <p className="text-amber-400/60 text-xs mt-4">Organized by {tournament.user_name}</p>
              
              {tournament.user_id === user?.id && tournament.status !== 'completed' && (
                <div className="mt-4 flex gap-2">
                  {tournament.status === 'upcoming' && (
                    <button
                      onClick={() => handleUpdateStatus(tournament.id, 'ongoing')}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full transition-all"
                    >
                      Start
                    </button>
                  )}
                  {tournament.status === 'ongoing' && (
                    <button
                      onClick={() => handleUpdateStatus(tournament.id, 'completed')}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-all"
                    >
                      Complete
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filteredTournaments.length === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🏆</span>
            <p className="text-amber-200 text-lg mb-4">
              {searchTerm ? 'No tournaments found' : 'No tournaments yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-amber-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-amber-700 transition-all"
              >
                Create First Tournament
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tournaments;
