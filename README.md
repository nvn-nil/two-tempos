# Two Tempos

A getting-to-know-you game for two phones. Each card, you answer for yourself and guess your partner's answer.
Nothing shows until both of you have locked in. Then both phones reveal it together, with a "talk about it" prompt.

Built around one calm, plan-ahead person and one spontaneous, social person: social battery, recharging,
last-minute plans, how to invite each other to things, how to handle disagreements.

- **Card types:** sliders (place yourself, guess them), this-or-that (pick, guess), open answers.
- **Decks:** 8 / 12 / 16 / 24 cards, from light to deeper, drawn at random from 109 cards across 12 topics:
  Warm-up, Energy & recharge, Plans vs. spontaneity, Love & care, Playful, Dates & adventures, Home & habits,
  Our story, Growing up, Dreams & someday, Flirty, Deeper. Cards you have already played come last, so new rounds stay fresh.
- **Mini-games**, from the same lobby:
  - *Tic-tac-talk*: every square holds a quick question; claim it by answering out loud. Loser owes a compliment.
  - *Rock, paper, truth*: secret picks; the loser answers a question from the card pool.
  - *Fill the blank*: a fill-in-the-blank card game with original Silly and Deeper decks. You each play an answer
    card from your hand into the prompt, then both vote. Agree and that card scores; disagree and you both do.
- **Synced:** both phones move together. The next card comes only when you are *both* ready, so nobody gets rushed.
- **Skip** any card, no reason needed. Send **emoji reactions** that float up on the other phone.
- **Notes:** save "things to remember about each other". You get them all at the end, with a copy button.
- **End screen:** how well each of you read the other, where you're most in sync, where your tempos differ most.

## Play tonight (same Wi-Fi, no deploy)

```
node server.js
```
Then both phones open `http://<this-PC's-LAN-IP>:8787`. One taps **Start a room** and sends the link, the other joins.
(If Windows Firewall asks, allow Node on private networks.)

## Deploy (play from anywhere)

**Option A: Render (recommended, free).** Push this folder to a GitHub repo, then in Render choose
New → Web Service, pick the repo, build command: none, start command `node server.js`. Done.
The free tier sleeps when idle, so the first load can take ~30 s. Fly.io or Railway work the same way.

**Option B: static hosting, no server (what https://nvn-nil.github.io/two-tempos/ uses).**
Put just `index.html` on GitHub Pages, Netlify or Cloudflare Pages. With no `/api` server, the phones talk
through a free public MQTT broker (`broker.emqx.io`) over secure websockets, which works on any network.
Every message is end-to-end encrypted (AES-GCM, key derived from the 6-character room code) and topics are
hashed, so the broker only sees noise. Use another broker with `?broker=wss://host:port/path` (both phones must match).

Force a mode with `?transport=relay`, `?transport=mqtt` or `?transport=peer` (direct WebRTC; often blocked
on mobile networks and home routers, so it's opt-in only).

## How it works

- `index.html` holds the whole game: content, UI and sync. The room creator's phone is the source of truth.
  It keeps state in localStorage, so a refresh or locked screen resumes where you left off.
- The other phone gets a filtered view: never your answer before you've both locked in.
- `server.js` is a zero-dependency relay (Server-Sent Events + POST). It keeps rooms in memory only and stores no answers on disk.
- Add or edit cards in the `CARDS` array at the top of the script.
