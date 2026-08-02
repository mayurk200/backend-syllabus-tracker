/**
 * Backend Engineering — the reference layer over the study plan in seedData.ts.
 *
 * There is no external authority for this syllabus the way there is for GATE:
 * the plan in seedData.ts *is* the syllabus. So rather than duplicate that tree
 * (and let the two drift apart), this file adds one line of explanation per
 * concept, keyed by the subtopic's exact name, plus the canonical source to
 * read for each phase.
 *
 * Lookups are normalised on whitespace, so a concept with no gloss simply
 * renders without one — nothing breaks if seedData.ts gains a subtopic.
 */

import type { LearnFrom } from './gateSyllabus';

type GlossSpec = [concept: string, gloss: string];

const GLOSSES: GlossSpec[] = [
  // ── Phase 0 · Prerequisite Audit ──────────────────────────────────────────
  ['Write from a blank file, no reference: a REST endpoint with input validation', 'The honest test of whether you can write a service or only edit one.'],
  ['A parameterised SQL query, written cold', 'If you reach for string concatenation here, injection is still a live risk in your code.'],
  ['A Dockerfile, written cold', 'Base image, dependency layer, copy, entrypoint — in that order, from memory.'],
  ['A unit test with one mock. Time yourself — under 45 min = skip Phases 1–2', 'The timer is the point: fluency, not recall.'],
  ['List every technology in your existing projects (HMS, PROOF, alumni portal, proposal evaluator) and mark each: can rebuild from scratch / can modify / copied it. Only the third category is real study time.', 'Turns a vague sense of "I know this" into a written, falsifiable list.'],
  ['Answer honestly: can you read an EXPLAIN plan? Have you ever set a database index deliberately? Have you written a load test? These answers set your starting phase.', 'Three yes/no questions that separate someone who has run a system from someone who has only built one.'],

  // ── Phase 1 · Language & Runtime Fluency ─────────────────────────────────
  ['Type hints and mypy', 'Types as a checked contract, not decoration; mypy in strict mode is the gate.'],
  ['Dataclasses vs Pydantic models', 'Dataclasses are plain containers; Pydantic validates and coerces at the boundary.'],
  ['Context managers; decorators', 'with for deterministic cleanup; decorators for cross-cutting concerns like timing and auth.'],
  ['Generators and iterators', 'Lazy sequences that keep memory flat over large result sets; the yield protocol.'],
  ['Virtual environments; dependency pinning with uv or Poetry; project layout (src/ pattern)', 'Reproducible installs and an import path that cannot accidentally pick up your working tree.'],
  ['The GIL and what it actually blocks', 'It serialises bytecode execution, not I/O — which is why threads still help network-bound work.'],
  ['Threads vs processes vs asyncio — when each is correct', 'I/O-bound with many waits → asyncio; CPU-bound → processes; blocking libraries → threads.'],
  ['async/await mechanics and the event loop', 'Coroutines yield control at await; a single loop interleaves thousands of waiting requests.'],
  ['Blocking-call-in-async-handler as the classic production bug', 'One synchronous DB call inside an async handler stalls every other request on that worker.'],
  ['Exception hierarchies; custom exception types', 'Domain errors as types so callers can catch precisely rather than catching Exception.'],
  ['Fail-fast vs degrade-gracefully', 'Decide per dependency: a missing cache should degrade, a missing database should fail.'],
  ['Retries with exponential backoff and jitter; idempotency', 'Backoff stops you amplifying an outage; jitter stops clients retrying in lockstep.'],
  ['Timeouts on every outbound call — non-negotiable', 'A call with no timeout is an unbounded resource hold; it is how one slow dependency takes down a fleet.'],
  ['pytest fixtures and parametrize', 'Fixtures for setup and teardown, parametrize to turn one test into a table of cases.'],
  ['Unit vs integration vs end-to-end', 'Speed and confidence trade off; most of your suite should be the fast kind.'],
  ['Mocking external services', 'Replace the network at the boundary, never in the middle of your own logic.'],
  ['Test databases via containers', 'A real Postgres per test run — the only way to test SQL you actually ship.'],
  ['Coverage as a diagnostic, never as a target', 'It tells you what is untested; it says nothing about whether the tests are good.'],

  // ── Phase 2 · HTTP & API Design ──────────────────────────────────────────
  ['Request/response anatomy; methods and their semantics', 'Safe, idempotent and cacheable are properties of the method, and clients rely on them.'],
  ['Status codes used correctly (201 vs 200, 202, 409, 422, 429)', 'The status code is part of your API contract; 200-for-everything makes clients guess.'],
  ['Headers that matter: Content-Type, Cache-Control, ETag, Authorization', 'Content negotiation, caching and auth are all header-driven.'],
  ['Keep-alive; HTTP/1.1 vs 2 vs 3; TLS handshake at concept level', 'Connection reuse, multiplexing, and where the round trips actually go.'],
  ['Resource modelling and URI design', 'Nouns not verbs; the URL identifies a thing, the method says what to do to it.'],
  ['Pagination — offset vs cursor, and why cursor wins at scale', 'OFFSET scans and skips rows; a cursor seeks straight to the position and is stable under inserts.'],
  ['Filtering and sorting conventions; partial updates (PATCH semantics)', 'A consistent query grammar, and PATCH that specifies what changed rather than the whole object.'],
  ['Versioning strategies; HATEOAS (know it, rarely use it)', 'URL, header or media-type versioning; hypermedia links are elegant and almost never adopted.'],
  ['Path/query/body params; Pydantic v2 validation', 'Declared types become validation, coercion and documentation in one move.'],
  ['Dependency injection; middleware', 'Depends() for per-request resources; middleware for concerns that span every route.'],
  ['Background tasks; exception handlers', 'Fire-and-forget work after the response, and one place that maps exceptions to responses.'],
  ['Auto-generated OpenAPI; response models', 'The schema is derived from the code, so it cannot silently go stale.'],
  ['Streaming responses — critical for LLM serving', 'Send tokens as they are produced; time-to-first-token is what the user perceives.'],
  ['OpenAPI/Swagger authoring', 'The machine-readable contract clients generate against.'],
  ['Request/response schema evolution; backward-compatible vs breaking changes; consumer-driven contract thinking', 'Adding optional fields is safe; removing or retyping is not. Let consumers assert what they need.'],
  ['gRPC and protobufs — when binary RPC beats JSON (internal model services)', 'Smaller payloads, generated stubs, streaming built in — worth it inside your own network.'],
  ['WebSockets and Server-Sent Events', 'Bidirectional versus server-push-only; SSE is enough for token streaming.'],
  ['GraphQL at awareness level only', 'Client-specified queries solve over-fetching and introduce N+1 and caching problems.'],

  // ── Phase 3 · Databases ──────────────────────────────────────────────────
  ['Normal forms 1NF–3NF and when to deliberately denormalise', 'Normalise for correctness by default; denormalise only with a measured read path to justify it.'],
  ['Primary/foreign keys; composite keys', 'Identity and referential integrity enforced by the database rather than by hope.'],
  ['One-to-many and many-to-many relationships', 'Foreign key on the many side; a join table for many-to-many.'],
  ['Soft deletes; audit columns', 'deleted_at instead of DELETE, plus created_at/updated_at — and the indexes they then require.'],
  ['Surrogate vs natural keys; UUID vs bigint as PK and the index-locality cost of random UUIDs', 'Random UUIDs scatter B-tree inserts across the index; UUIDv7 or bigint keeps them sequential.'],
  ['JOIN types and their execution', 'Inner, left, right, full and cross — and the row counts each produces.'],
  ['GROUP BY and HAVING', 'Aggregate then filter groups; WHERE filters rows before grouping.'],
  ['Window functions — ROW_NUMBER, RANK, LAG/LEAD, running aggregates', 'Aggregate without collapsing rows — top-N-per-group in one pass.'],
  ['CTEs and recursive CTEs', 'Named subqueries for readability; recursion for trees and graph walks.'],
  ['Subqueries vs joins; set operations; CASE expressions', 'Usually equivalent plans; readability and the planner decide which to write.'],
  ['Upserts (ON CONFLICT)', 'Insert-or-update atomically instead of racing a SELECT then INSERT.'],
  ['B-tree internals at concept level', 'Sorted, balanced, high fanout — which is why range scans and ORDER BY can use an index.'],
  ['Single vs composite index; column order in composite indexes', 'A composite index serves any prefix of its columns; order decides which queries it helps.'],
  ['Covering indexes; partial indexes', 'INCLUDE the selected columns for index-only scans; index only the rows you actually query.'],
  ['GIN/GiST for JSONB and full-text', 'Inverted and generalised search trees for containment and text queries.'],
  ['Index write-cost tradeoff; when the planner ignores your index and why', 'Every index costs on write; the planner skips it when selectivity is poor or statistics are stale.'],
  ['EXPLAIN and EXPLAIN ANALYZE — reading the plan tree', 'Estimated versus actual rows is the first thing to check; a big gap explains most bad plans.'],
  ['Seq scan vs index scan vs bitmap heap scan', 'Sequential is right for large fractions of a table; bitmap sits between the two.'],
  ['Nested loop vs hash vs merge join', 'Loop for small outer inputs, hash for large unsorted, merge for pre-sorted.'],
  ['Row-estimate errors; ANALYZE and statistics', 'Stale statistics give wrong estimates, which give wrong join orders.'],
  ['N+1 query detection; pg_stat_statements', 'One query per row of a result set — invisible locally, fatal at scale.'],
  ['ACID precisely', 'Atomic, consistent, isolated, durable — and which of the four your isolation level actually gives you.'],
  ['Isolation levels (read committed, repeatable read, serializable) and the anomaly each prevents', 'Dirty read, non-repeatable read, phantom, write skew — map each level to what it stops.'],
  ['MVCC in Postgres', 'Readers never block writers; old row versions live until vacuum removes them.'],
  ['Row-level locks; SELECT FOR UPDATE', 'Explicit pessimistic locking for read-modify-write sequences.'],
  ['Deadlocks — how they form and how to avoid them', 'Two transactions taking the same locks in opposite orders; fix by ordering acquisition consistently.'],
  ['Long-transaction and vacuum bloat', 'An open transaction pins old row versions and the table grows without bound.'],
  ['Connection pooling (PgBouncer, application-side pools); pool sizing arithmetic', 'Connections are expensive; size the pool from cores and query time, not from optimism.'],
  ['Migrations with Alembic / Prisma Migrate', 'Schema changes as versioned, reviewable, replayable code.'],
  ['Zero-downtime migration patterns (expand-contract)', 'Add the new shape, backfill, switch reads, then drop the old — never all at once.'],
  ['Backup and PITR concepts', 'A backup you have never restored is a hypothesis, not a backup.'],
  ['When document stores genuinely win; MongoDB modelling tradeoffs', 'Whole-document reads and schema variance; you pay in joins and consistency.'],
  ['Redis data structures as a datastore', 'Sorted sets and hashes as real primitives, not just a string cache.'],
  ['Vector databases (pgvector, Qdrant) — HNSW/IVF indexing, recall vs latency tradeoff. Directly relevant to your LLM work.', 'Approximate nearest neighbour: you trade exactness for speed, and recall is the dial.'],

  // ── Phase 4 · Auth & Security ────────────────────────────────────────────
  ['Session cookies vs JWT — the actual tradeoff (revocation)', 'Sessions are revocable because the server holds state; a JWT is valid until it expires.'],
  ['Access + refresh token rotation', 'Short-lived access tokens limit the blast radius; rotating refresh tokens detect theft.'],
  ['Token storage: httpOnly cookie vs localStorage and the XSS implication', 'localStorage is readable by any injected script; httpOnly cookies are not.'],
  ['OAuth2 flows; OIDC; SSO concepts', 'Authorisation code with PKCE for real clients; OIDC adds identity on top of OAuth2.'],
  ['RBAC vs ABAC vs ReBAC', 'Roles, attributes, or relationships as the basis for a permission decision.'],
  ['Permission checks at the data layer, not the route layer', 'Route checks are bypassed by the next code path; a query filter is not.'],
  ['Multi-tenancy isolation; row-level security in Postgres', 'Tenant separation enforced by the database so one missing WHERE clause is not a breach.'],
  ['OWASP Top 10 — a written exploit and fix for each', 'You do not understand a vulnerability class until you have exploited it once.'],
  ['SQL injection and why parameterisation works', 'Parameters keep data out of the parsed statement; escaping is a losing arms race.'],
  ['XSS, CSRF, SSRF', 'Injected script, forged cross-site request, and a server tricked into fetching an internal URL.'],
  ['Secrets management', 'Out of the repo, out of the image, injected at runtime, rotatable.'],
  ['Rate limiting (token bucket, sliding window); input validation as a boundary discipline', 'Bound what a single caller can consume, and validate once, at the edge, into typed objects.'],

  // ── Phase 5 · Caching & Performance ──────────────────────────────────────
  ['Cache-aside, read-through, write-through, write-behind', 'Who populates the cache and when — the four standard arrangements and their failure modes.'],
  ['TTL selection; eviction policies (LRU, LFU, allkeys-lru)', 'TTL bounds staleness; the eviction policy decides what goes when memory runs out.'],
  ['Cache stampede and how to prevent it (locking, probabilistic early expiry)', 'One expiry sends every concurrent request to the database at once.'],
  ['Invalidation — genuinely one of the two hard problems', 'Correct invalidation needs to know every key a write affects, which is rarely obvious.'],
  ['Strings, hashes, lists, sets, sorted sets, streams', 'Redis is a data-structure server; picking the right structure removes most application logic.'],
  ['Expiry semantics; pipelining', 'Lazy plus active expiry; pipelining removes a round trip per command.'],
  ['Lua scripts for atomicity', 'Multi-step logic executed server-side without an interleaving window.'],
  ['Distributed locks and their correctness caveats', 'Redlock is contested; a lock without fencing tokens is not safe under GC pauses.'],
  ['Redis as a rate limiter; persistence (RDB vs AOF)', 'INCR with expiry as the counter; snapshot versus append-only durability.'],
  ['ETag and conditional requests; Cache-Control directives', 'Revalidate cheaply with 304 instead of re-sending the body.'],
  ['CDN basics; static asset strategy', 'Push bytes to the edge; content-hashed filenames make immutable caching safe.'],
  ['Latency percentiles p50/p95/p99 — and why the mean lies', 'The mean hides the tail; users experience the tail.'],
  ['Throughput vs latency', 'Queueing means they trade against each other — pushing utilisation up pushes latency up faster.'],
  ['Load testing with k6 or Locust', 'Find the knee of the curve before production finds it for you.'],
  ['Profiling Python services; finding the actual bottleneck before optimising anything', 'Measure first; intuition about where time goes is wrong most of the time.'],

  // ── Phase 6 · Async Work, Queues & Events ────────────────────────────────
  ['Decoupling; load levelling; backpressure', 'A queue absorbs bursts, but an unbounded queue converts a throughput problem into a memory one.'],
  ['Sync vs async request patterns', 'Return a result now, or return a receipt and do the work later.'],
  ['The 202-Accepted + polling/callback pattern', 'The standard shape for work that outlives the request.'],
  ['Celery (or RQ / arq) with Redis or RabbitMQ', 'Task definitions, a broker, and worker processes that pull from it.'],
  ['Worker pools and concurrency; task routing', 'Separate queues per workload so a slow job type cannot starve a fast one.'],
  ['Retries and dead-letter queues', 'Retry the transient, quarantine the permanent — never retry forever.'],
  ['Idempotent task design', 'At-least-once delivery means your task will run twice; make that harmless.'],
  ['Result backends; scheduled/periodic tasks', 'Where results land, and cron-like scheduling with the duplicate-fire caveat.'],
  ['RabbitMQ exchanges, bindings, routing keys', 'Routing is declarative: producers publish to an exchange, bindings decide the queues.'],
  ['Kafka topics, partitions, consumer groups, offsets', 'A partitioned log; ordering holds within a partition, and the consumer owns its offset.'],
  ['At-most-once vs at-least-once vs exactly-once (and why exactly-once is mostly a marketing claim)', 'Exactly-once needs idempotency or transactions at the sink — the broker alone cannot give it.'],
  ['Pub/sub vs point-to-point; event sourcing at awareness level', 'Broadcast versus single-consumer; event sourcing keeps the log as the source of truth.'],
  ['Outbox pattern for dual-write consistency', 'Write the event into the same transaction as the data, then relay it — removes the lost-event race.'],
  ['Ordering guarantees and what breaks them; poison messages', 'Retries and parallel consumers break order; one bad message can block a partition forever.'],
  ['Progress reporting; job status persistence', 'Status in a store the API can read, not in worker memory.'],
  ['Cancellation; timeouts', 'A job with no deadline eventually becomes a stuck job nobody notices.'],
  ['Partial-failure handling in multi-step pipelines', 'Step three failing must leave a recoverable state, not a half-written one.'],

  // ── Phase 7 · Containers, CI/CD & Deployment ─────────────────────────────
  ['Processes, signals, file descriptors; permissions; systemd basics', 'SIGTERM is how orchestrators ask you to stop; handling it is what makes shutdown graceful.'],
  ['Ports and sockets; DNS resolution path; TCP handshake', 'What actually happens between a hostname and a byte on the wire.'],
  ['Reverse proxies (nginx/Caddy); TLS termination', 'One place for TLS, timeouts, buffering and routing in front of your app.'],
  ['curl, dig, ss, lsof as daily tools', 'The four commands that answer "is it the network or is it me".'],
  ['Images vs containers; layer caching', 'An image is a stack of layers; ordering the Dockerfile decides your rebuild time.'],
  ['Multi-stage builds; image size discipline; .dockerignore', 'Build in a fat stage, ship a thin one; smaller images pull and start faster.'],
  ['ENTRYPOINT vs CMD', 'ENTRYPOINT fixes the executable, CMD supplies the default arguments.'],
  ['Volumes and bind mounts; networks', 'Persistence outside the container lifecycle, and service-to-service name resolution.'],
  ['Healthchecks; non-root users', 'The orchestrator needs a truthful signal, and the process should not be root.'],
  ['docker-compose for multi-service local dev', 'The whole stack — app, database, cache, broker — with one command.'],
  ['Pods, deployments, services, ingress', 'The four objects that get traffic from outside the cluster to your container.'],
  ['ConfigMaps and secrets', 'Configuration and credentials injected as environment or files, kept out of the image.'],
  ['Resource requests/limits; liveness vs readiness probes', 'Requests drive scheduling, limits drive eviction; liveness restarts, readiness removes from the load balancer.'],
  ['Horizontal pod autoscaling', 'Scale on a metric that actually tracks load, not on CPU by reflex.'],
  ['GitHub Actions workflows; test-lint-build-deploy pipeline', 'The pipeline is the only path to production; anything else is a manual step waiting to go wrong.'],
  ['Matrix builds; caching dependencies', 'Parallel across versions, cached installs to keep the feedback loop short.'],
  ['Container registry push; environment secrets', 'Immutable tagged artefacts, with credentials scoped per environment.'],
  ['Deployment strategies (rolling, blue-green, canary); rollback', 'How much traffic sees the new version first, and how fast you can undo it.'],
  ['Compute options (VM vs container service vs serverless); object storage (S3 semantics); managed Postgres', 'Where code runs and where bytes live; S3 is eventually consistent about listings, not about objects.'],
  ['IAM and least privilege; VPC basics; cost awareness — reuse your Cloud Computing Honors coursework', 'Identity is the real perimeter; network segmentation and a bill you can predict follow from it.'],

  // ── Phase 8 · Observability & Reliability ────────────────────────────────
  ['Structured logging (JSON); log levels used meaningfully', 'Logs you can query by field; if everything is INFO, nothing is.'],
  ['Correlation/request IDs threaded through services', 'One id carried across every hop — the only way to reconstruct a single request.'],
  ['What must never be logged (PII, secrets, tokens); log aggregation concepts', 'Logs leave your trust boundary; treat them as published.'],
  ['Counters, gauges, histograms', 'Monotonic totals, point-in-time values, and distributions — percentiles need the third.'],
  ['RED method (Rate, Errors, Duration) and USE method', 'RED for request-driven services, USE (utilisation, saturation, errors) for resources.'],
  ['Prometheus scraping and PromQL basics', 'Pull-based collection; rate() over a counter is the query you will write most.'],
  ['Grafana dashboards; cardinality explosion as an anti-pattern', 'A label with unbounded values (user id, request id) will kill your metrics store.'],
  ['Distributed tracing concepts; spans and trace context propagation', 'A trace is a tree of spans; it only works if context crosses every boundary.'],
  ['OpenTelemetry instrumentation', 'One vendor-neutral API for traces, metrics and logs.'],
  ['Finding latency across a multi-service call path — exactly your React/Node/Python architecture', 'The waterfall view shows which hop owns the latency, ending the argument.'],
  ['SLI/SLO/SLA distinctions; error budgets', 'Indicator is measured, objective is chosen, agreement is contractual; the budget is your licence to ship.'],
  ['Graceful degradation; circuit breakers; bulkheads', 'Shed features rather than fail; stop calling a dead dependency; isolate pools so one failure is contained.'],
  ['Health check endpoints that mean something; graceful shutdown and connection draining', 'A health check that always returns 200 is decoration; drain in-flight requests before exiting.'],
  ['Deliberately break your own system: kill the DB, saturate the queue, add 5s latency', 'You do not know your failure modes until you have caused them on purpose.'],
  ['Diagnose it using only your dashboards and logs, then write the postmortem', 'If your own telemetry cannot explain a failure you engineered, it will not explain a real one.'],

  // ── Phase 9 · System Design ──────────────────────────────────────────────
  ['Vertical vs horizontal scaling; stateless service design', 'Statelessness is what makes horizontal scaling possible at all.'],
  ['Load balancing algorithms; sticky sessions and why to avoid them', 'Round robin, least connections, hashing; stickiness reintroduces the state you just removed.'],
  ['CAP theorem stated correctly (not the pop-science version); consistency models', 'Under a partition you choose consistency or availability — it says nothing about the normal case.'],
  ['Idempotency at system level', 'Idempotency keys so a retried payment does not become two payments.'],
  ['Read replicas and replication lag', 'Reads scale easily; read-your-own-writes stops working the moment you use a replica.'],
  ['Sharding strategies and their pain; partitioning', 'Range, hash and directory sharding; cross-shard queries and rebalancing are the real cost.'],
  ['Denormalisation for read paths; CQRS at awareness level; hot-key problems', 'Separate read and write models when their shapes genuinely differ; one hot key defeats any sharding scheme.'],
  ['Monolith vs modular monolith vs microservices — the honest case for the modular monolith at your scale', 'Microservices trade a code problem for a distributed-systems problem; only take that trade deliberately.'],
  ['Service boundaries; API gateway; service discovery', 'Draw boundaries on data ownership, not on team convenience.'],
  ['The distributed-transaction problem and the saga pattern', 'No two-phase commit across services; compensating transactions instead.'],
  ['Design: URL shortener; rate limiter', 'Key generation, storage and redirect latency; token bucket at scale.'],
  ['Design: notification service; feed', 'Fan-out on write versus on read, and where the celebrity problem bites.'],
  ['Design: file upload service', 'Pre-signed URLs, chunking, resumability and virus scanning.'],
  ['Design: a model inference platform — most relevant to you. Practise out loud, on a whiteboard, timed to 45 minutes.', 'Queueing, batching, GPU scheduling and autoscaling on a metric that reflects real load.'],

  // ── Phase 10 · ML-Serving Backend ────────────────────────────────────────
  ['Loading models at startup vs lazy; warm-up requests', 'Cold-start latency is real; a warm-up request pays it before a user does.'],
  ['Memory-resident models and worker-count arithmetic under VRAM limits (your RTX 3050 constraint)', 'Model size times workers must fit in VRAM — this arithmetic decides your concurrency.'],
  ['Model versioning and hot-swap', 'Load the new weights alongside, switch atomically, keep the old for rollback.'],
  ['A/B and shadow deployment', 'Split traffic to compare, or mirror traffic to a new model without serving its output.'],
  ['Sync vs async inference', 'Short prompts inline; long generations through a queue with a job id.'],
  ['Dynamic batching and the latency/throughput tradeoff', 'Waiting a few milliseconds to batch multiplies GPU throughput at a small latency cost.'],
  ['Streaming token output over SSE', 'Perceived latency collapses when the first token arrives early.'],
  ['Request queuing and admission control; GPU contention between concurrent requests', 'Reject early rather than accept work you cannot finish; the GPU is one serial resource.'],
  ['FastAPI + Uvicorn tuning', 'Worker count, loop implementation, and keeping the event loop free of blocking calls.'],
  ['TorchServe; NVIDIA Triton', 'Purpose-built servers with batching, versioning and metrics already solved.'],
  ['vLLM for LLM serving — paged attention, continuous batching', 'PagedAttention removes KV-cache fragmentation; continuous batching keeps the GPU busy between requests.'],
  ['ONNX Runtime; quantisation’s effect on serving footprint', 'Graph-level optimisation and lower-precision weights to fit the model into the memory you have.'],
  ['Feature stores at concept level; training/serving skew', 'The same transformation must run in both places, or your production accuracy silently drops.'],
  ['Offline vs online feature retrieval', 'Batch computation for training, low-latency lookup for inference.'],
  ['Data validation at the serving boundary; embedding storage and vector retrieval latency', 'Reject malformed input before the model sees it; ANN recall and latency are a tuned tradeoff.'],
  ['Prediction logging', 'Log inputs and outputs so you can evaluate the model after the fact.'],
  ['Input drift and concept drift detection', 'The inputs change, or the relationship changes; both degrade accuracy without any error appearing.'],
  ['Model performance monitoring in production; ground-truth delay', 'You often learn the true label days later — monitoring has to tolerate that lag.'],
  ['Shadow evaluation; feedback loops', 'Evaluate on live traffic without serving it; beware the model influencing its own future training data.'],
  ['Experiment tracking (MLflow, W&B); model registry', 'Which weights, which data, which code produced this result.'],
  ['Reproducible pipelines', 'Pinned data, pinned code, pinned environment — otherwise the result is an anecdote.'],
  ['Containerising GPU workloads (CUDA base images, nvidia-container-toolkit); CI for models', 'Driver and CUDA compatibility is the whole difficulty; CI must test the image on a GPU.'],

  // ── Phase 11 · Capstone Integration ──────────────────────────────────────
  ['FastAPI service with Postgres and deliberate indexing', 'Every index present because a measured query needed it, and you can say which.'],
  ['Redis cache and Celery workers', 'A real cache with a real invalidation story, and real work moved off the request path.'],
  ['Containerised, with CI/CD to a live URL', 'A stranger can reach it, and a commit reaches it without you touching a server.'],
  ['Prometheus + Grafana and structured logs', 'You can answer "is it healthy" and "why was that request slow" from the dashboard.'],
  ['Load-tested, with a model-serving path wired in', 'You know the number of requests per second at which it degrades, and what degrades first.'],
  ['Architecture diagram', 'One page showing every component and every data flow between them.'],
  ['ADRs (architecture decision records) explaining why, not what', 'Context, options considered, decision, consequences — the record of your reasoning.'],
  ['Benchmark results with numbers; known limitations stated honestly; runbook', 'Numbers with methodology, limits you have not fixed, and what to do at 3 a.m.'],
  ['Justify every technology choice against a named alternative', '"Postgres because…" is only an answer if you can finish it with "…rather than MySQL, because".'],
  ['State what you would do differently at 100x traffic. Rehearse this — interviewers probe exactly here.', 'The question separates people who have thought about scale from people who have read about it.'],
];

/** Where to learn each phase from — same shape as the GATE track. */
export const BACKEND_LEARN_FROM: Record<string, LearnFrom> = {
  'Prerequisite Audit': {
    text: ['None. This phase is a measurement, not a lesson.'],
    lectures: ['None.'],
    practice: ['A blank editor and a timer — that is the whole exercise.'],
    note: 'Reading anything here defeats the purpose. The point is to find out what you can do cold.',
  },
  'Language & Runtime Fluency': {
    text: [
      'Fluent Python — Luciano Ramalho (the data model, generators, decorators, concurrency chapters)',
      'Architecture Patterns with Python — Percival and Gregory, for structuring a real service',
    ],
    lectures: ['ArjanCodes on Python design, if you want it demonstrated rather than read'],
    practice: [
      'Rewrite one of your existing scripts as a typed, tested package with mypy clean',
      'pytest documentation, working through fixtures and parametrize on your own code',
    ],
    note: 'Fluency is measured by what you write without looking anything up, so the practice matters more than the reading.',
  },
  'HTTP & API Design': {
    text: [
      'The MDN HTTP reference — methods, status codes, headers, caching',
      'RFC 9110 (HTTP Semantics) when you need the definitive wording',
      'The FastAPI documentation, read end to end — it is short and unusually good',
    ],
    lectures: ['None needed. This subject is documentation and practice.'],
    practice: [
      'Build one API and get every status code right on purpose',
      'Write the OpenAPI spec first, then implement against it',
    ],
    note: 'Almost nobody reads the HTTP spec and it shows in their APIs. Two evenings on RFC 9110 puts you ahead.',
  },
  Databases: {
    text: [
      'Designing Data-Intensive Applications — Martin Kleppmann, Ch. 2, 3 and 7',
      'The PostgreSQL documentation — indexes, the planner, MVCC and EXPLAIN',
      'Use The Index, Luke! — the best single source on index design',
    ],
    lectures: ['CMU Database Systems (Andy Pavlo), if you want the depth behind the practice'],
    practice: [
      'Load a million rows, find a slow query, read its plan, add the index, prove the improvement',
      'Reproduce each isolation-level anomaly yourself in two psql sessions',
    ],
    note: 'This is the phase where your GATE DBMS study and your engineering work reinforce each other — do them close together.',
  },
  'Auth & Security': {
    text: [
      'The OWASP Top 10 and the OWASP Cheat Sheet Series',
      'OAuth 2.0 Simplified — Aaron Parecki',
    ],
    lectures: ['PortSwigger Web Security Academy — free, hands-on, exploit-first'],
    practice: [
      'Exploit each Top 10 category once in a sandbox, then write the fix',
      'Add row-level security to one of your own projects',
    ],
    note: 'You do not understand a vulnerability class until you have exploited it. Reading about SQL injection is not the same thing.',
  },
  'Caching & Performance': {
    text: [
      'The Redis documentation — data types, expiry, persistence, scripting',
      'Systems Performance — Brendan Gregg, the methodology chapters',
    ],
    lectures: ['None needed.'],
    practice: [
      'Load test with k6 or Locust until you find the knee of the curve',
      'Profile a slow endpoint and fix the actual bottleneck, not the one you assumed',
    ],
    note: 'Every optimisation here must be preceded by a measurement. That discipline is the real content of the phase.',
  },
  'Async Work, Queues & Events': {
    text: [
      'Designing Data-Intensive Applications — Ch. 11 (stream processing)',
      'The Celery and RabbitMQ documentation',
      'Kafka: The Definitive Guide, for the log model',
    ],
    lectures: ['None needed.'],
    practice: [
      'Build a pipeline, kill a worker mid-task and prove the work still completes exactly once',
      'Implement the outbox pattern once by hand',
    ],
    note: 'The patterns (microservices.io is the standard catalogue) matter more than any particular broker.',
  },
  'Containers, CI/CD & Deployment': {
    text: [
      'The Docker documentation — Dockerfile best practices and multi-stage builds',
      'The Kubernetes documentation — workloads, services, configuration',
      'The Linux Command Line — William Shotts, for the shell foundations',
    ],
    lectures: ['None needed. Build things and read the errors.'],
    practice: [
      'Get one service from a blank repository to a live URL through a pipeline you wrote',
      'Break the deploy deliberately and practise the rollback',
    ],
    note: 'Reuse your Cloud Computing Honors coursework here rather than starting the cloud material from scratch.',
  },
  'Observability & Reliability': {
    text: [
      'The Google SRE Book and the SRE Workbook — the SLO and error-budget chapters',
      'The OpenTelemetry and Prometheus documentation',
    ],
    lectures: ['None needed.'],
    practice: [
      'Instrument your own service, then break it and diagnose it using only the dashboards',
      'Write a real postmortem for a failure you caused on purpose',
    ],
    note: 'The test is whether your telemetry explains a failure you engineered. If it cannot, it will not explain a real one.',
  },
  'System Design': {
    text: [
      'Designing Data-Intensive Applications — the whole book, this time',
      'System Design Interview — Alex Xu, volumes 1 and 2',
    ],
    lectures: ['Hussein Nasser or ByteByteGo, for the interview framing'],
    practice: [
      'Timed 45-minute whiteboard drills, spoken out loud, one design per session',
      'The AWS and Google Cloud architecture centres for reference designs',
    ],
    note: 'Reading system design without speaking it out loud under time does not transfer to an interview.',
  },
  'ML-Serving Backend': {
    text: [
      'Designing Machine Learning Systems — Chip Huyen',
      'The vLLM, NVIDIA Triton and TorchServe documentation',
      'Machine Learning Engineering — Andriy Burkov, the deployment chapters',
    ],
    lectures: ['None needed — this area moves faster than any course.'],
    practice: [
      'Serve a quantised model on your RTX 3050 and find the concurrency limit empirically',
      'Measure time-to-first-token with and without dynamic batching',
    ],
    note: 'The VRAM arithmetic is the whole constraint on your hardware — do it on paper before you write any code.',
  },
  'Capstone Integration': {
    text: ['None. Everything here is assembly and defence of what you already built.'],
    lectures: ['None.'],
    practice: [
      'Build it, load test it, then explain every choice out loud to someone who will push back',
    ],
    note: 'If you need to read something new at this point, an earlier phase was not finished.',
  },
};

/** Per-topic reading pointer, keyed by `phase title|topic name`. */
export const BACKEND_TOPIC_SOURCES: Record<string, string> = {
  'Prerequisite Audit|Skip test': 'Nothing. Blank editor, timer running.',
  'Prerequisite Audit|Gap inventory': 'Your own repositories — read them as if someone else wrote them.',
  'Prerequisite Audit|Baseline metrics': 'Nothing. Three honest yes/no answers.',

  'Language & Runtime Fluency|Python for services': 'Fluent Python, the Data Model and Functions as Objects chapters; the typing and contextlib docs',
  'Language & Runtime Fluency|Concurrency model': 'Fluent Python, the Concurrency chapters; the asyncio documentation',
  'Language & Runtime Fluency|Error handling': 'Release It! — Michael Nygard, for timeouts, retries and circuit breakers',
  'Language & Runtime Fluency|Testing': 'The pytest documentation; testcontainers-python for real test databases',

  'HTTP & API Design|HTTP deeply': 'MDN HTTP reference; RFC 9110 for the exact semantics',
  'HTTP & API Design|REST design': 'The Google API Design Guide and Microsoft REST API Guidelines',
  'HTTP & API Design|FastAPI': 'The FastAPI documentation, end to end — tutorial then advanced guide',
  'HTTP & API Design|API contracts': 'The OpenAPI Specification; Pact documentation for consumer-driven contracts',
  'HTTP & API Design|Alternatives — gRPC / WS / GraphQL': 'The gRPC and protobuf documentation; MDN on WebSockets and Server-Sent Events',

  'Databases|Relational modelling': 'Korth, the Relational Database Design chapter — the same one as your GATE DBMS study',
  'Databases|SQL beyond CRUD': 'The PostgreSQL documentation on window functions and CTEs; Modern SQL for worked examples',
  'Databases|Indexing': 'Use The Index, Luke! — the whole site; PostgreSQL docs on index types',
  'Databases|Query performance': 'The PostgreSQL documentation on Using EXPLAIN; Kleppmann Ch. 3 for why plans differ',
  'Databases|Transactions': 'Kleppmann Ch. 7 (Transactions) — the clearest treatment of isolation anywhere',
  'Databases|Connections & ops': 'The PgBouncer and Alembic documentation',
  'Databases|NoSQL & vectors': 'Kleppmann Ch. 2; the pgvector and Qdrant documentation for ANN indexing',

  'Auth & Security|Session & token': 'OAuth 2.0 Simplified — Aaron Parecki; the OWASP Session Management Cheat Sheet',
  'Auth & Security|Authorisation': 'The OWASP Authorization Cheat Sheet; the PostgreSQL row-level security documentation',
  'Auth & Security|Application security — OWASP': 'OWASP Top 10 and the Cheat Sheet Series; PortSwigger Academy for the hands-on labs',

  'Caching & Performance|Caching theory': 'Kleppmann Ch. 1 and 5; the Redis documentation on eviction and expiry',
  'Caching & Performance|Redis': 'The Redis documentation — data types, scripting, persistence',
  'Caching & Performance|HTTP caching': 'MDN HTTP caching guide; RFC 9111 for the exact directive semantics',
  'Caching & Performance|Measuring performance': 'Systems Performance — Brendan Gregg, the methodology chapters; the k6 documentation',

  'Async Work, Queues & Events|Why queues': 'Kleppmann Ch. 11; Release It! on backpressure and bulkheads',
  'Async Work, Queues & Events|Task queues': 'The Celery documentation — the whole user guide',
  'Async Work, Queues & Events|Message brokers': 'RabbitMQ tutorials 1–6; Kafka: The Definitive Guide, Ch. 1–4',
  'Async Work, Queues & Events|Event-driven design': 'microservices.io — the outbox, saga and messaging pattern pages',
  'Async Work, Queues & Events|Long-running jobs': 'The Celery documentation on task states; Release It! on timeouts',

  'Containers, CI/CD & Deployment|Linux & networking': 'The Linux Command Line — William Shotts; the nginx beginner guide',
  'Containers, CI/CD & Deployment|Docker': 'The Docker documentation — Dockerfile reference and best-practices page',
  'Containers, CI/CD & Deployment|Orchestration — Kubernetes': 'The Kubernetes documentation — Concepts section, then Tasks',
  'Containers, CI/CD & Deployment|CI/CD': 'The GitHub Actions documentation; Continuous Delivery — Humble and Farley for the reasoning',
  'Containers, CI/CD & Deployment|Cloud': 'Your Cloud Computing Honors coursework; the AWS Well-Architected Framework',

  'Observability & Reliability|Logging': 'The Google SRE Book, the Monitoring chapter; structlog documentation',
  'Observability & Reliability|Metrics': 'The Prometheus documentation; the RED and USE method write-ups by Tom Wilkie and Brendan Gregg',
  'Observability & Reliability|Tracing': 'The OpenTelemetry documentation — concepts, then the Python SDK',
  'Observability & Reliability|Reliability': 'The Google SRE Workbook, the SLO chapters; Release It! for the patterns',
  'Observability & Reliability|Incident practice': 'The Google SRE Book, the Postmortem Culture chapter',

  'System Design|Fundamentals': 'Kleppmann Ch. 1 and 9; the original CAP paper if you want it stated correctly',
  'System Design|Data at scale': 'Kleppmann Ch. 5 and 6 (replication and partitioning)',
  'System Design|Architecture': 'Building Microservices — Sam Newman; microservices.io for the pattern catalogue',
  'System Design|Interview practice': 'System Design Interview — Alex Xu, volumes 1 and 2. Speak the answers out loud, timed.',

  'ML-Serving Backend|Model serving': 'Designing Machine Learning Systems — Chip Huyen, the deployment chapters',
  'ML-Serving Backend|Inference patterns': 'The vLLM documentation on continuous batching; the Triton docs on dynamic batching',
  'ML-Serving Backend|Serving stacks': 'The vLLM, Triton and TorchServe documentation; the ONNX Runtime performance guide',
  'ML-Serving Backend|Feature & data': 'Designing Machine Learning Systems, the feature engineering chapter; the Feast documentation',
  'ML-Serving Backend|ML observability': 'Designing Machine Learning Systems, the monitoring chapter; the Evidently documentation',
  'ML-Serving Backend|MLOps surface': 'The MLflow documentation; the NVIDIA container toolkit documentation for GPU images',

  'Capstone Integration|Build': 'Nothing new. Everything you have already read.',
  'Capstone Integration|Document': 'Michael Nygard’s original ADR write-up; the Diátaxis framework for structuring docs',
  'Capstone Integration|Defend': 'Nothing. Rehearse out loud against someone who will push back.',
};

/** Reading pointer for one backend topic, or null when none is written. */
export function backendTopicSource(phaseTitle: string, topicName: string): string | null {
  return BACKEND_TOPIC_SOURCES[`${phaseTitle}|${topicName}`] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────

const normalise = (s: string): string => s.replace(/\s+/g, ' ').trim();

const GLOSS_MAP = new Map<string, string>(
  GLOSSES.map(([concept, gloss]) => [normalise(concept), gloss]),
);

/** One line explaining a backend concept, or null when none is written yet. */
export function backendGloss(conceptName: string): string | null {
  return GLOSS_MAP.get(normalise(conceptName)) ?? null;
}

export const BACKEND_GLOSS_COUNT = GLOSS_MAP.size;
