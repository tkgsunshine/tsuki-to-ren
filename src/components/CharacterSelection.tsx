import React from 'react';

interface CharacterSelectionProps {
  selectedCharacter: 'ren' | 'tsuki';
  setSelectedCharacter: (char: 'ren' | 'tsuki') => void;
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  selectedCharacter,
  setSelectedCharacter,
}) => {
  return (
    <div className="character-select-container">
      <div className="character-select-title">
        相談するキャラクターを選んでください
      </div>
      <div className="character-cards-grid">
        {/* Card Ren */}
        <div
          className={`character-card ${selectedCharacter === 'ren' ? 'active-ren ren-active' : ''}`}
          onClick={() => setSelectedCharacter('ren')}
        >
          <img src="/assets/ren.webp" alt="蓮" />
          <div className="character-card-overlay">
            <div className="character-card-name ren-text">蓮</div>
            <div className="character-card-desc">理性と導きの象徴</div>
          </div>
        </div>

        {/* Card Tsuki */}
        <div
          className={`character-card ${selectedCharacter === 'tsuki' ? 'active-tsuki tsuki-active' : ''}`}
          onClick={() => setSelectedCharacter('tsuki')}
        >
          <img src="/assets/tsuki.webp" alt="月" />
          <div className="character-card-overlay">
            <div className="character-card-name tsuki-text">月</div>
            <div className="character-card-desc">直感と優しさの象徴</div>
          </div>
        </div>
      </div>
    </div>
  );
};
