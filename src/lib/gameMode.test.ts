import { GameMode, JudgmentResult } from "@/types";
import {
  DEFAULT_GAME_MODE,
  GAME_MODE_OPTIONS,
  getGameModeDefinition,
  isGameMode,
  resolveGameMode,
} from "./gameMode";

describe("gameMode", () => {
  describe("モードの解決", () => {
    it("モード未設定のルームは一致モードとして扱われる", () => {
      expect(resolveGameMode(undefined)).toBe(GameMode.MATCH);
      expect(getGameModeDefinition(undefined).mode).toBe(GameMode.MATCH);
    });

    it("不一致モードのルームは不一致モードとして扱われる", () => {
      expect(resolveGameMode(GameMode.MISMATCH)).toBe(GameMode.MISMATCH);
    });

    it("不正な値はデフォルトの一致モードに丸められる", () => {
      expect(resolveGameMode("unknown")).toBe(DEFAULT_GAME_MODE);
      expect(resolveGameMode(null)).toBe(DEFAULT_GAME_MODE);
      expect(resolveGameMode(123)).toBe(DEFAULT_GAME_MODE);
    });

    it("有効なモード値を判別できる", () => {
      expect(isGameMode("match")).toBe(true);
      expect(isGameMode("mismatch")).toBe(true);
      expect(isGameMode("other")).toBe(false);
      expect(isGameMode(undefined)).toBe(false);
    });
  });

  describe("モード定義", () => {
    it("一致モードは全員一致を目指し、AI の会話のヒントを使う", () => {
      const definition = getGameModeDefinition(GameMode.MATCH);

      expect(definition.successJudgment).toBe(JudgmentResult.MATCH);
      expect(definition.failureJudgment).toBe(JudgmentResult.NO_MATCH);
      expect(definition.successButtonLabel).toBe("全員一致");
      expect(definition.failureButtonLabel).toBe("全員一致ならず");
      expect(definition.successCountLabel).toBe("一致回数");
      expect(definition.successRateLabel).toBe("一致率");
      expect(definition.isFacilitationAvailable).toBe(true);
      expect(definition.facilitationFallbackText).toBeNull();
    });

    it("不一致モードは被りなしを目指し、AI の会話のヒントを使わない", () => {
      const definition = getGameModeDefinition(GameMode.MISMATCH);

      expect(definition.successJudgment).toBe(JudgmentResult.NO_DUPLICATE);
      expect(definition.failureJudgment).toBe(JudgmentResult.HAS_DUPLICATE);
      expect(definition.successButtonLabel).toBe("被りなし");
      expect(definition.failureButtonLabel).toBe("被りあり");
      expect(definition.successCountLabel).toBe("被りなし回数");
      expect(definition.successRateLabel).toBe("被りなし率");
      expect(definition.isFacilitationAvailable).toBe(false);
      expect(definition.facilitationFallbackText).toBe("気になる回答の人に理由を聞いてみましょう");
    });

    it("モード未設定でも一致モードの定義が返る", () => {
      expect(getGameModeDefinition(undefined).mode).toBe(GameMode.MATCH);
    });

    it("選択肢は一致モード・不一致モードの順に並ぶ", () => {
      expect(GAME_MODE_OPTIONS.map((option) => option.mode)).toEqual([
        GameMode.MATCH,
        GameMode.MISMATCH,
      ]);
    });
  });
});
