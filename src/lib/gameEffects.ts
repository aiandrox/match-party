/**
 * ゲーム効果音とアニメーションを管理するユーティリティ
 * 
 * 音源について:
 * - 効果音: On-Jin ～音人～ (https://otologic.jp/)
 * - フリー音素材として無償使用許可済み
 * - 著作権: otologic.jp
 */

// 音声効果を再生する関数
export function playMatchSound(): void {
  try {
    // 音声ファイルを再生
    const audio = new Audio('/sounds/quiz-ding-dong.mp3');
    audio.volume = 0.3; // 音量を控えめに設定
    audio.play().catch(error => {
      console.warn('Match sound playback failed:', error);
    });
  } catch (error) {
    console.warn('Match sound playback failed:', error);
  }
}

export function playNoMatchSound(): void {
  try {
    // 音声ファイルを再生
    const audio = new Audio('/sounds/quiz-buzzer.mp3');
    audio.volume = 0.3; // 音量を控えめに設定
    audio.play().catch(error => {
      console.warn('No match sound playback failed:', error);
    });
  } catch (error) {
    console.warn('No match sound playback failed:', error);
  }
}

export function playQuestionSound(): void {
  try {
    // 問題音声ファイルを再生
    const audio = new Audio('/sounds/quiz-question.mp3');
    audio.volume = 0.2; // 問題音は少し小さめに
    audio.play().catch(error => {
      console.warn('Question sound playback failed:', error);
    });
  } catch (error) {
    console.warn('Question sound playback failed:', error);
  }
}


// 紙吹雪エフェクト（一致時のみ）
export function createConfettiEffect(): void {
  // 簡単な紙吹雪エフェクト
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
  const confettiCount = 50;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background-color: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}vw;
      top: -10px;
      z-index: 1000;
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
      pointer-events: none;
    `;
    
    document.body.appendChild(confetti);
    
    // アニメーション終了後に要素を削除
    setTimeout(() => {
      if (confetti.parentNode) {
        confetti.parentNode.removeChild(confetti);
      }
    }, 5000);
  }
}

// CSSアニメーションを動的に追加
export function injectGameAnimations(): void {
  const styleId = 'game-animations';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes match-celebration {
      0% { 
        transform: scale(1) rotate(0deg);
        background-color: inherit;
      }
      25% { 
        transform: scale(1.1) rotate(5deg);
        background-color: #10b981;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
      }
      50% { 
        transform: scale(1.2) rotate(-5deg);
        background-color: #059669;
        box-shadow: 0 0 30px rgba(5, 150, 105, 0.7);
      }
      75% { 
        transform: scale(1.1) rotate(3deg);
        background-color: #10b981;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
      }
      100% { 
        transform: scale(1) rotate(0deg);
        background-color: #dcfce7;
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
      }
    }
    
    @keyframes no-match-shake {
      0% { 
        transform: translateX(0);
        background-color: inherit;
      }
      10% { 
        transform: translateX(-10px);
        background-color: #ef4444;
        box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
      }
      20% { 
        transform: translateX(10px);
        background-color: #dc2626;
        box-shadow: 0 0 20px rgba(220, 38, 38, 0.7);
      }
      30% { 
        transform: translateX(-8px);
        background-color: #ef4444;
      }
      40% { 
        transform: translateX(8px);
        background-color: #dc2626;
      }
      50% { 
        transform: translateX(-5px);
        background-color: #ef4444;
      }
      60% { 
        transform: translateX(5px);
        background-color: #dc2626;
      }
      70% { 
        transform: translateX(-3px);
        background-color: #ef4444;
      }
      80% { 
        transform: translateX(3px);
        background-color: #dc2626;
      }
      90% { 
        transform: translateX(-1px);
        background-color: #ef4444;
      }
      100% { 
        transform: translateX(0);
        background-color: #fecaca;
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
      }
    }
    
    @keyframes confetti-fall {
      0% {
        transform: translateY(0) rotateZ(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotateZ(360deg);
        opacity: 0;
      }
    }
    
    .animate-match-celebration {
      animation: match-celebration 1.5s ease-in-out;
    }
    
    .animate-no-match-shake {
      animation: no-match-shake 1s ease-in-out;
    }
    
    @keyframes match-text-celebration {
      0% { 
        transform: scale(0.8) rotate(-10deg);
        opacity: 0;
      }
      25% { 
        transform: scale(1.2) rotate(5deg);
        opacity: 1;
        text-shadow: 0 0 20px rgba(34, 197, 94, 0.8);
      }
      50% { 
        transform: scale(1.1) rotate(-2deg);
        text-shadow: 0 0 30px rgba(34, 197, 94, 1);
      }
      75% { 
        transform: scale(1.05) rotate(1deg);
        text-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
      }
      100% { 
        transform: scale(1) rotate(0deg);
        opacity: 1;
        text-shadow: 0 0 10px rgba(34, 197, 94, 0.4);
      }
    }
    
    @keyframes no-match-text-wobble {
      0% { 
        transform: scale(0.9) rotate(0deg);
        opacity: 0;
      }
      20% { 
        transform: scale(1.1) rotate(-5deg);
        opacity: 1;
        text-shadow: 0 0 15px rgba(239, 68, 68, 0.8);
      }
      40% { 
        transform: scale(1.05) rotate(3deg);
        text-shadow: 0 0 20px rgba(239, 68, 68, 1);
      }
      60% { 
        transform: scale(1.02) rotate(-2deg);
        text-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
      }
      80% { 
        transform: scale(1.01) rotate(1deg);
        text-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
      }
      100% { 
        transform: scale(1) rotate(0deg);
        opacity: 1;
        text-shadow: 0 0 5px rgba(239, 68, 68, 0.3);
      }
    }
    
    .animate-match-text {
      animation: match-text-celebration 2s ease-out;
    }
    
    .animate-no-match-text {
      animation: no-match-text-wobble 2s ease-out;
    }
  `;
  
  document.head.appendChild(style);
}