import { TreasureHunt } from '../types/hunt';

export const PRESET_HUNTS: TreasureHunt[] = [
  {
    id: 'hunt_preset_001',
    title: 'The Overlooked Heritage Trail of Central Green',
    mode: 'History',
    locationName: 'Central Park / Public Garden',
    locationQuery: 'Central Park, New York, NY',
    centerCoordinates: { latitude: 40.785091, longitude: -73.968285 },
    durationMinutes: 30,
    totalStops: 3,
    status: 'created',
    createdAt: new Date().toISOString(),
    currentStopNumber: 1,
    finalTreasureMessage: 'You have uncovered the quiet historical thread connecting these overlooked civic spaces.',
    storyBehindThePlaces: 'In 1858, landscape architects Frederick Law Olmsted and Calvert Vaux designed Central Park as a democratic sanctuary for urban dwellers of all backgrounds, embedding subtle architectural motifs and quiet alcoves away from the city noise.',
    sourceUrls: ['https://www.centralparknyc.org', 'https://en.wikipedia.org/wiki/Central_Park'],
    stops: [
      {
        taskId: 'task_001_1',
        stopNumber: 1,
        placeName: 'Bethesda Terrace Lower Arcade',
        address: '72nd St Cross Drive, Central Park, NY 10021',
        category: 'Architecture',
        title: 'The Minton Tile Ceiling',
        clue: 'Walk into the covered lower arcade beneath Bethesda Terrace. Look up at the ceiling tiles handcrafted in England.',
        objective: 'Count or observe the pattern of Minton encaustic tiles that line the ceiling.',
        taskType: 'LOOK FOR A DETAIL',
        question: 'What dominates the design pattern of the ceiling tiles in the lower arcade?',
        questionOptions: ['Intricate floral tiles', 'Geometric starbursts', 'Heraldic crests', 'Plain cobblestone'],
        difficulty: 'Easy',
        estimatedMinutes: 10,
        safePublicLocation: true,
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bethesda+Terrace+Arcade+Central+Park+NY',
        sourceUrls: ['https://www.centralparknyc.org/locations/bethesda-terrace'],
        coordinates: { latitude: 40.7741, longitude: -73.9708 },
        hint: 'Look directly at the ceiling inside the covered pedestrian walkway.'
      },
      {
        taskId: 'task_001_2',
        stopNumber: 2,
        placeName: 'Bow Bridge Balustrade',
        address: 'Bow Bridge, Central Park, NY 10024',
        category: 'Architecture',
        title: 'The Cast-Iron Balustrade',
        clue: 'Approach the 1862 cast-iron Bow Bridge. Stand on the pedestrian walkway near the center.',
        objective: 'Examine the decorative circles along the bridge railing.',
        taskType: 'OBSERVE',
        question: 'What decorative element is woven into the center of the cast-iron circles along the railings?',
        questionOptions: ['Eight-pointed star motif', 'Interlocking vines', 'Anchors & oars', 'Simple lattice bars'],
        difficulty: 'Medium',
        estimatedMinutes: 10,
        safePublicLocation: true,
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bow+Bridge+Central+Park+NY',
        sourceUrls: ['https://www.centralparknyc.org/locations/bow-bridge'],
        coordinates: { latitude: 40.7757, longitude: -73.9718 },
        hint: 'Look closely at the mid-point railing panels facing the lake.'
      },
      {
        taskId: 'task_001_3',
        stopNumber: 3,
        placeName: 'Shakespeare Garden Whispering Bench',
        address: '79th St Transverse, Central Park, NY 10024',
        category: 'History',
        title: 'The Granite Whispering Bench',
        clue: 'Climb toward the cottage-style Shakespeare Garden and find the curved granite bench.',
        objective: 'Sit at one end of the curved stone bench and notice its acoustics or inscription.',
        taskType: 'FIND',
        question: 'What acoustic property or material makes this curved bench special?',
        questionOptions: ['Whispering wall sound reflection', 'Polished red marble', 'Bronze plaque seating', 'Carved wooden armrests'],
        difficulty: 'Medium',
        estimatedMinutes: 10,
        safePublicLocation: true,
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Shakespeare+Garden+Central+Park+NY',
        sourceUrls: ['https://www.centralparknyc.org/locations/shakespeare-garden'],
        coordinates: { latitude: 40.7792, longitude: -73.9698 },
        hint: 'Look for the bench set into the stone terrace on the upper path.'
      }
    ],
    userProgress: [
      { stopNumber: 1, status: 'active' },
      { stopNumber: 2, status: 'pending' },
      { stopNumber: 3, status: 'pending' }
    ]
  }
];
