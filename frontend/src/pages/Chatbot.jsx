import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../api';
import { Send } from 'lucide-react';

const Chatbot = ({ data }) => {
  const [messages, setMessages] = useState([
      { role: 'assistant', text: 'Hi! I am your AI Finance Assistant. Ask me anything about your uploaded statement or general finance advice!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
     endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
      e.preventDefault();
      if (!input.trim() || loading) return;

      const userMsg = input.trim();
      setInput('');
      setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setLoading(true);

      try {
          // Pass the statement ID so backend has context
          const response = await sendChatMessage(userMsg, data?._id, data);
          setMessages(prev => [...prev, { role: 'assistant', text: response.reply }]);
      } catch (error) {
          setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error. Please try again later.' }]);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="animation-fade-in flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
         <div className="app-header" style={{ padding: '0 0 1rem', flexShrink: 0 }}>
            <h2>AI Assistant</h2>
        </div>

        <div className="glass-card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`chat-bubble-container ${msg.role}`}>
                        <div className={`chat-bubble ${msg.role}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="chat-bubble-container assistant">
                        <div className="chat-bubble assistant" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                            Typing...
                        </div>
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your spending..."
                        className="chat-input"
                        disabled={loading}
                    />
                    <button type="submit" className="btn btn-icon" disabled={!input.trim() || loading} style={{ borderRadius: '50%', padding: '0.8rem' }}>
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default Chatbot;
