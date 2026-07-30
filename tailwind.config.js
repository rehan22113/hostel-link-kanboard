/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        "kanban-bg": "#0f172a",
        "kanban-col": "#1e293b",
        "kanban-card": "#273449",
        "kanban-line": "#334155",
        "kanban-accent": "#f97316",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4)",
        drag: "0 8px 24px rgba(0,0,0,0.55)",
      },
    },
  },
  plugins: [],
};
