import { Link, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Discover from './pages/Discover';
import ActivityDetail from './pages/ActivityDetail';
import Feedback from './pages/Feedback';
import Communities from './pages/Communities';
import CommunityDetail from './pages/CommunityDetail';
import { Agenda, History, Saved } from './pages/Lists';
import { MemberProfile, MyProfile } from './pages/Profile';
import Settings from './pages/Settings';
import Propose from './pages/Propose';
import About from './pages/About';
import { EmptyState } from './components/ui';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/inscription" element={<Signup />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<AppLayout />}>
        <Route path="/accueil" element={<Home />} />
        <Route path="/activites" element={<Discover />} />
        <Route path="/activites/:id" element={<ActivityDetail />} />
        <Route path="/activites/:id/bilan" element={<Feedback />} />
        <Route path="/cercles" element={<Communities />} />
        <Route path="/cercles/:id" element={<CommunityDetail />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/historique" element={<History />} />
        <Route path="/enregistres" element={<Saved />} />
        <Route path="/profil" element={<MyProfile />} />
        <Route path="/profil/:id" element={<MemberProfile />} />
        <Route path="/parametres" element={<Settings />} />
        <Route path="/proposer" element={<Propose />} />
        <Route path="/a-propos" element={<About />} />
        <Route path="*" element={<EmptyState icon="compass" title="Page introuvable" text="Ce lien ne mène nulle part." action={<Link to="/accueil" className="btn-primary btn-sm">Retour à l’accueil</Link>} />} />
      </Route>
    </Routes>
  );
}
