/* =====================================================================
   BUS SEAT CHALLENGE — TRANSLATIONS (English is the source language)
   phrases    : exact English UI phrases → French (matched as whole words,
                longest first, so templates with numbers still translate)
   passengers : French name / explanation per passenger type id
   levels     : French stop name / skill / tip per level id
   To add a language, add another block with the same shape and list it
   in LANGS in script.js.
   ===================================================================== */
'use strict';

window.BSC_I18N = {
  fr: {
    phrases: {
      // menu
      'TRAIN YOUR': 'ENTRAÎNE TON', 'REFLEX': 'RÉFLEXE', 'THINKING': 'RAISONNEMENT',
      'START GAME': 'JOUER', 'DAILY CHALLENGE': 'DÉFI DU JOUR', 'HOW TO PLAY': 'COMMENT JOUER',
      'SCORE': 'SCORES', 'SETTINGS': 'RÉGLAGES', 'ROUTE MAP': 'PLAN DE LA LIGNE', 'HIGH SCORES': 'MEILLEURS SCORES',
      'RESET PROGRESS': 'TOUT EFFACER', 'CLUE BOOK': 'LIVRE DES INDICES',
      'In this game, need levels are a guide for the scenarios — not a ranking of people.':
        'Dans ce jeu, les niveaux de besoin guident les situations — ce n\'est pas un classement des personnes.',
      'HI-SCORE': 'RECORD', 'BEST STOP': 'MEILLEUR ARRÊT', 'NEW PASSENGER? START WITH STOP 01!': 'NOUVEAU PASSAGER ? COMMENCE À L\'ARRÊT 01 !',
      // settings
      'SOUND': 'SON', 'MUSIC': 'MUSIQUE', 'HIGH CONTRAST': 'CONTRASTE ÉLEVÉ', 'REDUCED MOTION': 'MOUVEMENTS RÉDUITS',
      'Arcade sound effects.': 'Effets sonores d\'arcade.', 'Chiptune background loop.': 'Musique chiptune en boucle.',
      'Stronger colours, dimmer background passengers.': 'Couleurs plus fortes, passagers du décor atténués.',
      'No shake, no scrolling scenery, calmer effects.': 'Pas de secousses ni de décor qui défile, effets plus calmes.',
      'ON': 'OUI', 'OFF': 'NON',
      // route map / scores
      'FINAL STOP': 'TERMINUS', 'STOP': 'ARRÊT', 'NEW': 'NOUVEAU', 'LOCKED': 'VERROUILLÉ',
      'passengers': 'passagers', 'seats': 'places',
      'BEST RUN': 'MEILLEURE PARTIE', 'FURTHEST STOP': 'ARRÊT LE PLUS LOIN', 'BEST COMBO': 'MEILLEUR COMBO',
      'BEST REACTION': 'MEILLEURE RÉACTION', 'TODAY\'S BEST': 'RECORD DU JOUR', 'ACCURACY': 'PRÉCISION',
      'NAME': 'NOM', 'BEST': 'RECORD', 'STARS': 'ÉTOILES', 'Games played:': 'Parties jouées :',
      'Reset all progress, scores and unlocked stops?': 'Effacer toute la progression, les scores et les arrêts débloqués ?',
      // clue book
      'CAN STAND': 'PEUT RESTER DEBOUT', 'SOME NEED': 'BESOIN MODÉRÉ', 'HIGH NEED': 'BESOIN ÉLEVÉ',
      'NEEDS IT MOST': 'EN A LE PLUS BESOIN', 'WHEELCHAIR SPACE': 'ESPACE FAUTEUIL', 'DECOY': 'LEURRE',
      // HUD & prompts
      'WHO GETS THE SEAT?': 'QUI PREND LA PLACE ?', 'OBSERVE': 'OBSERVE', 'THINK': 'RÉFLÉCHIS', 'CLICK': 'CLIQUE',
      'DAILY': 'DÉFI', 'PASSENGERS BOARDING…': 'LES PASSAGERS MONTENT…',
      'WHERE SHOULD THE NEW PASSENGER GO?': 'OÙ DOIT ALLER LE NOUVEAU PASSAGER ?',
      'NOW! TAP THE SPARKLE!': 'MAINTENANT ! TOUCHE L\'ÉTINCELLE !',
      'GET READY… TAP THE ✨ SPARKLE!': 'PRÊT… TOUCHE L\'ÉTINCELLE ✨ !',
      'WHO GETS THE ♿ WHEELCHAIR SPACE?': 'QUI VA DANS L\'ESPACE ♿ FAUTEUIL ?',
      'WHO GETS THE ★ PRIORITY SEAT?': 'QUI PREND LA PLACE ★ PRIORITAIRE ?',
      'WHO GETS THE ★ FREE SEAT?': 'QUI PREND LA PLACE ★ LIBRE ?',
      'SPOTS': 'PLACES', 'FROM MEMORY:': 'DE MÉMOIRE :',
      'FLASH ROUND! LOOK FAST!': 'MANCHE FLASH ! REGARDE VITE !',
      'LOOK! MEMORIZE WHO NEEDS A SEAT!': 'REGARDE ! MÉMORISE QUI A BESOIN D\'UNE PLACE !',
      'PERFECT BUS SENSE!': 'SENS DU BUS PARFAIT !', 'NEXT STOP': 'PROCHAIN ARRÊT',
      'FLASH! LOOK!': 'FLASH ! REGARDE !', 'LOOK!': 'REGARDE !', 'WHO WAS IT? REMEMBER!': 'QUI ÉTAIT-CE ? SOUVIENS-TOI !',
      'WAIT FOR IT…': 'ATTENDS…',
      // feedback
      'NICE!': 'BIEN JOUÉ !', 'GOOD EYES!': 'BON ŒIL !', 'FAST THINKING!': 'ESPRIT VIF !', 'PERFECT!': 'PARFAIT !',
      'QUICK REFLEX!': 'SUPER RÉFLEXE !', 'GOOD CALL!': 'BON CHOIX !', 'LIGHTNING FAST!': 'RAPIDE COMME L\'ÉCLAIR !',
      'DID YOU EVEN BLINK?': 'TU AS CLIGNÉ DES YEUX ?', 'PERFECT REACTION!': 'RÉACTION PARFAITE !',
      'LOOK AGAIN!': 'REGARDE MIEUX !', 'OOPS!': 'OUPS !', 'NOT THIS ONE!': 'PAS CELUI-LÀ !', 'TOO SLOW!': 'TROP LENT !',
      'EAGLE EYES!': 'ŒIL DE LYNX !', 'GOOD OBSERVATION!': 'BELLE OBSERVATION !',
      'PERFECT COMBO': 'COMBO PARFAIT', 'points': 'points',
      'More than one right answer here — good call!': 'Plusieurs bonnes réponses ici — bon choix !',
      'Tap the sparkling passenger!': 'Touche le passager qui brille !',
      '♿ They need the wheelchair space, not a seat.': '♿ Il lui faut l\'espace fauteuil, pas un siège.',
      '♿ That space is for the wheelchair user.': '♿ Cet espace est pour la personne en fauteuil.',
      'Look closer! Their look-alike had the clue.': 'Regarde mieux ! C\'est son sosie qui avait l\'indice.',
      'needed it more.': 'en avait plus besoin.', 'Someone': 'Quelqu\'un',
      '♿ The wheelchair space — safe & secure.': '♿ L\'espace fauteuil — sûr et sécurisé.',
      '♿ Wheelchair users need the wheelchair space.': '♿ Les personnes en fauteuil vont dans l\'espace fauteuil.',
      '♿ Keep the wheelchair space free.': '♿ Laisse l\'espace fauteuil libre.',
      'Priority seat: close to the door, made for them.': 'Place prioritaire : près de la porte, faite pour eux.',
      'Priority seats exist for them — closer to the door.': 'Les places prioritaires sont pour eux — plus près de la porte.',
      'Any seat works for them.': 'N\'importe quelle place convient.',
      'Normal seat — priority seats stay free for those in need.': 'Place normale — les prioritaires restent libres pour ceux qui en ont besoin.',
      'Keep priority seats free for people who need them.': 'Laisse les places prioritaires à ceux qui en ont besoin.',
      // modals
      'Passengers': 'Passagers', 'Time per decision': 'Temps par décision', 'Situations': 'Situations',
      'Today\'s best': 'Record du jour', 'GO!': 'C\'EST PARTI !',
      'YOUR PERFORMANCE': 'TA PERFORMANCE', 'Reaction speed': 'Vitesse de réaction', 'Decision making': 'Prise de décision',
      'Average reaction': 'Réaction moyenne', 'Best reaction': 'Meilleure réaction', 'Highest combo': 'Meilleur combo',
      'Correct decisions': 'Bonnes décisions', 'Highest stop': 'Arrêt atteint',
      'BUS STOP CLEARED!': 'ARRÊT VALIDÉ !', 'YOU\'RE GETTING FASTER!': 'TU DEVIENS PLUS RAPIDE !',
      'NEW STOP RECORD!': 'NOUVEAU RECORD D\'ARRÊT !', 'Stop score': 'Score de l\'arrêt', 'Clear bonus': 'Bonus de fin',
      'Accuracy': 'Précision', 'Avg reaction': 'Réaction moy.', 'Hearts': 'Cœurs', 'Run score': 'Score total', 'Next:': 'Suivant :',
      'GAME OVER': 'FIN DE PARTIE', 'NEW HIGH SCORE!': 'NOUVEAU RECORD !', 'High score:': 'Record :',
      'TRY AGAIN': 'REJOUER', 'BACK TO MENU': 'RETOUR AU MENU',
      'FINAL STOP CLEARED': 'TERMINUS ATTEINT', 'MASTER OF THE BUS!': 'MAÎTRE DU BUS !',
      'PERFECT BUS SENSE. You looked, thought and reacted all the way to the last stop.':
        'SENS DU BUS PARFAIT. Tu as observé, réfléchi et réagi jusqu\'au terminus.',
      'TRY THE DAILY CHALLENGE': 'ESSAIE LE DÉFI DU JOUR', 'PLAY AGAIN': 'REJOUER',
      'DAILY COMPLETE!': 'DÉFI TERMINÉ !', 'NEW TODAY\'S BEST!': 'NOUVEAU RECORD DU JOUR !',
      'Same bus for everyone today. Come back tomorrow for a new one!': 'Le même bus pour tout le monde aujourd\'hui. Reviens demain pour un nouveau !',
      'PAUSED': 'PAUSE', 'The scene is hidden while paused — no peeking!': 'La scène est cachée pendant la pause — pas de triche !',
      'RESUME': 'REPRENDRE', 'QUIT TO MENU': 'QUITTER', 'MENU': 'MENU', 'LANGUAGE': 'LANGUE'
    },
    passengers: {
      young: ['Jeune adulte', 'Peut rester debout sans souci.'],
      student: ['Étudiant·e', 'Peut rester debout sans souci.'],
      worker: ['Travailleur·se', 'Peut rester debout sans souci.'],
      tourist: ['Touriste', 'Peut rester debout sans souci.'],
      phone: ['Accro au téléphone', 'Occupé·e, mais peut rester debout.'],
      headphones: ['Fan de musique', 'Peut rester debout (et danser).'],
      elderly: ['Personne âgée', 'Les personnes âgées peuvent perdre l\'équilibre.'],
      elderlyCane: ['Âgée, avec canne', 'Canne : l\'équilibre est plus difficile.'],
      pregnant: ['Enceinte', 'La grossesse rend la station debout fatigante et risquée.'],
      baby: ['Avec un bébé', 'A besoin de ses deux bras pour le bébé.'],
      badge: ['Badge « bébé à bord »', 'Le badge rose = début de grossesse. ŒIL DE LYNX !'],
      lanyard: ['Cordon tournesol', 'Le cordon tournesol = un handicap invisible.'],
      crutches: ['Avec béquilles', 'Béquilles : rester debout est dangereux.'],
      legCast: ['Jambe plâtrée', 'Jambe blessée : ne peut pas rester debout.'],
      legBrace: ['Attelle de jambe', 'Petite attelle et marche lente. ŒIL DE LYNX !'],
      heavyBags: ['Sacs lourds', 'Sacs lourds — un besoin, mais moins urgent.'],
      tired: ['Épuisé·e', 'Très fatigué·e — un besoin, mais moins urgent.'],
      wheelchair: ['En fauteuil roulant', 'A besoin de l\'espace ♿ fauteuil, pas d\'un siège.'],
      umbrella: ['Parapluie plié', 'C\'est un parapluie, pas une canne !'],
      lightBag: ['Petit sac de courses', 'Un sac léger — peut rester debout.'],
      petCarrier: ['Caisse de transport (chat)', 'Un chat, pas un bébé. Peut rester debout.']
    },
    levels: {
      1: ['PREMIER TRAJET', 'RECONNAISSANCE', 'Une place est libre ! Touche le passager qui en a le plus besoin.'],
      2: ['MATIN CHARGÉ', 'OBSERVATION', 'Cherche les indices : canne, béquilles, bébé, ventre rond. Deux personnes dans le besoin ? Les deux réponses sont bonnes !'],
      3: ['HEURE DE POINTE', 'PRIORITÉS', 'Plusieurs personnes dans le besoin ? Aide celle qui en a le PLUS besoin. Les personnes en fauteuil vont dans l\'espace ♿, pas sur un siège. Nouveau : manches OÙ DOIT-IL S\'ASSEOIR ?'],
      4: ['VOIE RAPIDE', 'VITESSE', 'REGARDE → RÉFLÉCHIS → CLIQUE, vite ! Moins d\'une seconde = +100 de bonus. Nouveau : CLIC ÉCLAIR — touche le passager qui brille !'],
      5: ['DISTRACTION CITY', 'CONCENTRATION', 'Ignore le bruit ! Un parapluie n\'est pas une canne. Une caisse à chat n\'est pas un bébé. Un petit sac n\'est pas un bagage lourd.'],
      6: ['EXPRESS MÉMOIRE', 'MÉMOIRE', 'REGARDE ! … puis la lumière s\'éteint. Souviens-toi OÙ se trouvait la personne dans le besoin.'],
      7: ['PLACE DES PRIORITÉS', 'PRIORITÉS MULTIPLES', 'Deux places, beaucoup de besoins. Indices cachés : un badge rose « bébé à bord » ou un cordon tournesol signifie qu\'il faut s\'asseoir. Pas leur sosie !'],
      8: ['MARCHÉ EN MOUVEMENT', 'SUIVI', 'Les passagers bougent et montent en retard. Suis-les ! Quelqu\'un qui marche lentement porte peut-être une petite attelle.'],
      9: ['GARE DU CHAOS', 'MULTITÂCHE', 'Tout à la fois ! Reste calme : REGARDE → RÉFLÉCHIS → CLIQUE.'],
      10: ['MAÎTRE DU BUS', 'TOUT', 'Dernier arrêt. Très peu de temps, beaucoup de monde, des indices cachés. Prouve que tu es le MAÎTRE DU BUS !'],
      daily: ['DÉFI DU JOUR', 'DÉFI', '10 passagers · 4 places · 8 secondes · 3 situations. Le même bus pour tout le monde aujourd\'hui !']
    }
  }
};
