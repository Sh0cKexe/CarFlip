import "./globals.css";

export const metadata = {
  title: "FlipniTo",
  description: "FlipniTo - hlídání ziskových aut",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-bg text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
