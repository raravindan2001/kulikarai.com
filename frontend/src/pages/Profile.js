import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Calendar, MapPin, Users as UsersIcon, Edit2 } from 'lucide-react';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, setUser, API } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', bio: '', birthday: '' });
  const [loading, setLoading] = useState(true);
  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const endpoint = isOwnProfile ? '/auth/me' : `/users/${userId}`;
      const response = await axios.get(`${API}${endpoint}`);
      setProfile(response.data);
      setFormData({
        name: response.data.name,
        bio: response.data.bio || '',
        birthday: response.data.birthday || '',
      });
    } catch (error) {
      toast.error('Failed to load profile');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const response = await axios.put(`${API}/users/me`, formData);
      setProfile(response.data);
      setUser(response.data);
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <p className="text-textSecondary font-nunito">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="profile-page" className="max-w-4xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg overflow-hidden"
        >
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-br from-coral via-sunshine to-sage"></div>

          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 mb-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-coral to-sunshine flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-lg">
                {profile?.name?.charAt(0)}
              </div>
              {isOwnProfile && (
                <button
                  data-testid="edit-profile-btn"
                  onClick={() => setIsEditing(!isEditing)}
                  className="ml-auto mt-4 sm:mt-0 flex items-center space-x-2 bg-[#F0F2F5] text-textPrimary px-6 py-2 rounded-full font-nunito font-semibold hover:bg-[#E0E2E5] transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-nunito font-semibold text-textSecondary mb-2">Name</label>
                  <input
                    data-testid="profile-name-input"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border-transparent focus:border-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-nunito font-semibold text-textSecondary mb-2">Bio</label>
                  <textarea
                    data-testid="profile-bio-input"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border-transparent focus:border-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-nunito font-semibold text-textSecondary mb-2">Birthday</label>
                  <input
                    data-testid="profile-birthday-input"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border-transparent focus:border-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all"
                  />
                </div>
                <button
                  data-testid="save-profile-btn"
                  onClick={handleUpdate}
                  disabled={loading}
                  className="bg-coral text-white px-8 py-3 rounded-full font-nunito font-semibold hover:bg-[#FF8787] transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-fraunces font-bold text-textPrimary mb-2">{profile?.name}</h1>
                {profile?.bio && (
                  <p className="text-textSecondary font-nunito mb-4">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-6 text-textSecondary font-nunito">
                  {profile?.birthday && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-coral" />
                      <span>{new Date(profile.birthday).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-5 h-5 text-coral" />
                    <span>{profile?.relationships?.length || 0} family connections</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <button
            data-testid="view-photos-btn"
            onClick={() => navigate('/photos')}
            className="bg-white rounded-2xl p-6 shadow-lg hover-lift text-center"
          >
            <div className="text-3xl mb-2">📷</div>
            <p className="font-nunito font-semibold text-textPrimary">Photos</p>
          </button>
          <button
            data-testid="view-messages-btn"
            onClick={() => navigate('/messages')}
            className="bg-white rounded-2xl p-6 shadow-lg hover-lift text-center"
          >
            <div className="text-3xl mb-2">💬</div>
            <p className="font-nunito font-semibold text-textPrimary">Messages</p>
          </button>
          <button
            data-testid="view-events-btn"
            onClick={() => navigate('/events')}
            className="bg-white rounded-2xl p-6 shadow-lg hover-lift text-center"
          >
            <div className="text-3xl mb-2">🎉</div>
            <p className="font-nunito font-semibold text-textPrimary">Events</p>
          </button>
          <button
            data-testid="view-family-tree-btn"
            onClick={() => navigate('/family-tree')}
            className="bg-white rounded-2xl p-6 shadow-lg hover-lift text-center"
          >
            <div className="text-3xl mb-2">🌳</div>
            <p className="font-nunito font-semibold text-textPrimary">Family Tree</p>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;