import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  Position
} from 'react-flow-renderer';
import dagre from 'dagre';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Users, Plus, X, Trash2, UserPlus, Heart, Edit2, Link } from 'lucide-react';

// Custom node component for family members
const FamilyMemberNode = ({ data }) => {
  const genderColors = {
    male: 'from-blue-500 to-blue-700',
    female: 'from-pink-500 to-pink-700',
    unknown: 'from-gray-500 to-gray-700'
  };
  
  const genderBorder = {
    male: 'border-blue-400',
    female: 'border-pink-400',
    unknown: 'border-gray-400'
  };

  return (
    <div className="text-center p-3 min-w-[160px]">
      <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${genderColors[data.gender] || genderColors.unknown} flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-lg border-3 ${genderBorder[data.gender] || genderBorder.unknown}`}>
        {data.photo_url ? (
          <img src={data.photo_url} alt={data.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          data.name?.charAt(0)?.toUpperCase() || '?'
        )}
      </div>
      <div className="text-sm font-bold text-gray-100 mb-1 truncate max-w-[140px]">{data.name}</div>
      {data.birth_date && (
        <div className="text-xs text-gray-400">
          {data.birth_date}{data.death_date ? ` - ${data.death_date}` : ''}
        </div>
      )}
      {data.spouse_id && (
        <div className="flex items-center justify-center mt-1 text-xs text-pink-400">
          <Heart className="w-3 h-3 mr-1" fill="#F472B6" />
          <span>Married</span>
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  familyMember: FamilyMemberNode
};

const FamilyTreeNew = () => {
  const { user, API } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [showLinkSpouse, setShowLinkSpouse] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    gender: 'unknown',
    birth_date: '',
    death_date: '',
    father_id: '',
    mother_id: '',
    spouse_id: '',
    bio: ''
  });
  const [linkForm, setLinkForm] = useState({ member1_id: '', member2_id: '' });
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      const response = await axios.get(`${API}/family-members`);
      const fetchedMembers = response.data.members || [];
      setMembers(fetchedMembers);
      buildTree(fetchedMembers);
    } catch (error) {
      console.error('Failed to fetch family members:', error);
      toast.error('Failed to load family tree');
    } finally {
      setLoading(false);
    }
  };

  const getLayoutedElements = (nodes, edges) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ 
      rankdir: 'TB', 
      ranksep: 120, 
      nodesep: 60,
      edgesep: 30,
      marginx: 40,
      marginy: 40
    });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 180, height: 140 });
    });

    edges.forEach((edge) => {
      if (edge.data?.type !== 'spouse') {
        dagreGraph.setEdge(edge.source, edge.target);
      }
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 90,
          y: nodeWithPosition.y - 70,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
    });

    return { nodes: layoutedNodes, edges };
  };

  const buildTree = (membersData) => {
    const nodesList = [];
    const edgesList = [];
    const processedSpouses = new Set();

    membersData.forEach((member) => {
      nodesList.push({
        id: member.id,
        type: 'default',
        data: {
          label: <FamilyMemberNode data={member} />,
          ...member
        },
        style: {
          background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(55, 65, 81, 0.95) 100%)',
          border: member.gender === 'male' ? '2px solid rgb(59, 130, 246)' : 
                  member.gender === 'female' ? '2px solid rgb(236, 72, 153)' : 
                  '2px solid rgb(107, 114, 128)',
          borderRadius: '20px',
          padding: '8px',
          minWidth: 180,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        },
      });

      // Parent-child edges
      if (member.father_id) {
        edgesList.push({
          id: `father-${member.father_id}-${member.id}`,
          source: member.father_id,
          target: member.id,
          type: 'smoothstep',
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#60A5FA',
          },
          style: { stroke: '#60A5FA', strokeWidth: 2 },
          labelStyle: { fill: '#93C5FD', fontSize: 10, fontWeight: 600 },
          labelBgStyle: { fill: '#1F2937', fillOpacity: 0.9, rx: 4, ry: 4 },
        });
      }

      if (member.mother_id) {
        edgesList.push({
          id: `mother-${member.mother_id}-${member.id}`,
          source: member.mother_id,
          target: member.id,
          type: 'smoothstep',
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#F472B6',
          },
          style: { stroke: '#F472B6', strokeWidth: 2 },
          labelStyle: { fill: '#F9A8D4', fontSize: 10, fontWeight: 600 },
          labelBgStyle: { fill: '#1F2937', fillOpacity: 0.9, rx: 4, ry: 4 },
        });
      }

      // Spouse edges (only create once per couple)
      if (member.spouse_id) {
        const coupleKey = [member.id, member.spouse_id].sort().join('-');
        if (!processedSpouses.has(coupleKey)) {
          processedSpouses.add(coupleKey);
          edgesList.push({
            id: `spouse-${coupleKey}`,
            source: member.id,
            target: member.spouse_id,
            type: 'straight',
            animated: true,
            label: '❤️',
            style: { stroke: '#EC4899', strokeWidth: 2, strokeDasharray: '5,5' },
            labelStyle: { fontSize: 14 },
            labelBgStyle: { fill: 'transparent' },
            data: { type: 'spouse' }
          });
        }
      }
    });

    const layouted = getLayoutedElements(nodesList, edgesList);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  };

  const handleAddMember = async () => {
    if (!memberForm.name.trim()) {
      toast.error('Please enter member name');
      return;
    }

    try {
      await axios.post(`${API}/family-members`, memberForm);
      toast.success('Family member added!');
      setShowAddMember(false);
      setMemberForm({
        name: '',
        gender: 'unknown',
        birth_date: '',
        death_date: '',
        father_id: '',
        mother_id: '',
        spouse_id: '',
        bio: ''
      });
      fetchFamilyMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add family member');
    }
  };

  const handleUpdateMember = async () => {
    if (!selectedMember?.id) return;

    try {
      await axios.put(`${API}/family-members/${selectedMember.id}`, memberForm);
      toast.success('Family member updated!');
      setShowEditMember(false);
      setSelectedMember(null);
      fetchFamilyMembers();
    } catch (error) {
      toast.error('Failed to update family member');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this family member? This will also remove their connections.')) return;

    try {
      await axios.delete(`${API}/family-members/${memberId}`);
      toast.success('Family member deleted');
      setSelectedMember(null);
      fetchFamilyMembers();
    } catch (error) {
      toast.error('Failed to delete family member');
    }
  };

  const handleLinkSpouse = async () => {
    if (!linkForm.member1_id || !linkForm.member2_id) {
      toast.error('Please select both members');
      return;
    }

    try {
      await axios.post(`${API}/family-members/link-spouse`, linkForm);
      toast.success('Spouses linked successfully!');
      setShowLinkSpouse(false);
      setLinkForm({ member1_id: '', member2_id: '' });
      fetchFamilyMembers();
    } catch (error) {
      toast.error('Failed to link spouses');
    }
  };

  const onNodeClick = useCallback((event, node) => {
    const member = members.find(m => m.id === node.id);
    setSelectedMember(member);
  }, [members]);

  const openEditModal = (member) => {
    setMemberForm({
      name: member.name || '',
      gender: member.gender || 'unknown',
      birth_date: member.birth_date || '',
      death_date: member.death_date || '',
      father_id: member.father_id || '',
      mother_id: member.mother_id || '',
      spouse_id: member.spouse_id || '',
      bio: member.bio || ''
    });
    setShowEditMember(true);
  };

  // Get available parents (members who could be parents)
  const getMaleMembers = () => members.filter(m => m.gender === 'male');
  const getFemaleMembers = () => members.filter(m => m.gender === 'female');
  const getAvailableSpouses = (currentId) => members.filter(m => m.id !== currentId && !m.spouse_id);

  return (
    <Layout>
      <div data-testid="family-tree-page" className="max-w-full mx-auto py-8 px-4">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-fraunces font-bold text-gray-100 flex items-center space-x-3">
            <span>🌳</span>
            <span>Family Tree</span>
          </h1>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddMember(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-nunito font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2 shadow-lg"
            >
              <UserPlus className="w-5 h-5" />
              <span>Add Member</span>
            </button>
            <button
              onClick={() => setShowLinkSpouse(true)}
              className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-3 rounded-full font-nunito font-semibold hover:from-pink-700 hover:to-rose-700 transition-all flex items-center space-x-2 shadow-lg"
            >
              <Heart className="w-5 h-5" />
              <span>Link Spouses</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">{members.filter(m => m.gender === 'male').length}</div>
            <div className="text-gray-400 text-sm">Male Members</div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <div className="text-2xl font-bold text-pink-400">{members.filter(m => m.gender === 'female').length}</div>
            <div className="text-gray-400 text-sm">Female Members</div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <div className="text-2xl font-bold text-purple-400">{members.length}</div>
            <div className="text-gray-400 text-sm">Total Members</div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <div className="text-2xl font-bold text-rose-400">{members.filter(m => m.spouse_id).length / 2}</div>
            <div className="text-gray-400 text-sm">Married Couples</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-400 font-nunito">Loading family tree...</p>
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-gray-400">Male</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                <span className="text-gray-400">Female</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-400"></div>
                <span className="text-gray-400">Father→Child</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-pink-400"></div>
                <span className="text-gray-400">Mother→Child</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-pink-500" style={{borderStyle: 'dashed'}}></div>
                <span className="text-gray-400">Spouse</span>
              </div>
            </div>

            {/* Family Tree Visualization */}
            <div className="bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-700" style={{ height: '600px' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
              >
                <Background color="#4B5563" gap={20} size={1} />
                <Controls className="bg-gray-700 border border-gray-600" />
                <MiniMap
                  nodeColor={(node) => {
                    if (node.data?.gender === 'male') return '#3B82F6';
                    if (node.data?.gender === 'female') return '#EC4899';
                    return '#6B7280';
                  }}
                  maskColor="rgba(0, 0, 0, 0.7)"
                  style={{ background: '#1F2937', border: '2px solid #374151' }}
                />
              </ReactFlow>
            </div>

            {members.length === 0 && (
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
            className="bg-gray-800 border-2 border-gray-700 rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-fraunces font-bold text-gray-100">Add Family Member</h3>
              <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Gender *</label>
                <select
                  value={memberForm.gender}
                  onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="unknown">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Birth Date</label>
                  <input
                    type="date"
                    value={memberForm.birth_date}
                    onChange={(e) => setMemberForm({ ...memberForm, birth_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Death Date</label>
                  <input
                    type="date"
                    value={memberForm.death_date}
                    onChange={(e) => setMemberForm({ ...memberForm, death_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Father</label>
                <select
                  value={memberForm.father_id}
                  onChange={(e) => setMemberForm({ ...memberForm, father_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">Select father...</option>
                  {getMaleMembers().map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Mother</label>
                <select
                  value={memberForm.mother_id}
                  onChange={(e) => setMemberForm({ ...memberForm, mother_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">Select mother...</option>
                  {getFemaleMembers().map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Bio</label>
                <textarea
                  value={memberForm.bio}
                  onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  rows={3}
                  placeholder="Brief biography..."
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

      {/* Link Spouses Modal */}
      {showLinkSpouse && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border-2 border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-fraunces font-bold text-gray-100">Link Spouses</h3>
              <button onClick={() => setShowLinkSpouse(false)} className="text-gray-400 hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">First Person</label>
                <select
                  value={linkForm.member1_id}
                  onChange={(e) => setLinkForm({ ...linkForm, member1_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">Select person...</option>
                  {members.filter(m => !m.spouse_id).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.gender})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-center">
                <Heart className="w-8 h-8 text-pink-500" fill="#EC4899" />
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Second Person</label>
                <select
                  value={linkForm.member2_id}
                  onChange={(e) => setLinkForm({ ...linkForm, member2_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">Select person...</option>
                  {members.filter(m => !m.spouse_id && m.id !== linkForm.member1_id).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.gender})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleLinkSpouse}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white py-3 rounded-full font-nunito font-semibold hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg"
              >
                Link as Spouses
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Member Detail Modal */}
      {selectedMember && !showEditMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedMember(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border-2 border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-fraunces font-bold text-gray-100">{selectedMember.name}</h3>
              <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center mb-6">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${
                selectedMember.gender === 'male' ? 'from-blue-500 to-blue-700' :
                selectedMember.gender === 'female' ? 'from-pink-500 to-pink-700' :
                'from-gray-500 to-gray-700'
              } flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 shadow-lg`}>
                {selectedMember.name?.charAt(0)?.toUpperCase()}
              </div>
              <p className="text-gray-400 capitalize">{selectedMember.gender}</p>
              {selectedMember.birth_date && (
                <p className="text-gray-400 text-sm mt-2">
                  Born: {selectedMember.birth_date}
                  {selectedMember.death_date && ` • Died: ${selectedMember.death_date}`}
                </p>
              )}
              {selectedMember.bio && (
                <p className="text-gray-300 mt-4">{selectedMember.bio}</p>
              )}
            </div>

            {/* Relationships */}
            <div className="space-y-3 mb-6">
              {selectedMember.father_id && (
                <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                  <span className="text-gray-400">Father</span>
                  <span className="text-gray-100">{members.find(m => m.id === selectedMember.father_id)?.name || 'Unknown'}</span>
                </div>
              )}
              {selectedMember.mother_id && (
                <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                  <span className="text-gray-400">Mother</span>
                  <span className="text-gray-100">{members.find(m => m.id === selectedMember.mother_id)?.name || 'Unknown'}</span>
                </div>
              )}
              {selectedMember.spouse_id && (
                <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                  <span className="text-gray-400">Spouse</span>
                  <span className="text-pink-400">{members.find(m => m.id === selectedMember.spouse_id)?.name || 'Unknown'}</span>
                </div>
              )}
              {/* Children */}
              {members.filter(m => m.father_id === selectedMember.id || m.mother_id === selectedMember.id).length > 0 && (
                <div className="bg-gray-700 rounded-lg p-3">
                  <span className="text-gray-400 block mb-2">Children</span>
                  <div className="flex flex-wrap gap-2">
                    {members.filter(m => m.father_id === selectedMember.id || m.mother_id === selectedMember.id).map(child => (
                      <span key={child.id} className="bg-gray-600 text-gray-100 px-3 py-1 rounded-full text-sm">
                        {child.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => openEditModal(selectedMember)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-full font-nunito font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteMember(selectedMember.id)}
                className="flex-1 bg-red-600 text-white py-3 rounded-full font-nunito font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditMember && selectedMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border-2 border-gray-700 rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-fraunces font-bold text-gray-100">Edit {selectedMember.name}</h3>
              <button onClick={() => { setShowEditMember(false); setSelectedMember(null); }} className="text-gray-400 hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Gender</label>
                <select
                  value={memberForm.gender}
                  onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="unknown">Unknown</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Birth Date</label>
                  <input
                    type="date"
                    value={memberForm.birth_date}
                    onChange={(e) => setMemberForm({ ...memberForm, birth_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Death Date</label>
                  <input
                    type="date"
                    value={memberForm.death_date}
                    onChange={(e) => setMemberForm({ ...memberForm, death_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Father</label>
                <select
                  value={memberForm.father_id}
                  onChange={(e) => setMemberForm({ ...memberForm, father_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">No father selected</option>
                  {getMaleMembers().filter(m => m.id !== selectedMember.id).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Mother</label>
                <select
                  value={memberForm.mother_id}
                  onChange={(e) => setMemberForm({ ...memberForm, mother_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">No mother selected</option>
                  {getFemaleMembers().filter(m => m.id !== selectedMember.id).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-nunito font-semibold text-gray-300 mb-2">Bio</label>
                <textarea
                  value={memberForm.bio}
                  onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  rows={3}
                />
              </div>
              <button
                onClick={handleUpdateMember}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-full font-nunito font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

export default FamilyTreeNew;
