import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { queryAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';

const ChatInterface = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your Enterprise RAG Assistant. How can I help you today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    setError(null);

    try {
      const response = await queryAPI.submit(query);
      const data = response.data;
      
      const assistantMessage = { 
        role: 'assistant', 
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence,
        department: data.department
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Query error:', err);
      setError(err.response?.data?.error || 'Failed to get response from AI. Please check if the backend is running and you have an API key.');
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: 'Error: Failed to fetch response. Please ensure your API key is configured correctly in the backend.',
        type: 'error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-container">
      <div className="header">
        <h1>Intelligence Chat</h1>
        <p>Ask questions across your enterprise knowledge base.</p>
      </div>

      <div className="chat-container">
        <div className="message-list">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role === 'system' ? 'system-msg' : msg.role}`}>
              <div className="message-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="sources-section">
                    <div className="sources-header">
                      <BookOpen size={14} />
                      <span>Sources</span>
                    </div>
                    <div className="sources-list">
                      {msg.sources.map((src, sidx) => (
                        <div key={sidx} className="source-tag" title={src.chunkPreview}>
                          {src.title} ({Math.round(src.similarity * 100)}%)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant loading">
              <Loader2 className="animate-spin" size={20} />
              <span>Analyzing documents and generating response...</span>
            </div>
          )}
          {error && (
             <div className="error-alert">
                <AlertCircle size={18} />
                <span>{error}</span>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="input-area" onSubmit={handleSend}>
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about policies, finance, or engineering..." 
              disabled={loading}
            />
            <button className="send-btn" type="submit" disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </form>
      </div>
      
      <style>{`
        .sources-section {
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .sources-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .sources-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .source-tag {
          font-size: 0.7rem;
          background: rgba(99, 102, 241, 0.1);
          color: var(--primary);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }
        .message.assistant.loading {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-muted);
          font-size: 0.875rem;
          background: transparent;
        }
        .error-alert {
          align-self: center;
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
          padding: 0.75rem 1rem;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          border: 1px solid rgba(239, 68, 68, 0.2);
          margin-bottom: 1rem;
        }
        .system-msg {
          align-self: center;
          font-size: 0.875rem;
          color: var(--error);
          background: rgba(239, 68, 68, 0.05);
          border: 1px dashed var(--error);
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
