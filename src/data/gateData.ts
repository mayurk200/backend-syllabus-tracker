import type { Phase, Subtopic, Topic } from '../types';

/**
 * GATE 2027 — Computer Science. Verbatim content from the AIR < 50 Campaign
 * Plan and the 196-day Daily To-Do List.
 *
 * Structure: 12 subjects → topics (one per campaign week) → subtopics (one per
 * study day). Hours are the plan's focused hours:
 *
 *   Mon–Thu  4 × 7.0h  = 28h   new material (Block A intake + B solve + C PYQ)
 *   Friday       7.0h  =  7h   consolidation — full PYQ sweep + ≤1 page notes
 *   Saturday    10.0h  = 10h   timed test 09:30–12:30 + 4h analysis + backlog
 *   ------------------------------------------------------------------------
 *   Week total  45h            (Sunday is a protected rest day)
 *
 * The 850 hours below are Phase-1 first-pass learning only. Revision (P2),
 * mocks (P3) and taper (P4) live in the week timeline — see gateWeeks.ts —
 * and bring the campaign total to ~1,240 hours.
 */

const DAY_HOURS = 7;
const FRI_HOURS = 7;
const SAT_HOURS = 10;

interface WeekSpec {
  /** 'W1' — used in the topic title so subjects map onto the timeline. */
  week: string;
  name: string;
  /** Mon, Tue, Wed, Thu — one new topic per day, 7h each. */
  days: string[];
  /** Friday — consolidation. */
  friday: string;
  /** Saturday — timed test + analysis. */
  saturday: string;
  /** Subtopics that are newly added to the 2027 syllabus. */
  newIndexes?: number[];
}

/** Build one week-topic (45h) out of its six study days. */
function week(spec: WeekSpec): Topic {
  const isNew = (i: number): boolean => (spec.newIndexes ?? []).includes(i);
  const subtopics: Subtopic[] = [
    ...spec.days.map((d, i) => ({
      name: d,
      hours: DAY_HOURS,
      done: false,
      ...(isNew(i) ? { isNew: true } : {}),
    })),
    {
      name: spec.friday,
      hours: FRI_HOURS,
      done: false,
      ...(isNew(4) ? { isNew: true } : {}),
    },
    { name: spec.saturday, hours: SAT_HOURS, done: false },
  ];
  return {
    name: `${spec.week} · ${spec.name}`,
    hours: subtopics.reduce((s, x) => s + x.hours, 0),
    detail: `One week of the campaign plan — ${spec.days.length} new topics, a full previous-year sweep on Friday, and a timed test on Saturday.`,
    done: false,
    subtopics,
  };
}

/** Build a free-form topic from explicit subtopics. */
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

function subject(
  id: number,
  title: string,
  description: string,
  gate: string,
  targetMarks: number,
  weeks: string,
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
    targetMarks,
    weeks,
  };
}

const PYQ = (s: string): string =>
  `Full previous-year sweep: ${s}, 2000–2026, every question. Compress the week into ≤1 page of ugly short notes. Anki cards for pure-recall facts only.`;

const TEST = (s: string): string =>
  `Timed test 09:30–12:30 — ${s}. Then 4h analysis: re-solve every wrong question from scratch, then every correct-but-slow one. Code all errors C1–C6.`;

export const GATE_SUBJECTS: readonly Phase[] = [
  // ── 0 ────────────────────────────────────────────────────────────────────
  subject(
    0,
    'Discrete Mathematics',
    'Highest-density single topic in the paper. Fully deterministic, no ambiguity — must be near-perfect.',
    'Full Discrete PYQ sweep 2000–2026 at ≥85% accuracy. Subject test ≥80%. One-page short notes for the entire subject written and reproducible from memory.',
    9,
    'W1–W3 · 3–23 Aug 2026',
    [
      week({
        week: 'W1',
        name: 'Logic, Sets, Relations & Functions',
        days: [
          'Propositional logic — connectives, truth tables, tautology / contradiction / contingency, logical equivalences',
          'Propositional logic — rules of inference, validity of arguments, CNF & DNF conversion',
          'Predicate (first-order) logic — quantifiers, nested quantifiers, negation, English↔FOL translation',
          'Sets — operations, power sets, Cartesian products; Relations — reflexive/symmetric/transitive, closures, equivalence relations, partial orders, Hasse diagrams; Functions — injective / surjective / bijective, counting functions',
        ],
        friday: PYQ('Discrete Mathematics I'),
        saturday: TEST('Subject Test, Discrete I'),
      }),
      week({
        week: 'W2',
        name: 'Combinatorics, Recurrences & Generating Functions',
        days: [
          'Counting — sum & product rules, permutations, combinations, binomial theorem, combinations with repetition',
          'Pigeonhole principle (simple & generalised); inclusion–exclusion principle, derangements',
          'Recurrence relations — linear homogeneous with constant coefficients, characteristic roots, repeated roots',
          'Recurrence relations — non-homogeneous, particular solutions; generating functions',
        ],
        friday: `${PYQ('Discrete Mathematics II')} ADMIN: the GATE 2027 application portal opens 14 Aug — submit the form today.`,
        saturday: TEST('Subject Test, Discrete II'),
      }),
      week({
        week: 'W3',
        name: 'Graph Theory, Groups, Lattices & Boolean Algebra',
        days: [
          'Graph theory — terminology, degree & handshaking, connectivity, components, trees, spanning trees, cut vertices/edges',
          'Graph theory — Euler & Hamiltonian paths/circuits, planarity & Euler’s formula, graph colouring, chromatic number',
          'Graph theory — matching, bipartite graphs, isomorphism, adjacency/incidence matrices',
          'Groups, subgroups, cyclic groups, order of elements; posets, lattices, Boolean algebra',
        ],
        friday: PYQ('Discrete Mathematics III'),
        saturday: TEST('Subject Test, Discrete Mathematics (FULL) — gate: ≥80%'),
      }),
    ],
  ),

  // ── 1 ────────────────────────────────────────────────────────────────────
  subject(
    1,
    'Digital Logic',
    'Small, mechanical, closes fast. Quine–McCluskey is newly explicit in the 2027 syllabus.',
    'DL PYQ ≥85%. Any ≤5-variable function minimised by K-map in ≤2 min and by the tabular method in ≤6 min. IEEE-754 conversions error-free on a 20-question drill.',
    5,
    'W4 · 24–30 Aug 2026',
    [
      week({
        week: 'W4',
        name: 'Number Systems, Minimisation & Circuits',
        days: [
          'Number systems & base conversion, r’s and (r−1)’s complements, signed number representation; fixed-point and floating-point (IEEE-754 single & double)',
          'Boolean algebra, canonical SOP/POS; minimisation — algebraic, K-map (2–5 variables), don’t-cares; Quine–McCluskey tabular method (NEW in 2027)',
          'Combinational circuits — multiplexers, demultiplexers, decoders, encoders, priority encoders, code converters',
          'Combinational arithmetic — half/full adders, ripple-carry & carry-lookahead, comparators; sequential circuits — latches, flip-flops (SR/JK/D/T), excitation tables',
        ],
        friday: `Leftover new topic (90 min cap): counters, shift registers, finite state machines (Mealy vs Moore), state minimisation. Then ${PYQ('Digital Logic')}`,
        saturday: TEST('Subject Test, Digital Logic'),
        newIndexes: [1],
      }),
    ],
  ),

  // ── 2 ────────────────────────────────────────────────────────────────────
  subject(
    2,
    'Programming & Data Structures',
    'Your existing coding background is a genuine edge here. Exploit it. Practise dry-running code on paper, never in an IDE.',
    'PDS PYQ 2000–2026 ≥85%. 30-question code dry-run drill at 100% accuracy, ≤2.5 min/question, no compiler. Complete operation-complexity table (best/avg/worst, all structures) reproduced cold on blank paper.',
    9,
    'W5–W6 · 31 Aug – 13 Sep 2026',
    [
      week({
        week: 'W5',
        name: 'Programming in C & Linear Data Structures',
        days: [
          'C — data types, operators & precedence, control flow, functions, scope & lifetime, storage classes, parameter passing (value vs reference)',
          'C — pointers, pointer arithmetic, arrays vs pointers, 2-D arrays, arrays of pointers, strings',
          'C — recursion (tracing, recursion trees, tail recursion), structures & unions, dynamic memory allocation',
          'Arrays; stacks and their applications (infix→postfix, expression evaluation, parenthesis matching); queues, circular queues, deques',
        ],
        friday: `Leftover new topic (90 min cap): linked lists — singly, doubly, circular; insertion/deletion; comparison with arrays. Then ${PYQ('Programming in C & Linear Data Structures')}`,
        saturday: TEST('Subject Test, Programming & Linear DS'),
      }),
      week({
        week: 'W6',
        name: 'Trees, Heaps, Hashing & Graph Structures',
        days: [
          'Binary trees — properties, representations, all traversals, reconstruction from traversal pairs, threaded trees',
          'Binary search trees — search/insert/delete and their complexities; balanced trees (AVL rotations), B-trees intro',
          'Heaps & priority queues — build-heap, heapify, heapsort, complexity analysis',
          'Hashing — hash functions, collision resolution (chaining, linear/quadratic probing, double hashing), load factor, expected probes; graph representations, BFS, DFS and their applications',
        ],
        friday: PYQ('Trees, Heaps, Hashing & Graph Structures'),
        saturday: TEST('Subject Test, Data Structures (FULL)'),
      }),
    ],
  ),

  // ── 3 ────────────────────────────────────────────────────────────────────
  subject(
    3,
    'Algorithms',
    'Highest conceptual ceiling in the paper. Expect to drop 1–2 marks to a genuinely hard question.',
    'Algorithms PYQ ≥85%. Every sorting algorithm’s comparison/swap counts on a given array computed without re-deriving the algorithm. M1 Part Test 1 ≥75% with ≤2 conceptual errors.',
    7,
    'W7–W8 · 14–27 Sep 2026',
    [
      week({
        week: 'W7',
        name: 'Asymptotics, Recurrences, Sorting & Searching',
        days: [
          'Asymptotic notation — O, Ω, Θ, o, ω; growth-rate comparison; formal proofs; best/average/worst-case analysis',
          'Recurrence solving — substitution, recursion tree, Master theorem (all 3 cases + when it fails); divide-and-conquer paradigm',
          'Sorting I — insertion, selection, bubble, merge sort; comparison and swap counts; stability; lower bound on comparison sorting',
          'Sorting II — quicksort (best/avg/worst, pivot strategies), heapsort; counting, radix, bucket sort; searching; order statistics / median-of-medians',
        ],
        friday: PYQ('Algorithms I'),
        saturday: TEST('Subject Test, Algorithms I'),
      }),
      week({
        week: 'W8',
        name: 'Greedy, Dynamic Programming, Graphs & NP-Completeness',
        days: [
          'Greedy method — activity selection, fractional knapsack, Huffman coding, job sequencing; proof of the greedy-choice property',
          'Dynamic programming I — LCS, edit distance, 0/1 knapsack; memoisation vs tabulation',
          'Dynamic programming II — matrix chain multiplication, coin change, subset sum; DP-vs-greedy decision; graph algorithms — topological sort, MST (Prim, Kruskal)',
          'Shortest paths — Dijkstra, Bellman–Ford, Floyd–Warshall; NP-completeness, P/NP/NPC/NPH, reductions',
        ],
        friday: `${PYQ('Algorithms II')} ADMIN: the application window closes ~21 Sep — verify submission and correction status.`,
        saturday:
          '★ MAJOR MILESTONE M1 — Part Test 1 (Discrete Maths + Digital Logic + PDS + Algorithms). Pass: ≥75% of marks with ≤2 conceptual errors. Then 4h analysis and error coding.',
      }),
    ],
  ),

  // ── 4 ────────────────────────────────────────────────────────────────────
  subject(
    4,
    'Engineering Mathematics',
    'Small syllabus, stable question patterns, very high marks-per-hour. Linear algebra, calculus, probability and statistics.',
    'Engineering Maths PYQ ≥85%. Eigenvalue problems for 3×3 matrices in ≤3 min. Conditional-probability tree construction automatic; expectation-by-linearity used by default rather than brute enumeration.',
    5,
    'W9–W10 · 28 Sep – 11 Oct 2026',
    [
      week({
        week: 'W9',
        name: 'Linear Algebra & Calculus',
        days: [
          'Matrices — types, operations, determinants & properties, rank, elementary row operations, inverse',
          'Systems of linear equations — consistency, homogeneous/non-homogeneous, solution space; LU decomposition',
          'Eigenvalues & eigenvectors — characteristic equation, properties, Cayley–Hamilton, diagonalisation',
          'Calculus — limits, continuity, differentiability, mean value theorem, maxima & minima, definite/indefinite integration',
        ],
        friday: PYQ('Linear Algebra & Calculus'),
        saturday: TEST('Subject Test, Linear Algebra & Calculus'),
      }),
      week({
        week: 'W10',
        name: 'Probability & Statistics',
        days: [
          'Basic probability, sample spaces, independence, conditional probability, Bayes’ theorem, total probability',
          'Random variables, PMF/PDF/CDF, expectation, variance, linearity of expectation, indicator variables',
          'Discrete distributions — uniform, Bernoulli, binomial, Poisson; mean & variance derivations',
          'Continuous distributions — uniform, exponential (memorylessness), normal; descriptive statistics: mean, median, mode, standard deviation',
        ],
        friday: PYQ('Probability & Statistics'),
        saturday: TEST('Subject Test, Probability & Statistics'),
      }),
    ],
  ),

  // ── 5 ────────────────────────────────────────────────────────────────────
  subject(
    5,
    'Computer Organisation & Architecture',
    'Pipelining and cache numericals. The new 2027 control-unit and memory-interfacing topics have no PYQ — textbook only.',
    'Pipeline speedup, stall-cycle and CPI computations at ≥90% accuracy. Control-unit design worked from the textbook. M2 Part Test 2 (Eng Maths + COA) ≥75%.',
    6,
    'W11–W12 · 12–25 Oct 2026',
    [
      week({
        week: 'W11',
        name: 'Instructions, Datapath, Control Unit & Pipelining',
        days: [
          'Machine instructions, instruction formats, instruction cycle, addressing modes, RISC vs CISC',
          'ALU design, datapath, register transfer, bus organisation; control unit — hardwired design (NEW in 2027)',
          'Control unit — microprogrammed design (NEW in 2027): microinstruction formats, horizontal vs vertical, control memory. TEXTBOOK ONLY — no PYQ exists',
          'Instruction pipelining — stages, throughput & speedup, structural / data / control hazards, forwarding, stalls, branch prediction, CPI computation',
        ],
        friday: PYQ('Computer Organisation & Architecture I'),
        saturday: TEST('Subject Test, COA I'),
        newIndexes: [1, 2],
      }),
      week({
        week: 'W12',
        name: 'Memory Hierarchy, Cache, Interfacing & I/O',
        days: [
          'Memory hierarchy, locality of reference, cache fundamentals, hit/miss ratio, average memory access time (AMAT)',
          'Cache mapping — direct, fully associative, set-associative; tag/index/offset field computation',
          'Replacement policies (LRU, FIFO, optimal), write policies (write-through/write-back, write-allocate), multilevel caches',
          'Memory interfacing (NEW in 2027); I/O interface, programmed I/O, interrupt-driven I/O, interrupt handling & priority, DMA',
        ],
        friday: PYQ('Computer Organisation & Architecture II'),
        saturday:
          '★ MAJOR MILESTONE M2 — Part Test 2 (Engineering Maths + COA). Pass: ≥75%. Then 4h analysis and error coding.',
        newIndexes: [3],
      }),
    ],
  ),

  // ── 6 ────────────────────────────────────────────────────────────────────
  subject(
    6,
    'Operating Systems',
    'Numerical-heavy and highly PYQ-patterned. Should be a strength — the highest ratio of drillable questions in the paper.',
    'Full OS PYQ ≥85%. Any scheduling algorithm’s Gantt chart, waiting time and turnaround time computed in ≤3 min. TLB / multi-level page table effective-access calculations in ≤2 min with zero arithmetic errors.',
    8,
    'W13–W14 · 26 Oct – 8 Nov 2026',
    [
      week({
        week: 'W13',
        name: 'Processes, Scheduling, Synchronisation & Deadlock',
        days: [
          'Processes, process states & transitions, PCB, context switching, threads (user vs kernel), inter-process communication',
          'CPU scheduling — FCFS, SJF, SRTF, priority, round robin, multilevel queue; Gantt charts, waiting & turnaround time, convoy effect, starvation',
          'Synchronisation — race conditions, critical-section problem, Peterson’s solution, semaphores, mutex; classical problems (producer–consumer, readers–writers, dining philosophers)',
          'Deadlock — necessary conditions, resource allocation graphs, prevention, avoidance (Banker’s algorithm), detection & recovery; monitors',
        ],
        friday: PYQ('Operating Systems I'),
        saturday: TEST('Subject Test, OS I'),
      }),
      week({
        week: 'W14',
        name: 'Memory Management, Virtual Memory, File Systems & Disks',
        days: [
          'Memory management — contiguous allocation, fixed/variable partitions, fragmentation, compaction, paging fundamentals',
          'Page tables (single, multi-level, inverted), TLB, effective access time calculation; segmentation and segmented paging',
          'Virtual memory, demand paging, page-fault handling; page replacement — FIFO, LRU, optimal, clock; Belady’s anomaly, thrashing, working-set model',
          'File systems — directory structure, allocation methods, free-space management, inodes; disk structure and disk scheduling (FCFS, SSTF, SCAN, C-SCAN, LOOK)',
        ],
        friday: PYQ('Operating Systems II'),
        saturday: TEST('Subject Test, Operating Systems (FULL)'),
      }),
    ],
  ),

  // ── 7 ────────────────────────────────────────────────────────────────────
  subject(
    7,
    'Databases',
    'Normalisation and serializability are formulaic once drilled. Drill them to reflex.',
    'DBMS PYQ ≥85%. Conflict and view serializability tested mechanically; candidate keys of any relation found systematically, not by inspection.',
    6,
    'W15 · 9–15 Nov 2026',
    [
      week({
        week: 'W15',
        name: 'ER, Relational Algebra, SQL, Normalisation & Transactions',
        days: [
          'ER model, entity/relationship types, cardinality, weak entities, ER-to-relational mapping; relational model, keys, integrity constraints',
          'Relational algebra (all operators, including division), tuple relational calculus, domain relational calculus',
          'SQL — joins, nested & correlated subqueries, aggregation, grouping, views, triggers, NULL semantics',
          'Functional dependencies, attribute closure, candidate key computation, normal forms 1NF/2NF/3NF/BCNF, lossless-join & dependency-preserving decomposition',
        ],
        friday:
          'Leftover new topics (90 min cap): transactions & ACID, serializability (conflict & view), concurrency control (2PL, timestamp), recoverability & cascading rollback; file organisation, indexing, B and B+ trees. Then full previous-year sweep: Databases, 2000–2026.',
        saturday: TEST('Subject Test, Databases'),
      }),
    ],
  ),

  // ── 8 ────────────────────────────────────────────────────────────────────
  subject(
    8,
    'Theory of Computation',
    'Decidability questions are the trap; everything else is mechanical. Decidability and reductions are where marks are actually lost.',
    'TOC PYQ ≥85%. M3 Part Test 3 (OS + DBMS + TOC) ≥75%.',
    7,
    'W16 · 16–22 Nov 2026',
    [
      week({
        week: 'W16',
        name: 'Automata, Regular & Context-Free Languages, Turing Machines',
        days: [
          'Finite automata — DFA, NFA, ε-NFA, equivalence & conversions, DFA minimisation, Myhill–Nerode',
          'Regular expressions, regular grammars, closure properties of regular languages, pumping lemma for regular languages, decision problems',
          'Context-free grammars, derivations, ambiguity, CNF & GNF; pushdown automata (deterministic vs non-deterministic); CFL closure & decision properties, pumping lemma for CFL',
          'Turing machines, variants, recursive vs recursively enumerable languages, decidability, undecidability, reductions, Rice’s theorem',
        ],
        friday: PYQ('Theory of Computation'),
        saturday:
          '★ MAJOR MILESTONE M3 — Part Test 3 (OS + DBMS + TOC). Pass: ≥75%. Then 4h analysis and error coding.',
      }),
    ],
  ),

  // ── 9 ────────────────────────────────────────────────────────────────────
  subject(
    9,
    'Compiler Design',
    'Parsing tables are drillable to near-certainty. Twenty grammars and you are done.',
    'Compiler Design PYQ ≥85%. LR item sets and parse tables constructed for a fresh grammar in ≤10 min.',
    5,
    'W17 · 23–29 Nov 2026',
    [
      week({
        week: 'W17',
        name: 'Lexical Analysis, Parsing, SDT & Optimisation',
        days: [
          'Phases of a compiler, lexical analysis, tokens & lexemes, regex→NFA→DFA, symbol table; role of the parser',
          'Top-down parsing — left recursion removal, left factoring, FIRST & FOLLOW, LL(1) parsing tables, conflicts',
          'Bottom-up parsing — handles, shift-reduce, LR(0) items & automaton, SLR(1) parsing tables',
          'CLR(1) and LALR(1) construction, comparison of parser power, conflict identification and resolution',
        ],
        friday:
          'Leftover new topics (90 min cap): syntax-directed translation (S- and L-attributed), intermediate code generation (three-address code), runtime environments & activation records, local optimisation, data-flow analysis. Then full previous-year sweep: Compiler Design, 2000–2026.',
        saturday: TEST('Subject Test, Compiler Design'),
      }),
    ],
  ),

  // ── 10 ───────────────────────────────────────────────────────────────────
  subject(
    10,
    'Computer Networks (2027 scope)',
    'Syllabus cut hard for 2027 — lowest marks-per-hour after the trim. Deprioritised deliberately. Skip removed topics entirely.',
    '★ M4 — Full-Length Mock #1 with the syllabus complete. Pass: ≥58/100. CN PYQ (2027 scope only) ≥85%.',
    5,
    'W18 · 30 Nov – 6 Dec 2026',
    [
      week({
        week: 'W18',
        name: 'Layering, Data Link, IP, Routing, TCP & Sockets',
        days: [
          'Layering concepts, network performance metrics (NEW in 2027) — bandwidth, latency, throughput, delay-bandwidth product; circuit vs packet switching',
          'Data link layer — error detection & correction (parity, CRC, Hamming), flow control, sliding window (stop-and-wait, Go-Back-N, Selective Repeat), efficiency computation',
          'Medium access control; IPv4 & IPv6 addressing, subnetting, CIDR, NAT, fragmentation',
          'Routing — distance vector and link state; TCP — connection management, reliability, flow control, congestion control (slow start, AIMD)',
        ],
        friday:
          'Leftover new topics (90 min cap): socket API (NEW in 2027); application layer — DNS and HTTP ONLY. Then full previous-year sweep: Computer Networks, 2027 scope only.',
        saturday:
          '★ MAJOR MILESTONE M4 — Full-Length Mock #1. SYLLABUS COMPLETE. Pass: ≥58/100. Below 45 → re-target (Section 12 of the campaign plan).',
        newIndexes: [0, 4],
      }),
    ],
  ),

  // ── 11 ───────────────────────────────────────────────────────────────────
  subject(
    11,
    'General Aptitude',
    'The cheapest 15 marks in the paper. Time comes from college dead time — one 25-minute set per day, every day. Nowhere else in the week is time allocated to this.',
    'Target 14 of 15 marks. Full GA PYQ sweep across all-branch GATE papers 2010–2026 at ≥90% accuracy, ≤1.4 min per mark.',
    14,
    'Daily · 25 min in college dead time + W22 consolidation',
    [
      topic(
        'Verbal Aptitude',
        'English grammar, vocabulary and comprehension. Drilled in 25-minute daily sets.',
        [
          ['English grammar — tenses, articles, prepositions, subject–verb agreement, modifiers', 3],
          ['Vocabulary — word groups, synonyms/antonyms, commonly confused pairs, idioms', 2],
          ['Sentence completion, narrative sequencing and paragraph coherence', 2],
          ['Reading comprehension — inference, tone, main idea under a timer', 3],
        ],
      ),
      topic(
        'Quantitative Aptitude',
        'Arithmetic and elementary maths. Fully deterministic — accuracy, not knowledge, is the constraint.',
        [
          ['Ratios, proportions, percentages, profit & loss, mixtures and alligation', 3],
          ['Time–speed–distance, time & work, pipes and cisterns', 3],
          ['Numbers and number properties, HCF/LCM, remainders, averages', 2],
          ['Permutations, combinations and elementary probability', 3],
          ['Mensuration, geometry and elementary algebra; simple & compound interest', 3],
        ],
      ),
      topic(
        'Analytical & Logical Aptitude',
        'Logic puzzles and deduction. High marks-per-hour once the patterns are recognised.',
        [
          ['Logical deduction, syllogisms and assumption/conclusion questions', 3],
          ['Number and letter series, coding–decoding, analogies, odd-one-out', 2],
          ['Seating arrangements, blood relations, direction sense and ordering puzzles', 3],
          ['Venn diagrams and set-based logic', 2],
        ],
      ),
      topic(
        'Data Interpretation & full GA PYQ sweep',
        'Charts and tables, then the entire all-branch GA back-catalogue. Consolidated in W22.',
        [
          ['Tables, bar charts, pie charts, line graphs and combined-chart interpretation', 3],
          [
            'W22 consolidation — full General Aptitude PYQ sweep across all-branch GATE papers, 2010–2026',
            5,
          ],
        ],
      ),
    ],
  ),
];

/** Sum of first-pass (Phase-1) learning hours across all 12 subjects. */
export const GATE_SUBJECT_HOURS = GATE_SUBJECTS.reduce((s, p) => s + p.hours, 0);

/**
 * Fail loudly if the GATE hours are inconsistent. Called at seed time.
 */
export function verifyGateHours(subjects: readonly Phase[] = GATE_SUBJECTS): void {
  const errors: string[] = [];

  for (const s of subjects) {
    for (const t of s.topics) {
      const subSum = t.subtopics.reduce((a, x) => a + x.hours, 0);
      if (Math.abs(subSum - t.hours) > 0.001) {
        errors.push(
          `${s.title} → ${t.name}: subtopic hours sum to ${subSum}, declared ${t.hours}.`,
        );
      }
    }
    const topicSum = s.topics.reduce((a, t) => a + t.hours, 0);
    if (Math.abs(topicSum - s.hours) > 0.001) {
      errors.push(
        `Subject ${s.id} (${s.title}): topic hours sum to ${topicSum}, declared ${s.hours}.`,
      );
    }
  }

  if (subjects.length !== 12) {
    errors.push(`Expected 12 GATE subjects, found ${subjects.length}.`);
  }

  if (errors.length > 0) {
    throw new Error(`GATE seed hour verification FAILED:\n - ${errors.join('\n - ')}`);
  }
}
