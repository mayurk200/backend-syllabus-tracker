import { useEffect, useState } from 'react';
import { useTrackerData } from './hooks/useTrackerData';
import {
  addReview,
  setGatePassed,
  setTopicDone,
  subscribeReviews,
} from './lib/db';
import type { NewWeeklyReview, Phase, WeeklyReview } from './types';
import { Dashboard } from './components/Dashboard';
import { PhaseDetail } from './components/PhaseDetail';
import { WeeklyReviewModal } from './components/WeeklyReviewModal';

// No login. Single-user app: all data lives under one fixed id.
// This must match the id allowed in firestore.rules.
const USER_ID = 'me';

function Centered({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 text-center text-sm text-neutral-400">
      {children}
    </div>
  );
}

export default function App(): JSX.Element {
  const uid = USER_ID;
  const { phases, meta, loading, error } = useTrackerData(uid);

  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);

  // Subscribe to weekly reviews.
  useEffect(() => {
    return subscribeReviews(uid, setReviews, (e) => console.error(e));
  }, [uid]);

  if (error) {
    return (
      <Centered>
        <div className="space-y-2">
          <p className="font-medium text-red-400">Something went wrong</p>
          <p className="text-xs text-neutral-500">{error}</p>
        </div>
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

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-4 py-5">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-base font-semibold text-white">
          {selectedPhase ? 'Phase' : 'Tracker'}
        </h1>
      </header>

      {selectedPhase ? (
        <PhaseDetail
          phase={selectedPhase}
          onBack={() => setSelectedPhaseId(null)}
          onToggleTopic={(i, done) => handleToggleTopic(selectedPhase, i, done)}
          onToggleGate={(passed) => handleToggleGate(selectedPhase.id, passed)}
        />
      ) : (
        <Dashboard
          phases={phases}
          meta={meta}
          onSelectPhase={setSelectedPhaseId}
          onOpenReview={() => setReviewOpen(true)}
        />
      )}

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
