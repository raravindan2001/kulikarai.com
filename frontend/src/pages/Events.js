import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Calendar as CalendarIcon, MapPin, Plus, Users } from 'lucide-react';
import { format } from 'date-fns';

const Events = () => {
  const { user, API } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', location: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const createEvent = async () => {
    if (!formData.title || !formData.date) {
      toast.error('Title and date are required');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/events`, formData);
      toast.success('Event created!');
      setFormData({ title: '', description: '', date: '', location: '' });
      setShowCreate(false);
      fetchEvents();
    } catch (error) {
      toast.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const attendEvent = async (eventId) => {
    try {
      await axios.post(`${API}/events/${eventId}/attend`);
      fetchEvents();
    } catch (error) {
      toast.error('Failed to update attendance');
    }
  };

  return (
    <Layout>
      <div data-testid="events-page" className="max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-fraunces font-bold text-textPrimary">Family Events</h1>
          <button
            data-testid="create-event-btn"
            onClick={() => setShowCreate(!showCreate)}
            className="bg-coral text-white px-8 py-3 rounded-full font-nunito font-semibold hover:bg-[#FF8787] transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Event</span>
          </button>
        </div>

        {/* Create Event Form */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white rounded-3xl p-6 shadow-lg mb-8"
          >
            <h3 className="text-xl font-fraunces font-bold text-textPrimary mb-4">Create New Event</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-nunito font-semibold text-textSecondary mb-2">Title</label>
                <input
                  data-testid="event-title-input"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border-transparent focus:border-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all"
                  placeholder="Birthday Party, Family Reunion..."
                />
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-textSecondary mb-2">Description</label>
                <textarea
                  data-testid="event-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border-transparent focus:border-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all resize-none"
                  rows={3}
                  placeholder="Event details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-nunito font-semibold text-textSecondary mb-2">Date</label>
                  <input
                    data-testid="event-date-input"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border-transparent focus:border-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-nunito font-semibold text-textSecondary mb-2">Location</label>
                  <input
                    data-testid="event-location-input"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border-transparent focus:border-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all"
                    placeholder="Address or venue"
                  />
                </div>
              </div>
              <button
                data-testid="save-event-btn"
                onClick={createEvent}
                disabled={loading}
                className="bg-coral text-white px-8 py-3 rounded-full font-nunito font-semibold hover:bg-[#FF8787] transition-all disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Events List */}
        <div className="space-y-6">
          {events.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              data-testid={`event-${event.id}`}
              className="bg-white rounded-3xl p-6 shadow-lg hover-lift"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-2xl font-fraunces font-bold text-textPrimary mb-2">{event.title}</h3>
                  {event.description && (
                    <p className="text-textSecondary font-nunito mb-4">{event.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-textSecondary font-nunito">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-5 h-5 text-coral" />
                      <span>{format(new Date(event.date), 'MMMM d, yyyy · h:mm a')}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-coral" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-coral" />
                      <span>{event.attendees?.length || 0} attending</span>
                    </div>
                  </div>
                </div>
                <button
                  data-testid={`attend-event-${event.id}-btn`}
                  onClick={() => attendEvent(event.id)}
                  className={`px-6 py-2 rounded-full font-nunito font-semibold transition-all ${
                    event.attendees?.includes(user?.id)
                      ? 'bg-sage text-white hover:bg-[#A0D6A7]'
                      : 'bg-[#F0F2F5] text-textPrimary hover:bg-[#E0E2E5]'
                  }`}
                >
                  {event.attendees?.includes(user?.id) ? 'Attending' : 'Attend'}
                </button>
              </div>
            </motion.div>
          ))}

          {events.length === 0 && (
            <div className="text-center py-20">
              <CalendarIcon className="w-16 h-16 text-textMuted mx-auto mb-4" />
              <p className="text-textSecondary font-nunito text-lg mb-4">No events planned yet</p>
              <button
                onClick={() => setShowCreate(true)}
                className="bg-coral text-white px-8 py-3 rounded-full font-nunito font-semibold hover:bg-[#FF8787] transition-all inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create First Event</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Events;