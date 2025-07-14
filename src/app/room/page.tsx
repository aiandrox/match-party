"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Room, RoomStatus, JudgmentResult } from "@/types";

function RoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("code") || "";

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<{ content: string; round: number } | null>(null);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [allAnswers, setAllAnswers] = useState<
    Array<{ content: string; userName: string; submittedAt: Date }>
  >([]);
  const [hostJudgment, setHostJudgment] = useState<"match" | "no-match" | null>(null);
  const [isStartingNextRound, setIsStartingNextRound] = useState(false);
  const [isEndingGame, setIsEndingGame] = useState(false);
  const [isForceRevealing, setIsForceRevealing] = useState(false);
  const [gameRounds, setGameRounds] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedRound, setSelectedRound] = useState<any>(null);
  const [roundAnswers, setRoundAnswers] = useState<any[]>([]);

  useEffect(() => {
    if (!roomCode) {
      setError("ルームコードが指定されていません");
      setIsLoading(false);
      return;
    }

    // localStorageからユーザーIDを取得
    const userId = localStorage.getItem(`userId_${roomCode}`);
    setCurrentUserId(userId);

    let unsubscribe: (() => void) | undefined;

    const loadRoom = async () => {
      try {
        // userIdが取得できない場合はルーム情報を表示しない
        if (!userId) {
          setError("このルームへの参加権限が確認できません");
          setIsLoading(false);
          return;
        }

        // 動的インポートでFirebase初期化を避ける
        const { getRoomByCode } = await import("@/lib/roomService");
        const roomData = await getRoomByCode(roomCode);
        if (!roomData) {
          setError("ルームが見つかりません");
          setIsLoading(false);
          return;
        }

        // ルームの有効期限をチェック
        const now = new Date();
        const expiresAt =
          roomData.expiresAt instanceof Date ? roomData.expiresAt : new Date(roomData.expiresAt);

        if (now > expiresAt) {
          setError("このルームは有効期限が切れています");
          setIsLoading(false);
          return;
        }

        // ユーザーがルームの参加者として存在するかチェック
        const isParticipant = roomData.participants.some((p) => p.id === userId);
        if (!isParticipant) {
          setError("このルームへの参加権限がありません");
          setIsLoading(false);
          return;
        }

        setRoom(roomData);
        setIsLoading(false);

        // ゲーム中または回答公開中の場合はお題を取得
        if (roomData.status === "playing" || roomData.status === "revealing") {
          const { getTopicByRoomId } = await import("@/lib/roomService");
          const topic = await getTopicByRoomId(roomData.id);
          if (topic) {
            setCurrentTopic(topic);
            setCurrentTopicId(topic.id);

            // 回答公開中の場合は回答データも取得
            if (roomData.status === "revealing") {
              loadAnswersForRevealing(roomData);

              // 現在の判定結果を取得
              setHostJudgment(roomData.currentJudgment || null);
            }
          }
        }

        // 現在のユーザーの回答状態を確認
        const currentUser = roomData.participants.find((p) => p.id === userId);
        if (currentUser) {
          setHasSubmittedAnswer(currentUser.hasAnswered);
        }

        // リアルタイム更新の監視を開始
        const { subscribeToRoom } = await import("@/lib/roomService");
        unsubscribe = subscribeToRoom(roomData.id, async (updatedRoom) => {
          if (updatedRoom) {
            // ルームの有効期限をチェック
            const now = new Date();
            const expiresAt =
              updatedRoom.expiresAt instanceof Date
                ? updatedRoom.expiresAt
                : new Date(updatedRoom.expiresAt);

            if (now > expiresAt) {
              setError("このルームは有効期限が切れました");
              setRoom(null);
              return;
            }

            // ユーザーがまだ参加者として存在するかチェック
            const isStillParticipant = updatedRoom.participants.some((p) => p.id === userId);
            if (isStillParticipant) {
              setRoom(updatedRoom);

              // ゲーム中または回答公開中になった場合はお題を取得
              if (
                (updatedRoom.status === RoomStatus.PLAYING ||
                  updatedRoom.status === RoomStatus.REVEALING) &&
                !currentTopic
              ) {
                const { getTopicByRoomId } = await import("@/lib/roomService");
                const topic = await getTopicByRoomId(updatedRoom.id);
                if (topic) {
                  setCurrentTopic(topic);
                  setCurrentTopicId(topic.id);

                  // 回答公開中の場合は回答データも取得
                  if (updatedRoom.status === RoomStatus.REVEALING) {
                    loadAnswersForRevealing(updatedRoom);

                    // 現在の判定結果を取得
                    setHostJudgment(updatedRoom.currentJudgment || null);
                  }
                }
              }

              // 新しいお題に切り替わった場合は状態をリセット
              if (updatedRoom.status === RoomStatus.PLAYING && currentTopicId) {
                const { getTopicByRoomId } = await import("@/lib/roomService");
                const newTopic = await getTopicByRoomId(updatedRoom.id);
                if (newTopic && newTopic.id !== currentTopicId) {
                  // 新しいラウンドが開始された
                  setCurrentTopic(newTopic);
                  setCurrentTopicId(newTopic.id);
                  setHostJudgment(null);
                  setAllAnswers([]);
                  setSubmittedAnswer("");
                  setHasSubmittedAnswer(false);
                }
              }

              // 現在のユーザーの回答状態を更新
              const currentUser = updatedRoom.participants.find((p) => p.id === userId);
              if (currentUser) {
                setHasSubmittedAnswer(currentUser.hasAnswered);
              }

              // 新しいラウンドで回答状態がリセットされた場合の処理
              if (
                updatedRoom.status === RoomStatus.PLAYING &&
                currentUser &&
                !currentUser.hasAnswered &&
                hasSubmittedAnswer
              ) {
                // 新しいラウンドで回答状態がリセットされた
                setSubmittedAnswer("");
                setHasSubmittedAnswer(false);
              }

              // revealingステータスになった場合は回答データを取得
              if (updatedRoom.status === RoomStatus.REVEALING) {
                loadAnswersForRevealing(updatedRoom);

                // 現在の判定結果を取得
                setHostJudgment(updatedRoom.currentJudgment || null);
              }

              // 判定結果の更新を監視（revealingステータス中のみ）
              if (updatedRoom.status === RoomStatus.REVEALING) {
                // roomの現在の判定結果を反映
                setHostJudgment(updatedRoom.currentJudgment || null);
              }
            } else {
              // 参加者から削除された場合はエラー表示
              setError("ルームから退出されました");
              setRoom(null);
            }
          } else {
            // ルームが削除された場合
            setError("ルームが削除されました");
            setRoom(null);
          }
        });
      } catch (err) {
        setError("ルームの読み込みに失敗しました");
        setIsLoading(false);
      }
    };

    loadRoom();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [roomCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGameRounds = useCallback(async (roomId: string) => {
    try {
      setIsLoadingHistory(true);
      const { getGameRoundsByRoomId } = await import("@/lib/gameRoundService");
      const gameRounds = await getGameRoundsByRoomId(roomId);

      // データを表示用に変換
      const formattedRounds = gameRounds.map((round) => ({
        id: round.id,
        roundNumber: round.roundNumber,
        judgment: round.judgment,
        topicContent: round.topicContent,
        gameRoundId: round.id, // GameRoundのIDを使用
      }));

      setGameRounds(formattedRounds);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("ゲームラウンド読み込みエラー:", err);
      setGameRounds([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const loadRoundAnswers = useCallback(async (round: any) => {
    try {
      const { getGameRoundAnswers } = await import("@/lib/gameHistoryService");
      const answers = await getGameRoundAnswers(round.id);
      setRoundAnswers(answers);
      setSelectedRound(round);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("回答読み込みエラー:", err);
      setRoundAnswers([]);
    }
  }, []);

  // ゲーム終了時の履歴読み込み
  useEffect(() => {
    if (room && room.status === RoomStatus.ENDED && gameRounds.length === 0) {
      loadGameRounds(room.id);
    }
  }, [room, gameRounds.length, loadGameRounds]);

  // 回答公開用のデータ読み込み
  const loadAnswersForRevealing = async (roomData: Room) => {
    try {
      if (!roomData.currentGameRoundId) {
        return;
      }
      const { getAnswersByGameRoundId } = await import("@/lib/roomService");
      const answers = await getAnswersByGameRoundId(roomData.currentGameRoundId);

      setAllAnswers(answers);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load answers:", err);
    }
  };

  // 主催者による一致判定
  const handleHostJudgment = async (judgment: JudgmentResult) => {
    if (!room || !currentTopicId) return;

    try {
      const { saveHostJudgment } = await import("@/lib/roomService");
      await saveHostJudgment(room.id, judgment);
      setHostJudgment(judgment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "判定の保存に失敗しました");
    }
  };

  // 次のラウンドを開始
  const handleStartNextRound = async () => {
    if (!room) return;

    setIsStartingNextRound(true);
    try {
      const { startNextRound } = await import("@/lib/roomService");
      await startNextRound(room.id);
      // 状態をリセット（リアルタイム更新で新しいお題が設定される）
      setHostJudgment(null);
      setAllAnswers([]);
      setSubmittedAnswer(""); // 次ラウンドで送信済み回答をクリア
      setHasSubmittedAnswer(false); // 回答状態もリセット
      // currentTopicとcurrentTopicIdはリアルタイム更新で設定されるのでここではリセットしない
    } catch (err) {
      setError(err instanceof Error ? err.message : "次のラウンドの開始に失敗しました");
    } finally {
      setIsStartingNextRound(false);
    }
  };

  // ゲームを終了
  const handleEndGame = async () => {
    if (!room) return;

    setIsEndingGame(true);
    try {
      const { endGame } = await import("@/lib/roomService");
      await endGame(room.id);
      // リアルタイム更新で状態が変更される
    } catch (err) {
      setError(err instanceof Error ? err.message : "ゲーム終了に失敗しました");
    } finally {
      setIsEndingGame(false);
    }
  };

  const handleForceRevealAnswers = async () => {
    if (!room) return;

    setIsForceRevealing(true);
    try {
      // roomServiceに強制公開関数を追加する必要があります
      const { forceRevealAnswers } = await import("@/lib/roomService");
      await forceRevealAnswers(room.id);
      // リアルタイム更新で状態が変更される
    } catch (err) {
      setError(err instanceof Error ? err.message : "回答公開に失敗しました");
    } finally {
      setIsForceRevealing(false);
    }
  };

  const copyRoomCode = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(roomCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        // fallback for non-HTTPS environments
        const textArea = document.createElement("textarea");
        textArea.value = roomCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand("copy");
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch (fallbackErr) {
          // eslint-disable-next-line no-console
          console.error("Copy failed:", fallbackErr);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Copy failed:", err);
    }
  };

  const handleStartGame = async () => {
    if (!room) return;

    setIsStartingGame(true);
    try {
      const { startGame } = await import("@/lib/roomService");
      await startGame(room.id);
      // リアルタイム更新でステータスが変更される
    } catch (err) {
      setError(err instanceof Error ? err.message : "ゲーム開始に失敗しました");
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!room || !currentUserId || !currentTopicId || !answer.trim()) return;

    setIsSubmittingAnswer(true);
    try {
      const { submitAnswer } = await import("@/lib/roomService");
      await submitAnswer(room.id, currentUserId, answer);
      // 送信した回答を保存
      setSubmittedAnswer(answer);
      // リアルタイム更新で回答状態が変更される
      setAnswer(""); // 回答フィールドをクリア
    } catch (err) {
      setError(err instanceof Error ? err.message : "回答送信に失敗しました");
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const getStatusText = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.WAITING:
        return "参加者募集中";
      case RoomStatus.PLAYING:
        return "ゲーム進行中";
      case RoomStatus.REVEALING:
        return "回答公開中";
      case RoomStatus.ENDED:
        return "ゲーム終了";
      default:
        return "不明";
    }
  };

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.WAITING:
        return "bg-blue-100 text-blue-800";
      case RoomStatus.PLAYING:
        return "bg-green-100 text-green-800";
      case RoomStatus.REVEALING:
        return "bg-yellow-100 text-yellow-800";
      case RoomStatus.ENDED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ルームを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.828 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">エラー</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-2">
              {error.includes("参加権限") && !error.includes("有効期限") && (
                <button
                  onClick={() => router.push("/join-room")}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ルームに参加
                </button>
              )}
              {error.includes("有効期限") && (
                <button
                  onClick={() => router.push("/create-room")}
                  className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  新しいルームを作成
                </button>
              )}
              <button
                onClick={() => router.push("/")}
                className="bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">ゲームルーム</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                room.status
              )}`}
            >
              {getStatusText(room.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">ルームコード</h3>
              <div className="flex items-center space-x-2">
                <code className="text-lg font-mono bg-white px-3 py-2 rounded border flex-1">
                  {room.code}
                </code>
                <button
                  onClick={copyRoomCode}
                  className="px-3 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors"
                >
                  {copySuccess ? "✓" : "コピー"}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">参加者数</h3>
              <p className="text-2xl font-bold text-gray-900">{room.participants.length} / 20</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">参加者一覧</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {room.participants.map((participant) => {
                const isCurrentUser = participant.id === currentUserId;
                return (
                  <div
                    key={participant.id}
                    className={`flex items-center space-x-3 rounded-lg p-3 ${
                      isCurrentUser
                        ? "bg-blue-50 border-2 border-blue-200"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {participant.isHost ? (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCurrentUser ? "bg-blue-200" : "bg-yellow-100"
                          }`}
                        >
                          <span
                            className={`text-sm font-medium ${
                              isCurrentUser ? "text-blue-700" : "text-yellow-600"
                            }`}
                          >
                            👑
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCurrentUser ? "bg-blue-200" : "bg-blue-100"
                          }`}
                        >
                          <span
                            className={`text-sm font-medium ${
                              isCurrentUser ? "text-blue-700" : "text-blue-600"
                            }`}
                          >
                            👤
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isCurrentUser ? "text-blue-900" : "text-gray-900"
                        }`}
                      >
                        {participant.name}
                        {isCurrentUser && <span className="text-blue-600 ml-1">(あなた)</span>}
                      </p>
                      <p className={`text-xs ${isCurrentUser ? "text-blue-600" : "text-gray-500"}`}>
                        {participant.isHost ? "ホスト" : "参加者"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {room.status === RoomStatus.WAITING && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ゲーム開始前</h2>
            <p className="text-gray-600 mb-4">参加者がそろったらホストがゲームを開始できます。</p>
            {/* ホストのみにゲーム開始ボタンを表示 */}
            {room.participants.some((p) => p.id === currentUserId && p.isHost) ? (
              <div className="space-y-3">
                <button
                  onClick={handleStartGame}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    room.participants.length < 2 || isStartingGame
                      ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  }`}
                  disabled={room.participants.length < 2 || isStartingGame}
                >
                  {isStartingGame ? "ゲーム開始中..." : "ゲーム開始"}
                </button>
                {room.participants.length < 2 && (
                  <p className="text-sm text-gray-500 text-center">
                    ゲーム開始には2人以上の参加者が必要です
                  </p>
                )}
              </div>
            ) : (
              /* ホスト以外の参加者には待機メッセージを表示 */
              <div className="text-center">
                <p className="text-gray-600">ホストがゲームを開始するまでお待ちください</p>
              </div>
            )}
          </div>
        )}

        {room.status === RoomStatus.PLAYING && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ゲーム進行中</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                お題 {currentTopic && `(第${currentTopic.round}ラウンド)`}
              </h3>
              <p className="text-blue-800 text-xl font-semibold">
                {currentTopic ? currentTopic.content : "お題を読み込み中..."}
              </p>
            </div>

            {!hasSubmittedAnswer ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                    あなたの回答
                  </label>
                  <input
                    type="text"
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="回答を入力してください"
                    maxLength={50}
                    disabled={isSubmittingAnswer}
                  />
                  <p className="mt-1 text-sm text-gray-500">50文字以内で入力してください</p>
                </div>

                <button
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || isSubmittingAnswer}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    !answer.trim() || isSubmittingAnswer
                      ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  }`}
                >
                  {isSubmittingAnswer ? "送信中..." : "回答を送信"}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">✓ 回答を送信しました</p>
                <div className="mt-3 p-3 bg-white border border-green-300 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">あなたの回答:</p>
                  <p className="text-green-900 font-semibold text-lg">{submittedAnswer}</p>
                </div>
                <p className="text-green-600 text-sm mt-2">他の参加者の回答をお待ちください</p>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">回答状況</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {room.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`flex items-center space-x-2 p-2 rounded ${
                      participant.hasAnswered ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        participant.hasAnswered ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <span className="text-sm text-gray-700 truncate">
                      {participant.name}
                      {participant.id === currentUserId && " (あなた)"}
                    </span>
                  </div>
                ))}
              </div>

              {/* 主催者による強制回答オープン */}
              {room.participants.some((p) => p.id === currentUserId && p.isHost) && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    回答済み: {room.participants.filter((p) => p.hasAnswered).length} /{" "}
                    {room.participants.length}
                  </p>
                  {(() => {
                    const answeredCount = room.participants.filter((p) => p.hasAnswered).length;
                    const canForceReveal = answeredCount >= 2;

                    return (
                      <>
                        <button
                          onClick={handleForceRevealAnswers}
                          disabled={isForceRevealing || !canForceReveal}
                          className={`py-2 px-6 rounded-lg transition-colors font-medium ${
                            isForceRevealing || !canForceReveal
                              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                              : "bg-orange-600 text-white hover:bg-orange-700"
                          }`}
                        >
                          {isForceRevealing ? "公開中..." : "回答を公開する"}
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          {canForceReveal
                            ? "全員の回答を待たずに強制的に回答を公開します"
                            : "回答公開には2人以上の回答が必要です"}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {room.status === RoomStatus.ENDED && (
          <div className="space-y-6">
            {/* ゲーム履歴表示 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="space-y-6">
                {/* ゲーム結果一覧 */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">ゲーム結果</h3>
                  {isLoadingHistory ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">履歴を読み込んでいます...</p>
                    </div>
                  ) : gameRounds.length > 0 ? (
                    <div className="space-y-3">
                      {gameRounds.map((round) => (
                        <div
                          key={round.id}
                          className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => loadRoundAnswers(round)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-gray-900">
                              第{round.roundNumber}ラウンド
                            </div>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                round.judgment === "match"
                                  ? "bg-green-100 text-green-800"
                                  : round.judgment === "no-match"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {round.judgment === "match"
                                ? "一致"
                                : round.judgment === "no-match"
                                ? "不一致"
                                : "判定なし"}
                            </div>
                          </div>
                          <div className="text-gray-700 mb-2 font-bold">{round.topicContent}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">ゲーム履歴がありません</p>
                    </div>
                  )}
                </div>

                {/* 選択したラウンドの回答詳細 */}
                {selectedRound && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      第{selectedRound.roundNumber}ラウンドの回答
                    </h3>
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-900 mb-2">お題:</div>
                      <div className="text-blue-800 font-bold">{selectedRound.topicContent}</div>
                    </div>

                    {roundAnswers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {roundAnswers.map((answer) => {
                          // 判定結果に基づく色設定
                          let bgColor = "bg-gray-50 border-gray-200";
                          let textColor = "text-gray-900";

                          if (selectedRound.judgment === JudgmentResult.MATCH) {
                            bgColor = "bg-green-100 border-green-300";
                            textColor = "text-green-900";
                          } else if (selectedRound.judgment === JudgmentResult.NO_MATCH) {
                            bgColor = "bg-red-100 border-red-300";
                            textColor = "text-red-900";
                          }

                          return (
                            <div key={answer.id} className={`p-4 rounded-lg border ${bgColor}`}>
                              <p className={`font-bold text-xl mb-2 ${textColor}`}>
                                {answer.content}
                              </p>
                              <p className="text-sm text-gray-600 text-right">{answer.userName}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <p>このラウンドには回答がありません</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ホームに戻るボタン */}
            <div className="text-center">
              <button
                onClick={() => router.push("/")}
                className="bg-slate-600 text-white py-3 px-6 rounded-lg hover:bg-slate-700 transition-colors font-medium"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        )}

        {room.status === RoomStatus.REVEALING && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">回答発表</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                お題 {currentTopic && `(第${currentTopic.round}ラウンド)`}
              </h3>
              <p className="text-blue-800 text-xl font-semibold">
                {currentTopic ? currentTopic.content : "お題を読み込み中..."}
              </p>
            </div>

            {/* 判定結果表示 */}
            {hostJudgment && (
              <div className="mb-6">
                {hostJudgment === JudgmentResult.MATCH ? (
                  <h3 className="text-2xl font-bold text-green-800 mb-2 text-center">
                    🎉 全員一致
                  </h3>
                ) : (
                  <h3 className="text-2xl font-bold text-red-800 mb-2 text-center">
                    ❌ 全員一致ならず
                  </h3>
                )}
              </div>
            )}

            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allAnswers.map((answer, index) => {
                  // 判定後の色設定
                  let bgColor = "bg-gray-50 border-gray-200";
                  let textColor = "text-gray-900";

                  if (hostJudgment === JudgmentResult.MATCH) {
                    bgColor = "bg-green-100 border-green-300";
                    textColor = "text-green-900";
                  } else if (hostJudgment === JudgmentResult.NO_MATCH) {
                    bgColor = "bg-red-100 border-red-300";
                    textColor = "text-red-900";
                  }

                  return (
                    <div key={index} className={`p-4 rounded-lg border ${bgColor}`}>
                      <p className={`font-bold text-xl mb-2 ${textColor}`}>{answer.content}</p>
                      <p className="text-sm text-gray-600 text-right">
                        {answer.userName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ホストのみに一致判定ボタンを表示 */}
            {room.participants.some((p) => p.id === currentUserId && p.isHost) && !hostJudgment && (
              <div className="text-center mb-6">
                <p className="text-gray-700 font-medium mb-4">回答の一致を判定してください</p>
                <div className="space-x-4">
                  <button
                    onClick={() => handleHostJudgment(JudgmentResult.MATCH)}
                    className="bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    全員一致
                  </button>
                  <button
                    onClick={() => handleHostJudgment(JudgmentResult.NO_MATCH)}
                    className="bg-red-600 text-white py-3 px-8 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    全員一致ならず
                  </button>
                </div>
              </div>
            )}

            {/* ホストのみに次のラウンドまたは終了ボタンを表示 */}
            {room.participants.some((p) => p.id === currentUserId && p.isHost) && hostJudgment && (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  次のラウンドを開始するか、ゲームを終了してください
                </p>
                <div className="space-x-3">
                  <button
                    onClick={handleStartNextRound}
                    disabled={isStartingNextRound}
                    className={`py-2 px-6 rounded-lg transition-colors font-medium ${
                      isStartingNextRound
                        ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isStartingNextRound ? "開始中..." : "次のラウンド"}
                  </button>
                  <button
                    onClick={handleEndGame}
                    disabled={isEndingGame}
                    className={`py-2 px-6 rounded-lg transition-colors font-medium ${
                      isEndingGame
                        ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                        : "bg-gray-600 text-white hover:bg-gray-700"
                    }`}
                  >
                    {isEndingGame ? "終了中..." : "ゲーム終了"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
            <p className="text-gray-600">ページを読み込んでいます...</p>
          </div>
        </div>
      }
    >
      <RoomContent />
    </Suspense>
  );
}
