/* ==========================================================================
   CHIC CAREER — i18n.js
   Platform language (English / Français).

   The interface is authored in English. When French is selected, a
   translation layer rewrites interface text as it appears on screen
   (text nodes + placeholder / aria-label / title attributes), using:
     1. an exact-phrase dictionary,
     2. patterns for dynamic phrases (numbers, names, dates),
     3. structural rules (icon prefixes, “quotes”, “A · B”, “A — B”).
   User data is never touched: job offers, CV content, answers and cover
   letters live in textareas / <pre> / [data-noi18n] or simply have no
   dictionary entry. Switching back to English restores the originals.
   Cover-letter language is a separate choice (offer language / FR / EN).
   ========================================================================== */
(function (MT) {
  'use strict';

  const LANG_KEY = 'chiccareer:uiLang';
  let lang = 'en';
  try { lang = localStorage.getItem(LANG_KEY) || ((navigator.language || '').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en'); } catch (e) { /* storage blocked */ }
  if (lang !== 'fr' && lang !== 'en') lang = 'en';

  /* ------------------------------------------------------------ dictionary (EN → FR) */
  const D = {
    // brand & shell
    'Find the right job. Apply smarter. Track everything.': 'Trouvez le bon poste. Postulez mieux. Suivez tout.',
    'Your career journey, one quest at a time.': 'Votre parcours professionnel, une quête à la fois.',
    'Skip to content': 'Aller au contenu', 'Main': 'Principal', 'Main navigation': 'Navigation principale', 'Mobile navigation': 'Navigation mobile',
    'Chic Career home': 'Accueil Chic Career', 'Chic Career chicken': 'Poulet Chic Career',
    'Fictional job data · local only': 'Offres fictives · données locales', 'Last updated:': 'Dernière mise à jour :',
    'Refresh jobs': 'Actualiser les offres', 'Run the (demo) job refresh now': 'Lancer l’actualisation (démo) des offres',
    'Enable reminder notifications': 'Activer les notifications de rappel', 'Career Chicken': 'Poulet Carrière',
    'Platform language': 'Langue de la plateforme', 'Language of the interface': 'Langue de l’interface',
    'Dashboard': 'Tableau de bord', 'Jobs': 'Offres', 'Saved': 'Favoris', 'Applications': 'Candidatures', 'Companies': 'Entreprises',
    'Statistics': 'Statistiques', 'My Profile': 'Mon profil', 'Tracker': 'Suivi', 'More': 'Plus',
    'Dismiss notification': 'Fermer la notification', 'Close dialog': 'Fermer la fenêtre', 'Close': 'Fermer', 'Cancel': 'Annuler',
    'Confirm': 'Confirmer', 'Delete': 'Supprimer', 'Edit': 'Modifier', 'View': 'Voir', 'Copy': 'Copier', 'Add': 'Ajouter', 'Remove': 'Retirer',
    'Later': 'Plus tard', 'Next': 'Suivant', 'Back': 'Retour', 'Save': 'Enregistrer', 'Skip': 'Passer', 'Default': 'Par défaut',
    'Copied to clipboard': 'Copié dans le presse-papiers', 'Copy failed — select the text manually.': 'La copie a échoué — sélectionnez le texte manuellement.',
    'Oops — this page hit a problem.': 'Oups — cette page a rencontré un problème.', 'Back to the dashboard': 'Retour au tableau de bord',
    'DEMO': 'DÉMO', 'DEMO DATA': 'DONNÉES DÉMO', 'DEMO PROFILE': 'PROFIL DÉMO', 'fictional data': 'données fictives', 'Fictional demo offer': 'Offre de démonstration fictive',
    'Mission': 'Mission',

    // dashboard
    'What should we do today? You have:': 'Que fait-on aujourd’hui ? Vous avez :',
    'application to follow up': 'candidature à relancer', 'applications to follow up': 'candidatures à relancer',
    'interview coming up': 'entretien à venir', 'interviews coming up': 'entretiens à venir',
    'TODAY’S CHICKEN QUESTS': 'QUÊTES DU JOUR', 'Quality over quantity: XP rewards personalised applications and real milestones, not mass-applying.': 'La qualité avant la quantité : l’XP récompense les candidatures personnalisées et les vraies étapes, pas les candidatures en masse.',
    'Explore 5 new offers': 'Explorer 5 nouvelles offres', 'Complete 1 personalised application': 'Finaliser 1 candidature personnalisée',
    'Polish one experience in your CV data': 'Peaufiner une expérience de votre CV',
    'THE CHICKEN’S CAREER JOURNEY': 'LE PARCOURS DU POULET', 'Help your chicken reach its dream job.': 'Aidez votre poulet à décrocher le job de ses rêves.',
    'START': 'DÉPART', 'DISCOVER': 'DÉCOUVRIR', 'EXPLORE': 'EXPLORER', 'APPLY': 'POSTULER', 'INTERVIEW': 'ENTRETIEN', 'FINAL STEP': 'DERNIÈRE ÉTAPE', 'DREAM JOB': 'JOB DE RÊVE',
    '← your chicken': '← votre poulet',
    'A little nervous… but ready for the adventure.': 'Un peu nerveux… mais prêt pour l’aventure.',
    'So many offers to sniff around…': 'Tant d’offres à explorer…', 'Good finds! Ready to prepare an application?': 'Belles trouvailles ! Prêt à préparer une candidature ?',
    'Applications are out there. Keep going!': 'Les candidatures sont parties. On continue !',
    'Waiting for answers… patient, but a little anxious.': 'En attente de réponses… patient, mais un peu anxieux.',
    'Interview season! Let’s get ready.': 'La saison des entretiens ! Préparons-nous.', 'The final gate is right there. Deep breath.': 'La dernière porte est juste là. On respire.',
    'WE DID IT! 👑': 'ON L’A FAIT ! 👑',
    'New jobs': 'Nouvelles offres', 'Relevant offers': 'Offres pertinentes', 'Applied': 'Envoyées', 'Interviews': 'Entretiens', 'Offers': 'Offres reçues',
    'Rejected': 'Refusées', 'Response rate': 'Taux de réponse', 'Recommended for you': 'Recommandé pour vous', 'All jobs →': 'Toutes les offres →',
    'Your next actions': 'Vos prochaines actions', 'All clear — time to explore new quests.': 'Rien en attente — place à de nouvelles quêtes.',
    'Your applications': 'Vos candidatures', 'Tracker →': 'Suivi →', 'Recent applications': 'Candidatures récentes', 'Company': 'Entreprise', 'Position': 'Poste',
    'Contract': 'Contrat', 'Date applied': 'Date de candidature', 'Status': 'Statut', 'Application funnel': 'Entonnoir de candidature',
    'Upcoming follow-ups & interviews': 'Relances et entretiens à venir', 'No reminders. Set one from any application’s Follow-up tab.': 'Aucun rappel. Créez-en un depuis l’onglet Relance d’une candidature.',
    'Achievements': 'Succès', 'Career profile →': 'Profil carrière →', 'Upload your CV': 'Importer votre CV', 'Unlocks matching & letters': 'Débloque la compatibilité et les lettres',
    'Open career profile': 'Ouvrir le profil carrière',
    'Ready for our first mission?': 'Prêt pour notre première mission ?', 'Every career journey starts with one application.': 'Chaque parcours commence par une candidature.',
    'Find a job': 'Trouver une offre', 'No recommendations': 'Aucune recommandation', 'Nothing interesting yet. Let’s keep exploring.': 'Rien d’intéressant pour l’instant. Continuons à explorer.',

    // levels / achievements / accessories
    'Career Chick': 'Poussin de carrière', 'Job Explorer': 'Explorateur d’offres', 'Opportunity Hunter': 'Chasseur d’opportunités', 'Strategic Applicant': 'Candidat stratège',
    'Interview Pro': 'Pro de l’entretien', 'Career Challenger': 'Challenger de carrière', 'Career Conqueror': 'Conquérant de carrière',
    'CAREER CHICK': 'POUSSIN DE CARRIÈRE', 'JOB EXPLORER': 'EXPLORATEUR D’OFFRES', 'OPPORTUNITY HUNTER': 'CHASSEUR D’OPPORTUNITÉS', 'STRATEGIC APPLICANT': 'CANDIDAT STRATÈGE',
    'INTERVIEW PRO': 'PRO DE L’ENTRETIEN', 'CAREER CHALLENGER': 'CHALLENGER DE CARRIÈRE', 'CAREER CONQUEROR': 'CONQUÉRANT DE CARRIÈRE',
    'The journey begins.': 'Le voyage commence.', 'Discovering opportunities.': 'À la découverte des opportunités.', 'Actively applying.': 'Candidatures en cours.',
    'Personalising every application.': 'Chaque candidature est personnalisée.', 'Ready for interviews.': 'Prêt pour les entretiens.', 'Approaching the goal.': 'Le but approche.', 'Offer received!': 'Offre reçue !',
    'Max level 👑': 'Niveau max 👑', 'Career Profile': 'Profil carrière', 'Current mission:': 'Mission en cours :', 'Cover letters': 'Lettres de motivation',
    'Accessories': 'Accessoires', '(wear up to 2 — your chicken stays classy)': '(2 maximum — votre poulet reste chic)', 'Unlocked': 'Débloqué', 'Locked': 'Verrouillé',
    'Tiny backpack': 'Petit sac à dos', 'Tiny laptop': 'Petit ordinateur', 'Application document': 'Dossier de candidature', 'Small target': 'Petite cible',
    'Microphone': 'Micro', 'Small star': 'Petite étoile', 'Crown': 'Couronne',
    'First CV uploaded': 'Premier CV importé', 'Portfolio added': 'Portfolio ajouté', 'First application': 'Première candidature', '5 applications': '5 candidatures',
    'First interview': 'Premier entretien', 'Interview completed': 'Entretien terminé', 'First offer': 'Première offre',
    'FIRST STEP': 'PREMIER PAS', 'EXPLORER': 'EXPLORATEUR', 'SHARP EYE': 'ŒIL AFFÛTÉ', 'APPLICATION PRO': 'PRO DES CANDIDATURES', 'PERSONAL TOUCH': 'TOUCHE PERSONNELLE',
    'BRAVE CHICKEN': 'POULET COURAGEUX', 'Your first application.': 'Votre première candidature.', 'You explored 25 relevant jobs.': 'Vous avez exploré 25 offres pertinentes.',
    'You applied to a 90%+ match.': 'Vous avez postulé à une offre compatible à 90 %+.', 'You sent 10 personalised applications.': 'Vous avez envoyé 10 candidatures personnalisées.',
    'You generated 10 unique cover letters.': 'Vous avez généré 10 lettres uniques.', 'Your first interview.': 'Votre premier entretien.', 'Your first offer.': 'Votre première offre.',
    'Progress to next level': 'Progression vers le niveau suivant',
    'Close': 'Fermer', 'Two accessories max — a chicken with taste.': 'Deux accessoires maximum — un poulet qui a du goût.',
    '+10 XP': '+10 XP',

    // jobs list
    'Job discovery ·': 'Découverte d’offres ·', 'Offers from LinkedIn, Indeed and Welcome to the Jungle, de-duplicated and ranked for you.': 'Les offres de LinkedIn, Indeed et Welcome to the Jungle, dédoublonnées et classées pour vous.',
    'Demo mode.': 'Mode démo.',
    'No live connection to LinkedIn, Indeed or Welcome to the Jungle exists in this prototype: offers are fictional and served by replaceable demo adapters. “Open original” links run a search on the platform — they are not real listings.': 'Ce prototype n’a aucune connexion directe avec LinkedIn, Indeed ou Welcome to the Jungle : les offres sont fictives et fournies par des connecteurs de démo remplaçables. Les liens « Voir l’offre d’origine » lancent une recherche sur la plateforme — ce ne sont pas de vraies annonces.',
    'Search jobs': 'Rechercher des offres', 'Search title, company, skills, location… e.g. chef de produit, SEO, social media': 'Poste, entreprise, compétences, lieu… ex. chef de produit, SEO, social media',
    'Sort': 'Trier', 'Best match': 'Meilleure compatibilité', 'Most recent': 'Plus récentes', 'Salary': 'Salaire', 'Company A–Z': 'Entreprise A–Z', 'Filters': 'Filtres', 'Job filters': 'Filtres d’offres',
    'Field': 'Domaine', 'Location': 'Lieu', 'Source': 'Source', 'Publication date': 'Date de publication', 'Duration': 'Durée',
    'Salary (€/month, if available)': 'Salaire (€/mois, si indiqué)', 'Min': 'Min', 'Max': 'Max', 'Match': 'Compatibilité', 'Minimum match:': 'Compatibilité minimum :',
    'Show expired offers': 'Afficher les offres expirées', 'Reset filters': 'Réinitialiser les filtres', 'Any time': 'Toutes', 'Today': 'Aujourd’hui',
    'Last 3 days': '3 derniers jours', 'Last 7 days': '7 derniers jours', 'Last 30 days': '30 derniers jours', 'Other': 'Autre', 'Remote': 'Télétravail', 'Hybrid': 'Hybride', 'On-site': 'Sur site',
    'Internship': 'Stage (EN)', 'Apprenticeship': 'Apprentissage', 'Project Mgmt': 'Gestion de projet',
    'NEW': 'NOUVEAU', 'EXPIRED': 'EXPIRÉE', 'Seen': 'Vue', 'Available on': 'Disponible sur', 'Analyze': 'Analyser', 'Apply': 'Postuler', 'Explore quest': 'Explorer la quête',
    '🐔 NEW QUEST': '🐔 NOUVELLE QUÊTE', 'Salary not specified': 'Salaire non précisé', '★ Saved': '★ Enregistrée', '☆ Save': '☆ Enregistrer',
    'Nothing interesting yet': 'Rien d’intéressant pour l’instant', 'Let’s keep exploring — try removing a filter or searching with another keyword.': 'Continuons à explorer — retirez un filtre ou essayez un autre mot-clé.',
    'Saved — your chicken tucked it in its backpack 🎒': 'Enregistrée — votre poulet l’a rangée dans son sac 🎒', 'Removed from saved': 'Retirée des favoris',
    'Refreshing…': 'Actualisation…',

    // job detail
    '← Jobs': '← Offres', 'Language': 'Langue', 'Published': 'Publiée', 'French': 'Français', 'English': 'Anglais', 'Spanish': 'Espagnol',
    '✨ PREPARE MY APPLICATION': '✨ PRÉPARER MA CANDIDATURE', '✨ Prepare my application': '✨ Préparer ma candidature', 'Open original ↗': 'Voir l’offre d’origine ↗', '🐔 Ask the chicken': '🐔 Demander au poulet',
    'The same offer was detected on 3 platforms (same company, similar title, location and description) and merged. Choose your preferred source:': 'La même offre a été détectée sur 3 plateformes (même entreprise, titre, lieu et description proches) et fusionnée. Choisissez votre source préférée :',
    'The same offer was detected on 2 platforms (same company, similar title, location and description) and merged. Choose your preferred source:': 'La même offre a été détectée sur 2 plateformes (même entreprise, titre, lieu et description proches) et fusionnée. Choisissez votre source préférée :',
    'Detected on one platform.': 'Détectée sur une seule plateforme.', 'Preferred source': 'Source préférée',
    'About the company': 'À propos de l’entreprise', 'from the offer': 'issu de l’offre', 'Job description': 'Description du poste', 'Responsibilities': 'Missions',
    'No company description in the offer.': 'Pas de description de l’entreprise dans l’offre.',
    'Key requirements': 'Exigences clés', 'Coloured by your profile:': 'Couleurs selon votre profil :', 'in your CV': 'dans votre CV', 'related': 'proche', 'not found': 'absent',
    'Required skills': 'Compétences requises', 'Preferred skills': 'Compétences appréciées', 'Tools': 'Outils', 'Languages': 'Langues', 'Qualifications': 'Formation', 'Experience': 'Expérience',
    'Your profile': 'Votre profil', 'Strong match': 'Forte compatibilité', 'Good match': 'Bonne compatibilité', 'Partial match': 'Compatibilité partielle', 'Exploratory match': 'Compatibilité exploratoire',
    'Missing / unclear': 'Manquant / flou', 'Nothing major 🎉': 'Rien de majeur 🎉', 'How is this score calculated?': 'Comment ce score est-il calculé ?', 'Score components': 'Composantes du score',
    'Component': 'Composante', 'Points': 'Points', 'Skills': 'Compétences', 'Experience ': 'Expérience', 'Education': 'Formation', 'Industry': 'Secteur', 'Keywords': 'Mots-clés',
    'The score is a recommendation based on your CV and preferences — not a hiring prediction. A partial match is still worth exploring.': 'Le score est une recommandation basée sur votre CV et vos préférences — pas une prédiction d’embauche. Une compatibilité partielle mérite quand même d’être explorée.',
    'Why you fit': 'Pourquoi vous correspondez', 'What could strengthen your application': 'Ce qui pourrait renforcer votre candidature',
    'Job offer': 'Offre', 'Your answers': 'Vos réponses', 'Suggestion': 'Suggestion', 'Matches a position you are looking for': 'Correspond à un poste que vous recherchez',
    'No portfolio linked yet — adding one gives recruiters something to look at.': 'Aucun portfolio pour l’instant — en ajouter un donne aux recruteurs quelque chose à voir.',
    'Okay… THIS looks interesting.': 'Bon… CELLE-CI a l’air intéressante.', 'Pretty good match. Let’s investigate.': 'Plutôt compatible. Enquêtons.',
    'Interesting… but we have a few gaps to work on.': 'Intéressant… mais il y a quelques écarts à travailler.', 'Not the strongest match, but let’s see if there’s something worth exploring.': 'Pas la meilleure compatibilité, mais voyons s’il y a quelque chose à explorer.',
    'No CV uploaded — the score uses your preferences only.': 'Aucun CV importé — le score n’utilise que vos préférences.', 'Upload your CV': 'Importez votre CV',
    'Offer not found': 'Offre introuvable', 'It may have been removed from the feed.': 'Elle a peut-être été retirée du flux.', 'Back to jobs': 'Retour aux offres',
    'The offer has no description. Matching relies on the title and requirements only.': 'L’offre n’a pas de description. La compatibilité repose sur le titre et les exigences.',
    'EXPIRED.': 'EXPIRÉE.', 'This offer appears to be closed. It stays visible here (and in your tracker if you applied).': 'Cette offre semble clôturée. Elle reste visible ici (et dans votre suivi si vous avez postulé).',

    // skills / industries / fields
    'Social media': 'Réseaux sociaux', 'Community management': 'Community management', 'Content creation': 'Création de contenu', 'Copywriting': 'Rédaction',
    'SEA / Paid search': 'SEA / Référencement payant', 'Paid media': 'Médias payants', 'CRM / Email marketing': 'CRM / Emailing', 'Product launch': 'Lancement de produit',
    'Product marketing': 'Marketing produit', 'Brand marketing': 'Marketing de marque', 'Market research': 'Études de marché', 'Data analysis': 'Analyse de données',
    'Web analytics': 'Web analytics', 'Events': 'Événementiel', 'Influencer marketing': 'Marketing d’influence', 'Growth marketing': 'Growth marketing',
    'Project management': 'Gestion de projet', 'Graphic design': 'Design graphique', 'Video editing': 'Montage vidéo', 'Trade marketing': 'Trade marketing',
    'FMCG / Food & beverage': 'Grande consommation / Agroalimentaire', 'Beauty & cosmetics': 'Beauté & cosmétique', 'Fashion & luxury': 'Mode & luxe', 'Media & publishing': 'Médias & édition',
    'Tech / SaaS': 'Tech / SaaS', 'E-commerce & retail': 'E-commerce & distribution', 'Mobility & sport': 'Mobilité & sport', 'Food service & hospitality': 'Restauration & hôtellerie',
    'Culture & events': 'Culture & événementiel', 'Agency': 'Agence', 'Travel & tourism': 'Voyage & tourisme',
    'Digital Marketing': 'Marketing digital', 'Social Media': 'Réseaux sociaux', 'Content': 'Contenu', 'Brand': 'Marque', 'Product': 'Produit', 'Growth': 'Croissance',
    'Marketing Project Management': 'Gestion de projets marketing',

    // statuses & kanban
    'To Apply': 'À postuler', 'Follow-up': 'Relance', 'Interview': 'Entretien', 'Final Round': 'Tour final', 'Offer': 'Offre', 'Withdrawn': 'Retirée',
    'Application CRM': 'CRM des candidatures', 'Drag cards between columns — or use “Move to” on touch screens and keyboards.': 'Glissez les cartes entre les colonnes — ou utilisez « Déplacer vers » au clavier et sur écran tactile.',
    'Filter applications': 'Filtrer les candidatures', 'Filter by company, role…': 'Filtrer par entreprise, poste…', '+ Add application': '+ Ajouter une candidature', 'Application board': 'Tableau des candidatures',
    'Move to…': 'Déplacer vers…', 'Keep going. Your first interview could be next.': 'Continuez. Votre premier entretien pourrait être le prochain.', 'The journey isn’t over. 🔥': 'Le voyage n’est pas fini. 🔥',
    'Nothing here — good.': 'Rien ici — tant mieux.', 'Save a job, then prepare it here.': 'Enregistrez une offre, puis préparez-la ici.', 'Nothing here yet.': 'Rien ici pour l’instant.',
    'Ready to start applying?': 'Prêt à commencer à postuler ?', 'Follow-up overdue': 'Relance en retard', 'Follow up today': 'Relancer aujourd’hui',
    'Add an application manually': 'Ajouter une candidature manuellement', 'For an offer found outside Chic Career. Nothing is sent anywhere.': 'Pour une offre trouvée hors de Chic Career. Rien n’est envoyé nulle part.',
    'Company *': 'Entreprise *', 'Job title *': 'Intitulé du poste *', 'Job title': 'Intitulé du poste', 'Original job URL': 'URL de l’offre d’origine',
    'Please add the company name — it’s needed to track the application.': 'Ajoutez le nom de l’entreprise — il est nécessaire pour suivre la candidature.',
    'Please add the job title.': 'Ajoutez l’intitulé du poste.', 'That URL doesn’t look valid. It should start with https://': 'Cette URL semble invalide. Elle doit commencer par https://',
    'You already track this application.': 'Vous suivez déjà cette candidature.', 'Open it': 'L’ouvrir', 'Application added': 'Candidature ajoutée',

    // application record
    '← Applications': '← Candidatures', 'Overview': 'Aperçu', 'Timeline': 'Chronologie', 'Documents': 'Documents', '🎤 Interview prep': '🎤 Préparation entretien',
    '✨ Continue mission': '✨ Reprendre la mission', 'View offer': 'Voir l’offre', 'EXPIRED OFFER — kept in your history': 'OFFRE EXPIRÉE — conservée dans votre historique',
    'Application date': 'Date de candidature', 'Salary (€/month)': 'Salaire (€/mois)', 'Contact person': 'Personne de contact', 'Contact email': 'E-mail du contact',
    'Interview date': 'Date d’entretien', 'Follow-up date': 'Date de relance', 'CV version used': 'Version du CV utilisée', 'Portfolio used': 'Portfolio utilisé', 'Notes': 'Notes',
    'Save changes': 'Enregistrer les modifications', 'Application saved': 'Candidature enregistrée', 'Delete application?': 'Supprimer la candidature ?', 'Application deleted': 'Candidature supprimée',
    'The company name can’t be empty.': 'Le nom de l’entreprise ne peut pas être vide.', 'The job title can’t be empty.': 'L’intitulé du poste ne peut pas être vide.',
    'The job URL doesn’t look valid (it should start with https://).': 'L’URL de l’offre semble invalide (elle doit commencer par https://).',
    'The portfolio URL doesn’t look valid.': 'L’URL du portfolio semble invalide.', 'The contact email doesn’t look valid.': 'L’e-mail du contact semble invalide.',
    'Add an event': 'Ajouter un événement', 'What happened?': 'Que s’est-il passé ?', 'e.g. Phone call with the recruiter': 'ex. Appel avec le recruteur', 'Date': 'Date', 'Type': 'Type',
    'Note': 'Note', 'Follow-up sent': 'Relance envoyée', 'Add event': 'Ajouter', 'Event added': 'Événement ajouté', 'Describe the event in a few words.': 'Décrivez l’événement en quelques mots.',
    'Job discovered': 'Offre découverte', 'CV selected': 'CV sélectionné', 'Cover letter generated': 'Lettre de motivation générée', 'Application submitted': 'Candidature envoyée',
    'Follow-up reminder': 'Rappel de relance', 'Interview scheduled': 'Entretien programmé', 'Offer received': 'Offre reçue', 'Rejected — progress kept': 'Refus — progression conservée',
    'Moved to To Apply': 'Remise dans « À postuler »', 'Moved to Follow-up': 'Passée en relance', 'Moved to Interview': 'Passée en entretien',
    'Follow-up reminder (upcoming)': 'Rappel de relance (à venir)', 'Interview (upcoming)': 'Entretien (à venir)',
    'CV used': 'CV utilisé', 'No CV recorded.': 'Aucun CV enregistré.', 'None': 'Aucun', 'No answers recorded.': 'Aucune réponse enregistrée.', 'No cover letter yet.': 'Pas encore de lettre.',
    'Previous versions': 'Versions précédentes', 'Download .txt': 'Télécharger .txt',
    'Reminders': 'Rappels', 'No reminders yet.': 'Aucun rappel pour l’instant.', 'Remind me on': 'Me le rappeler le', 'Set reminder': 'Créer le rappel',
    'Reminders are shown in Chic Career (and as a browser notification if you allow it). No email is ever sent automatically.': 'Les rappels s’affichent dans Chic Career (et en notification du navigateur si vous l’autorisez). Aucun e-mail n’est jamais envoyé automatiquement.',
    'Follow-up message draft 🐔': 'Brouillon de relance 🐔', 'A suggestion to copy into your own email client — edit it freely.': 'Une suggestion à copier dans votre messagerie — modifiez-la librement.',
    'Follow-up message': 'Message de relance', '✓ I sent a follow-up': '✓ J’ai envoyé une relance', 'Follow-up logged. Next nudge in 7 days.': 'Relance enregistrée. Prochain rappel dans 7 jours.',
    'Application not found': 'Candidature introuvable', 'It may have been deleted.': 'Elle a peut-être été supprimée.', 'Back to applications': 'Retour aux candidatures',

    // interview
    '🎤 INTERVIEW MODE': '🎤 MODE ENTRETIEN', 'Okay. Deep breath. Let’s prepare.': 'OK. On respire. On se prépare.', 'Prepare for interview': 'Préparer l’entretien',
    'Questions are generated locally from the offer and your CV — they are likely questions, not a script of the real interview.': 'Les questions sont générées localement à partir de l’offre et de votre CV — ce sont des questions probables, pas le script du vrai entretien.',
    'Likely questions': 'Questions probables', 'About the role': 'Sur le poste', 'Based on your CV': 'D’après votre CV', 'from your CV': 'issu de votre CV', 'chicken suggestion': 'suggestion du poulet',
    'Practice my answer': 'M’entraîner', 'Your answer': 'Votre réponse', 'Save & get feedback': 'Enregistrer et obtenir un retour', 'STAR stories to prepare': 'Histoires STAR à préparer',
    'Talking points': 'Points à mettre en avant', '✓ Interview completed': '✓ Entretien terminé', 'Review the offer': 'Revoir l’offre', 'Review my CV': 'Revoir mon CV',
    'Describe what YOU personally did — the decisions and steps (not on your CV, fill it in).': 'Décrivez ce que VOUS avez fait — les décisions et les étapes (absent du CV, à compléter).',
    'Add a result you can actually stand behind.': 'Ajoutez un résultat que vous pouvez vraiment défendre.',
    'Tell us about yourself in two minutes.': 'Présentez-vous en deux minutes.', 'Why this internship now?': 'Pourquoi ce stage maintenant ?', 'Why this apprenticeship now?': 'Pourquoi cette alternance maintenant ?',
    'What achievement are you proudest of?': 'De quelle réussite êtes-vous le plus fier ou la plus fière ?', 'Tell us about a difficulty and how you handled it.': 'Parlez-nous d’une difficulté et de la façon dont vous l’avez gérée.',
    'How would you describe our brand to a friend?': 'Comment décririez-vous notre marque à un ami ?', '✓ Solid structure — nice.': '✓ Structure solide — bravo.',
    'Heuristic feedback (length, figures, STAR), not an evaluation of content.': 'Retour heuristique (longueur, chiffres, STAR), pas une évaluation du fond.',
    'A bit short — aim for 1–2 minutes when spoken (≈120–250 words).': 'Un peu court — visez 1 à 2 minutes à l’oral (≈120–250 mots).', 'Quite long — try to land your point in under 2 minutes.': 'Assez long — essayez de conclure en moins de 2 minutes.',
    'Add a concrete figure or result if you have a real one.': 'Ajoutez un chiffre ou un résultat concret si vous en avez un vrai.', 'Use “I” — recruiters want to hear your personal contribution.': 'Dites « je » — les recruteurs veulent entendre votre contribution personnelle.',
    'Close with the outcome (the R of STAR).': 'Terminez par le résultat (le R de STAR).',
    'The original offer is no longer in the feed, so detailed preparation isn’t available. Use the timeline and notes to prepare.': 'L’offre d’origine n’est plus dans le flux : la préparation détaillée n’est pas disponible. Utilisez la chronologie et les notes.',

    // celebration / confirmation
    '🏆 MISSION COMPLETE': '🏆 MISSION ACCOMPLIE', 'Your chicken did it! 🐔👑': 'Votre poulet l’a fait ! 🐔👑', 'You received an offer from': 'Vous avez reçu une offre de',
    'Logged because you moved this application to “Offer”. Take a moment — then read the details carefully before accepting.': 'Enregistré parce que vous avez déplacé cette candidature vers « Offre ». Savourez — puis lisez bien les détails avant d’accepter.',
    'Celebrate & close': 'Célébrer et fermer', 'Application submitted!': 'Candidature envoyée !', 'Mission completed!': 'Mission accomplie !', 'Next suggested action': 'Prochaine action suggérée',
    'View tracker': 'Voir le suivi', '⏰ Set reminder': '⏰ Créer un rappel', 'Rejection logged. Your chicken keeps every step it has earned — onward. 🐔': 'Refus enregistré. Votre poulet garde chaque étape gagnée — on continue. 🐔',
    'Interview completed — your chicken earned a ✨ star!': 'Entretien terminé — votre poulet gagne une ✨ étoile !',

    // mission
    '← Back to the offer': '← Retour à l’offre', '🐔 MISSION STARTED': '🐔 MISSION LANCÉE', 'Mission steps': 'Étapes de la mission', 'CV': 'CV', 'Portfolio': 'Portfolio',
    'Job Analysis': 'Analyse de l’offre', 'Your Questions': 'Vos questions', 'Cover Letter': 'Lettre', 'Review': 'Relecture',
    'Heads-up:': 'Attention :', 'or continue to prepare a new version.': 'ou continuez pour préparer une nouvelle version.', 'See company history': 'Voir l’historique avec l’entreprise',
    'EXPIRED:': 'EXPIRÉE :', 'this offer seems closed — you can still prepare, but the original link may no longer accept applications.': 'cette offre semble clôturée — vous pouvez préparer quand même, mais le lien d’origine n’accepte peut-être plus de candidatures.',
    'No CV uploaded': 'Aucun CV importé', 'Upload your CV to unlock personalized job matching and AI applications.': 'Importez votre CV pour débloquer la compatibilité personnalisée et les candidatures assistées.',
    'Upload my CV': 'Importer mon CV', '01 · Select the CV for this application': '01 · Choisissez le CV pour cette candidature',
    'The selected CV is the only source of experience the chicken will use.': 'Le CV choisi est la seule source d’expérience que le poulet utilisera.', 'CV version': 'Version du CV',
    'Match recalculated per CV version.': 'Compatibilité recalculée pour chaque version du CV.', 'Manage CVs': 'Gérer les CV', 'Use this CV →': 'Utiliser ce CV →', 'Please choose a CV.': 'Choisissez un CV.',
    'No target role': 'Aucun poste cible',
    'Your first and last name are missing — they’re needed to sign the letter.': 'Votre prénom et votre nom manquent — ils sont nécessaires pour signer la lettre.', 'Complete my profile': 'Compléter mon profil',
    '02 · Confirm your portfolio': '02 · Confirmez votre portfolio', 'The portfolio shows what you can do. The letter will point to it once, at most — it won’t repeat it.': 'Le portfolio montre ce que vous savez faire. La lettre y renverra une fois au plus — sans le répéter.',
    'No portfolio in your profile yet. You can add one here, or continue without it.': 'Pas encore de portfolio dans votre profil. Ajoutez-en un ici ou continuez sans.',
    'Portfolio URL for this application': 'URL du portfolio pour cette candidature', 'Include my portfolio in this application': 'Inclure mon portfolio dans cette candidature',
    'Projects you described': 'Projets que vous avez décrits', 'your portfolio': 'votre portfolio', '← Back': '← Retour', 'Confirm portfolio →': 'Confirmer le portfolio →',
    'Tip: describe 2–3 portfolio projects in My Profile → Portfolio so the chicken can point to the right one (it never visits or scrapes your site).': 'Astuce : décrivez 2 à 3 projets dans Mon profil → Portfolio pour que le poulet renvoie au bon (il ne visite ni n’aspire jamais votre site).',
    'That portfolio URL doesn’t look valid — it should start with https://': 'Cette URL de portfolio semble invalide — elle doit commencer par https://',
    'Add a portfolio URL, or untick “Include my portfolio”.': 'Ajoutez une URL de portfolio, ou décochez « Inclure mon portfolio ».',
    'Analysing the offer, your CV and your portfolio…': 'Analyse de l’offre, de votre CV et de votre portfolio…', '03 · Your application': '03 · Votre candidature',
    'CV selected ': 'CV sélectionné', 'Not included': 'Non inclus', 'Continue →': 'Continuer →', 'Your chicken found a few things we should highlight.': 'Votre poulet a repéré quelques points à mettre en avant.',
    '04 · A few quick questions': '04 · Quelques questions rapides', '04 · I have everything I need': '04 · J’ai tout ce qu’il me faut',
    'Your profile and previous answers already cover what this letter needs.': 'Votre profil et vos réponses précédentes couvrent déjà ce dont la lettre a besoin.',
    'Save answers →': 'Enregistrer les réponses →', 'Why I ask:': 'Pourquoi je demande :',
    'Motivation': 'Motivation', 'Personal connection': 'Lien personnel', 'Career goal': 'Objectif de carrière', 'Differentiator': 'Ce qui vous distingue',
    'One or two concrete reasons — a product, their approach, something you noticed. Your own words make the letter yours.': 'Une ou deux raisons concrètes — un produit, leur approche, un détail remarqué. Vos propres mots rendent la lettre unique.',
    'A course, a job, a strong personal interest… If not, just say “no” — I’ll focus on transferable experience and won’t invent anything.': 'Un cours, un job, un vrai intérêt personnel… Sinon, répondez « non » — je me concentrerai sur l’expérience transférable sans rien inventer.',
    'Only if it’s true — “not really” is a perfectly good answer.': 'Seulement si c’est vrai — « pas vraiment » est une très bonne réponse.',
    'A mission from the offer, a skill you want to grow, the team…': 'Une mission de l’offre, une compétence à développer, l’équipe…',
    'Both are relevant to this offer — pick the one you’re most proud of.': 'Les deux sont pertinentes — choisissez celle dont vous êtes le plus fier ou la plus fière.',
    'Which experience would you most like to highlight?': 'Quelle expérience souhaitez-vous mettre en avant ?', 'One sentence is enough.': 'Une phrase suffit.',
    'Why does this position make sense for your next career step?': 'Pourquoi ce poste est-il cohérent pour votre prochaine étape ?', 'What would you like the recruiter to remember about you?': 'Que voulez-vous que le recruteur retienne de vous ?',
    'A strength, a habit, a way of working.': 'Une force, une habitude, une façon de travailler.',
    'This is the main gap between your CV and the offer.': 'C’est le principal écart entre votre CV et l’offre.', 'A real, personal detail is what makes a recruiter remember a letter.': 'Un vrai détail personnel est ce qui fait qu’un recruteur se souvient d’une lettre.',
    'Two of your experiences fit this offer equally well.': 'Deux de vos expériences correspondent autant l’une que l’autre.', 'Your profile has no career goal yet.': 'Votre profil n’a pas encore d’objectif de carrière.',
    'Your profile has no personal pitch yet.': 'Votre profil n’a pas encore de pitch personnel.',
    'Why this role — it matches the positions in your preferences.': 'Pourquoi ce poste — il correspond aux postes de vos préférences.', 'Career goal — taken from your profile.': 'Objectif de carrière — repris de votre profil.',
    'What makes you different — taken from your profile pitch.': 'Ce qui vous distingue — repris de votre pitch.',
    '05 · Generate my cover letter': '05 · Générer ma lettre de motivation', 'Offer language detected:': 'Langue de l’offre détectée :', '. You can override it.': '. Vous pouvez la changer.',
    'Generate in French': 'Générer en français', 'Generate in English': 'Générer en anglais',
    'Generated locally by the demo AI from: the offer + your selected CV + your portfolio + your profile + your answers + your previous letters (to avoid repetition). Nothing leaves your browser.': 'Générée localement par l’IA de démo à partir de : l’offre + le CV choisi + votre portfolio + votre profil + vos réponses + vos lettres précédentes (pour éviter les répétitions). Rien ne quitte votre navigateur.',
    'Go to review →': 'Aller à la relecture →', 'Your chicken is writing a personalized application…': 'Votre poulet rédige une candidature personnalisée…', 'Checking your experience…': 'Vérification de votre expérience…',
    'Comparing with the job…': 'Comparaison avec le poste…', 'Making sure we don’t repeat your CV…': 'On s’assure de ne pas répéter votre CV…', 'Almost ready!': 'Presque prêt !',
    'Review & edit →': 'Relire et modifier →', 'The letter couldn’t be generated.': 'La lettre n’a pas pu être générée.',
    '🐔 QUALITY CHECK': '🐔 CONTRÔLE QUALITÉ', '👍 Looks personal to me!': '👍 Ça me semble personnel !', 'Hmm, a bit close to something you already wrote.': 'Hmm, un peu proche de ce que vous avez déjà écrit.',
    'Personalisation': 'Personnalisation', 'Repetition risk': 'Risque de répétition', 'CV repetition': 'Répétition du CV', 'Previous-letter similarity': 'Similarité avec les lettres précédentes',
    'LOW': 'FAIBLE', 'MEDIUM': 'MOYEN', 'HIGH': 'ÉLEVÉ',
    'Mentions the exact position': 'Mentionne le poste exact', 'No invented experience — evidence comes from your CV': 'Aucune expérience inventée — les preuves viennent de votre CV',
    'No invented figures — every number comes from your CV/offer': 'Aucun chiffre inventé — chaque nombre vient de votre CV ou de l’offre', 'Uses concrete evidence': 'Utilise des preuves concrètes',
    'No measurable result available — consider adding one to your CV': 'Aucun résultat mesurable disponible — pensez à en ajouter un à votre CV',
    'Motivation tied to the offer (no personal answer given)': 'Motivation liée à l’offre (aucune réponse personnelle)', 'Opening style was used recently': 'Ce style d’ouverture a été utilisé récemment',
    'Fresh opening (not a stock phrase)': 'Ouverture originale (pas une formule toute faite)', 'Main experience not overused': 'Expérience principale peu réutilisée', 'No buzzwords': 'Aucun mot creux',
    'Written in French': 'Rédigée en français', 'Written in English': 'Rédigée en anglais',
    '06 · Review & edit': '06 · Relire et modifier', 'Rewrite options': 'Options de réécriture', '↻ Regenerate': '↻ Régénérer', 'More natural': 'Plus naturelle', 'More professional': 'Plus professionnelle',
    'More confident': 'Plus assurée', 'More creative': 'Plus créative', 'More company-focused': 'Plus centrée entreprise', 'More marketing-focused': 'Plus orientée marketing', 'Shorten': 'Raccourcir',
    'Translate FR → EN': 'Traduire FR → EN', 'Translate EN → FR': 'Traduire EN → FR', 'Cover letter text': 'Texte de la lettre', 'Re-check quality': 'Revérifier la qualité', 'Versions': 'Versions',
    'Save edits': 'Enregistrer', 'edited': 'modifiée', 'natural': 'naturelle', 'professional': 'professionnelle', 'confident': 'assurée', 'creative': 'créative', 'company': 'entreprise', 'marketing': 'marketing', 'short': 'courte',
    'Stylistic rewrites keep the same facts (same experiences, figures and answers). Rewriting replaces unsaved manual edits.': 'Les réécritures de style gardent les mêmes faits (expériences, chiffres et réponses). Réécrire remplace les modifications non enregistrées.',
    'What this letter is built from': 'Ce sur quoi la lettre s’appuie', 'Your answer': 'Votre réponse', 'Chicken': 'Poulet', 'Structure & phrasing only — no facts added.': 'Structure et formulation uniquement — aucun fait ajouté.',
    'Looks good — next: apply →': 'C’est bon — étape suivante : postuler →', 'Quality re-checked': 'Qualité revérifiée', 'Replace your edits?': 'Remplacer vos modifications ?', 'Rewrite': 'Réécrire',
    'Rewriting creates a new version from the same facts. Your unsaved manual edits will be replaced (previous versions stay in the history).': 'La réécriture crée une nouvelle version à partir des mêmes faits. Vos modifications non enregistrées seront remplacées (les versions précédentes restent dans l’historique).',
    'Save your edits first?': 'Enregistrer vos modifications d’abord ?', 'You have unsaved changes in the letter.': 'La lettre contient des modifications non enregistrées.', 'Save & continue': 'Enregistrer et continuer',
    'Older version loaded in the editor — save to restore it.': 'Ancienne version chargée dans l’éditeur — enregistrez pour la restaurer.', 'No letter yet.': 'Pas encore de lettre.', 'Generate one →': 'En générer une →',
    '07 · Apply on the original platform': '07 · Postuler sur la plateforme d’origine', 'Copy or download your letter (step 06).': 'Copiez ou téléchargez votre lettre (étape 06).',
    'Open the offer on': 'Ouvrez l’offre sur', 'and submit your application there.': 'et envoyez-y votre candidature.',
    'Come back and confirm — only then will the tracker say “Applied”.': 'Revenez confirmer — c’est seulement alors que le suivi indiquera « Envoyée ».',
    'Open original application ↗': 'Ouvrir la candidature d’origine ↗', 'Copy my letter': 'Copier ma lettre', 'You opened the original offer. Did you submit your application?': 'Vous avez ouvert l’offre d’origine. Avez-vous envoyé votre candidature ?',
    '✓ I submitted this application': '✓ J’ai envoyé cette candidature', 'Not yet — keep it in “To Apply”': 'Pas encore — la garder dans « À postuler »', 'Last step! I’ll wait here while you apply.': 'Dernière étape ! Je t’attends ici pendant que tu postules.',
    'Kept in “To Apply”. Your draft is saved.': 'Gardée dans « À postuler ». Votre brouillon est enregistré.',

    // assistant
    '🐔 Career Chicken': '🐔 Poulet Carrière', 'Your career companion — not a recruiter.': 'Votre compagnon de carrière — pas un recruteur.', 'Close Career Chicken panel': 'Fermer le panneau du Poulet Carrière',
    'Talking about': 'À propos de', '— choose a job —': '— choisir une offre —', '🔎 Analyze this job': '🔎 Analyser cette offre', '💛 Why am I a good fit?': '💛 Pourquoi je corresponds ?',
    '🧩 What is missing from my profile?': '🧩 Que manque-t-il à mon profil ?', '✍️ Generate cover letter': '✍️ Générer la lettre', '✨ Improve my cover letter': '✨ Améliorer ma lettre',
    '🫶 Make it more personal': '🫶 La rendre plus personnelle', '✂️ Make it shorter': '✂️ La raccourcir', '🎤 Prepare interview questions': '🎤 Préparer les questions d’entretien',
    '💌 Create follow-up message': '💌 Rédiger une relance', 'Pick a job and I’ll help you with it.': 'Choisissez une offre et je vous aide.', 'Thinking…': 'Je réfléchis…', 'My take': 'Mon avis',
    'Asked by the offer, not found in your CV': 'Demandé par l’offre, absent de votre CV', 'Nothing major.': 'Rien de majeur.', 'Partially covered': 'Partiellement couvert', 'What you can do': 'Ce que vous pouvez faire',
    'If you genuinely have one of these skills, add it to your CV data (My Profile → CVs → Review data). I will never add it for you.': 'Si vous avez vraiment l’une de ces compétences, ajoutez-la à votre CV (Mon profil → CV → Vérifier les données). Je ne l’ajouterai jamais à votre place.',
    'Let’s start the mission': 'Lançons la mission', 'No letter yet': 'Pas encore de lettre', 'Generate a letter first —': 'Générez d’abord une lettre —', 'start the mission': 'lancer la mission',
    'Current letter': 'Lettre actuelle', 'Answers already used': 'Réponses déjà utilisées', 'To make it more personal': 'Pour la rendre plus personnelle', 'Ideas to improve it': 'Idées pour l’améliorer',
    'Try the “More company-focused” rewrite.': 'Essayez la réécriture « Plus centrée entreprise ».', 'From your CV': 'D’après votre CV', 'Full preparation': 'Préparation complète',
    'Open interview mode →': 'Ouvrir le mode entretien →', '(available once the application reaches Interview)': '(disponible quand la candidature atteint Entretien)',
    'Nothing to follow up yet': 'Rien à relancer pour l’instant', 'Follow-ups make sense once you have applied. Confirm your application first.': 'Une relance a du sens une fois la candidature envoyée. Confirmez-la d’abord.',
    'Draft — copy it into your own email': 'Brouillon — copiez-le dans votre messagerie', 'Nothing is sent automatically.': 'Rien n’est envoyé automatiquement.', 'Follow-up draft': 'Brouillon de relance',
    'Open the editor →': 'Ouvrir l’éditeur →', 'Open the questions →': 'Ouvrir les questions →', 'Open in the editor →': 'Ouvrir dans l’éditeur →',

    // companies
    'Relationship history': 'Historique des relations', 'Your history with each company, in one place.': 'Votre historique avec chaque entreprise, au même endroit.',
    'No applications yet': 'Aucune candidature pour l’instant', '← Companies': '← Entreprises', 'Rejections': 'Refus', 'Positions applied for': 'Postes visés',
    'not applied yet': 'pas encore postulé', 'You haven’t applied here yet.': 'Vous n’avez pas encore postulé ici.', 'No current offer.': 'Aucune offre en cours.',
    'Company not found': 'Entreprise introuvable', 'No application or offer for this company yet.': 'Aucune candidature ni offre pour cette entreprise.', 'All companies': 'Toutes les entreprises',

    // statistics
    'Your numbers': 'Vos chiffres', 'Updated live from your application tracker. Rejections are part of the journey — they never erase progress.': 'Mis à jour en direct depuis votre suivi. Les refus font partie du voyage — ils n’effacent jamais la progression.',
    'Applications this month': 'Candidatures ce mois-ci', 'Interview rate': 'Taux d’entretien', 'Offer rate': 'Taux d’offre', 'Applications per month': 'Candidatures par mois',
    'Applications by status': 'Candidatures par statut', 'Applications by contract': 'Candidatures par contrat', 'Applications by source': 'Candidatures par source',
    'Applications by industry': 'Candidatures par secteur', 'Applications by location': 'Candidatures par lieu', 'View as table': 'Voir en tableau', 'Category': 'Catégorie',
    'No data yet.': 'Pas encore de données.', 'No statistics yet': 'Pas encore de statistiques', 'Send your first application and your chicken will start drawing charts.': 'Envoyez votre première candidature et votre poulet commencera à dessiner des graphiques.',
    'Unknown': 'Inconnu', 'Manual': 'Manuelle',

    // saved
    'Shortlist': 'Sélection', 'Your shortlist — add notes, set priorities, then move straight to an application.': 'Votre sélection — ajoutez des notes, des priorités, puis passez directement à la candidature.',
    'Priority': 'Priorité', 'High': 'Haute', 'Medium': 'Moyenne', 'Low': 'Basse', 'Why it’s interesting, who to contact…': 'Pourquoi c’est intéressant, qui contacter…', 'Offer expired': 'Offre expirée',
    'Move to application →': 'Passer à la candidature →', 'No saved jobs': 'Aucune offre enregistrée', 'Your next opportunity starts here. Let’s find something interesting!': 'Votre prochaine opportunité commence ici. Trouvons quelque chose d’intéressant !',
    'Explore jobs': 'Explorer les offres', 'Note saved': 'Note enregistrée',

    // profile
    'Your career knowledge base': 'Votre base de connaissances carrière', 'Everything the chicken knows about you lives here — stored only in this browser.': 'Tout ce que le poulet sait de vous est ici — stocké uniquement dans ce navigateur.',
    'Profile sections': 'Sections du profil', 'Personal Information': 'Informations personnelles', 'CVs': 'CV', 'Preferences': 'Préférences', 'Knowledge base': 'Base de connaissances', 'AI Settings': 'Réglages IA',
    'Personal information': 'Informations personnelles', 'First name *': 'Prénom *', 'Last name *': 'Nom *', 'Email': 'E-mail', 'Phone': 'Téléphone', 'Headline': 'Titre',
    'LinkedIn URL': 'URL LinkedIn', 'Portfolio URL': 'URL du portfolio', 'Personal website (optional)': 'Site personnel (facultatif)', 'Career goal ': 'Objectif de carrière',
    '— used to explain why a role fits your next step': '— sert à expliquer pourquoi un poste correspond à votre prochaine étape', 'What should recruiters remember about you?': 'Que doivent retenir les recruteurs de vous ?',
    '— your personal differentiator': '— ce qui vous distingue', 'Profile saved': 'Profil enregistré',
    'First and last name are required — they sign your cover letters.': 'Le prénom et le nom sont obligatoires — ils signent vos lettres.', 'The email address doesn’t look valid.': 'L’adresse e-mail semble invalide.',
    'My CVs': 'Mes CV', 'Upload a CV': 'Importer un CV', 'Drop your CV here': 'Déposez votre CV ici', 'PDF or DOCX · max 8 MB · or click to browse': 'PDF ou DOCX · 8 Mo max · ou cliquez pour parcourir',
    'Name this version *': 'Nom de cette version *', 'e.g. CV Marketing — 2026': 'ex. CV Marketing — 2026', 'Target role': 'Poste cible', 'e.g. Product marketing': 'ex. Marketing produit',
    'Using an existing name replaces that CV with a new version (the old one is kept in “Older versions”).': 'Utiliser un nom existant remplace ce CV par une nouvelle version (l’ancienne est conservée dans « Anciennes versions »).',
    'No file? Paste your CV text instead': 'Pas de fichier ? Collez le texte de votre CV', 'CV text': 'Texte du CV', 'Paste the text of your CV…': 'Collez le texte de votre CV…', 'Extract & save': 'Extraire et enregistrer',
    'Reading your CV…': 'Lecture de votre CV…', '🔒 Your file is read': '🔒 Votre fichier est lu', 'inside your browser': 'dans votre navigateur',
    '. Only the extracted text and structured data are stored locally; the file itself is never uploaded or kept.': '. Seuls le texte extrait et les données structurées sont stockés localement ; le fichier lui-même n’est jamais envoyé ni conservé.',
    'Review data': 'Vérifier les données', 'Set default': 'Définir par défaut', 'Delete this CV?': 'Supprimer ce CV ?', 'Its extracted data will be removed from this browser.': 'Ses données extraites seront supprimées de ce navigateur.',
    'Default CV updated': 'CV par défaut mis à jour', 'CV extracted — please review what was found.': 'CV extrait — vérifiez ce qui a été trouvé.', 'CV data saved': 'Données du CV enregistrées', 'The CV needs a name.': 'Le CV a besoin d’un nom.',
    'Choose a PDF/DOCX file, or paste your CV text.': 'Choisissez un fichier PDF/DOCX, ou collez le texte de votre CV.', 'Give this CV version a name, e.g. “CV Marketing — 2026”.': 'Donnez un nom à cette version, ex. « CV Marketing — 2026 ».',
    'That text is too short to be a CV. Paste the full content.': 'Ce texte est trop court pour être un CV. Collez le contenu complet.',
    'Something went wrong while reading the file. Try another file or paste the text.': 'Un problème est survenu à la lecture du fichier. Essayez un autre fichier ou collez le texte.',
    'Old Word files (.doc) aren’t supported. Save your CV as .docx or .pdf and try again.': 'Les anciens fichiers Word (.doc) ne sont pas pris en charge. Enregistrez votre CV en .docx ou .pdf et réessayez.',
    'This file is empty. Please choose another CV.': 'Ce fichier est vide. Choisissez un autre CV.', 'This file is larger than 8 MB. Please export a lighter version of your CV.': 'Ce fichier dépasse 8 Mo. Exportez une version plus légère de votre CV.',
    'This doesn’t look like a valid PDF file.': 'Ce fichier ne semble pas être un PDF valide.', 'This doesn’t look like a valid DOCX file.': 'Ce fichier ne semble pas être un DOCX valide.',
    'We couldn’t read this file. It may be damaged or protected. You can paste your CV text instead.': 'Impossible de lire ce fichier. Il est peut-être endommagé ou protégé. Vous pouvez coller le texte de votre CV.',
    'We couldn’t find readable text in this file (it may be a scanned image or use embedded fonts). Paste your CV text below so nothing is lost.': 'Aucun texte lisible dans ce fichier (image scannée ou polices intégrées ?). Collez le texte de votre CV ci-dessous pour ne rien perdre.',
    'Your browser can’t read compressed files. Paste your CV text instead.': 'Votre navigateur ne peut pas lire les fichiers compressés. Collez plutôt le texte de votre CV.',
    'Check every field: extraction is heuristic and may miss or misplace things. Nothing is invented — if something is missing, add it yourself.': 'Vérifiez chaque champ : l’extraction est approximative et peut oublier ou mal placer des éléments. Rien n’est inventé — s’il manque quelque chose, ajoutez-le.',
    'No section headings were recognised': 'Aucun titre de section n’a été reconnu', ', so most fields need to be filled manually.': ', la plupart des champs doivent donc être remplis à la main.',
    'Version name': 'Nom de la version', 'one per line: degree — school — dates': 'une par ligne : diplôme — école — dates', 'Experience & internships': 'Expériences et stages', '+ Add experience': '+ Ajouter une expérience',
    'Projects': 'Projets', '+ Add project': '+ Ajouter un projet', 'Skills (one per line)': 'Compétences (une par ligne)', 'Tools (one per line)': 'Outils (un par ligne)',
    'Languages (Language — level)': 'Langues (Langue — niveau)', 'Certifications': 'Certifications', 'Achievements & quantifiable results': 'Réalisations et résultats chiffrés',
    'Detected automatically': 'Détecté automatiquement', 'Raw extracted text': 'Texte brut extrait', 'Save CV data': 'Enregistrer les données du CV', 'Dates': 'Dates', 'Context / dates': 'Contexte / dates',
    'Responsibilities & results (one per line)': 'Missions et résultats (un par ligne)', 'Project': 'Projet',
    'internship': 'stage', 'apprenticeship': 'alternance', 'job': 'emploi', 'volunteer': 'bénévolat', 'no target role': 'aucun poste cible',
    'My Portfolio': 'Mon portfolio', 'What you can': 'Ce que vous pouvez', 'show': 'montrer',
    '. The chicken uses only what you write here — it never visits, scrapes or invents projects from your site.': '. Le poulet n’utilise que ce que vous écrivez ici — il ne visite, n’aspire ni n’invente jamais de projets depuis votre site.',
    'Portfolio title': 'Titre du portfolio', 'Short description': 'Courte description', 'Other professional links': 'Autres liens professionnels', 'Personal website': 'Site personnel', 'Other link': 'Autre lien',
    'Projects you want to be able to point to': 'Projets auxquels vous voulez pouvoir renvoyer', 'What it shows': 'Ce qu’il montre', 'Link (optional)': 'Lien (facultatif)', 'Remove project': 'Retirer le projet',
    'Save portfolio': 'Enregistrer le portfolio', 'Portfolio saved': 'Portfolio enregistré', 'Portfolio saved — 💻 tiny laptop unlocked!': 'Portfolio enregistré — 💻 petit ordinateur débloqué !',
    'Career preferences': 'Préférences de carrière', 'Used for the relevance score — never to hide offers from you.': 'Utilisées pour le score de pertinence — jamais pour vous cacher des offres.',
    'Locations': 'Lieux', 'Work mode': 'Mode de travail', 'Fields': 'Domaines', 'Preferred industries': 'Secteurs préférés', 'Desired duration': 'Durée souhaitée',
    'Desired positions (one per line)': 'Postes recherchés (un par ligne)', 'Keywords (one per line)': 'Mots-clés (un par ligne)', 'Preferred companies (one per line)': 'Entreprises préférées (une par ligne)',
    'Save preferences': 'Enregistrer les préférences', 'Preferences saved — match scores updated': 'Préférences enregistrées — scores mis à jour',
    'PERSONAL PROFILE — knowledge base': 'PROFIL PERSONNEL — base de connaissances', '🎓 Education': '🎓 Formation', '💼 Experience': '💼 Expérience', '🧪 Projects': '🧪 Projets',
    '🧠 Skills (with evidence)': '🧠 Compétences (avec preuves)', '🛠 Tools': '🛠 Outils', '🌍 Languages': '🌍 Langues', '🏅 Achievements': '🏅 Réalisations', '🧭 Career goals': '🧭 Objectifs de carrière',
    '⚙️ Preferences': '⚙️ Préférences', '🎨 Portfolio': '🎨 Portfolio', '📄 CV versions': '📄 Versions du CV', 'Nothing yet.': 'Rien pour l’instant.', 'Upload a CV to build this.': 'Importez un CV pour construire ceci.',
    'AI provider': 'Fournisseur d’IA', 'Local demo AI': 'IA de démo locale', '(active)': '(active)', 'Rule-based and deterministic. Runs in your browser. Nothing is sent anywhere.': 'À base de règles et déterministe. Fonctionne dans votre navigateur. Rien n’est envoyé nulle part.',
    'External LLM API': 'API LLM externe', '— not configured': '— non configurée', 'Architecture-ready (see': 'Architecture prête (voir',
    '). Using it would send your CV data, the offer and your answers to a third-party service — Chic Career would ask for your explicit consent first.': '). L’utiliser enverrait vos données de CV, l’offre et vos réponses à un service tiers — Chic Career vous demanderait d’abord votre consentement explicite.',
    'Default cover-letter language': 'Langue des lettres par défaut', 'Auto — detect from the offer': 'Auto — détecter à partir de l’offre', 'Always French': 'Toujours en français', 'Always English': 'Toujours en anglais',
    'AI settings saved': 'Réglages IA enregistrés', '🔒 Privacy & your data': '🔒 Confidentialité et données', 'All data is stored in this browser’s': 'Toutes les données sont stockées dans le',
    'CV files are parsed locally and never uploaded or kept — only extracted text and structured data.': 'Les CV sont analysés localement et jamais envoyés ni conservés — seuls le texte extrait et les données structurées le sont.',
    'Portfolio URLs are only displayed and used as you provided them; the app never fetches them.': 'Les URL de portfolio sont seulement affichées et utilisées telles que fournies ; l’application ne les consulte jamais.',
    '“Open original” links leave Chic Career for the job platform. No email or application is ever sent automatically.': 'Les liens « Voir l’offre d’origine » quittent Chic Career pour la plateforme. Aucun e-mail ni candidature n’est jamais envoyé automatiquement.',
    'Export my data (.json)': 'Exporter mes données (.json)', 'Reload demo data': 'Recharger la démo', 'Start fresh (erase everything)': 'Repartir de zéro (tout effacer)',
    'Reload the demo?': 'Recharger la démo ?', 'This replaces all your data with the fictional demo profile, jobs and applications.': 'Cela remplace toutes vos données par le profil, les offres et les candidatures fictifs de la démo.',
    'Reload demo': 'Recharger', 'Demo data reloaded': 'Démo rechargée', 'Erase everything?': 'Tout effacer ?', 'Erase': 'Effacer',
    'Your profile, CVs, applications and letters will be deleted from this browser. Demo job offers stay available.': 'Votre profil, vos CV, candidatures et lettres seront supprimés de ce navigateur. Les offres de démo restent disponibles.',
    'Fresh start — your chicken is a tiny chick again 🐣': 'Nouveau départ — votre poulet redevient un petit poussin 🐣',
    'Raw': 'Brut', 'Older versions': 'Anciennes versions',
    'applications': 'candidatures', 'Chicken suggestion': 'Suggestion du poulet', 'Chic Career needs JavaScript to run.': 'Chic Career a besoin de JavaScript pour fonctionner.',
    'FIND.': 'TROUVER.', 'PREPARE.': 'PRÉPARER.', 'APPLY.': 'POSTULER.', 'GROW.': 'GRANDIR.', 'CONQUER.': 'CONQUÉRIR.',
    'Your career journey, one quest at a time. Prototype — job offers are fictional DEMO DATA; no live LinkedIn, Indeed or Welcome to the Jungle integration; AI runs locally (rule-based). Your data stays in this browser.': 'Votre parcours professionnel, une quête à la fois. Prototype — les offres sont des DONNÉES DÉMO fictives ; aucune intégration directe avec LinkedIn, Indeed ou Welcome to the Jungle ; l’IA fonctionne localement (à base de règles). Vos données restent dans ce navigateur.',
    'Stage': 'Stage', 'Alternance': 'Alternance',
    'Changes the language of the interface. Your data (offers, CV, letters) stays as written.': 'Change la langue de l’interface. Vos données (offres, CV, lettres) restent telles quelles.',

    // empty states, misc
    'Nothing interesting yet. Let’s keep exploring.': 'Rien d’intéressant pour l’instant. Continuons à explorer.',
    'Your browser storage is full. Remove old CV versions or cover letters to free space.': 'Le stockage du navigateur est plein. Supprimez d’anciennes versions de CV ou de lettres pour libérer de la place.',
    'Your browser blocks local storage (private mode?). Data will be lost when you close the tab.': 'Votre navigateur bloque le stockage local (navigation privée ?). Les données seront perdues à la fermeture de l’onglet.',
    'Reminder notifications enabled 🔔': 'Notifications de rappel activées 🔔', 'Notifications not enabled — reminders will still show inside Chic Career.': 'Notifications non activées — les rappels s’afficheront quand même dans Chic Career.',
    'Open': 'Ouvrir', 'Yesterday': 'Hier', 'Tomorrow': 'Demain', 'Never': 'Jamais'
  };

  /* ------------------------------------------------------------ dynamic patterns */
  const t = (s) => (lang === 'fr' ? (trCore(String(s)) || String(s)) : String(s));
  const months = (n) => n + (n === '1' ? ' mois' : ' mois');
  const P = [
    [/^Last updated: (.+)$/, (m) => 'Dernière mise à jour : ' + m[1]],
    [/^(.+) at (.+?) \((.+)\)$/, (m) => m[1] + ' chez ' + m[2] + ' (' + m[3] + ')'],
    [/^Project: (.+)$/, (m) => 'Projet : ' + m[1]],
    [/^(.+?) — (only through an academic project — not professional experience|related experience in .+|tools mentioned in the offer, not on your CV|required in the offer — not found in your CV|nice-to-have — not found in your CV|valued by the offer — not clearly demonstrated|not in your preferred contracts|differs from your preferred duration|outside your preferred locations|language requested by the offer)(\.?)$/, (m) => t(m[1]) + ' — ' + t(m[2]) + m[3]],
    [/^(Stage|Alternance|Internship|Apprenticeship) (\d+) months$/, (m) => t(m[1]) + ' ' + m[2] + ' mois'],
    [/^CV skills(, .+)?$/, (m) => 'Compétences du CV' + (m[1] || '')],
    [/^Good (morning|afternoon|evening)(, (.+))? 👋$/, (m) => (m[1] === 'evening' ? 'Bonsoir' : 'Bonjour') + (m[3] ? ', ' + m[3] : '') + ' 👋'],
    [/^(\d+) months?$/, (m) => months(m[1])],
    [/^(\d+) days ago$/, (m) => 'il y a ' + m[1] + ' jours'], [/^In (\d+) days$/, (m) => 'dans ' + m[1] + ' jours'],
    [/^Saved (.+)$/, (m) => 'Enregistrée ' + lcFirst(t(cap1(m[1])))],
    [/^(\d+)% match$/, (m) => m[1] + ' % compatible'], [/^(\d+)% match — (.+)$/, (m) => m[1] + ' % compatible — ' + t(m[2])],
    [/^(\d+)–(\d+) €\/month$/, (m) => m[1] + '–' + m[2] + ' €/mois'], [/^(\d+) €\/month$/, (m) => m[1] + ' €/mois'],
    [/^new jobs? today · (\d+) relevant$/, (m) => 'nouvelle(s) offre(s) aujourd’hui · ' + m[1] + ' pertinente(s)'],
    [/^(\d+) offers? · (\d+) in the feed · duplicates merged across platforms$/, (m) => m[1] + ' offre(s) · ' + m[2] + ' dans le flux · doublons fusionnés entre plateformes'],
    [/^offers? · (\d+) in the feed · duplicates merged across platforms$/, (m) => 'offre(s) · ' + m[1] + ' dans le flux · doublons fusionnés entre plateformes'],
    [/^Level (\d+)$/, (m) => 'Niveau ' + m[1]], [/^Level (\d+) · (.+)$/, (m) => 'Niveau ' + m[1] + ' · ' + t(m[2])],
    [/^Next: (.+)$/, (m) => 'Prochain : ' + t(m[1])],
    [/^([\d,]+) XP · next: (.+?)( — (.+)| at (\d+) XP)$/, (m) => m[1] + ' XP · prochain : ' + t(m[2]) + (m[4] ? ' — ' + t(m[4]) : ' à ' + m[5] + ' XP')],
    [/^unlocks with your first interview$/, () => 'se débloque avec votre premier entretien'], [/^unlocks when you reach a final round$/, () => 'se débloque en atteignant un tour final'],
    [/^unlocks with your first offer$/, () => 'se débloque avec votre première offre'],
    [/^([\d,]+) XP · max level$/, (m) => m[1] + ' XP · niveau max'],
    [/^Open career profile: level (\d+), (.+)$/, (m) => 'Ouvrir le profil carrière : niveau ' + m[1] + ', ' + t(m[2])],
    [/^Go: (.+)$/, (m) => 'Aller : ' + t(m[1])],
    [/^Complete your application to (.+)$/, (m) => 'Finaliser votre candidature chez ' + m[1]],
    [/^Follow up with (.+)$/, (m) => 'Relancer ' + m[1]], [/^Prepare your (.+) interview$/, (m) => 'Préparer votre entretien chez ' + m[1]],
    [/^Prepare interview for (.+)$/, (m) => 'Préparer l’entretien chez ' + m[1]], [/^Apply to (.+)$/, (m) => 'Postuler chez ' + m[1]], [/^Explore (.+)$/, (m) => 'Explorer ' + m[1]],
    [/^Interview — (.+)$/, (m) => 'Entretien — ' + m[1]],
    [/^Career journey map: the chicken is at (.+)$/, (m) => 'Carte du parcours : le poulet est à l’étape ' + t(m[1])],
    [/^Career Chicken, (.+)$/, (m) => 'Poulet Carrière, ' + (MOODS[m[1]] || m[1])],
    [/^(.+) column$/, (m) => 'Colonne ' + t(m[1])], [/^Move (.+) to$/, (m) => 'Déplacer ' + m[1] + ' vers'],
    [/^Applied (\d.+)$/, (m) => 'Envoyée le ' + m[1]], [/^Added (\d.+)$/, (m) => 'Ajoutée le ' + m[1]],
    [/^Follow up in (\d+)d$/, (m) => 'Relance dans ' + m[1] + ' j'],
    [/^(.+): (\d+) applications$/, (m) => t(m[1]) + ' : ' + m[2] + ' candidature(s)'],
    [/^(.+): (\d+) applications?$/, (m) => t(m[1]) + ' : ' + m[2]],
    [/^(\d+) applications?$/, (m) => m[1] + ' candidature(s)'], [/^(\d+) applications? · (.+)$/, (m) => m[1] + ' candidature(s) · ' + m[2]],
    [/^(\d+) open offers?$/, (m) => m[1] + ' offre(s) ouverte(s)'], [/^(\d+) open offers? · ★ saved$/, (m) => m[1] + ' offre(s) ouverte(s) · ★ enregistrée'],
    [/^Companies you applied to \((\d+)\)$/, (m) => 'Entreprises où vous avez postulé (' + m[1] + ')'], [/^Companies hiring in your feed \((\d+)\)$/, (m) => 'Entreprises qui recrutent dans votre flux (' + m[1] + ')'],
    [/^Applications at (.+)$/, (m) => 'Candidatures chez ' + m[1]], [/^Offers from (.+) in your feed$/, (m) => 'Offres de ' + m[1] + ' dans votre flux'],
    [/^Rates are computed on (\d+) sent applications?\. Response = an interview, an offer or a rejection\.$/, (m) => 'Taux calculés sur ' + m[1] + ' candidature(s) envoyée(s). Réponse = un entretien, une offre ou un refus.'],
    [/^(\d+) experiences · (\d+) education · (\d+) skills · (\d+) tools$/, (m) => m[1] + ' expériences · ' + m[2] + ' formations · ' + m[3] + ' compétences · ' + m[4] + ' outils'],
    [/^uploaded (.+)$/, (m) => 'importé le ' + m[1]],
    [/^Delete (.+)$/, (m) => 'Supprimer ' + m[1]],
    [/^Experience (\d+)$/, (m) => 'Expérience ' + m[1]], [/^Project (\d+)$/, (m) => 'Projet ' + m[1]],
    [/^Last update: (.+) · Cover letter: (.+) · Answers used: (\d+)$/, (m) => 'Dernière mise à jour : ' + m[1] + ' · Lettre : ' + (m[2] === 'none' ? 'aucune' : m[2]) + ' · Réponses utilisées : ' + m[3]],
    [/^Updated (.+) · Personalisation (\d+)% · Similarity (\d+)%$/, (m) => 'Mise à jour ' + m[1] + ' · Personnalisation ' + m[2] + ' % · Similarité ' + m[3] + ' %'],
    [/^Cover Letter — (.+)$/, (m) => 'Lettre de motivation — ' + m[1]],
    [/^About (.+) and the role$/, (m) => 'À propos de ' + m[1] + ' et du poste'], [/^About (.+)$/, (m) => 'À propos de ' + m[1]],
    [/^Why are you interested in (.+) specifically\?$/, (m) => 'Pourquoi vous intéressez-vous à ' + m[1] + ' en particulier ?'],
    [/^(\d+)\. (.+)$/, (m) => m[1] + '. ' + t(m[2])],
    [/^Is there a (.+) product, campaign, project or value you genuinely like\?$/, (m) => 'Y a-t-il un produit, une campagne, un projet ou une valeur de ' + m[1] + ' que vous aimez vraiment ?'],
    [/^The offer values (.+) experience\. Besides your “(.+)” project, do you have any exposure that isn’t on your CV\?$/, (m) => 'L’offre valorise une expérience en ' + t(m[1]) + '. En plus de votre projet « ' + m[2] + ' », avez-vous une expérience qui n’est pas sur votre CV ?'],
    [/^The offer values (.+) experience\. Do you have any exposure that isn’t on your CV\?$/, (m) => 'L’offre valorise une expérience en ' + t(m[1]) + '. Avez-vous une expérience qui n’est pas sur votre CV ?'],
    [/^What attracts you most about the “(.+)” role\?$/, (m) => 'Qu’est-ce qui vous attire le plus dans le poste « ' + m[1] + ' » ?'],
    [/^Why I ask: (.+)$/, (m) => 'Pourquoi je demande : ' + t(m[1])],
    [/^I can read the offer, but I can’t know what genuinely attracts you to (.+)\.$/, (m) => 'Je peux lire l’offre, mais je ne peux pas savoir ce qui vous attire vraiment chez ' + m[1] + '.'],
    [/^This role isn’t in your desired positions, so I don’t know why it appeals to you\.$/, () => 'Ce poste ne fait pas partie de vos postes recherchés : je ne sais pas pourquoi il vous attire.'],
    [/^Motivation for (.+) — you already told me in a previous application\.$/, (m) => 'Motivation pour ' + m[1] + ' — vous me l’avez déjà dite dans une candidature précédente.'],
    [/^Which experience to highlight — (.+) is clearly the most relevant\.$/, (m) => 'Quelle expérience mettre en avant — ' + m[1] + ' est clairement la plus pertinente.'],
    [/^What I already know — so I’m not asking \((\d+)\)$/, (m) => 'Ce que je sais déjà — donc je ne demande pas (' + m[1] + ')'],
    [/^“I have enough information about your experience, but I need (\d+) quick answers? to make this application more personal\.”$/, (m) => '« J’ai assez d’informations sur votre expérience, mais il me faut ' + m[1] + ' réponse(s) rapide(s) pour rendre cette candidature plus personnelle. »'],
    [/^Answer in the language of your letter \(offer language: (\w+)\)\. Short answers are perfect\. Anything you skip is simply left out — never invented\.$/, (m) => 'Répondez dans la langue de la lettre (langue de l’offre : ' + t(m[1]) + '). Des réponses courtes suffisent. Ce que vous passez est simplement omis — jamais inventé.'],
    [/^Answer or tick “Skip” for: (.+)\. Skipping is fine — the letter just gets a little less personal\.$/, (m) => 'Répondez ou cochez « Passer » pour : ' + m[1].split(', ').map(t).join(', ') + '. Passer est possible — la lettre sera juste un peu moins personnelle.'],
    [/^Mentions (.+) specifically$/, (m) => 'Mentionne ' + m[1] + ' précisément'],
    [/^Uses your own motivation \((\d+) answers?\)$/, (m) => 'Utilise votre propre motivation (' + m[1] + ' réponse(s))'],
    [/^Low CV repetition \((\d+)%\)$/, (m) => 'Faible répétition du CV (' + m[1] + ' %)'], [/^Low portfolio repetition \((\d+)%\)$/, (m) => 'Faible répétition du portfolio (' + m[1] + ' %)'],
    [/^Low previous-letter similarity \((\d+)%\)$/, (m) => 'Faible similarité avec les lettres précédentes (' + m[1] + ' %)'],
    [/^Main experience used in (\d+) recent letters?$/, (m) => 'Expérience principale utilisée dans ' + m[1] + ' lettre(s) récente(s)'],
    [/^Concise \((\d+) words\)$/, (m) => 'Concise (' + m[1] + ' mots)'], [/^Buzzwords: (.+)$/, (m) => 'Mots creux : ' + m[1]], [/^Unverified figures: (.+)$/, (m) => 'Chiffres non vérifiés : ' + m[1]],
    [/^(\d+) answer\(s\) written in another language were left out — answer in (\w+) to include them$/, (m) => m[1] + ' réponse(s) dans une autre langue ont été écartées — répondez en ' + t(m[2]).toLowerCase() + ' pour les inclure'],
    [/^Previous-letter similarity \(closest: (.+)\)$/, (m) => 'Similarité avec les lettres précédentes (la plus proche : ' + m[1] + ')'],
    [/^Automatically regenerated (\d+) times?\.? to reduce repetition\.$/, (m) => 'Régénérée automatiquement ' + m[1] + ' fois pour réduire la répétition.'],
    [/^Automatically regenerated (\d+) times? to reduce repetition\.$/, (m) => 'Régénérée automatiquement ' + m[1] + ' fois pour réduire la répétition.'],
    [/^New version v(\d+) — (.+)\.$/, (m) => 'Nouvelle version v' + m[1] + ' — ' + t(m[2]) + '.'], [/^Edits saved as v(\d+)$/, (m) => 'Modifications enregistrées en v' + m[1]],
    [/^translated$/, () => 'traduite'], [/^Rewrite failed: (.+)$/, (m) => 'La réécriture a échoué : ' + m[1]],
    [/^A letter already exists for this mission \(v(\d+), (\w+)\)\. Generating again creates a new version\.$/, (m) => 'Une lettre existe déjà pour cette mission (v' + m[1] + ', ' + m[2] + '). Générer à nouveau crée une nouvelle version.'],
    [/^Follow up in 7 days \((.+)\)$/, (m) => 'Relancer dans 7 jours (' + m[1] + ')'],
    [/^Reminder set: follow up with (.+) on (.+)$/, (m) => 'Rappel créé : relancer ' + m[1] + ' le ' + m[2]], [/^Reminder set for (.+)$/, (m) => 'Rappel créé pour le ' + m[1]],
    [/^Follow-up reminder set for (.+)$/, (m) => 'Rappel de relance prévu le ' + m[1]],
    [/^Demo offer: the link opens a search on (.+), not a real listing\. Chic Career never submits anything for you\.$/, (m) => 'Offre de démo : le lien lance une recherche sur ' + m[1] + ', pas une vraie annonce. Chic Career n’envoie jamais rien à votre place.'],
    [/^Opens a search on (.+) — demo offers have no real listing$/, (m) => 'Lance une recherche sur ' + m[1] + ' — les offres de démo n’ont pas de vraie annonce'],
    [/^You already applied to this offer on (.+) \((.+)\)\.$/, (m) => 'Vous avez déjà postulé à cette offre le ' + m[1] + ' (' + t(m[2]) + ').'],
    [/^You already applied on (.+) — $/, (m) => 'Vous avez déjà postulé le ' + m[1] + ' — '], [/^open the application$/, () => 'ouvrir la candidature'],
    [/^You have (\d+) other applications? at (.+): (.+)\.$/, (m) => 'Vous avez ' + m[1] + ' autre(s) candidature(s) chez ' + m[2] + ' : ' + m[3] + '.'],
    [/^It fits your preferences: (.+)\.$/, (m) => 'Elle correspond à vos préférences : ' + m[1].split(' · ').map(t).join(' · ') + '.'],
    [/^Field: (.+)$/, (m) => 'Domaine : ' + m[1].split(', ').map(t).join(', ')],
    [/^(.+) fits your locations$/, (m) => t(m[1]) + ' correspond à vos lieux'], [/^(.+) experience$/, (m) => (D[m[1]] ? 'Expérience ' + lcFirst(D[m[1]]) : null)],
    [/^related experience in (.+)$/, (m) => 'expérience proche en ' + lcFirst(t(cap1(m[1])))],
    [/^tools mentioned in the offer, not on your CV$/, () => 'outils cités dans l’offre, absents de votre CV'],
    [/^only through an academic project — not professional experience$/, () => 'uniquement via un projet académique — pas d’expérience professionnelle'],
    [/^required in the offer — not found in your CV$/, () => 'exigé dans l’offre — absent de votre CV'], [/^nice-to-have — not found in your CV$/, () => 'apprécié — absent de votre CV'],
    [/^valued by the offer — not clearly demonstrated$/, () => 'valorisé par l’offre — pas clairement démontré'], [/^not in your preferred contracts$/, () => 'hors de vos contrats préférés'],
    [/^differs from your preferred duration$/, () => 'différente de votre durée préférée'], [/^outside your preferred locations$/, () => 'hors de vos lieux préférés'],
    [/^language requested by the offer$/, () => 'langue demandée par l’offre'],
    [/^Contract type \((.+)\)$/, (m) => 'Type de contrat (' + m[1] + ')'], [/^Duration (\d+) months$/, (m) => 'Durée ' + m[1] + ' mois'], [/^Location: (.+)$/, (m) => 'Lieu : ' + t(m[1])],
    [/^The offer asks for (.+) — all visible in your CV\.$/, (m) => 'L’offre demande ' + m[1] + ' — tout cela est visible dans votre CV.'],
    [/^Your (.+) experience at (.+) covers (.+?)( — with a measurable result \((.+)\))?\.$/, (m) => 'Votre expérience de ' + m[1] + ' chez ' + m[2] + ' couvre : ' + m[3] + (m[5] ? ' — avec un résultat mesurable (' + m[5] + ')' : '') + '.'],
    [/^Your project “(.+)” covers (.+?)( — with a measurable result \((.+)\))?\.$/, (m) => 'Votre projet « ' + m[1] + ' » couvre : ' + m[2] + (m[4] ? ' — avec un résultat mesurable (' + m[4] + ')' : '') + '.'],
    [/^Your portfolio shows “(.+)”, which supports the (.+) dimension\.$/, (m) => 'Votre portfolio présente « ' + m[1] + ' », qui appuie la dimension ' + lcFirst(t(cap1(m[2]))) + '.'],
    [/^Your personal motivation for (.+) isn’t recorded yet — the chicken will ask you\.$/, (m) => 'Votre motivation personnelle pour ' + m[1] + ' n’est pas encore connue — le poulet vous la demandera.'],
    [/^(.+) at (.+)$/, (m) => (m[0].length < 90 && /[A-Z]/.test(m[2][0]) && !/\d/.test(m[2]) ? m[1] + ' chez ' + m[2] : null)],
    [/^Needs: (.+)$/, (m) => 'Besoins : ' + m[1].split(', ').map(t).join(', ')],
    [/^“(.+)” The score is a recommendation, not a hiring prediction\.$/, (m) => '« ' + t(m[1]) + ' » Le score est une recommandation, pas une prédiction d’embauche.'],
    [/^What should we look at for (.+)\?$/, (m) => 'Que regarde-t-on pour ' + m[1] + ' ?'],
    [/^Shorter version saved as v(\d+) \((\d+) words, same facts\)$/, (m) => 'Version courte enregistrée en v' + m[1] + ' (' + m[2] + ' mots, mêmes faits)'],
    [/^Answer: (.+)$/, (m) => 'Répondre : ' + t(m[1])], [/^motivation company$/, () => 'motivation pour l’entreprise'], [/^personal connection$/, () => 'lien personnel'], [/^role attraction$/, () => 'attrait du poste'],
    [/^gap industry$/, () => 'écart sectoriel'], [/^career goal$/, () => 'objectif de carrière'], [/^highlight experience$/, () => 'expérience à mettre en avant'], [/^differentiator$/, () => 'ce qui vous distingue'],
    [/^(motivation company|personal connection|role attraction|gap industry|career goal|highlight experience|differentiator): (.+)$/, (m) => t(m[1]) + ' : ' + m[2]],
    [/^v(\d+) · personalisation (\d+)% · similarity to previous letters (\d+)%$/, (m) => 'v' + m[1] + ' · personnalisation ' + m[2] + ' % · similarité avec les lettres précédentes ' + m[3] + ' %'],
    [/^Why (.+) rather than another company in this sector\?$/, (m) => 'Pourquoi ' + m[1] + ' plutôt qu’une autre entreprise du secteur ?'],
    [/^What do you know about (.+) and its products\?$/, (m) => 'Que savez-vous de ' + m[1] + ' et de ses produits ?'],
    [/^How would you approach this task: “(.+)”\?$/, (m) => 'Comment aborderiez-vous cette mission : « ' + m[1] + ' » ?'],
    [/^Tell us about a time you used (.+)\.$/, (m) => 'Racontez une situation où vous avez mobilisé : ' + lcFirst(t(cap1(m[1]))) + '.'],
    [/^At (.+), what was your main impact\?$/, (m) => 'Chez ' + m[1] + ', quel a été votre impact principal ?'],
    [/^Walk us through your project “(.+)”: your role, method and result\.$/, (m) => 'Présentez votre projet « ' + m[1] + ' » : votre rôle, votre méthode, le résultat.'],
    [/^The role requires “(.+)” — how would you get up to speed\?$/, (m) => 'Le poste demande « ' + t(m[1]) + ' » : comment comptez-vous monter en compétence ?'],
    [/^Academic project: (.+)$/, (m) => 'Projet académique : ' + m[1]],
    [/^(\d+) words\. $/, (m) => m[1] + ' mots. '], [/^(\d+) words\.$/, (m) => m[1] + ' mots.'],
    [/^Refresh done: (\d+) new · (\d+) updated · (\d+) expired · (\d+) duplicates merged · (\d+) already seen\.$/, (m) => 'Actualisation terminée : ' + m[1] + ' nouvelle(s) · ' + m[2] + ' mise(s) à jour · ' + m[3] + ' expirée(s) · ' + m[4] + ' doublon(s) fusionné(s) · ' + m[5] + ' déjà vue(s).'],
    [/^Daily refresh: (\d+) new offers?, (\d+) updated, (\d+) expired \(demo feed\)\.$/, (m) => 'Actualisation quotidienne : ' + m[1] + ' nouvelle(s) offre(s), ' + m[2] + ' mise(s) à jour, ' + m[3] + ' expirée(s) (flux de démo).'],
    [/^Preferred source: (.+)$/, (m) => 'Source préférée : ' + m[1]],
    [/^(.+) → (To Apply|Applied|Follow-up|Interview|Final Round|Offer|Rejected|Withdrawn)$/, (m) => m[1] + ' → ' + t(m[2])],
    [/^\+(\d+) XP — nice work! 🐔$/, (m) => '+' + m[1] + ' XP — bien joué ! 🐔'],
    [/^LEVEL UP! Your chicken is now a (.+) (.+)$/, (m) => 'NIVEAU SUPÉRIEUR ! Votre poulet est maintenant ' + t(m[1]) + ' ' + m[2]],
    [/^\((\d+) KB used\)\. There is no account and no server\.$/, (m) => '(' + m[1] + ' Ko utilisés). Il n’y a ni compte ni serveur.'],
    [/^What the chicken knows, assembled from your default CV \((.+)\), your profile and your portfolio\. Edit the sources to change it\.$/, (m) => 'Ce que le poulet sait, rassemblé depuis votre CV par défaut (' + (m[1] === 'none' ? 'aucun' : m[1]) + '), votre profil et votre portfolio. Modifiez les sources pour le changer.'],
    [/^Skill families: (.+)$/, (m) => 'Familles de compétences : ' + m[1].split(', ').map(t).join(', ')], [/^Industries: (.+)$/, (m) => 'Secteurs : ' + m[1].split(', ').map(t).join(', ')],
    [/^Job titles: (.+)$/, (m) => 'Intitulés de poste : ' + m[1]],
    [/^It was used in (\d+) application\(s\); they will keep the CV name but its data will be gone\.$/, (m) => 'Il a été utilisé dans ' + m[1] + ' candidature(s) ; elles garderont le nom du CV mais ses données seront supprimées.'],
    [/^CV data — (.+)$/, (m) => 'Données du CV — ' + m[1]], [/^Review what we extracted — (.+)$/, (m) => 'Vérifiez ce que nous avons extrait — ' + m[1]],
    [/^Selected: (.+) \((\d+) KB\)$/, (m) => 'Sélectionné : ' + m[1] + ' (' + m[2] + ' Ko)'],
    [/^Unsupported format “(.+)”\. Please upload a PDF or DOCX CV\.$/, (m) => 'Format non pris en charge « ' + m[1] + ' ». Importez un CV PDF ou DOCX.'],
    [/^The (\w+) URL doesn’t look valid — it should start with https:\/\/$/, (m) => 'L’URL ' + m[1] + ' semble invalide — elle doit commencer par https://'],
    [/^The (\w+) link doesn’t look valid — it should start with https:\/\/$/, (m) => 'Le lien ' + m[1] + ' semble invalide — il doit commencer par https://'],
    [/^The link for “(.+)” doesn’t look valid\.$/, (m) => 'Le lien de « ' + m[1] + ' » semble invalide.'],
    [/^This removes (.+) and its reminders\. Cover letters are kept\.$/, (m) => 'Cela supprime ' + m[1] + ' et ses rappels. Les lettres sont conservées.'],
    [/^Older versions \((\d+)\)$/, (m) => 'Anciennes versions (' + m[1] + ')'], [/^Previous versions \((\d+)\)$/, (m) => 'Versions précédentes (' + m[1] + ')'],
    [/^Current \(v(\d+)\)$/, (m) => 'Actuelle (v' + m[1] + ')'],
    [/^Updated on (.+)$/, (m) => 'Mise à jour le ' + m[1]],
    [/^(.+) — (.+) \((\w+)\)$/, null]
  ].filter((p) => p[1]);

  const MOODS = { curious: 'curieux', nervous: 'nerveux', excited: 'enthousiaste', optimistic: 'optimiste', thoughtful: 'pensif', determined: 'déterminé', confident: 'confiant', patient: 'patient', motivated: 'motivé', celebrating: 'en fête', happy: 'content' };
  function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function lcFirst(s) { return /^[A-Z]{2,}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1); }

  /* ------------------------------------------------------------ translation engine */
  const cache = new Map();
  function trCore(s) {
    if (!s) return null;
    if (cache.has(s)) return cache.get(s);
    let out = null;
    if (Object.prototype.hasOwnProperty.call(D, s)) out = D[s];
    if (out === null) for (const [re, fn] of P) { const m = s.match(re); if (m) { const r = fn(m); if (r !== null && r !== undefined && r !== s) { out = r; break; } } }
    if (out === null) {
      // icon / symbol prefix and arrow suffix
      const m = s.match(/^([^A-Za-zÀ-ÿ0-9“"«(]+)?(.*?)(\s*[→↗—:·]+)?$/u);
      if (m && (m[1] || m[3]) && m[2]) { const inner = trCore(m[2]); if (inner !== null) out = (m[1] || '') + inner + (m[3] || ''); }
    }
    if (out === null) { const m = s.match(/^“(.+)”$/); if (m) { const inner = trCore(m[1]); if (inner !== null) out = '« ' + inner + ' »'; } }
    if (out === null) for (const sep of [' · ', ' — ']) {
      if (s.indexOf(sep) === -1) continue;
      let changed = false;
      const parts = s.split(sep).map((p) => { const r = p ? trCore(p.trim()) : null; if (r !== null) { changed = true; return p.replace(p.trim(), r); } return p; });
      if (changed) { out = parts.join(sep); break; }
    }
    cache.set(s, out);
    return out;
  }
  function translateString(raw) {
    const m = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!m[2] || !/[A-Za-z]/.test(m[2])) return null;
    const r = trCore(m[2]);
    return r === null ? null : m[1] + r + m[3];
  }

  const SKIP_SEL = 'textarea, pre, script, style, code, .letter-view, .raw-text, [data-noi18n], [contenteditable="true"]';
  const ATTRS = ['placeholder', 'aria-label', 'title'];
  const origText = new WeakMap();   // Text node → English original
  const lastSet = new WeakMap();    // Text node → value we wrote
  const origAttr = new WeakMap();   // Element → { attr: English }

  function translateTextNode(n) {
    const v = n.nodeValue;
    if (lastSet.get(n) === v) return;
    const p = n.parentElement;
    if (!p || p.closest(SKIP_SEL)) return;
    const r = translateString(v);
    origText.set(n, v);
    if (r !== null && r !== v) { lastSet.set(n, r); n.nodeValue = r; } else lastSet.set(n, v);
  }
  function translateAttrs(el) {
    if (el.closest && el.closest('script, style')) return;
    ATTRS.forEach((a) => {
      if (!el.hasAttribute || !el.hasAttribute(a)) return;
      const v = el.getAttribute(a);
      const store = origAttr.get(el) || {};
      if (store['_set_' + a] === v) return;
      const r = translateString(v);
      store[a] = v;
      if (r !== null && r !== v) { store['_set_' + a] = r; el.setAttribute(a, r); } else store['_set_' + a] = v;
      origAttr.set(el, store);
    });
  }
  function translateTree(root) {
    if (lang !== 'fr' || !root) return;
    if (root.nodeType === 3) { translateTextNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; const list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(translateTextNode);
    if (root.nodeType === 1) translateAttrs(root);
    if (root.querySelectorAll) root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(translateAttrs);
  }
  function restoreEnglish(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) { if (origText.has(n) && lastSet.get(n) === n.nodeValue) { n.nodeValue = origText.get(n); lastSet.delete(n); } }
    root.querySelectorAll('[placeholder],[aria-label],[title]').forEach((el) => {
      const s = origAttr.get(el); if (!s) return;
      ATTRS.forEach((a) => { if (s[a] !== undefined && el.getAttribute(a) === s['_set_' + a]) el.setAttribute(a, s[a]); });
      origAttr.delete(el);
    });
  }

  let observer = null;
  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((muts) => {
      if (lang !== 'fr') return;
      muts.forEach((m) => {
        if (m.type === 'childList') m.addedNodes.forEach(translateTree);
        else if (m.type === 'characterData') translateTextNode(m.target);
        else if (m.type === 'attributes') translateAttrs(m.target);
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  function setLang(l) {
    if (l !== 'fr' && l !== 'en') return;
    const prev = lang;
    lang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* ignore */ }
    document.documentElement.lang = l;
    if (prev === 'fr' && l === 'en') restoreEnglish(document.body);
    if (MT.app && MT.app.render) MT.app.render();
    if (l === 'fr') translateTree(document.body);
    document.querySelectorAll('[data-lang-pick]').forEach((s) => { s.value = l; });
    document.title = l === 'fr' ? document.title.replace(/^(.+?) · /, (m0, a) => (trCore(a) || a) + ' · ') : document.title;
  }

  function init() {
    document.documentElement.lang = lang;
    startObserver();
    if (lang === 'fr') translateTree(document.body);
  }

  MT.i18n = {
    get lang() { return lang; },
    locale: () => (lang === 'fr' ? 'fr-FR' : 'en-GB'),
    t, setLang, init, translateTree, _trCore: trCore, _dict: D
  };
})(window.MT = window.MT || {});
