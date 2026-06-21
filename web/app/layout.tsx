export const metadata = {
  title: "CarFlip",
  description: "CarFlip - hlídání ziskových aut",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#0f1115", color: "#eee" }}>
        {children}
      </body>
    </html>
  );
}
