import type { Phase } from '../types';
import { TOTAL_SYLLABUS_HOURS } from '../types';

// Verbatim syllabus. Hours are fixed — the assertion below fails loudly if edits
// break the invariant (per-phase topic hours must equal the phase total, and the
// grand total must equal 267).
export const SEED_PHASES: readonly Phase[] = [
  {
    id: 0,
    title: 'Prerequisite Audit',
    hours: 4,
    description: 'Find out honestly what you already know and what you do not.',
    gate: 'One-page written gap list.',
    gatePassed: false,
    topics: [
      { name: 'Skip test', hours: 2, detail: 'Attempt to build a tiny service cold; note where you get stuck.', done: false },
      { name: 'Gap inventory', hours: 1, detail: 'List concrete unknowns surfaced by the skip test.', done: false },
      { name: 'Baseline metrics', hours: 1, detail: 'Record current speed/quality so later progress is measurable.', done: false },
    ],
  },
  {
    id: 1,
    title: 'Language & Runtime Fluency',
    hours: 18,
    description: 'Be genuinely fluent in one language and its runtime.',
    gate: 'Tested Python package, >80% coverage on core logic, typed end to end, mypy clean.',
    gatePassed: false,
    topics: [
      { name: 'Python for services', hours: 5, detail: 'Idiomatic Python for backend work: packaging, envs, stdlib.', done: false },
      { name: 'Concurrency model', hours: 5, detail: 'asyncio, threads vs processes, the GIL, when each applies.', done: false },
      { name: 'Error handling', hours: 3, detail: 'Exceptions, error boundaries, failure modes, retries.', done: false },
      { name: 'Testing', hours: 5, detail: 'pytest, fixtures, coverage, typed tests, mypy.', done: false },
    ],
  },
  {
    id: 2,
    title: 'HTTP & API Design',
    hours: 20,
    description: 'Design and build HTTP APIs that other people can actually use.',
    gate: 'FastAPI service with cursor pagination, full OpenAPI spec, streaming endpoint, versioning policy.',
    gatePassed: false,
    topics: [
      { name: 'HTTP deeply', hours: 4, detail: 'Methods, status codes, headers, caching semantics, content negotiation.', done: false },
      { name: 'REST design', hours: 4, detail: 'Resource modelling, idempotency, pagination, error shapes.', done: false },
      { name: 'FastAPI', hours: 6, detail: 'Routing, dependency injection, validation, OpenAPI generation.', done: false },
      { name: 'API contracts', hours: 2, detail: 'Schema-first contracts, versioning, backward compatibility.', done: false },
      { name: 'Alternatives gRPC/WS/GraphQL', hours: 4, detail: 'When and why to reach past REST.', done: false },
    ],
  },
  {
    id: 3,
    title: 'Databases',
    hours: 45,
    description: 'The largest phase. Real competence with relational databases.',
    gate: 'Table with 1M+ rows, find a slow query, read its plan, add the correct index, prove improvement with before/after EXPLAIN ANALYZE. Write it up.',
    gatePassed: false,
    topics: [
      { name: 'Relational modelling', hours: 6, detail: 'Normalisation, keys, relationships, schema design.', done: false },
      { name: 'SQL beyond CRUD', hours: 8, detail: 'Joins, window functions, CTEs, aggregation, set ops.', done: false },
      { name: 'Indexing', hours: 7, detail: 'B-trees, composite indexes, covering indexes, selectivity.', done: false },
      { name: 'Query performance', hours: 7, detail: 'EXPLAIN ANALYZE, query plans, diagnosing slow queries.', done: false },
      { name: 'Transactions', hours: 7, detail: 'ACID, isolation levels, locking, deadlocks, MVCC.', done: false },
      { name: 'Connections & ops', hours: 5, detail: 'Pooling, migrations, backups, operational concerns.', done: false },
      { name: 'NoSQL & vectors', hours: 5, detail: 'Document/KV/vector stores and when they fit.', done: false },
    ],
  },
  {
    id: 4,
    title: 'Auth & Security',
    hours: 12,
    description: 'Authentication, authorisation, and application security fundamentals.',
    gate: 'Security review of one of my own projects finding 3+ real defects.',
    gatePassed: false,
    topics: [
      { name: 'Session & token', hours: 4, detail: 'Sessions, JWTs, OAuth2/OIDC, token lifecycle.', done: false },
      { name: 'Authorisation', hours: 3, detail: 'RBAC/ABAC, least privilege, enforcement points.', done: false },
      { name: 'Application security OWASP', hours: 5, detail: 'OWASP Top 10, injection, XSS, CSRF, secrets handling.', done: false },
    ],
  },
  {
    id: 5,
    title: 'Caching & Performance',
    hours: 18,
    description: 'Make things fast and prove the improvement with numbers.',
    gate: 'Load-test an endpoint, report p50/p95/p99, add caching, re-test, quantify the delta.',
    gatePassed: false,
    topics: [
      { name: 'Caching theory', hours: 5, detail: 'Cache layers, invalidation, TTLs, stampedes, coherence.', done: false },
      { name: 'Redis', hours: 6, detail: 'Data structures, patterns, persistence, eviction.', done: false },
      { name: 'HTTP caching', hours: 2, detail: 'Cache-Control, ETags, CDNs, conditional requests.', done: false },
      { name: 'Measuring performance', hours: 5, detail: 'Load testing, percentiles, profiling, bottleneck analysis.', done: false },
    ],
  },
  {
    id: 6,
    title: 'Async Work, Queues & Events',
    hours: 25,
    description: 'Move work off the request path with queues and events.',
    gate: 'Rebuild the proposal-evaluator ingestion as a queued job with retries, dead-letter handling, and a status endpoint the frontend polls.',
    gatePassed: false,
    topics: [
      { name: 'Why queues', hours: 3, detail: 'Decoupling, load levelling, backpressure, tradeoffs.', done: false },
      { name: 'Task queues', hours: 8, detail: 'Celery/RQ/arq, workers, retries, scheduling.', done: false },
      { name: 'Message brokers', hours: 7, detail: 'Redis/RabbitMQ/Kafka, delivery guarantees, partitions.', done: false },
      { name: 'Event-driven design', hours: 4, detail: 'Events vs commands, choreography vs orchestration.', done: false },
      { name: 'Long-running jobs', hours: 3, detail: 'Status tracking, idempotency, dead-letter handling.', done: false },
    ],
  },
  {
    id: 7,
    title: 'Containers, CI/CD & Deployment',
    hours: 28,
    description: 'Ship software automatically and reproducibly.',
    gate: 'One repo, one push to main, automatic test → build → deploy to a live URL. Zero manual steps.',
    gatePassed: false,
    topics: [
      { name: 'Linux & networking', hours: 6, detail: 'Processes, filesystems, ports, DNS, TLS basics.', done: false },
      { name: 'Docker', hours: 8, detail: 'Images, layers, multi-stage builds, compose.', done: false },
      { name: 'Orchestration k8s', hours: 7, detail: 'Pods, deployments, services, config, scaling basics.', done: false },
      { name: 'CI/CD', hours: 5, detail: 'Pipelines, test/build/deploy stages, secrets, gating.', done: false },
      { name: 'Cloud', hours: 2, detail: 'Core managed services and where code runs.', done: false },
    ],
  },
  {
    id: 8,
    title: 'Observability & Reliability',
    hours: 22,
    description: 'Know what your system is doing and why it fails.',
    gate: 'Written postmortem of a failure I induced in my own system, diagnosed purely through telemetry.',
    gatePassed: false,
    topics: [
      { name: 'Logging', hours: 4, detail: 'Structured logs, levels, correlation ids, aggregation.', done: false },
      { name: 'Metrics', hours: 6, detail: 'Prometheus, RED/USE methods, dashboards, alerting.', done: false },
      { name: 'Tracing', hours: 5, detail: 'Distributed tracing, spans, OpenTelemetry.', done: false },
      { name: 'Reliability', hours: 4, detail: 'SLOs, error budgets, graceful degradation.', done: false },
      { name: 'Incident practice', hours: 3, detail: 'Runbooks, on-call, postmortems, blameless review.', done: false },
    ],
  },
  {
    id: 9,
    title: 'System Design',
    hours: 20,
    description: 'Design whole systems and reason about their tradeoffs out loud.',
    gate: 'Six designs under 45-min timed conditions, articulated aloud, with capacity estimates and tradeoffs.',
    gatePassed: false,
    topics: [
      { name: 'Fundamentals', hours: 5, detail: 'Latency/throughput, CAP, consistency, load balancing.', done: false },
      { name: 'Data at scale', hours: 5, detail: 'Sharding, replication, partitioning, caching layers.', done: false },
      { name: 'Architecture', hours: 5, detail: 'Monolith vs services, APIs, queues, storage choices.', done: false },
      { name: 'Interview practice', hours: 5, detail: 'Timed design drills with capacity estimation.', done: false },
    ],
  },
  {
    id: 10,
    title: 'ML-Serving Backend',
    hours: 30,
    description: 'Serve models behind a real, production-shaped backend.',
    gate: 'Serve one of my own quantised 7B models behind a production-shaped API — streaming, dynamic batching, request queue, Prometheus metrics, containerised.',
    gatePassed: false,
    topics: [
      { name: 'Model serving', hours: 6, detail: 'Serving quantised LLMs, runtimes, hardware constraints.', done: false },
      { name: 'Inference patterns', hours: 6, detail: 'Streaming, dynamic batching, request queues.', done: false },
      { name: 'Serving stacks', hours: 6, detail: 'vLLM/TGI/Triton and their tradeoffs.', done: false },
      { name: 'Feature & data', hours: 4, detail: 'Feature pipelines, data contracts for inference.', done: false },
      { name: 'ML observability', hours: 4, detail: 'Latency, throughput, token metrics, drift.', done: false },
      { name: 'MLOps surface', hours: 4, detail: 'Model registry, versioning, rollout, rollback.', done: false },
    ],
  },
  {
    id: 11,
    title: 'Capstone Integration',
    hours: 25,
    description: 'Tie everything together into one defensible system.',
    gate: 'A stranger can clone the repo, run one command, and have the whole system running locally.',
    gatePassed: false,
    topics: [
      { name: 'Build', hours: 16, detail: 'Integrate the pieces into one coherent working system.', done: false },
      { name: 'Document', hours: 5, detail: 'README, architecture notes, one-command bootstrap.', done: false },
      { name: 'Defend', hours: 4, detail: 'Be able to explain and justify every design choice.', done: false },
    ],
  },
];

/**
 * Fail loudly if the syllabus hours are inconsistent. Called at seed time.
 * Throws on any mismatch rather than silently seeding bad data.
 */
export function verifySeedHours(phases: readonly Phase[] = SEED_PHASES): void {
  const errors: string[] = [];

  for (const phase of phases) {
    const topicSum = phase.topics.reduce((s, t) => s + t.hours, 0);
    if (topicSum !== phase.hours) {
      errors.push(
        `Phase ${phase.id} (${phase.title}): topic hours sum to ${topicSum}, declared ${phase.hours}.`,
      );
    }
  }

  const grandTotal = phases.reduce((s, p) => s + p.hours, 0);
  if (grandTotal !== TOTAL_SYLLABUS_HOURS) {
    errors.push(`Grand total is ${grandTotal}h, expected ${TOTAL_SYLLABUS_HOURS}h.`);
  }

  if (errors.length > 0) {
    throw new Error(`Seed data hour verification FAILED:\n - ${errors.join('\n - ')}`);
  }
}
