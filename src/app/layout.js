import "./globals.css";

export const metadata = {
  title: "The Conversation",
  description: "A performance art project",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}