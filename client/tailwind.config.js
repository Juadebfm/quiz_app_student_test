/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        quiz_green: "#31CD63",
        quiz_offwhite: "#F4F3F6",
        quiz_option_bg: "#EDE8E3",
        quiz_text: "#060710",
        quiz_disabled_btn: "#747475",
        quiz_footer_bg: "#F7F7F7",
      },
    },
  },
  plugins: [],
};
