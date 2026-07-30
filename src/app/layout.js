import "./globals.css";

export const metadata = {
  title: "HostelLink Kanban",
  description: "Dev team task board — Backlog, Pending, QA, UAT",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
