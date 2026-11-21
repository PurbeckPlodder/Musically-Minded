# Chart Rewind

A Next.js music quiz built around the UK Official Singles Chart weeks that include November 21 for each year from 1980 to 1999. Each round plays an Apple Music/iTunes preview; choose a 5–30 second round length, guess the song, or skip to reveal the answer and chart position immediately.

## Run locally

1. Install Node.js 22 or later and restart the terminal so `node` and `npm` are available on `PATH`.
2. From this folder, run `npm install`.
3. Run `npm run dev`, then open `http://localhost:3000`.

For production, run `npm run build`. The static site is written to `out/`. Pushes to `main` are deployed to GitHub Pages by [the Pages workflow](./.github/workflows/deploy.yml). In repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

## Data and rights

- Chart entries are from the [Official Charts Company UK Singles Chart](https://www.officialcharts.com/charts/singles-chart/). Each chart week begins on a Sunday and includes November 21; the dates are recorded in [data/charts.json](./data/charts.json).
- Preview URLs are looked up in the browser through Apple's public [iTunes Search API](https://performance-partners.apple.com/search-api). This works with static hosting and requires no API key. Preview availability varies by track and region.
- The quiz does not fetch or reproduce lyrics. Lyrics are copyrighted; a future lyric-based version needs permission or a suitable licence from rights holders and its data provider.
- No API keys are required for the current experience.

The included charts are the November 21 edition. Update the chart data and matching intro copy if you want to move the quiz to another calendar date.

