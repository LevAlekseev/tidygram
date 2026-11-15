import { createContext, useContext } from 'react';

export type Lang = 'ru' | 'en';

const en = {
  tagline: 'Swipe left to unsubscribe. Swipe right to keep.',
  sub: 'Clean up years of forgotten Telegram channels in a few minutes. Dead channels come first.',
  trust1: 'No server',
  trust1Text: 'This page talks to Telegram directly from your browser. Your data has nowhere else to go.',
  trust2: 'Nothing happens without you',
  trust2Text: 'You approve the final list before tidygram leaves a single channel.',
  trust3: 'Open source',
  trust3Text: 'Every line of code is public. Anyone can check how it works.',
  source: 'Source code on GitHub',
  tryDemo: 'Try the demo without logging in',
  noKey: 'Telegram login is not configured in this build. You can still try the demo.',
  loginTitle: 'Log in with Telegram',
  qrStep1: 'Open Telegram on your phone',
  qrStep2: 'Go to Settings → Devices → Link Desktop Device',
  qrStep3: 'Point the camera at this code',
  usePhone: 'Log in with a phone number instead',
  useQr: 'Log in with a QR code instead',
  phoneLabel: 'Phone number, with country code',
  sendCode: 'Send code',
  codeLabel: 'Code from Telegram',
  codeHelp: 'Telegram sent a login code to your Telegram app.',
  passwordLabel: 'Two-step verification password',
  passwordHelp: 'Your account has an extra password. It is sent only to Telegram.',
  hint: 'Hint: {hint}',
  continue: 'Continue',
  connecting: 'Connecting to Telegram…',
  loadingChannels: 'Loading your channels…',
  demoBanner: 'Demo: made-up channels, nothing is real',
  noPosts: 'No posts at all',
  dead: 'Dead · last post {ago}',
  lastPost: 'Last post {ago}',
  privateChannel: 'Private channel',
  privateWarn: 'Private: after leaving you can only come back with an invite link.',
  subscribers: '{n} subscribers',
  joined: 'Joined {ago}',
  unread: '{n} unread',
  muted: 'Muted',
  archived: 'Archived',
  latestPosts: 'Latest posts',
  noPostsYet: 'There is nothing to read in this channel.',
  loadingPosts: 'Loading posts…',
  views: '{n} views',
  photo: 'Photo',
  video: 'Video',
  audio: 'Audio',
  file: 'File',
  poll: 'Poll',
  other: 'Attachment',
  leave: 'Unsubscribe',
  keep: 'Keep',
  later: 'Later',
  undo: 'Undo',
  finish: 'Finish',
  stampKeep: 'KEEP',
  stampLeave: 'LEAVE',
  keysHint: '← unsubscribe · → keep · ↑ later',
  reviewTitle: 'Unsubscribe from {n} {channels}?',
  reviewText: 'Nothing has been changed yet. Check the list and take back anything you want to keep.',
  reviewEmpty: 'You have not marked any channels to leave.',
  keepThis: 'Keep',
  confirmLeave: 'Unsubscribe from {n} {channels}',
  backToCards: 'Back to cards',
  leaving: 'Unsubscribing… {i} of {n}',
  leavingText: 'Keep this page open. We go slowly so Telegram does not block the requests.',
  doneTitle: 'Done',
  doneLeft: 'You left {n} {channels}.',
  doneNone: 'No channels were left.',
  doneFailed: '{n} could not be left. They stay in your list, you can try again.',
  doneKept: 'Kept: {n}',
  doneRemaining: 'Still to review: {n}',
  continueSorting: 'Continue sorting',
  reviewKept: 'Review kept channels again',
  logout: 'Log out',
  logoutText: 'Ends the tidygram session and erases it from this browser.',
  exitDemo: 'Exit demo',
  language: 'Русский',
  err_PHONE_NUMBER_INVALID: 'This phone number looks wrong. Include the country code, for example +1…',
  err_PHONE_CODE_INVALID: 'Wrong code. Try again.',
  err_PHONE_CODE_EXPIRED: 'The code expired. Request a new one.',
  err_PASSWORD_HASH_INVALID: 'Wrong password. Try again.',
  err_FLOOD: 'Too many attempts. Telegram asks to wait a while before trying again.',
  err_generic: 'Something went wrong: {message}',
};

const ru: typeof en = {
  tagline: 'Свайп влево — отписаться. Свайп вправо — оставить.',
  sub: 'Разберите Telegram-каналы, накопившиеся за годы, за несколько минут. Сначала идут мёртвые.',
  trust1: 'Нет сервера',
  trust1Text: 'Страница общается с Telegram напрямую из вашего браузера. Данным больше некуда уходить.',
  trust2: 'Ничего без вашего согласия',
  trust2Text: 'tidygram не отпишется ни от одного канала, пока вы не одобрите итоговый список.',
  trust3: 'Открытый код',
  trust3Text: 'Весь код опубликован. Любой может проверить, как это работает.',
  source: 'Исходный код на GitHub',
  tryDemo: 'Попробовать демо без входа',
  noKey: 'В этой сборке вход в Telegram не настроен. Можно попробовать демо.',
  loginTitle: 'Войти через Telegram',
  qrStep1: 'Откройте Telegram на телефоне',
  qrStep2: 'Зайдите в Настройки → Устройства → Подключить устройство',
  qrStep3: 'Наведите камеру на этот код',
  usePhone: 'Войти по номеру телефона',
  useQr: 'Войти по QR-коду',
  phoneLabel: 'Номер телефона с кодом страны',
  sendCode: 'Получить код',
  codeLabel: 'Код из Telegram',
  codeHelp: 'Telegram прислал код для входа в ваше приложение Telegram.',
  passwordLabel: 'Пароль двухэтапной проверки',
  passwordHelp: 'У аккаунта есть дополнительный пароль. Он отправляется только в Telegram.',
  hint: 'Подсказка: {hint}',
  continue: 'Продолжить',
  connecting: 'Подключаемся к Telegram…',
  loadingChannels: 'Загружаем ваши каналы…',
  demoBanner: 'Демо: каналы выдуманы, всё понарошку',
  noPosts: 'Постов нет совсем',
  dead: 'Мёртвый · последний пост {ago}',
  lastPost: 'Последний пост {ago}',
  privateChannel: 'Приватный канал',
  privateWarn: 'Приватный: вернуться после отписки можно только по ссылке-приглашению.',
  subscribers: '{n} подписчиков',
  joined: 'Подписка оформлена {ago}',
  unread: 'Непрочитанных: {n}',
  muted: 'Без звука',
  archived: 'В архиве',
  latestPosts: 'Последние посты',
  noPostsYet: 'В этом канале нечего читать.',
  loadingPosts: 'Загружаем посты…',
  views: 'Просмотров: {n}',
  photo: 'Фото',
  video: 'Видео',
  audio: 'Аудио',
  file: 'Файл',
  poll: 'Опрос',
  other: 'Вложение',
  leave: 'Отписаться',
  keep: 'Оставить',
  later: 'Позже',
  undo: 'Отменить',
  finish: 'Завершить',
  stampKeep: 'ОСТАВИТЬ',
  stampLeave: 'ОТПИСАТЬСЯ',
  keysHint: '← отписаться · → оставить · ↑ позже',
  reviewTitle: 'Отписаться от {n} {channels}?',
  reviewText: 'Пока ничего не изменено. Проверьте список и верните то, что хотите оставить.',
  reviewEmpty: 'Вы не отметили ни одного канала на отписку.',
  keepThis: 'Оставить',
  confirmLeave: 'Отписаться от {n} {channels}',
  backToCards: 'Назад к карточкам',
  leaving: 'Отписываемся… {i} из {n}',
  leavingText: 'Не закрывайте страницу. Мы не торопимся, чтобы Telegram не заблокировал запросы.',
  doneTitle: 'Готово',
  doneLeft: 'Вы отписались от {n} {channels}.',
  doneNone: 'Вы ни от чего не отписались.',
  doneFailed: 'Не удалось отписаться: {n}. Они остались в списке, можно попробовать снова.',
  doneKept: 'Оставлено: {n}',
  doneRemaining: 'Осталось разобрать: {n}',
  continueSorting: 'Продолжить разбор',
  reviewKept: 'Пересмотреть оставленные каналы',
  logout: 'Выйти',
  logoutText: 'Завершает сессию tidygram и стирает её из этого браузера.',
  exitDemo: 'Выйти из демо',
  language: 'English',
  err_PHONE_NUMBER_INVALID: 'Похоже, номер указан неверно. Введите его с кодом страны, например +7…',
  err_PHONE_CODE_INVALID: 'Неверный код. Попробуйте ещё раз.',
  err_PHONE_CODE_EXPIRED: 'Код устарел. Запросите новый.',
  err_PASSWORD_HASH_INVALID: 'Неверный пароль. Попробуйте ещё раз.',
  err_FLOOD: 'Слишком много попыток. Telegram просит подождать перед новой.',
  err_generic: 'Что-то пошло не так: {message}',
};

const dict = { en, ru };
export type Key = keyof typeof en;

/** Genitive forms after "from N …": en [one, other], ru [one, few, many]. */
const channelForms: Record<Lang, string[]> = {
  en: ['channel', 'channels'],
  ru: ['канала', 'каналов', 'каналов'],
};

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem('tidygram.lang');
    if (saved === 'ru' || saved === 'en') return saved;
  } catch {
    /* ignore */
  }
  return /^(ru|uk|be|kk)\b/i.test(navigator.language) ? 'ru' : 'en';
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem('tidygram.lang', lang);
  } catch {
    /* ignore */
  }
}

export interface I18n {
  lang: Lang;
  t(key: Key, vars?: Record<string, string | number>): string;
  /** "3 hours ago", "2 years ago" for a unix timestamp in seconds. */
  ago(unix: number): string;
  num(n: number): string;
  date(unix: number): string;
  channelsWord(n: number): string;
  error(message: string): string;
}

export function makeI18n(lang: Lang): I18n {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'always' });
  const compact = new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 });
  const dateFmt = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric' });
  const rules = new Intl.PluralRules(lang);

  const t: I18n['t'] = (key, vars) =>
    dict[lang][key].replace(/\{(\w+)\}/g, (_, name) => String(vars?.[name] ?? ''));

  return {
    lang,
    t,
    ago(unix) {
      const sec = Math.max(0, Date.now() / 1000 - unix);
      const day = 86400;
      if (sec >= 365 * day) return rtf.format(-Math.floor(sec / (365 * day)), 'year');
      if (sec >= 30 * day) return rtf.format(-Math.floor(sec / (30 * day)), 'month');
      if (sec >= day) return rtf.format(-Math.floor(sec / day), 'day');
      if (sec >= 3600) return rtf.format(-Math.floor(sec / 3600), 'hour');
      return rtf.format(-Math.max(1, Math.floor(sec / 60)), 'minute');
    },
    num: (n) => compact.format(n),
    date: (unix) => dateFmt.format(new Date(unix * 1000)),
    channelsWord(n) {
      const forms = channelForms[lang];
      const rule = rules.select(n);
      if (lang === 'en') return rule === 'one' ? forms[0] : forms[1];
      return rule === 'one' ? forms[0] : rule === 'few' ? forms[1] : forms[2];
    },
    error(message) {
      if (/FLOOD/.test(message)) return t('err_FLOOD');
      const key = ('err_' + message) as Key;
      return key in dict[lang] ? t(key) : t('err_generic', { message });
    },
  };
}

export const I18nContext = createContext<I18n>(makeI18n('en'));
export const useI18n = () => useContext(I18nContext);
