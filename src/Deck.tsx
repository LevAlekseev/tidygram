import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { useI18n } from './i18n';
import type { Action, ChannelDetails, ChannelSummary, Post } from './types';

const DAY = 86400;
const SWIPE_THRESHOLD = 90;

interface DeckProps {
  channel: ChannelSummary;
  position: number;
  total: number;
  leaveCount: number;
  canUndo: boolean;
  getDetails(id: string): Promise<ChannelDetails>;
  loadImage?(id: string, postId: number): Promise<string | undefined>;
  onDecide(action: Action): void;
  onUndo(): void;
  onFinish(): void;
}

export function Deck(props: DeckProps) {
  const { t } = useI18n();
  const { channel, onDecide, onUndo } = props;
  const [fly, setFly] = useState<Action | null>(null);
  const flying = useRef(false);

  const commit = (action: Action) => {
    if (flying.current) return;
    flying.current = true;
    setFly(action);
    // Let the card fly off the screen before the next one appears.
    setTimeout(() => {
      flying.current = false;
      setFly(null);
      onDecide(action);
    }, 200);
  };

  const commitRef = useRef(commit);
  commitRef.current = commit;
  const undoRef = useRef(onUndo);
  undoRef.current = onUndo;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowLeft') commitRef.current('leave');
      else if (e.key === 'ArrowRight') commitRef.current('keep');
      else if (e.key === 'ArrowUp') commitRef.current('later');
      else if (e.key === 'Backspace' || (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey))) undoRef.current();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="deck">
      <header className="topbar">
        <button className="btn ghost" onClick={onUndo} disabled={!props.canUndo}>
          ↶ {t('undo')}
        </button>
        <span className="counter">
          {props.position} / {props.total}
        </span>
        <button className="btn ghost" onClick={props.onFinish}>
          {t('finish')}
          {props.leaveCount > 0 && <span className="pill">{props.leaveCount}</span>}
        </button>
      </header>

      <div className="stage">
        <Card
          key={channel.id}
          channel={channel}
          fly={fly}
          getDetails={props.getDetails}
          loadImage={props.loadImage}
          onSwipe={commit}
        />
      </div>

      <footer className="actions">
        <button className="round leave" onClick={() => commit('leave')} aria-label={t('leave')}>
          <span aria-hidden>✕</span>
          <small>{t('leave')}</small>
        </button>
        <button className="round later" onClick={() => commit('later')} aria-label={t('later')}>
          <span aria-hidden>↻</span>
          <small>{t('later')}</small>
        </button>
        <button className="round keep" onClick={() => commit('keep')} aria-label={t('keep')}>
          <span aria-hidden>♥</span>
          <small>{t('keep')}</small>
        </button>
      </footer>
      <p className="keys-hint">{t('keysHint')}</p>
    </div>
  );
}

interface CardProps {
  channel: ChannelSummary;
  fly: Action | null;
  getDetails(id: string): Promise<ChannelDetails>;
  loadImage?(id: string, postId: number): Promise<string | undefined>;
  onSwipe(action: Action): void;
}

function Card({ channel, fly, getDetails, loadImage, onSwipe }: CardProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const [details, setDetails] = useState<ChannelDetails | null>(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; lock: 'h' | 'v' | null; dx: number } | null>(null);

  useEffect(() => {
    let alive = true;
    getDetails(channel.id)
      .then((d) => alive && setDetails(d))
      .catch(() => alive && setDetails({ posts: [] }));
    return () => {
      alive = false;
    };
  }, [channel.id, getDetails]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, lock: null, dx: 0 };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const mx = e.clientX - d.x;
    const my = e.clientY - d.y;
    if (!d.lock) {
      if (Math.hypot(mx, my) < 8) return;
      // Horizontal movement swipes the card, vertical movement scrolls the posts.
      d.lock = Math.abs(mx) > Math.abs(my) ? 'h' : 'v';
      if (d.lock === 'h') {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }
    }
    if (d.lock === 'h') {
      d.dx = mx;
      setDx(mx);
    }
  };

  const onPointerEnd = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.lock !== 'h') return;
    setDragging(false);
    if (Math.abs(d.dx) > SWIPE_THRESHOLD) onSwipe(d.dx < 0 ? 'leave' : 'keep');
    else setDx(0);
  };

  let transform = `translateX(${dx}px) rotate(${dx / 24}deg)`;
  if (fly === 'leave') transform = 'translateX(-140%) rotate(-16deg)';
  if (fly === 'keep') transform = 'translateX(140%) rotate(16deg)';
  if (fly === 'later') transform = 'translateY(-120%)';
  const style: CSSProperties = { transform, transition: dragging ? 'none' : 'transform 0.2s ease-out' };

  const pull = Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD);
  const keepOpacity = fly === 'keep' ? 1 : dx > 0 ? pull : 0;
  const leaveOpacity = fly === 'leave' ? 1 : dx < 0 ? pull : 0;

  const age = channel.lastPostAt === null ? Infinity : Date.now() / 1000 - channel.lastPostAt;
  const tone = age > 365 * DAY ? 'dead' : age > 90 * DAY ? 'stale' : 'alive';
  const badge =
    channel.lastPostAt === null
      ? t('noPosts')
      : t(tone === 'dead' ? 'dead' : 'lastPost', { ago: i18n.ago(channel.lastPostAt) });

  const subscribers = details?.subscribers ?? channel.subscribers;

  return (
    <article
      className={'card' + (dragging ? ' dragging' : '')}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <div className="stamp keep" style={{ opacity: keepOpacity }}>
        {t('stampKeep')}
      </div>
      <div className="stamp leave" style={{ opacity: leaveOpacity }}>
        {t('stampLeave')}
      </div>

      <header className="card-head">
        <Avatar id={channel.id} title={channel.title} url={details?.avatarUrl} />
        <div className="card-title">
          <h2>{channel.title}</h2>
          <p className="muted">
            {channel.username ? '@' + channel.username : t('privateChannel')}
            {subscribers ? ' · ' + t('subscribers', { n: i18n.num(subscribers) }) : ''}
          </p>
        </div>
      </header>

      <div className={'badge ' + tone}>{badge}</div>

      <div className="card-body">
        <ul className="chips">
          {channel.joinedAt && <li>{t('joined', { ago: i18n.ago(channel.joinedAt) })}</li>}
          {channel.unread > 0 && <li>{t('unread', { n: i18n.num(channel.unread) })}</li>}
          {channel.muted && <li>{t('muted')}</li>}
          {channel.archived && <li>{t('archived')}</li>}
        </ul>

        {channel.isPrivate && <p className="warn">{t('privateWarn')}</p>}
        {details?.about && <p className="about">{details.about}</p>}

        <h3>{t('latestPosts')}</h3>
        {!details && <p className="muted">{t('loadingPosts')}</p>}
        {details && details.posts.length === 0 && <p className="muted">{t('noPostsYet')}</p>}
        {details?.posts.map((post) => (
          <PostView key={post.id} post={post} load={loadImage && (() => loadImage(channel.id, post.id))} />
        ))}
      </div>
    </article>
  );
}

function Avatar({ id, title, url }: { id: string; title: string; url?: string }) {
  if (url) return <img className="avatar" src={url} alt="" draggable={false} />;
  let hash = 0;
  for (const ch of id + title) hash = (hash * 131 + ch.charCodeAt(0) * 47) % 360;
  const letter = Array.from(title.trim())[0]?.toUpperCase() || '?';
  return (
    <div className="avatar" style={{ background: `hsl(${hash} 55% 45%)` }} aria-hidden>
      {letter}
    </div>
  );
}

function PostView({ post, load }: { post: Post; load?: () => Promise<string | undefined> }) {
  const i18n = useI18n();
  const { t } = i18n;
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<string>();
  const long = post.text.length > 320;

  useEffect(() => {
    if (post.media !== 'photo' || !load) return;
    let alive = true;
    load()
      .then((url) => alive && setImage(url))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  return (
    <section className="post">
      {image && <img className="post-image" src={image} alt="" draggable={false} />}
      {post.media && !image && <span className="media">{t(post.media)}</span>}
      {post.text && (
        <p className={long && !open ? 'clamp' : undefined} onClick={long ? () => setOpen(!open) : undefined}>
          {post.text}
        </p>
      )}
      <footer className="muted">
        {i18n.date(post.date)}
        {post.views ? ' · ' + t('views', { n: i18n.num(post.views) }) : ''}
      </footer>
    </section>
  );
}
