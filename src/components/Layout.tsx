import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { t } from '../i18n';
import { timeAgo } from '../lib/format';
import { Icon, type IconName } from './Icon';
import { Avatar, Logo } from './ui';

const MAIN_NAV: { to: string; label: string; icon: IconName; hint: string }[] = [
  { to: '/accueil', label: t('nav.home'), icon: 'home', hint: 'Ton tableau de bord' },
  { to: '/activites', label: t('nav.discover'), icon: 'compass', hint: 'Toutes les activités' },
  { to: '/guildes', label: t('nav.circles'), icon: 'circles', hint: 'Tes groupes récurrents' },
  { to: '/agenda', label: t('nav.agenda'), icon: 'calendar', hint: 'Tes prochaines activités' },
];

const MENU: { to: string; label: string; icon: IconName }[] = [
  { to: '/profil', label: 'Ma fiche personnage', icon: 'user' },
  { to: '/enregistres', label: t('nav.saved'), icon: 'bookmark' },
  { to: '/historique', label: t('nav.history'), icon: 'history' },
  { to: '/proposer', label: t('nav.propose'), icon: 'plus' },
  { to: '/parametres', label: t('nav.settings'), icon: 'shield' },
  { to: '/a-propos', label: 'À propos du projet', icon: 'info' },
];

export function DemoBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-night px-4 py-1.5 text-center text-[11px] font-bold tracking-wide text-on-night/80"> {t('demo.banner')}
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

const popover = 'scope-day pop absolute right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-edge bg-cream';
const popShadow = { boxShadow: '0 24px 48px -18px rgb(8 6 18 / 0.85)' };

function Notifications() {
  const { state, dispatch, unread } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));
  const navigate = useNavigate();
  return (
    <div className="relative" ref={ref}>
      <button
        className="relative inline-flex size-10 items-center justify-center rounded-full border-2 border-transparent text-ink hover:border-ink-3 hover:bg-surface"
        aria-label={`${t('nav.notifications')}${unread ? ` (${unread} non lues)` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="bell" />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border border-edge bg-sakura text-[10px] font-bold text-on-accent">{unread}</span>}
      </button>
      {open && (
        <div className={`${popover} w-[min(22rem,calc(100vw-2rem))]`} style={popShadow}>
          <div className="flex items-center justify-between border-b border-edge bg-sakura-soft px-4 py-3">
            <p className="font-display font-bold">{t('nav.notifications')}</p>
            {unread > 0 && (
              <button className="text-xs font-bold text-lav-deep" onClick={() => dispatch({ type: 'markNotificationsRead' })}>
                Tout marquer comme lu
              </button>
            )}
          </div>
          <ul className="max-h-96 divide-y divide-line overflow-y-auto">
            {state.notifications.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-3">Rien de nouveau pour l’instant.</li>}
            {state.notifications.map((n) => (
              <li key={n.id}>
                <button
                  className={`flex w-full gap-3 px-4 py-3 text-left text-sm hover:bg-cream ${n.read ? 'text-ink-2' : 'font-bold text-ink'}`}
                  onClick={() => {
                    dispatch({ type: 'markNotificationsRead' });
                    setOpen(false);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <span className={`mt-1.5 size-2.5 shrink-0 rounded-full border-[1.5px] ${n.read ? 'border-line' : 'border-edge bg-sakura'}`} />
                  <span>
                    {n.text}
                    <span className="mt-0.5 block text-xs font-normal text-ink-3">{timeAgo(n.at)}</span>
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
      <button className="flex items-center gap-2 rounded-full transition hover:-translate-y-0.5" aria-label="Menu du compte" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Avatar user={me} size="md" />
      </button>
      {open && (
        <div className={`${popover} w-64 py-2`} style={popShadow}>
          <div className="flex items-center gap-3 px-4 pt-1 pb-3">
            <Avatar user={me} size="md" />
            <div className="min-w-0">
              <p className="truncate font-display font-bold">{me?.firstName}</p>
              {me?.title && <p className="truncate text-xs text-ink-3">{me.title}</p>}
            </div>
          </div>
          {MENU.map((m) => (
            <Link key={m.to} to={m.to} className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-ink-2 hover:bg-sakura-pale hover:text-ink">
              <Icon name={m.icon} className="size-4" /> {m.label}
            </Link>
          ))}
          <button
            className="mt-1 flex w-full items-center gap-3 border-t-2 border-line px-4 py-2.5 text-sm font-bold text-ink-2 hover:bg-cream"
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
    <div className="min-h-dvh pb-24 md:pb-0">
      <DemoBanner />
      <header className="sticky top-0 z-40 border-b border-edge bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/accueil" aria-label="Kizuna — accueil">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-edge bg-surface p-1 md:flex" style={{ boxShadow: 'var(--shadow-sm)' }} aria-label="Navigation principale">
            {MAIN_NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                title={n.hint}
                className={({ isActive }) => `inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition ${isActive ? 'bg-sakura text-on-accent' : 'text-ink-2 hover:bg-sakura-pale hover:text-ink'}`}
              >
                <Icon name={n.icon} className="size-4" />
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
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
      <footer className="mx-auto hidden max-w-6xl border-t border-line px-4 py-8 text-xs font-semibold text-ink-3 md:flex md:justify-between">
        <span>Kizuna · prototype étudiant · Lyon · illustrations originales</span>
        <span className="flex gap-4">
          <Link to="/parametres#charte" className="hover:text-ink">Code de la guilde</Link>
          <Link to="/a-propos" className="hover:text-ink">À propos</Link>
        </span>
      </footer>
      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-3xl border border-edge bg-surface/95 backdrop-blur md:hidden" style={{ boxShadow: 'var(--shadow-sm)' }} aria-label="Navigation mobile">
        <div className="grid grid-cols-5 p-1">
          {[...MAIN_NAV, { to: '/profil', label: t('nav.profile'), icon: 'user' as IconName, hint: '' }].map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-bold transition ${isActive ? 'bg-sakura-soft text-sakura-deep' : 'text-ink-3'}`}
            >
              <Icon name={n.icon} className="size-[22px]" strokeWidth={2} />
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
