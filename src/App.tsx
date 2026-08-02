import { useEffect, useState } from 'react';
import { useTrackerData } from './hooks/useTrackerData';
import {
  addReview,
  setReviewPreviousDone,
  setSubtopicDone,
  setTopicDone,
  setWeekDayDone,
  setWeekStatus,
  subscribeReviews,
} from './lib/db';
import type {
  NewWeeklyReview,
  Phase,
  TrackId,
  WeekEntry,
  WeeklyReview,
  WeekStatus,
} from './types';
import { TRACKS, hoursLogged, isPhaseComplete, trackDef } from './types';
import { Backlog } from './components/Backlog';
import { Dashboard } from './components/Dashboard';
import { Progress } from './components/Progress';
import { PhaseDetail } from './components/PhaseDetail';
import { Profile } from './components/Profile';
import { Reviews } from './components/Reviews';
import { ReviewWrite } from './components/ReviewWrite';
import { Syllabus } from './components/Syllabus';
import { Timeline } from './components/Timeline';
import { Sidebar, type Tab } from './components/Sidebar';
import { GATE_SYLLABUS, countConcepts } from './data/gateSyllabus';
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

  useEffect(() => {
    return subscribeReviews(uid, trackId, setReviews, (e) => console.error(e));
  }, [uid, trackId]);

  if (error) {
    return (
      <Centered>
        <span>Something went wrong — {error}</span>
      </Centered>
    );
  }
  if (loading) return <Centered>Loading your syllabus…</Centered>;

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

  const handleWeekStatus = async (
    week: WeekEntry,
    status: WeekStatus | null,
  ): Promise<void> => {
    await setWeekStatus(uid, week, status);
  };

  const handleWeekDay = async (
    week: WeekEntry,
    dayIndex: number,
    done: boolean,
  ): Promise<void> => {
    await setWeekDayDone(uid, week, dayIndex, done);
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

  // sidebar/footer summary stats
  const gatesPassed = phases.filter(isPhaseComplete).length;
  const totalHours = phases.reduce((sum, p) => sum + hoursLogged(p), 0);
  const allSubs = phases.flatMap((p) => p.topics.flatMap((t) => t.subtopics));
  const topicPct =
    allSubs.length === 0
      ? 0
      : Math.round((allSubs.filter((s) => s.done).length / allSubs.length) * 100);
  const weeksPassed = Object.values(weekStatus).filter((s) => s === 'pass').length;

  // Syllabus size: authored concepts for GATE, the live subtopic tree for backend.
  const conceptCount =
    trackId === 'gate' ? countConcepts(GATE_SYLLABUS) : allSubs.length;

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
            status={weekStatus}
            onSetStatus={handleWeekStatus}
            onSetDayDone={handleWeekDay}
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
    <div className="min-h-dvh md:flex">
      <Sidebar
        tab={activeTab}
        track={track}
        phases={phases}
        conceptCount={conceptCount}
        backlogCount={backlogCount}
        selectedPhaseId={selectedPhaseId}
        gatesPassed={gatesPassed}
        totalHours={totalHours}
        topicPct={topicPct}
        reviewsCount={reviews.length}
        weeksPassed={weeksPassed}
        onSelect={goTab}
        onSelectTrack={goTrack}
        onSelectPhase={goPhase}
        onExport={handleExport}
      />

      <div className="flex min-h-dvh flex-1 flex-col">
        {/* mobile track switcher — the sidebar covers desktop (wireframe 9c) */}
        <header
          className="flex-none px-4 py-3 md:hidden"
          style={{ borderBottom: '1px solid rgba(29,31,32,.35)' }}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {TRACKS.map((t) => {
              const active = t.id === trackId;
              return (
                <button
                  key={t.id}
                  onClick={() => goTrack(t.id)}
                  className="bx p-2 text-left"
                  style={{
                    background: active ? '#5980a6' : 'transparent',
                    color: active ? '#fff' : 'rgba(29,31,32,.65)',
                    borderColor: active ? '#5980a6' : undefined,
                  }}
                >
                  <div
                    style={{
                      font: '600 13px/1 var(--font-heading)',
                      letterSpacing: '.06em',
                    }}
                  >
                    {t.shortName}
                  </div>
                  <div
                    style={{
                      font: '400 10px/1.2 var(--font-body)',
                      marginTop: 3,
                      opacity: 0.8,
                    }}
                  >
                    {t.totalHours}h · {t.unitCount} {t.unitLabelPlural.toLowerCase()}
                  </div>
                </button>
              );
            })}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-md md:max-w-5xl">{page}</div>
        </main>

        {/* mobile bottom tab bar */}
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
      </div>
    </div>
  );
}
