import { JudgmentResult } from "@/types";
import {
  isSuccessJudgment,
  isFailureJudgment,
  getJudgmentLabel,
  getJudgmentStyle,
  getJudgmentBadgeStyle,
} from "./judgment";

describe("judgment ヘルパー", () => {
  describe("成功・失敗の判定", () => {
    it("一致は成功として扱われる", () => {
      expect(isSuccessJudgment(JudgmentResult.MATCH)).toBe(true);
      expect(isFailureJudgment(JudgmentResult.MATCH)).toBe(false);
    });

    it("不一致は失敗として扱われる", () => {
      expect(isSuccessJudgment(JudgmentResult.NO_MATCH)).toBe(false);
      expect(isFailureJudgment(JudgmentResult.NO_MATCH)).toBe(true);
    });

    it("判定前（null / undefined）は成功でも失敗でもない", () => {
      expect(isSuccessJudgment(null)).toBe(false);
      expect(isFailureJudgment(null)).toBe(false);
      expect(isSuccessJudgment(undefined)).toBe(false);
      expect(isFailureJudgment(undefined)).toBe(false);
    });
  });

  describe("ラベル", () => {
    it("一致は「一致」と表示される", () => {
      expect(getJudgmentLabel(JudgmentResult.MATCH)).toBe("一致");
    });

    it("不一致は「不一致」と表示される", () => {
      expect(getJudgmentLabel(JudgmentResult.NO_MATCH)).toBe("不一致");
    });

    it("判定前は「判定なし」と表示される", () => {
      expect(getJudgmentLabel(null)).toBe("判定なし");
      expect(getJudgmentLabel(undefined)).toBe("判定なし");
    });
  });

  describe("配色", () => {
    it("成功判定は緑系の配色になる", () => {
      expect(getJudgmentStyle(JudgmentResult.MATCH)).toEqual({
        bgColor: "bg-emerald-100 border-emerald-300",
        textColor: "text-emerald-900",
      });
      expect(getJudgmentBadgeStyle(JudgmentResult.MATCH)).toBe("bg-emerald-100 text-emerald-800");
    });

    it("失敗判定は赤系の配色になる", () => {
      expect(getJudgmentStyle(JudgmentResult.NO_MATCH)).toEqual({
        bgColor: "bg-rose-100 border-rose-300",
        textColor: "text-rose-900",
      });
      expect(getJudgmentBadgeStyle(JudgmentResult.NO_MATCH)).toBe("bg-rose-100 text-rose-800");
    });

    it("判定前はグレーの配色になる", () => {
      expect(getJudgmentStyle(null)).toEqual({
        bgColor: "bg-gray-50 border-gray-200",
        textColor: "text-gray-900",
      });
      expect(getJudgmentBadgeStyle(null)).toBe("bg-gray-100 text-gray-800");
    });
  });
});
