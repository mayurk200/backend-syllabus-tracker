interface LoginProps {
  onSignIn: () => Promise<void>;
}

export function Login({ onSignIn }: LoginProps): JSX.Element {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">Backend Syllabus Tracker</h1>
        <p className="max-w-xs text-sm text-neutral-400">
          You advance on the gate, not on hours spent. Sign in to pick up where you left off.
        </p>
      </div>
      <button className="btn-primary w-full max-w-xs" onClick={() => void onSignIn()}>
        Continue with Google
      </button>
      <p className="max-w-xs text-xs text-neutral-600">
        Single-user app. Access is locked to one UID by Firestore security rules.
      </p>
    </div>
  );
}
