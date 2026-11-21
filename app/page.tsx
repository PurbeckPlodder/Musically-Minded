"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import charts from "../data/charts.json";

type Chart = (typeof charts)[number];
type Track = Chart["tracks"][number];
type Phase = "welcome" | "playing" | "reveal" | "complete";

type AppleTrack = {
  artistName: string;
  trackName: string;
  previewUrl?: string;
  trackViewUrl?: string;
};

type AppleSearchResponse = {
  results: AppleTrack[];
};

const DEFAULT_DURATION_SECONDS = 30;

function normalizeGuess(value: string) {
  return value.toLocaleLowerCase("en").replace(/[^a-z0-9]/g, "");
}

async function findApplePreview(track: Track, signal: AbortSignal) {
  const term = encodeURIComponent(`${track.title} ${track.artist}`);
  const response = await fetch(
    `https://itunes.apple.com/search?country=gb&entity=song&limit=10&term=${term}`,
    { signal, headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error("Apple's preview search is temporarily unavailable.");

  const result = (await response.json()) as AppleSearchResponse;
  const targetTitle = normalizeGuess(track.title);
  const targetArtist = normalizeGuess(track.artist);
  const titleMatches = result.results.filter((candidate) => {
    const candidateTitle = normalizeGuess(candidate.trackName);
    return (
      candidateTitle === targetTitle ||
      candidateTitle.startsWith(targetTitle) ||
      targetTitle.startsWith(candidateTitle)
    );
  });
  const matchingTrack =
    titleMatches.find((candidate) => {
      const candidateArtist = normalizeGuess(candidate.artistName);
      return (
        candidateArtist === targetArtist ||
        candidateArtist.includes(targetArtist) ||
        targetArtist.includes(candidateArtist)
      );
    }) ?? titleMatches[0];

  return {
    previewUrl: matchingTrack?.previewUrl ?? null,
    trackUrl: matchingTrack?.trackViewUrl ?? null,
  };
}

function shuffleTracks(tracks: Track[]) {
  const shuffled = [...tracks];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export default function Home() {
  const [selectedYear, setSelectedYear] = useState(1984);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [rounds, setRounds] = useState<Track[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(DEFAULT_DURATION_SECONDS);
  const [remaining, setRemaining] = useState(DEFAULT_DURATION_SECONDS);
  const [guess, setGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<
    "loading" | "ready" | "missing" | "error"
  >("loading");
  const audioRef = useRef<HTMLAudioElement>(null);

  const chart = charts.find((item) => item.year === selectedYear) as Chart;
  const track = rounds[roundIndex];
  const progress = phase === "welcome" ? 0 : Math.min(roundIndex + 1, 10);
  const revealAnswer = useCallback(() => {
    const player = audioRef.current;
    if (player) {
      player.pause();
      player.currentTime = 0;
    }
    setRemaining(0);
    setPhase("reveal");
  }, []);
  const chartWeekLabel = useMemo(() => {
    const weekStart = new Date(`${chart.chartDate}T12:00:00`);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const month = weekEnd.toLocaleDateString("en-GB", { month: "long" });
    return `${weekStart.getDate()}–${weekEnd.getDate()} ${month} ${weekEnd.getFullYear()}`;
  },
    [chart.chartDate],
  );

  useEffect(() => {
    if (phase !== "playing") return;
    if (remaining === 0) {
      revealAnswer();
      return;
    }

    const timeout = window.setTimeout(
      () => setRemaining((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timeout);
  }, [phase, remaining, revealAnswer]);

  useEffect(() => {
    if (phase !== "playing" || !track) return;

    const controller = new AbortController();
    setPreviewStatus("loading");
    setPreviewUrl(null);
    setTrackUrl(null);

    findApplePreview(track, controller.signal)
      .then((result) => {
        setPreviewUrl(result.previewUrl ?? null);
        setTrackUrl(result.trackUrl ?? null);
        setPreviewStatus(result.previewUrl ? "ready" : "missing");
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setPreviewStatus("error");
      });

    return () => controller.abort();
  }, [phase, selectedYear, track]);

  function startQuiz() {
    setRounds(shuffleTracks(chart.tracks));
    setRoundIndex(0);
    setRemaining(durationSeconds);
    setGuess("");
    setSubmitted(false);
    setCorrect(0);
    setPhase("playing");
  }

  function submitGuess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase !== "playing" || !track || !guess.trim() || submitted) return;

    const isCorrect = normalizeGuess(guess) === normalizeGuess(track.title);
    if (isCorrect) setCorrect((score) => score + 1);
    setSubmitted(true);
  }

  function nextRound() {
    if (roundIndex === rounds.length - 1) {
      setPhase("complete");
      return;
    }
    setRoundIndex((index) => index + 1);
    setRemaining(durationSeconds);
    setGuess("");
    setSubmitted(false);
    setPhase("playing");
  }

  return (
    <main className="page-shell">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="./" aria-label="Chart Rewind home">
          <span className="brand-mark" aria-hidden="true">CR</span>
          <span>CHART REWIND</span>
        </a>
        <span className="topbar-note">A little trip through the UK charts</span>
        <span className="decade-pill">1980 — 1999</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> THIS DAY IN THE 80S &amp; 90S</p>
          <h1>How well do<br />you know the <span>80s &amp; 90s?</span></h1>
          <p className="hero-intro">
            Ten UK chart hits from the week covering November 21. Choose your
            clip length and name that tune before the reveal.
          </p>
          <div className="hero-meta">
            <span className="meta-icon" aria-hidden="true">♫</span>
            <span>Official chart history</span>
            <span className="meta-divider" />
            <span>Apple Music previews</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="record">
            <div className="record-groove groove-one" />
            <div className="record-groove groove-two" />
            <div className="record-groove groove-three" />
            <div className="record-label"><span>80</span><small>HITS</small></div>
          </div>
          <div className="spark spark-one">✳</div>
          <div className="spark spark-two">✳</div>
          <div className="art-caption">SIDE A<br /><span>1980–99</span></div>
        </div>
      </section>

      <section className="quiz-card">
        <div className="card-topline">
          <div>
            <p className="card-kicker">YOUR CHART TIME MACHINE</p>
            <h2>{phase === "complete" ? "That's a wrap!" : phase === "welcome" ? "Pick a year. Press play." : `Track ${roundIndex + 1} of 10`}</h2>
          </div>
          {phase !== "welcome" && phase !== "complete" && (
            <div className="round-counter">
              <span>{String(roundIndex + 1).padStart(2, "0")}</span>
              <span className="counter-slash">/</span>
              <span>10</span>
            </div>
          )}
        </div>

        {phase !== "welcome" && phase !== "complete" && (
          <div className="progress-track" aria-label={`Track ${progress} of 10`}>
            <div className="progress-fill" style={{ width: `${progress * 10}%` }} />
          </div>
        )}

        {phase === "welcome" && (
          <div className="welcome-panel">
            <div className="welcome-details">
              <div className="year-picker">
                <label htmlFor="year-picker">CHOOSE YOUR CHART YEAR</label>
                <select
                  id="year-picker"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                >
                  {charts.map((item) => (
                    <option key={item.year} value={item.year}>{item.year}</option>
                  ))}
                </select>
              </div>
              <p className="chart-caption">
                UK Official Singles Chart week covering 21 November: <strong>{chartWeekLabel}</strong>
              </p>
              <div className="duration-setting">
                <div className="duration-heading">
                  <label htmlFor="preview-duration">PREVIEW LENGTH</label>
                  <output htmlFor="preview-duration">{durationSeconds} seconds</output>
                </div>
                <input
                  id="preview-duration"
                  className="duration-slider"
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={durationSeconds}
                  onChange={(event) => setDurationSeconds(Number(event.target.value))}
                />
                <div className="duration-scale" aria-hidden="true">
                  <span>5 sec</span>
                  <span>30 sec</span>
                </div>
              </div>
            </div>
            <button className="primary-button" onClick={startQuiz}>
              <span className="button-play" aria-hidden="true">▶</span>
              Start the quiz
              <span className="button-arrow" aria-hidden="true">↗</span>
            </button>
            <p className="legal-note">
              Clues use short song previews from Apple&apos;s Search API. No lyric
              text is reproduced.
            </p>
          </div>
        )}

        {(phase === "playing" || phase === "reveal") && track && (
          <div className="game-panel">
            <div className="game-toolbar">
              <div className="chart-date-tag">
                <span className="mini-star" aria-hidden="true">✦</span>
                {selectedYear} CHART · {chartWeekLabel.toUpperCase()}
              </div>
              <div className={`timer ${remaining <= 8 ? "timer-urgent" : ""}`}>
                <span className="timer-icon" aria-hidden="true">◷</span>
                00:{String(remaining).padStart(2, "0")}
              </div>
            </div>

            <div className="clue-box">
              <div className="clue-disc" aria-hidden="true">
                <div className="clue-disc-label">?</div>
              </div>
              <div className="clue-content">
                <p className="clue-label">YOUR AUDIO CLUE</p>
                <h3>Listen closely.</h3>
                {previewStatus === "loading" && <p className="preview-message">Finding the preview…</p>}
                {previewUrl && (
                  <audio ref={audioRef} className="audio-player" controls preload="none" src={previewUrl}>
                    Your browser does not support audio playback.
                  </audio>
                )}
                {previewUrl && trackUrl && (
                  <a className="preview-link" href={trackUrl} target="_blank" rel="noreferrer">
                    Open this track in Apple Music ↗
                  </a>
                )}
                {previewStatus === "missing" && (
                  <p className="preview-message">
                    No preview is available for this track.
                    {trackUrl && <> <a href={trackUrl} target="_blank" rel="noreferrer">Open in Apple Music ↗</a></>}
                  </p>
                )}
                {previewStatus === "error" && (
                  <p className="preview-message">Couldn&apos;t load the preview. The timer is still running.</p>
                )}
              </div>
              <div className="clue-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            </div>

            <form className="guess-form" onSubmit={submitGuess}>
              <label htmlFor="guess">WHAT&apos;S THE SONG?</label>
              <div className="guess-row">
                <input
                  id="guess"
                  autoComplete="off"
                  placeholder="Type your guess…"
                  value={guess}
                  onChange={(event) => setGuess(event.target.value)}
                  disabled={submitted || phase === "reveal"}
                />
                <button className="submit-button" type="submit" disabled={!guess.trim() || submitted || phase === "reveal"}>
                  {submitted ? "Locked in" : "Lock it in"} <span aria-hidden="true">↗</span>
                </button>
              </div>
              <div className="guess-foot">
                <span>{submitted ? (normalizeGuess(guess) === normalizeGuess(track.title) ? "That's right — nice one!" : "Guess saved. The answer is coming…") : "The answer reveals when the timer runs out."}</span>
                <span className="points-note">1 point per correct song</span>
              </div>
            </form>

            {phase === "playing" && (
              <div className="game-actions">
                <span>Skip reveals the answer and stops playback.</span>
                <button className="skip-button" type="button" onClick={revealAnswer}>
                  Skip to next track <span aria-hidden="true">→</span>
                </button>
              </div>
            )}

            {phase === "reveal" && (
              <div className="reveal-box">
                <div className="reveal-top">
                  <span className="reveal-label">THE REVEAL</span>
                  <span className="reveal-rank">NO. {track.position} IN THE CHART</span>
                </div>
                <h3>{track.title}</h3>
                <p className="reveal-artist">by {track.artist}</p>
                <div className="reveal-bottom">
                  <span>Your score: <strong>{correct} / 10</strong></span>
                  <button className="next-button" onClick={nextRound}>
                    {roundIndex === rounds.length - 1 ? "See my score" : "Next track"} <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === "complete" && (
          <div className="complete-panel">
            <div className="score-seal" aria-hidden="true">
              <span>{correct}</span><small>OUT OF 10</small>
            </div>
            <p className="score-message">
              {correct >= 8 ? "Stone-cold chart legend." : correct >= 5 ? "You know your way around a jukebox." : "Time for another spin?"}
            </p>
            <p className="score-caption">You got <strong>{correct} of 10</strong> songs right for {selectedYear}.</p>
            <button className="primary-button play-again" onClick={startQuiz}>
              <span className="button-play" aria-hidden="true">↻</span>
              Play this year again
              <span className="button-arrow" aria-hidden="true">↗</span>
            </button>
          </div>
        )}
      </section>

      <footer className="site-footer">
        <span>Made for people who still know the words.</span>
        <a href={`https://www.officialcharts.com/charts/singles-chart/${chart.chartDate.replace(/-/g, "")}/7501/`} target="_blank" rel="noreferrer">
          Chart data: Official Charts Company · {selectedYear} ↗
        </a>
      </footer>
    </main>
  );
}
