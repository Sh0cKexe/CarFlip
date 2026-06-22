import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const font = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

export const metadata = {
  title: "FlipniTo",
  description: "FlipniTo - hlídání ziskových aut",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className={`${font.variable} min-h-screen bg-bg font-sans text-zinc-100 antialiased`}>
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] animate-blob rounded-full bg-accent/15 blur-[110px]" />
          <div className="absolute -right-32 top-1/3 h-[28rem] w-[28rem] animate-blob-slow rounded-full bg-accent2/15 blur-[110px]" />
          <div className="absolute bottom-[-12rem] left-1/3 h-[26rem] w-[26rem] animate-blob rounded-full bg-accent/10 blur-[120px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
