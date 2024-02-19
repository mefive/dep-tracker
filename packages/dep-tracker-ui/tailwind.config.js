const colors = {
  /** 基础色 **/
  primary: "#FF8E22", // 主色
  "primary-light": "#FFD2A7", // 辅助色
  "primary-lighter": "#FFF5EE", // 辅助色

  /** 中性色 **/
  important: "#222222", // 重要
  normal: "#999999", // 常用
  secondary: "#CCCCCC", // 次级

  /** 其他 **/
  mask: "rgba(0, 0, 0, 0.5)", // 遮罩
  bg: "#F9F9FC", // 底色
  "bg-secondary": "#F7F7FA", // 次级底色

  /** 以下为 ant design 标准色值 **/
  white: "#fff",
  black: "#000",
  success: "#52c41a",
  error: "#ff4d4f",
  disabled: "rgba(0,0,0,.25)",
  warning: "#faad14",
  border: "#ccc",
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors,
      backgroundColor: colors,
      lineHeight: {
        "form-item": "32px",
      },
    },
    spacing: {
      0: "0",
      0.5: "4px",
      1: "8px",
      1.5: "12px",
      2: "16px",
      2.5: "20px",
      3: "24px",
      3.5: "28px",
      4: "32px",
      5: "40px",
      6: "48px",
      8: "64px",
      10: "80px",
      12: "96px",
      15: "120px",
      20: "160px",
      36: "288px",
    },
    fontSize: {
      tiny: "10px",
      sm: "12px",
      base: "14px",
      lg: "16px",
      xl: "18px",
      "2xl": "24px",
    },
  },
  plugins: [],
};
