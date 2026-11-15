import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Deck } from './Deck';
import { Login } from './Login';
import { I18nContext, detectLang, makeI18n, saveLang, type Lang } from './i18n';
import { createDemoBackend } from './telegram/demo';
import * as real from './telegram/real';
import type { Action, Backend, ChannelDetails, ChannelSummary, Decisions } from './types';

const REPO_URL = 'https://github.com/LevAlekseev/tidygram';
const DECISIONS_KEY = 'tidygram.decisions';

type Stage = 'boot' | 'landing' | 'loading' | 'deck' | 'review' | 'leaving' | 'done';

function loadDecisions(): Decisions {
  try {
    return JSON.parse(localStorage.getItem(DECISIONS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveDecisions(decisions: Decisions) {
  try {
    localStorage.setItem(DECISIONS_KEY, JSON.stringify(decisions));
  } catch {
    /* ignore */
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [lang, setLang] = useState<Lang>(detectLang);
  const i18n = useMemo(() => makeI18n(lang), [lang]);
  const { t } = i18n;

  const [stage, setStage] = useState<Stage>('boot');
  const [backend, setBackend] = useState<Backend | null>(null);
  const [channels, setChannels] = useState<Record<string, ChannelSummary>>({});
  const [total, setTotal] = useState(0);
  const [queue, setQueue] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<Decisions>({});
  const [history, setHistory] = useState<{ id: string; action: Action }[]>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [leaveTotal, setLeaveTotal] = useState(0);
  const [result, setResult] = useState({ left: 0, failed: 0 });
  const detailsCache = useRef(new Map<string, Promise<ChannelDetails>>());

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const start = useCallback(async (b: Backend) => {
    setBackend(b);
    setStage('loading');
    setError('');
    try {
      const list = await b.listChannels();
      // Dead channels first: the longer a channel has been silent, the earlier it shows up.
      list.sort((x, y) => (x.lastPostAt ?? 0) - (y.lastPostAt ?? 0));
      const saved = b.demo ? {} : loadDecisions();
      const known: Decisions = {};
      for (const c of list) if (saved[c.id]) known[c.id] = saved[c.id];
      const pending = list.filter((c) => !known[c.id]).map((c) => c.id);
      detailsCache.current = new Map();
      setChannels(Object.fromEntries(list.map((c) => [c.id, c])));
      setTotal(list.length);
      setDecisions(known);
      setQueue(pending);
      setHistory([]);
      setStage(pending.length ? 'deck' : 'review');
    } catch (e) {
      setError(real.errText(e));
      setBackend(null);
      setStage('landing');
    }
  }, []);

  const startReal = useCallback(async () => {
    start(await real.createTelegramBackend());
  }, [start]);

  // Resume a saved session, if there is one.
  useEffect(() => {
    (async () => {
      if (real.hasApiKey && real.hasSavedSession()) {
        try {
          if (await real.isAuthorized()) return startReal();
          real.clearSession();
        } catch {
          /* fall through to the landing page */
        }
      }
      setStage('landing');
    })();
  }, [startReal]);

  useEffect(() => {
    if (backend && !backend.demo && stage !== 'loading') saveDecisions(decisions);
  }, [backend, decisions, stage]);

  const getDetails = useCallback(
    (id: string) => {
      const cache = detailsCache.current;
      let p = cache.get(id);
      if (!p && backend) {
        p = backend.loadDetails(id);
        p.catch(() => cache.delete(id));
        cache.set(id, p);
      }
      return p ?? Promise.resolve({ posts: [] });
    },
    [backend],
  );

  // Warm up the next few cards so swiping feels instant.
  useEffect(() => {
    if (stage === 'deck') queue.slice(0, 4).forEach((id) => void getDetails(id).catch(() => undefined));
  }, [stage, queue, getDetails]);

  const decide = (action: Action) => {
    const id = queue[0];
    if (!id) return;
    setHistory((h) => [...h, { id, action }]);
    if (action === 'later') {
      setQueue((q) => [...q.slice(1), id]);
      return;
    }
    setDecisions((d) => ({ ...d, [id]: action }));
    setQueue((q) => q.slice(1));
    if (queue.length === 1) setStage('review');
  };

  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    setQueue((q) => [last.id, ...q.filter((id) => id !== last.id)]);
    if (last.action !== 'later') {
      setDecisions((d) => {
        const next = { ...d };
        delete next[last.id];
        return next;
      });
    }
    setStage('deck');
  };

  const leaveIds = Object.keys(decisions).filter((id) => decisions[id] === 'leave' && channels[id]);
  const keptCount = Object.keys(decisions).filter((id) => decisions[id] === 'keep' && channels[id]).length;

  const runLeave = async () => {
    if (!backend) return;
    const ids = leaveIds;
    setLeaveTotal(ids.length);
    setProgress(0);
    setStage('leaving');
    let left = 0;
    let failed = 0;
    for (const [i, id] of ids.entries()) {
      setProgress(i + 1);
      try {
        await backend.leave(id);
        left++;
        setDecisions((d) => {
          const next = { ...d };
          delete next[id];
          return next;
        });
        setChannels((c) => {
          const next = { ...c };
          delete next[id];
          return next;
        });
      } catch {
        failed++;
      }
      // Go slowly: Telegram rate-limits bursts of requests.
      if (i < ids.length - 1) await sleep(backend.demo ? 200 : 1200);
    }
    setTotal((n) => n - left);
    setResult({ left, failed });
    setHistory([]);
    setStage('done');
  };

  const reviewKept = () => {
    const kept = Object.keys(decisions).filter((id) => decisions[id] === 'keep' && channels[id]);
    kept.sort((x, y) => (channels[x].lastPostAt ?? 0) - (channels[y].lastPostAt ?? 0));
    setDecisions((d) => Object.fromEntries(Object.entries(d).filter(([, v]) => v !== 'keep')));
    setQueue((q) => [...kept, ...q]);
    setHistory([]);
    setStage('deck');
  };

  const exit = async () => {
    const b = backend;
    setBackend(null);
    setStage('landing');
    if (b && !b.demo) {
      try {
        localStorage.removeItem(DECISIONS_KEY);
      } catch {
        /* ignore */
      }
      await b.logout().catch(() => undefined);
    }
  };

  const toggleLang = () => {
    const next: Lang = lang === 'ru' ? 'en' : 'ru';
    saveLang(next);
    setLang(next);
  };

  const exitButton = backend && (
    <button className="btn link" onClick={exit} title={backend.demo ? undefined : t('logoutText')}>
      {backend.demo ? t('exitDemo') : t('logout')}
    </button>
  );

  let screen;
  if (stage === 'boot' || stage === 'loading') {
    screen = (
      <main className="center-screen">
        <div className="spinner" />
        <p className="muted">{t(stage === 'boot' ? 'connecting' : 'loadingChannels')}</p>
      </main>
    );
  } else if (stage === 'landing') {
    screen = (
      <main className="landing">
        <h1>tidygram</h1>
        <p className="tagline">{t('tagline')}</p>
        <p className="muted">{t('sub')}</p>

        {error && (
          <p className="error" role="alert">
            {i18n.error(error)}
          </p>
        )}

        <div className="panel">
          {real.hasApiKey ? <Login onDone={startReal} /> : <p className="muted">{t('noKey')}</p>}
        </div>

        <button className="btn secondary" onClick={() => start(createDemoBackend(lang))}>
          {t('tryDemo')}
        </button>

        <ul className="trust">
          <li>
            <strong>{t('trust1')}</strong>
            <span>{t('trust1Text')}</span>
          </li>
          <li>
            <strong>{t('trust2')}</strong>
            <span>{t('trust2Text')}</span>
          </li>
          <li>
            <strong>{t('trust3')}</strong>
            <span>{t('trust3Text')}</span>
          </li>
        </ul>

        <footer className="foot">
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            {t('source')}
          </a>
          <button className="btn link" onClick={toggleLang}>
            {t('language')}
          </button>
        </footer>
      </main>
    );
  } else if (stage === 'deck' && queue[0] && channels[queue[0]]) {
    screen = (
      <Deck
        channel={channels[queue[0]]}
        position={total - queue.length + 1}
        total={total}
        leaveCount={leaveIds.length}
        canUndo={history.length > 0}
        getDetails={getDetails}
        loadImage={backend?.loadImage}
        onDecide={decide}
        onUndo={undo}
        onFinish={() => setStage('review')}
      />
    );
  } else if (stage === 'leaving') {
    screen = (
      <main className="center-screen">
        <div className="spinner" />
        <h2>{t('leaving', { i: progress, n: leaveTotal })}</h2>
        <p className="muted">{t('leavingText')}</p>
      </main>
    );
  } else if (stage === 'done') {
    screen = (
      <main className="summary">
        <h1>{t('doneTitle')}</h1>
        <p className="tagline">
          {result.left > 0
            ? t('doneLeft', { n: result.left, channels: i18n.channelsWord(result.left) })
            : t('doneNone')}
        </p>
        {result.failed > 0 && <p className="error">{t('doneFailed', { n: result.failed })}</p>}
        <ul className="stats">
          <li>{t('doneKept', { n: keptCount })}</li>
          <li>{t('doneRemaining', { n: queue.length })}</li>
        </ul>
        {queue.length > 0 && (
          <button className="btn primary" onClick={() => setStage('deck')}>
            {t('continueSorting')}
          </button>
        )}
        {result.failed > 0 && (
          <button className="btn secondary" onClick={() => setStage('review')}>
            {t('confirmLeave', { n: leaveIds.length, channels: i18n.channelsWord(leaveIds.length) })}
          </button>
        )}
        {keptCount > 0 && (
          <button className="btn secondary" onClick={reviewKept}>
            {t('reviewKept')}
          </button>
        )}
        {exitButton}
      </main>
    );
  } else {
    // Review: the only place where channels are actually left, and only after this confirmation.
    screen = (
      <main className="summary">
        {leaveIds.length > 0 ? (
          <>
            <h1>{t('reviewTitle', { n: leaveIds.length, channels: i18n.channelsWord(leaveIds.length) })}</h1>
            <p className="muted">{t('reviewText')}</p>
            <ul className="review-list">
              {leaveIds.map((id) => (
                <li key={id}>
                  <div>
                    <strong>{channels[id].title}</strong>
                    <span className="muted">
                      {channels[id].lastPostAt === null
                        ? t('noPosts')
                        : t('lastPost', { ago: i18n.ago(channels[id].lastPostAt!) })}
                      {channels[id].isPrivate ? ' · ' + t('privateChannel') : ''}
                    </span>
                  </div>
                  <button className="btn ghost" onClick={() => setDecisions((d) => ({ ...d, [id]: 'keep' }))}>
                    {t('keepThis')}
                  </button>
                </li>
              ))}
            </ul>
            <button className="btn danger" onClick={runLeave}>
              {t('confirmLeave', { n: leaveIds.length, channels: i18n.channelsWord(leaveIds.length) })}
            </button>
          </>
        ) : (
          <>
            <h1>{t('doneTitle')}</h1>
            <p className="muted">{t('reviewEmpty')}</p>
            <ul className="stats">
              <li>{t('doneKept', { n: keptCount })}</li>
              <li>{t('doneRemaining', { n: queue.length })}</li>
            </ul>
          </>
        )}
        {queue.length > 0 && (
          <button className="btn secondary" onClick={() => setStage('deck')}>
            {t('backToCards')}
          </button>
        )}
        {history.length > 0 && queue.length === 0 && (
          <button className="btn secondary" onClick={undo}>
            ↶ {t('undo')}
          </button>
        )}
        {leaveIds.length === 0 && keptCount > 0 && (
          <button className="btn secondary" onClick={reviewKept}>
            {t('reviewKept')}
          </button>
        )}
        {exitButton}
      </main>
    );
  }

  return (
    <I18nContext.Provider value={i18n}>
      <div className="app">
        {backend?.demo && stage !== 'landing' && <div className="demo-banner">{t('demoBanner')}</div>}
        {screen}
      </div>
    </I18nContext.Provider>
  );
}
