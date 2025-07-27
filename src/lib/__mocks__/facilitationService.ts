// facilitationService のモック
export const generateFacilitationSuggestions = jest.fn().mockResolvedValue({
  suggestions: [
    {
      id: 'mock-suggestion-1',
      type: 'group',
      message: 'みなさんの回答について詳しく聞いてみませんか？',
      priority: 3,
      category: 'common'
    }
  ],
  analysisTimestamp: new Date(),
  totalAnswers: 2,
  uniqueAnswers: 1,
  commonPatterns: []
});