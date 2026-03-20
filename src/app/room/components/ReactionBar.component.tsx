import React, { memo } from "react";
import { DisplayReaction } from "@/types";
import { REACTION_EMOJIS } from "@/hooks/useReactions";

interface ReactionBarProps {
  displayReactions: DisplayReaction[];
  sendReaction: (_emoji: string) => Promise<void>;
  cooldown: boolean;
}

export const ReactionBar = memo(({ displayReactions, sendReaction, cooldown }: ReactionBarProps) => {
  return (
    <>
      {/* 全画面フローティングリアクション */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {displayReactions.map((r) => (
          <div
            key={r.displayId}
            className="absolute bottom-0 animate-reaction-float"
            style={{ left: `${r.x}%` }}
          >
            <div className="flex flex-col items-center">
              <span className="text-4xl leading-none">{r.emoji}</span>
              <span className="text-[10px] text-gray-500 whitespace-nowrap">{r.fromUserName}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 送信ボタン */}
      <div className="border-t border-gray-100 pt-2 mt-4">
        <div className="flex justify-center gap-2 py-2">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              disabled={cooldown}
              className={`text-2xl p-2 rounded-full transition-all select-none ${
                cooldown
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-gray-100 active:scale-125 cursor-pointer"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
});

ReactionBar.displayName = "ReactionBar";
