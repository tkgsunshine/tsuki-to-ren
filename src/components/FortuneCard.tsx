import React from 'react';

interface FortuneCardProps {
  selectedCharacter: 'ren' | 'tsuki';
}

export const FortuneCard: React.FC<FortuneCardProps> = ({ selectedCharacter }) => {
  // Messages and star ratings change based on who is selected to guide them
  const fortuneData = {
    ren: {
      stars: 4,
      message: '連絡を待つより、あなたから動く日。理性が道を切り拓きます。',
    },
    tsuki: {
      stars: 5,
      message: 'あなたの直感が真実を告げています。優しさが二人の距離を縮めるでしょう。',
    },
  };

  const { stars, message } = fortuneData[selectedCharacter];

  return (
    <div className="fortune-card-section">
      <div className="glass-panel fortune-card-inner">
        <div className="fortune-card-icon-container">
          <img src="/assets/lotus-emblem.jpg" alt="蓮の紋章" className="animate-float" />
        </div>
        <div className="fortune-card-details">
          <div className="fortune-card-title font-serif">
            <span>✦</span> 今日の恋愛運 <span>✦</span>
          </div>
          <div className="fortune-card-stars">
            {Array.from({ length: 5 }).map((_, idx) => (
              <span key={idx} style={{ opacity: idx < stars ? 1 : 0.25 }}>★</span>
            ))}
          </div>
          <p className="fortune-card-text font-serif">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};
