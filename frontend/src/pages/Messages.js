import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Send, Plus, Users } from 'lucide-react';
import { format } from 'date-fns';

const Messages = () => {
  const { conversationId } = useParams();
  const { user, API } = useContext(AuthContext);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId]);

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

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API}/messages/conversations`);
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/messages/${conversationId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;
    setLoading(true);
    try {
      await axios.post(`${API}/messages`, {
        receiver_id: conversationId,
        message: newMessage,
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div data-testid="messages-page" className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden h-[calc(100vh-200px)] flex">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-100 flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-fraunces font-bold text-textPrimary mb-4">Messages</h2>
              <button
                data-testid="new-message-btn"
                className="w-full bg-coral text-white py-3 rounded-full font-nunito font-semibold hover:bg-[#FF8787] transition-all flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>New Message</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {Object.entries(users).filter(([id]) => id !== user?.id).map(([id, u]) => (
                <button
                  key={id}
                  data-testid={`conversation-${id}`}
                  onClick={() => navigate(`/messages/${id}`)}
                  className={`w-full p-4 flex items-center space-x-3 hover:bg-warmPaper transition-colors ${
                    conversationId === id ? 'bg-warmPaper' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral to-sunshine flex items-center justify-center text-white font-bold">
                    {u.name?.charAt(0)}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-nunito font-semibold text-textPrimary">{u.name}</h3>
                    <p className="text-textMuted text-sm">Click to chat</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {conversationId ? (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-sunshine flex items-center justify-center text-white font-bold">
                    {users[conversationId]?.name?.charAt(0)}
                  </div>
                  <h3 className="font-nunito font-semibold text-textPrimary text-lg">
                    {users[conversationId]?.name}
                  </h3>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto scrollbar-hide space-y-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`chat-bubble ${
                          msg.sender_id === user?.id ? 'chat-bubble-sent' : 'chat-bubble-received'
                        }`}
                      >
                        <p className="font-nunito">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === user?.id ? 'text-white/70' : 'text-textMuted'
                        }`}>
                          {format(new Date(msg.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-6 border-t border-gray-100 flex space-x-3">
                  <input
                    data-testid="message-input"
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-6 py-3 rounded-full bg-[#F0F2F5] border-transparent focus:border-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all"
                  />
                  <button
                    data-testid="send-message-btn"
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || loading}
                    className="bg-coral text-white p-4 rounded-full hover:bg-[#FF8787] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-16 h-16 text-textMuted mx-auto mb-4" />
                  <p className="text-textSecondary font-nunito text-lg">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;