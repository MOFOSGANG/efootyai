
import { Player, PlayStyle, MetaTactic, NewsItem } from './types';

export const MOCK_PLAYERS: Player[] = [
  {
    id: '1',
    name: 'Lionel Messi',
    rating: 98,
    position: 'RWF',
    playStyle: PlayStyle.CreativeMaker,
    club: 'Inter Miami',
    nationality: 'Argentina',
    stats: { offensive: 96, defensive: 40, speed: 88, physical: 72, passing: 97 },
    image: 'https://picsum.photos/seed/messi/200/200'
  },
  {
    id: '2',
    name: 'Erling Haaland',
    rating: 97,
    position: 'CF',
    playStyle: PlayStyle.GoalPoacher,
    club: 'Manchester City',
    nationality: 'Norway',
    stats: { offensive: 98, defensive: 35, speed: 94, physical: 96, passing: 70 },
    image: 'https://picsum.photos/seed/haaland/200/200'
  },
  {
    id: '3',
    name: 'Rodri',
    rating: 96,
    position: 'DMF',
    playStyle: PlayStyle.AnchorMan,
    club: 'Manchester City',
    nationality: 'Spain',
    stats: { offensive: 75, defensive: 94, speed: 78, physical: 92, passing: 91 },
    image: 'https://picsum.photos/seed/rodri/200/200'
  },
  {
    id: '4',
    name: 'Virgil van Dijk',
    rating: 95,
    position: 'CB',
    playStyle: PlayStyle.BuildUp,
    club: 'Liverpool',
    nationality: 'Netherlands',
    stats: { offensive: 65, defensive: 97, speed: 82, physical: 95, passing: 84 },
    image: 'https://picsum.photos/seed/vandijk/200/200'
  }
];

export const META_TACTICS: MetaTactic[] = [
  {
    id: 't1',
    title: 'Gullit Ball Meta',
    author: 'eFooTyMaster',
    formation: '4-2-2-2',
    description: 'High pressure system focusing on Hole Players and physical DMFs.',
    difficulty: 'Pro'
  },
  {
    id: 't2',
    title: 'The Tiki-Taka 2.0',
    author: 'PepFan99',
    formation: '4-3-3',
    description: 'Possession-based play with inverted fullbacks for overloading midfield.',
    difficulty: 'Advanced'
  }
];

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'n1',
    title: 'v4.2.0 Update Analysis',
    summary: 'The new dribbling mechanics are changing the meta. Here is why you need high balance.',
    category: 'News',
    url: '#',
    timestamp: '2h ago',
    author: 'eFooTyTeam',
    thumbnail: 'https://picsum.photos/seed/news1/400/200',
    // Fixing missing property: status is required for NewsItem
    status: 'approved'
  },
  {
    id: 'n2',
    title: 'Defending Mastery Guide',
    summary: 'Mastering the match-up button and manual blocking in the new update.',
    category: 'Guide',
    url: '#',
    timestamp: '5h ago',
    author: 'ProPlayerHub',
    thumbnail: 'https://picsum.photos/seed/guide1/400/200',
    // Fixing missing property: status is required for NewsItem
    status: 'approved'
  }
];
