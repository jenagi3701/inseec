/* ==========================================================================
   MARKETRACK — knowledge.js
   Canonical vocabulary shared by the CV parser, the job normaliser and the
   matching engine: skills (with FR/EN aliases), tools, fields, industries.
   ========================================================================== */
(function (MT) {
  'use strict';

  // key -> { label, aliases[], related[] (gives a *partial* match) }
  const SKILLS = {
    'social-media': { label: 'Social media', fr: 'réseaux sociaux', aliases: ['social media', 'reseaux sociaux', 'instagram', 'tiktok', 'linkedin content', 'social networks', 'community management', 'community manager', 'gestion des reseaux'], related: ['content-creation', 'community'] },
    'community': { label: 'Community management', fr: 'animation de communauté', aliases: ['community management', 'community manager', 'animation de communaute', 'communaute', 'engagement'], related: ['social-media'] },
    'content-creation': { label: 'Content creation', fr: 'création de contenu', aliases: ['content creation', 'creation de contenu', 'contenus', 'content creator', 'video content', 'contenu', 'reels', 'storytelling'], related: ['copywriting', 'social-media'] },
    'copywriting': { label: 'Copywriting', fr: 'rédaction', aliases: ['copywriting', 'redaction', 'writing', 'editorial', 'redactionnel', 'articles', 'blog'], related: ['content-creation', 'seo'] },
    'seo': { label: 'SEO', fr: 'SEO', aliases: ['seo', 'referencement naturel', 'search engine optimization', 'organic traffic', 'trafic organique'], related: ['copywriting', 'sea', 'web-analytics'] },
    'sea': { label: 'SEA / Paid search', fr: 'SEA', aliases: ['sea', 'google ads', 'paid search', 'referencement payant', 'adwords'], related: ['paid-media', 'seo'] },
    'paid-media': { label: 'Paid media', fr: 'paid media', aliases: ['paid media', 'paid social', 'meta ads', 'facebook ads', 'media buying', 'achat media', 'campagnes payantes', 'tiktok ads'], related: ['sea', 'social-media'] },
    'crm': { label: 'CRM / Email marketing', fr: 'CRM / emailing', aliases: ['crm', 'email marketing', 'emailing', 'newsletter', 'newsletters', 'marketing automation', 'lifecycle'], related: ['data-analysis'] },
    'product-launch': { label: 'Product launch', fr: 'lancement de produit', aliases: ['product launch', 'lancement de produit', 'lancement', 'launch', 'go-to-market', 'go to market', 'gtm', 'mise sur le marche'], related: ['product-marketing', 'brand'] },
    'product-marketing': { label: 'Product marketing', fr: 'marketing produit', aliases: ['product marketing', 'marketing produit', 'chef de produit', 'product manager marketing', 'positionnement produit', 'pmm'], related: ['product-launch', 'market-research', 'brand'] },
    'brand': { label: 'Brand marketing', fr: 'marketing de marque', aliases: ['brand', 'branding', 'brand marketing', 'marque', 'plateforme de marque', 'brand positioning', 'positionnement'], related: ['product-marketing', 'communication'] },
    'market-research': { label: 'Market research', fr: 'études de marché', aliases: ['market research', 'etude de marche', 'etudes de marche', 'veille', 'consumer insights', 'insights', 'benchmark', 'survey', 'questionnaire', 'enquete', 'enquete consommateurs', 'consumer survey'], related: ['data-analysis'] },
    'data-analysis': { label: 'Data analysis', fr: 'analyse de données', aliases: ['data analysis', 'analyse de donnees', 'reporting', 'kpi', 'kpis', 'dashboard', 'tableaux de bord', 'analytics'], related: ['web-analytics', 'market-research'] },
    'web-analytics': { label: 'Web analytics', fr: 'web analytics', aliases: ['google analytics', 'ga4', 'web analytics', 'tracking'], related: ['data-analysis', 'seo'] },
    'communication': { label: 'Communication', fr: 'communication', aliases: ['communication', 'communication externe', 'communication interne', 'relations presse', 'press relations', 'rp', 'pr'], related: ['brand', 'copywriting', 'events'] },
    'events': { label: 'Events', fr: 'événementiel', aliases: ['events', 'evenementiel', 'evenement', 'event', 'salon', 'trade show'], related: ['communication'] },
    'influence': { label: 'Influencer marketing', fr: 'marketing d’influence', aliases: ['influence', 'influencer', 'influenceurs', 'creators', 'createurs', 'ugc', 'seeding'], related: ['social-media', 'content-creation'] },
    'ecommerce': { label: 'E-commerce', fr: 'e-commerce', aliases: ['e-commerce', 'ecommerce', 'e commerce', 'shopify', 'marketplace', 'fiches produits', 'product pages', 'conversion'], related: ['web-analytics', 'crm'] },
    'growth': { label: 'Growth marketing', fr: 'growth marketing', aliases: ['growth', 'growth marketing', 'growth hacking', 'acquisition', 'a/b test', 'ab testing', 'funnel'], related: ['paid-media', 'data-analysis', 'crm'] },
    'project-management': { label: 'Project management', fr: 'gestion de projet', aliases: ['project management', 'gestion de projet', 'coordination', 'retroplanning', 'planning', 'pilotage'], related: ['events'] },
    'graphic-design': { label: 'Graphic design', fr: 'design graphique', aliases: ['graphic design', 'design graphique', 'visuels', 'visuals', 'pao', 'creation graphique'], related: ['content-creation'] },
    'video': { label: 'Video editing', fr: 'montage vidéo', aliases: ['video editing', 'montage video', 'montage', 'video'], related: ['content-creation'] },
    'trade-marketing': { label: 'Trade marketing', fr: 'trade marketing', aliases: ['trade marketing', 'merchandising', 'retail', 'grande distribution', 'gms', 'plv'], related: ['product-marketing'] }
  };

  const TOOLS = ['Canva', 'Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe Premiere Pro', 'InDesign', 'CapCut', 'Meta Business Suite', 'Google Analytics 4', 'Google Ads', 'Google Search Console', 'Semrush', 'Brevo', 'Mailchimp', 'HubSpot', 'Salesforce', 'Klaviyo', 'Shopify', 'WordPress', 'Webflow', 'Notion', 'Trello', 'Asana', 'Excel', 'Google Sheets', 'PowerPoint', 'Looker Studio', 'Power BI', 'Hootsuite', 'Later', 'Agorapulse', 'ChatGPT', 'Nielsen', 'SAP'];
  const TOOL_ALIASES = { 'google analytics 4': ['google analytics', 'ga4'], 'adobe photoshop': ['photoshop'], 'adobe illustrator': ['illustrator'], 'adobe premiere pro': ['premiere pro', 'premiere'], 'excel': ['excel', 'microsoft excel'], 'powerpoint': ['powerpoint', 'ppt'] };

  const FIELDS = ['Marketing', 'Digital Marketing', 'Communication', 'Social Media', 'Content', 'Brand', 'Product', 'Growth', 'CRM', 'SEO / SEA', 'E-commerce', 'Marketing Project Management'];

  const INDUSTRIES = {
    'fmcg': { label: 'FMCG / Food & beverage', aliases: ['fmcg', 'grande consommation', 'cpg', 'agroalimentaire', 'food', 'snacking', 'boissons', 'beverage', 'biens de consommation'] },
    'beauty': { label: 'Beauty & cosmetics', aliases: ['cosmetique', 'cosmetics', 'beauty', 'beaute', 'skincare', 'soin'] },
    'fashion': { label: 'Fashion & luxury', aliases: ['mode', 'fashion', 'pret a porter', 'luxe', 'luxury', 'textile'] },
    'media': { label: 'Media & publishing', aliases: ['media', 'medias', 'presse', 'publishing', 'editorial', 'magazine'] },
    'tech': { label: 'Tech / SaaS', aliases: ['saas', 'tech', 'software', 'startup', 'logiciel', 'app', 'fintech'] },
    'ecommerce': { label: 'E-commerce & retail', aliases: ['e-commerce', 'ecommerce', 'retail', 'distribution', 'commerce en ligne'] },
    'mobility': { label: 'Mobility & sport', aliases: ['velo', 'bike', 'mobilite', 'mobility', 'sport', 'outdoor'] },
    'food-service': { label: 'Food service & hospitality', aliases: ['restauration', 'restaurant', 'food delivery', 'hospitality', 'hotellerie'] },
    'culture': { label: 'Culture & events', aliases: ['culture', 'festival', 'evenementiel', 'events', 'musique'] },
    'agency': { label: 'Agency', aliases: ['agence', 'agency', 'conseil', 'consulting'] },
    'travel': { label: 'Travel & tourism', aliases: ['travel', 'voyage', 'tourisme', 'tourism'] }
  };

  const LANGUAGES = { 'French': ['francais', 'french', 'français'], 'English': ['anglais', 'english'], 'Spanish': ['espagnol', 'spanish'], 'German': ['allemand', 'german'], 'Italian': ['italien', 'italian'], 'Portuguese': ['portugais', 'portuguese'], 'Chinese': ['chinois', 'mandarin', 'chinese'], 'Arabic': ['arabe', 'arabic'] };

  const CONTRACTS = ['Stage', 'Alternance', 'Internship', 'Apprenticeship'];
  // Stage ≈ Internship, Alternance ≈ Apprenticeship
  const CONTRACT_FAMILY = { 'stage': 'internship', 'internship': 'internship', 'alternance': 'apprenticeship', 'apprenticeship': 'apprenticeship' };

  function containsAlias(text, alias) {
    const t = ' ' + MT.ui.norm(text) + ' ';
    const a = ' ' + MT.ui.norm(alias) + ' ';
    return t.indexOf(a) !== -1;
  }

  /** Return canonical skill keys found in free text. */
  function detectSkills(text) {
    const out = [];
    Object.keys(SKILLS).forEach((k) => {
      const s = SKILLS[k];
      if ([s.label].concat(s.aliases).some((a) => containsAlias(text, a))) out.push(k);
    });
    return out;
  }
  function detectTools(text) {
    return TOOLS.filter((t) => {
      const aliases = [t].concat(TOOL_ALIASES[t.toLowerCase()] || []);
      return aliases.some((a) => containsAlias(text, a));
    });
  }
  function detectIndustries(text) {
    return Object.keys(INDUSTRIES).filter((k) => INDUSTRIES[k].aliases.some((a) => containsAlias(text, a)));
  }
  function detectLanguages(text) {
    const out = [];
    const lines = String(text || '').split(/\n|,|;|•|\|/);
    Object.keys(LANGUAGES).forEach((lang) => {
      const line = lines.find((l) => LANGUAGES[lang].some((a) => containsAlias(l, a)));
      if (line) {
        const lvl = (line.match(/\b(A1|A2|B1|B2|C1|C2|natif|native|bilingue|bilingual|courant|fluent|professionnel|intermediate|interm[ée]diaire|notions|basic|maternelle)\b/i) || [])[1];
        out.push({ language: lang, level: lvl ? MT.ui.cap(lvl) : '' });
      }
    });
    return out;
  }
  function skillLabel(k, lang) {
    const s = SKILLS[k];
    if (!s) return k;
    return lang === 'fr' ? s.fr : s.label;
  }
  function industryLabel(k) { return (INDUSTRIES[k] || { label: k }).label; }

  MT.knowledge = { SKILLS, TOOLS, FIELDS, INDUSTRIES, LANGUAGES, CONTRACTS, CONTRACT_FAMILY, detectSkills, detectTools, detectIndustries, detectLanguages, skillLabel, industryLabel, containsAlias };
})(window.MT = window.MT || {});
