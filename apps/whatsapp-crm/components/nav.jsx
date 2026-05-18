'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Status' },
  { href: '/inbox', label: 'Inbox' },
  { href: '/kanban', label: 'Kanban' },
  { href: '/agents', label: 'Agentes' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      <div className="brand">WhatsApp CRM</div>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={pathname === l.href ? 'active' : ''}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
