import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import Layout from '../components/Layout';
import { Users } from 'lucide-react';

const FamilyTree = () => {
  const { API } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFamilyTree();
  }, []);

  const fetchFamilyTree = async () => {
    try {
      const response = await axios.get(`${API}/users/family-tree`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch family tree:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div data-testid="family-tree-page" className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-4xl font-fraunces font-bold text-textPrimary mb-8">Family Tree</h1>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-textSecondary font-nunito">Loading family tree...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                data-testid={`family-member-${member.id}`}
                className="bg-white rounded-3xl p-6 shadow-lg hover-lift text-center"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-coral to-sunshine flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                  {member.name?.charAt(0)}
                </div>
                <h3 className="text-xl font-fraunces font-bold text-textPrimary mb-2">{member.name}</h3>
                {member.bio && (
                  <p className="text-textSecondary font-nunito text-sm mb-3">{member.bio}</p>
                )}
                {member.relationships && member.relationships.length > 0 && (
                  <div className="flex items-center justify-center space-x-2 text-textMuted text-sm">
                    <Users className="w-4 h-4" />
                    <span>{member.relationships.length} connections</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-textMuted mx-auto mb-4" />
            <p className="text-textSecondary font-nunito text-lg">No family members yet. Invite them to join!</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FamilyTree;