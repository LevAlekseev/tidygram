export interface ChannelSummary {
  id: string;
  title: string;
  username?: string;
  /** Unix seconds of the latest message, null if the channel is empty. */
  lastPostAt: number | null;
  /** Unix seconds when the user joined. */
  joinedAt?: number;
  unread: number;
  muted: boolean;
  archived: boolean;
  /** No public @username: after leaving, coming back needs an invite link. */
  isPrivate: boolean;
  subscribers?: number;
}

export type MediaKind = 'photo' | 'video' | 'audio' | 'file' | 'poll' | 'other';

export interface Post {
  id: number;
  date: number;
  text: string;
  views?: number;
  media?: MediaKind;
}

export interface ChannelDetails {
  about?: string;
  subscribers?: number;
  avatarUrl?: string;
  posts: Post[];
}

/** Everything the UI needs from Telegram. Implemented by the real client and by the demo. */
export interface Backend {
  demo: boolean;
  listChannels(): Promise<ChannelSummary[]>;
  loadDetails(id: string): Promise<ChannelDetails>;
  loadImage?(id: string, postId: number): Promise<string | undefined>;
  leave(id: string): Promise<void>;
  logout(): Promise<void>;
}

export type Decision = 'keep' | 'leave';
export type Action = Decision | 'later';
export type Decisions = Record<string, Decision>;
