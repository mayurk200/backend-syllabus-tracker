import type { Phase, Subtopic, Topic, TopicValue, ValueWeight } from '../types';
import { TOTAL_SYLLABUS_HOURS } from '../types';

/**
 * Backend Engineering — the fresher → 30 LPA campaign. 746 focused hours across
 * 16 phases, Java and Spring Boot, because that is where the 30 LPA backend
 * roles in India actually are.
 *
 * Two things this plan is honest about, and the rest of the file assumes you
 * have read them:
 *
 * 1. 30 LPA is not a fresher band. The market puts it at SDE-2 / 3–5 years at a
 *    product company, or 5–8 years elsewhere. This is a trajectory, not a
 *    starting salary — the phases marked critical are what get you in the door
 *    and what get you promoted out of the entry band quickly.
 * 2. Hours are not the metric. Every topic carries a `value`: which of four
 *    bands it falls in, and one line arguing for that band. There is
 *    deliberately no numeric score — nothing measured one, and a made-up number
 *    sitting next to real hours reads as data when it is a judgement call.
 *    Treat the bands as a recommendation with its reasoning attached, and
 *    disagree with any of them you can argue against.
 *
 * Hours are fixed: subtopic hours must sum to their topic, topic hours to their
 * phase, and the grand total to 746. `verifySeedHours` fails loudly otherwise.
 *
 * This file is a one-time bootstrap payload only — once seeded, Firestore is
 * the source of truth and every read and write goes through the database.
 * Changing the plan here means bumping SEED_VERSION in lib/db.ts so the
 * reconcile carries existing ticks onto the new shape.
 */

/** Terse constructor for a topic's worth, so the tables below stay readable. */
function v(weight: ValueWeight, why: string): TopicValue {
  return { weight, why };
}

function topic(
  name: string,
  detail: string,
  value: TopicValue,
  subs: Array<[string, number]>,
): Topic {
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
    value,
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
    'Prerequisite Audit & Target Map',
    'Find out honestly what you already know, and name the companies that actually pay the number you are aiming at.',
    'A one-page gap list, plus 20 named companies with the band each hires at. If the company list is vague, the whole plan is aimed at nothing.',
    [
      topic(
        'Skip test',
        'Build a tiny service cold and note exactly where you stall.',
        v(
          'critical',
          'An honest baseline is the only thing that stops you spending six months restudying what you already know.',
        ),
        [
          [
            'Write from a blank file, no reference: a Spring Boot REST controller with bean validation',
            0.5,
          ],
          ['A parameterised query through JPA and through plain JDBC, written cold', 0.5],
          ['A Dockerfile for a Spring Boot jar, written cold', 0.5],
          [
            'A JUnit 5 test with one Mockito mock. Time yourself — under 45 min means skip most of Phase 1',
            0.5,
          ],
        ],
      ),
      topic(
        'Gap inventory',
        'Turn a vague sense of "I know this" into a written, falsifiable list.',
        v(
          'high',
          'Study time is only real for things you cannot already rebuild; everything else is comfort reading.',
        ),
        [
          [
            'List every technology in your existing projects (HMS, PROOF, alumni portal, proposal evaluator) and mark each: can rebuild from scratch / can modify / copied it. Only the third category is real study time.',
            1,
          ],
          [
            'Answer honestly: can you read an EXPLAIN plan? Have you set an index deliberately? Have you written a load test? Have you read a thread dump? These four answers set your starting phase.',
            1,
          ],
        ],
      ),
      topic(
        'Target map',
        'Name the companies, the bands and the loops you are actually preparing for.',
        v(
          'critical',
          '30 LPA is a band at named companies with known interview loops, not a number in the air. Preparing without the list means preparing for the average of everything.',
        ),
        [
          [
            'Name 20 companies that genuinely pay 30 LPA+ for backend in India, and the level each hires at (SDE-2, SDE-3, GCC senior)',
            0.75,
          ],
          [
            'For five of them, find the real loop: how many DSA rounds, whether there is a machine-coding round, what the design round asks',
            0.75,
          ],
          [
            'Write the gap in one sentence: what you have versus what that loop tests. Re-read it monthly and rewrite it when it stops being true.',
            0.5,
          ],
        ],
      ),
    ],
  ),

  phase(
    1,
    'Java Language & JVM',
    'Be genuinely fluent in Java and in the machine it runs on. The JVM half is what separates a Java user from a Java engineer.',
    'A tested, multi-module Java library with no framework in it, plus a written explanation of one GC pause you caused and diagnosed yourself.',
    [
      topic(
        'Modern Java',
        'The language as it is written in 2026, not as it was taught in 2015.',
        v(
          'critical',
          'This is the surface every other Java topic sits on, and writing Java 8-era code in a Java 21 codebase marks you as someone who stopped learning.',
        ),
        [
          ['Records, sealed types, and pattern matching for switch', 2],
          ['var, text blocks, enhanced instanceof', 1],
          ['Optional used correctly — a return type, never a field or a parameter', 1.5],
          ['Streams: map/filter/reduce, collectors, grouping, flatMap', 3],
          ['When a stream is the wrong tool — the readability and debugging cost', 1],
          ['Lambdas, method references, functional interfaces', 1.5],
          ['Immutability and defensive copies, and why they matter under concurrency', 2],
        ],
      ),
      topic(
        'Object model & API design',
        'Designing types other people have to use.',
        v(
          'high',
          'Break the equals/hashCode contract and your objects misbehave inside every hash-based collection — a bug that is invisible until it is expensive.',
        ),
        [
          ['equals/hashCode/toString contracts and what breaks when they disagree', 2],
          ['Comparable vs Comparator', 1],
          ['Interfaces vs abstract classes; default methods', 1.5],
          ['Composition over inheritance, stated as a decision you can defend', 1.5],
          ['Generics, bounded types, PECS, and type erasure', 3],
        ],
      ),
      topic(
        'Collections, deeply',
        'Not the API — the data structures under it and their costs.',
        v(
          'critical',
          'Collection choice is a decision you make in every class you write, and the cost of the wrong one compounds. Knowing the structures underneath is what makes the choice deliberate.',
        ),
        [
          ['ArrayList vs LinkedList, and why LinkedList is almost always the wrong answer', 1],
          ['HashMap internals: buckets, hashing, load factor, treeification at 8', 2.5],
          ['TreeMap and LinkedHashMap, and when ordering is worth the cost', 1.5],
          ['Set semantics; EnumMap; the immutable factories (List.of)', 1],
          ['Choosing a collection from the access pattern, with the Big-O behind the choice', 2],
        ],
      ),
      topic(
        'Exceptions & failure design',
        'Deciding what a failure means before it happens.',
        v(
          'high',
          'How you model failure is read as how much production code you have written; "catch Exception, log, continue" is a tell.',
        ),
        [
          ['Checked vs unchecked, and the case against checked exceptions in service code', 1],
          ['Custom exception hierarchies a caller can actually act on', 1.5],
          ['try-with-resources and suppressed exceptions', 1],
          ['Fail-fast vs degrade-gracefully, decided per dependency rather than globally', 1.5],
        ],
      ),
      topic(
        'JVM internals',
        'Memory, garbage collection, and the compiler underneath your code.',
        v(
          'critical',
          'JVM performance tuning is one of the highest-paying Java specialisations, and at the 30 LPA band the design round assumes you can reason about GC and heap.',
        ),
        [
          ['Class loading, the loader hierarchy, and JAR hell', 2],
          ['Runtime memory: heap, stack, metaspace, direct buffers', 2.5],
          ['Garbage collection: the generational hypothesis, young vs old, G1 vs ZGC', 3],
          ['Stop-the-world pauses and what actually causes a long one', 2],
          ['JIT compilation, tiered compilation, escape analysis', 1.5],
          ['Reading a heap dump and a thread dump', 1],
        ],
      ),
      topic(
        'Build & project hygiene',
        'Maven, dependencies, and a layout that scales past one package.',
        v(
          'medium',
          'A broken dependency tree costs hours you cannot get back, and module layout is visible in every code sample you send out.',
        ),
        [
          ['The Maven lifecycle and the dependency tree; the Gradle equivalent', 2],
          ['Transitive dependency conflicts and how to resolve them deliberately', 1],
          ['Multi-module projects; package-by-feature over package-by-layer', 1],
          ['Reproducible builds; dependency pinning and vulnerability scanning', 1],
        ],
      ),
      topic(
        'Testing in Java',
        'JUnit 5, Mockito, and a real database in the test run.',
        v(
          'critical',
          'Untested code is the difference between a prototype and something a team would merge, and a coverage number is not a testing philosophy.',
        ),
        [
          ['JUnit 5: lifecycle, parameterised tests, assertions', 1.5],
          ['Mockito: stubbing, verification, and the argument against over-mocking', 1.5],
          ['Testcontainers for a real Postgres inside the test run', 1],
        ],
      ),
    ],
  ),

  phase(
    2,
    'DSA & Problem Solving',
    'The single largest allocation, because it is the round that rejects most candidates before anyone looks at your backend depth.',
    'Ten recorded 45-minute mocks solved out loud, and 200+ problems with mediums solved cold in under 30 minutes.',
    [
      topic(
        'Complexity & the working method',
        'How to attack a problem you have not seen, out loud.',
        v(
          'critical',
          'A coding round is assessed on reasoning you make audible. Solving silently gives the interviewer nothing to assess.',
        ),
        [
          ['Big-O, amortised analysis, and space complexity', 2],
          ['The method: restate, examples, brute force, find the bottleneck, optimise, code, test', 2],
          ['Talking while solving — rehearsed until it is not awkward', 2],
        ],
      ),
      topic(
        'Arrays, strings, hashing',
        'The patterns behind roughly a third of all interview problems.',
        v(
          'critical',
          'Two pointers, sliding window and hashing recur across the standard fresher pattern lists — they are the cheapest coverage available per hour spent.',
        ),
        [
          ['Two pointers; fast and slow pointers', 3],
          ['Sliding window, fixed and variable size', 3.5],
          ['Prefix sums and difference arrays', 2.5],
          ['Hash maps and sets for O(1) lookup; frequency counting', 3],
          ['String manipulation, parsing, and in-place techniques', 2],
          ['40 problems: 25 medium, 10 easy, 5 hard', 2],
        ],
      ),
      topic(
        'Binary search',
        'Including the variant that is not about sorted arrays at all.',
        v(
          'critical',
          'Binary search on the answer is a recurring medium-to-hard pattern, and its boundary conditions are unusually easy to get subtly wrong under time pressure.',
        ),
        [
          ['Exact search, and the boundary variants everyone gets wrong', 2],
          ['Binary search on the answer — the pattern interviewers are really testing', 3],
          ['Search in rotated arrays and 2-D matrices', 1.5],
          ['15 binary-search problems, mostly medium', 1.5],
        ],
      ),
      topic(
        'Sorting & intervals',
        'Custom orderings and the interval family.',
        v(
          'high',
          'The interval family is small, highly patterned, and reappears directly in calendar, booking and scheduling design questions.',
        ),
        [
          ['Merge sort and quick sort, and their worst cases', 2],
          ['Custom comparators; stability and when it matters', 1.5],
          ['Interval merging, insertion, and scheduling', 3],
          ['15 sorting and interval problems', 1.5],
        ],
      ),
      topic(
        'Linked lists, stacks, queues',
        'Pointer manipulation and the monotonic stack.',
        v(
          'high',
          'Pointer manipulation is basic fluency, and the monotonic stack turns a family of otherwise-hard problems into a single linear sweep.',
        ),
        [
          ['Reversal, cycle detection, merge, reorder', 3],
          ['Monotonic stack — the pattern behind next-greater and histogram problems', 3],
          ['Deques, and queue-from-stacks style construction problems', 2],
          ['20 linked-list, stack and queue problems', 2],
        ],
      ),
      topic(
        'Trees & BSTs',
        'Traversals, invariants, and the recursion habit.',
        v(
          'critical',
          'Trees are where recursion becomes automatic, and that fluency is what makes dynamic programming tractable later.',
        ),
        [
          ['Traversals: recursive, iterative, and level order', 3],
          ['BST properties, validation, insertion and deletion', 2.5],
          ['Lowest common ancestor; path problems; diameter', 3],
          ['Tries, and why they appear in every autocomplete question', 2.5],
          ['Serialisation; reconstruction from traversals', 2],
          ['30 tree and trie problems', 3],
        ],
      ),
      topic(
        'Heaps & greedy',
        'Priority queues, and proving a greedy choice rather than guessing it.',
        v(
          'high',
          'Heap problems are named in the SDE-2 expectations, and a greedy answer without an exchange argument is a guess rather than a solution.',
        ),
        [
          ['Priority queues; top-K and the k-way merge pattern', 3],
          ['The two-heap running median pattern', 1.5],
          ['Greedy: proving the exchange argument instead of asserting it', 2],
          ['15 heap and greedy problems', 1.5],
        ],
      ),
      topic(
        'Graphs',
        'The area that most reliably separates offers from rejections.',
        v(
          'critical',
          'Graphs are named in the SDE-2 expectations alongside heaps, and the material is large enough that it cannot be crammed late.',
        ),
        [
          ['Representations; BFS and DFS on grids and adjacency lists', 4],
          ['Topological sort and cycle detection', 3],
          ['Union-find with path compression and union by rank', 3],
          ['Dijkstra; Bellman-Ford at awareness level', 3],
          ['Connected components; bipartite checking; multi-source BFS', 2.5],
          ['30 graph problems', 4.5],
        ],
      ),
      topic(
        'Dynamic programming',
        'One derivation performed live, not twenty memorised recurrences.',
        v(
          'critical',
          'What is being tested is deriving a recurrence under time pressure, and that only comes from repetition — reading DP solutions transfers almost nothing.',
        ),
        [
          ['Recursion → memoisation → tabulation, as one derivation you can perform live', 4],
          ['1-D: house robber, climbing stairs, decode ways', 3],
          ['The knapsack family: 0/1, unbounded, subset sum', 4],
          ['2-D grid and string DP: LCS, edit distance', 4],
          ['State-machine DP: the stock-trading family', 2],
          ['25 dynamic-programming problems', 3],
        ],
      ),
      topic(
        'Interview simulation',
        'The rehearsal that converts knowledge into an offer.',
        v(
          'critical',
          'Knowing the material and performing it under a timer are different skills. Only one of them is assessed, and only rehearsal builds it.',
        ),
        [
          ['Ten timed 45-minute mocks on a shared editor, spoken aloud throughout', 4],
          ['Record two and watch them back — uncomfortable, and the fastest correction available', 2],
          ['Company-tagged problem sets for the 20 targets from Phase 0', 2],
        ],
      ),
    ],
  ),

  phase(
    3,
    'Spring & Spring Boot Core',
    'The framework the roles are written around. Depth here is what makes you a Spring engineer rather than someone who has used Spring.',
    'A Spring Boot service you can explain from the first bean definition to the last filter — including why each annotation is there and what breaks without it.',
    [
      topic(
        'The container',
        'What Spring is actually doing before your first request arrives.',
        v(
          'critical',
          'Understanding proxying and the bean lifecycle is what makes Spring debuggable rather than magic — and it is the root of the framework traps further down this phase.',
        ),
        [
          ['IoC and dependency injection — what the container does at startup', 2],
          ['Bean lifecycle, scopes, @PostConstruct and @PreDestroy', 2],
          [
            'Constructor injection over field injection, and why the field version hides a design problem',
            1.5,
          ],
          ['Component scanning, @Configuration, @Bean, @Conditional', 2],
          ['Circular dependencies: what they mean, and removing rather than patching them', 1.5],
          ['ApplicationContext vs BeanFactory', 1],
        ],
      ),
      topic(
        'Spring Boot mechanics',
        'Auto-configuration, profiles, and configuration precedence.',
        v(
          'critical',
          '"How does auto-configuration work?" is close to a guaranteed question, and configuration precedence is a daily production concern.',
        ),
        [
          ['Auto-configuration: how it resolves, and how to debug what got applied', 2.5],
          ['Starters and the dependency management BOM', 1],
          ['application.yml, profiles, and externalised configuration precedence', 2],
          ['@ConfigurationProperties with validation', 1.5],
          ['Actuator endpoints, and which ones to expose in production', 1],
        ],
      ),
      topic(
        'Spring MVC & the web layer',
        'The request path from socket to handler and back.',
        v(
          'critical',
          'Being able to trace a request end to end is what lets you debug the web layer, and @ControllerAdvice is the difference between a clean API and one that leaks stack traces.',
        ),
        [
          ['The DispatcherServlet request flow, end to end', 2],
          ['@RestController, request mapping, and argument resolution', 1.5],
          ['Bean Validation: @Valid and custom constraints', 2],
          ['@ControllerAdvice — one place that maps exceptions to responses', 2],
          ['Filters vs interceptors vs AOP, and where each belongs', 1.5],
        ],
      ),
      topic(
        'Spring Data & transactions',
        'Repositories, and the annotation people use without understanding.',
        v(
          'critical',
          'Transaction boundaries are a correctness concern, not an annotation habit — and self-invocation silently starting no transaction is a data-loss bug that looks like working code.',
        ),
        [
          ['The repository abstraction; derived queries; @Query and projections', 2.5],
          ['@Transactional: propagation, isolation, readOnly', 3],
          ['Why @Transactional silently does nothing on a self-invoked or private method', 2],
          ['Transaction boundaries as a design decision, not an annotation habit', 2],
          ['Pagination and Sort through the repository layer', 1.5],
          ['Auditing with @CreatedDate and @LastModifiedBy', 1],
        ],
      ),
      topic(
        'AOP & cross-cutting concerns',
        'Proxies, aspects, and knowing when not to reach for one.',
        v(
          'medium',
          'Proxy behaviour is the shared root cause of the @Transactional and @Cacheable traps elsewhere in this plan, so understanding it once fixes both.',
        ),
        [
          ['Proxies: JDK dynamic vs CGLIB, and the self-invocation trap they create', 2],
          ['Aspects for logging, timing, retry and caching', 2],
          ['When an aspect is the wrong answer', 1],
        ],
      ),
      topic(
        'Spring testing',
        'Slice tests, MockMvc, and a real database.',
        v(
          'high',
          'A full context per test class turns a fast suite into one nobody runs, and knowing which slice to reach for is a concrete judgement call.',
        ),
        [
          [
            '@SpringBootTest vs slice tests (@WebMvcTest, @DataJpaTest), and the speed difference that matters',
            2.5,
          ],
          ['MockMvc and WebTestClient', 2],
          ['@MockBean, test profiles, and test configuration', 1.5],
          ['Testcontainers wired into a Spring integration test', 1],
        ],
      ),
      topic(
        'Reactive, at awareness level',
        'Enough to have an opinion, not enough to build on it.',
        v(
          'optional',
          'Worth an informed opinion, but virtual threads removed much of the reason to adopt it. Do this only once everything above is done.',
        ),
        [
          ['WebFlux, Mono and Flux, and backpressure', 2],
          [
            'The honest position: most teams do not need it, and virtual threads removed much of the argument',
            2,
          ],
        ],
      ),
    ],
  ),

  phase(
    4,
    'HTTP & API Design',
    'Design APIs other people can use without asking you questions.',
    'A service with cursor pagination, RFC 7807 errors, idempotency keys, a generated OpenAPI spec and a written deprecation policy.',
    [
      topic(
        'HTTP deeply',
        'Methods, status codes, headers, and what the network is doing.',
        v(
          'high',
          'The status code is part of your contract, and method semantics are what clients, caches and proxies rely on. Getting them wrong breaks callers you never meet.',
        ),
        [
          ['Request/response anatomy; method semantics — safe, idempotent, cacheable', 1.5],
          ['Status codes used correctly (201 vs 200, 202, 409, 422, 429)', 1.5],
          ['Headers that matter: Content-Type, Cache-Control, ETag, Authorization', 1.5],
          ['Keep-alive; HTTP/1.1 vs 2 vs 3; the TLS handshake at concept level', 2.5],
        ],
      ),
      topic(
        'REST design',
        'Resource modelling, pagination, idempotency, error shapes.',
        v(
          'critical',
          'Cursor pagination and idempotency keys are what an API needs once it has real traffic and unreliable clients — both are invisible until they are urgent.',
        ),
        [
          ['Resource modelling and URI design — nouns, not verbs', 1.5],
          ['Pagination: offset vs cursor, and why cursor wins at scale', 2],
          ['Filtering, sorting, and partial updates (PATCH semantics)', 1.5],
          ['Idempotency keys on unsafe operations', 1.5],
          ['Error response shape: RFC 7807 problem details', 1.5],
        ],
      ),
      topic(
        'API contracts & versioning',
        'Changing a published API without breaking its consumers.',
        v(
          'high',
          'Once an API has consumers you cannot redeploy, compatibility stops being a preference and becomes a constraint on every change.',
        ),
        [
          ['OpenAPI authoring; springdoc generation from the code', 2],
          ['Backward-compatible vs breaking changes; schema evolution', 2],
          ['Versioning strategies, and the deprecation policy that has to come with them', 2],
        ],
      ),
      topic(
        'Beyond REST',
        'gRPC, WebSockets, SSE and GraphQL — and when each earns its cost.',
        v(
          'medium',
          'Worth being able to argue when binary RPC earns its cost between your own services — useful, but not what a decision turns on.',
        ),
        [
          ['gRPC and protobuf: when binary RPC beats JSON for internal calls', 2.5],
          ['WebSockets and Server-Sent Events', 2],
          ['GraphQL at awareness level', 1.5],
        ],
      ),
      topic(
        'Machine-coding round practice',
        'A complete small service, built against a clock.',
        v(
          'critical',
          'Producing a cleanly layered, validated, tested service against a clock is a distinct skill from knowing the pieces. Where a machine-coding round exists, this is exactly what it measures.',
        ),
        [
          [
            'Build a small but complete service in 90 minutes: clean layering, validation, error handling, tests. Repeat until the structure is automatic.',
            3,
          ],
        ],
      ),
    ],
  ),

  phase(
    5,
    'Databases & Persistence',
    'The second largest allocation, deliberately. Backend interviews are won and lost on database depth — "I used JPA" is not database depth.',
    'A table with 1M+ synthetic rows: find a slow query, read its plan, add the correct index, and prove the improvement with before-and-after EXPLAIN ANALYZE. Write it up.',
    [
      topic(
        'Relational modelling',
        'Schema design before any framework touches it.',
        v(
          'critical',
          'Every design conversation begins with a data model, and a weak schema makes everything built on top of it weaker.',
        ),
        [
          ['Normal forms 1NF–3NF, and when to denormalise deliberately', 2],
          ['Keys: primary, foreign, composite, surrogate vs natural', 1.5],
          ['UUID vs bigint as a primary key, and the index-locality cost of random UUIDs', 1.5],
          ['One-to-many and many-to-many, modelled without a framework', 1.5],
          ['Soft deletes and audit columns', 1.5],
        ],
      ),
      topic(
        'SQL beyond CRUD',
        'Joins, windows, CTEs, and set operations.',
        v(
          'critical',
          'SQL is named among the baseline backend skills, and window functions are the point where working knowledge runs out for most people who learned SQL by CRUD.',
        ),
        [
          ['JOIN types and how each one executes', 2],
          ['GROUP BY, HAVING, and aggregate semantics', 1.5],
          ['Window functions: ROW_NUMBER, RANK, LAG/LEAD, running aggregates', 3],
          ['CTEs and recursive CTEs', 2.5],
          ['Subqueries vs joins; set operations; CASE expressions', 1.5],
          ['Upserts and ON CONFLICT', 1.5],
        ],
      ),
      topic(
        'Indexing',
        'What an index costs, and why yours is being ignored.',
        v(
          'critical',
          'A composite index only serves a prefix of its columns, so the wrong order means the index you added is never used. Few decisions are this cheap to get right and this costly to get wrong.',
        ),
        [
          ['B-tree internals at concept level', 1.5],
          ['Single vs composite indexes, and why column order decides everything', 2.5],
          ['Covering and partial indexes', 2],
          ['GIN and GiST for JSONB and full-text', 1.5],
          ['The write cost of an index; when the planner ignores yours, and why', 2.5],
        ],
      ),
      topic(
        'Query performance',
        'Reading plans instead of guessing.',
        v(
          'critical',
          'Reading the plan is the difference between fixing the slow query and guessing at it. It is also hard to fake having done.',
        ),
        [
          ['EXPLAIN and EXPLAIN ANALYZE — reading the plan tree', 3],
          ['Seq scan vs index scan vs bitmap heap scan', 2],
          ['Nested loop vs hash vs merge join', 2],
          ['Row-estimate errors; ANALYZE and statistics', 1.5],
          ['pg_stat_statements — finding the slow query before guessing at it', 1.5],
        ],
      ),
      topic(
        'Transactions & concurrency',
        'Isolation levels, locking, and the anomalies each prevents.',
        v(
          'critical',
          'Anything involving money, inventory or bookings is a concurrency problem in disguise, and isolation level is where correctness is actually decided.',
        ),
        [
          ['ACID, stated precisely', 1.5],
          ['Isolation levels, and the exact anomaly each one prevents', 3],
          ['MVCC in Postgres', 2],
          ['Pessimistic vs optimistic locking; SELECT FOR UPDATE; @Version', 2],
          ['Deadlocks: how they form, and ordering writes to avoid them', 1.5],
        ],
      ),
      topic(
        'JPA & Hibernate',
        'The ORM, including the ways it quietly betrays you.',
        v(
          'critical',
          'N+1 is the default failure mode of an ORM under real data, and understanding the persistence context is what lets you fix it properly rather than switching everything to eager.',
        ),
        [
          ['Entity lifecycle: transient, managed, detached, removed', 2],
          ['The persistence context and the first-level cache', 2],
          ['Lazy vs eager loading, and the N+1 problem you will be asked about', 3],
          ['Fetch joins, @EntityGraph, and DTO projections as the real fix', 2.5],
          ['Dirty checking and flush timing', 1.5],
          ['When to drop to native SQL or jOOQ and stop fighting the ORM', 1],
        ],
      ),
      topic(
        'Operations',
        'Pooling, migrations, and recovery.',
        v(
          'high',
          'Pool exhaustion takes a service down while every individual query still looks healthy, and schema changes are the riskiest thing you routinely deploy.',
        ),
        [
          ['Connection pooling with HikariCP; pool sizing arithmetic', 2],
          ['Flyway or Liquibase migrations; expand-contract for zero downtime', 2],
          ['Backups and point-in-time recovery at concept level', 1],
        ],
      ),
      topic(
        'NoSQL where it fits',
        'The stores that are not Postgres, and the honest case for each.',
        v(
          'medium',
          'Worth a position so that reaching past Postgres is a decision rather than a default — but Postgres is usually the right answer.',
        ),
        [
          ['When a document store genuinely wins; MongoDB modelling tradeoffs', 1.5],
          ['Redis as a datastore rather than a cache; Elasticsearch for search', 1.5],
        ],
      ),
    ],
  ),

  phase(
    6,
    'Concurrency & Async in Java',
    'The area Java interviews go deepest on, and the one where production bugs are most expensive.',
    'A deliberately racy program, a test that reliably catches the race, and a thread dump you diagnosed a deadlock from.',
    [
      topic(
        'Threads & the memory model',
        'What the JVM guarantees about what one thread can see of another.',
        v(
          'critical',
          'Without happens-before you cannot reason about what one thread sees of another, and every concurrency bug below this line becomes guesswork.',
        ),
        [
          ['Thread lifecycle, and the cost of creating one', 1.5],
          ['The Java Memory Model: happens-before, visibility, reordering', 3],
          ['volatile: what it guarantees and what it does not', 2],
          ['synchronized, intrinsic locks, and lock granularity', 2],
          ['Race conditions — reproducing one deliberately', 1.5],
        ],
      ),
      topic(
        'java.util.concurrent',
        'The toolkit you should reach for instead of raw threads.',
        v(
          'critical',
          'This is the toolkit you should reach for instead of raw threads, and pool sizing is a decision that quietly caps your throughput.',
        ),
        [
          ['ExecutorService and thread pools, sized for CPU-bound vs I/O-bound work', 3],
          ['Callable, Future, and CompletableFuture composition', 3],
          ['Concurrent collections: ConcurrentHashMap, BlockingQueue, CopyOnWriteArrayList', 2.5],
          ['Atomics and compare-and-swap', 1.5],
          ['CountDownLatch, Semaphore, CyclicBarrier', 1],
          ['ReentrantLock vs synchronized; ReadWriteLock', 1],
        ],
      ),
      topic(
        'Virtual threads & structured concurrency',
        'Project Loom, and what it changed.',
        v(
          'high',
          'Recently standardised, and it changes the calculus on blocking code and pool sizing. Cheap to learn, and its absence dates your knowledge.',
        ),
        [
          ['What a virtual thread is, and what it changes about pool sizing', 2],
          ['Pinning, and why synchronized blocks still hurt', 1.5],
          ['Structured concurrency and scoped values', 1.5],
          ['When virtual threads remove the reason to reach for reactive', 1],
        ],
      ),
      topic(
        'Concurrency in a Spring service',
        'Where the framework makes concurrency easy to get wrong.',
        v(
          'critical',
          'One bean instance serves every concurrent request, so a mutable field is shared state. This bug reaches production quietly and is hard to reproduce.',
        ),
        [
          ['@Async, and the executor you must configure yourself', 1.5],
          ['Thread-safety of singleton beans — the bug that reaches production quietly', 2],
          ['ThreadLocal, request scope, and context propagation across threads', 2],
          ['Distributed locks with Redis, and their correctness caveats', 1.5],
        ],
      ),
      topic(
        'Diagnosing concurrency bugs',
        'Finding the problem in a running system.',
        v(
          'high',
          'A concurrency bug you cannot observe is one you cannot fix, and a thread dump is usually the only evidence you get.',
        ),
        [
          ['Reading a thread dump, and spotting a deadlock in one', 2],
          ['Thread starvation and pool exhaustion under load', 1.5],
          ['Writing a test that actually catches a race', 1.5],
        ],
      ),
    ],
  ),

  phase(
    7,
    'Auth & Security',
    'Trimmed, because PROOF already puts you ahead here — it covers WebAuthn/FIDO2, attestation, challenge-response, origin binding and replay resistance.',
    'A security review of one of your own projects that finds three or more real defects. If you find zero, you reviewed it lazily.',
    [
      topic(
        'Spring Security',
        'The filter chain, and configuring it deliberately.',
        v(
          'critical',
          'Security is named among the baseline Java backend skills, and the filter chain is where configuration either holds or quietly does nothing.',
        ),
        [
          ['The filter chain, and where your code sits in it', 2.5],
          ['Authentication vs authorisation; the SecurityContext', 2],
          ['Method security: @PreAuthorize and expression-based rules', 2],
          ['Custom authentication providers and filters', 2],
          ['CORS and CSRF configured deliberately, not copied from Stack Overflow', 1.5],
        ],
      ),
      topic(
        'Tokens & sessions',
        'What you are actually trading away when you choose JWT.',
        v(
          'critical',
          'Choosing JWT means choosing not to be able to revoke a token before it expires. That is the trade, and it is usually made without noticing.',
        ),
        [
          ['Session cookies vs JWT — the real tradeoff is revocation', 2],
          ['Access and refresh token rotation', 1.5],
          ['Token storage: httpOnly cookie vs localStorage, and the XSS consequence', 1.5],
          ['OAuth2 flows and OIDC; SSO concepts', 2],
        ],
      ),
      topic(
        'Authorisation models',
        'Deciding who may do what, and enforcing it where it cannot be bypassed.',
        v(
          'high',
          'One missing tenant predicate leaks another customer’s data, and a check that lives only on the route protects only that route.',
        ),
        [
          ['RBAC vs ABAC vs ReBAC', 1.5],
          ['Enforcing at the data layer, not the route layer', 2],
          ['Multi-tenancy isolation; row-level security', 1.5],
        ],
      ),
      topic(
        'Application security',
        'OWASP, written as exploits rather than read as a list.',
        v(
          'critical',
          'You do not really understand a vulnerability class until you have exploited it once. Reading the list produces secondhand knowledge that does not survive contact with real code.',
        ),
        [
          ['OWASP Top 10 — write an exploit and a fix for each', 3],
          ['SQL injection, and why parameterisation actually works', 1.5],
          ['XSS, CSRF, SSRF', 1.5],
          ['Secrets management; dependency vulnerability scanning', 1],
          ['Rate limiting: token bucket and sliding window', 1],
        ],
      ),
    ],
  ),

  phase(
    8,
    'Caching, Performance & JVM Tuning',
    'Make things fast, and prove the improvement with numbers rather than adjectives.',
    'Load-test an endpoint, report p50/p95/p99, find the real bottleneck with a profiler, fix it, re-test, and quantify the delta.',
    [
      topic(
        'Caching theory',
        'Strategies, eviction, and the invalidation problem.',
        v(
          'critical',
          'Caching is a component of most designs, and stampede is the failure that turns a cache from a shield into an amplifier.',
        ),
        [
          ['Cache-aside, read-through, write-through, write-behind', 2],
          ['TTL selection and eviction policies (LRU, LFU)', 1.5],
          ['Cache stampede, and how to prevent it', 2],
          ['Invalidation — genuinely one of the two hard problems', 1.5],
        ],
      ),
      topic(
        'Redis in anger',
        'Beyond GET and SET.',
        v(
          'critical',
          'Redis is named among the most in-demand backend skills in India for 2026. Sorted sets and Lua atomicity are where it stops being a key-value store.',
        ),
        [
          ['Data structures: strings, hashes, lists, sets, sorted sets, streams', 2.5],
          ['Expiry semantics and pipelining', 1.5],
          ['Lua scripts for atomicity', 1.5],
          ['Redis as a rate limiter and as a distributed lock', 1.5],
          ['Persistence: RDB vs AOF; cluster mode basics', 1],
        ],
      ),
      topic(
        'Caching in Spring',
        'The abstraction, and its sharp edge.',
        v(
          'high',
          'Cheap to learn on top of the theory above, and the local-plus-distributed two-tier setup is a real design choice with a real trade in it.',
        ),
        [
          ['@Cacheable and @CacheEvict, and the self-invocation trap again', 2],
          ['Cache managers: Caffeine local vs Redis distributed, and when to run both', 2],
          ['Cache key design', 1],
        ],
      ),
      topic(
        'Measuring before optimising',
        'Percentiles, load tests, and profilers.',
        v(
          'critical',
          'Optimising without measuring first is how a week disappears into a two-percent gain. Measured numbers from your own system are also evidence you can point at.',
        ),
        [
          ['Latency percentiles p50/p95/p99, and why the mean lies', 2],
          ["Throughput vs latency; Little's Law", 1.5],
          ['Load testing with k6, Gatling or JMeter', 2.5],
          ['Profiling with async-profiler and JFR; reading a flame graph', 2],
          ['Finding the actual bottleneck before changing a single line', 1],
        ],
      ),
      topic(
        'JVM tuning',
        'Heap, collectors, and diagnosing a service that is misbehaving.',
        v(
          'critical',
          'JVM performance tuning is reported among the highest-paying Java specialisations, and it is rare in candidates without production experience — which is what makes the hours worth spending.',
        ),
        [
          ['Heap sizing: -Xmx/-Xms and container-aware defaults', 2],
          ['Choosing a collector: G1 vs ZGC vs Parallel, by workload', 2.5],
          ['Reading GC logs; diagnosing a long pause', 2.5],
          ['Memory leaks in a long-running service; heap dump analysis with MAT', 2.5],
          ['The JVM flags that matter in a container, and the ones that are cargo cult', 1.5],
        ],
      ),
    ],
  ),

  phase(
    9,
    'Messaging, Kafka & Event-Driven Systems',
    'Kafka is named in more 30 LPA backend job descriptions than any other single technology outside Spring itself.',
    'A producer and consumer pair with idempotent processing, a dead-letter topic, and a demonstration that a rebalance does not lose or duplicate a message.',
    [
      topic(
        'Why queues',
        'What asynchrony buys, and what it costs.',
        v(
          'high',
          'The framing every messaging question rests on; without it, Kafka knowledge sounds memorised.',
        ),
        [
          ['Decoupling, load levelling, backpressure', 2],
          ['Sync vs async request patterns', 1],
          ['The 202-Accepted plus polling or callback pattern', 2],
        ],
      ),
      topic(
        'Kafka fundamentals',
        'The log, and everything that follows from it.',
        v(
          'critical',
          'Kafka and event streaming top the list of in-demand backend skills in India in 2026, and partitions and consumer groups are the first thing asked.',
        ),
        [
          ['Topics, partitions, offsets, and the log as the core abstraction', 3],
          ['Producers: acks, retries, the idempotent producer, batching', 3],
          ['Consumers, consumer groups, and rebalancing', 3],
          ['Partition keys and ordering guarantees', 2],
          ['Retention and compaction, and when each is right', 1.5],
          ['Replication, ISR, and what happens when a broker dies', 1.5],
        ],
      ),
      topic(
        'Kafka in production',
        'The problems that only appear once it is running.',
        v(
          'critical',
          'Duplicate delivery and growing consumer lag are the problems that only appear once a consumer is running against real volume.',
        ),
        [
          [
            'Delivery semantics: at-most-once, at-least-once, and why exactly-once is mostly marketing',
            2.5,
          ],
          ['Consumer idempotency and deduplication', 2],
          ['Dead-letter topics and poison-message handling', 2],
          ['Consumer lag as the metric that actually matters', 1.5],
          ['Schema registry, and Avro or protobuf evolution', 2],
        ],
      ),
      topic(
        'Spring integration',
        'Kafka from inside a Spring Boot service.',
        v(
          'high',
          'The layer that connects the two things above. Claiming both Spring and Kafka implies you have wired them together.',
        ),
        [
          ['Spring Kafka: @KafkaListener, listener containers, error handlers', 2.5],
          ['Manual vs automatic offset commits', 1.5],
          ['Testing against an embedded broker or Testcontainers', 2],
        ],
      ),
      topic(
        'Event-driven design',
        'Patterns for keeping services consistent without distributed transactions.',
        v(
          'critical',
          'You cannot atomically write to a database and a broker. Every event-driven design has to answer this, and outbox and sagas are the standard answers.',
        ),
        [
          ['Events vs commands; choreography vs orchestration', 2],
          ['The dual-write problem and the transactional outbox pattern', 3],
          ['Sagas and compensating transactions', 2.5],
          ['Event sourcing and CQRS at awareness level', 1.5],
          ['RabbitMQ exchanges and routing, for contrast with Kafka', 1],
        ],
      ),
    ],
  ),

  phase(
    10,
    'Microservices & Distributed Systems',
    'The architecture the job descriptions ask for, and the theory that makes your answers hold up under follow-up questions.',
    'Two services that stay correct when one of them is down — with timeouts, a circuit breaker, and a demonstrated fallback.',
    [
      topic(
        'Distributed systems foundations',
        'The theory underneath every design answer you will give.',
        v(
          'critical',
          'Naming the consistency model you actually need is what makes a design precise instead of plausible-sounding.',
        ),
        [
          ['CAP stated correctly, not the pop-science version', 2],
          ['Consistency models: strong, eventual, causal, read-your-writes', 3],
          ['Consensus at concept level: Raft, leader election, quorums', 2.5],
          ['Clocks, ordering, and why timestamps lie', 2],
          ['The eight fallacies of distributed computing, with an example of each', 2.5],
        ],
      ),
      topic(
        'Service decomposition',
        'Where to draw the lines, and when not to draw them at all.',
        v(
          'critical',
          'Most systems are not big enough for microservices. Being able to argue that is worth more than being able to draw the diagram.',
        ),
        [
          [
            'Monolith vs modular monolith vs microservices — the honest case for the modular monolith',
            2.5,
          ],
          ['Bounded contexts and service boundaries', 2],
          ['The distributed monolith: the failure mode you will be asked to spot', 2],
          ['Data ownership per service; no shared database', 1.5],
        ],
      ),
      topic(
        'Inter-service communication',
        'Calls between services, and the coupling each style creates.',
        v(
          'critical',
          'How services call each other determines how tightly they are coupled, and a synchronous call makes someone else’s downtime yours.',
        ),
        [
          ['Sync vs async between services, chosen per call rather than globally', 2],
          ['Service discovery; API gateway; the BFF pattern', 2],
          ['Contract testing with Pact', 1.5],
          ['Distributed transactions, and why you avoid them', 2.5],
        ],
      ),
      topic(
        'Resilience patterns',
        'Staying up when something you depend on does not.',
        v(
          'critical',
          'These are what stop one slow dependency taking down everything that calls it. A design without them is a design that has not considered failure.',
        ),
        [
          ['Timeouts on every outbound call — non-negotiable', 1.5],
          ['Retries with exponential backoff and jitter; retry storms', 2],
          ['Circuit breakers with Resilience4j', 2],
          ['Bulkheads and rate limiting between services', 1.5],
          ['Graceful degradation and fallbacks', 1],
          ['Idempotency at the system level', 1],
        ],
      ),
      topic(
        'Scaling data',
        'What happens to the database when the traffic arrives.',
        v(
          'critical',
          'Replication lag and hot keys are what "just add read replicas" runs into, and they constrain the design rather than decorate it.',
        ),
        [
          ['Read replicas and replication lag', 2],
          ['Sharding strategies, and the pain each one buys', 2.5],
          ['Partitioning; hot keys and how to spread them', 2],
          ['Denormalisation for read paths; CQRS in practice', 1.5],
        ],
      ),
    ],
  ),

  phase(
    11,
    'Containers, CI/CD, Cloud & Kubernetes',
    'Ship software automatically and reproducibly. Kubernetes and cloud are named in most job descriptions at this band.',
    'One repo, one push to main, automatic test → build → deploy to a live URL on Kubernetes. Zero manual steps — if any step is manual, the gate is failed.',
    [
      topic(
        'Linux & networking',
        'The machine your service runs on.',
        v(
          'high',
          'Every production debugging story rests on this, and without it you cannot tell whether the problem is the network or your code.',
        ),
        [
          ['Processes, signals, file descriptors, permissions', 2],
          ['Ports and sockets; the DNS resolution path; the TCP handshake', 2],
          ['Reverse proxies (nginx); TLS termination', 2],
          ['curl, dig, ss, lsof and jstack as daily tools', 2],
        ],
      ),
      topic(
        'Docker',
        'Images, layers, and the JVM inside a container.',
        v(
          'critical',
          'Containers are how services ship, and a JVM that ignores its cgroup limit gets OOMKilled in a way that looks like a mystery.',
        ),
        [
          ['Images vs containers; layer caching', 1.5],
          ['Multi-stage builds for a Spring Boot jar; layered jars and image size', 2.5],
          ['The JVM in a container: cgroup limits and MaxRAMPercentage', 2],
          ['Volumes, networks, healthchecks, non-root users', 2],
          ['docker-compose for local multi-service development', 1],
        ],
      ),
      topic(
        'Kubernetes',
        'Working level: enough to run a service, not to be a platform engineer.',
        v(
          'critical',
          'Kubernetes is named among the most in-demand backend skills in India for 2026, and probes and resource limits are where Java services actually get killed.',
        ),
        [
          ['Pods, deployments, services, ingress', 3],
          ['ConfigMaps and secrets', 2],
          ['Resource requests and limits; what OOMKilled actually means', 2.5],
          ['Liveness vs readiness vs startup probes', 2],
          ['Horizontal pod autoscaling', 2],
          ['Rolling updates, rollbacks, and graceful shutdown with preStop', 2.5],
        ],
      ),
      topic(
        'CI/CD',
        'A pipeline that makes deploying boring.',
        v(
          'critical',
          'A pipeline makes deploying boring, which is the point. It also produces a live URL, which is a thing you can show rather than describe.',
        ),
        [
          ['GitHub Actions: test, lint, build and deploy as one pipeline', 2.5],
          ['Caching Maven dependencies; matrix builds', 1.5],
          ['Container registry push; environment secrets', 1.5],
          ['Deployment strategies: rolling, blue-green, canary', 2],
          ['Automated rollback on a failed health check', 1.5],
        ],
      ),
      topic(
        'Cloud',
        'The managed services your architecture will actually be built from.',
        v(
          'critical',
          'Cloud services are named among the in-demand backend skills, and an architecture with no cost estimate is an unfinished architecture.',
        ),
        [
          ['Compute: VM vs container service vs serverless, chosen by workload', 2],
          ['Object storage (S3 semantics); managed Postgres (RDS)', 2],
          ['IAM and least privilege; VPCs, subnets, security groups', 2.5],
          ['Managed Kafka (MSK) and managed Redis (ElastiCache)', 1.5],
          ['Cost awareness — the senior signal most candidates never show', 2],
        ],
      ),
    ],
  ),

  phase(
    12,
    'Observability & Reliability',
    'The dividing line between someone who builds demos and someone who runs systems.',
    'A written postmortem of a failure you induced in your own system and diagnosed purely through telemetry.',
    [
      topic(
        'Logging',
        'Logs that are searchable and safe.',
        v(
          'high',
          'Without a correlation ID the logs of a distributed system cannot be reassembled into the request that produced them.',
        ),
        [
          ['Structured JSON logging with SLF4J and Logback; levels used meaningfully', 2],
          ['Correlation IDs threaded through services with MDC', 2],
          ['What must never be logged: PII, secrets, tokens', 1],
        ],
      ),
      topic(
        'Metrics',
        'Instrumenting a service so it can be reasoned about.',
        v(
          'critical',
          'Micrometer and Prometheus are the conventional Java instrumentation stack, and RED/USE turns "what should I monitor?" into a checklist.',
        ),
        [
          ['Counters, gauges, histograms and summaries', 2],
          ['Micrometer and the Actuator-to-Prometheus bridge', 2],
          ['The RED method and the USE method', 2],
          ['Grafana dashboards; cardinality explosion as an anti-pattern', 2],
        ],
      ),
      topic(
        'Tracing',
        'Following one request across several services.',
        v(
          'high',
          'A trace is how you find which hop spent the time. Without it, diagnosing latency across services is argument rather than evidence.',
        ),
        [
          ['Distributed tracing: spans and trace context propagation', 2],
          ['OpenTelemetry instrumentation in Spring', 2],
          ['Finding latency across a multi-service call path', 2],
        ],
      ),
      topic(
        'Reliability engineering',
        'Deciding how reliable is reliable enough, and defending it.',
        v(
          'critical',
          'An SLO turns "is it reliable enough?" from an opinion into a number you can decide against. Without one, every incident is relitigated from scratch.',
        ),
        [
          ['SLI, SLO, SLA, and error budgets', 2],
          ['Health endpoints that mean something; graceful shutdown and connection draining', 2],
          ['Alerting on symptoms, not causes', 1.5],
          ['Chaos: breaking your own system deliberately', 1.5],
        ],
      ),
      topic(
        'Incident practice',
        'Doing it once, for real, on a system you own.',
        v(
          'critical',
          'This is the one place you can practise incident response before you are on call for real — and it produces a written artefact you can show.',
        ),
        [
          ['Induce a failure: kill the database, saturate the queue, add five seconds of latency', 1.5],
          ['Diagnose it using only dashboards, logs and traces', 1.5],
          ['Write the blameless postmortem — the artefact that reads as senior', 1],
        ],
      ),
    ],
  ),

  phase(
    13,
    'System Design',
    'Named as the single biggest differentiator between a 12 LPA and a 30 LPA engineer. Treat it as a performance skill, not a reading list.',
    'Ten designs under 45-minute timed conditions, spoken aloud, each with explicit capacity estimates and stated tradeoffs.',
    [
      topic(
        'Building blocks',
        'The components every design is assembled from.',
        v(
          'critical',
          'You cannot compose a design out of parts you cannot describe individually.',
        ),
        [
          ['Load balancers: L4 vs L7, algorithms, sticky sessions and why to avoid them', 2],
          ['Stateless services and horizontal scaling', 1.5],
          ['CDNs and edge caching', 1.5],
          ['Message queues as a design primitive', 1.5],
          ['Storage choice: SQL vs NoSQL vs object vs search vs cache', 2.5],
          ['Rate limiting and API gateways', 1],
        ],
      ),
      topic(
        'Capacity estimation',
        'Numbers, out loud, without a calculator.',
        v(
          'critical',
          'Numbers are what separate a design that sounds reasonable from one that is shown to work. The arithmetic is easy; doing it while talking is the skill.',
        ),
        [
          [
            'Back-of-envelope: QPS, storage, bandwidth, and the latency numbers every engineer should know',
            2.5,
          ],
          ['Sizing from a stated DAU, out loud, without a calculator', 2.5],
        ],
      ),
      topic(
        'The design interview method',
        'The order to say things in, and how to be wrong gracefully.',
        v(
          'critical',
          'The method transfers to designs you have never seen, which no individual worked example does — and it is learnable in a few hours.',
        ),
        [
          [
            'Requirements first: functional, non-functional, and what you explicitly declare out of scope',
            2,
          ],
          ['The order: API → data model → high level → deep dive → bottlenecks', 2],
          ['Stating tradeoffs rather than hiding them; changing your mind gracefully', 2],
        ],
      ),
      topic(
        'Classic designs, timed',
        'The questions that are actually asked.',
        v(
          'critical',
          'These are the canonical problems, and each one exercises a different primitive. Having designed them before turns invention into adaptation.',
        ),
        [
          ['URL shortener; rate limiter; key-value store', 3],
          ['News feed; notification service; chat', 3.5],
          ['Ride-hailing dispatch; ticket booking with no double-booking', 3.5],
          ['Payment system with idempotency and reconciliation', 3],
          ['Distributed job scheduler; file upload service', 3],
        ],
      ),
      topic(
        'Low-level design',
        'The separate round that trips up candidates who only prepared HLD.',
        v(
          'critical',
          'Low-level design is a separate skill from high-level design — classes and interactions rather than boxes and arrows — and preparing only the latter leaves a gap.',
        ),
        [
          ['SOLID as things you can point at in your own code, not as slogans', 2],
          ['The patterns that actually appear: strategy, factory, builder, observer, adapter', 2.5],
          ['LLD rounds against the clock: parking lot, elevator, Splitwise, in 45 minutes', 3.5],
        ],
      ),
    ],
  ),

  phase(
    14,
    'Capstone',
    'One system that uses everything above and that you can defend line by line. This is the thing you talk about in every interview.',
    'A stranger can clone the repo, run one command, and have the whole system running. If setup requires a conversation with you, it is not finished.',
    [
      topic(
        'Build',
        'One production-shaped system, not five tutorials.',
        v(
          'critical',
          'Without industry experience this is your evidence, and one system you understand deeply is worth more than a dozen you assembled from tutorials.',
        ),
        [
          ['A Spring Boot service on Postgres with deliberate indexing and no N+1', 6],
          ['Redis caching and a Kafka-driven asynchronous path', 6],
          ['Spring Security with JWT and refresh rotation', 4],
          ['Containerised and deployed to Kubernetes by CI/CD, to a live URL', 5],
          ['Micrometer, Prometheus, Grafana and structured logs', 5],
        ],
      ),
      topic(
        'Prove it',
        'Numbers, not adjectives.',
        v(
          'critical',
          'A measurement, a change, and a second measurement is the shape of real engineering work. Claims about performance without it are just adjectives.',
        ),
        [
          ['Load test it and publish p50/p95/p99 under a stated load', 4],
          ['Find a real bottleneck, fix it, and show the before and after', 4],
          ['Induce a failure and show the system degrading rather than falling over', 4],
        ],
      ),
      topic(
        'Document',
        'Writing that makes the work legible to someone who was not there.',
        v(
          'critical',
          'The code already says what. Only you can record why, and the why is what someone reads to judge your reasoning.',
        ),
        [
          ['An architecture diagram, and a README a stranger can run in one command', 2.5],
          ['ADRs explaining why, not what', 2.5],
          ['Benchmark numbers, and honestly stated known limitations', 2],
        ],
      ),
      topic(
        'Defend',
        'Rehearsing the conversation the interview will actually be.',
        v(
          'critical',
          'The capstone is only worth the hours if you can talk about it well, and that is a separate rehearsal from building it.',
        ),
        [
          ['Justify every technology choice against a named alternative', 2],
          ['Say what you would do differently at 100x traffic — interviewers probe exactly here', 1.5],
          ['A three-minute version and a fifteen-minute version, both rehearsed', 1.5],
        ],
      ),
    ],
  ),

  phase(
    15,
    'Career, Communication & Negotiation',
    'The phase that converts skill into salary. Most of the gap between a 20 LPA and a 30 LPA offer for the same engineer is decided here.',
    'A one-page resume where every bullet carries a number, eight rehearsed STAR stories, and a written walk-away number you decided before any call.',
    [
      topic(
        'The written record',
        'The documents that decide whether you are interviewed at all.',
        v(
          'critical',
          'The resume is the one gate you cannot talk your way through, because you are not in the room when it is read.',
        ),
        [
          ['A one-page resume where every bullet has a verb and a number', 3],
          ['The impact bullet formula: did X using Y, which moved Z by N%', 2],
          ['LinkedIn and GitHub as evidence, not decoration', 1.5],
          ['A README on your top three repositories that a recruiter can actually read', 1.5],
        ],
      ),
      topic(
        'Behavioural rounds',
        'Eight stories, prepared once, reused everywhere.',
        v(
          'critical',
          'Product-company loops include behavioural rounds alongside DSA and design, and an unprepared failure story is the one that does real damage.',
        ),
        [
          ['STAR, and eight stories covering conflict, failure, ownership and influence', 3],
          ['The failure story: told without blaming anyone, ending in what you changed', 2],
          ['"Why this company" answered with something only you could have said', 1],
          ['Questions to ask them that reveal you have run systems', 1],
        ],
      ),
      topic(
        'Communication as an engineer',
        'The skill that decides who is promoted, and who is listened to.',
        v(
          'critical',
          'Above the entry band you are paid partly to influence decisions. Explaining a design clearly and taking review feedback well is most of how that happens.',
        ),
        [
          ['Explaining a design out loud to someone who cannot see your screen', 2],
          ['Writing a design doc; writing a PR description that reviews itself', 2],
          ['Code review: giving feedback that lands, and taking it without defending', 1.5],
          ['Disagreeing with a senior engineer and being right without being difficult', 1.5],
        ],
      ),
      topic(
        'The search itself',
        'Running the process rather than being run by it.',
        v(
          'critical',
          'Overlapping offers are the only real leverage you get, and they only overlap if you apply in batches rather than one at a time.',
        ),
        [
          ['Referrals: the channel that actually converts, and how to ask without cringing', 2],
          ['Applying in batches so that offers land within the same fortnight', 1.5],
          ['Recruiter screens: what to say, and what never to say about current pay', 1.5],
          ['Tracking the pipeline and following up', 1],
        ],
      ),
      topic(
        'Negotiation',
        'The highest paid hour of the entire plan.',
        v(
          'critical',
          'Companies commonly quote the middle of an internal band, and asking what the band is and for the top of it is a normal thing to do. One conversation can be worth more than a phase of study.',
        ),
        [
          ['Never name a number first; deflecting the current-CTC question', 1.5],
          ['Ask what the band is, and ask for the top of it', 1.5],
          [
            'Reading the offer: base, variable, RSU value and vest schedule, joining and retention bonuses — separately, and in writing',
            2,
          ],
          ['Competing offers as the only real leverage, used without bluffing', 1.5],
          ['Knowing your walk-away number before the call starts', 0.5],
        ],
      ),
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
      // A weight with no reasoning behind it is the failure mode this whole
      // value model exists to avoid, so it is a seed error rather than a lint.
      if (!t.value) {
        errors.push(`Phase ${p.id} → ${t.name}: no value assigned.`);
      } else if (!t.value.why.trim()) {
        errors.push(`Phase ${p.id} → ${t.name}: value carries no justification.`);
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
