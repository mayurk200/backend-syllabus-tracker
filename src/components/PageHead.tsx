interface PageHeadProps {
  kicker: string;
  title: string;
  /** Right-hand summary — a stat line, or a rendered node for anything richer. */
  meta?: React.ReactNode;
}

/**
 * Every page opens the same way: a small kicker, a large light heading, and a
 * summary pushed to the right. Lighter and larger than the rest of the type on
 * purpose — it is the one place the interface is allowed to be quiet.
 */
export function PageHead({ kicker, title, meta }: PageHeadProps): JSX.Element {
  return (
    <section
      className="flex flex-wrap items-end justify-between gap-5 pb-[30px] pt-1"
      style={{ borderBottom: '1px solid rgba(29,31,32,.16)' }}
    >
      <div className="min-w-0">
        <div className="k">{kicker}</div>
        <h1 className="display mt-3">{title}</h1>
      </div>
      {typeof meta === 'string' ? <span className="k">{meta}</span> : meta}
    </section>
  );
}
