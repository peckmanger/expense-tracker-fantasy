# Dragon's Hoard

A private expense tracker in a pixel-art fantasy forest. It has the same features as the plain *Expenses* app (v3), with a dragon guarding your gold.

Everything is stored on your iPhone in IndexedDB. Nothing is uploaded, so anyone else who opens the link finds an empty hoard.

## Put it online (GitHub Pages)

1. Create a new repository, e.g. `dragons-hoard`, and upload **all** files from this folder, including the `fonts/` folder.
2. Go to **Settings → Pages → Build and deployment**, choose *Deploy from a branch*, then pick `main` and `/ (root)`.
3. Open `https://<your-username>.github.io/dragons-hoard/` in Safari. Tap **Share → Add to Home Screen**, and from then on always open the app from that icon.

There's no build step and nothing to install. These are plain HTML, CSS and JavaScript files.

## What's inside

| Tab | What it is |
|---|---|
| **Hearth** | Monthly overview. The dragon's mood follows your budget: it sleeps while you're on track, stirs when you spend ahead of pace and breathes fire when you go over. Its gold pile shrinks as the budget is used up. Tap the dragon to play. |
| **Ledger** | Every expense, with search and filters. |
| **Coffers** | Monthly budgets: one total or per category. |
| **Oracle** | Trends, month-on-month and year-on-year comparisons, budget vs actual, top categories. |
| **Satchel** | Almanac (calendar), Tithes & dues (recurring payments and subscriptions), Treasure quests (savings goals), Purses (accounts), Categories, Coinage (currencies), Chronicles (PDF + CSV), import, backup and restore. |

These work exactly as in v3: multi-currency with everything converted to EUR at each day's rate, CSV exports in EUR, recurring payments filled in automatically, the monthly reminder for last month's report, and automatic day/night themes.

**Joe Mode:** every total is buried under a pile of pixel leaves. The real number never reaches the page, so there is nothing to peek at. Tapping a pile only rustles it. Single entries stay visible, and exports still contain everything.

### Theme extras
- **Dragon Flight**: a tap-to-flap mini-game. Fly between giant mushrooms and hanging trees and collect gold. Your best score is saved. Start it by tapping the dragon or from Satchel → Tavern.
- **The fairy**: every so often she flutters across the screen. Catch her (or use Satchel → Ask the fairy) for a bit of thrifty counsel.
- **Fireflies** at night, drifting motes by day, and the occasional falling leaf. You can turn these off under Satchel → Forest creatures. The app also follows the iPhone's *Reduce Motion* setting.
- **8-bit sounds** (off by default), under Satchel → Sound effects.
- **Pixel sprites** for categories, purses and quests. You can also type any emoji instead.

## Coming from the plain Expenses app?
- **Backups** (`.json`) from Expenses can be restored here (Satchel → Restore from backup).
- **CSV exports** from Expenses import cleanly. Old names are mapped automatically: Groceries → Provisions, Drinks → Ale & Mead, Cash → Coin Purse, and so on.
- The two apps never share data, even when both are hosted on the same `github.io` address. Each has its own database, cache and settings.

> Optional: the old app's `sw.js` deletes *every* cache on the domain when it updates, which includes this app's offline cache. Nothing breaks (this app simply re-downloads its files), but to stop it, change this line in the old `sw.js`:
> `keys.filter(k => k !== CACHE)` → `keys.filter(k => k.startsWith('expenses-') && k !== CACHE)`

## Files

| File | Purpose |
|---|---|
| `index.html`, `styles.css` | Page shell and the whole look (parchment, wood, pixel frames, day/night) |
| `app.js` | Start-up, actions, imports and exports |
| `views.js` | Every screen and sheet |
| `store.js` | Data, default categories, money formatting, Joe Mode |
| `sprites.js` | All pixel art as text (one letter = one pixel), plus the SVG/canvas renderers |
| `magic.js` | Fireflies, leaves, fairy, coin bursts, sounds |
| `game.js` | Dragon Flight |
| `charts.js` | Pixel charts |
| `report.js` | The PDF chronicle |
| `fx.js`, `db.js` | Exchange rates and on-device storage |
| `sw.js`, `manifest.json`, `icon-*.png` | Offline support and the Home Screen app |
| `fonts/hoard-pixel.woff` | The custom pixel font |

**After changing files:** bump `CACHE` in `sw.js` (`hoard-v1` → `hoard-v2`) so phones pick up the new version.
