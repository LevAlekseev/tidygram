/** Fake data so anyone can try the app without logging in. Talks to nothing. */
import type { Lang } from '../i18n';
import type { Backend, ChannelDetails, ChannelSummary, MediaKind } from '../types';

const DAY = 86400;

interface DemoPost {
  ago: number;
  ru: string;
  en: string;
  views: number;
  media?: MediaKind;
}

interface DemoChannel {
  id: string;
  ru: string;
  en: string;
  username?: string;
  lastAgo: number | null;
  joinedAgo: number;
  unread: number;
  muted?: boolean;
  archived?: boolean;
  subscribers: number;
  aboutRu: string;
  aboutEn: string;
  posts: DemoPost[];
}

const CHANNELS: DemoChannel[] = [
  {
    id: 'd1',
    ru: 'Крипто Сигналы 2021',
    en: 'Crypto Signals 2021',
    username: 'demo_crypto_signals',
    lastAgo: 1290,
    joinedAgo: 1700,
    unread: 0,
    muted: true,
    subscribers: 48200,
    aboutRu: 'Лучшие сигналы рынка. Иксы каждый день!',
    aboutEn: 'Best market signals. Gains every day!',
    posts: [
      { ago: 1290, ru: 'Друзья, берём небольшую паузу. Скоро вернёмся с новыми сигналами!', en: 'Friends, we are taking a short break. Back soon with new signals!', views: 3100 },
      { ago: 1296, ru: 'Сегодня без сделок, рынок в боковике.', en: 'No trades today, the market is flat.', views: 4200 },
    ],
  },
  {
    id: 'd2',
    ru: 'Марафон «Английский за 30 дней»',
    en: '30-Day English Marathon',
    lastAgo: 930,
    joinedAgo: 960,
    unread: 14,
    archived: true,
    subscribers: 812,
    aboutRu: 'Закрытый канал участников марафона.',
    aboutEn: 'Private channel for marathon participants.',
    posts: [
      { ago: 930, ru: 'День 30. Вы молодцы! Сертификаты отправим на почту.', en: 'Day 30. Well done! Certificates will be emailed.', views: 640, media: 'photo' },
      { ago: 931, ru: 'День 29. Повторяем неправильные глаголы.', en: 'Day 29. Revising irregular verbs.', views: 655 },
    ],
  },
  {
    id: 'd3',
    ru: 'Скидки и промокоды',
    en: 'Deals & Promo Codes',
    username: 'demo_deals',
    lastAgo: 505,
    joinedAgo: 1100,
    unread: 0,
    muted: true,
    subscribers: 126000,
    aboutRu: 'Каждый день находим лучшие скидки.',
    aboutEn: 'We find the best deals every day.',
    posts: [
      { ago: 505, ru: 'Канал переезжает! Новая ссылка в закрепе.', en: 'The channel is moving! New link in the pinned post.', views: 21000 },
      { ago: 512, ru: 'Наушники −40% только сегодня.', en: 'Headphones 40% off, today only.', views: 18400, media: 'photo' },
    ],
  },
  {
    id: 'd4',
    ru: 'Конференция DevDays 2023',
    en: 'DevDays 2023 Conference',
    username: 'demo_devdays23',
    lastAgo: 410,
    joinedAgo: 480,
    unread: 3,
    subscribers: 2300,
    aboutRu: 'Официальный канал конференции. Расписание, трансляции, объявления.',
    aboutEn: 'Official conference channel. Schedule, streams, announcements.',
    posts: [
      { ago: 410, ru: 'Записи всех докладов выложены. Спасибо, что были с нами!', en: 'All talk recordings are published. Thanks for joining us!', views: 1900, media: 'video' },
    ],
  },
  {
    id: 'd5',
    ru: 'Рецепты на каждый день',
    en: 'Everyday Recipes',
    username: 'demo_recipes',
    lastAgo: 140,
    joinedAgo: 800,
    unread: 212,
    muted: true,
    subscribers: 54000,
    aboutRu: 'Простые рецепты из доступных продуктов.',
    aboutEn: 'Simple recipes from everyday ingredients.',
    posts: [
      { ago: 140, ru: 'Тыквенный суп за 20 минут: тыква, сливки, щепотка мускатного ореха.', en: 'Pumpkin soup in 20 minutes: pumpkin, cream, a pinch of nutmeg.', views: 9800, media: 'photo' },
      { ago: 155, ru: 'Что приготовить из трёх яиц и вчерашнего риса?', en: 'What to cook with three eggs and yesterday’s rice?', views: 11200 },
    ],
  },
  {
    id: 'd6',
    ru: 'Пустой канал',
    en: 'Empty Channel',
    lastAgo: null,
    joinedAgo: 1500,
    unread: 0,
    subscribers: 4,
    aboutRu: '',
    aboutEn: '',
    posts: [],
  },
  {
    id: 'd7',
    ru: 'Новости технологий',
    en: 'Tech News',
    username: 'demo_technews',
    lastAgo: 0.2,
    joinedAgo: 620,
    unread: 37,
    subscribers: 310000,
    aboutRu: 'Главное из мира технологий, без воды.',
    aboutEn: 'What matters in tech, no fluff.',
    posts: [
      { ago: 0.2, ru: 'Вышло большое обновление популярного браузера: вертикальные вкладки и встроенный переводчик.', en: 'A major browser update is out: vertical tabs and a built-in translator.', views: 42000 },
      { ago: 0.6, ru: 'Опрос: каким мессенджером вы пользуетесь чаще всего?', en: 'Poll: which messenger do you use the most?', views: 51000, media: 'poll' },
      { ago: 1.1, ru: 'Разбираем, почему ноутбуки снова стали толще.', en: 'Why laptops are getting thicker again.', views: 60300, media: 'photo' },
    ],
  },
  {
    id: 'd8',
    ru: 'Заметки о путешествиях',
    en: 'Travel Notes',
    username: 'demo_travelnotes',
    lastAgo: 3,
    joinedAgo: 240,
    unread: 2,
    subscribers: 7400,
    aboutRu: 'Авторский канал о поездках по небольшим городам.',
    aboutEn: 'A personal channel about trips to small towns.',
    posts: [
      { ago: 3, ru: 'Три дня в горах: маршрут, бюджет и где поесть.', en: 'Three days in the mountains: route, budget and where to eat.', views: 3900, media: 'photo' },
      { ago: 9, ru: 'Как я опоздал на последний автобус и не пожалел.', en: 'How I missed the last bus and didn’t regret it.', views: 4100 },
    ],
  },
];

export function createDemoBackend(lang: Lang): Backend {
  const now = Math.floor(Date.now() / 1000);
  const at = (days: number) => Math.floor(now - days * DAY);
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  return {
    demo: true,

    async listChannels() {
      await sleep(500);
      return CHANNELS.map<ChannelSummary>((c) => ({
        id: c.id,
        title: c[lang],
        username: c.username,
        lastPostAt: c.lastAgo === null ? null : at(c.lastAgo),
        joinedAt: at(c.joinedAgo),
        unread: c.unread,
        muted: !!c.muted,
        archived: !!c.archived,
        isPrivate: !c.username,
        subscribers: c.subscribers,
      }));
    },

    async loadDetails(id) {
      await sleep(250);
      const c = CHANNELS.find((x) => x.id === id);
      if (!c) return { posts: [] };
      const details: ChannelDetails = {
        about: (lang === 'ru' ? c.aboutRu : c.aboutEn) || undefined,
        subscribers: c.subscribers,
        posts: c.posts.map((p, i) => ({
          id: i + 1,
          date: at(p.ago),
          text: p[lang],
          views: p.views,
          media: p.media,
        })),
      };
      return details;
    },

    async leave() {
      await sleep(200);
    },

    async logout() {},
  };
}
