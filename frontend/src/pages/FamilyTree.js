import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState } from 'react-flow-renderer';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Users, Plus, X, Heart } from 'lucide-react';

const FamilyTree = () => {
  const { user, API } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [showAddParents, setShowAddParents] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [relationForm, setRelationForm] = useState({ user_id: '', relation_type: '' });
  const [parentsForm, setParentsForm] = useState({ fatherName: '', motherName: '' });
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    fetchFamilyTree();
  }, []);

  const fetchFamilyTree = async () => {
    try {
      const response = await axios.get(`${API}/users/family-tree`);
      setUsers(response.data.users || []);
      buildFamilyGraph(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch family tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildFamilyGraph = (usersData) => {
    const nodesList = [];
    const edgesList = [];
    
    // Create nodes for each user
    usersData.forEach((member, index) => {
      const row = Math.floor(index / 4);
      const col = index % 4;
      
      nodesList.push({
        id: member.id,
        type: 'default',
        data: {
          label: (
            <div className="text-center p-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold mb-2">
                {member.name?.charAt(0)}
              </div>
              <div className="text-sm font-semibold text-gray-100">{member.name}</div>
              {member.relationships && member.relationships.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  {member.relationships.length} connections
                </div>
              )}
            </div>
          )
        },
        position: { x: col * 250, y: row * 200 },
        style: {
          background: 'rgba(31, 41, 55, 0.95)',
          border: '2px solid rgb(59, 130, 246)',
          borderRadius: '16px',
          padding: '10px',
          width: 180,
        },
      });
      
      // Create edges for relationships
      if (member.relationships) {
        member.relationships.forEach((rel) => {
          // Avoid duplicate edges
          const edgeExists = edgesList.some(
            e => (e.source === member.id && e.target === rel.user_id) ||
                 (e.source === rel.user_id && e.target === member.id)
          );
          
          if (!edgeExists) {
            edgesList.push({
              id: `${member.id}-${rel.user_id}`,
              source: member.id,
              target: rel.user_id,
              label: rel.relation_type,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#60A5FA', strokeWidth: 2 },
              labelStyle: { fill: '#93C5FD', fontSize: 12, fontWeight: 600 },
              labelBgStyle: { fill: '#1F2937', fillOpacity: 0.9 },
            });
          }
        });
      }
    });
    
    setNodes(nodesList);
    setEdges(edgesList);
  };

  const handleAddRelationship = async () => {
    if (!relationForm.user_id || !relationForm.relation_type) {
      toast.error('Please fill all fields');
      return;
    }
    
    try {
      await axios.post(`${API}/users/relationships`, relationForm);
      toast.success('Relationship added!');
      setShowAddRelation(false);
      setRelationForm({ user_id: '', relation_type: '' });
      fetchFamilyTree();
    } catch (error) {
      toast.error('Failed to add relationship');
    }
  };

  const handleAddParents = async () => {
    if (!parentsForm.fatherName && !parentsForm.motherName) {
      toast.error('Please enter at least one parent name');
      return;
    }
    
    try {
      // Create parent users and relationships
      const promises = [];
      
      if (parentsForm.fatherName) {
        promises.push(
          axios.post(`${API}/users/add-parent`, {
            parentName: parentsForm.fatherName,
            relation: 'parent'
          })
        );
      }
      
      if (parentsForm.motherName) {
        promises.push(
          axios.post(`${API}/users/add-parent`, {
            parentName: parentsForm.motherName,
            relation: 'parent'
          })
        );
      }
      
      await Promise.all(promises);
      toast.success('Parents added to family tree!');
      setShowAddParents(false);
      setParentsForm({ fatherName: '', motherName: '' });
      fetchFamilyTree();
    } catch (error) {
      toast.error('Failed to add parents');
    }
  };

  const onNodeClick = (event, node) => {
    const member = users.find(u => u.id === node.id);
    setSelectedUser(member);
  };

  return (
    <Layout>
      <div data-testid="family-tree-page" className="max-w-full mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-fraunces font-bold text-gray-100">Family Tree</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddParents(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-full font-nunito font-semibold hover:bg-purple-700 transition-all flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Parents</span>
            </button>
            <button
              onClick={() => setShowAddRelation(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-full font-nunito font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Relationship</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-400 font-nunito">Loading family tree...</p>
          </div>
        ) : (
          <>
            {/* Visual Graph */}
            <div className="bg-gray-800 rounded-3xl shadow-lg overflow-hidden border border-gray-700" style={{ height: '600px' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                fitView
                attributionPosition="bottom-left"
              >
                <Background color="#374151" gap={16} />
                <Controls />
                <MiniMap
                  nodeColor="#3B82F6"
                  maskColor="rgba(0, 0, 0, 0.6)"
                  style={{ background: '#1F2937' }}
                />
              </ReactFlow>
            </div>

            {/* Family Members List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
              {users.map((member, idx) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  data-testid={`family-member-${member.id}`}
                  className="bg-gray-800 border border-gray-700 rounded-3xl p-6 shadow-lg hover-lift text-center cursor-pointer"
                  onClick={() => setSelectedUser(member)}
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                    {member.name?.charAt(0)}
                  </div>
                  <h3 className="text-xl font-fraunces font-bold text-gray-100 mb-2">{member.name}</h3>
                  {member.bio && (
                    <p className="text-gray-400 font-nunito text-sm mb-3">{member.bio}</p>
                  )}
                  {member.relationships && member.relationships.length > 0 && (
                    <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{member.relationships.length} connections</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-nunito text-lg">No family members yet. Invite them to join!</p>
          </div>
        )}
      </div>

      {/* Add Relationship Modal */}
      {showAddRelation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-fraunces font-bold text-gray-100">Add Relationship</h3>
              <button onClick={() => setShowAddRelation(false)} className="text-gray-400 hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Select Family Member</label>
                <select
                  value={relationForm.user_id}
                  onChange={(e) => setRelationForm({ ...relationForm, user_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">Select member...</option>
                  {users.filter(u => u.id !== user?.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Relationship Type</label>
                <select
                  value={relationForm.relation_type}
                  onChange={(e) => setRelationForm({ ...relationForm, relation_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">Select type...</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="spouse">Spouse</option>
                  <option value="grandparent">Grandparent</option>
                  <option value="grandchild">Grandchild</option>
                  <option value="cousin">Cousin</option>
                  <option value="aunt/uncle">Aunt/Uncle</option>
                  <option value="niece/nephew">Niece/Nephew</option>
                </select>
              </div>
              <button
                onClick={handleAddRelationship}
                className="w-full bg-blue-600 text-white py-3 rounded-full font-nunito font-semibold hover:bg-blue-700 transition-all"
              >
                Add Relationship
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Parents Modal */}
      {showAddParents && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-fraunces font-bold text-gray-100">Add Parents</h3>
              <button onClick={() => setShowAddParents(false)} className="text-gray-400 hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Father's Name</label>
                <input
                  type="text"
                  value={parentsForm.fatherName}
                  onChange={(e) => setParentsForm({ ...parentsForm, fatherName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="Enter father's name"
                />
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Mother's Name</label>
                <input
                  type="text"
                  value={parentsForm.motherName}
                  onChange={(e) => setParentsForm({ ...parentsForm, motherName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="Enter mother's name"
                />
              </div>
              <button
                onClick={handleAddParents}
                className="w-full bg-purple-600 text-white py-3 rounded-full font-nunito font-semibold hover:bg-purple-700 transition-all"
              >
                Add Parents
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-fraunces font-bold text-gray-100">{selectedUser.name}</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                {selectedUser.name?.charAt(0)}
              </div>
              {selectedUser.bio && (
                <p className="text-gray-300 font-nunito mb-4">{selectedUser.bio}</p>
              )}
            </div>
            {selectedUser.relationships && selectedUser.relationships.length > 0 && (
              <div>
                <h4 className="text-lg font-fraunces font-bold text-gray-100 mb-3">Relationships:</h4>
                <div className="space-y-2">
                  {selectedUser.relationships.map((rel, idx) => {
                    const relatedUser = users.find(u => u.id === rel.user_id);
                    return (
                      <div key={idx} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold">
                            {relatedUser?.name?.charAt(0) || '?'}
                          </div>
                          <span className="text-gray-100 font-nunito">{relatedUser?.name || 'Unknown'}</span>
                        </div>
                        <span className="text-blue-400 text-sm font-semibold capitalize">{rel.relation_type}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

export default FamilyTree;