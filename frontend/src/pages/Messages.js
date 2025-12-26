import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import EmojiPicker from 'emoji-picker-react';
import { Send, Plus, Users, Smile, Paperclip, Trash2, Link as LinkIcon } from 'lucide-react';
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchUsers();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      setShowEmojiPicker(false);
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await axios.delete(`${API}/messages/${messageId}`);
      toast.success('Message deleted');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  const handleLinkShare = () => {
    if (linkUrl.trim()) {
      setNewMessage(prev => prev + ' ' + linkUrl);
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const renderMessageContent = (content) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, i) => {
      if (isValidUrl(part)) {
        // Check if it's a YouTube link
        if (part.includes('youtube.com') || part.includes('youtu.be')) {
          const videoId = part.includes('youtu.be') 
            ? part.split('youtu.be/')[1]?.split('?')[0]
            : new URL(part).searchParams.get('v');
          if (videoId) {
            return (
              <div key={i} className="mt-2">
                <iframe
                  width="280"
                  height="157"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
              </div>
            );
          }
        }
        // Regular link
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all"
          >
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <Layout>
      <div data-testid="messages-page" className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-gray-800 border-2 border-gray-700 rounded-3xl shadow-2xl overflow-hidden h-[calc(100vh-200px)] flex">
          {/* Conversations List */}
          <div className="w-1/3 border-r-2 border-gray-700 flex flex-col">
            <div className="p-6 border-b-2 border-gray-700 bg-gray-850">
              <h2 className="text-2xl font-fraunces font-bold text-gray-100 mb-4">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {Object.entries(users).filter(([id]) => id !== user?.id).map(([id, u]) => (
                <button
                  key={id}
                  data-testid={`conversation-${id}`}
                  onClick={() => navigate(`/messages/${id}`)}
                  className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-750 transition-colors border-b border-gray-700/50 ${
                    conversationId === id ? 'bg-gray-750' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {u.name?.charAt(0)}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-nunito font-semibold text-gray-100">{u.name}</h3>
                    <p className="text-gray-400 text-sm">Click to chat</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-gray-900">
            {conversationId ? (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b-2 border-gray-700 flex items-center space-x-3 bg-gray-850">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {users[conversationId]?.name?.charAt(0)}
                  </div>
                  <h3 className="font-nunito font-semibold text-gray-100 text-lg">
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
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className="flex items-end space-x-2">
                        {msg.sender_id === user?.id && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div
                          className={`chat-bubble ${
                            msg.sender_id === user?.id ? 'chat-bubble-sent' : 'chat-bubble-received'
                          }`}
                        >
                          <div className="font-nunito">{renderMessageContent(msg.message)}</div>
                          <p className={`text-xs mt-1 ${
                            msg.sender_id === user?.id ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 border-t-2 border-gray-700 bg-gray-850">
                  {/* Link Input */}
                  {showLinkInput && (
                    <div className="mb-3 flex space-x-2">
                      <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="Paste YouTube, Instagram, or any link..."
                        className="flex-1 px-4 py-2 rounded-xl bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <button
                        onClick={handleLinkShare}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
                        className="text-gray-400 hover:text-gray-200"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="mb-3">
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        theme="dark"
                        width="100%"
                        height="350px"
                      />
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="flex space-x-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="text-gray-400 hover:text-yellow-400 transition-colors p-2"
                        title="Emojis"
                      >
                        <Smile className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        className="text-gray-400 hover:text-blue-400 transition-colors p-2"
                        title="Share link"
                      >
                        <LinkIcon className="w-6 h-6" />
                      </button>
                    </div>
                    <input
                      data-testid="message-input"
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-6 py-3 rounded-full bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button
                      data-testid="send-message-btn"
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || loading}
                      className="bg-blue-600 text-white p-4 rounded-full hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 font-nunito text-lg">Select a conversation to start chatting</p>
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