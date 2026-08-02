import { TOTAL_SYLLABUS_HOURS } from '../types';

type Tab = 'progress' | 'profile';

interface SidebarProps {
  tab: Tab;
  inDetail: boolean;
  gatesPassed: number;
  totalHours: number;
  topicPct: number;
  reviewsCount: number;
  onSelect: (tab: Tab) => void;
  onOpenReview: () => void;
  onExport: () => void;
}

const ACCENT = '#5980a6';

/** Desktop-only left sidebar shell (wireframe turns 4–6). Hidden on mobile. */
export function Sidebar({
  tab,
  inDetail,
  gatesPassed,
  totalHours,
  topicPct,
  reviewsCount,
  onSelect,
  onOpenReview,
  onExport,
}: SidebarProps): JSX.Element {
  const nav: Array<{ id: Tab; name: string; count: string }> = [
    { id: 'progress', name: 'Progress', count: `${gatesPassed}/12` },
    { id: 'profile', name: 'Profile', count: `${reviewsCount}` },
  ];
  const gatePct = Math.round((gatesPassed / 12) * 100);

  return (
    <aside
      className="sticky top-0 hidden h-dvh w-64 flex-none flex-col md:flex"
      style={{ borderRight: '1px solid var(--ink)' }}
    >
      <div className="p-4" style={{ borderBottom: '1px solid rgba(29,31,32,.35)' }}>
        <span className="h">SYLLABUS</span>
      </div>

      {/* nav */}
      <div className="px-3 py-4" style={{ borderBottom: '1px solid rgba(29,31,32,.35)' }}>
        {nav.map((n) => {
          const active = tab === n.id && !inDetail;
          return (
            <button
              key={n.id}
              onClick={() => onSelect(n.id)}
              className="flex w-full items-center gap-2.5 px-2.5 py-2.5 text-left"
              style={{
                borderLeft: `2px solid ${active ? ACCENT : 'transparent'}`,
                color: active ? ACCENT : 'var(--ink)',
              }}
            >
              <span
                className="bx h-3.5 w-3.5 flex-none"
                style={{ borderColor: active ? ACCENT : undefined }}
              />
              <span className="flex-1" style={{ font: '500 13px var(--font-body)' }}>
                {n.name}
              </span>
              <span className="k" style={{ color: active ? ACCENT : undefined }}>
                {n.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* the one roadmap this app tracks */}
      <div className="px-3 py-4" style={{ borderBottom: '1px solid rgba(29,31,32,.35)' }}>
        <div className="k mb-1.5 pl-2.5">Roadmap</div>
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <div
            className="h-[5px] w-8 flex-none"
            style={{ background: 'rgba(29,31,32,.14)' }}
          >
            <div
              className="h-full"
              style={{ width: `${gatePct}%`, background: 'rgba(89,128,166,.7)' }}
            />
          </div>
          <span
            className="min-w-0 flex-1 truncate"
            style={{ font: '400 12px var(--font-body)', color: ACCENT }}
          >
            Backend Engineering
          </span>
        </div>
      </div>

      {/* actions */}
      <div className="flex flex-col gap-2 p-3">
        <button className="btn-solid" style={{ height: 34 }} onClick={onOpenReview}>
          Weekly review
        </button>
        <button className="btn-line" style={{ height: 34 }} onClick={onExport}>
          Export JSON
        </button>
      </div>

      {/* account footer */}
      <div
        className="mt-auto flex items-center gap-2.5 px-4 py-3.5"
        style={{ borderTop: '1px solid var(--ink)' }}
      >
        <div className="bx h-7 w-7 flex-none" />
        <div className="min-w-0 flex-1">
          <div style={{ font: '500 13px var(--font-body)' }}>Profile</div>
          <div className="k">
            {gatesPassed} gates · {totalHours}/{TOTAL_SYLLABUS_HOURS}h · {topicPct}%
          </div>
        </div>
      </div>
    </aside>
  );
}
