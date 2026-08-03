import { useEffect, useRef, useState } from 'react';
import { useTrackerData } from './hooks/useTrackerData';
import {
  addReview,
  setReviewPreviousDone,
  setSubtopicDone,
  setTopicDone,
  setWeekDayDone,
  subscribeReviews,
  swapWeekSlots,
} from './lib/db';
import type {
  NewWeeklyReview,
  Phase,
  TrackId,
  WeekEntry,
  WeeklyReview,
} from './types';
import { isPhaseComplete, trackDef } from './types';
import { Backlog } from './components/Backlog';
import { Dashboard } from './components/Dashboard';
import { Progress } from './components/Progress';
import { PhaseDetail } from './components/PhaseDetail';
import { Profile } from './components/Profile';
import { Reviews } from './components/Reviews';
import { ReviewWrite } from './components/ReviewWrite';
import { Syllabus } from './components/Syllabus';
import { Timeline } from './components/Timeline';
import { Splash } from './components/Splash';
import { Toast, useToast } from './components/Toast';
import { TopNav, type Tab } from './components/TopNav';
import { buildBacklog } from './lib/backlog';

// No login. Single-user app: all data lives under one fixed id in Firestore.
// This must match the id allowed in firestore.rules.
const USER_ID = 'me';

/** Bottom bar on mobile — the desktop sidebar carries the rest. */
const MOBILE_TABS: Array<{ id: Tab; label: string; gateOnly?: boolean }> = [
  { id: 'dashboard', label: 'Home' },
  { id: 'progress', label: 'Progress' },
  { id: 'syllabus', label: 'Syllabus' },
  { id: 'timeline', label: 'Timeline', gateOnly: true },
  { id: 'backlog', label: 'Backlog' },
  { id: 'profile', label: 'Profile' },
];

function Centered({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 text-center">
      <span className="k" style={{ fontSize: 12 }}>
        {children}
      </span>
    </div>
  );
}

export default function App(): JSX.Element {
  const uid = USER_ID;
  const [trackId, setTrackId] = useState<TrackId>('gate');
  const { phases, meta, weeks, weekStatus, activity, loading, error } = useTrackerData(
    uid,
    trackId,
  );
  const track = trackDef(trackId);

  const [tab, setTab] = useState<Tab>('dashboard');
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const { toast, raise } = useToast();

  useEffect(() => {
    return subscribeReviews(uid, trackId, setReviews, (e) => console.error(e));
  }, [uid, trackId]);

  // Announce completions as they land. Completion is derived from the ticks, so
  // this watches the data rather than any button press — which means it fires
  // whichever page the tick was made on.
  const completedIds = phases.filter(isPhaseComplete).map((p) => p.id);
  const completedKey = completedIds.join(',');
  const seenRef = useRef<string | null>(null);
  useEffect(() => {
    if (loading) return;
    const previous = seenRef.current;
    seenRef.current = completedKey;
    if (previous === null || previous === completedKey) return;

    const before = new Set(previous.split(',').filter(Boolean));
    const added = completedIds.filter((id) => !before.has(String(id)));
    if (added.length === 0) return;

    const phase = phases.find((p) => p.id === added[0]);
    if (!phase) return;
    const total = phases.length;
    const done = completedIds.length;
    raise(`${phase.title} complete · ${done} of ${total} ${track.unitLabelPlural.toLowerCase()}`);
    // completedIds/phases are derived from completedKey; keying on it is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedKey, loading]);

  // Reset the watcher when the track changes so switching never fires a toast.
  useEffect(() => {
    seenRef.current = null;
  }, [trackId]);

  if (error) {
    return (
      <Centered>
        <span>Something went wrong — {error}</span>
      </Centered>
    );
  }
  if (loading) return <Splash track={track} label="Loading your syllabus…" />;

  const selectedPhase: Phase | undefined = phases.find((p) => p.id === selectedPhaseId);

  const handleToggleTopic = async (
    phase: Phase,
    topicIndex: number,
    done: boolean,
  ): Promise<void> => {
    await setTopicDone(uid, trackId, phase, topicIndex, done);
  };

  const handleToggleSubtopic = async (
    phase: Phase,
    topicIndex: number,
    subtopicIndex: number,
    done: boolean,
  ): Promise<void> => {
    await setSubtopicDone(uid, trackId, phase, topicIndex, subtopicIndex, done);
  };

  const handleWeekDay = async (
    week: WeekEntry,
    dayIndex: number,
    done: boolean,
  ): Promise<void> => {
    await setWeekDayDone(uid, week, dayIndex, done);
  };

  // Two weeks trade calendar slots. Only the dates move, so the ticks and the
  // subject links stay with the plan they belong to.
  const handleSwapWeeks = async (a: WeekEntry, b: WeekEntry): Promise<void> => {
    await swapWeekSlots(uid, a, b);
    raise(`${a.id} and ${b.id} swapped weeks · ${a.id} now ${b.dates}`);
  };

  const handleSubmitReview = async (review: NewWeeklyReview): Promise<void> => {
    await addReview(uid, trackId, review);
  };

  const handlePreviousDone = async (
    reviewId: string,
    done: boolean | null,
  ): Promise<void> => {
    await setReviewPreviousDone(uid, trackId, reviewId, done);
  };

  const handleExport = (): void => {
    const payload = {
      exportedAt: new Date().toISOString(),
      track: trackId,
      meta,
      phases,
      weeks:
        trackId === 'gate'
          ? weeks.map((w) => ({ ...w, status: weekStatus[w.id] ?? null }))
          : undefined,
      reviews,
      activity,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trackId}-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const goTab = (next: Tab): void => {
    setSelectedPhaseId(null);
    setTab(next);
  };

  const goPhase = (phaseId: number): void => {
    setSelectedPhaseId(phaseId);
  };

  const goTrack = (next: TrackId): void => {
    setSelectedPhaseId(null);
    setTab('dashboard');
    setTrackId(next);
  };

  // The only summary the shell itself needs: the count on the Backlog tab.
  const backlogCount = buildBacklog(trackId, phases, weeks).filter(
    (i) => !i.completedLate,
  ).length;

  // Timeline only exists on the GATE track — fall back rather than blank out.
  const activeTab: Tab = tab === 'timeline' && trackId !== 'gate' ? 'dashboard' : tab;

  const page = ((): JSX.Element => {
    if (selectedPhase) {
      return (
        <PhaseDetail
          phase={selectedPhase}
          phases={phases}
          track={track}
          onBack={() => setSelectedPhaseId(null)}
          onToggleTopic={(i, done) => handleToggleTopic(selectedPhase, i, done)}
          onToggleSubtopic={(i, j, done) =>
            handleToggleSubtopic(selectedPhase, i, j, done)
          }
        />
      );
    }
    switch (activeTab) {
      case 'timeline':
        return (
          <Timeline
            weeks={weeks}
            onSetDayDone={handleWeekDay}
            onSwapWeeks={handleSwapWeeks}
          />
        );
      case 'progress':
        return (
          <Progress phases={phases} meta={meta} track={track} onSelectPhase={goPhase} />
        );
      case 'syllabus':
        return <Syllabus track={track} phases={phases} onSelectPhase={goPhase} />;
      case 'backlog':
        return (
          <Backlog
            track={track}
            phases={phases}
            weeks={weeks}
            onSelectPhase={goPhase}
            onOpenTimeline={() => goTab('timeline')}
          />
        );
      case 'reviews':
        return (
          <Reviews
            reviews={reviews}
            activity={activity}
            phases={phases}
            meta={meta}
            track={track}
            onOpenReview={() => goTab('review')}
          />
        );
      case 'review':
        return (
          <ReviewWrite
            reviews={reviews}
            activity={activity}
            meta={meta}
            onSubmit={handleSubmitReview}
            onSetPreviousDone={handlePreviousDone}
            onDone={() => goTab('reviews')}
          />
        );
      case 'profile':
        return (
          <Profile
            phases={phases}
            meta={meta}
            track={track}
            reviews={reviews}
            onOpenReview={() => goTab('review')}
            onOpenReviews={() => goTab('reviews')}
            onExport={handleExport}
          />
        );
      default:
        return (
          <Dashboard
            phases={phases}
            meta={meta}
            track={track}
            activity={activity}
            reviews={reviews}
            onSelectPhase={goPhase}
            onOpenReview={() => goTab('review')}
          />
        );
    }
  })();

  const mobileTabs = MOBILE_TABS.filter((t) => !t.gateOnly || trackId === 'gate');

  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav
        tab={activeTab}
        track={track}
        inDetail={Boolean(selectedPhase)}
        backlogCount={backlogCount}
        onSelect={goTab}
        onSelectTrack={goTrack}
      />

      <main className="flex-1 px-4 pb-24 pt-7 md:px-8">
        {/* keyed so every route change replays the entry animation */}
        <div key={`${trackId}:${activeTab}:${selectedPhaseId ?? ''}`} className="pg mx-auto w-full max-w-[1160px]">
          {page}
        </div>
      </main>

      {/* mobile bottom tab bar — the top nav carries desktop */}
      <nav className="tabbar sticky bottom-0 flex-none md:hidden">
        {mobileTabs.map((t) => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.id && !selectedPhase ? 'active' : ''}`}
            onClick={() => goTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {toast && <Toast text={toast} />}
    </div>
  );
}
