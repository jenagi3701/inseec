import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import Landing from './pages/Landing';
import { EmptyState, Sparkle } from './components/ui';

// Pages are code-split: the landing page ships in the main bundle, the rest loads on demand.
const named = <T, K extends keyof T>(load: () => Promise<T>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] as ComponentType })));

const Signup = lazy(() => import('./pages/Signup'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Home = lazy(() => import('./pages/Home'));
const Discover = lazy(() => import('./pages/Discover'));
const ActivityDetail = lazy(() => import('./pages/ActivityDetail'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Communities = lazy(() => import('./pages/Communities'));
const CommunityDetail = lazy(() => import('./pages/CommunityDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const Propose = lazy(() => import('./pages/Propose'));
const About = lazy(() => import('./pages/About'));
const Agenda = named(() => import('./pages/Lists'), 'Agenda');
const History = named(() => import('./pages/Lists'), 'History');
const Saved = named(() => import('./pages/Lists'), 'Saved');
const MyProfile = named(() => import('./pages/Profile'), 'MyProfile');
const MemberProfile = named(() => import('./pages/Profile'), 'MemberProfile');

function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm font-extrabold text-ink-3" role="status">
      <Sparkle className="float size-5" /> Chargement…
    </div>
  );
}

const page = (node: ReactNode) => <Suspense fallback={<Loading />}>{node}</Suspense>;

function LegacyCircle() {
  const { id } = useParams();
  return <Navigate to={`/guildes/${id}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/inscription" element={page(<Signup />)} />
      <Route path="/onboarding" element={page(<Onboarding />)} />
      <Route element={<AppLayout />}>
        <Route path="/accueil" element={page(<Home />)} />
        <Route path="/activites" element={page(<Discover />)} />
        <Route path="/activites/:id" element={page(<ActivityDetail />)} />
        <Route path="/activites/:id/bilan" element={page(<Feedback />)} />
        <Route path="/guildes" element={page(<Communities />)} />
        <Route path="/guildes/:id" element={page(<CommunityDetail />)} />
        <Route path="/cercles" element={<Navigate to="/guildes" replace />} />
        <Route path="/cercles/:id" element={<LegacyCircle />} />
        <Route path="/agenda" element={page(<Agenda />)} />
        <Route path="/historique" element={page(<History />)} />
        <Route path="/enregistres" element={page(<Saved />)} />
        <Route path="/profil" element={page(<MyProfile />)} />
        <Route path="/profil/:id" element={page(<MemberProfile />)} />
        <Route path="/parametres" element={page(<Settings />)} />
        <Route path="/proposer" element={page(<Propose />)} />
        <Route path="/a-propos" element={page(<About />)} />
        <Route path="*" element={<EmptyState icon="compass" title="Page introuvable" text="Ce lien ne mène nulle part." action={<Link to="/accueil" className="btn-primary btn-sm">Retour à l’accueil</Link>} />} />
      </Route>
    </Routes>
  );
}
