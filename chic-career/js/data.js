/* ==========================================================================
   CHIC CAREER — data.js
   DEMO DATA ONLY. Every company, offer and person below is fictional and
   exists so the prototype can be tested end to end. None of it is a live
   listing from LinkedIn, Indeed or Welcome to the Jungle.
   ========================================================================== */
(function (MT) {
  'use strict';

  /* ------------------------------------------------------------------
     Demo offer catalogue. The source adapters (adapters.js) serialise
     these into each platform's own raw shape; the Job Data Service then
     normalises and de-duplicates them — the same pipeline a real feed
     would go through. `listings` = which platforms carry the offer.
     ------------------------------------------------------------------ */
  const OFFERS = [
    {
      key: 'pepite-acdp', title: 'Assistant(e) Chef de Produit Marketing', company: 'Pépite Foods',
      companyAbout: 'Pépite Foods est une marque française de snacks salés et sucrés distribuée en grande distribution. L’équipe marketing (12 personnes) pilote une gamme de 40 références et prépare le lancement d’une nouvelle ligne de snacks aux légumineuses.',
      city: 'Paris', workMode: 'hybrid', contract: 'Stage', duration: 6, salary: { min: 1300, max: 1400 }, language: 'fr',
      fields: ['Marketing', 'Product', 'Brand'], industry: 'fmcg',
      description: 'Au sein de l’équipe marketing, vous accompagnez la cheffe de produit sur la gamme snacks. Vous participez au lancement de la nouvelle gamme aux légumineuses, de l’analyse des tendances consommateurs jusqu’à l’activation en magasin et sur les réseaux sociaux.',
      responsibilities: ['Participer au lancement de la nouvelle gamme (rétroplanning, brief agences, packaging)', 'Analyser les données de marché et les panels distributeurs', 'Coordonner les contenus digitaux et les réseaux sociaux de la marque avec l’agence', 'Préparer les supports de présentation pour la force de vente', 'Assurer une veille concurrentielle sur le rayon snacking'],
      required: ['product-marketing', 'product-launch', 'market-research', 'project-management', 'social-media'],
      preferred: ['trade-marketing', 'content-creation', 'data-analysis'],
      tools: ['Excel', 'PowerPoint', 'Canva', 'Nielsen'], languages: ['French', 'English'],
      qualifications: ['École de commerce ou université, spécialisation marketing (Bac+4/5)', 'Une première expérience en marketing produit ou en grande consommation (FMCG) est un plus'],
      experience: 'Première expérience en marketing (stage ou alternance)', industryRequired: 'fmcg',
      listings: [{ src: 'wttj', daysAgo: 0 }, { src: 'linkedin', daysAgo: 0, title: 'Assistant Chef de Produit Marketing (H/F) - Stage' }, { src: 'indeed', daysAgo: 0, title: 'Stage - Assistant(e) chef de produit marketing H/F' }]
    },
    {
      key: 'brume-social', title: 'Social Media & Content Intern', company: 'Atelier Brume',
      companyAbout: 'Atelier Brume est une marque parisienne de prêt-à-porter éco-responsable fabriqué au Portugal. La marque a construit sa communauté sur Instagram autour de la transparence sur ses ateliers.',
      city: 'Paris', workMode: 'hybrid', contract: 'Stage', duration: 6, salary: { min: 1000, max: 1200 }, language: 'fr',
      fields: ['Social Media', 'Content', 'Digital Marketing'], industry: 'fashion',
      description: 'Vous rejoignez l’équipe brand & content pour faire vivre les réseaux sociaux de la marque : idées de contenus, tournages, publication et analyse des performances.',
      responsibilities: ['Proposer et produire des contenus Instagram et TikTok', 'Gérer le calendrier éditorial', 'Animer la communauté et répondre aux messages', 'Suivre les KPIs et proposer des optimisations', 'Participer aux collaborations avec des créateurs'],
      required: ['social-media', 'content-creation', 'community'], preferred: ['influence', 'video', 'data-analysis'],
      tools: ['Canva', 'CapCut', 'Meta Business Suite'], languages: ['French'],
      qualifications: ['Bac+3 à Bac+5 en communication ou marketing', 'Sensibilité mode et mode responsable'],
      experience: 'Une première expérience sur les réseaux sociaux d’une marque',
      listings: [{ src: 'linkedin', daysAgo: 12 }]
    },
    {
      key: 'gustave-growth', title: 'Growth Marketing Intern', company: 'Gustave & Co',
      companyAbout: 'Gustave & Co is a Lyon-based app that connects office teams with local caterers. The company operates in 4 French cities and is preparing its expansion to Bordeaux.',
      city: 'Lyon', workMode: 'hybrid', contract: 'Stage', duration: 6, salary: { min: 1200, max: 1200 }, language: 'en',
      fields: ['Growth', 'Digital Marketing', 'CRM'], industry: 'food-service',
      description: 'Join a 6-person growth team. You will run acquisition and retention experiments across email, paid social and SEO, and help us launch our new city.',
      responsibilities: ['Plan and run A/B tests on landing pages and emails', 'Build lifecycle email campaigns', 'Support paid social campaigns', 'Track funnel metrics in weekly dashboards', 'Help prepare the Bordeaux launch'],
      required: ['growth', 'crm', 'data-analysis'], preferred: ['paid-media', 'seo', 'copywriting'],
      tools: ['HubSpot', 'Google Analytics 4', 'Google Sheets', 'Notion'], languages: ['English', 'French'],
      qualifications: ['Business school or university student', 'Comfortable with numbers'],
      experience: 'Previous marketing internship appreciated',
      listings: [{ src: 'wttj', daysAgo: 19 }, { src: 'linkedin', daysAgo: 18, title: 'Growth Marketing Intern (6 months)' }]
    },
    {
      key: 'mediaroll-content', title: 'Chargé(e) de contenu web — Alternance', company: 'Médiaroll',
      companyAbout: 'Médiaroll édite trois magazines en ligne consacrés au voyage, à la cuisine et à la maison, avec 4 millions de visiteurs mensuels.',
      city: 'Paris', workMode: 'onsite', contract: 'Alternance', duration: 12, salary: null, language: 'fr',
      fields: ['Content', 'SEO / SEA'], industry: 'media',
      description: 'En alternance au sein de la rédaction web, vous rédigez et optimisez des articles pour nos trois magazines et participez à la stratégie SEO.',
      responsibilities: ['Rédiger des articles optimisés SEO', 'Mettre à jour les contenus existants', 'Suivre les positions et le trafic', 'Proposer des sujets tendances'],
      required: ['copywriting', 'seo', 'content-creation'], preferred: ['web-analytics', 'social-media'],
      tools: ['WordPress', 'Google Search Console', 'Semrush'], languages: ['French'],
      qualifications: ['Excellente orthographe', 'Bac+3 minimum'], experience: 'Débutant accepté',
      listings: [{ src: 'indeed', daysAgo: 28 }]
    },
    {
      key: 'nordlys-brand', title: 'Brand Marketing Intern', company: 'Nordlys Cosmetics',
      companyAbout: 'Nordlys Cosmetics est une marque de soins inspirée des rituels scandinaves, vendue en pharmacie et en ligne. Elle mise sur des formules courtes et des emballages rechargeables.',
      city: 'Paris', workMode: 'hybrid', contract: 'Stage', duration: 6, salary: { min: 1200, max: 1300 }, language: 'fr',
      fields: ['Brand', 'Marketing', 'Communication'], industry: 'beauty',
      description: 'Vous accompagnez la Brand Manager sur la plateforme de marque, les campagnes saisonnières et les relations avec les créateurs de contenu.',
      responsibilities: ['Participer aux campagnes de marque saisonnières', 'Coordonner les envois aux créateurs (seeding)', 'Suivre la cohérence de la marque sur tous les supports', 'Analyser les retours consommateurs'],
      required: ['brand', 'influence', 'communication'], preferred: ['content-creation', 'market-research', 'product-launch'],
      tools: ['Canva', 'Excel', 'PowerPoint'], languages: ['French', 'English'],
      qualifications: ['Formation école de commerce', 'Intérêt pour la beauté'], experience: 'Une première expérience en marque ou en communication',
      listings: [{ src: 'wttj', daysAgo: 15 }]
    },
    {
      key: 'pixelune-pmm', title: 'Product Marketing Intern', company: 'Pixelune',
      companyAbout: 'Pixelune builds a scheduling tool for photographers and creative studios, used by 9,000 studios across Europe. The team is fully remote-friendly with an office in Lyon.',
      city: 'Lyon', workMode: 'remote', contract: 'Stage', duration: 6, salary: { min: 1400, max: 1500 }, language: 'en',
      fields: ['Product', 'Marketing', 'Content'], industry: 'tech',
      description: 'Work with our Head of Product Marketing on feature launches, positioning and customer stories. You will turn product updates into clear messages for creatives.',
      responsibilities: ['Write launch messaging and release notes', 'Interview customers and turn insights into stories', 'Create launch assets with the design team', 'Analyse adoption of new features'],
      required: ['product-marketing', 'product-launch', 'copywriting'], preferred: ['market-research', 'content-creation', 'data-analysis'],
      tools: ['Notion', 'Figma', 'HubSpot'], languages: ['English'],
      qualifications: ['Excellent written English', 'Curiosity for SaaS'], experience: 'Previous marketing or content internship',
      listings: [{ src: 'linkedin', daysAgo: 6 }]
    },
    {
      key: 'cycles-ecom', title: 'Alternance Marketing Digital & E-commerce', company: 'Cycles Rhône',
      companyAbout: 'Cycles Rhône conçoit et vend des vélos urbains et des accessoires, en ligne et dans deux boutiques lyonnaises.',
      city: 'Lyon', workMode: 'onsite', contract: 'Alternance', duration: 12, salary: null, language: 'fr',
      fields: ['E-commerce', 'Digital Marketing', 'SEO / SEA'], industry: 'mobility',
      description: 'Rattaché(e) au responsable e-commerce, vous animez le site marchand et les campagnes digitales de la marque.',
      responsibilities: ['Mettre à jour le site Shopify et les fiches produits', 'Préparer les newsletters', 'Suivre les campagnes Google Ads', 'Analyser les ventes en ligne'],
      required: ['ecommerce', 'crm', 'sea'], preferred: ['seo', 'web-analytics', 'graphic-design'],
      tools: ['Shopify', 'Google Ads', 'Brevo', 'Canva'], languages: ['French'],
      qualifications: ['Bac+3 à Bac+5 en marketing digital'], experience: 'Première expérience e-commerce appréciée',
      listings: [{ src: 'indeed', daysAgo: 2 }, { src: 'wttj', daysAgo: 3, title: 'Alternant(e) Marketing Digital / E-commerce' }]
    },
    {
      key: 'sauge-crm', title: 'Assistant(e) CRM & Email Marketing', company: 'Maison Sauge',
      companyAbout: 'Maison Sauge vend en ligne des bougies et parfums d’intérieur fabriqués à Grasse, avec un programme de fidélité de 60 000 membres.',
      city: 'Lyon', workMode: 'hybrid', contract: 'Stage', duration: 6, salary: { min: 1100, max: 1100 }, language: 'fr',
      fields: ['CRM', 'E-commerce', 'Digital Marketing'], industry: 'ecommerce',
      description: 'Vous participez à la stratégie CRM : newsletters, scénarios automatisés et programme de fidélité.',
      responsibilities: ['Créer les newsletters hebdomadaires', 'Paramétrer des scénarios automatisés', 'Segmenter la base clients', 'Analyser les performances des campagnes'],
      required: ['crm', 'copywriting', 'data-analysis'], preferred: ['ecommerce', 'graphic-design'],
      tools: ['Klaviyo', 'Shopify', 'Canva', 'Excel'], languages: ['French'],
      qualifications: ['Bac+4/5 marketing'], experience: 'Une expérience en emailing est un plus',
      listings: [{ src: 'wttj', daysAgo: 4 }]
    },
    {
      key: 'canut-comm', title: 'Assistant(e) Communication', company: 'Brasserie du Canut',
      companyAbout: 'La Brasserie du Canut est une brasserie artisanale lyonnaise dont les bières sont distribuées dans les bars et cavistes de la région.',
      city: 'Lyon', workMode: 'onsite', contract: 'Stage', duration: 4, salary: { min: 700, max: 800 }, language: 'fr',
      fields: ['Communication', 'Social Media'], industry: 'fmcg',
      description: 'Vous gérez la communication locale de la brasserie : réseaux sociaux, événements en bar et relations avec les cavistes.',
      responsibilities: ['Animer Instagram et Facebook', 'Organiser des dégustations', 'Créer des supports PLV', 'Rédiger les communiqués locaux'],
      required: ['communication', 'social-media', 'events'], preferred: ['graphic-design', 'trade-marketing'],
      tools: ['Canva', 'Meta Business Suite'], languages: ['French'],
      qualifications: ['Formation communication'], experience: 'Débutant accepté',
      listings: [{ src: 'indeed', daysAgo: 0 }]
    },
    {
      key: 'orbe-smm', title: 'Social Media Manager Junior — Alternance', company: 'Orbe Studio',
      companyAbout: 'Orbe Studio est une agence social media de 25 personnes qui accompagne des marques food, beauté et sport.',
      city: 'Paris', workMode: 'hybrid', contract: 'Alternance', duration: 12, salary: null, language: 'fr',
      fields: ['Social Media', 'Content'], industry: 'agency',
      description: 'Vous accompagnez les social media managers sur 3 comptes clients : recommandations, production de contenus, reporting.',
      responsibilities: ['Produire des contenus pour plusieurs marques', 'Préparer les reportings mensuels', 'Assurer la modération', 'Participer aux brainstormings créatifs'],
      required: ['social-media', 'content-creation', 'data-analysis'], preferred: ['paid-media', 'video', 'influence'],
      tools: ['Canva', 'CapCut', 'Meta Business Suite', 'Agorapulse'], languages: ['French'],
      qualifications: ['Bac+3 minimum'], experience: 'Une première expérience en social media',
      listings: [{ src: 'linkedin', daysAgo: 2 }]
    },
    {
      key: 'kolibri-seo', title: 'Content & SEO Intern', company: 'Kolibri Travel',
      companyAbout: 'Kolibri Travel is a remote-first travel start-up that designs slow-travel itineraries by train across Europe.',
      city: 'Remote', workMode: 'remote', contract: 'Internship', duration: 6, salary: { min: 1000, max: 1000 }, language: 'en',
      fields: ['Content', 'SEO / SEA'], industry: 'travel',
      description: 'Help us grow organic traffic with destination guides and help-centre content in English and French.',
      responsibilities: ['Write SEO destination guides', 'Optimise existing pages', 'Run keyword research', 'Report on organic growth'],
      required: ['seo', 'copywriting', 'content-creation'], preferred: ['web-analytics'],
      tools: ['WordPress', 'Semrush', 'Google Search Console'], languages: ['English', 'French'],
      qualifications: ['Fluent English and French'], experience: 'Writing samples required',
      listings: [{ src: 'linkedin', daysAgo: 5 }, { src: 'indeed', daysAgo: 4, title: 'Stage Content & SEO (Remote)' }]
    },
    {
      key: 'laitco-acdp', title: 'Assistant Chef de Produit Produits Laitiers', company: 'Lait&Co Coopérative',
      companyAbout: 'Lait&Co est une coopérative laitière régionale qui commercialise yaourts et fromages sous sa propre marque en grande distribution.',
      city: 'Lyon', workMode: 'onsite', contract: 'Stage', duration: 6, salary: { min: 1100, max: 1200 }, language: 'fr',
      fields: ['Product', 'Marketing'], industry: 'fmcg',
      description: 'Vous accompagnez la cheffe de produit sur la gamme ultra-frais : suivi des ventes, projets packaging et animations commerciales.',
      responsibilities: ['Suivre les ventes et parts de marché', 'Piloter des projets packaging', 'Préparer les animations en magasin', 'Réaliser des analyses concurrentielles'],
      required: ['product-marketing', 'data-analysis', 'trade-marketing'], preferred: ['market-research', 'project-management'],
      tools: ['Excel', 'Nielsen', 'PowerPoint'], languages: ['French'],
      qualifications: ['École de commerce ou d’ingénieur agro'], experience: 'Stage en grande consommation apprécié', industryRequired: 'fmcg',
      listings: [{ src: 'indeed', daysAgo: 3 }]
    },
    {
      key: 'velvet-events', title: 'Stage Communication & Événementiel', company: 'Velvet Records',
      companyAbout: 'Velvet Records est un label indépendant lyonnais qui produit une quinzaine d’artistes et organise des concerts.',
      city: 'Lyon', workMode: 'onsite', contract: 'Stage', duration: 3, salary: { min: 650, max: 650 }, language: 'fr',
      fields: ['Communication', 'Social Media'], industry: 'culture',
      description: 'Vous participez à la communication des sorties d’albums et à l’organisation des concerts du label.',
      responsibilities: ['Communication autour des sorties', 'Organisation logistique des concerts', 'Relations presse locales', 'Création de visuels'],
      required: ['communication', 'events', 'social-media'], preferred: ['graphic-design', 'video'],
      tools: ['Canva', 'Adobe Photoshop'], languages: ['French'],
      qualifications: ['Passion pour la musique'], experience: 'Débutant accepté',
      listings: [{ src: 'wttj', daysAgo: 8 }]
    },
    {
      key: 'hexa-growth', title: 'Growth Marketing Apprentice', company: 'Hexa Fintech',
      companyAbout: 'Hexa Fintech offers a budgeting app for students and young professionals, with 300,000 users in France.',
      city: 'Paris', workMode: 'hybrid', contract: 'Apprenticeship', duration: 12, salary: null, language: 'en',
      fields: ['Growth', 'Digital Marketing'], industry: 'tech',
      description: 'Drive user acquisition through paid social, referral programmes and app store optimisation.',
      responsibilities: ['Launch paid social campaigns', 'Run referral programme experiments', 'Optimise app store pages', 'Analyse cohorts'],
      required: ['growth', 'paid-media', 'data-analysis'], preferred: ['crm', 'content-creation'],
      tools: ['Google Sheets', 'Looker Studio', 'Meta Business Suite'], languages: ['English', 'French'],
      qualifications: ['Strong analytical skills'], experience: 'Previous growth or performance internship',
      listings: [{ src: 'wttj', daysAgo: 9 }]
    },
    {
      key: 'fleur-digital', title: 'Alternance Marketing Digital', company: 'Fleur de Sel Hôtels',
      companyAbout: 'Fleur de Sel Hôtels regroupe cinq hôtels de charme sur la côte méditerranéenne.',
      city: 'Marseille', workMode: 'onsite', contract: 'Alternance', duration: 12, salary: null, language: 'fr',
      fields: ['Digital Marketing', 'Social Media'], industry: 'travel',
      description: 'Vous animez la présence digitale des hôtels : site, réseaux sociaux et campagnes saisonnières.',
      responsibilities: ['Animer les réseaux sociaux', 'Mettre à jour le site', 'Préparer les campagnes saisonnières', 'Suivre les avis clients'],
      required: ['social-media', 'content-creation', 'communication'], preferred: ['seo', 'crm'],
      tools: ['WordPress', 'Canva'], languages: ['French', 'English'],
      qualifications: ['Bac+3'], experience: 'Débutant accepté',
      listings: [{ src: 'indeed', daysAgo: 11 }]
    },
    {
      key: 'nebuleuse-seo', title: 'Assistant(e) SEO / SEA', company: 'Nébuleuse',
      companyAbout: 'Nébuleuse est une agence d’acquisition digitale qui gère les campagnes de 40 e-commerçants.',
      city: 'Paris', workMode: 'hybrid', contract: 'Stage', duration: 6, salary: { min: 1100, max: 1100 }, language: 'fr',
      fields: ['SEO / SEA', 'Digital Marketing'], industry: 'agency',
      description: 'Vous assistez les consultants SEO et SEA : audits, suivi des campagnes, recommandations.',
      responsibilities: ['Réaliser des audits SEO', 'Optimiser les campagnes Google Ads', 'Préparer les rapports clients', 'Faire de la veille'],
      required: ['seo', 'sea', 'web-analytics'], preferred: ['data-analysis', 'copywriting'],
      tools: ['Google Ads', 'Google Analytics 4', 'Semrush', 'Looker Studio'], languages: ['French'],
      qualifications: ['Bac+4/5 marketing digital'], experience: 'Première expérience en SEO ou SEA',
      listings: [{ src: 'linkedin', daysAgo: 7 }]
    },
    {
      key: 'popcorn-cdp', title: 'Assistant(e) Chef de Projet Marketing', company: 'Popcorn Media',
      companyAbout: 'Popcorn Media produit des podcasts et vidéos de marque pour des entreprises du secteur culturel.',
      city: 'Paris', workMode: 'onsite', contract: 'Stage', duration: 6, salary: { min: 900, max: 1000 }, language: 'fr',
      fields: ['Marketing Project Management', 'Communication'], industry: 'media',
      description: 'Vous coordonnez des projets de contenus de marque, du brief client à la diffusion.',
      responsibilities: ['Coordonner les productions', 'Suivre budgets et plannings', 'Préparer les briefs', 'Assurer le lien avec les clients'],
      required: ['project-management', 'communication', 'content-creation'], preferred: ['video', 'events'],
      tools: ['Notion', 'Excel', 'PowerPoint'], languages: ['French'],
      qualifications: ['Rigueur et organisation'], experience: 'Première expérience en gestion de projet',
      listings: [{ src: 'indeed', daysAgo: 6 }]
    },
    {
      key: 'tamaris-trade', title: 'Trade Marketing Intern', company: 'Tamaris Kids',
      companyAbout: 'Tamaris Kids distribue des jeux éducatifs dans 300 magasins de jouets et enseignes culturelles.',
      city: 'Lyon', workMode: 'onsite', contract: 'Stage', duration: 6, salary: { min: 1000, max: 1000 }, language: 'fr',
      fields: ['Marketing', 'Product'], industry: 'ecommerce',
      description: 'Vous développez les outils de trade marketing pour les magasins partenaires.',
      responsibilities: ['Créer les supports PLV', 'Suivre les opérations promotionnelles', 'Analyser les ventes par enseigne', 'Organiser des animations en magasin'],
      required: ['trade-marketing', 'data-analysis', 'project-management'], preferred: ['graphic-design', 'events'],
      tools: ['Excel', 'Canva'], languages: ['French'],
      qualifications: ['École de commerce'], experience: 'Débutant accepté',
      listings: [{ src: 'wttj', daysAgo: 13 }]
    },
    {
      key: 'lumo-activation', title: 'Brand Activation Intern', company: 'Lumo Drinks',
      companyAbout: 'Lumo Drinks makes low-sugar sparkling drinks sold in French supermarkets and convenience stores.',
      city: 'Paris', workMode: 'hybrid', contract: 'Internship', duration: 6, salary: { min: 1300, max: 1300 }, language: 'en',
      fields: ['Brand', 'Marketing', 'Social Media'], industry: 'fmcg',
      description: 'Support the brand team on sampling tours, partnerships and social activations.',
      responsibilities: ['Coordinate sampling events', 'Manage partnership logistics', 'Create social content about activations', 'Measure activation results'],
      required: ['brand', 'events', 'social-media'], preferred: ['influence', 'trade-marketing', 'content-creation'],
      tools: ['Canva', 'Excel'], languages: ['English', 'French'],
      qualifications: ['Business school student'], experience: 'Event or brand experience appreciated', industryRequired: 'fmcg',
      listings: [{ src: 'linkedin', daysAgo: 0 }]
    },
    {
      key: 'atelier-num', title: 'Chargé(e) de Communication Digitale — Alternance', company: 'L’Atelier Numérique',
      companyAbout: 'L’Atelier Numérique est une association qui forme les jeunes aux métiers du numérique en Isère.',
      city: 'Grenoble', workMode: 'onsite', contract: 'Alternance', duration: 12, salary: null, language: 'fr',
      fields: ['Communication', 'Digital Marketing'], industry: 'culture',
      description: 'Vous gérez la communication digitale de l’association et des événements de recrutement.',
      responsibilities: ['Animer le site et les réseaux', 'Rédiger la newsletter', 'Organiser des portes ouvertes', 'Créer des visuels'],
      required: ['communication', 'social-media', 'crm'], preferred: ['events', 'graphic-design'],
      tools: ['WordPress', 'Canva', 'Mailchimp'], languages: ['French'],
      qualifications: ['Bac+3'], experience: 'Débutant accepté',
      listings: [{ src: 'indeed', daysAgo: 16 }]
    },
    {
      key: 'sesame-ecom', title: 'E-commerce & Marketplace Intern', company: 'Sésame Market',
      companyAbout: 'Sésame Market est une épicerie en ligne de produits bio livrés en 24h à Lyon et Grenoble.',
      city: 'Lyon', workMode: 'hybrid', contract: 'Stage', duration: 6, salary: { min: 1100, max: 1200 }, language: 'fr',
      fields: ['E-commerce', 'Marketing'], industry: 'ecommerce',
      description: 'Vous optimisez le catalogue en ligne et les opérations commerciales du site.',
      responsibilities: ['Optimiser les fiches produits', 'Préparer les opérations promotionnelles', 'Suivre la conversion', 'Coordonner avec les fournisseurs'],
      required: ['ecommerce', 'data-analysis', 'copywriting'], preferred: ['crm', 'seo'],
      tools: ['Shopify', 'Excel', 'Google Analytics 4'], languages: ['French'],
      qualifications: ['Bac+4/5'], experience: 'Première expérience e-commerce',
      listings: [{ src: 'wttj', daysAgo: 0 }, { src: 'indeed', daysAgo: 0, title: 'Stagiaire E-commerce / Marketplace H/F' }]
    },
    {
      key: 'rive-video', title: 'Motion & Video Content Intern', company: 'Rive Studio',
      companyAbout: 'Rive Studio is a small video production studio making short-form content for sports brands.',
      city: 'Paris', workMode: 'onsite', contract: 'Internship', duration: 4, salary: { min: 900, max: 900 }, language: 'en',
      fields: ['Content'], industry: 'agency',
      description: 'Edit short-form videos and motion graphics for our clients’ social channels.',
      responsibilities: ['Edit short videos', 'Create motion graphics', 'Prepare deliverables for each platform'],
      required: ['video', 'graphic-design', 'content-creation'], preferred: ['social-media'],
      tools: ['Adobe Premiere Pro', 'Adobe Illustrator', 'CapCut'], languages: ['English'],
      qualifications: ['Video portfolio required'], experience: 'Strong editing portfolio',
      listings: [{ src: 'linkedin', daysAgo: 10 }]
    },
    {
      key: 'quanta-data', title: 'Marketing Data Analyst Intern', company: 'Quanta Retail',
      companyAbout: 'Quanta Retail builds pricing analytics software for retailers.',
      city: 'Paris', workMode: 'hybrid', contract: 'Internship', duration: 6, salary: { min: 1500, max: 1600 }, language: 'en',
      fields: ['Marketing', 'Growth'], industry: 'tech',
      description: 'Build marketing dashboards and analyse campaign attribution for our B2B marketing team.',
      responsibilities: ['Build dashboards', 'Analyse attribution', 'Clean CRM data', 'Present insights'],
      required: ['data-analysis', 'web-analytics', 'crm'], preferred: ['growth'],
      tools: ['Looker Studio', 'Power BI', 'Salesforce', 'Excel'], languages: ['English'],
      qualifications: ['SQL appreciated'], experience: 'Analytics coursework or internship',
      listings: [{ src: 'linkedin', daysAgo: 20 }]
    },
    {
      key: 'opale-maro', title: 'Assistant(e) Chef de Produit Maroquinerie', company: 'Opale Paris',
      companyAbout: 'Opale Paris est une maison de maroquinerie parisienne fondée en 2015.',
      city: 'Paris', workMode: 'onsite', contract: 'Stage', duration: 6, salary: { min: 1200, max: 1200 }, language: 'fr',
      fields: ['Product', 'Brand'], industry: 'fashion',
      description: 'Vous assistez la cheffe de produit maroquinerie sur le développement des collections.',
      responsibilities: ['Suivre le développement des collections', 'Analyser les ventes', 'Préparer les présentations produits'],
      required: ['product-marketing', 'data-analysis', 'brand'], preferred: ['market-research'],
      tools: ['Excel', 'PowerPoint'], languages: ['French', 'English'],
      qualifications: ['École de commerce'], experience: 'Stage en mode ou luxe apprécié',
      expiredDaysAgo: 2,
      listings: [{ src: 'linkedin', daysAgo: 33 }]
    },
    // ---- reserve pool: only "arrives" when the daily refresh runs ----
    {
      reserve: 1, key: 'graine-content', title: 'Content Creator Intern', company: 'Graine de Pop',
      companyAbout: 'Graine de Pop fabrique des pop-corn artisanaux à Villeurbanne, vendus en épiceries fines.',
      city: 'Lyon', workMode: 'hybrid', contract: 'Stage', duration: 6, salary: { min: 900, max: 1000 }, language: 'fr',
      fields: ['Content', 'Social Media'], industry: 'fmcg',
      description: 'Vous imaginez et produisez les contenus de la marque sur Instagram et TikTok.',
      responsibilities: ['Produire des vidéos courtes', 'Gérer le calendrier éditorial', 'Travailler avec des créateurs locaux'],
      required: ['content-creation', 'social-media', 'video'], preferred: ['influence', 'copywriting'],
      tools: ['CapCut', 'Canva'], languages: ['French'], qualifications: ['Bac+3'], experience: 'Débutant accepté',
      listings: [{ src: 'wttj', daysAgo: 0 }]
    },
    {
      reserve: 2, key: 'sillage-digital', title: 'Digital Marketing Intern', company: 'Sillage Parfums',
      companyAbout: 'Sillage Parfums est une marque de parfums de niche vendue en ligne et dans 80 points de vente.',
      city: 'Paris', workMode: 'hybrid', contract: 'Stage', duration: 6, salary: { min: 1200, max: 1300 }, language: 'fr',
      fields: ['Digital Marketing', 'CRM', 'Social Media'], industry: 'beauty',
      description: 'Vous participez aux campagnes digitales : CRM, social ads et site e-commerce.',
      responsibilities: ['Préparer les newsletters', 'Suivre les campagnes social ads', 'Mettre à jour le site'],
      required: ['crm', 'paid-media', 'ecommerce'], preferred: ['social-media', 'content-creation'],
      tools: ['Klaviyo', 'Shopify', 'Meta Business Suite'], languages: ['French', 'English'], qualifications: ['Bac+4/5'], experience: 'Première expérience digitale',
      listings: [{ src: 'linkedin', daysAgo: 0 }, { src: 'indeed', daysAgo: 0, title: 'Stage Marketing Digital - Parfums H/F' }]
    },
    {
      reserve: 3, key: 'mistral-pmm', title: 'Alternance Product Marketing', company: 'Mistral Mobility',
      companyAbout: 'Mistral Mobility développe une application de covoiturage domicile-travail pour les entreprises.',
      city: 'Lyon', workMode: 'hybrid', contract: 'Alternance', duration: 12, salary: null, language: 'fr',
      fields: ['Product', 'Marketing'], industry: 'mobility',
      description: 'Vous travaillez sur le positionnement et les lancements de fonctionnalités de l’application.',
      responsibilities: ['Préparer les lancements', 'Rédiger les contenus produits', 'Analyser les retours utilisateurs'],
      required: ['product-marketing', 'product-launch', 'copywriting'], preferred: ['market-research'],
      tools: ['Notion', 'Figma'], languages: ['French', 'English'], qualifications: ['Bac+4/5'], experience: 'Première expérience marketing',
      listings: [{ src: 'indeed', daysAgo: 0 }]
    }
  ];

  /* ------------------------------------------------------------------ Demo profile */
  const PROFILE = {
    demo: true,
    firstName: 'Camille', lastName: 'Martin',
    email: 'camille.martin@example.com', phone: '+33 6 00 00 00 00', location: 'Lyon',
    linkedin: 'https://www.linkedin.com/in/demo-camille-martin',
    portfolio: 'https://portfolio.example.com/camille',
    website: '',
    headline: 'MSc Marketing student — content, social & product marketing',
    careerGoals: 'Construire une carrière en marketing produit et marketing de marque pour des marques grand public, en commençant par un stage de 6 mois où je peux suivre un lancement de bout en bout.',
    pitch: 'J’allie la création de contenus et le réflexe de mesurer ce qui fonctionne.',
    preferences: {
      desiredPositions: ['Chef de produit marketing', 'Product marketing', 'Brand marketing', 'Content marketing', 'Social media'],
      fields: ['Marketing', 'Digital Marketing', 'Communication', 'Content', 'Product', 'Brand', 'Social Media'],
      industries: ['fmcg', 'beauty', 'fashion', 'ecommerce'],
      contracts: ['Stage', 'Alternance'],
      locations: ['Lyon', 'Paris', 'Remote'],
      workModes: ['hybrid', 'remote', 'onsite'],
      durations: [6],
      keywords: ['lancement', 'contenu', 'marque', 'social media', 'produit'],
      companies: ['Pépite Foods', 'Nordlys Cosmetics']
    }
  };

  const PORTFOLIO = {
    url: 'https://portfolio.example.com/camille',
    title: 'Camille Martin — Portfolio (demo)',
    summary: 'Sélection de projets marketing et contenus : lancement produit, études consommateurs et séries de contenus social media.',
    links: [{ label: 'Behance', url: 'https://www.behance.net/demo-camille' }],
    projects: [
      { title: 'Lancement du sérum « Rosée » — Maison Lumen', summary: 'Kit de lancement, calendrier de contenus et seeding auprès de créateurs pour un nouveau sérum.', skills: ['product-launch', 'influence', 'content-creation'] },
      { title: 'Graine — stratégie de mise sur le marché', summary: 'Projet académique : enquête consommateurs, positionnement et recommandations prix pour une marque de snacks végétaux.', skills: ['market-research', 'product-marketing', 'brand'] },
      { title: '30 jours de Reels — Vélo Cité', summary: 'Série de vidéos courtes présentant les accessoires vélo du site e-commerce.', skills: ['video', 'social-media', 'ecommerce'] }
    ]
  };

  const CV_TEXT_MARKETING = [
    'Camille Martin', 'Lyon — camille.martin@example.com — +33 6 00 00 00 00', 'Étudiante en MSc Marketing — recherche stage marketing produit (6 mois)',
    '', 'FORMATION',
    'MSc Marketing & Brand Management — INSEEC Grande École, Lyon — 2025–2027',
    'Licence LEA Anglais–Espagnol — Université Lumière Lyon 2 — 2021–2024',
    '', 'EXPÉRIENCES PROFESSIONNELLES',
    'Stagiaire Marketing & Communication — Maison Lumen (cosmétique), Lyon — janv. 2025 – juin 2025',
    '• Gestion du calendrier éditorial Instagram et TikTok (3 publications par semaine)',
    '• Croissance de la communauté Instagram : +38 % d’abonnés en 5 mois',
    '• Co-organisation du lancement du sérum « Rosée » : kit de lancement, seeding auprès de 25 créateurs',
    '• Rédaction de la newsletter mensuelle (Brevo) — taux d’ouverture moyen de 41 %',
    'Assistante Marketing Digital (temps partiel) — Vélo Cité (e-commerce), Lyon — sept. 2023 – juin 2024',
    '• Rédaction de 12 articles de blog optimisés SEO : trafic organique +22 %',
    '• Mise à jour des fiches produits Shopify et création de visuels sur Canva',
    '• Support au suivi des campagnes Google Ads',
    'Bénévole Communication — Festival Rive Gauche, Lyon — été 2023',
    '• Animation des réseaux sociaux pendant le festival (stories en direct)',
    '• Coordination de 8 bénévoles à l’accueil du public',
    '', 'PROJETS',
    'Graine — projet de conseil (INSEEC) — 2025',
    '• Stratégie de mise sur le marché d’une marque de snacks végétaux : enquête consommateurs (300 réponses), positionnement et recommandations prix',
    '', 'COMPÉTENCES',
    'Réseaux sociaux, création de contenu, rédaction, SEO, emailing / CRM, lancement de produit, études de marché, gestion de projet',
    '', 'OUTILS',
    'Canva, Figma, Meta Business Suite, Google Analytics 4, Brevo, Shopify, WordPress, Notion, Excel, CapCut, Google Ads',
    '', 'LANGUES',
    'Français (natif), Anglais (C1 — TOEIC 945), Espagnol (B2)',
    '', 'CERTIFICATIONS',
    'Google Analytics Certification (2024), HubSpot Content Marketing (2024)'
  ].join('\n');

  const EXPERIENCE = [
    {
      id: 'exp_lumen', role: 'Stagiaire Marketing & Communication', company: 'Maison Lumen', location: 'Lyon', dates: 'janv. 2025 – juin 2025', type: 'internship', industry: 'beauty',
      bullets: [
        'Gestion du calendrier éditorial Instagram et TikTok (3 publications par semaine)',
        'Croissance de la communauté Instagram : +38 % d’abonnés en 5 mois',
        'Co-organisation du lancement du sérum « Rosée » : kit de lancement, seeding auprès de 25 créateurs',
        'Rédaction de la newsletter mensuelle (Brevo) — taux d’ouverture moyen de 41 %'
      ]
    },
    {
      id: 'exp_velo', role: 'Assistante Marketing Digital (temps partiel)', company: 'Vélo Cité', location: 'Lyon', dates: 'sept. 2023 – juin 2024', type: 'job', industry: 'ecommerce',
      bullets: [
        'Rédaction de 12 articles de blog optimisés SEO : trafic organique +22 %',
        'Mise à jour des fiches produits Shopify et création de visuels sur Canva',
        'Support au suivi des campagnes Google Ads'
      ]
    },
    {
      id: 'exp_festival', role: 'Bénévole Communication', company: 'Festival Rive Gauche', location: 'Lyon', dates: 'été 2023', type: 'volunteer', industry: 'culture',
      bullets: ['Animation des réseaux sociaux pendant le festival (stories en direct)', 'Coordination de 8 bénévoles à l’accueil du public']
    }
  ];
  const PROJECTS = [
    { id: 'prj_graine', title: 'Graine — projet de conseil (INSEEC)', context: 'Projet académique — 2025', industry: 'fmcg', bullets: ['Stratégie de mise sur le marché d’une marque de snacks végétaux : enquête consommateurs (300 réponses), positionnement et recommandations prix'] }
  ];

  function cvParsed(overrides) {
    return Object.assign({
      education: [
        { degree: 'MSc Marketing & Brand Management', school: 'INSEEC Grande École, Lyon', dates: '2025–2027', level: 5 },
        { degree: 'Licence LEA Anglais–Espagnol', school: 'Université Lumière Lyon 2', dates: '2021–2024', level: 3 }
      ],
      experience: JSON.parse(JSON.stringify(EXPERIENCE)),
      projects: JSON.parse(JSON.stringify(PROJECTS)),
      skills: ['Réseaux sociaux', 'Création de contenu', 'Rédaction', 'SEO', 'Emailing / CRM', 'Lancement de produit', 'Études de marché', 'Gestion de projet'],
      tools: ['Canva', 'Figma', 'Meta Business Suite', 'Google Analytics 4', 'Brevo', 'Shopify', 'WordPress', 'Notion', 'Excel', 'CapCut', 'Google Ads'],
      languages: [{ language: 'French', level: 'Natif' }, { language: 'English', level: 'C1' }, { language: 'Spanish', level: 'B2' }],
      certifications: ['Google Analytics Certification (2024)', 'HubSpot Content Marketing (2024)'],
      achievements: ['+38 % d’abonnés Instagram en 5 mois (Maison Lumen)', 'Taux d’ouverture newsletter de 41 % (Maison Lumen)', 'Trafic organique +22 % (Vélo Cité)'],
      jobTitles: ['Stagiaire Marketing & Communication', 'Assistante Marketing Digital', 'Bénévole Communication'],
      industries: ['beauty', 'ecommerce', 'culture']
    }, overrides || {});
  }

  const CVS = [
    { name: 'CV Marketing — 2026', filename: 'CV_Camille_Martin_Marketing_2026.pdf', version: 2, targetRole: 'Product / Brand marketing', daysAgo: 20, isDefault: true, text: CV_TEXT_MARKETING, parsed: cvParsed() },
    { name: 'CV Communication — 2026', filename: 'CV_Camille_Martin_Communication_2026.pdf', version: 1, targetRole: 'Communication', daysAgo: 35, text: CV_TEXT_MARKETING, parsed: cvParsed({ skills: ['Communication', 'Réseaux sociaux', 'Rédaction', 'Événementiel', 'Gestion de projet', 'Création de contenu'] }) },
    { name: 'CV Content Creator — 2026', filename: 'CV_Camille_Martin_Content_2026.docx', version: 1, targetRole: 'Content / Social media', daysAgo: 30, text: CV_TEXT_MARKETING, parsed: cvParsed({ skills: ['Création de contenu', 'Réseaux sociaux', 'Rédaction', 'SEO', 'Montage vidéo', 'Community management'] }) }
  ];

  /* ------------------------------------------------------------------ Demo applications
     status flow: to_apply → applied → follow_up → interview → final_round → offer
     plus rejected / withdrawn. `answers` feed the demo cover letters generated at seed. */
  const APPLICATIONS = [
    {
      jobKey: 'brume-social', status: 'applied', appliedDaysAgo: 9, followUpIn: 1, cv: 2, contact: { name: '', email: '' },
      notes: 'Candidature envoyée via LinkedIn.',
      answers: { motivation_company: 'leur façon de montrer les coulisses des ateliers au Portugal, c’est rare dans la mode', personal_connection: 'la série de posts sur les couturières de l’atelier de Porto' },
      history: [['discovered', 11], ['saved', 10], ['cv_selected', 9], ['letter', 9], ['applied', 9]]
    },
    {
      jobKey: 'gustave-growth', status: 'interview', appliedDaysAgo: 16, interviewIn: 3, cv: 0, contact: { name: 'Léa Fontaine (Talent Acquisition)', email: 'lea.fontaine@gustave.example' },
      notes: 'Entretien visio avec la Head of Growth. Préparer un exemple d’A/B test.',
      answers: { motivation_company: 'the idea of helping local caterers win office clients, and the upcoming Bordeaux launch', role_attraction: 'running experiments and seeing results quickly' },
      history: [['discovered', 19], ['saved', 18], ['letter', 16], ['applied', 16], ['followup_done', 10], ['interview_scheduled', 6]]
    },
    {
      jobKey: 'mediaroll-content', status: 'rejected', appliedDaysAgo: 25, cv: 2, contact: { name: '', email: '' },
      notes: 'Réponse négative par email — profil retenu plus orienté SEO technique.',
      answers: { motivation_company: 'le magazine cuisine, que je lis depuis longtemps' },
      history: [['discovered', 27], ['letter', 25], ['applied', 25], ['rejected', 12]]
    },
    {
      jobKey: 'nordlys-brand', status: 'follow_up', appliedDaysAgo: 12, followUpIn: 4, cv: 0, contact: { name: 'Service RH', email: 'jobs@nordlys.example' },
      notes: 'Relance envoyée il y a 3 jours.',
      answers: { motivation_company: 'les emballages rechargeables et les formules courtes', personal_connection: 'la crème de nuit rechargeable que j’utilise' },
      history: [['discovered', 14], ['saved', 14], ['letter', 12], ['applied', 12], ['followup_done', 3]]
    },
    {
      jobKey: 'pixelune-pmm', status: 'to_apply', cv: 0, contact: { name: '', email: '' }, notes: 'Préparer des exemples de messages de lancement.', answers: {},
      history: [['discovered', 6], ['saved', 5]]
    },
    {
      // Offer no longer in the feed: the application keeps its own job snapshot.
      snapshot: { title: 'Assistant(e) Communication', company: 'Studio Faro', city: 'Lyon', contract: 'Stage', duration: 6, source: 'indeed', workMode: 'onsite', industry: 'agency', fields: ['Communication'] },
      status: 'withdrawn', appliedDaysAgo: 40, cv: 1, contact: { name: '', email: '' }, notes: 'Retirée : le stage commençait trop tôt.', answers: {},
      history: [['discovered', 44], ['applied', 40], ['withdrawn', 30]]
    }
  ];

  const SAVED = [
    { jobKey: 'pixelune-pmm', priority: 'high', notes: 'Remote friendly — top choix.' },
    { jobKey: 'laitco-acdp', priority: 'medium', notes: '' },
    { jobKey: 'hexa-growth', priority: 'low', notes: 'Plutôt growth, à voir.' },
    { jobKey: 'opale-maro', priority: 'medium', notes: 'Vérifier si toujours ouverte.' }
  ];

  MT.demo = { OFFERS, PROFILE, PORTFOLIO, CVS, APPLICATIONS, SAVED, CV_TEXT_MARKETING };
})(window.MT = window.MT || {});
