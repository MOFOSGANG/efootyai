
import { User, AdminNotification, NewsItem, GlobalAlert, Player, Squad, MetaTactic } from './types';
import { INITIAL_NEWS, MOCK_PLAYERS, META_TACTICS } from './constants';
import { apiService } from './services/apiService';

const USERS_KEY = 'efooty_users_v3';
const NOTIFS_KEY = 'efooty_notifs_v3';
const POSTS_KEY = 'efooty_posts_v3';
const ALERT_KEY = 'efooty_alert_v3';
const PLAYERS_KEY = 'efooty_players_v3';
const SQUADS_KEY = 'efooty_squads_v3';
const TACTICS_KEY = 'efooty_tactics_v3';

const ROOT_ADMIN_EMAIL = 'Mofosgang123@gmail.com';

const DEFAULT_USERS: User[] = [
  {
    id: 'root-admin',
    email: ROOT_ADMIN_EMAIL,
    username: 'MOFOSGANG',
    efootballName: 'MOFOSGAMES_YT',
    password: 'MofosGang12$',
    isAdmin: true,
    isVerified: true,
    joinedDate: '2025-01-01',
    status: 'active'
  }
];

const DEFAULT_SQUADS: Squad[] = [
  { id: '1', name: 'Alpha Squad', manager: 'TBA', players: [] },
  { id: '2', name: 'Beta Squad', manager: 'TBA', players: [] },
  { id: '3', name: 'Gamma Squad', manager: 'TBA', players: [] }
];

// Check if backend is available (cached for performance)
let backendAvailable: boolean | null = null;
let backendCheckTime = 0;
const BACKEND_CHECK_INTERVAL = 30000; // 30 seconds

async function checkBackend(): Promise<boolean> {
  const now = Date.now();
  if (backendAvailable !== null && now - backendCheckTime < BACKEND_CHECK_INTERVAL) {
    return backendAvailable;
  }
  backendAvailable = await apiService.isBackendAvailable();
  backendCheckTime = now;
  return backendAvailable;
}

// Sync helper - tries API first, falls back to localStorage
async function syncGet<T>(apiCall: () => Promise<T>, localKey: string, defaultValue: T): Promise<T> {
  try {
    if (await checkBackend()) {
      const data = await apiCall();
      localStorage.setItem(localKey, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('API call failed, using localStorage fallback:', err);
  }
  const data = localStorage.getItem(localKey);
  return data ? JSON.parse(data) : defaultValue;
}

export const sharedStore = {
  // Users - with API integration
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : DEFAULT_USERS;
  },

  getUsersAsync: async (): Promise<User[]> => {
    return syncGet(() => apiService.getUsers(), USERS_KEY, DEFAULT_USERS);
  },

  setUsers: (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getNotifications: (): AdminNotification[] => {
    const data = localStorage.getItem(NOTIFS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getNotificationsAsync: async (): Promise<AdminNotification[]> => {
    return syncGet(() => apiService.getNotifications(), NOTIFS_KEY, []);
  },

  addNotification: async (notif: AdminNotification) => {
    try {
      if (await checkBackend()) {
        await apiService.addNotification(notif);
      }
    } catch (err) {
      console.warn('Failed to add notification to API:', err);
    }
    // Always update localStorage as backup
    const notifs = sharedStore.getNotifications();
    const securedNotif = { ...notif, details: `[NODE: ${ROOT_ADMIN_EMAIL}] ${notif.details}` };
    localStorage.setItem(NOTIFS_KEY, JSON.stringify([securedNotif, ...notifs].slice(0, 50)));
  },

  saveUser: (user: User) => {
    const users = sharedStore.getUsers();
    const exists = users.find(u => u.email === user.email || u.username === user.username);
    if (exists) {
      sharedStore.setUsers(users.map(u => (u.email === user.email || u.username === user.username) ? { ...u, ...user } : u));
    } else {
      sharedStore.setUsers([...users, user]);
    }
  },

  // Players
  getPlayers: (): Player[] => {
    const data = localStorage.getItem(PLAYERS_KEY);
    return data ? JSON.parse(data) : MOCK_PLAYERS;
  },

  getPlayersAsync: async (): Promise<Player[]> => {
    return syncGet(() => apiService.getPlayers(), PLAYERS_KEY, MOCK_PLAYERS);
  },

  setPlayers: async (players: Player[]) => {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  },

  // Global Alert
  getGlobalAlert: (): GlobalAlert | null => {
    const data = localStorage.getItem(ALERT_KEY);
    return data ? JSON.parse(data) : null;
  },

  getGlobalAlertAsync: async (): Promise<GlobalAlert | null> => {
    return syncGet(() => apiService.getGlobalAlert(), ALERT_KEY, null);
  },

  setGlobalAlert: async (alert: GlobalAlert | null) => {
    try {
      if (await checkBackend()) {
        if (alert) {
          await apiService.setGlobalAlert(alert);
        }
      }
    } catch (err) {
      console.warn('Failed to set alert via API:', err);
    }
    if (alert) localStorage.setItem(ALERT_KEY, JSON.stringify(alert));
    else localStorage.removeItem(ALERT_KEY);
  },

  // Posts
  getPosts: (): NewsItem[] => {
    const data = localStorage.getItem(POSTS_KEY);
    return data ? JSON.parse(data) : INITIAL_NEWS;
  },

  getPostsAsync: async (): Promise<NewsItem[]> => {
    return syncGet(() => apiService.getPosts(), POSTS_KEY, INITIAL_NEWS);
  },

  setPosts: (posts: NewsItem[]) => {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  },

  addPost: async (post: NewsItem) => {
    try {
      if (await checkBackend()) {
        await apiService.createPost(post);
      }
    } catch (err) {
      console.warn('Failed to add post via API:', err);
    }
    const posts = sharedStore.getPosts();
    sharedStore.setPosts([post, ...posts]);
  },

  // Squads
  getSquads: (): Squad[] => {
    const data = localStorage.getItem(SQUADS_KEY);
    return data ? JSON.parse(data) : DEFAULT_SQUADS;
  },

  getSquadsAsync: async (): Promise<Squad[]> => {
    return syncGet(() => apiService.getSquads(), SQUADS_KEY, DEFAULT_SQUADS);
  },

  saveSquad: async (squad: Squad) => {
    try {
      if (await checkBackend()) {
        await apiService.updateSquad(squad.id, squad);
      }
    } catch (err) {
      console.warn('Failed to save squad via API:', err);
    }
    const squads = sharedStore.getSquads();
    const updated = squads.map(s => s.id === squad.id ? squad : s);
    localStorage.setItem(SQUADS_KEY, JSON.stringify(updated));
  },

  // Tactics
  getTactics: (): MetaTactic[] => {
    const data = localStorage.getItem(TACTICS_KEY);
    return data ? JSON.parse(data) : META_TACTICS;
  },

  getTacticsAsync: async (): Promise<MetaTactic[]> => {
    return syncGet(() => apiService.getTactics(), TACTICS_KEY, META_TACTICS);
  },

  addTactic: async (tactic: MetaTactic) => {
    try {
      if (await checkBackend()) {
        await apiService.addTactic(tactic);
      }
    } catch (err) {
      console.warn('Failed to add tactic via API:', err);
    }
    const tactics = sharedStore.getTactics();
    localStorage.setItem(TACTICS_KEY, JSON.stringify([tactic, ...tactics]));
  },

  setTactics: (tactics: MetaTactic[]) => {
    localStorage.setItem(TACTICS_KEY, JSON.stringify(tactics));
  },

  getMetaVersion: () => 'v5.1.0-REVOLUTION',

  // API Service exposure for direct access
  api: apiService
};
