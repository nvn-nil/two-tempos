# Two Tempos

A getting-to-know-you game for two phones. Each card, you answer for yourself and guess your partner's answer.
Nothing shows until both of you have locked in. Then both phones reveal it together, with a "talk about it" prompt.

Built around one calm, plan-ahead person and one spontaneous, social person: social battery, recharging,
last-minute plans, how to invite each other to things, how to handle disagreements.

- **Card types:** sliders (place yourself, guess them), this-or-that (pick, guess), open answers.
- **Decks:** 8 / 12 / 16 cards, from light to deeper. Pick from Warm-up, Energy & recharge, Plans vs. spontaneity, Love & care, Playful, Deeper.
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

**Option B: static hosting, no server.** Put just `index.html` on GitHub Pages, Netlify Drop or Cloudflare Pages.
With no `/api` server, the page switches to peer-to-peer mode (PeerJS, free public broker).
Works on most networks. Some mobile carriers block direct peer connections, so if you get stuck on
"Finding your partner…" over 4G/5G, use Option A.

Force a mode with `?transport=relay` or `?transport=peer`.

## How it works

- `index.html` holds the whole game: content, UI and sync. The room creator's phone is the source of truth.
  It keeps state in localStorage, so a refresh or locked screen resumes where you left off.
- The other phone gets a filtered view: never your answer before you've both locked in.
- `server.js` is a zero-dependency relay (Server-Sent Events + POST). It keeps rooms in memory only and stores no answers on disk.
- Add or edit cards in the `CARDS` array at the top of the script.
