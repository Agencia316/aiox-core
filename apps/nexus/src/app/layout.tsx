import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Nexus — Inteligência Jurídica',
  description: 'Plataforma multi-tenant de inteligência jurídica',
};

// NOTE: layout mínimo (Fase 2). O app shell temático (sidebar, header, tema
// dark do design system) é responsabilidade da Fase 3 — @frontend.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
