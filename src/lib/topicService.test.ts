import { getRandomTopic } from './topicService';

// topics.jsonをモック
jest.mock('@/data/topics.json', () => [
  "赤い野菜といえば？",
  "緑色の野菜といえば？", 
  "白い食材といえば？",
  "黄色い食材といえば？",
  "丸い食材といえば？"
]);

describe('topicService', () => {
  // Math.randomをモック
  let mockMathRandom: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMathRandom = jest.spyOn(Math, 'random');
  });

  afterEach(() => {
    mockMathRandom.mockRestore();
  });

  describe('getRandomTopic', () => {
    it('正常にランダムなお題が取得される', () => {
      mockMathRandom.mockReturnValue(0.0); // 最初の要素を選択

      const result = getRandomTopic();

      expect(result).toBe("赤い野菜といえば？");
    });

    it('異なるランダム値で異なるお題が取得される', () => {
      // 2番目の要素を選択（0.2 * 5 = 1.0 -> floor(1) = 1）
      mockMathRandom.mockReturnValue(0.2);
      expect(getRandomTopic()).toBe("緑色の野菜といえば？");

      // 4番目の要素を選択（0.6 * 5 = 3.0 -> floor(3) = 3）
      mockMathRandom.mockReturnValue(0.6);
      expect(getRandomTopic()).toBe("黄色い食材といえば？");

      // 最後の要素を選択（0.99 * 5 = 4.95 -> floor(4) = 4）
      mockMathRandom.mockReturnValue(0.99);
      expect(getRandomTopic()).toBe("丸い食材といえば？");
    });

    it('境界値のテスト - 最初の要素', () => {
      mockMathRandom.mockReturnValue(0.0);

      const result = getRandomTopic();

      expect(result).toBe("赤い野菜といえば？");
    });

    it('境界値のテスト - 最後の要素', () => {
      mockMathRandom.mockReturnValue(0.9999); // ギリギリ最後の要素

      const result = getRandomTopic();

      expect(result).toBe("丸い食材といえば？");
    });

    it('複数回呼び出して全ての要素が取得可能であることを確認', () => {
      const allTopics = [
        "赤い野菜といえば？",
        "緑色の野菜といえば？", 
        "白い食材といえば？",
        "黄色い食材といえば？",
        "丸い食材といえば？"
      ];
      const results = new Set<string>();

      // 各インデックスに対応するランダム値を設定
      allTopics.forEach((_, index) => {
        const randomValue = index / allTopics.length; // 0.0, 0.2, 0.4, 0.6, 0.8
        mockMathRandom.mockReturnValueOnce(randomValue);
        results.add(getRandomTopic());
      });

      // 全ての要素が取得できることを確認
      expect(results.size).toBe(allTopics.length);
      allTopics.forEach(topic => {
        expect(results.has(topic)).toBe(true);
      });
    });

  });



  describe('パフォーマンステスト', () => {
    it('大量呼び出しでも正常に動作する', () => {
      const startTime = Date.now();
      
      // 10000回呼び出し（実際のrandomを使用）
      mockMathRandom.mockRestore();
      for (let i = 0; i < 10000; i++) {
        getRandomTopic();
      }
      mockMathRandom = jest.spyOn(Math, 'random');
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // 10000回の呼び出しが1秒以内に完了することを確認
      expect(executionTime).toBeLessThan(1000);
    });

    it('メモリリークが発生しないことを確認', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 大量呼び出し（実際のrandomを使用）
      mockMathRandom.mockRestore();
      for (let i = 0; i < 50000; i++) {
        getRandomTopic();
      }
      mockMathRandom = jest.spyOn(Math, 'random');
      
      // ガベージコレクションを強制実行
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // メモリ増加が10MB以下であることを確認（大きなリークがないことを検証）
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});