/**
 * The only file that talks to Telegram.
 *
 * It uses GramJS to speak MTProto straight from the browser to Telegram's servers.
 * There is no tidygram server: the login session lives in this browser's localStorage
 * and nowhere else.
 *
 * Everything tidygram ever asks Telegram to do is in this file:
 *   - log in (QR code or phone number)
 *   - read the list of dialogs
 *   - read a channel's description, avatar and latest posts
 *   - leave a channel (only after the user confirms the final list)
 *   - log out
 */
import type { TelegramClient } from 'telegram';
import type { Backend, ChannelDetails, ChannelSummary, MediaKind, Post } from '../types';

const SESSION_KEY = 'tidygram.session';

export const API_ID = Number(import.meta.env.VITE_TG_API_ID || 0);
export const API_HASH = String(import.meta.env.VITE_TG_API_HASH || '');
export const hasApiKey = API_ID > 0 && API_HASH.length > 0;

function readSession(): string {
  try {
    return localStorage.getItem(SESSION_KEY) || '';
  } catch {
    return '';
  }
}

function writeSession(value: string | null) {
  try {
    if (value) localStorage.setItem(SESSION_KEY, value);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable (private mode): the session just won't survive a reload */
  }
}

export const hasSavedSession = () => readSession() !== '';
export const clearSession = () => writeSession(null);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([p, sleep(ms).then(() => undefined)]);
}

export function errText(e: unknown): string {
  const err = e as { errorMessage?: string; message?: string } | undefined;
  return err?.errorMessage || err?.message || String(e);
}

let clientPromise: Promise<TelegramClient> | null = null;

export function getClient(): Promise<TelegramClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      // Loaded lazily so the landing page and the demo don't download the Telegram library.
      const { TelegramClient } = await import('telegram');
      const { StringSession } = await import('telegram/sessions');
      const client = new TelegramClient(new StringSession(readSession()), API_ID, API_HASH, {
        connectionRetries: 5,
        useWSS: true,
        deviceModel: 'tidygram (web)',
        appVersion: '0.1.0',
      });
      (client as unknown as { setLogLevel(level: string): void }).setLogLevel('error');
      await client.connect();
      return client;
    })();
    clientPromise.catch(() => {
      clientPromise = null;
    });
  }
  return clientPromise;
}

export async function isAuthorized(): Promise<boolean> {
  const client = await getClient();
  return client.checkAuthorization();
}

function persist(client: TelegramClient) {
  writeSession(client.session.save() as unknown as string);
}

export interface AuthUi {
  isCancelled(): boolean;
  onQr?(url: string): void;
  /** Resolves with the code, or with RESEND to ask Telegram for another delivery method. */
  askCode?(info: CodeInfo): Promise<string>;
  askPassword(hint?: string): Promise<string>;
  onError(message: string): void;
}

function base64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Log in by scanning a QR code from the Telegram app on the phone. */
export async function loginQr(ui: AuthUi): Promise<void> {
  const client = await getClient();
  try {
    await client.signInUserWithQrCode(
      { apiId: API_ID, apiHash: API_HASH },
      {
        qrCode: async ({ token }) => {
          if (ui.isCancelled()) throw new Error('CANCELLED');
          ui.onQr?.('tg://login?token=' + base64url(token));
        },
        password: async (hint) => ui.askPassword(hint),
        onError: async (err) => {
          if (ui.isCancelled()) return true;
          ui.onError(errText(err));
          return false;
        },
      },
    );
  } catch (err) {
    // A phone may suspend this page while the Telegram app is open, so the "login confirmed"
    // notification can be missed. If the login did go through, carry on.
    if (ui.isCancelled() || !(await client.checkAuthorization().catch(() => false))) throw err;
  }
  persist(client);
}

/** Log in with a phone number and the code Telegram sends to the app. */
export async function loginPhone(phone: string, ui: AuthUi): Promise<void> {
  const client = await getClient();
  const { Api } = await import('telegram');
  const credentials = { apiId: API_ID, apiHash: API_HASH };

  let sent: any = await client.invoke(
    new Api.auth.SendCode({ phoneNumber: phone, ...credentials, settings: new Api.CodeSettings({}) }),
  );

  // Ask for the code until it is accepted. Telegram decides how the code is delivered
  // (app message, e-mail, SMS, call), so tell the user where to look.
  while (sent.className !== 'auth.SentCodeSuccess') {
    if (sent.type?.className === 'auth.SentCodeTypeSetUpEmailRequired') throw new Error('EMAIL_SETUP_REQUIRED');
    const answer = await ui.askCode!(codeInfo(sent));
    if (ui.isCancelled()) throw new Error('CANCELLED');
    try {
      if (answer === RESEND) {
        sent = await client.invoke(
          new Api.auth.ResendCode({ phoneNumber: phone, phoneCodeHash: sent.phoneCodeHash }),
        );
        continue;
      }
      const result: any = await client.invoke(
        new Api.auth.SignIn({ phoneNumber: phone, phoneCodeHash: sent.phoneCodeHash, phoneCode: answer }),
      );
      if (result.className === 'auth.AuthorizationSignUpRequired') throw new Error('PHONE_NUMBER_UNOCCUPIED');
      break;
    } catch (err) {
      const message = errText(err);
      if (message === 'SESSION_PASSWORD_NEEDED') {
        await client.signInWithPassword(credentials, {
          password: async (hint) => ui.askPassword(hint),
          onError: async (e) => {
            if (ui.isCancelled()) return true;
            ui.onError(errText(e));
            return !/PASSWORD_HASH_INVALID/.test(errText(e));
          },
        });
        break;
      }
      // A mistyped code can be retried; anything else stops the attempt.
      if (!/PHONE_CODE_INVALID|PHONE_CODE_EMPTY/.test(message)) throw err;
      ui.onError(message);
    }
  }
  persist(client);
}

export const RESEND = '\u0000resend';

export type CodeVia = 'app' | 'sms' | 'call' | 'email' | 'fragment' | 'other';

export interface CodeInfo {
  via: CodeVia;
  /** Masked e-mail address, when the code went to e-mail. */
  detail?: string;
  /** Telegram offers another delivery method. */
  canResend: boolean;
}

function codeInfo(sent: any): CodeInfo {
  const cls: string = sent.type?.className || '';
  let via: CodeVia = 'other';
  if (cls.endsWith('TypeApp')) via = 'app';
  else if (cls.includes('Email')) via = 'email';
  else if (cls.includes('Fragment')) via = 'fragment';
  else if (cls.includes('Sms')) via = 'sms';
  else if (cls.includes('Call')) via = 'call';
  return { via, detail: sent.type?.emailPattern || undefined, canResend: !!sent.nextType };
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function mediaKind(m: any): MediaKind | undefined {
  const cls = m.media?.className;
  if (!cls || cls === 'MessageMediaWebPage') return undefined;
  if (cls === 'MessageMediaPhoto') return 'photo';
  if (cls === 'MessageMediaPoll') return 'poll';
  if (cls === 'MessageMediaDocument') {
    const attrs: any[] = m.media.document?.attributes || [];
    if (attrs.some((a) => a.className === 'DocumentAttributeVideo')) return 'video';
    if (attrs.some((a) => a.className === 'DocumentAttributeAudio')) return 'audio';
    return 'file';
  }
  return 'other';
}

function toBlobUrl(data: unknown): string | undefined {
  if (!data || typeof data === 'string' || !(data as Uint8Array).length) return undefined;
  return URL.createObjectURL(new Blob([data as BlobPart], { type: 'image/jpeg' }));
}

export async function createTelegramBackend(): Promise<Backend> {
  const client = await getClient();
  const { Api } = await import('telegram');
  const entities = new Map<string, any>();
  const photos = new Map<string, any>();

  return {
    demo: false,

    async listChannels() {
      const dialogs = await client.getDialogs({});
      const now = Date.now() / 1000;
      const out: ChannelSummary[] = [];
      for (const d of dialogs) {
        const e: any = d.entity;
        // Broadcast channels only. Groups and private chats are a later, separate step.
        if (!e || e.className !== 'Channel' || !e.broadcast || e.left) continue;
        // Never offer to leave channels the user owns or administers.
        if (e.creator || e.adminRights) continue;
        const id = String(e.id);
        entities.set(id, e);
        const username: string | undefined =
          e.username || e.usernames?.find((u: any) => u.active)?.username || undefined;
        const muteUntil: number = (d.dialog as any)?.notifySettings?.muteUntil ?? 0;
        out.push({
          id,
          title: e.title || '',
          username,
          lastPostAt: d.message?.date ?? null,
          joinedAt: e.date || undefined,
          unread: d.unreadCount || 0,
          muted: muteUntil > now,
          archived: !!d.archived,
          isPrivate: !username,
          subscribers: e.participantsCount || undefined,
        });
      }
      return out;
    },

    async loadDetails(id) {
      const e = entities.get(id);
      if (!e) return { posts: [] };
      // Posts are what the user decides on, so only they are allowed to take long.
      // Description and avatar are dropped if Telegram is slow or rate-limits us.
      const [full, avatar, messages] = await Promise.all([
        withTimeout(client.invoke(new Api.channels.GetFullChannel({ channel: e })), 4000).catch(() => undefined),
        withTimeout(client.downloadProfilePhoto(e, { isBig: false }), 4000).catch(() => undefined),
        client.getMessages(e, { limit: 12 }).catch(() => []),
      ]);

      const posts: Post[] = [];
      const albums = new Map<string, Post>();
      for (const m of messages as any[]) {
        if (m.className !== 'Message') continue;
        const album = m.groupedId ? String(m.groupedId) : null;
        const existing = album ? albums.get(album) : undefined;
        if (existing) {
          // An album is several messages; show it as one post.
          if (!existing.text && m.message) existing.text = m.message;
          continue;
        }
        const post: Post = {
          id: m.id,
          date: m.date,
          text: m.message || '',
          views: m.views ?? undefined,
          media: mediaKind(m),
        };
        if (post.media === 'photo') photos.set(`${id}:${m.id}`, m);
        if (album) albums.set(album, post);
        posts.push(post);
      }

      const fullChat: any = (full as any)?.fullChat;
      const details: ChannelDetails = {
        about: fullChat?.about || undefined,
        subscribers: fullChat?.participantsCount || undefined,
        avatarUrl: toBlobUrl(avatar),
        posts: posts.slice(0, 6),
      };
      return details;
    },

    async loadImage(id, postId) {
      const m = photos.get(`${id}:${postId}`);
      if (!m) return undefined;
      const data = await withTimeout(client.downloadMedia(m, { thumb: 1 } as any), 8000).catch(() => undefined);
      return toBlobUrl(data);
    },

    async leave(id) {
      const e = entities.get(id);
      if (!e) return;
      for (let attempt = 0; ; attempt++) {
        try {
          await client.invoke(new Api.channels.LeaveChannel({ channel: e }));
          return;
        } catch (err: any) {
          // Telegram asks us to slow down: wait as long as it says, then retry.
          if (err?.seconds && attempt < 3) {
            await sleep((err.seconds + 1) * 1000);
            continue;
          }
          throw err;
        }
      }
    },

    async logout() {
      try {
        await client.invoke(new Api.auth.LogOut());
      } finally {
        clearSession();
        await client.disconnect().catch(() => undefined);
        clientPromise = null;
      }
    },
  };
}
