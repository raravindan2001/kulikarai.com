import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Calendar, MapPin, Users as UsersIcon, Edit2, Upload, LogOut } from 'lucide-react';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, setUser, logout, API } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', bio: '', birthday: '' });
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', 'profile-picture');
      formData.append('album_id', '');

      const response = await axios.post(`${API}/photos/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const avatarUrl = `${API}/photos/file/${response.data.file_id}`;
      await axios.put(`${API}/users/me`, { avatar: avatarUrl });
      
      const updatedProfile = await axios.get(`${API}/auth/me`);
      setProfile(updatedProfile.data);
      setUser(updatedProfile.data);
      toast.success('Profile picture updated!');
    } catch (error) {
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400 font-nunito">Loading profile...</p>
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
          className="bg-gray-800 rounded-3xl shadow-lg overflow-hidden border border-gray-700"
        >
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"></div>

          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 mb-6">
              <div className="relative">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-32 h-32 rounded-full border-4 border-gray-800 shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-5xl font-bold border-4 border-gray-800 shadow-lg">
                    {profile?.name?.charAt(0)}
                  </div>
                )}
                {isOwnProfile && (
                  <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition-all">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                )}
              </div>
              {isOwnProfile && (
                <div className="ml-auto mt-4 sm:mt-0 flex gap-3">
                  <button
                    data-testid="edit-profile-btn"
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center space-x-2 bg-gray-700 text-gray-100 px-6 py-2 rounded-full font-nunito font-semibold hover:bg-gray-600 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                  </button>
                  <button
                    data-testid="profile-logout-btn"
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-full font-nunito font-semibold hover:bg-red-700 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Name</label>
                  <input
                    data-testid="profile-name-input"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Bio</label>
                  <textarea
                    data-testid="profile-bio-input"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Birthday</label>
                  <input
                    data-testid="profile-birthday-input"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <button
                  data-testid="save-profile-btn"
                  onClick={handleUpdate}
                  disabled={loading}
                  className="bg-blue-500 text-white px-8 py-3 rounded-full font-nunito font-semibold hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-fraunces font-bold text-gray-100 mb-2">{profile?.name}</h1>
                {profile?.bio && (
                  <p className="text-gray-300 font-nunito mb-4">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-6 text-gray-300 font-nunito">
                  {profile?.birthday && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <span>{new Date(profile.birthday).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-5 h-5 text-blue-400" />
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
            className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg hover-lift text-center hover:bg-gray-750 transition-all"
          >
            <div className="text-3xl mb-2">📷</div>
            <p className="font-nunito font-semibold text-gray-100">Photos</p>
          </button>
          <button
            data-testid="view-messages-btn"
            onClick={() => navigate('/messages')}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg hover-lift text-center hover:bg-gray-750 transition-all"
          >
            <div className="text-3xl mb-2">💬</div>
            <p className="font-nunito font-semibold text-gray-100">Messages</p>
          </button>
          <button
            data-testid="view-events-btn"
            onClick={() => navigate('/events')}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg hover-lift text-center hover:bg-gray-750 transition-all"
          >
            <div className="text-3xl mb-2">🎉</div>
            <p className="font-nunito font-semibold text-gray-100">Events</p>
          </button>
          <button
            data-testid="view-family-tree-btn"
            onClick={() => navigate('/family-tree')}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg hover-lift text-center hover:bg-gray-750 transition-all"
          >
            <div className="text-3xl mb-2">🌳</div>
            <p className="font-nunito font-semibold text-gray-100">Family Tree</p>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;