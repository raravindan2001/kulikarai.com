import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Heart, MessageCircle, X } from 'lucide-react';
import { format } from 'date-fns';

const PhotoDetail = () => {
  const { photoId } = useParams();
  const { user, API } = useContext(AuthContext);
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhoto();
    fetchComments();
  }, [photoId]);

  const fetchPhoto = async () => {
    try {
      const response = await axios.get(`${API}/photos/${photoId}`);
      setPhoto(response.data);
    } catch (error) {
      toast.error('Failed to load photo');
      navigate('/photos');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API}/photos/${photoId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleLike = async () => {
    try {
      await axios.post(`${API}/photos/${photoId}/like`);
      fetchPhoto();
    } catch (error) {
      toast.error('Failed to like photo');
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      await axios.post(`${API}/photos/${photoId}/comments`, { comment: newComment });
      setNewComment('');
      fetchComments();
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <p className="text-textSecondary font-nunito">Loading photo...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="photo-detail-page" className="max-w-6xl mx-auto py-8 px-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Photo */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl overflow-hidden shadow-lg"
            >
              <img
                src={photo?.file_id ? `${API}/photos/file/${photo.file_id}` : photo?.url}
                alt={photo?.caption || 'Family photo'}
                className="w-full h-auto"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                }}
              />
            </motion.div>
          </div>

          {/* Details & Comments */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl p-6 shadow-lg"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-fraunces font-bold text-textPrimary">Photo Details</h2>
                <button
                  data-testid="close-photo-btn"
                  onClick={() => navigate('/photos')}
                  className="text-textMuted hover:text-textPrimary"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {photo?.caption && (
                <p className="text-textPrimary font-nunito mb-4">{photo.caption}</p>
              )}

              <p className="text-textMuted font-nunito text-sm mb-6">
                {format(new Date(photo?.created_at), 'MMMM d, yyyy')}
              </p>

              {/* Actions */}
              <div className="flex items-center space-x-6 pb-6 border-b border-gray-100">
                <button
                  data-testid="like-photo-btn"
                  onClick={handleLike}
                  className="flex items-center space-x-2 text-textSecondary hover:text-coral transition-colors"
                >
                  <Heart
                    className="w-6 h-6"
                    fill={photo?.likes?.includes(user?.id) ? '#FF6B6B' : 'none'}
                  />
                  <span className="font-nunito">{photo?.likes?.length || 0}</span>
                </button>
                <div className="flex items-center space-x-2 text-textSecondary">
                  <MessageCircle className="w-6 h-6" />
                  <span className="font-nunito">{comments.length}</span>
                </div>
              </div>

              {/* Comments */}
              <div className="mt-6">
                <h3 className="font-fraunces font-bold text-textPrimary mb-4">Comments</h3>
                <div className="space-y-4 max-h-60 overflow-y-auto scrollbar-hide mb-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-sunshine flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        U
                      </div>
                      <div>
                        <p className="text-textPrimary font-nunito text-sm">{comment.comment}</p>
                        <p className="text-textMuted font-nunito text-xs mt-1">
                          {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="flex space-x-2">
                  <input
                    data-testid="comment-input"
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 rounded-full bg-[#F0F2F5] border-transparent focus:border-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all text-sm"
                  />
                  <button
                    data-testid="add-comment-btn"
                    onClick={handleComment}
                    disabled={!newComment.trim()}
                    className="bg-coral text-white px-6 py-2 rounded-full font-nunito font-semibold hover:bg-[#FF8787] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Post
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PhotoDetail;