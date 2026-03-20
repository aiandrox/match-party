import { useState, useEffect, useCallback, useRef } from "react";
import { DisplayReaction } from "@/types";

const REACTION_DISPLAY_DURATION = 5000;
const COOLDOWN_DURATION = 500;

export const REACTION_EMOJIS = ["😂", "👏", "😮", "🔥", "👍"];

export function useReactions(
  gameRoundId: string | null,
  currentUserId: string | null,
  currentUserName: string | null
) {
  const [displayReactions, setDisplayReactions] = useState<DisplayReaction[]>([]);
  const [cooldown, setCooldown] = useState(false);
  const seenReactionIds = useRef<Set<string>>(new Set());
  const displayTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!gameRoundId) return;

    seenReactionIds.current = new Set();

    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const setup = async () => {
      const { subscribeToReactions } = await import("@/lib/reactionService");
      // アンマウント済みの場合はリスナーを登録しない
      if (!isMounted) return;
      let isFirstSnapshot = true;
      unsubscribe = subscribeToReactions(gameRoundId, (reactions) => {
        reactions.forEach((reaction) => {
          if (seenReactionIds.current.has(reaction.id)) return;
          seenReactionIds.current.add(reaction.id);

          // 初回スナップショット（ページロード時の既存データ）は表示しない
          if (isFirstSnapshot) return;

          const displayId = `${reaction.id}-${Date.now()}`;
          const x = Math.floor(Math.random() * 80) + 10;

          setDisplayReactions((prev) => [
            ...prev,
            { displayId, emoji: reaction.emoji, fromUserName: reaction.fromUserName, x },
          ]);

          const timeoutId = setTimeout(() => {
            setDisplayReactions((prev) => prev.filter((r) => r.displayId !== displayId));
            displayTimeoutsRef.current.delete(timeoutId);
          }, REACTION_DISPLAY_DURATION);
          displayTimeoutsRef.current.add(timeoutId);
        });
        isFirstSnapshot = false;
      });
    };

    setup();

    const displayTimeouts = displayTimeoutsRef.current;
    return () => {
      isMounted = false;
      unsubscribe?.();
      displayTimeouts.forEach(clearTimeout);
      displayTimeouts.clear();
    };
  }, [gameRoundId]);

  useEffect(() => {
    return () => {
      if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
    };
  }, []);

  const sendReaction = useCallback(
    async (emoji: string) => {
      if (!gameRoundId || !currentUserId || !currentUserName || cooldown) return;

      setCooldown(true);
      try {
        const { sendReaction: sendReactionService } = await import("@/lib/reactionService");
        await sendReactionService(gameRoundId, currentUserId, currentUserName, emoji);
      } catch (error) {
        console.error("リアクションの送信に失敗しました:", error);
      } finally {
        if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
        cooldownTimeoutRef.current = setTimeout(() => {
          setCooldown(false);
          cooldownTimeoutRef.current = null;
        }, COOLDOWN_DURATION);
      }
    },
    [gameRoundId, currentUserId, currentUserName, cooldown]
  );

  return { displayReactions, sendReaction, cooldown };
}
