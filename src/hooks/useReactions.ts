import { useState, useEffect, useCallback, useRef } from "react";
import { DisplayReaction } from "@/types";

const REACTION_DISPLAY_DURATION = 3000;
const COOLDOWN_DURATION = 1500;

export const REACTION_EMOJIS = ["😂", "👏", "😮", "🔥", "👍"];

export function useReactions(
  gameRoundId: string | null,
  currentUserId: string | null,
  currentUserName: string | null
) {
  const [displayReactions, setDisplayReactions] = useState<DisplayReaction[]>([]);
  const [cooldown, setCooldown] = useState(false);
  const seenReactionIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!gameRoundId) return;

    seenReactionIds.current = new Set();

    let unsubscribe: (() => void) | undefined;

    const setup = async () => {
      const { subscribeToReactions } = await import("@/lib/reactionService");
      unsubscribe = subscribeToReactions(gameRoundId, (reactions) => {
        reactions.forEach((reaction) => {
          if (seenReactionIds.current.has(reaction.id)) return;
          seenReactionIds.current.add(reaction.id);

          const displayId = `${reaction.id}-${Date.now()}`;
          const x = Math.floor(Math.random() * 80) + 10;

          setDisplayReactions((prev) => [
            ...prev,
            { displayId, emoji: reaction.emoji, fromUserName: reaction.fromUserName, x },
          ]);

          setTimeout(() => {
            setDisplayReactions((prev) => prev.filter((r) => r.displayId !== displayId));
          }, REACTION_DISPLAY_DURATION);
        });
      });
    };

    setup();

    return () => {
      unsubscribe?.();
    };
  }, [gameRoundId]);

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
        setTimeout(() => setCooldown(false), COOLDOWN_DURATION);
      }
    },
    [gameRoundId, currentUserId, currentUserName, cooldown]
  );

  return { displayReactions, sendReaction, cooldown };
}
