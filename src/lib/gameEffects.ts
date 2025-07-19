/**
 * ゲーム効果音とアニメーションを管理するユーティリティ
 */

// 音声効果を再生する関数
export function playMatchSound(): void {
  try {
    // Web Audio APIを使用して「ピンポーン」音を生成
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // ピンポーン音: 高い「ピン」→低い「ポーン」
    const createTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      // 音量の設定
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
      
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };
    
    // 「ピン」（高い音）
    createTone(1000, 0, 0.3);
    // 「ポーン」（低めの音）
    createTone(800, 0.25, 0.5);
  } catch (error) {
    console.warn('Match sound playback failed:', error);
  }
}

export function playNoMatchSound(): void {
  try {
    // Web Audio APIを使用して「ブブー」音を生成
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // ブブー音: 低い音の2回繰り返し
    const createBuzzTone = (startTime: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'square'; // より「ブー」らしい音質
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime + startTime); // 低い音
      
      // 音量の設定
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + startTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + startTime + 0.25);
      
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + 0.3);
    };
    
    // 「ブ」「ブー」の2回繰り返し
    createBuzzTone(0);     // 1回目の「ブ」
    createBuzzTone(0.35);  // 2回目の「ブー」
  } catch (error) {
    console.warn('No match sound playback failed:', error);
  }
}

// アニメーション用のCSS クラス名を生成
export function getMatchAnimationClass(): string {
  return 'animate-match-celebration';
}

export function getNoMatchAnimationClass(): string {
  return 'animate-no-match-shake';
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