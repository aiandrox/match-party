import { render, screen, fireEvent } from "@testing-library/react";
import { GameEndedView } from "./GameEnded.component";
import { Room } from "@/types";

jest.mock("./GameEnded.presenter", () => ({
  useGameEndedPresenter: jest.fn(),
}));

describe("GameEndedView", () => {
  const mockUseGameEndedPresenter = require("./GameEnded.presenter").useGameEndedPresenter;

  const defaultPresenterReturn = {
    gameRounds: [],
    isLoadingHistory: false,
    selectedRound: null,
    roundAnswers: [],
    loadRoundAnswers: jest.fn(),
    gameStatistics: {
      totalRounds: 0,
      matchedRounds: 0,
      matchRate: 0,
    },
    answerStyle: {
      bgColor: "bg-gray-50 border-gray-200",
      textColor: "text-gray-900",
    },
  };

  const createMockRoom = (): Room => ({
    id: "room123",
    code: "ABC123DEF456GHI789JK",
    status: "ended",
    participants: [],
    currentGameRoundId: undefined,
    createdAt: new Date(),
    expiresAt: new Date(),
  });

  const createMockGameRounds = () => [
    { id: "round1", roundNumber: 1, topicContent: "お題1", judgment: "match" },
    { id: "round2", roundNumber: 2, topicContent: "お題2", judgment: "no-match" },
    { id: "round3", roundNumber: 3, topicContent: "お題3", judgment: "match" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGameEndedPresenter.mockReturnValue(defaultPresenterReturn);
  });

  describe("基本表示", () => {
    it("ゲーム終了画面の基本要素が表示される", () => {
      const room = createMockRoom();
      render(<GameEndedView room={room} currentUserId="user1" />);

      expect(screen.getByText("ゲーム終了")).toBeInTheDocument();
      expect(screen.getByText("終了")).toBeInTheDocument();
      expect(screen.getByText("ゲーム結果")).toBeInTheDocument();
    });
  });

  describe("ローディング状態", () => {
    it("履歴読み込み中はローディング表示される", () => {
      mockUseGameEndedPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isLoadingHistory: true,
      });

      const room = createMockRoom();
      render(<GameEndedView room={room} currentUserId="user1" />);

      expect(screen.getByText("履歴を読み込んでいます...")).toBeInTheDocument();
    });
  });

  describe("統計情報表示", () => {
    it("ゲームラウンドがある場合は統計情報が表示される", () => {
      mockUseGameEndedPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        gameRounds: createMockGameRounds(),
        isLoadingHistory: false,
        gameStatistics: {
          totalRounds: 3,
          matchedRounds: 2,
          matchRate: 67,
        },
      });

      const room = createMockRoom();
      render(<GameEndedView room={room} currentUserId="user1" />);

      expect(screen.getByText("総ラウンド数")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument(); // 総ラウンド数
      expect(screen.getByText("一致回数")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument(); // 一致回数
      expect(screen.getByText("一致率")).toBeInTheDocument();
      expect(screen.getByText("67%")).toBeInTheDocument(); // 一致率
    });

    it("ゲームラウンドがない場合は統計情報が非表示", () => {
      const room = createMockRoom();
      render(<GameEndedView room={room} currentUserId="user1" />);

      expect(screen.queryByText("総ラウンド数")).not.toBeInTheDocument();
      expect(screen.queryByText("一致回数")).not.toBeInTheDocument();
      expect(screen.queryByText("一致率")).not.toBeInTheDocument();
    });

    it("ローディング中は統計情報が非表示", () => {
      mockUseGameEndedPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        gameRounds: createMockGameRounds(),
        isLoadingHistory: true,
      });

      const room = createMockRoom();
      render(<GameEndedView room={room} currentUserId="user1" />);

      expect(screen.queryByText("総ラウンド数")).not.toBeInTheDocument();
    });
  });

  describe("ゲーム結果一覧", () => {
    it("ゲームラウンドが表示される", () => {
      mockUseGameEndedPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        gameRounds: createMockGameRounds(),
      });

      const room = createMockRoom();
      render(<GameEndedView room={room} currentUserId="user1" />);

      expect(screen.getByText("第1ラウンド")).toBeInTheDocument();
      expect(screen.getByText("第2ラウンド")).toBeInTheDocument();
      expect(screen.getByText("第3ラウンド")).toBeInTheDocument();
      expect(screen.getAllByText("一致")).toHaveLength(2);
      expect(screen.getByText("不一致")).toBeInTheDocument();
    });

    it("ラウンドクリック時にPresenterのloadRoundAnswersが呼ばれる", () => {
      const loadRoundAnswers = jest.fn();
      const gameRounds = createMockGameRounds();
      mockUseGameEndedPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        gameRounds,
        loadRoundAnswers,
      });

      const room = createMockRoom();
      render(<GameEndedView room={room} currentUserId="user1" />);

      const firstRound = screen.getByText("第1ラウンド");
      fireEvent.click(firstRound);

      expect(loadRoundAnswers).toHaveBeenCalledWith(gameRounds[0]);
    });

    it("ゲームラウンドがない場合の表示", () => {
      mockUseGameEndedPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        gameRounds: [],
        isLoadingHistory: false,
      });

      const room = createMockRoom();
      render(<GameEndedView room={room} currentUserId="user1" />);

      // ゲーム結果のタイトルは表示されるが、ラウンドは表示されない
      expect(screen.getByText("ゲーム結果")).toBeInTheDocument();
      expect(screen.queryByText("第1ラウンド")).not.toBeInTheDocument();
    });
  });

  describe("選択されたラウンドの回答表示", () => {
    it("ラウンドが選択されている場合は回答が表示される", () => {
      mockUseGameEndedPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        selectedRound: { id: "round1", roundNumber: 1, topicContent: "お題1", judgment: "match" },
        roundAnswers: [
          { content: "回答1", userName: "プレイヤー1", hasAnswered: true, submittedAt: new Date() },
          { content: "回答2", userName: "プレイヤー2", hasAnswered: true, submittedAt: new Date() },
        ],
      });

      const room = createMockRoom();
      render(<GameEndedView room={room} currentUserId="user1" />);

      expect(screen.getByText("第1ラウンドの回答")).toBeInTheDocument();
      expect(screen.getByText("お題1")).toBeInTheDocument();
      expect(screen.getByText("回答1")).toBeInTheDocument();
      expect(screen.getByText("回答2")).toBeInTheDocument();
      expect(screen.getByText("プレイヤー1")).toBeInTheDocument();
      expect(screen.getByText("プレイヤー2")).toBeInTheDocument();
    });

    it("ラウンドが選択されていない場合は回答詳細が非表示", () => {
      const room = createMockRoom();
      render(<GameEndedView room={room} currentUserId="user1" />);

      expect(screen.queryByText("第1ラウンドの回答")).not.toBeInTheDocument();
    });
  });

  describe("一致率計算", () => {
    it("全て一致の場合は100%が表示される", () => {
      mockUseGameEndedPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        gameRounds: [
          { id: "round1", roundNumber: 1, topicContent: "お題1", judgment: "match" },
          { id: "round2", roundNumber: 2, topicContent: "お題2", judgment: "match" },
        ],
        isLoadingHistory: false,
        gameStatistics: {
          totalRounds: 2,
          matchedRounds: 2,
          matchRate: 100,
        },
      });

      const room = createMockRoom();
      render(<GameEndedView room={room} currentUserId="user1" />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("全て不一致の場合は0%が表示される", () => {
      mockUseGameEndedPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        gameRounds: [
          { id: "round1", roundNumber: 1, topicContent: "お題1", judgment: "no-match" },
          { id: "round2", roundNumber: 2, topicContent: "お題2", judgment: "no-match" },
        ],
        isLoadingHistory: false,
        gameStatistics: {
          totalRounds: 2,
          matchedRounds: 0,
          matchRate: 0,
        },
      });

      const room = createMockRoom();
      render(<GameEndedView room={room} currentUserId="user1" />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });
});
