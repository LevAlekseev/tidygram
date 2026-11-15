# tidygram

**Swipe left to unsubscribe. Swipe right to keep.**
A simple, open-source way to clean up years of forgotten Telegram channels.

[Русская версия ниже](#tidygram-по-русски)

> **Status: early development.** The first version works in demo mode with made-up channels. Logging in with a real Telegram account is implemented but not yet tested, and there is no hosted site yet.

## The problem

After a few years on Telegram you are subscribed to hundreds of channels. Half of them are dead, and you don't remember why you joined the rest. Cleaning them up one by one in Telegram is slow and boring.

## How tidygram works

1. You log in with your Telegram account (QR code or phone number).
2. tidygram shows your channels one at a time, as cards. **Dead channels come first** — the ones that haven't posted for the longest time.
3. Each card shows the channel's description, subscriber count, when it last posted, and its latest posts, so you can decide in seconds.
4. **Swipe left** to unsubscribe, **swipe right** to keep, or tap **Later** to decide later. On a computer the arrow keys do the same.
5. Nothing happens immediately. At the end you see the full list of channels you chose to leave, and you confirm it. Until then you can undo anything.

Planned next: going through groups, and then private chats, the same way.

## Your data is safe

tidygram needs access to your Telegram account to see your subscriptions, so it is built to need as little trust as possible:

- **No server.** tidygram is a web page that talks directly to Telegram from your browser. There is no tidygram backend, so there is nowhere for your data to be sent.
- **Your session stays on your device.** The login is stored only in your browser. Log out and it is gone.
- **Open source.** Every line of code is in this repository. Anyone can read it and check these claims.
- **No tracking, no analytics, no ads.**
- **Nothing is deleted without your confirmation.** Unsubscribing happens only after you approve the final list.
- You can end tidygram's session at any time from Telegram itself: *Settings → Devices*.

## What tidygram does not do

- It does not read or store your private messages on any server.
- It does not post, send messages, or join anything on your behalf.
- It does not unsubscribe you from channels you own or administer.

## Tech

React + TypeScript, [GramJS](https://github.com/gram-js/gramjs) (Telegram MTProto client for the browser), built with Vite, hosted as a static site.

Everything tidygram asks Telegram to do lives in one file: [`src/telegram/real.ts`](src/telegram/real.ts).

## Run it yourself

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Open the address it prints. The demo works right away. To log in with a real account, get an `api_id` and `api_hash` at [my.telegram.org](https://my.telegram.org) → *API development tools*, copy `.env.example` to `.env.local` and fill them in.

## License

[MIT](LICENSE)

tidygram is an independent project. It is not affiliated with or endorsed by Telegram.

---

# tidygram по-русски

**Свайп влево — отписаться. Свайп вправо — оставить.**
Простой способ с открытым кодом разобрать Telegram-каналы, накопившиеся за годы.

> **Статус: ранняя разработка.** Первая версия работает в демо-режиме с выдуманными каналами. Вход в настоящий аккаунт Telegram написан, но ещё не проверен, и размещённого сайта пока нет.

## Проблема

За несколько лет в Telegram набираются сотни подписок. Половина каналов давно мертва, а зачем вы подписались на остальные — уже не вспомнить. Чистить их по одному в самом Telegram долго и скучно.

## Как работает tidygram

1. Вы входите через свой аккаунт Telegram (QR-код или номер телефона).
2. tidygram показывает каналы по одному, в виде карточек. **Сначала идут мёртвые каналы** — те, где дольше всего не было публикаций.
3. На карточке — описание канала, число подписчиков, дата последнего поста и сами последние посты. Решение принимается за секунды.
4. **Свайп влево** — отписаться, **свайп вправо** — оставить, кнопка **«Позже»** — решить позже. На компьютере то же самое делают стрелки на клавиатуре.
5. Сразу ничего не происходит. В конце вы видите полный список каналов «на выход» и подтверждаете его. До этого любое решение можно отменить.

В планах: так же пройтись по группам, а затем и по личным чатам.

## Ваши данные в безопасности

Чтобы увидеть ваши подписки, tidygram нужен доступ к аккаунту Telegram. Поэтому он устроен так, чтобы доверять ему приходилось как можно меньше:

- **Нет сервера.** tidygram — это веб-страница, которая общается с Telegram напрямую из вашего браузера. У tidygram нет своего сервера, значит, данные некуда отправлять.
- **Сессия хранится только на вашем устройстве.** Вход сохраняется только в вашем браузере. Вышли — и его больше нет.
- **Открытый код.** Весь код лежит в этом репозитории. Любой может прочитать его и проверить эти утверждения.
- **Никакой слежки, аналитики и рекламы.**
- **Ничего не удаляется без подтверждения.** Отписка происходит только после того, как вы одобрите итоговый список.
- Сессию tidygram можно в любой момент завершить из самого Telegram: *Настройки → Устройства*.

## Чего tidygram не делает

- Не читает и не хранит ваши личные сообщения ни на каком сервере.
- Не публикует, не отправляет сообщения и никуда не вступает от вашего имени.
- Не отписывает вас от каналов, которыми вы владеете или управляете.

## Технологии

React + TypeScript, [GramJS](https://github.com/gram-js/gramjs) (клиент Telegram MTProto для браузера), сборка на Vite, размещение как статический сайт.

Всё, что tidygram просит у Telegram, находится в одном файле: [`src/telegram/real.ts`](src/telegram/real.ts).

## Запустить самому

Нужен [Node.js](https://nodejs.org) версии 20 или новее.

```bash
npm install
npm run dev
```

Откройте адрес, который появится в терминале. Демо работает сразу. Чтобы войти в настоящий аккаунт, получите `api_id` и `api_hash` на [my.telegram.org](https://my.telegram.org) → *API development tools*, скопируйте `.env.example` в `.env.local` и впишите их туда.

## Лицензия

[MIT](LICENSE)

tidygram — независимый проект. Он не связан с Telegram и не одобрен им.
