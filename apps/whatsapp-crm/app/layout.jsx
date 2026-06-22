import Nav from '@/components/nav';
import './globals.css';

export const metadata = {
  title: 'WhatsApp CRM',
  description: 'WhatsApp CRM Kanban with AI agents',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Nav />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
