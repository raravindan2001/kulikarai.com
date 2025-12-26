import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Heart, MessageCircle, Calendar, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

const Home = () => {
  const { user, API } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState({});

  useEffect(() => {
    fetchPosts();
    fetchUsers();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      const usersMap = {};
      response.data.users.forEach(u => {
        usersMap[u.id] = u;
      });
      setUsers(usersMap);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;
    setLoading(true);
    try {
      await axios.post(`${API}/posts`, { content: newPost, media: [] });
      setNewPost('');
      toast.success('Post created!');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const likePost = async (postId) => {
    try {
      await axios.post(`${API}/posts/${postId}/like`);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  return (
    <Layout>
      <div data-testid="home-feed" className="max-w-3xl mx-auto py-8 px-4">
        {/* Create Post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-lg mb-8"
        >
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral to-sunshine flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1">
              <textarea
                data-testid="create-post-textarea"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share something with your family..."
                className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border-transparent focus:border-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all resize-none"
                rows={3}
              />
              <button
                data-testid="create-post-btn"
                onClick={createPost}
                disabled={loading || !newPost.trim()}
                className="mt-4 bg-coral text-white px-8 py-2 rounded-full font-nunito font-semibold hover:bg-[#FF8787] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Posting...' : 'Share'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              data-testid={`post-${post.id}`}
              className="bg-white rounded-3xl p-6 shadow-lg hover-lift"
            >
              {/* Post Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-sunshine flex items-center justify-center text-white font-bold text-sm">
                  {users[post.user_id]?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h4 className="font-nunito font-semibold text-textPrimary">
                    {users[post.user_id]?.name || 'User'}
                  </h4>
                  <p className="text-sm text-textMuted">
                    {format(new Date(post.created_at), 'MMM d, yyyy · h:mm a')}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-textPrimary font-nunito mb-4 whitespace-pre-wrap">{post.content}</p>

              {/* Post Actions */}
              <div className="flex items-center space-x-6 pt-4 border-t border-gray-100">
                <button
                  data-testid={`like-post-${post.id}-btn`}
                  onClick={() => likePost(post.id)}
                  className="flex items-center space-x-2 text-textSecondary hover:text-coral transition-colors"
                >
                  <Heart
                    className="w-5 h-5"
                    fill={post.likes.includes(user?.id) ? '#FF6B6B' : 'none'}
                  />
                  <span className="font-nunito text-sm">{post.likes.length}</span>
                </button>
                <button className="flex items-center space-x-2 text-textSecondary hover:text-coral transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-nunito text-sm">Comment</span>
                </button>
              </div>
            </motion.div>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-16">
              <ImageIcon className="w-16 h-16 text-textMuted mx-auto mb-4" />
              <p className="text-textSecondary font-nunito text-lg">No posts yet. Be the first to share!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;