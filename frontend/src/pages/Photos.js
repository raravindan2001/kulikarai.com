import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Upload, Image as ImageIcon, Heart } from 'lucide-react';

const Photos = () => {
  const { API } = useContext(AuthContext);
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(`${API}/photos`);
      setPhotos(response.data);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        await axios.post(`${API}/photos`, {
          image: reader.result,
          caption: '',
        });
        toast.success('Photo uploaded!');
        fetchPhotos();
        setUploading(false);
      };
    } catch (error) {
      toast.error('Failed to upload photo');
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div data-testid="photos-page" className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-fraunces font-bold text-textPrimary">Family Photos</h1>
          <label
            data-testid="upload-photo-btn"
            className="bg-coral text-white px-8 py-3 rounded-full font-nunito font-semibold hover:bg-[#FF8787] transition-all cursor-pointer inline-flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {/* Masonry Grid */}
        {photos.length > 0 ? (
          <div className="masonry-grid">
            {photos.map((photo, idx) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                data-testid={`photo-${photo.id}`}
                className="masonry-item cursor-pointer"
                onClick={() => navigate(`/photos/${photo.id}`)}
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover-lift">
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Family photo'}
                    className="w-full h-auto"
                  />
                  {photo.caption && (
                    <div className="p-4">
                      <p className="text-textPrimary font-nunito">{photo.caption}</p>
                    </div>
                  )}
                  <div className="px-4 pb-4 flex items-center space-x-2 text-textSecondary">
                    <Heart className="w-4 h-4" fill={photo.likes?.length > 0 ? '#FF6B6B' : 'none'} />
                    <span className="text-sm font-nunito">{photo.likes?.length || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ImageIcon className="w-20 h-20 text-textMuted mx-auto mb-4" />
            <p className="text-textSecondary font-nunito text-lg mb-4">No photos yet</p>
            <label className="bg-coral text-white px-8 py-3 rounded-full font-nunito font-semibold hover:bg-[#FF8787] transition-all cursor-pointer inline-flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Upload First Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Photos;