// Edit this file to change activity categories, social-energy levels, interests and time slots.
import type { Category, Energy, GroupSizeId, Interest, LevelId, SlotId } from './types';

export const CATEGORIES: Category[] = [
  { id: 'anime', label: 'Anime & manga', short: 'Anime', kanji: '漫', color: '#D9472B', tint: '#FBE4DC' },
  { id: 'jeux', label: 'Jeux de société', short: 'Jeux', kanji: '遊', color: '#2F4A8A', tint: '#E1E7F5' },
  { id: 'culture', label: 'Culture japonaise', short: 'Culture', kanji: '文', color: '#5F7F4E', tint: '#E4ECDD' },
  { id: 'gaming', label: 'Jeux vidéo', short: 'Gaming', kanji: '技', color: '#6B4AA0', tint: '#ECE4F6' },
  { id: 'creatif', label: 'Créatif', short: 'Créatif', kanji: '創', color: '#C07A1C', tint: '#F8EBD6' },
  { id: 'sorties', label: 'Sorties & social', short: 'Sorties', kanji: '縁', color: '#B23A64', tint: '#F6E0E8' },
];

export const ENERGIES: Energy[] = [
  { id: 'calme', label: 'Calme & détente', description: 'Peu de pression, on peut juste être là.' },
  { id: 'creatif', label: 'Créatif & collaboratif', description: 'On fabrique, on dessine, on cuisine ensemble.' },
  { id: 'competitif', label: 'Compétitif & énergique', description: 'Tournois, défis, ça bouge.' },
  { id: 'social', label: 'Social & bavard', description: 'La discussion est au cœur de l’activité.' },
  { id: 'culturel', label: 'Culturel & découverte', description: 'On apprend quelque chose de nouveau.' },
];

export const INTERESTS: Interest[] = [
  // Genres
  { id: 'shonen', label: 'Shōnen', group: 'genre' },
  { id: 'shojo', label: 'Shōjo', group: 'genre' },
  { id: 'seinen', label: 'Seinen', group: 'genre' },
  { id: 'slice-of-life', label: 'Slice of life', group: 'genre' },
  { id: 'isekai', label: 'Isekai', group: 'genre' },
  { id: 'mecha', label: 'Mecha', group: 'genre' },
  { id: 'horreur', label: 'Horreur', group: 'genre' },
  { id: 'romance', label: 'Romance', group: 'genre' },
  { id: 'sport-anime', label: 'Sport', group: 'genre' },
  // Fandoms / franchises
  { id: 'ghibli', label: 'Studio Ghibli', group: 'fandom' },
  { id: 'one-piece', label: 'One Piece', group: 'fandom' },
  { id: 'jjk', label: 'Jujutsu Kaisen', group: 'fandom' },
  { id: 'frieren', label: 'Frieren', group: 'fandom' },
  { id: 'naruto', label: 'Naruto', group: 'fandom' },
  { id: 'aot', label: 'L’Attaque des Titans', group: 'fandom' },
  { id: 'pokemon', label: 'Pokémon', group: 'fandom' },
  { id: 'zelda', label: 'Zelda', group: 'fandom' },
  { id: 'final-fantasy', label: 'Final Fantasy', group: 'fandom' },
  { id: 'spy-family', label: 'Spy × Family', group: 'fandom' },
  { id: 'haikyu', label: 'Haikyū!!', group: 'fandom' },
  { id: 'chainsaw', label: 'Chainsaw Man', group: 'fandom' },
  // Hobbies
  { id: 'jeux-societe', label: 'Jeux de société', group: 'loisir' },
  { id: 'dessin', label: 'Dessin', group: 'loisir' },
  { id: 'cosplay', label: 'Cosplay', group: 'loisir' },
  { id: 'jeux-video', label: 'Jeux vidéo', group: 'loisir' },
  { id: 'cozy-games', label: 'Cozy games', group: 'loisir' },
  { id: 'jeux-combat', label: 'Jeux de combat', group: 'loisir' },
  { id: 'tcg', label: 'Jeux de cartes (TCG)', group: 'loisir' },
  { id: 'photo', label: 'Photographie', group: 'loisir' },
  { id: 'karaoke', label: 'Karaoké', group: 'loisir' },
  { id: 'musique', label: 'J-pop & city pop', group: 'loisir' },
  { id: 'lecture', label: 'Lecture', group: 'loisir' },
  // Japanese culture
  { id: 'langue-japonaise', label: 'Langue japonaise', group: 'culture' },
  { id: 'cuisine-japonaise', label: 'Cuisine japonaise', group: 'culture' },
  { id: 'cinema-japonais', label: 'Cinéma japonais', group: 'culture' },
  { id: 'artisanat', label: 'Artisanat & origami', group: 'culture' },
  { id: 'calligraphie', label: 'Calligraphie', group: 'culture' },
  { id: 'the', label: 'Thé & cafés', group: 'culture' },
];

export const INTEREST_GROUP_LABELS: Record<Interest['group'], string> = {
  genre: 'Genres',
  fandom: 'Univers & franchises',
  loisir: 'Autres loisirs',
  culture: 'Culture japonaise',
};

export const SLOTS: { id: SlotId; label: string }[] = [
  { id: 'semaine-soir', label: 'Soirs de semaine' },
  { id: 'samedi-matin', label: 'Samedi matin' },
  { id: 'samedi-aprem', label: 'Samedi après-midi' },
  { id: 'samedi-soir', label: 'Samedi soir' },
  { id: 'dimanche-matin', label: 'Dimanche matin' },
  { id: 'dimanche-aprem', label: 'Dimanche après-midi' },
  { id: 'dimanche-soir', label: 'Dimanche soir' },
];

export const LEVELS: { id: LevelId; label: string; description: string }[] = [
  { id: 'debutant', label: 'Je découvre', description: 'J’ai vu quelques films, je suis curieux·se.' },
  { id: 'curieux', label: 'Fan occasionnel·le', description: 'J’ai mes séries préférées, sans tout connaître.' },
  { id: 'passionne', label: 'Passionné·e', description: 'Je pourrais en parler pendant des heures.' },
];

export const GROUP_SIZES: { id: GroupSizeId; label: string; range: [number, number] }[] = [
  { id: 'petit', label: 'Petit groupe (3–6)', range: [3, 6] },
  { id: 'moyen', label: 'Groupe moyen (7–12)', range: [7, 12] },
  { id: 'grand', label: 'Grand groupe (13+)', range: [13, 99] },
];

export const LANGUAGES = ['Français', 'Anglais', 'Japonais', 'Espagnol', 'Italien', 'Allemand', 'Coréen', 'Chinois'];

export const CITIES = [
  { id: 'Lyon', label: 'Lyon', available: true },
  { id: 'Villeurbanne', label: 'Villeurbanne', available: true },
  { id: 'Paris', label: 'Paris — bientôt', available: false },
  { id: 'Grenoble', label: 'Grenoble — bientôt', available: false },
  { id: 'Marseille', label: 'Marseille — bientôt', available: false },
];

export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id)!;
export const energyById = (id: string) => ENERGIES.find((e) => e.id === id)!;
export const interestById = (id: string) => INTERESTS.find((i) => i.id === id);
export const interestLabel = (id: string) => interestById(id)?.label ?? id;
export const levelLabel = (id: string) => LEVELS.find((l) => l.id === id)?.label ?? id;
