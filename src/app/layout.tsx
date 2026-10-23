import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TODO',
  // An empty icon stops the browser from requesting a /favicon.ico that does not exist.
  icons: { icon: 'data:,' },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
