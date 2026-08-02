import type { Phase, Subtopic, Topic } from '../types';
import { TOTAL_SYLLABUS_HOURS } from '../types';

/**
 * Backend Engineering — ML-Engineer track. Verbatim syllabus, 267 focused hours
 * across 12 phases. Every topic now carries the full "what exactly to learn"
 * list as individually checkable subtopics.
 *
 * Hours are fixed: subtopic hours must sum to their topic, topic hours to their
 * phase, and the grand total to 267. `verifySeedHours` fails loudly otherwise.
 *
 * This file is a one-time bootstrap payload only — once seeded, Firestore is
 * the source of truth and every read and write goes through the database.
 */

function topic(name: string, detail: string, subs: Array<[string, number]>): Topic {
  const subtopics: Subtopic[] = subs.map(([n, h]) => ({
    name: n,
    hours: h,
    done: false,
  }));
  return {
    name,
    hours: subtopics.reduce((s, x) => s + x.hours, 0),
    detail,
    done: false,
    subtopics,
  };
}

function phase(
  id: number,
  title: string,
  description: string,
  gate: string,
  topics: Topic[],
): Phase {
  return {
    id,
    title,
    hours: topics.reduce((s, t) => s + t.hours, 0),
    description,
    gate,
    gatePassed: false,
    topics,
  };
}

export const SEED_PHASES: readonly Phase[] = [
  phase(
    0,
    'Prerequisite Audit',
    'Find out honestly what you already know and what you do not. Half this syllabus may already be behind you.',
    'One-page written gap list. If everything is marked "copied it", you have been assembling, not engineering.',
    [
      topic(
        'Skip test',
        'Attempt to build a tiny service cold; note where you get stuck.',
        [
          [
            'Write from a blank file, no reference: a REST endpoint with input validation',
            0.5,
          ],
          ['A parameterised SQL query, written cold', 0.5],
          ['A Dockerfile, written cold', 0.5],
          [
            'A unit test with one mock. Time yourself — under 45 min = skip Phases 1–2',
            0.5,
          ],
        ],
      ),
      topic('Gap inventory', 'List concrete unknowns surfaced by the skip test.', [
        [
          'List every technology in your existing projects (HMS, PROOF, alumni portal, proposal evaluator) and mark each: can rebuild from scratch / can modify / copied it. Only the third category is real study time.',
          1,
        ],
      ]),
      topic(
        'Baseline metrics',
        'Record current speed/quality so later progress is measurable.',
        [
          [
            'Answer honestly: can you read an EXPLAIN plan? Have you ever set a database index deliberately? Have you written a load test? These answers set your starting phase.',
            1,
          ],
        ],
      ),
    ],
  ),

  phase(
    1,
    'Language & Runtime Fluency',
    'Be genuinely fluent in one language and its runtime. Python (FastAPI), because that is where model serving lives.',
    'Tested Python package, >80% coverage on core logic, typed end to end, mypy clean.',
    [
      topic('Python for services', 'Idiomatic Python for backend work.', [
        ['Type hints and mypy', 1],
        ['Dataclasses vs Pydantic models', 1],
        ['Context managers; decorators', 1],
        ['Generators and iterators', 1],
        [
          'Virtual environments; dependency pinning with uv or Poetry; project layout (src/ pattern)',
          1,
        ],
      ]),
      topic(
        'Concurrency model',
        'Threads vs processes vs asyncio, and when each is correct.',
        [
          ['The GIL and what it actually blocks', 1],
          ['Threads vs processes vs asyncio — when each is correct', 1.5],
          ['async/await mechanics and the event loop', 1.5],
          ['Blocking-call-in-async-handler as the classic production bug', 1],
        ],
      ),
      topic('Error handling', 'Failure modes, retries and timeouts.', [
        ['Exception hierarchies; custom exception types', 1],
        ['Fail-fast vs degrade-gracefully', 0.5],
        ['Retries with exponential backoff and jitter; idempotency', 1],
        ['Timeouts on every outbound call — non-negotiable', 0.5],
      ]),
      topic('Testing', 'pytest, coverage as a diagnostic, never as a target.', [
        ['pytest fixtures and parametrize', 1.5],
        ['Unit vs integration vs end-to-end', 1],
        ['Mocking external services', 1],
        ['Test databases via containers', 1],
        ['Coverage as a diagnostic, never as a target', 0.5],
      ]),
    ],
  ),

  phase(
    2,
    'HTTP & API Design',
    'Design and build HTTP APIs that other people can actually use.',
    'FastAPI service with cursor pagination, full OpenAPI spec, streaming endpoint, and a documented versioning policy.',
    [
      topic('HTTP deeply', 'Methods, status codes, headers, caching semantics.', [
        ['Request/response anatomy; methods and their semantics', 1],
        ['Status codes used correctly (201 vs 200, 202, 409, 422, 429)', 1],
        ['Headers that matter: Content-Type, Cache-Control, ETag, Authorization', 1],
        ['Keep-alive; HTTP/1.1 vs 2 vs 3; TLS handshake at concept level', 1],
      ]),
      topic('REST design', 'Resource modelling, idempotency, pagination, error shapes.', [
        ['Resource modelling and URI design', 1],
        ['Pagination — offset vs cursor, and why cursor wins at scale', 1],
        ['Filtering and sorting conventions; partial updates (PATCH semantics)', 1],
        ['Versioning strategies; HATEOAS (know it, rarely use it)', 1],
      ]),
      topic('FastAPI', 'Routing, dependency injection, validation, OpenAPI generation.', [
        ['Path/query/body params; Pydantic v2 validation', 1.5],
        ['Dependency injection; middleware', 1.5],
        ['Background tasks; exception handlers', 1],
        ['Auto-generated OpenAPI; response models', 1],
        ['Streaming responses — critical for LLM serving', 1],
      ]),
      topic(
        'API contracts',
        'Schema-first contracts, versioning, backward compatibility.',
        [
          ['OpenAPI/Swagger authoring', 1],
          [
            'Request/response schema evolution; backward-compatible vs breaking changes; consumer-driven contract thinking',
            1,
          ],
        ],
      ),
      topic('Alternatives — gRPC / WS / GraphQL', 'When and why to reach past REST.', [
        ['gRPC and protobufs — when binary RPC beats JSON (internal model services)', 2],
        ['WebSockets and Server-Sent Events', 1.5],
        ['GraphQL at awareness level only', 0.5],
      ]),
    ],
  ),

  phase(
    3,
    'Databases',
    'The largest allocation, deliberately. Backend interviews are won and lost on database depth — "I used Prisma" is not database depth.',
    'Table with 1M+ synthetic rows, find a slow query, read its plan, add the correct index, prove the improvement with before/after EXPLAIN ANALYZE. Write it up.',
    [
      topic('Relational modelling', 'Normalisation, keys, relationships, schema design.', [
        ['Normal forms 1NF–3NF and when to deliberately denormalise', 1.5],
        ['Primary/foreign keys; composite keys', 1],
        ['One-to-many and many-to-many relationships', 1],
        ['Soft deletes; audit columns', 1],
        [
          'Surrogate vs natural keys; UUID vs bigint as PK and the index-locality cost of random UUIDs',
          1.5,
        ],
      ]),
      topic('SQL beyond CRUD', 'Joins, window functions, CTEs, aggregation, set ops.', [
        ['JOIN types and their execution', 1.5],
        ['GROUP BY and HAVING', 1],
        ['Window functions — ROW_NUMBER, RANK, LAG/LEAD, running aggregates', 2],
        ['CTEs and recursive CTEs', 1.5],
        ['Subqueries vs joins; set operations; CASE expressions', 1],
        ['Upserts (ON CONFLICT)', 1],
      ]),
      topic('Indexing', 'B-trees, composite indexes, covering indexes, selectivity.', [
        ['B-tree internals at concept level', 1],
        ['Single vs composite index; column order in composite indexes', 1.5],
        ['Covering indexes; partial indexes', 1.5],
        ['GIN/GiST for JSONB and full-text', 1.5],
        ['Index write-cost tradeoff; when the planner ignores your index and why', 1.5],
      ]),
      topic('Query performance', 'EXPLAIN ANALYZE, query plans, diagnosing slow queries.', [
        ['EXPLAIN and EXPLAIN ANALYZE — reading the plan tree', 2],
        ['Seq scan vs index scan vs bitmap heap scan', 1.5],
        ['Nested loop vs hash vs merge join', 1.5],
        ['Row-estimate errors; ANALYZE and statistics', 1],
        ['N+1 query detection; pg_stat_statements', 1],
      ]),
      topic('Transactions', 'ACID, isolation levels, locking, deadlocks, MVCC.', [
        ['ACID precisely', 1],
        [
          'Isolation levels (read committed, repeatable read, serializable) and the anomaly each prevents',
          2,
        ],
        ['MVCC in Postgres', 1.5],
        ['Row-level locks; SELECT FOR UPDATE', 1],
        ['Deadlocks — how they form and how to avoid them', 1],
        ['Long-transaction and vacuum bloat', 0.5],
      ]),
      topic('Connections & ops', 'Pooling, migrations, backups, operational concerns.', [
        [
          'Connection pooling (PgBouncer, application-side pools); pool sizing arithmetic',
          2,
        ],
        ['Migrations with Alembic / Prisma Migrate', 1],
        ['Zero-downtime migration patterns (expand-contract)', 1],
        ['Backup and PITR concepts', 1],
      ]),
      topic('NoSQL & vectors', 'Document/KV/vector stores and when they fit.', [
        ['When document stores genuinely win; MongoDB modelling tradeoffs', 1.5],
        ['Redis data structures as a datastore', 1.5],
        [
          'Vector databases (pgvector, Qdrant) — HNSW/IVF indexing, recall vs latency tradeoff. Directly relevant to your LLM work.',
          2,
        ],
      ]),
    ],
  ),

  phase(
    4,
    'Auth & Security',
    'Reduced — you are ahead here. PROOF already covers WebAuthn/FIDO2, attestation, challenge-response, origin binding and replay resistance.',
    'Security review of one of my own projects finding 3+ real defects. If you find zero, you reviewed it lazily.',
    [
      topic('Session & token', 'Sessions, JWTs, OAuth2/OIDC, token lifecycle.', [
        ['Session cookies vs JWT — the actual tradeoff (revocation)', 1],
        ['Access + refresh token rotation', 1],
        ['Token storage: httpOnly cookie vs localStorage and the XSS implication', 1],
        ['OAuth2 flows; OIDC; SSO concepts', 1],
      ]),
      topic('Authorisation', 'RBAC/ABAC, least privilege, enforcement points.', [
        ['RBAC vs ABAC vs ReBAC', 1],
        ['Permission checks at the data layer, not the route layer', 1],
        ['Multi-tenancy isolation; row-level security in Postgres', 1],
      ]),
      topic(
        'Application security — OWASP',
        'OWASP Top 10 with a written exploit and fix for each.',
        [
          ['OWASP Top 10 — a written exploit and fix for each', 2],
          ['SQL injection and why parameterisation works', 1],
          ['XSS, CSRF, SSRF', 1],
          ['Secrets management', 0.5],
          [
            'Rate limiting (token bucket, sliding window); input validation as a boundary discipline',
            0.5,
          ],
        ],
      ),
    ],
  ),

  phase(
    5,
    'Caching & Performance',
    'Make things fast and prove the improvement with numbers.',
    'Load-test an endpoint, report p50/p95/p99, add caching, re-test, quantify the delta.',
    [
      topic('Caching theory', 'Cache layers, invalidation, TTLs, stampedes, coherence.', [
        ['Cache-aside, read-through, write-through, write-behind', 1.5],
        ['TTL selection; eviction policies (LRU, LFU, allkeys-lru)', 1.5],
        [
          'Cache stampede and how to prevent it (locking, probabilistic early expiry)',
          1.5,
        ],
        ['Invalidation — genuinely one of the two hard problems', 0.5],
      ]),
      topic('Redis', 'Data structures, patterns, persistence, eviction.', [
        ['Strings, hashes, lists, sets, sorted sets, streams', 2],
        ['Expiry semantics; pipelining', 1],
        ['Lua scripts for atomicity', 1],
        ['Distributed locks and their correctness caveats', 1],
        ['Redis as a rate limiter; persistence (RDB vs AOF)', 1],
      ]),
      topic('HTTP caching', 'Cache-Control, ETags, CDNs, conditional requests.', [
        ['ETag and conditional requests; Cache-Control directives', 1],
        ['CDN basics; static asset strategy', 1],
      ]),
      topic(
        'Measuring performance',
        'Load testing, percentiles, profiling, bottleneck analysis.',
        [
          ['Latency percentiles p50/p95/p99 — and why the mean lies', 1.5],
          ['Throughput vs latency', 0.5],
          ['Load testing with k6 or Locust', 1.5],
          [
            'Profiling Python services; finding the actual bottleneck before optimising anything',
            1.5,
          ],
        ],
      ),
    ],
  ),

  phase(
    6,
    'Async Work, Queues & Events',
    'Non-negotiable for ML serving: inference is slow, and slow work does not belong in a request cycle.',
    'Rebuild the proposal-evaluator ingestion as a queued job with retries, dead-letter handling, and a status endpoint the frontend polls.',
    [
      topic('Why queues', 'Decoupling, load levelling, backpressure, tradeoffs.', [
        ['Decoupling; load levelling; backpressure', 1.5],
        ['Sync vs async request patterns', 0.5],
        ['The 202-Accepted + polling/callback pattern', 1],
      ]),
      topic('Task queues', 'Celery/RQ/arq, workers, retries, scheduling.', [
        ['Celery (or RQ / arq) with Redis or RabbitMQ', 2],
        ['Worker pools and concurrency; task routing', 2],
        ['Retries and dead-letter queues', 2],
        ['Idempotent task design', 1],
        ['Result backends; scheduled/periodic tasks', 1],
      ]),
      topic('Message brokers', 'Delivery guarantees, partitions, consumer groups.', [
        ['RabbitMQ exchanges, bindings, routing keys', 2.5],
        ['Kafka topics, partitions, consumer groups, offsets', 3],
        [
          'At-most-once vs at-least-once vs exactly-once (and why exactly-once is mostly a marketing claim)',
          1.5,
        ],
      ]),
      topic('Event-driven design', 'Events vs commands, choreography vs orchestration.', [
        ['Pub/sub vs point-to-point; event sourcing at awareness level', 1.5],
        ['Outbox pattern for dual-write consistency', 1.5],
        ['Ordering guarantees and what breaks them; poison messages', 1],
      ]),
      topic('Long-running jobs', 'Status tracking, idempotency, dead-letter handling.', [
        ['Progress reporting; job status persistence', 1.5],
        ['Cancellation; timeouts', 0.75],
        ['Partial-failure handling in multi-step pipelines', 0.75],
      ]),
    ],
  ),

  phase(
    7,
    'Containers, CI/CD & Deployment',
    'Ship software automatically and reproducibly.',
    'One repo, one push to main, automatic test → build → deploy to a live URL. Zero manual steps — if any step is manual, the gate is failed.',
    [
      topic('Linux & networking', 'Processes, filesystems, ports, DNS, TLS basics.', [
        ['Processes, signals, file descriptors; permissions; systemd basics', 2],
        ['Ports and sockets; DNS resolution path; TCP handshake', 1.5],
        ['Reverse proxies (nginx/Caddy); TLS termination', 1.5],
        ['curl, dig, ss, lsof as daily tools', 1],
      ]),
      topic('Docker', 'Images, layers, multi-stage builds, compose.', [
        ['Images vs containers; layer caching', 1.5],
        ['Multi-stage builds; image size discipline; .dockerignore', 2],
        ['ENTRYPOINT vs CMD', 1],
        ['Volumes and bind mounts; networks', 1.5],
        ['Healthchecks; non-root users', 1],
        ['docker-compose for multi-service local dev', 1],
      ]),
      topic(
        'Orchestration — Kubernetes',
        'Working level: enough to be dangerous, not to be a platform engineer.',
        [
          ['Pods, deployments, services, ingress', 2.5],
          ['ConfigMaps and secrets', 1.5],
          ['Resource requests/limits; liveness vs readiness probes', 1.5],
          ['Horizontal pod autoscaling', 1.5],
        ],
      ),
      topic('CI/CD', 'Pipelines, test/build/deploy stages, secrets, gating.', [
        ['GitHub Actions workflows; test-lint-build-deploy pipeline', 2],
        ['Matrix builds; caching dependencies', 1],
        ['Container registry push; environment secrets', 1],
        ['Deployment strategies (rolling, blue-green, canary); rollback', 1],
      ]),
      topic('Cloud', 'Core managed services and where code runs.', [
        [
          'Compute options (VM vs container service vs serverless); object storage (S3 semantics); managed Postgres',
          1,
        ],
        [
          'IAM and least privilege; VPC basics; cost awareness — reuse your Cloud Computing Honors coursework',
          1,
        ],
      ]),
    ],
  ),

  phase(
    8,
    'Observability & Reliability',
    'The dividing line between a student who builds demos and an engineer who runs systems.',
    'Written postmortem of a failure I induced in my own system, diagnosed purely through telemetry.',
    [
      topic('Logging', 'Structured logs, levels, correlation ids, aggregation.', [
        ['Structured logging (JSON); log levels used meaningfully', 1.5],
        ['Correlation/request IDs threaded through services', 1.5],
        [
          'What must never be logged (PII, secrets, tokens); log aggregation concepts',
          1,
        ],
      ]),
      topic('Metrics', 'Prometheus, RED/USE methods, dashboards, alerting.', [
        ['Counters, gauges, histograms', 1.5],
        ['RED method (Rate, Errors, Duration) and USE method', 1.5],
        ['Prometheus scraping and PromQL basics', 1.5],
        ['Grafana dashboards; cardinality explosion as an anti-pattern', 1.5],
      ]),
      topic('Tracing', 'Distributed tracing, spans, OpenTelemetry.', [
        ['Distributed tracing concepts; spans and trace context propagation', 2],
        ['OpenTelemetry instrumentation', 1.5],
        [
          'Finding latency across a multi-service call path — exactly your React/Node/Python architecture',
          1.5,
        ],
      ]),
      topic('Reliability', 'SLOs, error budgets, graceful degradation.', [
        ['SLI/SLO/SLA distinctions; error budgets', 1.5],
        ['Graceful degradation; circuit breakers; bulkheads', 1.5],
        [
          'Health check endpoints that mean something; graceful shutdown and connection draining',
          1,
        ],
      ]),
      topic('Incident practice', 'Runbooks, on-call, postmortems, blameless review.', [
        [
          'Deliberately break your own system: kill the DB, saturate the queue, add 5s latency',
          1.5,
        ],
        ['Diagnose it using only your dashboards and logs, then write the postmortem', 1.5],
      ]),
    ],
  ),

  phase(
    9,
    'System Design',
    'Design whole systems and reason about their tradeoffs out loud.',
    'Six designs under 45-min timed conditions, articulated aloud, with explicit capacity estimates and stated tradeoffs.',
    [
      topic('Fundamentals', 'Latency/throughput, CAP, consistency, load balancing.', [
        ['Vertical vs horizontal scaling; stateless service design', 1.5],
        ['Load balancing algorithms; sticky sessions and why to avoid them', 1.5],
        [
          'CAP theorem stated correctly (not the pop-science version); consistency models',
          1.5,
        ],
        ['Idempotency at system level', 0.5],
      ]),
      topic('Data at scale', 'Sharding, replication, partitioning, caching layers.', [
        ['Read replicas and replication lag', 1.5],
        ['Sharding strategies and their pain; partitioning', 2],
        ['Denormalisation for read paths; CQRS at awareness level; hot-key problems', 1.5],
      ]),
      topic('Architecture', 'Monolith vs services, APIs, queues, storage choices.', [
        [
          'Monolith vs modular monolith vs microservices — the honest case for the modular monolith at your scale',
          2,
        ],
        ['Service boundaries; API gateway; service discovery', 1.5],
        ['The distributed-transaction problem and the saga pattern', 1.5],
      ]),
      topic('Interview practice', 'Timed design drills with capacity estimation.', [
        ['Design: URL shortener; rate limiter', 1.5],
        ['Design: notification service; feed', 1.5],
        ['Design: file upload service', 1],
        [
          'Design: a model inference platform — most relevant to you. Practise out loud, on a whiteboard, timed to 45 minutes.',
          1,
        ],
      ]),
    ],
  ),

  phase(
    10,
    'ML-Serving Backend',
    'Your actual differentiator. Most ML students cannot do any of this; most backend students cannot do the ML. You can be in the intersection.',
    'Serve one of my own quantised 7B models behind a production-shaped API — streaming, dynamic batching, request queue, Prometheus metrics, containerised.',
    [
      topic('Model serving', 'Serving quantised LLMs, runtimes, hardware constraints.', [
        ['Loading models at startup vs lazy; warm-up requests', 1.5],
        [
          'Memory-resident models and worker-count arithmetic under VRAM limits (your RTX 3050 constraint)',
          2,
        ],
        ['Model versioning and hot-swap', 1.5],
        ['A/B and shadow deployment', 1],
      ]),
      topic('Inference patterns', 'Streaming, dynamic batching, request queues.', [
        ['Sync vs async inference', 1],
        ['Dynamic batching and the latency/throughput tradeoff', 2],
        ['Streaming token output over SSE', 1.5],
        [
          'Request queuing and admission control; GPU contention between concurrent requests',
          1.5,
        ],
      ]),
      topic('Serving stacks', 'vLLM/TGI/Triton and their tradeoffs.', [
        ['FastAPI + Uvicorn tuning', 1.5],
        ['TorchServe; NVIDIA Triton', 1.5],
        ['vLLM for LLM serving — paged attention, continuous batching', 2],
        ['ONNX Runtime; quantisation’s effect on serving footprint', 1],
      ]),
      topic('Feature & data', 'Feature pipelines, data contracts for inference.', [
        ['Feature stores at concept level; training/serving skew', 1.5],
        ['Offline vs online feature retrieval', 1],
        [
          'Data validation at the serving boundary; embedding storage and vector retrieval latency',
          1.5,
        ],
      ]),
      topic('ML observability', 'Latency, throughput, token metrics, drift.', [
        ['Prediction logging', 1],
        ['Input drift and concept drift detection', 1.5],
        ['Model performance monitoring in production; ground-truth delay', 1],
        ['Shadow evaluation; feedback loops', 0.5],
      ]),
      topic('MLOps surface', 'Model registry, versioning, rollout, rollback.', [
        ['Experiment tracking (MLflow, W&B); model registry', 1.5],
        ['Reproducible pipelines', 1],
        [
          'Containerising GPU workloads (CUDA base images, nvidia-container-toolkit); CI for models',
          1.5,
        ],
      ]),
    ],
  ),

  phase(
    11,
    'Capstone Integration',
    'Tie everything together into one defensible system.',
    'A stranger can clone the repo, run one command, and have the whole system running locally. If setup requires a conversation with you, it is not finished.',
    [
      topic('Build', 'One system that uses every prior module.', [
        ['FastAPI service with Postgres and deliberate indexing', 4],
        ['Redis cache and Celery workers', 3],
        ['Containerised, with CI/CD to a live URL', 3],
        ['Prometheus + Grafana and structured logs', 3],
        ['Load-tested, with a model-serving path wired in', 3],
      ]),
      topic('Document', 'README, architecture notes, one-command bootstrap.', [
        ['Architecture diagram', 1],
        ['ADRs (architecture decision records) explaining why, not what', 2],
        [
          'Benchmark results with numbers; known limitations stated honestly; runbook',
          2,
        ],
      ]),
      topic('Defend', 'Be able to explain and justify every design choice.', [
        ['Justify every technology choice against a named alternative', 2],
        [
          'State what you would do differently at 100x traffic. Rehearse this — interviewers probe exactly here.',
          2,
        ],
      ]),
    ],
  ),
];

/**
 * Fail loudly if the syllabus hours are inconsistent. Called at seed time.
 * Throws on any mismatch rather than silently seeding bad data.
 */
export function verifySeedHours(phases: readonly Phase[] = SEED_PHASES): void {
  const errors: string[] = [];

  for (const p of phases) {
    for (const t of p.topics) {
      const subSum = t.subtopics.reduce((s, x) => s + x.hours, 0);
      if (Math.abs(subSum - t.hours) > 0.001) {
        errors.push(
          `Phase ${p.id} → ${t.name}: subtopic hours sum to ${subSum}, declared ${t.hours}.`,
        );
      }
    }
    const topicSum = p.topics.reduce((s, t) => s + t.hours, 0);
    if (Math.abs(topicSum - p.hours) > 0.001) {
      errors.push(
        `Phase ${p.id} (${p.title}): topic hours sum to ${topicSum}, declared ${p.hours}.`,
      );
    }
  }

  const grandTotal = phases.reduce((s, p) => s + p.hours, 0);
  if (Math.abs(grandTotal - TOTAL_SYLLABUS_HOURS) > 0.001) {
    errors.push(`Grand total is ${grandTotal}h, expected ${TOTAL_SYLLABUS_HOURS}h.`);
  }

  if (errors.length > 0) {
    throw new Error(`Seed data hour verification FAILED:\n - ${errors.join('\n - ')}`);
  }
}
