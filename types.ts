
export type NewsCategory = 'News' | 'Guide' | 'Spotlight' | 'Video' | 'Tutorial' | 'Meta-Link';

export enum PlayStyle {
  GoalPoacher = 'Goal Poacher',
  HolePlayer = 'Hole Player',
  CreativeMaker = 'Creative Playmaker',
  AnchorMan = 'Anchor Man',
  BuildUp = 'Build Up',
  Orchestrator = 'Orchestrator'
}

export interface Player {
  id: string;
  name: string;
  rating: number;
  position: string;
  playStyle: PlayStyle;
  club: string;
  nationality: string;
  stats: {
    offensive: number;
    defensive: number;
    speed: number;
    physical: number;
    passing: number;
  };
  image: string;
}

export interface SquadMember {
  name: string;
  position: string;
  rating?: number;
}

export interface Squad {
  id: string;
  name: string;
  manager: string;
  coachSkill?: string;
  players: SquadMember[];
  screenshot?: string;
  lastAnalysis?: string;
}

export interface MetaTactic {
  id: string;
  title: string;
  author: string;
  formation: string;
  description: string;
  difficulty: 'Beginner' | 'Advanced' | 'Pro';
  sourcePostId?: string;
}

export interface ContentSubmission {
  title: string;
  link?: string;
  category: NewsCategory;
  description: string;
  mediaFile?: string; // Base64 for simulated uploads
}

export interface User {
  id: string;
  email: string;
  username: string;
  efootballName: string;
  password?: string;
  profilePic?: string;
  isAdmin: boolean;
  isVerified: boolean;
  joinedDate: string;
  status: 'active' | 'suspended';
}

export interface AdminNotification {
  id: string;
  type: 'signup' | 'system' | 'moderation' | 'verification' | 'alert' | 'password_reset';
  message: string;
  details: string;
  timestamp: string;
}

export interface GlobalAlert {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  active: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: NewsCategory;
  url?: string;
  mediaUrl?: string; // For videos/images
  timestamp: string;
  author: string;
  thumbnail?: string;
  status: 'pending' | 'approved';
}
