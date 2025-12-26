import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, MarkerType } from 'react-flow-renderer';
import dagre from 'dagre';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Users, Plus, X, Trash2, UserPlus } from 'lucide-react';

const FamilyTree = () => {
  const { user, API } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [relationForm, setRelationForm] = useState({ user_id: '', relation_type: '' });
  const [memberForm, setMemberForm] = useState({ name: '', relation: '', fatherName: '', motherName: '' });
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    fetchFamilyTree();
  }, []);

  const fetchFamilyTree = async () => {
    try {
      const response = await axios.get(`${API}/users/family-tree`);
      setUsers(response.data.users || []);
      buildHierarchicalTree(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch family tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLayoutedElements = (nodes, edges) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 80 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 180, height: 120 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.position = {
        x: nodeWithPosition.x - 90,
        y: nodeWithPosition.y - 60,
      };
    });

    return { nodes, edges };
  };

  const buildHierarchicalTree = (usersData) => {
    const nodesList = [];
    const edgesList = [];
    
    usersData.forEach((member) => {
      nodesList.push({
        id: member.id,
        type: 'default',
        data: {
          label: (
            <div className="text-center p-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-lg">
                {member.name?.charAt(0)}
              </div>
              <div className="text-sm font-bold text-gray-100 mb-1">{member.name}</div>
              {member.relationships && member.relationships.length > 0 && (
                <div className="text-xs text-blue-400">
                  {member.relationships.length} connections
                </div>
              )}
            </div>
          )
        },
        style: {
          background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(55, 65, 81, 0.95) 100%)',
          border: '2px solid rgb(59, 130, 246)',
          borderRadius: '20px',
          padding: '12px',
          width: 180,
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        },
      });
      
      if (member.relationships) {
        member.relationships.forEach((rel) => {
          const edgeExists = edgesList.some(
            e => (e.source === member.id && e.target === rel.user_id) ||
                 (e.source === rel.user_id && e.target === member.id)
          );
          
          if (!edgeExists && ['parent', 'father', 'mother'].includes(rel.relation_type.toLowerCase())) {
            edgesList.push({
              id: `${member.id}-${rel.user_id}`,
              source: rel.user_id,
              target: member.id,
              label: rel.relation_type,
              type: 'smoothstep',
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#60A5FA',
              },
              style: { stroke: '#60A5FA', strokeWidth: 2 },
              labelStyle: { fill: '#93C5FD', fontSize: 11, fontWeight: 700 },
              labelBgStyle: { fill: '#1F2937', fillOpacity: 0.95, rx: 8, ry: 8 },
            });
          }
        });
      }
    });
    
    const layouted = getLayoutedElements(nodesList, edgesList);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  };

  const handleAddMember = async () => {
    if (!memberForm.name) {
      toast.error('Please enter member name');
      return;
    }
    
    try {
      const payload = {
        name: memberForm.name,
        relation: memberForm.relation,
        fatherName: memberForm.fatherName,
        motherName: memberForm.motherName,
      };
      
      await axios.post(`${API}/users/add-family-member`, payload);
      toast.success('Family member added!');
      setShowAddMember(false);
      setMemberForm({ name: '', relation: '', fatherName: '', motherName: '' });
      fetchFamilyTree();
    } catch (error) {
      toast.error('Failed to add family member');
    }
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

  const handleDeleteRelationship = async (userId, relationUserId) => {
    if (!window.confirm('Are you sure you want to remove this relationship?')) return;
    
    try {
      await axios.delete(`${API}/users/relationships/${userId}/${relationUserId}`);
      toast.success('Relationship removed');
      fetchFamilyTree();
    } catch (error) {
      toast.error('Failed to remove relationship');
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
          <h1 className="text-4xl font-fraunces font-bold text-gray-100 flex items-center space-x-3">
            <span>🌳</span>
            <span>Family Tree</span>
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddMember(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-nunito font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2 shadow-lg"
            >
              <UserPlus className="w-5 h-5" />
              <span>Add Family Member</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-400 font-nunito">Loading family tree...</p>
          </div>
        ) : (
          <>
            {/* Hierarchical Flowchart */}
            <div className="bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-700" style={{ height: '700px' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                fitView
                attributionPosition="bottom-left"
              >
                <Background color="#4B5563" gap={20} size={1} />
                <Controls className="bg-gray-700 border border-gray-600" />
                <MiniMap
                  nodeColor="#3B82F6"
                  maskColor="rgba(0, 0, 0, 0.7)"
                  style={{ background: '#1F2937', border: '2px solid #374151' }}
                />
              </ReactFlow>
            </div>

            {users.length === 0 && (
              <div className="text-center py-20">
                <Users className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-nunito text-lg mb-6">Start building your family tree!</p>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-full font-nunito font-semibold hover:bg-blue-700 transition-all"
                >
                  Add First Member
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Family Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border-2 border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-fraunces font-bold text-gray-100">Add Family Member</h3>
              <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Member Name *</label>
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Relationship to You</label>
                <select
                  value={memberForm.relation}
                  onChange={(e) => setMemberForm({ ...memberForm, relation: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">Select relationship...</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="spouse">Spouse</option>
                  <option value="grandparent">Grandparent</option>
                  <option value="grandchild">Grandchild</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Father's Name (Optional)</label>
                <input
                  type="text"
                  value={memberForm.fatherName}
                  onChange={(e) => setMemberForm({ ...memberForm, fatherName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="Enter father's name"
                />
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Mother's Name (Optional)</label>
                <input
                  type="text"
                  value={memberForm.motherName}
                  onChange={(e) => setMemberForm({ ...memberForm, motherName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="Enter mother's name"
                />
              </div>
              <button
                onClick={handleAddMember}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-full font-nunito font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
              >
                Add to Family Tree
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border-2 border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-fraunces font-bold text-gray-100">{selectedUser.name}</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 shadow-lg">
                {selectedUser.name?.charAt(0)}
              </div>
              {selectedUser.bio && (
                <p className="text-gray-300 font-nunito mb-4">{selectedUser.bio}</p>
              )}
              {selectedUser.birthday && (
                <p className="text-gray-400 text-sm">🎂 {new Date(selectedUser.birthday).toLocaleDateString()}</p>
              )}
            </div>
            {selectedUser.relationships && selectedUser.relationships.length > 0 && (
              <div>
                <h4 className="text-lg font-fraunces font-bold text-gray-100 mb-3">Family Connections:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedUser.relationships.map((rel, idx) => {
                    const relatedUser = users.find(u => u.id === rel.user_id);
                    return (
                      <div key={idx} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold">
                            {relatedUser?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <span className="text-gray-100 font-nunito font-semibold block">{relatedUser?.name || 'Unknown'}</span>
                            <span className="text-blue-400 text-xs capitalize">{rel.relation_type}</span>
                          </div>
                        </div>
                        {selectedUser.id === user?.id && (
                          <button
                            onClick={() => handleDeleteRelationship(selectedUser.id, rel.user_id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Remove relationship"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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