import React from 'react';
import { Sparkles, MessageCircle, User, BookOpen } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="navbar-container">
      <button
        className={`navbar-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => setActiveTab('home')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          {/* Custom Lotus SVG Path */}
          <path d="M12 2C12 2 9 7 9 10C9 13.5 12 16 12 16C12 16 15 13.5 15 10C15 7 12 2 12 2Z" fill={activeTab === 'home' ? 'rgba(226, 192, 116, 0.2)' : 'none'} />
          <path d="M12 8C12 8 7 10 5 12C3 14 5 16 7 16C10 16 12 13 12 13C12 13 14 16 17 16C19 16 21 14 19 12C17 10 12 8 12 8Z" fill={activeTab === 'home' ? 'rgba(226, 192, 116, 0.15)' : 'none'} />
          <path d="M12 12C12 12 8 14 6 17C4.5 19.25 7 21 9 21C11.5 21 12 17 12 17C12 17 12.5 21 15 21C17 21 19.5 19.25 18 17C16 14 12 12 12 12Z" fill={activeTab === 'home' ? 'rgba(226, 192, 116, 0.1)' : 'none'} />
        </svg>
        <span>ホーム</span>
      </button>

      <button
        className={`navbar-item ${activeTab === 'fortune' ? 'active' : ''}`}
        onClick={() => setActiveTab('fortune')}
      >
        <Sparkles />
        <span>鑑定結果</span>
      </button>

      <button
        className={`navbar-item ${activeTab === 'column' ? 'active' : ''}`}
        onClick={() => setActiveTab('column')}
      >
        <BookOpen />
        <span>コラム</span>
      </button>

      <button
        className={`navbar-item ${activeTab === 'chat' ? 'active' : ''}`}
        onClick={() => setActiveTab('chat')}
      >
        <MessageCircle />
        <span>チャット</span>
      </button>

      <button
        className={`navbar-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
      >
        <User />
        <span>マイページ</span>
      </button>
    </nav>
  );
};
