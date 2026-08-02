import { useEffect, useState } from 'react';
import { useTrackerData } from './hooks/useTrackerData';
import {
  addReview,
  setGatePassed,
  setTopicDone,
  subscribeReviews,
} from './lib/db';
import type { NewWeeklyReview, Phase, WeeklyReview } from './types';
import { Progress } from './components/Progress';
import { PhaseDetail } from './components/PhaseDetail';
import { Profile } from './components/Profile';
import { WeeklyReviewModal } from './components/WeeklyReviewModal';

// No login. Single-user app: all data lives under one fixed id.
// This must match the id allowed in firestore.rules.
const USER_ID = 'me';

type Tab = 'progress' | 'profile';

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
  const { phases, meta, loading, error } = useTrackerData(uid);

  const [tab, setTab] = useState<Tab>('progress');
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);

  useEffect(() => {
    return subscribeReviews(uid, setReviews, (e) => console.error(e));
  }, [uid]);

  if (error) {
    return (
      <Centered>
        <span>
          Something went wrong — {error}
        </span>
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
    await setTopicDone(uid, phase, topicIndex, done);
  };

  const handleToggleGate = async (
    phaseId: number,
    gatePassed: boolean,
  ): Promise<void> => {
    await setGatePassed(uid, phaseId, gatePassed);
  };

  const handleSubmitReview = async (review: NewWeeklyReview): Promise<void> => {
    await addReview(uid, review);
  };

  const handleExport = (): void => {
    const payload = {
      exportedAt: new Date().toISOString(),
      meta,
      phases,
      reviews,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const goTab = (next: Tab): void => {
    setSelectedPhaseId(null);
    setTab(next);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="flex-none px-4 pb-1 pt-4">
        <span
          style={{
            font: '600 13px var(--font-heading)',
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'rgba(29,31,32,.5)',
          }}
        >
          Syllabus Tracker
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        {selectedPhase ? (
          <PhaseDetail
            phase={selectedPhase}
            phases={phases}
            onBack={() => setSelectedPhaseId(null)}
            onToggleTopic={(i, done) => handleToggleTopic(selectedPhase, i, done)}
            onToggleGate={(passed) => handleToggleGate(selectedPhase.id, passed)}
          />
        ) : tab === 'progress' ? (
          <Progress phases={phases} meta={meta} onSelectPhase={setSelectedPhaseId} />
        ) : (
          <Profile
            phases={phases}
            meta={meta}
            reviews={reviews}
            onOpenReview={() => setReviewOpen(true)}
            onExport={handleExport}
          />
        )}
      </main>

      <nav className="tabbar sticky bottom-0 flex-none">
        <button
          className={`tab ${tab === 'progress' && !selectedPhase ? 'active' : ''}`}
          onClick={() => goTab('progress')}
        >
          Progress
        </button>
        <button
          className={`tab ${tab === 'profile' && !selectedPhase ? 'active' : ''}`}
          onClick={() => goTab('profile')}
        >
          Profile
        </button>
      </nav>

      {reviewOpen && (
        <WeeklyReviewModal
          reviews={reviews}
          onClose={() => setReviewOpen(false)}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
}
