import React, { useState } from 'react';
import { 
  MessageSquare, 
  Files, 
  BarChart3, 
  Settings, 
  LogOut, 
  User,
  Search,
  Plus,
  Shield,
  Menu,
  X
} from 'lucide-react';
import './App.css';
import ChatInterface from './components/ChatInterface';

// Component Stubs
const DocumentsView = () => (
  <div className="view-container">
    <div className="header">
      <h1>Document Library</h1>
      <div className="header-actions">
        <button className="btn btn-primary">
          <Plus size={20} />
          Upload Document
        </button>
      </div>
    </div>
    <div className="doc-grid">
      <div className="card">
        <h3>System Overview.pdf</h3>
        <p>Engineering • Created 2 hours ago</p>
      </div>
    </div>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={20} /> },
    { id: 'docs', label: 'Documents', icon: <Files size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'admin', label: 'Admin', icon: <Shield size={20} /> },
  ];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">RG</div>
            <span>RAG Enterprise</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button 
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">AD</div>
            <div className="user-info">
              <span className="name">Admin User</span>
              <span className="role">Administrator</span>
            </div>
          </div>
          <button className="nav-item logout">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="breadcrumb">
            {navItems.find(i => i.id === activeTab)?.label}
          </div>
          <div className="top-actions">
            <button className="icon-btn"><Settings size={20} /></button>
            <button className="icon-btn"><User size={20} /></button>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'docs' && <DocumentsView />}
          {activeTab === 'analytics' && <div>Analytics View (Coming Soon)</div>}
          {activeTab === 'admin' && <div>Admin View (Coming Soon)</div>}
        </div>
      </main>
    </div>
  );
}

export default App;
