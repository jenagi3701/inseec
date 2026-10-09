// Fictional recurring communities ("guildes" in the UI). Activities link to them via communityId.
import type { Community, Message } from './types';
import { daysAgo } from './dates';

export const DEMO_COMMUNITIES: Community[] = [
  {
    id: 'c-ghibli', name: 'Les Dimanches Ghibli', tagline: 'Un film, un thé, les mêmes visages.',
    description: 'Né d’une première séance où 5 personnes ont toutes cliqué « on se revoit ». Un dimanche par mois, un film Ghibli choisi par le groupe, puis une discussion sans pression.',
    categoryId: 'anime', tags: ['ghibli', 'slice-of-life', 'the'], memberIds: ['u-yuki', 'u-clara', 'u-ines', 'u-amandine', 'u-nathan'],
    rhythm: '1 dimanche par mois, 15 h', organizerId: 'u-yuki', origin: 'cercle',
  },
  {
    id: 'c-coop', name: 'Coop & Cozy', tagline: 'Des jeux où l’on gagne ensemble.',
    description: 'Soirées jeux coopératifs pour les personnes qui préfèrent la collaboration à la compétition. Tables de 4 à 5, règles expliquées.',
    categoryId: 'jeux', tags: ['jeux-societe', 'cozy-games'], memberIds: ['u-hugo', 'u-nathan', 'u-lucas', 'u-clara'],
    rhythm: 'Un mercredi sur deux, 19 h 30', organizerId: 'u-hugo', origin: 'organisateur',
  },
  {
    id: 'c-nihongo', name: 'Nihongo Café Croix-Rousse', tagline: 'Parler japonais, même mal, même un peu.',
    description: 'Conversation hebdomadaire entre apprenant·es et natif·ves. Ambiance bienveillante : les fautes font partie du jeu.',
    categoryId: 'culture', tags: ['langue-japonaise', 'the'], memberIds: ['u-yuki', 'u-aiko', 'u-amandine', 'u-lucas', 'u-sarah', 'u-kenji'],
    rhythm: 'Chaque jeudi, 19 h', organizerId: 'u-yuki', origin: 'organisateur',
  },
  {
    id: 'c-fgc', name: 'Lyon Fighting Club', tagline: 'On progresse ensemble, on ne juge pas.',
    description: 'Entraînement aux jeux de combat. Les joueurs confirmés parrainent les nouveaux.',
    categoryId: 'gaming', tags: ['jeux-combat', 'jeux-video'], memberIds: ['u-mehdi', 'u-zoe', 'u-lucas', 'u-hugo', 'u-tom', 'u-paul'],
    rhythm: 'Chaque mardi, 20 h', organizerId: 'u-mehdi', origin: 'organisateur',
  },
  {
    id: 'c-croquis', name: 'Carnets du dimanche', tagline: 'Dessiner côte à côte.',
    description: 'Croquis en extérieur ou en café. Tous niveaux, aucune critique non sollicitée.',
    categoryId: 'creatif', tags: ['dessin', 'frieren', 'ghibli'], memberIds: ['u-ines', 'u-zoe', 'u-clara'],
    rhythm: 'Un samedi sur deux, 14 h', organizerId: 'u-ines', origin: 'cercle',
  },
  {
    id: 'c-karaoke', name: 'Openings & Chill', tagline: 'Chanter faux, mais ensemble.',
    description: 'Karaoké anime & J-pop mensuel en box privatisée.',
    categoryId: 'sorties', tags: ['karaoke', 'musique'], memberIds: ['u-julie', 'u-aiko', 'u-lucas', 'u-tom', 'u-zoe', 'u-hugo', 'u-mehdi'],
    rhythm: '1 samedi par mois, 21 h', organizerId: 'u-julie', origin: 'organisateur',
  },
  {
    id: 'c-seinen', name: 'Club Seinen', tagline: 'Lire, puis en parler longtemps.',
    description: 'Club de lecture manga seinen. Un arc par mois.',
    categoryId: 'anime', tags: ['seinen', 'lecture', 'frieren'], memberIds: ['u-sarah', 'u-antoine', 'u-ines'],
    rhythm: '1 dimanche par mois, 16 h', organizerId: 'u-sarah', origin: 'organisateur',
  },
];

export const DEMO_MESSAGES: Message[] = [
  { id: 'm1', activityId: 'a-ghibli-mononoke', authorId: 'u-yuki', text: 'Bonjour à toutes et à tous ! J’apporte du hojicha. Si quelqu’un veut faire un gâteau, dites-le ici 🙂', at: daysAgo(2, 10) },
  { id: 'm2', activityId: 'a-ghibli-mononoke', authorId: 'u-clara', text: 'Je peux faire un cake au matcha (première tentative, soyez indulgent·es).', at: daysAgo(2, 12) },
  { id: 'm3', activityId: 'a-ghibli-mononoke', authorId: 'u-nathan', text: 'Je n’ai jamais vu Mononoké, c’est grave ?', at: daysAgo(1, 18) },
  { id: 'm4', activityId: 'a-ghibli-mononoke', authorId: 'u-ines', text: '@Nathan au contraire, tu vas adorer le découvrir en groupe.', at: daysAgo(1, 19) },
  { id: 'm5', activityId: 'a-coop', authorId: 'u-hugo', text: 'Je réserve 2 tables. Si vous avez un jeu coop à faire découvrir, apportez-le !', at: daysAgo(1, 9) },
  { id: 'm6', activityId: 'a-nihongo', authorId: 'u-yuki', text: '今週のテーマ：週末の予定 (thème de la semaine : tes projets du week-end).', at: daysAgo(1, 11) },
  { id: 'm7', activityId: 'a-croquis', authorId: 'u-ines', text: 'S’il pleut, repli au café du parc. Je préviens ici le matin même.', at: daysAgo(1, 20) },
  { id: 'm8', activityId: 'a-karaoke', authorId: 'u-julie', text: 'Playlist collaborative ouverte : ajoutez vos openings !', at: daysAgo(3, 15) },
];
