import { DiscoveryCategory, SourceFactLabel } from '../types/hunt';

export interface GenreDefinition {
  id: DiscoveryCategory;
  label: string;
  shortName: string;
  icon: string;
  tagline: string;
  description: string;
  taskType: 'FIND' | 'OBSERVE' | 'LOOK FOR A DETAIL' | 'COMPARE' | 'HISTORY' | 'PHOTO OPTIONAL';
  clueFocus: string;
  safetyGuidance: string;
  defaultSourceLabel: SourceFactLabel;
  keywords: string[];
  rejectionKeywords: string[];
  searchQueries: (location: string, isLive?: boolean) => string[];
}

export const GENRE_DEFINITIONS: GenreDefinition[] = [
  {
    id: 'Horror & Haunted',
    label: 'Horror & Haunted',
    shortName: 'Horror',
    icon: '👻',
    tagline: 'Explore eerie stories and real local legends',
    description: 'Documented historical sites, reported ghost stories, and atmospheric heritage spots.',
    taskType: 'OBSERVE',
    clueFocus: 'Observe eerie architectural details, cemetery keystones, historical plaques, and colonial lore.',
    safetyGuidance: 'Stay strictly in safe, public pedestrian zones. Never enter abandoned buildings or restricted private grounds.',
    defaultSourceLabel: 'LOCAL LEGEND',
    keywords: [
      'haunt', 'haunted', 'ghost', 'spirit', 'phantom', 'paranormal', 'eerie', 'spooky',
      'supernatural', 'chilling', 'apparition', 'curse', 'cursed', 'witch', 'graveyard',
      'cemetery', 'creepy', 'legend', 'folklore', 'horror', 'djin', 'djinn', 'jinn', 'tomb', 'ruin'
    ],
    rejectionKeywords: [
      'civic gate', 'promenade', 'shopping mall', 'metro station', 'corporate',
      'office complex', 'bank', 'parliament', 'embassy', 'bus stand', 'commercial plaza'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} haunted recent`,
      `${loc} ghost story recent`,
      `${loc} paranormal recent report`,
      `${loc} haunted place news`,
      `${loc} recent local horror story`
    ] : [
      `${loc} haunted places`,
      `${loc} haunted locations`,
      `${loc} ghost stories places`,
      `${loc} haunted heritage buildings`,
      `${loc} paranormal folklore`,
      `${loc} eerie places`,
      `${loc} local ghost legends`
    ]
  },
  {
    id: 'Food & Street Eats',
    label: 'Food & Street Eats',
    shortName: 'Food',
    icon: '🍜',
    tagline: 'Hunt for iconic flavors and hidden food spots',
    description: 'Centuries-old eateries, famous food alleys, street stalls, and culinary traditions.',
    taskType: 'FIND',
    clueFocus: 'Locate iconic food alley signboards, observe traditional wood-fired or sweet shop setups, find the oldest storefront.',
    safetyGuidance: 'Only visit established public food streets and bustling markets during daytime and evening open hours.',
    defaultSourceLabel: 'CULINARY TRADITION',
    keywords: [
      'street food', 'food', 'eats', 'eatery', 'restaurant', 'cafe', 'bakery', 'snack',
      'confectionery', 'dish', 'culinary', 'flavor', 'taste', 'sweet', 'stall', 'market',
      'bazaar', 'chaat', 'biryani', 'dessert', 'diner', 'recipe', 'food street'
    ],
    rejectionKeywords: [
      'cemetery', 'tomb', 'civic gate', 'memorial park', 'corporate office', 'bank'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} street food recent discoveries`,
      `${loc} famous local food news ${loc}`,
      `${loc} new food street ${loc} latest`
    ] : [
      `${loc} street food`,
      `${loc} famous local food`,
      `${loc} hidden food places`,
      `${loc} historic eateries`,
      `${loc} food markets`
    ]
  },
  {
    id: 'Hidden History',
    label: 'Hidden History',
    shortName: 'History',
    icon: '🏛️',
    tagline: 'Find stories hiding in plain sight',
    description: 'Overlooked historical buildings, stone inscriptions, civic memorials, and forgotten events.',
    taskType: 'LOOK FOR A DETAIL',
    clueFocus: 'Examine keystone dates, bronze plaques, colonial crests, and historical milestones.',
    safetyGuidance: 'Remain on public walkways and municipal heritage promenades.',
    defaultSourceLabel: 'VERIFIED HISTORY',
    keywords: [
      'history', 'historical', 'heritage', 'monument', 'memorial', 'inscription',
      'plaque', 'colonial', 'ancient', 'century', 'founder', 'foundation', 'relic', 'fort', 'palace',
      'castle', 'vault', 'vaults', 'close', 'gate', 'arch', 'ruin', 'ruins', 'cathedral', 'abbey',
      'landmark', 'tomb', 'cemetery', 'old', 'chapel', 'hall', 'mansion', 'tower', 'oddities', 'esplanade'
    ],
    rejectionKeywords: [
      'modern strip mall', 'contemporary store', 'corporate chain'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} history recent discovery`,
      `${loc} archaeological news ${loc}`,
      `${loc} historical heritage latest`
    ] : [
      `${loc} hidden history`,
      `${loc} historical places`,
      `${loc} forgotten history`,
      `${loc} heritage sites`
    ]
  },
  {
    id: 'Architecture',
    label: 'Architecture',
    shortName: 'Architecture',
    icon: '🏗️',
    tagline: 'Look closer at the buildings around you',
    description: 'Colonial colonnades, Art Deco motifs, Gothic spires, courtyards, and ornamental masonry.',
    taskType: 'OBSERVE',
    clueFocus: 'Inspect facade columns, wrought iron balconies, carved pediments, and arches.',
    safetyGuidance: 'Observe buildings from public sidewalks and civic plazas.',
    defaultSourceLabel: 'ARCHITECTURAL RECORD',
    keywords: [
      'architecture', 'facade', 'column', 'colonnade', 'arch', 'art deco', 'gothic',
      'baroque', 'neoclassical', 'pediment', 'masonry', 'palace', 'mansion', 'dome', 'spire', 'cornice', 'portico'
    ],
    rejectionKeywords: [
      'parking lot', 'empty field', 'modern highway'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} architecture news recent`,
      `${loc} building design heritage latest`
    ] : [
      `${loc} unusual architecture`,
      `${loc} historic buildings`,
      `${loc} hidden architecture`,
      `${loc} architectural landmarks`
    ]
  },
  {
    id: 'Nature & Wildlife',
    label: 'Nature & Wildlife',
    shortName: 'Nature',
    icon: '🌿',
    tagline: 'Discover unexpected nature in the city',
    description: 'Public botanical gardens, heritage banyan trees, birdwatching wetlands, and quiet city lakes.',
    taskType: 'OBSERVE',
    clueFocus: 'Identify ancient trees, ornamental garden fixtures, water bodies, and resident biodiversity.',
    safetyGuidance: 'Never disturb wildlife, enter restricted conservation enclosures, or walk off marked trails.',
    defaultSourceLabel: 'VERIFIED HISTORY',
    keywords: [
      'nature', 'park', 'garden', 'botanical', 'lake', 'wetland', 'trees', 'biodiversity',
      'wildlife', 'flora', 'fauna', 'forest', 'sanctuary', 'birdwatching', 'pond'
    ],
    rejectionKeywords: [
      'highway', 'concrete jungle', 'shopping complex', 'parking garage'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} nature recent`,
      `${loc} biodiversity news ${loc}`
    ] : [
      `${loc} hidden nature places`,
      `${loc} public nature spots`,
      `${loc} unusual natural places`,
      `${loc} biodiversity`
    ]
  },
  {
    id: 'Art & Culture',
    label: 'Art & Culture',
    shortName: 'Art & Culture',
    icon: '🎨',
    tagline: 'Murals, galleries, and cultural landmarks',
    description: 'Public street murals, traditional craft quarters, cultural academies, and sculpture parks.',
    taskType: 'FIND',
    clueFocus: 'Find artist signatures, identify traditional sculptural materials, observe public murals.',
    safetyGuidance: 'Respect working artisans and cultural spaces open to public visitation.',
    defaultSourceLabel: 'VERIFIED HISTORY',
    keywords: [
      'art', 'mural', 'culture', 'cultural', 'sculpture', 'gallery', 'artisan', 'craft',
      'studio', 'fresco', 'painting', 'potter', 'academy', 'heritage craft', 'street art'
    ],
    rejectionKeywords: [
      'bank', 'corporate office', 'gas station'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} public art recent`,
      `${loc} murals latest news ${loc}`
    ] : [
      `${loc} public art`,
      `${loc} murals`,
      `${loc} cultural landmarks`,
      `${loc} local art`
    ]
  },
  {
    id: 'Local Mysteries',
    label: 'Local Mysteries',
    shortName: 'Mysteries',
    icon: '🕵️',
    tagline: 'Unusual histories and forgotten urban puzzles',
    description: 'Peculiar architectural quirks, unexplained street names, and unsolved city lore.',
    taskType: 'OBSERVE',
    clueFocus: 'Look for strange building shapes, sealed doorways, curious civic alignments, and mystery plaques.',
    safetyGuidance: 'Stay on public rights-of-way. Separate factual civic records from oral conjecture.',
    defaultSourceLabel: 'REPORTED STORY',
    keywords: [
      'mystery', 'mysterious', 'unexplained', 'secret', 'puzzle', 'strange', 'curious',
      'anomaly', 'enigma', 'unsolved', 'bizarre event', 'riddle', 'legendary'
    ],
    rejectionKeywords: [
      'routine', 'shopping', 'corporate headquarters'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} mystery recent news`,
      `${loc} unexplained stories latest`
    ] : [
      `${loc} local mysteries`,
      `${loc} unexplained stories`,
      `${loc} unusual local stories`
    ]
  },
  {
    id: 'Literary Trail',
    label: 'Literary Trail',
    shortName: 'Literary',
    icon: '📚',
    tagline: 'Follow the footsteps of poets and bookmakers',
    description: 'Historic publishing lanes, author residences, century-old coffee house salons, and reading rooms.',
    taskType: 'FIND',
    clueFocus: 'Find commemorative literary plaques, historic book stalls, and cafe gathering spots.',
    safetyGuidance: 'All locations must be accessible public book markets or municipal memorial houses.',
    defaultSourceLabel: 'VERIFIED HISTORY',
    keywords: [
      'literary', 'writer', 'poet', 'author', 'book', 'novel', 'publishing', 'library',
      'manuscript', 'reading', 'coffee house', 'salon', 'poetry', 'literature', 'book market'
    ],
    rejectionKeywords: [
      'stadium', 'race course', 'industrial zone'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} literary news recent`,
      `${loc} author book event recent`
    ] : [
      `${loc} literary landmarks`,
      `${loc} writers places`,
      `${loc} literary history`
    ]
  },
  {
    id: 'Photography',
    label: 'Photography',
    shortName: 'Photography',
    icon: '📸',
    tagline: 'Turn the city into a real-world photo challenge',
    description: 'Striking architectural compositions, historic perspective alleys, street shadows, and reflection angles.',
    taskType: 'PHOTO OPTIONAL',
    clueFocus: 'Locate the exact vantage point framing old and modern facades or dramatic light shafts.',
    safetyGuidance: 'Stay safe on pedestrian footpaths. Do not step into roadway traffic for a shot.',
    defaultSourceLabel: 'VERIFIED HISTORY',
    keywords: [
      'photo', 'photography', 'viewpoint', 'perspective', 'vantage', 'composition',
      'picturesque', 'reflection', 'aesthetic', 'scenic', 'panoramic', 'photogenic'
    ],
    rejectionKeywords: [
      'dim basement', 'sewer', 'windowless garage'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} photo spot recent`,
      `${loc} photogenic news ${loc}`
    ] : [
      `${loc} unusual photography locations`,
      `${loc} hidden scenic places`,
      `${loc} photogenic landmarks`
    ]
  },
  {
    id: 'Unusual & Weird',
    label: 'Unusual & Weird',
    shortName: 'Weird',
    icon: '🌀',
    tagline: 'Find places that make you say "Wait...what?"',
    description: 'Eccentric monuments, bizarre civic installations, curious statues, and odd urban relics.',
    taskType: 'LOOK FOR A DETAIL',
    clueFocus: 'Find the oddest visual contradiction, an out-of-place statue, or unexpected municipal landmark.',
    safetyGuidance: 'All locations must be legally accessible public oddities.',
    defaultSourceLabel: 'UNVERIFIED CLAIM',
    keywords: [
      'unusual', 'weird', 'bizarre', 'strange', 'eccentric', 'odd', 'curious',
      'unexpected', 'quirky', 'peculiar', 'offbeat', 'freak', 'roadside oddity'
    ],
    rejectionKeywords: [
      'standard chain store', 'regular bank', 'ordinary apartment'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} weird recent news`,
      `${loc} strange discovery recent ${loc}`
    ] : [
      `${loc} unusual places`,
      `${loc} strange landmarks`,
      `${loc} weird local attractions`
    ]
  },
  {
    id: 'Legends & Folklore',
    label: 'Legends & Folklore',
    shortName: 'Folklore',
    icon: '🧙',
    tagline: 'Stories passed down through generations',
    description: 'Riverside myths, sacred banyan legends, ancient founding tales, and heroic folk epics.',
    taskType: 'HISTORY',
    clueFocus: 'Discover the stone ghat or historic shrine connected to local oral storytelling.',
    safetyGuidance: 'Observe cultural reverence at traditional folk sites.',
    defaultSourceLabel: 'FOLKLORE',
    keywords: [
      'legend', 'folklore', 'myth', 'traditional story', 'oral tale', 'mythology',
      'fable', 'legendary', 'folktale', 'ancestral', 'folk hero', 'lore'
    ],
    rejectionKeywords: [
      'modern retail', 'tech park', 'industrial estate'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} folklore recent`,
      `${loc} local legend news ${loc}`
    ] : [
      `${loc} local legends`,
      `${loc} folklore`,
      `${loc} traditional legends`,
      `${loc} mythical stories`
    ]
  },
  {
    id: 'Old & Forgotten',
    label: 'Old & Forgotten',
    shortName: 'Forgotten',
    icon: '🏚️',
    tagline: 'Centuries-old ruins and fading city relics',
    description: 'Weathered masonry, historic tram lines, aged clocktowers, and overgrown heritage archways.',
    taskType: 'OBSERVE',
    clueFocus: 'Locate original iron rails, vintage street signs, or faded stone masonry engravings.',
    safetyGuidance: 'Only visit stable, public-facing ruins and civic monuments. Never enter unstable or cordoned structures.',
    defaultSourceLabel: 'VERIFIED HISTORY',
    keywords: [
      'forgotten', 'old', 'ruins', 'aged', 'century-old', 'remnant', 'weathered',
      'vintage', 'overlooked', 'lost', 'abandoned exterior', 'faded', 'heritage remnant'
    ],
    rejectionKeywords: [
      'new construction', 'modern plaza', 'brand new'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} forgotten places recent rediscovery`,
      `${loc} old heritage news ${loc}`
    ] : [
      `${loc} forgotten places`,
      `${loc} overlooked heritage`,
      `${loc} old hidden places`
    ]
  },
  {
    id: 'Secret Spots',
    label: 'Secret / Hidden Gems',
    shortName: 'Secret Spots',
    icon: '🔐',
    tagline: 'Quiet corners and overlooked public sanctuaries',
    description: 'Secluded public courtyards, quiet river promenades, hidden library alcoves, and pocket parks.',
    taskType: 'FIND',
    clueFocus: 'Navigate through a narrow pedestrian alley to find a serene public courtyard or historic bench.',
    safetyGuidance: '"Hidden" means publicly accessible and quiet, never private property or trespassing.',
    defaultSourceLabel: 'VERIFIED HISTORY',
    keywords: [
      'secret', 'hidden', 'gem', 'secluded', 'quiet', 'peaceful', 'tucked away',
      'alcove', 'oasis', 'pocket park', 'overlooked', 'tranquil', 'courtyard'
    ],
    rejectionKeywords: [
      'crowded highway', 'commercial airport', 'toll booth'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} hidden gem recent`,
      `${loc} secret spot discovered ${loc}`
    ] : [
      `${loc} secret places`,
      `${loc} hidden gems`,
      `${loc} overlooked spots`,
      `${loc} quiet public heritage`
    ]
  },
  {
    id: 'Cinema & Pop Culture',
    label: 'Cinema & Pop Culture',
    shortName: 'Cinema',
    icon: '🎬',
    tagline: 'Explore places connected to movies and culture',
    description: 'Classic film shoot locations, vintage single-screen movie palaces, and music heritage halls.',
    taskType: 'FIND',
    clueFocus: 'Identify the Art Deco theatre marquee, famous bridge film angle, or cinema director memorial.',
    safetyGuidance: 'All locations are publicly viewable theaters, bridges, or famous streets.',
    defaultSourceLabel: 'VERIFIED HISTORY',
    keywords: [
      'film', 'filming', 'cinema', 'movie', 'shoot', 'theatre', 'theater', 'director',
      'hollywood', 'bollywood', 'actor', 'scene', 'filmed here', 'single screen', 'marquee'
    ],
    rejectionKeywords: [
      'sewage plant', 'fertilizer factory'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} movie filming recent`,
      `${loc} cinema culture news`
    ] : [
      `${loc} filming locations`,
      `${loc} movie locations`,
      `${loc} cinema history`
    ]
  },
  {
    id: 'Religious & Spiritual Heritage',
    label: 'Religious & Spiritual Heritage',
    shortName: 'Spiritual',
    icon: '🛕',
    tagline: 'Sacred architecture and historic sanctuaries',
    description: 'Century-old terracotta temples, Armenian churches, synagogues, and Sufi heritage shrines.',
    taskType: 'OBSERVE',
    clueFocus: 'Observe terracotta relief tiles, stained-glass clerestories, bronze bell towers, and dome calligraphy.',
    safetyGuidance: 'Be deeply respectful of dress codes and ongoing worship. Explore from public courtyards and open corridors.',
    defaultSourceLabel: 'VERIFIED HISTORY',
    keywords: [
      'temple', 'church', 'mosque', 'synagogue', 'shrine', 'spiritual', 'sacred',
      'cathedral', 'monastery', 'terracotta temple', 'sanctuary', 'ashram', 'ghat'
    ],
    rejectionKeywords: [
      'nightclub', 'gambling casino'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} temple heritage recent`,
      `${loc} historic church mosque news`
    ] : [
      `${loc} historic temples churches mosques`,
      `${loc} sacred heritage architecture`,
      `${loc} historic shrines ${loc}`
    ]
  },
  {
    id: 'Markets & Street Life',
    label: 'Markets & Street Life',
    shortName: 'Markets',
    icon: '🛍️',
    tagline: 'Explore the character of the city',
    description: 'Historic clocktower bazaars, riverside flower markets, potters quarters, and spices alleys.',
    taskType: 'OBSERVE',
    clueFocus: 'Locate the central clocktower, count the distinct arched bazaar wings, observe traditional trade scales.',
    safetyGuidance: 'Keep your personal items secure in crowded public markets.',
    defaultSourceLabel: 'VERIFIED HISTORY',
    keywords: [
      'market', 'bazaar', 'street', 'bazaars', 'vendors', 'stalls', 'clocktower',
      'trading', 'arcade', 'flower market', 'spice market', 'flea market'
    ],
    rejectionKeywords: [
      'deserted highway', 'restricted bunker', 'empty field'
    ],
    searchQueries: (loc, isLive) => isLive ? [
      `${loc} market recent news`,
      `${loc} street life latest ${loc}`
    ] : [
      `${loc} markets`,
      `${loc} street markets`,
      `${loc} local street life`,
      `${loc} famous bazaars`
    ]
  },
  {
    id: 'Surprise',
    label: 'Surprise Me',
    shortName: 'Surprise',
    icon: '🎲',
    tagline: 'Let the AI choose',
    description: 'A dynamically randomized genre guaranteed to uncover an unexpected side of the city.',
    taskType: 'OBSERVE',
    clueFocus: 'Follow the clues for an unexpected urban discovery.',
    safetyGuidance: 'Follow all standard public pedestrian exploration guidelines.',
    defaultSourceLabel: 'VERIFIED HISTORY',
    keywords: [
      'interesting', 'curious', 'unique', 'hidden', 'landmark', 'heritage', 'unusual'
    ],
    rejectionKeywords: [
      'parking garage', 'gas station'
    ],
    searchQueries: (loc) => [
      `${loc} unusual historic landmarks heritage spots hidden gems`,
      `${loc} interesting curious local places to explore`
    ]
  }
];

export function getGenreDefinition(category: string): GenreDefinition {
  const normalized = normalizeCategory(category);
  return GENRE_DEFINITIONS.find(g => g.id === normalized) || GENRE_DEFINITIONS[2]; // fallback to Hidden History
}

export function normalizeCategory(category: string): DiscoveryCategory {
  const lower = (category || '').toLowerCase().trim();
  
  if (lower.includes('horror') || lower.includes('haunt') || lower.includes('ghost') || lower.includes('spooky')) {
    return 'Horror & Haunted';
  }
  if (lower.includes('food') || lower.includes('eat') || lower.includes('culinary') || lower.includes('snack') || lower.includes('taste')) {
    return 'Food & Street Eats';
  }
  if (lower.includes('photo') || lower.includes('camera') || lower.includes('scenic')) {
    return 'Photography';
  }
  if (lower.includes('arch') || lower.includes('build')) {
    return 'Architecture';
  }
  if (lower.includes('nature') || lower.includes('wild') || lower.includes('green') || lower.includes('park') || lower.includes('garden')) {
    return 'Nature & Wildlife';
  }
  if (lower.includes('art') || lower.includes('cultur') || lower.includes('mural') || lower.includes('gallery')) {
    return 'Art & Culture';
  }
  if (lower.includes('myster') || lower.includes('unexplained') || lower.includes('puzzle')) {
    return 'Local Mysteries';
  }
  if (lower.includes('literary') || lower.includes('book') || lower.includes('poet') || lower.includes('author')) {
    return 'Literary Trail';
  }
  if (lower.includes('unusual') || lower.includes('weird') || lower.includes('odd') || lower.includes('bizarre') || lower.includes('curious')) {
    return 'Unusual & Weird';
  }
  if (lower.includes('legend') || lower.includes('folk') || lower.includes('myth')) {
    return 'Legends & Folklore';
  }
  if (lower.includes('forgotten') || lower.includes('old') || lower.includes('ruin')) {
    return 'Old & Forgotten';
  }
  if (lower.includes('secret') || lower.includes('hidden gem')) {
    return 'Secret Spots';
  }
  if (lower.includes('cinema') || lower.includes('movie') || lower.includes('pop') || lower.includes('film')) {
    return 'Cinema & Pop Culture';
  }
  if (lower.includes('relig') || lower.includes('spirit') || lower.includes('temple') || lower.includes('church') || lower.includes('mosque')) {
    return 'Religious & Spiritual Heritage';
  }
  if (lower.includes('market') || lower.includes('bazaar') || lower.includes('street life') || lower.includes('shop')) {
    return 'Markets & Street Life';
  }
  if (lower.includes('surprise') || lower.includes('random')) {
    return 'Surprise';
  }
  if (lower.includes('history') || lower.includes('historic')) {
    return 'Hidden History';
  }

  return 'Hidden History';
}

/**
 * Returns a truly random genre for 'Surprise Me' mode (excluding Surprise itself).
 */
export function getRandomSurpriseGenre(): GenreDefinition {
  const nonSurprise = GENRE_DEFINITIONS.filter(g => g.id !== 'Surprise');
  const index = Math.floor(Math.random() * nonSurprise.length);
  return nonSurprise[index];
}

/**
 * Calculates a strict Genre Relevance Score between 0.00 and 1.00.
 * A place qualifies only if score >= 0.70.
 */
export function calculateGenreRelevanceScore(
  candidate: { name: string; address?: string; snippet?: string; evidence?: string; source_title?: string },
  genreDef: GenreDefinition,
  locationName: string
): { score: number; isRelevant: boolean; reason: string; claimType: SourceFactLabel } {
  const combinedText = `${candidate.name || ''} ${candidate.address || ''} ${candidate.snippet || ''} ${candidate.evidence || ''} ${candidate.source_title || ''}`.toLowerCase();
  const nameLower = (candidate.name || '').toLowerCase();

  // 1. Rejection check: does the candidate name match rejection keywords without any genre keywords?
  const hasRejectionInName = genreDef.rejectionKeywords.some(rk => nameLower.includes(rk));
  const hasGenreInText = genreDef.keywords.some(k => combinedText.includes(k));

  if (hasRejectionInName && !hasGenreInText) {
    return {
      score: 0.12,
      isRelevant: false,
      reason: `Generic location (${candidate.name}) with no ${genreDef.label}-specific evidence.`,
      claimType: genreDef.defaultSourceLabel
    };
  }

  // 2. Count distinct genre keyword matches
  const matchedKeywords = genreDef.keywords.filter(k => combinedText.includes(k));
  const keywordCount = matchedKeywords.length;

  let score = 0.20;

  if (keywordCount >= 4) {
    score += 0.60;
  } else if (keywordCount === 3) {
    score += 0.50;
  } else if (keywordCount === 2) {
    score += 0.40;
  } else if (keywordCount === 1) {
    score += 0.28;
  } else {
    // 0 keywords matched
    score = 0.15;
  }

  // Bonus if the candidate name itself explicitly matches a genre concept (e.g. "Cemetery", "Bakery", "Castle", "Palace")
  if (genreDef.keywords.some(k => nameLower.includes(k))) {
    score += 0.18;
  }

  // Bonus if candidate has distinct evidence
  if (candidate.evidence && candidate.evidence.trim().length > 20) {
    score += 0.05;
  }

  // Clamp score
  score = Math.min(1.0, Math.max(0.05, Math.round(score * 100) / 100));

  // Determine claim type
  let claimType = genreDef.defaultSourceLabel;
  if (genreDef.id === 'Horror & Haunted') {
    if (combinedText.includes('legend') || combinedText.includes('myth') || combinedText.includes('folklore')) {
      claimType = 'LOCAL LEGEND';
    } else if (combinedText.includes('reported') || combinedText.includes('claim') || combinedText.includes('news')) {
      claimType = 'REPORTED STORY';
    } else if (combinedText.includes('history') || combinedText.includes('record') || combinedText.includes('colonial')) {
      claimType = 'VERIFIED HISTORY';
    } else if (combinedText.includes('unverified') || combinedText.includes('rumor')) {
      claimType = 'UNVERIFIED CLAIM';
    }
  }

  const isRelevant = score >= 0.70;
  const reason = isRelevant
    ? `Strong evidence connecting to ${genreDef.label} (keywords: ${matchedKeywords.slice(0, 3).join(', ')})`
    : `Insufficient evidence for ${genreDef.label} (score: ${score} < 0.70)`;

  return { score, isRelevant, reason, claimType };
}
