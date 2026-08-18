import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Interview Room — AI Interview Coach",
  description: "Walk into the room, face a panel of AI interviewers, and get real-time voice coaching and adaptive evaluations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="grain" />
        {children}
      </body>
    </html>
  );
}
