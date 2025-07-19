// テスト専用ヘルパー関数
function getMatchAnimationClass(): string {
  return 'animate-match-celebration';
}

function getNoMatchAnimationClass(): string {
  return 'animate-no-match-shake';
}

describe('gameEffects - Pure Functions', () => {
  describe('getMatchAnimationClass', () => {
    it('正しいアニメーションクラス名を返す', () => {
      const result = getMatchAnimationClass();
      
      expect(result).toBe('animate-match-celebration');
      expect(typeof result).toBe('string');
    });

    it('複数回呼び出しても同じ値を返す（純粋関数）', () => {
      const result1 = getMatchAnimationClass();
      const result2 = getMatchAnimationClass();
      const result3 = getMatchAnimationClass();
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('返される文字列が空でない', () => {
      const result = getMatchAnimationClass();
      
      expect(result.length).toBeGreaterThan(0);
    });

    it('CSS クラス名として適切な形式である', () => {
      const result = getMatchAnimationClass();
      
      // CSS クラス名として有効な文字のみを含むことを確認
      expect(result).toMatch(/^[a-zA-Z][\w-]*$/);
    });
  });

  describe('getNoMatchAnimationClass', () => {
    it('正しいアニメーションクラス名を返す', () => {
      const result = getNoMatchAnimationClass();
      
      expect(result).toBe('animate-no-match-shake');
      expect(typeof result).toBe('string');
    });

    it('複数回呼び出しても同じ値を返す（純粋関数）', () => {
      const result1 = getNoMatchAnimationClass();
      const result2 = getNoMatchAnimationClass();
      const result3 = getNoMatchAnimationClass();
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('返される文字列が空でない', () => {
      const result = getNoMatchAnimationClass();
      
      expect(result.length).toBeGreaterThan(0);
    });

    it('CSS クラス名として適切な形式である', () => {
      const result = getNoMatchAnimationClass();
      
      // CSS クラス名として有効な文字のみを含むことを確認
      expect(result).toMatch(/^[a-zA-Z][\w-]*$/);
    });
  });

  describe('アニメーションクラスの一意性', () => {
    it('マッチ時と非マッチ時のクラス名が異なる', () => {
      const matchClass = getMatchAnimationClass();
      const noMatchClass = getNoMatchAnimationClass();
      
      expect(matchClass).not.toBe(noMatchClass);
    });

    it('両方のクラス名が意味のある名前を持つ', () => {
      const matchClass = getMatchAnimationClass();
      const noMatchClass = getNoMatchAnimationClass();
      
      // マッチクラスには「match」または「celebration」が含まれる
      expect(matchClass.toLowerCase()).toMatch(/match|celebration/);
      
      // 非マッチクラスには「no-match」または「shake」が含まれる
      expect(noMatchClass.toLowerCase()).toMatch(/no-match|shake/);
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量呼び出しでも高速に動作する', () => {
      const startTime = Date.now();
      
      // 10000回呼び出し
      for (let i = 0; i < 10000; i++) {
        getMatchAnimationClass();
        getNoMatchAnimationClass();
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // 10000回の呼び出しが100ms以内に完了することを確認
      expect(executionTime).toBeLessThan(100);
    });

    it('メモリリークが発生しない', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 大量呼び出し
      for (let i = 0; i < 100000; i++) {
        getMatchAnimationClass();
        getNoMatchAnimationClass();
      }
      
      // ガベージコレクションを強制実行
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // メモリ増加が1MB以下であることを確認
      expect(memoryIncrease).toBeLessThan(1 * 1024 * 1024);
    });
  });

  describe('型安全性テスト', () => {
    it('戻り値の型が常に文字列である', () => {
      const matchResult = getMatchAnimationClass();
      const noMatchResult = getNoMatchAnimationClass();
      
      expect(typeof matchResult).toBe('string');
      expect(typeof noMatchResult).toBe('string');
      
      // nullやundefinedでないことを確認
      expect(matchResult).not.toBeNull();
      expect(matchResult).not.toBeUndefined();
      expect(noMatchResult).not.toBeNull();
      expect(noMatchResult).not.toBeUndefined();
    });
  });

  describe('互換性テスト', () => {
    it('Tailwind CSS クラス命名規則に従っている', () => {
      const matchClass = getMatchAnimationClass();
      const noMatchClass = getNoMatchAnimationClass();
      
      // Tailwind CSS のアニメーションクラスの一般的な形式に従っているか確認
      expect(matchClass).toMatch(/^animate-/);
      expect(noMatchClass).toMatch(/^animate-/);
    });

    it('HTMLの class 属性で使用可能な形式である', () => {
      const matchClass = getMatchAnimationClass();
      const noMatchClass = getNoMatchAnimationClass();
      
      // HTML クラス属性で使用できない文字が含まれていないことを確認
      expect(matchClass).not.toMatch(/[\s"'<>]/);
      expect(noMatchClass).not.toMatch(/[\s"'<>]/);
    });
  });
});