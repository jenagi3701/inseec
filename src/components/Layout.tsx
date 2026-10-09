import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { t } from '../i18n';
import { timeAgo } from '../lib/format';
import { Icon, type IconName } from './Icon';
import { Avatar, Logo } from './ui';

const MAIN_NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/accueil', label: t('nav.home'), icon: 'home' },
  { to: '/activites', label: t('nav.discover'), icon: 'compass' },
  { to: '/cercles', label: t('nav.circles'), icon: 'circles' },
  { to: '/agenda', label: t('nav.agenda'), icon: 'calendar' },
];

const MENU: { to: string; label: string; icon: IconName }[] = [
  { to: '/profil', label: 'Mon profil', icon: 'user' },
  { to: '/enregistres', label: t('nav.saved'), icon: 'bookmark' },
  { to: '/historique', label: t('nav.history'), icon: 'history' },
  { to: '/proposer', label: t('nav.propose'), icon: 'plus' },
  { to: '/parametres', label: t('nav.settings'), icon: 'shield' },
  { to: '/a-propos', label: 'À propos du projet', icon: 'info' },
];

export function DemoBanner() {
  return (
    <div className="bg-ink px-4 py-1.5 text-center text-[11px] font-medium tracking-wide text-paper/80">
      {t('demo.banner')}
    </div>
  );
}

function useClickOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', key);
    };
  }, [open, close]);
  return ref;
}

function Notifications() {
  const { state, dispatch, unread } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));
  const navigate = useNavigate();
  return (
    <div className="relative" ref={ref}>
      <button
        className="relative inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-paper-2"
        aria-label={`${t('nav.notifications')}${unread ? ` (${unread} non lues)` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="bell" />
        {unread > 0 && <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-shu text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="fade-up absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-semibold">{t('nav.notifications')}</p>
            {unread > 0 && (
              <button className="text-xs font-semibold text-ai" onClick={() => dispatch({ type: 'markNotificationsRead' })}>
                Tout marquer comme lu
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {state.notifications.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-3">Rien de nouveau pour l’instant.</li>}
            {state.notifications.map((n) => (
              <li key={n.id}>
                <button
                  className={`flex w-full gap-3 px-4 py-3 text-left text-sm hover:bg-paper ${n.read ? 'text-ink-2' : 'text-ink'}`}
                  onClick={() => {
                    dispatch({ type: 'markNotificationsRead' });
                    setOpen(false);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-shu'}`} />
                  <span>
                    {n.text}
                    <span className="mt-0.5 block text-xs text-ink-3">{timeAgo(n.at)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { me, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  return (
    <div className="relative" ref={ref}>
      <button className="flex items-center gap-2 rounded-full p-1 hover:bg-paper-2" aria-label="Menu du compte" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Avatar user={me} size="sm" />
      </button>
      {open && (
        <div className="fade-up absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-white py-2 shadow-xl">
          <p className="px-4 pt-1 pb-2 text-sm font-semibold">{me?.firstName}</p>
          {MENU.map((m) => (
            <Link key={m.to} to={m.to} className="flex items-center gap-3 px-4 py-2 text-sm text-ink-2 hover:bg-paper hover:text-ink">
              <Icon name={m.icon} className="size-4" /> {m.label}
            </Link>
          ))}
          <button
            className="mt-1 flex w-full items-center gap-3 border-t border-line px-4 py-2.5 text-sm text-ink-2 hover:bg-paper"
            onClick={() => {
              navigate('/');
              dispatch({ type: 'reset' });
            }}
          >
            <Icon name="logout" className="size-4" /> Se déconnecter (réinitialise la démo)
          </button>
        </div>
      )}
    </div>
  );
}

export function AppLayout() {
  const { state } = useApp();
  const location = useLocation();
  useEffect(() => window.scrollTo(0, 0), [location.pathname]);

  if (!state.account) return <Navigate to="/" replace />;
  if (!state.onboarded) return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <DemoBanner />
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/accueil" aria-label="Kizuna — accueil">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            {MAIN_NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-paper-2 hover:text-ink'}`}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link to="/proposer" className="btn-ghost btn-sm hidden lg:inline-flex">
              <Icon name="plus" className="size-4" /> Proposer
            </Link>
            <Notifications />
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <Outlet />
      </main>
      <footer className="mx-auto hidden max-w-6xl border-t border-line px-4 py-8 text-xs text-ink-3 md:flex md:justify-between">
        <span>Kizuna · prototype étudiant · Lyon</span>
        <span className="flex gap-4">
          <Link to="/parametres#charte" className="hover:text-ink">Charte de la communauté</Link>
          <Link to="/a-propos" className="hover:text-ink">À propos</Link>
        </span>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur md:hidden" aria-label="Navigation mobile">
        <div className="grid grid-cols-5">
          {[...MAIN_NAV, { to: '/profil', label: t('nav.profile'), icon: 'user' as IconName }].map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${isActive ? 'text-shu' : 'text-ink-3'}`}>
              <Icon name={n.icon} className="size-[22px]" />
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
