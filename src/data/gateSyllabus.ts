/**
 * GATE 2027 — Computer Science and Information Technology: the full syllabus,
 * broken down to individual concepts.
 *
 * The `official` strings are the verbatim text of the syllabus released by
 * IIT Madras (organising institute for GATE 2027):
 *   https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CS_GATE2027_Syllabus.pdf
 *   https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/GA_GATE2027_Syllabus.pdf
 *
 * Everything below the official line — the chapters and the concept lists — is
 * the standard expansion of those lines using the reference texts the paper is
 * actually set from (Rosen, Kenneth H. for discrete maths; Cormen for
 * algorithms; Galvin for OS; Korth/Navathe for DBMS; Hopcroft & Ullman for TOC;
 * Aho et al. for compilers; Kurose/Tanenbaum for networks; Morris Mano and
 * Hamacher/Patterson for digital logic and architecture).
 *
 * `isNew` marks a concept the 2027 revision made explicit for the first time —
 * no previous-year question exists, so it has to come from the textbook.
 * `dropped` marks a concept that was in the 2026 syllabus and is NOT in 2027:
 * shown so you can positively confirm you are meant to skip it.
 *
 * This file is reference material. It is never seeded into Firestore and holds
 * no progress state — ticking still happens on the study plan in gateData.ts.
 */

export interface Concept {
  name: string;
  /** One line: what it is, or what actually gets asked. */
  gloss: string;
  /** Made explicit in the 2027 revision — no PYQ exists. */
  isNew?: boolean;
  /** Present in 2026, removed for 2027 — do not study. */
  dropped?: boolean;
}

export interface Chapter {
  name: string;
  /** The official syllabus fragment this chapter expands. */
  official: string;
  concepts: Concept[];
}

export interface SyllabusUnit {
  /** Matches the unit id on the GATE track in gateData.ts. */
  unitId: number;
  /** 'Section 1: Engineering Mathematics' — the official section heading. */
  section: string;
  title: string;
  /** The verbatim official paragraph for this subject. */
  official: string;
  chapters: Chapter[];
}

type ConceptSpec = [name: string, gloss: string, flag?: 'new' | 'dropped'];

function ch(name: string, official: string, concepts: ConceptSpec[]): Chapter {
  return {
    name,
    official,
    concepts: concepts.map(([n, g, flag]) => ({
      name: n,
      gloss: g,
      ...(flag === 'new' ? { isNew: true } : {}),
      ...(flag === 'dropped' ? { dropped: true } : {}),
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────

const DISCRETE_OFFICIAL =
  'Discrete Mathematics: Propositional and first order logic. Sets, relations, functions, partial orders and lattices. Monoids, Groups. Graphs: connectivity, matching, colouring. Combinatorics: counting, recurrence relations, generating functions.';

const discreteMathematics: SyllabusUnit = {
  unitId: 0,
  section: 'Section 1: Engineering Mathematics',
  title: 'Discrete Mathematics',
  official: DISCRETE_OFFICIAL,
  chapters: [
    ch('Propositional Logic', 'Propositional and first order logic.', [
      ['Propositions and connectives', '¬ ∧ ∨ → ↔ and the truth table of each; a proposition is a statement with a definite truth value.'],
      ['Truth tables', 'Mechanical evaluation of a formula over all 2ⁿ assignments — the fallback when nothing else works.'],
      ['Tautology, contradiction, contingency', 'True under every assignment / false under every assignment / neither. Most one-mark questions are this classification.'],
      ['Logical equivalences', 'De Morgan, distributive, absorption, double negation — used to simplify a formula before evaluating it.'],
      ['Implication and its relatives', 'p→q ≡ ¬p∨q; converse q→p, inverse ¬p→¬q, contrapositive ¬q→¬p (the only one equivalent to the original).'],
      ['Exportation and related identities', '(p∧q)→r ≡ p→(q→r); appears whenever a nested implication has to be flattened.'],
      ['CNF and DNF', 'Conjunction of clauses / disjunction of terms; canonical forms via minterms and maxterms.'],
      ['Functional completeness', 'A connective set that can express every Boolean function — {¬,∧}, {¬,∨}, {NAND}, {NOR}.'],
      ['Rules of inference', 'Modus ponens, modus tollens, hypothetical and disjunctive syllogism, resolution, addition, simplification.'],
      ['Validity of an argument', 'Premises ∧ ¬conclusion unsatisfiable. Test by truth table or by deriving the conclusion.'],
      ['Satisfiability', 'At least one assignment makes it true; distinguish carefully from validity.'],
      ['Resolution', 'Refutation: convert to CNF, resolve complementary literals, derive the empty clause.'],
    ]),

    ch('First-Order Logic', 'Propositional and first order logic.', [
      ['Predicates and domains', 'P(x) has no truth value until x is bound and the domain is fixed — the domain changes the answer.'],
      ['Universal and existential quantifiers', '∀ and ∃; ∀ pairs naturally with →, ∃ with ∧ — swapping them is the classic mistake.'],
      ['Nested quantifiers', '∀x∃y vs ∃y∀x are different statements; order is the whole question.'],
      ['Negation of quantified statements', '¬∀x P(x) ≡ ∃x ¬P(x); push negation inward, flipping each quantifier.'],
      ['English ↔ FOL translation', 'The single most-tested FOL skill: "every", "some", "only", "no" mapped to the right quantifier and connective.'],
      ['Free and bound variables', 'A formula with a free variable is not a proposition; scope of a quantifier determines binding.'],
      ['Validity and satisfiability in FOL', 'True in every interpretation / true in some interpretation; counter-model construction.'],
      ['Equivalences with quantifiers', 'Distribution of ∀ over ∧ and ∃ over ∨ holds; the other two do not.'],
    ]),

    ch('Sets, Relations and Functions', 'Sets, relations, functions, partial orders and lattices.', [
      ['Set operations', 'Union, intersection, difference, symmetric difference, complement; identities proved by membership tables.'],
      ['Power set', 'P(A) has 2^|A| elements; nested power sets appear in counting questions.'],
      ['Cartesian product', 'Ordered pairs; |A×B| = |A||B| — the basis for counting relations.'],
      ['Cardinality and countability', 'Finite, countably infinite, uncountable; diagonalisation shows ℝ and 2^ℕ are uncountable.'],
      ['Relations and their representations', 'A relation on A is a subset of A×A; represented as a matrix or a digraph.'],
      ['Counting relations', 'Number of relations, reflexive, symmetric, antisymmetric relations on an n-set — a recurring one-mark question.'],
      ['Reflexive, symmetric, antisymmetric, transitive', 'The four properties, and how each shows up in the relation matrix.'],
      ['Closures', 'Reflexive, symmetric and transitive closure; transitive closure by Warshall.'],
      ['Equivalence relations and partitions', 'Reflexive + symmetric + transitive; equivalence classes partition the set and vice versa.'],
      ['Composition of relations', 'R∘S via Boolean matrix product; powers of a relation.'],
      ['Functions: injective, surjective, bijective', 'One-to-one, onto, both; the pigeonhole argument for finite sets.'],
      ['Counting functions', 'Total nᵐ, injective by falling factorial, surjective by inclusion–exclusion — memorise all three.'],
      ['Composition and inverse of functions', 'Associativity of composition; inverse exists exactly when the function is a bijection.'],
    ]),

    ch('Partial Orders and Lattices', 'Sets, relations, functions, partial orders and lattices.', [
      ['Posets', 'Reflexive, antisymmetric, transitive — divisibility and subset inclusion are the standard examples.'],
      ['Hasse diagrams', 'Transitive and reflexive edges removed, direction implied upward; read every question off the diagram.'],
      ['Comparable elements, chains, antichains', 'A chain is totally ordered, an antichain pairwise incomparable; Dilworth links the two.'],
      ['Maximal, minimal, greatest, least', 'Maximal is local, greatest is global and unique when it exists — the distinction is examined directly.'],
      ['Upper and lower bounds, LUB and GLB', 'Join (∨) and meet (∧); their existence is what makes a poset a lattice.'],
      ['Lattices', 'Every pair has a LUB and a GLB; check by finding one failing pair.'],
      ['Bounded, complemented, distributive lattices', 'Bounded has 0 and 1; distributive forbids the two forbidden sublattices M₃ and N₅.'],
      ['Boolean algebra as a lattice', 'Complemented distributive lattice; the subset lattice of an n-set is the canonical example.'],
      ['Total order and well-ordering', 'Every pair comparable; well-ordered means every non-empty subset has a least element.'],
      ['Topological sort', 'Linear extension of a partial order — the same object as the DAG ordering in algorithms.'],
    ]),

    ch('Monoids and Groups', 'Monoids, Groups.', [
      ['Binary operation and closure', 'A map A×A→A; closure failures are the fastest way to reject a candidate structure.'],
      ['Semigroup and monoid', 'Associativity alone / associativity with an identity element.'],
      ['Group axioms', 'Closure, associativity, identity, inverse — check in that order on every candidate.'],
      ['Abelian groups', 'Commutative groups; (ℤₙ,+) is abelian, matrix multiplication generally is not.'],
      ['Order of a group and of an element', 'Group order = number of elements; element order = least k with aᵏ = e.'],
      ['Subgroups', 'A subset closed under the operation and inverses; the one-step subgroup test.'],
      ['Cyclic groups and generators', 'Generated by one element; ℤₙ is cyclic, generators are the units coprime to n.'],
      ["Lagrange's theorem", 'Subgroup order divides group order — settles most "is this a subgroup" questions instantly.'],
      ['Permutation groups', 'Sₙ, cycle notation, composition of permutations, order of a permutation as lcm of cycle lengths.'],
      ['Homomorphism and isomorphism', 'Structure-preserving map; isomorphic groups have identical multiplication tables up to renaming.'],
      ['Rings and fields', 'Two operations; a field needs multiplicative inverses for all non-zero elements. Context for ℤₚ.'],
    ]),

    ch('Graph Theory', 'Graphs: connectivity, matching, colouring.', [
      ['Graph terminology', 'Vertices, edges, order, size, simple vs multigraph, directed vs undirected, loops.'],
      ['Degree and the handshaking lemma', 'Σdeg(v) = 2|E|; the number of odd-degree vertices is even. Half of all graph one-markers use this.'],
      ['Standard graph families', 'Kₙ, Kₘ,ₙ, Cₙ, Pₙ, Wₙ, Qₙ, regular graphs, and their edge counts.'],
      ['Subgraphs and induced subgraphs', 'Induced keeps every edge among the chosen vertices; the distinction matters in clique questions.'],
      ['Walks, paths, cycles', 'Repetition allowed in walks, not in paths; counting walks by powers of the adjacency matrix.'],
      ['Connectivity and components', 'Connected, weakly/strongly connected for digraphs; counting components.'],
      ['Cut vertices and bridges', 'Removal increases the component count; found by DFS low-link values.'],
      ['Vertex and edge connectivity', 'κ(G) ≤ λ(G) ≤ δ(G) — worth memorising as an inequality chain.'],
      ['Trees and their properties', 'Acyclic connected, n−1 edges, unique path between any pair, every edge a bridge.'],
      ['Spanning trees and counting', 'Cayley: n^(n−2) labelled trees on n vertices; Kirchhoff matrix-tree theorem for general graphs.'],
      ['Euler paths and circuits', 'Circuit iff connected and every degree even; path iff exactly two odd vertices.'],
      ['Hamiltonian paths and cycles', 'No simple characterisation — Dirac and Ore give sufficient conditions only.'],
      ["Planarity and Euler's formula", 'v − e + f = 2; corollaries e ≤ 3v−6 and e ≤ 2v−4 for bipartite reject most graphs quickly.'],
      ["Kuratowski's theorem", 'Planar iff no subdivision of K₅ or K₃,₃; K₅ and K₃,₃ are the standard counterexamples.'],
      ['Graph colouring and chromatic number', 'χ(G); χ = 2 iff bipartite iff no odd cycle; χ ≤ Δ+1 by greedy.'],
      ['Chromatic polynomial', 'P(G,k) counts proper k-colourings; deletion–contraction recurrence.'],
      ['Edge colouring and chromatic index', "χ'(G); Vizing bounds it by Δ or Δ+1."],
      ['Matching', 'A set of pairwise non-adjacent edges; maximal vs maximum is a standard trap.'],
      ['Perfect matching', 'Covers every vertex; requires an even order.'],
      ["Hall's theorem", "Bipartite graph has a matching saturating one side iff |N(S)| ≥ |S| for every subset S."],
      ["König's theorem", 'In bipartite graphs, maximum matching = minimum vertex cover.'],
      ['Independent set, vertex cover, clique', 'Complementary quantities: α(G) + β(G) = n; clique in G = independent set in the complement.'],
      ['Graph isomorphism', 'Degree sequence, cycle counts and connectivity as invariants used to prove non-isomorphism.'],
      ['Adjacency and incidence matrices', 'Aᵏ[i][j] counts walks of length k; eigenvalue facts occasionally appear.'],
    ]),

    ch('Combinatorics', 'Combinatorics: counting, recurrence relations, generating functions.', [
      ['Sum and product rules', 'Disjoint choices add, sequential independent choices multiply — every counting problem starts here.'],
      ['Permutations', 'nPr = n!/(n−r)!; circular permutations (n−1)!.'],
      ['Combinations', 'nCr = n!/(r!(n−r)!); Pascal identity and symmetry.'],
      ['Permutations with repetition', 'Multiset permutations n!/(n₁!n₂!…); the "letters of a word" question.'],
      ['Combinations with repetition', 'Stars and bars: C(n+r−1, r) — non-negative integer solutions of x₁+…+xₙ = r.'],
      ['Binomial theorem and identities', 'Expansion, coefficient extraction, Vandermonde, Σ nCr = 2ⁿ.'],
      ['Multinomial theorem', 'Coefficients in (x₁+…+xₖ)ⁿ; distributing distinct objects into distinct boxes.'],
      ['Pigeonhole principle', 'Simple and generalised (⌈n/k⌉); the hard part is choosing the pigeons and the holes.'],
      ['Inclusion–exclusion', 'Alternating sum over intersections; used for surjection counts and "at least one" problems.'],
      ['Derangements', 'Dₙ = n!Σ(−1)ᵏ/k!; the "no one gets their own hat" family.'],
      ['Catalan numbers', 'Cₙ = C(2n,n)/(n+1); balanced parentheses, binary trees, monotonic lattice paths.'],
      ['Linear homogeneous recurrences', 'Solve via the characteristic equation; roots give the general solution.'],
      ['Repeated characteristic roots', 'A root of multiplicity m contributes (A + Bn + … )rⁿ.'],
      ['Non-homogeneous recurrences', 'Particular solution by trial form matching the forcing term, plus the homogeneous solution.'],
      ['Substitution and iteration', 'Unroll the recurrence and spot the pattern — fastest route for algorithm recurrences.'],
      ['Generating functions', 'Encode a sequence as coefficients of a power series; standard closed forms for 1/(1−x) and friends.'],
      ['Solving recurrences with generating functions', 'Turn the recurrence into an algebraic equation, solve, then extract coefficients by partial fractions.'],
    ]),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

const digitalLogic: SyllabusUnit = {
  unitId: 1,
  section: 'Section 2: Digital Logic',
  title: 'Digital Logic',
  official:
    'Boolean algebra and minimization – algebraic technique, Karnaugh map, tabular method. Design of combinational and sequential circuits. Number representation and arithmetic (fixed and floating point).',
  chapters: [
    ch('Boolean Algebra', 'Boolean algebra and minimization – algebraic technique, Karnaugh map, tabular method.', [
      ['Boolean postulates and theorems', 'Identity, complement, idempotence, absorption, consensus; De Morgan in both directions.'],
      ['Logic gates', 'AND, OR, NOT, NAND, NOR, XOR, XNOR and their truth tables and symbols.'],
      ['Universal gates', 'Any function built from NAND alone or NOR alone; gate-count conversion questions.'],
      ['Canonical SOP and POS', 'Minterms and maxterms, Σm and ΠM notation, converting between the two forms.'],
      ['Algebraic minimisation', 'Repeated application of the theorems; the technique the syllabus names first.'],
      ['Duality and complementation', 'Dual swaps ∧/∨ and 0/1; complement additionally negates each literal.'],
      ['XOR algebra', 'Associativity, parity interpretation, and XOR as a controlled inverter.'],
      ['Positive and negative logic', 'The same circuit reads as a different function under the opposite convention.'],
    ]),

    ch('Minimisation', 'Boolean algebra and minimization – algebraic technique, Karnaugh map, tabular method.', [
      ['Karnaugh maps, 2 to 4 variables', 'Gray-coded adjacency; group the largest power-of-two blocks of 1s.'],
      ['Five-variable K-maps', 'Two overlaid 4-variable maps; adjacency across the two halves is the usual mistake.'],
      ['Prime and essential prime implicants', 'A prime implicant cannot be enlarged; an essential one is the only cover of some minterm — counted directly in questions.'],
      ["Don't-care conditions", 'Use X to enlarge groups; a different minimal expression per choice, all equally valid.'],
      ['Minimal SOP and POS from a K-map', 'Group 1s for SOP, group 0s and complement for POS.'],
      ['Quine–McCluskey tabular method', 'Systematic prime-implicant generation by combining terms differing in one bit — named explicitly in the 2027 syllabus.', 'new'],
      ['Petrick’s method / prime implicant chart', 'Selecting a minimum cover once essential implicants are removed.', 'new'],
      ['Cost of a minimised expression', 'Literal count and gate-input count as the objective being minimised.'],
    ]),

    ch('Combinational Circuits', 'Design of combinational and sequential circuits.', [
      ['Multiplexers', 'n select lines choose one of 2ⁿ inputs; implementing an arbitrary function on a MUX is a standard question.'],
      ['Demultiplexers and decoders', 'One input routed to one of 2ⁿ outputs; decoder plus OR gates realises any SOP.'],
      ['Encoders and priority encoders', 'Reverse of a decoder; priority resolves multiple simultaneous inputs.'],
      ['Code converters', 'Binary ↔ Gray, BCD ↔ binary, excess-3; Gray code has exactly one bit change per step.'],
      ['Half and full adders', 'Sum = XOR, carry = AND / majority; full adder from two half adders.'],
      ['Ripple-carry adder', 'Delay grows linearly with width — the baseline everything else is compared against.'],
      ['Carry-lookahead adder', 'Generate and propagate terms give logarithmic-depth carry; delay computations are examined.'],
      ['Subtractors and 2’s complement arithmetic', 'Subtraction as addition of the complement; the adder/subtractor with a mode bit.'],
      ['Magnitude comparators', 'Cascadable equality and greater-than logic.'],
      ['Parity generators and checkers', 'Even/odd parity via XOR trees.'],
      ['Hazards', 'Static and dynamic hazards from unequal path delays; removed by adding a redundant consensus term.'],
      ['PLA, PAL and ROM as logic', 'Programmable arrays; sizing a ROM to implement a given truth table.'],
    ]),

    ch('Sequential Circuits', 'Design of combinational and sequential circuits.', [
      ['Latches', 'SR and D latches, level-triggered; the forbidden SR input combination.'],
      ['Flip-flops', 'SR, JK, D, T, edge-triggered; characteristic equations for each.'],
      ['Excitation tables', 'Required inputs to force a desired state transition — the design direction of the characteristic table.'],
      ['Flip-flop conversion', 'Realising one flip-flop type using another plus combinational logic.'],
      ['Setup and hold time, clock skew', 'Timing constraints that set the maximum clock frequency.'],
      ['Registers and shift registers', 'SISO, SIPO, PISO, PIPO; universal shift register.'],
      ['Ring and Johnson counters', 'Sequence lengths n and 2n respectively; state diagrams asked directly.'],
      ['Asynchronous (ripple) counters', 'Cascaded toggle flip-flops; cumulative propagation delay.'],
      ['Synchronous counters', 'All flip-flops share a clock; design from a state table via excitation tables.'],
      ['Modulo-n counter design', 'Truncating a counter by decoding the reset state.'],
      ['Finite state machines: Mealy and Moore', 'Output on transition vs on state; converting between the two.'],
      ['State table, state diagram, state assignment', 'The standard sequential-design flow.'],
      ['State minimisation', 'Merging equivalent states by the implication table.'],
    ]),

    ch('Number Representation and Arithmetic', 'Number representation and arithmetic (fixed and floating point).', [
      ['Number systems and base conversion', 'Binary, octal, decimal, hexadecimal; fractional conversions both ways.'],
      ["r's and (r−1)'s complement", "2's and 1's complement in binary; the general rule for any radix."],
      ['Signed number representations', 'Sign-magnitude, 1’s complement, 2’s complement; ranges and the two zeros problem.'],
      ['Overflow detection', 'Carry into vs carry out of the sign bit; only meaningful for signed arithmetic.'],
      ['Fixed-point representation', 'Implied binary point, range vs precision tradeoff.'],
      ['IEEE-754 single precision', '1 + 8 + 23 bits, bias 127, implicit leading 1; conversions asked in both directions.'],
      ['IEEE-754 double precision', '1 + 11 + 52 bits, bias 1023.'],
      ['Special values in IEEE-754', 'Zero, denormals, infinity, NaN, and the exponent patterns that encode them.'],
      ['Floating-point arithmetic', 'Alignment, normalisation, rounding modes, and loss of precision.'],
      ['BCD arithmetic', 'Packed BCD addition with the +6 correction.'],
    ]),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

const programmingDataStructures: SyllabusUnit = {
  unitId: 2,
  section: 'Section 4: Programming and Data Structures',
  title: 'Programming and Data Structures',
  official:
    'Programming in C. Recursion. Arrays, stacks, queues, linked lists, trees, binary search trees, binary heaps, graphs.',
  chapters: [
    ch('Programming in C', 'Programming in C.', [
      ['Data types, qualifiers and sizes', 'int, char, float, double, signed/unsigned; integer promotion and implicit conversion.'],
      ['Operators and precedence', 'Precedence and associativity, especially of ++, --, *, & and the comma operator.'],
      ['Sequence points and undefined behaviour', 'i = i++ + ++i style expressions are undefined — GATE asks you to recognise that.'],
      ['Control flow', 'if/else, switch fall-through, for, while, do-while, break, continue, goto.'],
      ['Functions, scope and lifetime', 'Block vs file scope, automatic vs static lifetime, declaration vs definition.'],
      ['Storage classes', 'auto, register, static, extern and what each changes about linkage and lifetime.'],
      ['Parameter passing', 'C is call-by-value throughout; call-by-reference is simulated with pointers.'],
      ['Pointers and pointer arithmetic', 'Scaling by the pointee size; pointer difference and comparison.'],
      ['Arrays versus pointers', 'Array decay to a pointer, and where the two are genuinely different (sizeof, &).'],
      ['Multidimensional arrays', 'Row-major layout; address calculation for a[i][j] is a recurring numerical question.'],
      ['Arrays of pointers and pointers to arrays', 'int *a[n] vs int (*a)[n] — read the declaration by the spiral rule.'],
      ['Strings', 'Null termination, the standard string functions, and off-by-one errors around the terminator.'],
      ['Structures and unions', 'Member layout, padding and alignment; a union shares one block of storage.'],
      ['Dynamic memory allocation', 'malloc, calloc, realloc, free; leaks, dangling pointers and double free.'],
      ['Function pointers', 'Declaration syntax, use in dispatch tables and as comparator arguments.'],
      ['Command-line arguments and I/O', 'argc/argv; printf and scanf format specifiers and their return values.'],
    ]),

    ch('Recursion', 'Recursion.', [
      ['Recursive definition and base case', 'Every recursion needs a terminating case; missing it is the intended bug in code questions.'],
      ['Tracing recursive code', 'Dry-run on paper with an explicit stack — the single most examined PDS skill.'],
      ['Recursion trees', 'Counting the number of calls and the total work per level.'],
      ['Tail recursion', 'The recursive call is the last operation; convertible to a loop.'],
      ['Recursion versus iteration', 'Stack space cost and how the compiler may or may not eliminate it.'],
      ['Mutual and indirect recursion', 'Functions calling each other; trace tables get long but stay mechanical.'],
      ['Backtracking', 'Recursion that undoes choices — n-queens, subset generation, maze search.'],
      ['Recurrences from recursive code', 'Reading T(n) straight off the function body, then solving it.'],
    ]),

    ch('Arrays, Stacks and Queues', 'Arrays, stacks, queues, linked lists, trees, binary search trees, binary heaps, graphs.', [
      ['Array representation and addressing', 'Base address plus index times element size; row-major and column-major formulas.'],
      ['Stack operations and complexity', 'push, pop, peek, all O(1); overflow and underflow conditions.'],
      ['Stack applications', 'Expression evaluation, parenthesis matching, function-call stack, undo.'],
      ['Infix, prefix and postfix', 'Conversion by the shunting-yard algorithm, and evaluation of each form.'],
      ['Queue operations', 'enqueue and dequeue; the naive array queue wastes space.'],
      ['Circular queues', 'Wrap-around with modulo; the full-versus-empty ambiguity and its two standard fixes.'],
      ['Deques', 'Insertion and deletion at both ends; input- and output-restricted variants.'],
      ['Priority queues', 'Ordering by priority rather than arrival; usually implemented as a heap.'],
      ['Stack and queue from one another', 'Two stacks make a queue and two queues make a stack — amortised cost is the question.'],
    ]),

    ch('Linked Lists', 'Arrays, stacks, queues, linked lists, trees, binary search trees, binary heaps, graphs.', [
      ['Singly linked lists', 'Insert, delete, search and traversal, and the pointer updates each needs.'],
      ['Doubly linked lists', 'Backward links simplify deletion at the cost of an extra pointer per node.'],
      ['Circular linked lists', 'Last node points to the first; termination conditions change accordingly.'],
      ['Header and sentinel nodes', 'Removing the special case for insertion and deletion at the head.'],
      ['List reversal', 'Iterative three-pointer reversal and the recursive version — asked in code form repeatedly.'],
      ['Cycle detection', "Floyd's tortoise and hare; finding the cycle start after the meeting point."],
      ['Array versus linked list', 'Random access and cache behaviour against insertion cost and memory overhead.'],
    ]),

    ch('Trees and Binary Search Trees', 'trees, binary search trees', [
      ['Tree terminology', 'Root, parent, child, leaf, height, depth, level, degree — definitions differ by one, so fix a convention.'],
      ['Binary tree properties', 'Maximum and minimum nodes at a height, number of leaves versus internal nodes.'],
      ['Full, complete and perfect binary trees', 'Precise definitions; complete trees are what heaps use.'],
      ['Array and linked representation', 'Children of index i at 2i+1 and 2i+2 in the array form.'],
      ['Traversals', 'Preorder, inorder, postorder and level order, both recursive and iterative.'],
      ['Reconstruction from traversals', 'Inorder plus one of preorder/postorder determines the tree; preorder plus postorder does not.'],
      ['Threaded binary trees', 'Null pointers reused as inorder successor links for stackless traversal.'],
      ['Expression trees', 'Operators internal, operands at leaves; traversal order gives the three notations.'],
      ['Binary search tree operations', 'Search, insert and delete; delete with two children uses the inorder successor.'],
      ['BST complexity', 'O(h): O(log n) balanced, O(n) degenerate — the reason balancing exists.'],
      ['AVL trees', 'Balance factor in {−1,0,1}; LL, RR, LR, RL rotations restore it.'],
      ['B-trees and B+ trees', 'High fanout, all leaves at the same level; B+ keeps data only in leaves and links them.'],
      ['Counting binary trees', 'Catalan number of shapes on n nodes; number of BSTs on n distinct keys.'],
    ]),

    ch('Binary Heaps', 'binary heaps', [
      ['Heap property', 'Min-heap or max-heap ordering between parent and child, with no ordering between siblings.'],
      ['Array representation of a heap', 'A complete binary tree stored contiguously; parent at ⌊(i−1)/2⌋.'],
      ['Heapify', 'Sift-down in O(log n); the building block for everything else.'],
      ['Build-heap', 'Bottom-up in O(n) — not O(n log n); the proof is examined.'],
      ['Insert and extract-min/max', 'Sift-up and sift-down, both O(log n).'],
      ['Heapsort', 'In-place, O(n log n) worst case, not stable.'],
      ['Priority queue via heap', 'Decrease-key and its role inside Dijkstra and Prim.'],
      ['k-th largest element', 'Heap of size k in O(n log k) — a standard application question.'],
    ]),

    ch('Graphs (representation)', 'graphs', [
      ['Adjacency matrix', 'O(V²) space, O(1) edge lookup; best for dense graphs.'],
      ['Adjacency list', 'O(V+E) space; the representation every traversal bound assumes.'],
      ['Incidence matrix and edge list', 'Alternative representations and their space costs.'],
      ['Breadth-first search', 'Queue-based, O(V+E), gives shortest paths in an unweighted graph.'],
      ['Depth-first search', 'Stack or recursion; discovery and finish times drive most DFS applications.'],
      ['Edge classification in DFS', 'Tree, back, forward and cross edges; a back edge means a cycle.'],
      ['Connected and strongly connected components', 'DFS forests; Kosaraju and Tarjan for the directed case.'],
      ['Topological sort', 'DFS finish order reversed, or Kahn’s in-degree algorithm; DAGs only.'],
    ]),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

const algorithms: SyllabusUnit = {
  unitId: 3,
  section: 'Section 5: Algorithms',
  title: 'Algorithms',
  official:
    'Searching, sorting, hashing. Asymptotic worst case time and space complexity. Algorithm design techniques: greedy, dynamic programming and divide‐and‐conquer. Graph traversals, minimum spanning trees, shortest paths.',
  chapters: [
    ch('Asymptotic Analysis', 'Asymptotic worst case time and space complexity.', [
      ['Big-O, Omega and Theta', 'Upper, lower and tight bounds; the formal definitions are asked directly.'],
      ['Little-o and little-omega', 'Strict bounds; o(f) is a proper subset of O(f).'],
      ['Comparing growth rates', 'Ordering log n, n, n log n, n², 2ⁿ, n! and mixed expressions.'],
      ['Best, average and worst case', 'Different questions; the syllabus names worst case specifically.'],
      ['Space complexity', 'Auxiliary space versus total space; in-place means O(1) auxiliary.'],
      ['Recurrence solving by substitution', 'Guess and prove by induction.'],
      ['Recursion tree method', 'Sum the work level by level; useful when the master theorem does not apply.'],
      ['Master theorem', 'T(n) = aT(n/b) + f(n); the three cases and the regularity condition.'],
      ['Amortised analysis', 'Aggregate, accounting and potential methods; dynamic array doubling is the standard example.'],
    ]),

    ch('Searching', 'Searching, sorting, hashing.', [
      ['Linear search', 'O(n); the baseline, and optimal on unsorted data.'],
      ['Binary search', 'O(log n) on sorted data; the exact comparison count and the mid-overflow bug.'],
      ['Binary search variants', 'First and last occurrence, lower and upper bound, search in a rotated array.'],
      ['Ternary and interpolation search', 'Alternative divisions; interpolation is O(log log n) on uniform data.'],
      ['Search in a matrix', 'Staircase search in a row- and column-sorted matrix, O(m+n).'],
      ['Selection: k-th smallest', 'Quickselect averages O(n); median-of-medians makes it worst-case O(n).'],
    ]),

    ch('Sorting', 'Searching, sorting, hashing.', [
      ['Bubble, selection and insertion sort', 'O(n²); their exact comparison and swap counts on a given array are examined.'],
      ['Insertion sort on nearly sorted input', 'O(n + inversions) — the reason it is used as the base case elsewhere.'],
      ['Merge sort', 'O(n log n) always, stable, O(n) extra space; the merge step counts inversions.'],
      ['Quick sort', 'O(n log n) average, O(n²) worst; partition schemes and pivot choice.'],
      ['Randomised quicksort', 'Expected O(n log n) regardless of input order.'],
      ['Heap sort', 'O(n log n) worst case, in place, not stable.'],
      ['Counting sort', 'O(n+k), stable, needs a bounded integer key range.'],
      ['Radix sort', 'O(d(n+k)) using a stable digit sort; LSD versus MSD.'],
      ['Bucket sort', 'Linear expected time on uniformly distributed input.'],
      ['Stability', 'Preserving the relative order of equal keys; which algorithms have it and which do not.'],
      ['Lower bound for comparison sorting', 'Ω(n log n) by the decision-tree argument.'],
      ['External sorting', 'Multiway merge when the data does not fit in memory.'],
    ]),

    ch('Hashing', 'Searching, sorting, hashing.', [
      ['Hash functions', 'Division, multiplication and universal hashing; what makes a function good.'],
      ['Load factor', 'α = n/m; every expected-cost formula is stated in terms of it.'],
      ['Separate chaining', 'Collisions in a list per slot; expected search cost 1 + α.'],
      ['Linear probing', 'Open addressing with step 1; primary clustering and its cost.'],
      ['Quadratic probing', 'Reduces primary clustering, introduces secondary clustering; table-size conditions for full coverage.'],
      ['Double hashing', 'Probe step from a second hash; the closest practical approach to uniform hashing.'],
      ['Deletion in open addressing', 'Tombstones — a plain delete breaks subsequent probe sequences.'],
      ['Rehashing', 'Growing the table and re-inserting; amortised cost of the growth.'],
      ['Expected probe counts', 'Successful and unsuccessful search formulas for chaining and open addressing.'],
    ]),

    ch('Divide and Conquer', 'Algorithm design techniques: greedy, dynamic programming and divide‐and‐conquer.', [
      ['The divide-and-conquer pattern', 'Divide, conquer, combine; the recurrence follows directly from the split.'],
      ['Merge sort and quick sort as D&C', 'Where the work sits: merge does it in combine, quicksort in divide.'],
      ['Binary search as D&C', 'One subproblem only, so T(n) = T(n/2) + O(1).'],
      ['Maximum subarray by D&C', 'O(n log n); contrasted against Kadane’s O(n) dynamic-programming version.'],
      ['Karatsuba multiplication', 'Three multiplications instead of four gives O(n^1.585).'],
      ['Strassen matrix multiplication', 'Seven multiplications gives O(n^2.81); a classic master-theorem exercise.'],
      ['Closest pair of points', 'O(n log n) by splitting on x and checking a narrow strip.'],
      ['Counting inversions', 'Merge sort augmented with a counter, O(n log n).'],
    ]),

    ch('Greedy Algorithms', 'Algorithm design techniques: greedy, dynamic programming and divide‐and‐conquer.', [
      ['Greedy-choice property and optimal substructure', 'The two conditions that must hold before greedy is correct.'],
      ['Activity selection', 'Sort by finishing time; the exchange-argument proof is the template.'],
      ['Fractional knapsack', 'Sort by value density; the fractional relaxation is what makes greedy work.'],
      ['Huffman coding', 'Build the tree by repeatedly merging the two smallest frequencies; average code length computations.'],
      ['Job sequencing with deadlines', 'Sort by profit and place each job as late as possible.'],
      ['Coin change by greedy', 'Correct for canonical systems only; the standard counterexample is asked.'],
      ['Greedy versus dynamic programming', 'Where greedy fails — 0/1 knapsack being the canonical case.'],
    ]),

    ch('Dynamic Programming', 'Algorithm design techniques: greedy, dynamic programming and divide‐and‐conquer.', [
      ['Overlapping subproblems and optimal substructure', 'The two conditions that make DP applicable.'],
      ['Memoisation versus tabulation', 'Top-down with a cache versus bottom-up filling; same complexity, different constants.'],
      ['0/1 knapsack', 'O(nW) table; the pseudo-polynomial caveat.'],
      ['Longest common subsequence', 'O(mn) table and traceback for the actual subsequence.'],
      ['Edit distance', 'Insert, delete, replace costs; the standard O(mn) recurrence.'],
      ['Matrix chain multiplication', 'O(n³) interval DP; the parenthesisation is asked as often as the cost.'],
      ['Longest increasing subsequence', 'O(n²) DP and the O(n log n) patience-sorting version.'],
      ['Rod cutting and coin change', 'Unbounded knapsack variants; counting ways versus minimising coins.'],
      ['Subset sum and partition', 'Boolean DP over achievable sums.'],
      ['Floyd–Warshall as DP', 'All-pairs shortest paths in O(V³) by allowing one more intermediate vertex per round.'],
      ['Bellman–Ford as DP', 'Relax every edge V−1 times; detects negative cycles on the extra pass.'],
      ['Optimal BST', 'Interval DP minimising expected search cost.'],
    ]),

    ch('Graph Algorithms', 'Graph traversals, minimum spanning trees, shortest paths.', [
      ['BFS and DFS', 'O(V+E) with adjacency lists; BFS layers give unweighted shortest paths.'],
      ['Applications of traversal', 'Connectivity, cycle detection, bipartiteness check, topological order.'],
      ["Kruskal's algorithm", 'Sort edges, union-find to reject cycles; O(E log E).'],
      ["Prim's algorithm", 'Grow one tree with a priority queue; O(E log V) with a binary heap.'],
      ['MST properties', 'Cut property, cycle property, uniqueness when all weights are distinct.'],
      ['Union-find', 'Union by rank plus path compression gives near-constant amortised cost.'],
      ["Dijkstra's algorithm", 'Non-negative weights only; O((V+E) log V) with a heap.'],
      ['Bellman–Ford', 'Handles negative weights, detects negative cycles, O(VE).'],
      ['Floyd–Warshall', 'All pairs, O(V³), works with negative edges but not negative cycles.'],
      ['Shortest paths in a DAG', 'Relax in topological order, O(V+E); also solves longest path in a DAG.'],
      ['Single-source versus all-pairs', 'Choosing the algorithm from the graph’s density and weight signs.'],
    ]),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

const engineeringMathematics: SyllabusUnit = {
  unitId: 4,
  section: 'Section 1: Engineering Mathematics',
  title: 'Engineering Mathematics',
  official:
    'Linear Algebra: Matrices, determinants, system of linear equations, eigenvalues and eigenvectors, LU decomposition. Calculus: Limits, continuity and differentiability, Maxima and minima, Mean value theorem, Integration. Probability and Statistics: Random variables, Uniform, normal, exponential, Poisson and binomial distributions. Mean, median, mode and standard deviation. Conditional probability and Bayes theorem.',
  chapters: [
    ch('Linear Algebra: Matrices and Determinants', 'Linear Algebra: Matrices, determinants, system of linear equations, eigenvalues and eigenvectors, LU decomposition.', [
      ['Matrix types and operations', 'Symmetric, skew-symmetric, orthogonal, idempotent, nilpotent, triangular and their defining identities.'],
      ['Matrix multiplication properties', 'Associative and distributive but not commutative; (AB)ᵀ = BᵀAᵀ.'],
      ['Determinant and its properties', 'Row operations, expansion by cofactors, det(AB) = det(A)det(B), det(Aᵀ) = det(A).'],
      ['Inverse of a matrix', 'Exists iff the determinant is non-zero; adjoint formula and Gauss–Jordan.'],
      ['Rank of a matrix', 'Order of the largest non-zero minor, or the number of pivots after row reduction.'],
      ['Trace', 'Sum of the diagonal, equal to the sum of the eigenvalues.'],
      ['Elementary row operations and echelon form', 'The mechanism behind rank, inverse and solving systems.'],
    ]),

    ch('Systems of Linear Equations', 'system of linear equations', [
      ['Consistency conditions', 'Compare rank(A) with rank([A|b]) and with n to classify the solution set.'],
      ['Unique, infinite and no solution', 'The three outcomes and exactly which rank condition produces each.'],
      ['Homogeneous systems', 'Always consistent; non-trivial solutions iff rank < n.'],
      ['Gaussian elimination', 'Forward elimination and back substitution; partial pivoting.'],
      ['Gauss–Jordan elimination', 'Reduction all the way to reduced row echelon form.'],
      ['Number of free variables', 'n − rank; determines the dimension of the solution space.'],
      ['LU decomposition', 'A = LU by Doolittle or Crout; used to solve repeated systems with the same A.'],
      ['Existence of LU and pivoting', 'LU without row exchanges needs non-zero leading principal minors; otherwise PA = LU.'],
    ]),

    ch('Eigenvalues and Eigenvectors', 'eigenvalues and eigenvectors', [
      ['Characteristic equation', 'det(A − λI) = 0; for 3×3 this is the bulk of the arithmetic.'],
      ['Eigenvalues and their properties', 'Sum equals the trace, product equals the determinant — the fastest check available.'],
      ['Eigenvectors and eigenspaces', 'Null space of (A − λI); geometric multiplicity is its dimension.'],
      ['Algebraic versus geometric multiplicity', 'Geometric ≤ algebraic; equality for all eigenvalues means diagonalisable.'],
      ['Diagonalisation', 'A = PDP⁻¹ when there are n independent eigenvectors.'],
      ['Eigenvalues of special matrices', 'Triangular matrices give the diagonal; symmetric matrices give real eigenvalues.'],
      ['Cayley–Hamilton theorem', 'A matrix satisfies its own characteristic equation; used to compute inverses and powers.'],
      ['Eigenvalues of transformed matrices', 'Those of A^k, A⁻¹, A + cI derived from those of A.'],
    ]),

    ch('Calculus', 'Calculus: Limits, continuity and differentiability, Maxima and minima, Mean value theorem, Integration.', [
      ['Limits', 'Left and right limits, standard limits, and the indeterminate forms.'],
      ["L'Hôpital's rule", 'For 0/0 and ∞/∞ after confirming the form.'],
      ['Continuity', 'Limit exists and equals the value; removable, jump and infinite discontinuities.'],
      ['Differentiability', 'Differentiable implies continuous, never the reverse; |x| at 0 is the standard counterexample.'],
      ['Rules of differentiation', 'Product, quotient, chain rule, implicit and parametric differentiation.'],
      ['Maxima and minima', 'First and second derivative tests; critical points and endpoints on a closed interval.'],
      ["Rolle's theorem", 'Equal endpoint values force a stationary point in between.'],
      ['Mean value theorem', 'Some interior point has the average slope; Cauchy’s generalisation.'],
      ['Taylor and Maclaurin series', 'Polynomial approximation and the remainder term.'],
      ['Definite and indefinite integration', 'Substitution, by parts, partial fractions.'],
      ['Fundamental theorem of calculus', 'Differentiation and integration as inverse operations; differentiating an integral with variable limits.'],
      ['Properties of definite integrals', 'Symmetry, additivity and the periodic-function shortcuts.'],
      ['Improper integrals', 'Infinite limits or unbounded integrands, and their convergence.'],
      ['Area under a curve', 'The geometric reading that most application questions want.'],
    ]),

    ch('Probability', 'Probability and Statistics: … Conditional probability and Bayes theorem.', [
      ['Sample space and events', 'Mutually exclusive, exhaustive and independent events; the axioms.'],
      ['Addition and multiplication rules', 'P(A∪B) = P(A)+P(B)−P(A∩B); independence gives P(A∩B) = P(A)P(B).'],
      ['Conditional probability', 'P(A|B) = P(A∩B)/P(B); tree diagrams make almost every such question mechanical.'],
      ['Law of total probability', 'Partition the sample space and sum the weighted conditionals.'],
      ["Bayes' theorem", 'Reverse the conditioning; the false-positive medical-test problem is the archetype.'],
      ['Independence versus mutual exclusivity', 'Two distinct ideas that are routinely confused in options.'],
    ]),

    ch('Random Variables and Distributions', 'Random variables, Uniform, normal, exponential, Poisson and binomial distributions.', [
      ['Discrete and continuous random variables', 'PMF versus PDF, and the CDF that unifies both.'],
      ['Expectation', 'E[X] = ΣxP(x) or ∫xf(x)dx; linearity holds regardless of independence and saves enormous work.'],
      ['Variance and standard deviation', 'Var(X) = E[X²] − (E[X])²; Var(aX+b) = a²Var(X).'],
      ['Uniform distribution', 'Discrete and continuous; mean (a+b)/2, variance (b−a)²/12.'],
      ['Binomial distribution', 'n independent Bernoulli trials; mean np, variance np(1−p).'],
      ['Poisson distribution', 'Rare events at rate λ; mean = variance = λ; the binomial limit.'],
      ['Exponential distribution', 'Waiting time at rate λ; mean 1/λ and the memoryless property.'],
      ['Normal distribution', 'Bell curve, standardisation to Z, and the empirical 68-95-99.7 rule.'],
      ['Joint and marginal distributions', 'Independence, covariance, and E[XY] under independence.'],
    ]),

    ch('Statistics', 'Mean, median, mode and standard deviation.', [
      ['Mean, median, mode', 'Their definitions, and which one a skewed distribution moves.'],
      ['Standard deviation and variance', 'Population versus sample divisor, and what each measures.'],
      ['Effect of transformations', 'Adding a constant shifts the mean and leaves the spread; scaling changes both.'],
      ['Grouped data', 'Computing the summary statistics from a frequency table.'],
      ['Correlation and covariance', 'Direction and strength of a linear relationship; correlation is scale-free.'],
    ]),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

const computerOrganisation: SyllabusUnit = {
  unitId: 5,
  section: 'Section 3: Computer Organization and Architecture',
  title: 'Computer Organisation and Architecture',
  official:
    'Instruction set and addressing modes. Design of arithmetic and logic unit (ALU). Design of control unit – hardwired and microprogrammed. Memory interfacing and hierarchy: performance, cache memory mapping. I/O interface (interrupt and DMA). Instruction pipelining, pipeline hazards.',
  chapters: [
    ch('Instruction Set and Addressing Modes', 'Instruction set and addressing modes.', [
      ['Instruction formats', 'Zero, one, two and three address machines; encoding fields and instruction length.'],
      ['Instruction cycle', 'Fetch, decode, execute, memory, write-back and the registers each stage touches.'],
      ['Addressing modes', 'Immediate, direct, indirect, register, register-indirect, indexed, base-relative, auto-increment/decrement.'],
      ['Effective address calculation', 'Numerical questions asking for the operand after applying a mode.'],
      ['RISC versus CISC', 'Instruction regularity, cycle counts and the effect on pipelining.'],
      ['Register organisation', 'General purpose, accumulator, stack machines and their instruction counts for one expression.'],
      ['Machine code and assembly', 'Reading a short listing and tracing register contents.'],
    ]),

    ch('Arithmetic and Logic Unit', 'Design of arithmetic and logic unit (ALU).', [
      ['ALU structure', 'Function-select lines choosing between arithmetic and logic operations.'],
      ['Fast adders inside the ALU', 'Carry-lookahead and carry-select and their delay expressions.'],
      ['Booth multiplication', 'Encoding runs of ones to halve the number of additions; the recoding table.'],
      ['Array and sequential multipliers', 'Hardware cost against cycle count.'],
      ['Restoring and non-restoring division', 'Step-by-step register traces are a standard numerical question.'],
      ['Floating-point unit operations', 'Alignment, normalisation, guard bits and rounding.'],
      ['Status flags', 'Zero, carry, sign and overflow, and which instruction sets each.'],
    ]),

    ch('Control Unit', 'Design of control unit – hardwired and microprogrammed.', [
      ['Data path and control signals', 'The signal set needed to drive one instruction through the data path.'],
      ['Hardwired control', 'Control signals from combinational logic and a state counter; fast but inflexible.', 'new'],
      ['Microprogrammed control', 'Control signals read from a control store as microinstructions; slower but modifiable.', 'new'],
      ['Horizontal versus vertical microinstructions', 'Wide unencoded fields against narrow encoded ones; width and decode-time tradeoff.', 'new'],
      ['Microinstruction sequencing', 'Next-address generation, branching within the microprogram.', 'new'],
      ['Control store sizing', 'Computing the width and number of words for a given signal set.', 'new'],
    ]),

    ch('Memory Hierarchy and Cache', 'Memory interfacing and hierarchy: performance, cache memory mapping.', [
      ['Memory hierarchy', 'Registers, cache, main memory, disk; the cost-speed-capacity tradeoff.'],
      ['Memory interfacing', 'Address decoding, chip select, and building a required capacity from given chips.', 'new'],
      ['Locality of reference', 'Temporal and spatial locality — the reason caches work at all.'],
      ['Direct-mapped cache', 'One possible line per block; tag, index and offset field widths.'],
      ['Fully associative cache', 'Any line, tag comparison against every entry.'],
      ['Set-associative cache', 'k lines per set; the field-width calculation is the single most examined COA numerical.'],
      ['Replacement policies', 'LRU, FIFO, random; hit counts for a given reference string.'],
      ['Write policies', 'Write-through versus write-back, write-allocate versus no-write-allocate, dirty bits.'],
      ['Hit ratio and average memory access time', 'AMAT = hit time + miss rate × miss penalty, applied level by level.'],
      ['Multi-level caches', 'Local versus global miss rate and the combined AMAT.'],
      ['Cache coherence', 'Why multiple caches of the same block need a protocol.'],
      ['Main and secondary storage', 'Explicitly dropped from the 2027 syllabus — do not spend time on disk scheduling here.', 'dropped'],
    ]),

    ch('I/O Interface', 'I/O interface (interrupt and DMA).', [
      ['Programmed I/O', 'CPU polls the device; simple and wasteful.'],
      ['Interrupt-driven I/O', 'Device signals the CPU; interrupt service routine and context save.'],
      ['Interrupt types and priority', 'Maskable and non-maskable, vectored interrupts, daisy chaining.'],
      ['Direct memory access', 'Device transfers to memory without the CPU; cycle stealing versus burst mode.'],
      ['DMA controller operation', 'Bus request and grant, and the transfer-time calculations that follow.'],
      ['I/O addressing', 'Memory-mapped versus isolated (port-mapped) I/O.'],
      ['Bus arbitration', 'Centralised and distributed schemes for deciding who drives the bus.'],
    ]),

    ch('Pipelining', 'Instruction pipelining, pipeline hazards.', [
      ['Pipeline stages', 'IF, ID, EX, MEM, WB; the stage with the longest delay sets the clock.'],
      ['Speedup, efficiency and throughput', 'Speedup = non-pipelined time / pipelined time; ideal speedup equals the stage count.'],
      ['Cycle time with latch overhead', 'Max stage delay plus register delay — the version actually asked.'],
      ['Structural hazards', 'Two instructions need the same resource; solved by duplication.'],
      ['Data hazards', 'RAW, WAR, WAW; only RAW occurs in a simple in-order pipeline.'],
      ['Operand forwarding', 'Bypassing the result from a later stage; which hazards it can and cannot remove.'],
      ['Load-use hazard', 'One stall unavoidable even with forwarding.'],
      ['Control hazards', 'Branches; flushing, delay slots and the penalty per taken branch.'],
      ['Branch prediction', 'Static and dynamic prediction, branch target buffer, prediction accuracy in CPI terms.'],
      ['CPI and stall cycles', 'CPI = 1 + stalls per instruction; the standard performance computation.'],
      ['Superscalar and out-of-order execution', 'Multiple issue and dynamic scheduling as context for the pipeline questions.'],
    ]),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

const operatingSystems: SyllabusUnit = {
  unitId: 6,
  section: 'Section 8: Operating System',
  title: 'Operating Systems',
  official:
    'System calls, processes, threads, inter‐process communication, concurrency and synchronization. Deadlock. CPU and I/O scheduling. Memory management and virtual memory. File systems.',
  chapters: [
    ch('System Calls and Processes', 'System calls, processes, threads, inter‐process communication, concurrency and synchronization.', [
      ['Operating system structure', 'Monolithic, layered, microkernel, modular; kernel mode versus user mode.'],
      ['System calls', 'The user-to-kernel boundary; process control, file, device, information and communication classes.'],
      ['Mode switch versus context switch', 'A trap into the kernel is not the same as swapping process state — asked as a distinction.'],
      ['Process concept and process control block', 'What the OS stores per process: pid, state, registers, memory maps, open files.'],
      ['Process states and transitions', 'New, ready, running, waiting, terminated; which events cause each transition.'],
      ['Process creation', 'fork returns twice, exec replaces the image; counting processes created by nested forks is a standard question.'],
      ['Process termination and zombies', 'wait, orphan and zombie processes.'],
      ['Threads', 'Shared address space with private stack and registers; what is shared and what is not.'],
      ['User-level versus kernel-level threads', 'Scheduling and blocking behaviour; many-to-one, one-to-one, many-to-many models.'],
    ]),

    ch('Inter-process Communication and Synchronisation', 'inter‐process communication, concurrency and synchronization.', [
      ['Shared memory and message passing', 'The two IPC families and their cost and safety tradeoffs.'],
      ['Pipes and sockets', 'Anonymous and named pipes; sockets for cross-machine IPC.'],
      ['Race conditions', 'Interleaving-dependent results; identifying them in a given code fragment.'],
      ['Critical section problem', 'Mutual exclusion, progress and bounded waiting — all three must hold.'],
      ["Peterson's solution", 'Two-process software solution using flag and turn; proving each of the three properties.'],
      ['Hardware support', 'Test-and-set, compare-and-swap, atomic exchange, and spinlocks built on them.'],
      ['Semaphores', 'Counting and binary; wait and signal, and why they must be atomic.'],
      ['Mutex locks', 'Ownership semantics distinguishing them from binary semaphores.'],
      ['Monitors and condition variables', 'Language-level mutual exclusion; signal-and-wait versus signal-and-continue.'],
      ['Producer–consumer problem', 'Bounded buffer with three semaphores; the classic correctness question.'],
      ['Readers–writers problem', 'Reader and writer priority variants and the starvation each causes.'],
      ['Dining philosophers', 'Deadlock and starvation illustrated; the standard fixes.'],
      ['Busy waiting versus blocking', 'Spinlock cost against context-switch cost.'],
    ]),

    ch('Deadlock', 'Deadlock.', [
      ['Necessary conditions', 'Mutual exclusion, hold and wait, no preemption, circular wait — all four required.'],
      ['Resource allocation graph', 'Cycle means deadlock with single-instance resources; only possible deadlock otherwise.'],
      ['Deadlock prevention', 'Deny one of the four conditions and what each denial costs.'],
      ['Deadlock avoidance and safe states', 'A safe sequence exists; safe implies no deadlock, unsafe does not imply deadlock.'],
      ["Banker's algorithm", 'Need matrix, available vector, safety check; the most-asked OS numerical after scheduling.'],
      ['Deadlock detection', 'Wait-for graph for single instances; the detection algorithm for multiple instances.'],
      ['Recovery from deadlock', 'Process termination or resource preemption, and victim selection.'],
      ['Minimum resources to avoid deadlock', 'The n(k−1)+1 style formula for n processes each needing k units.'],
    ]),

    ch('CPU and I/O Scheduling', 'CPU and I/O scheduling.', [
      ['Scheduling criteria', 'CPU utilisation, throughput, turnaround, waiting and response time — know which each question wants.'],
      ['Preemptive versus non-preemptive', 'Whether a running process can be interrupted; changes every computed average.'],
      ['First come first served', 'Simple, non-preemptive, suffers the convoy effect.'],
      ['Shortest job first', 'Optimal average waiting time when burst times are known.'],
      ['Shortest remaining time first', 'Preemptive SJF; recomputed at every arrival.'],
      ['Priority scheduling', 'Starvation of low-priority processes and ageing as the fix.'],
      ['Round robin', 'Time quantum drives the behaviour; context-switch overhead in the calculation.'],
      ['Multilevel queue and feedback queue', 'Separate queues with their own policies and movement between them.'],
      ['Gantt chart computations', 'Waiting and turnaround time per process and their averages — draw it every time.'],
      ['Convoy effect and starvation', 'Which policies suffer which pathology.'],
      ['I/O scheduling', 'Ordering pending I/O requests; the CPU-bound versus I/O-bound mix.'],
    ]),

    ch('Memory Management', 'Memory management and virtual memory.', [
      ['Address binding and relocation', 'Compile, load and execution time binding; logical versus physical addresses.'],
      ['Contiguous allocation', 'Fixed and variable partitions; first fit, best fit, worst fit.'],
      ['Internal and external fragmentation', 'Which allocation scheme causes which, and compaction as a remedy.'],
      ['Paging', 'Fixed-size frames and pages; no external fragmentation, some internal.'],
      ['Page table structure', 'Page number and offset split; computing the page table size from address widths.'],
      ['Translation lookaside buffer', 'Caching translations; effective access time with a TLB hit ratio is a guaranteed numerical.'],
      ['Multi-level page tables', 'Splitting the page number across levels; memory accesses per translation.'],
      ['Inverted page tables', 'One entry per frame instead of per page.'],
      ['Segmentation', 'Variable-size logical units; segment table with base and limit.'],
      ['Segmentation with paging', 'Combining both; the two-stage address translation.'],
    ]),

    ch('Virtual Memory', 'Memory management and virtual memory.', [
      ['Demand paging', 'Pages loaded on first reference; valid-invalid bit and the page fault path.'],
      ['Page fault service time', 'Effective access time = (1−p)·memory + p·fault time; p is tiny but the fault cost is huge.'],
      ['FIFO page replacement', 'Simple; suffers Belady’s anomaly.'],
      ['Optimal page replacement', 'Replace the page used furthest in the future; the unattainable benchmark.'],
      ['LRU and its approximations', 'Reference bit, second chance, clock algorithm.'],
      ["Belady's anomaly", 'More frames producing more faults — occurs for FIFO, not for stack algorithms.'],
      ['Frame allocation', 'Equal, proportional and priority allocation; local versus global replacement.'],
      ['Thrashing', 'Too little memory per process; the working-set model and page-fault-frequency control.'],
      ['Copy-on-write and memory-mapped files', 'Sharing pages until a write forces a copy.'],
    ]),

    ch('File Systems', 'File systems.', [
      ['File concept and attributes', 'Name, identifier, type, location, size, protection, timestamps.'],
      ['Access methods', 'Sequential, direct and indexed access.'],
      ['Directory structure', 'Single-level, two-level, tree, acyclic graph; hard and soft links.'],
      ['Contiguous allocation', 'Fast access, external fragmentation, growth problems.'],
      ['Linked allocation', 'No external fragmentation but no efficient random access; FAT as a variant.'],
      ['Indexed allocation', 'Index block per file; single, double and triple indirect blocks.'],
      ['Inodes and maximum file size', 'Computing the largest representable file from block and pointer sizes — a standard numerical.'],
      ['Free space management', 'Bit vector, linked list, grouping, counting.'],
      ['File system consistency and journaling', 'Recovery after a crash.'],
      ['Protection and access control', 'Permission bits and access control lists.'],
    ]),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

const databases: SyllabusUnit = {
  unitId: 7,
  section: 'Section 9: Databases',
  title: 'Databases',
  official:
    'ER‐model. Relational model: relational algebra, tuple calculus, SQL. Integrity constraints, normal forms. File organization, indexing (e.g., B and B+ trees). Transactions and concurrency control.',
  chapters: [
    ch('ER Model', 'ER‐model.', [
      ['Entities, attributes and entity sets', 'Simple, composite, derived, multivalued attributes; the key attribute.'],
      ['Relationships and degree', 'Binary, ternary; the participating entity sets.'],
      ['Cardinality ratios', 'One-to-one, one-to-many, many-to-many and their notation.'],
      ['Participation constraints', 'Total versus partial participation and the double line that marks it.'],
      ['Weak entity sets', 'No key of their own; identified by an owner through an identifying relationship.'],
      ['Generalisation, specialisation, aggregation', 'IS-A hierarchies and treating a relationship as an entity.'],
      ['ER to relational mapping', 'How each construct becomes tables and keys; minimum number of tables is a stock question.'],
    ]),

    ch('Relational Model and Algebra', 'Relational model: relational algebra, tuple calculus, SQL.', [
      ['Relations, tuples, attributes, domains', 'The formal definitions and why duplicate tuples do not exist in the model.'],
      ['Keys', 'Super key, candidate key, primary key, alternate key, foreign key.'],
      ['Finding candidate keys', 'Attribute closure over the functional dependencies — do it systematically, not by inspection.'],
      ['Selection and projection', 'σ and π; projection removes duplicates in the pure algebra.'],
      ['Union, intersection, set difference', 'Union compatibility requirement.'],
      ['Cartesian product and joins', 'Theta join, equi join, natural join and their tuple counts.'],
      ['Outer joins', 'Left, right and full; the padding with nulls.'],
      ['Division', 'The "for all" operator; expressing it with the other operators.'],
      ['Rename and assignment', 'ρ, and building queries in steps.'],
      ['Tuple relational calculus', 'Declarative {t | P(t)}; safety of expressions.'],
      ['Domain relational calculus', 'Variables range over domains rather than tuples.'],
      ['Equivalence of algebra and calculus', 'Both express exactly the relationally complete queries.'],
    ]),

    ch('SQL', 'Relational model: relational algebra, tuple calculus, SQL.', [
      ['SELECT, FROM, WHERE', 'The core query and its evaluation order.'],
      ['Aggregate functions', 'COUNT, SUM, AVG, MIN, MAX and how each treats NULL.'],
      ['GROUP BY and HAVING', 'Grouping then filtering groups; the difference from WHERE is examined constantly.'],
      ['ORDER BY, DISTINCT, LIMIT', 'Result shaping and duplicate removal.'],
      ['Joins in SQL', 'INNER, LEFT, RIGHT, FULL, CROSS and self joins.'],
      ['Nested subqueries', 'IN, EXISTS, ANY, ALL; correlated versus uncorrelated.'],
      ['NULL semantics', 'Three-valued logic; comparisons with NULL are unknown, not false.'],
      ['Set operations', 'UNION, UNION ALL, INTERSECT, EXCEPT and duplicate handling.'],
      ['Views', 'Virtual tables, and when a view is updatable.'],
      ['Triggers and assertions', 'Event-condition-action rules.'],
      ['Output tuple counting', 'Given two tables and a query, count the result rows — the single most common DBMS question.'],
    ]),

    ch('Integrity Constraints and Normal Forms', 'Integrity constraints, normal forms.', [
      ['Domain and entity integrity', 'Attribute domains, and no NULL in a primary key.'],
      ['Referential integrity', 'Foreign keys, and the ON DELETE / ON UPDATE actions.'],
      ['Functional dependencies', 'X → Y; the notion everything in normalisation is built on.'],
      ["Armstrong's axioms", 'Reflexivity, augmentation, transitivity, plus the derived union and decomposition rules.'],
      ['Attribute closure', 'X⁺ under a set of FDs; used for keys, for FD implication and for normal-form checks.'],
      ['Canonical cover and minimal cover', 'Removing extraneous attributes and redundant dependencies.'],
      ['First normal form', 'Atomic attribute values only.'],
      ['Second normal form', 'No partial dependency of a non-prime attribute on a candidate key.'],
      ['Third normal form', 'No transitive dependency; every FD has a super key on the left or a prime attribute on the right.'],
      ['Boyce-Codd normal form', 'Left side of every non-trivial FD is a super key; stricter than 3NF.'],
      ['Fourth normal form', 'Multivalued dependencies removed.'],
      ['Lossless join decomposition', 'The common attributes must be a key of one fragment.'],
      ['Dependency preservation', '3NF can always be both lossless and dependency preserving; BCNF cannot always.'],
      ['Highest normal form of a relation', 'Given FDs, decide the normal form — the standard exam task.'],
    ]),

    ch('File Organisation and Indexing', 'File organization, indexing (e.g., B and B+ trees).', [
      ['Heap, sequential and hashed files', 'Record layout and the cost of search, insert and delete in each.'],
      ['Primary, clustering and secondary indexes', 'Ordering key versus non-key; at most one primary index per file.'],
      ['Dense and sparse indexes', 'One entry per record versus one per block, and the space-time tradeoff.'],
      ['Multi-level indexes', 'Indexing the index to keep the top level in memory.'],
      ['B-trees', 'Balanced m-way search tree; keys and data in every node.'],
      ['B+ trees', 'Data only in the leaves, leaves linked for range scans — the structure real databases use.'],
      ['B+ tree order and fanout', 'Computing the order from block size, key size and pointer size.'],
      ['Insertion and deletion with splits and merges', 'Node overflow splits and underflow merges, and the resulting height changes.'],
      ['Height and block access counts', 'Number of disk accesses for a search — the recurring numerical.'],
      ['Static and extendible hashing', 'Bucket overflow, and the directory doubling of extendible hashing.'],
    ]),

    ch('Transactions and Concurrency Control', 'Transactions and concurrency control.', [
      ['ACID properties', 'Atomicity, consistency, isolation, durability, and which component provides each.'],
      ['Transaction states', 'Active, partially committed, failed, aborted, committed.'],
      ['Schedules', 'Serial, non-serial, complete; the notation used in every question.'],
      ['Conflict serialisability', 'Precedence graph acyclic; the mechanical test to apply first.'],
      ['View serialisability', 'Weaker than conflict serialisability; blind writes are the giveaway.'],
      ['Recoverable and cascadeless schedules', 'Commit ordering, cascading rollback, strict schedules.'],
      ['Two-phase locking', 'Growing and shrinking phases; guarantees conflict serialisability, not deadlock freedom.'],
      ['Strict and rigorous 2PL', 'Holding locks until commit to guarantee recoverability.'],
      ['Lock types and compatibility', 'Shared and exclusive locks and the compatibility matrix.'],
      ['Deadlock in databases', 'Wait-die and wound-wait timestamp schemes; detection by wait-for graph.'],
      ['Timestamp ordering protocol', 'Read and write timestamps and the Thomas write rule.'],
      ['Multiversion concurrency control', 'Readers see a snapshot rather than blocking on writers.'],
      ['Log-based recovery', 'Undo and redo, write-ahead logging, checkpoints.'],
    ]),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

const theoryOfComputation: SyllabusUnit = {
  unitId: 8,
  section: 'Section 6: Theory of Computation',
  title: 'Theory of Computation',
  official:
    'Regular expressions and finite automata. Context-free grammars and push-down automata. Regular and context-free languages, pumping lemma. Turing machines and undecidability.',
  chapters: [
    ch('Finite Automata', 'Regular expressions and finite automata.', [
      ['Alphabets, strings, languages', 'Σ, Σ*, concatenation, and the empty string versus the empty language.'],
      ['Deterministic finite automata', 'Exactly one transition per symbol; the 5-tuple definition.'],
      ['Non-deterministic finite automata', 'Multiple or zero transitions; accepts if some path accepts.'],
      ['ε-NFA', 'Epsilon transitions and epsilon closure.'],
      ['Subset construction', 'NFA to DFA; up to 2ⁿ states, and constructing the minimum reachable subset.'],
      ['DFA minimisation', 'Myhill–Nerode or the partition-refinement table; the minimal DFA is unique.'],
      ['Myhill–Nerode theorem', 'Number of equivalence classes equals the minimal DFA states; also proves non-regularity.'],
      ['Moore and Mealy machines', 'Finite automata with output, and conversion between them.'],
      ['Designing a DFA for a language', 'Divisibility, substring and counting conditions — the standard construction drills.'],
      ['Minimum states for a language', 'Counting states without drawing the whole machine.'],
    ]),

    ch('Regular Languages and Expressions', 'Regular expressions and finite automata. Regular and context-free languages, pumping lemma.', [
      ['Regular expressions', 'Union, concatenation, Kleene star, and their precedence.'],
      ['Equivalence of regex, DFA, NFA', 'All three describe exactly the regular languages.'],
      ["Arden's theorem", 'Solving state equations to get the regular expression of an automaton.'],
      ['Closure properties of regular languages', 'Union, intersection, complement, concatenation, star, reversal, homomorphism — all closed.'],
      ['Pumping lemma for regular languages', 'Necessary not sufficient; the adversary game used to prove non-regularity.'],
      ['Proving a language non-regular', 'Pumping lemma or an infinite Myhill–Nerode index.'],
      ['Decision problems for regular languages', 'Emptiness, finiteness, membership and equivalence are all decidable.'],
    ]),

    ch('Context-Free Grammars and Languages', 'Context-free grammars and push-down automata. Regular and context-free languages, pumping lemma.', [
      ['Context-free grammars', 'Productions with a single non-terminal on the left; the 4-tuple definition.'],
      ['Derivations and parse trees', 'Leftmost and rightmost derivations, and the parse tree they share.'],
      ['Ambiguity', 'Two distinct parse trees for one string; inherently ambiguous languages.'],
      ['Simplification of grammars', 'Removing useless symbols, ε-productions and unit productions, in that order.'],
      ['Chomsky normal form', 'A → BC or A → a; the form CYK parsing requires.'],
      ['Greibach normal form', 'A → aα; used to eliminate left recursion.'],
      ['Closure properties of CFLs', 'Closed under union, concatenation, star; NOT closed under intersection or complement.'],
      ['Pumping lemma for context-free languages', 'The uvxyz decomposition used to prove a language is not context-free.'],
      ['Deterministic context-free languages', 'Accepted by a DPDA; closed under complement but not union or intersection.'],
      ['Chomsky hierarchy', 'Type 0 to type 3 and the machine model matching each.'],
    ]),

    ch('Push-down Automata', 'Context-free grammars and push-down automata.', [
      ['PDA definition', 'Finite automaton plus a stack; the 7-tuple and instantaneous descriptions.'],
      ['Acceptance by final state and by empty stack', 'The two conventions and their equivalence.'],
      ['CFG to PDA and PDA to CFG', 'Both directions, establishing that PDAs accept exactly the CFLs.'],
      ['Deterministic versus non-deterministic PDA', 'DPDA is strictly weaker; wwᴿ needs non-determinism.'],
      ['Designing a PDA', 'Counting languages such as aⁿbⁿ and balanced parentheses.'],
    ]),

    ch('Turing Machines and Undecidability', 'Turing machines and undecidability.', [
      ['Turing machine definition', 'Infinite tape, head, transition function; configurations and computation.'],
      ['TM variants', 'Multi-tape, non-deterministic, two-way infinite tape — all equivalent in power.'],
      ['Church–Turing thesis', 'Anything effectively computable is TM-computable.'],
      ['Recursive languages', 'Decidable: the TM halts on every input.'],
      ['Recursively enumerable languages', 'Semi-decidable: halts on strings in the language, may loop otherwise.'],
      ['Closure properties of REC and RE', 'REC closed under complement; RE is not — the key asymmetry.'],
      ['The halting problem', 'Undecidable; the diagonalisation proof.'],
      ["Rice's theorem", 'Every non-trivial property of the language of a TM is undecidable — settles most such questions instantly.'],
      ['Reductions', 'Mapping reduction to transfer undecidability; the direction of the reduction is the usual error.'],
      ['Post correspondence problem', 'Undecidable; used to prove grammar problems undecidable.'],
      ['Decidability of standard problems', 'A table of which problems are decidable for regular, CF and RE languages.'],
      ['Countability and diagonalisation', 'The set of languages is uncountable while the set of TMs is countable.'],
    ]),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

const compilerDesign: SyllabusUnit = {
  unitId: 9,
  section: 'Section 7: Compiler Design',
  title: 'Compiler Design',
  official:
    'Lexical analysis, parsing, syntax-directed translation. Runtime environments. Intermediate code generation. Local optimisation, Data flow analyses: constant propagation, liveness analysis, common sub expression elimination.',
  chapters: [
    ch('Lexical Analysis', 'Lexical analysis, parsing, syntax-directed translation.', [
      ['Phases of a compiler', 'Lexical, syntax, semantic, intermediate code, optimisation, code generation — and what each detects.'],
      ['Tokens, patterns, lexemes', 'The three-way distinction that every definition question turns on.'],
      ['Regular expressions for tokens', 'Specifying identifiers, numbers and operators.'],
      ['Finite automata as scanners', 'The DFA that a lexer is; longest-match rule.'],
      ['Input buffering and lookahead', 'Sentinels and two-buffer schemes.'],
      ['Symbol table', 'What the lexer and later phases record and look up.'],
      ['Errors caught at lexical analysis', 'Illegal characters and malformed tokens only — everything else is later.'],
    ]),

    ch('Parsing', 'Lexical analysis, parsing, syntax-directed translation.', [
      ['Top-down versus bottom-up parsing', 'Leftmost derivation built forward versus rightmost derivation built in reverse.'],
      ['Recursive descent parsing', 'One function per non-terminal; requires no left recursion.'],
      ['Left recursion elimination', 'Immediate and indirect; mechanical transformation.'],
      ['Left factoring', 'Postponing the choice between productions with a common prefix.'],
      ['FIRST and FOLLOW sets', 'Computed for every non-terminal; the input to every parse table.'],
      ['LL(1) parsing', 'Predictive table construction; a conflict in any cell means not LL(1).'],
      ['Shift-reduce parsing', 'Stack and input; shift, reduce, accept, error actions.'],
      ['Handle and viable prefix', 'The substring to be reduced next, and why it is always at the stack top.'],
      ['Operator precedence parsing', 'Precedence relations table for operator grammars.'],
      ['LR(0) items and canonical collection', 'Closure and goto over item sets; the automaton behind LR parsing.'],
      ['SLR(1) parsing', 'Reduce entries from FOLLOW; the weakest of the LR family.'],
      ['CLR(1) parsing', 'Items carry lookahead; the most powerful, and the largest table.'],
      ['LALR(1) parsing', 'Merging CLR states with identical cores; can introduce reduce-reduce conflicts.'],
      ['Parser conflicts', 'Shift-reduce and reduce-reduce; recognising them from the item sets.'],
      ['Grammar class hierarchy', 'LL(1) ⊂ SLR(1) ⊂ LALR(1) ⊂ CLR(1) — the containment is asked directly.'],
    ]),

    ch('Syntax-Directed Translation', 'syntax-directed translation.', [
      ['Syntax-directed definitions', 'Attributes attached to grammar symbols with semantic rules.'],
      ['Synthesised attributes', 'Computed from children; S-attributed definitions evaluate bottom-up.'],
      ['Inherited attributes', 'Computed from parent and siblings; L-attributed definitions evaluate in one left-to-right pass.'],
      ['Dependency graphs', 'Evaluation order for attributes; cycles make the definition ill-formed.'],
      ['Annotated parse trees', 'Evaluating attributes for a given input string.'],
      ['Translation schemes', 'Semantic actions embedded at specific points within productions.'],
      ['Type checking and type expressions', 'Static semantic checks and coercion.'],
    ]),

    ch('Runtime Environments', 'Runtime environments.', [
      ['Storage organisation', 'Code, static, heap and stack areas of a running program.'],
      ['Activation records', 'Return address, parameters, locals, saved registers, control and access links.'],
      ['Stack allocation', 'Push and pop of activation records on call and return.'],
      ['Static versus dynamic scope', 'Binding resolved by program text versus by call chain — output-prediction questions.'],
      ['Access links and displays', 'Reaching non-local variables in nested procedures.'],
      ['Parameter passing mechanisms', 'Call by value, reference, value-result, name; output differs per mechanism.'],
      ['Heap management and garbage collection', 'Allocation, fragmentation, reference counting and mark-and-sweep.'],
    ]),

    ch('Intermediate Code Generation', 'Intermediate code generation.', [
      ['Three-address code', 'At most one operator per instruction; the standard IR in questions.'],
      ['Quadruples, triples and indirect triples', 'Three representations of three-address code and their relative merits.'],
      ['Syntax trees and DAGs', 'DAG representation exposes common subexpressions directly.'],
      ['Translating expressions', 'Temporaries generated per operator; counting them is a standard question.'],
      ['Translating control flow', 'if, while and for into labels and conditional jumps; short-circuit evaluation.'],
      ['Backpatching', 'Filling in jump targets on a single pass.'],
      ['Array and pointer address translation', 'Index computation into base plus offset arithmetic.'],
    ]),

    ch('Optimisation and Data Flow Analysis', 'Local optimisation, Data flow analyses: constant propagation, liveness analysis, common sub expression elimination.', [
      ['Basic blocks', 'Straight-line code with one entry and one exit; leader identification.'],
      ['Control flow graph', 'Basic blocks as nodes and possible transfers as edges.'],
      ['Local optimisation', 'Transformations confined to a single basic block.'],
      ['Common subexpression elimination', 'Reuse an already-computed value instead of recomputing it; named explicitly in the syllabus.'],
      ['Constant propagation and folding', 'Replace variables with known constants and evaluate at compile time.'],
      ['Copy propagation', 'Replace uses of x after x = y with y.'],
      ['Dead code elimination', 'Remove computations whose results are never used.'],
      ['Strength reduction', 'Replace an expensive operation with a cheaper one, typically inside loops.'],
      ['Loop optimisations', 'Invariant code motion, induction variable elimination, unrolling.'],
      ['Liveness analysis', 'A variable is live if it may be read before being rewritten; backward data-flow analysis.'],
      ['Reaching definitions and available expressions', 'Forward data-flow analyses and their meet operators.'],
      ['Data flow equations', 'IN and OUT sets with gen and kill; iterating to a fixed point.'],
      ['Peephole optimisation', 'Local pattern replacement on a small instruction window.'],
      ['Register allocation', 'Graph colouring on the interference graph; spilling when colours run out.'],
    ]),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

const computerNetworks: SyllabusUnit = {
  unitId: 10,
  section: 'Section 10: Computer Networks',
  title: 'Computer Networks (2027 scope)',
  official:
    'Principles of Layering; Basics of switching (circuit, packet and virtual circuit) and performance metrics; Data link layer: error detection, Medium Access Control, Ethernet; Distance vector and link state routing; IPv4 - Fragmentation, CIDR Notation, Network Address Translation; TCP- flow control and congestion control, socket API; DNS and HTTP.',
  chapters: [
    ch('Principles of Layering', 'Principles of Layering;', [
      ['Why layering', 'Separation of concerns, and the interface each layer presents to the one above.'],
      ['Encapsulation and headers', 'Each layer adds its own header; overhead accumulates down the stack.'],
      ['Protocol data units', 'Segment, packet, frame, bit — naming per layer.'],
      ['Service models', 'Connection-oriented versus connectionless, reliable versus best effort.'],
      ['The OSI seven-layer stack', 'No longer explicitly listed for 2027 — layering principles are, the seven named layers are not.', 'dropped'],
    ]),

    ch('Switching and Performance', 'Basics of switching (circuit, packet and virtual circuit) and performance metrics;', [
      ['Circuit switching', 'Dedicated path reserved for the call; setup delay then constant rate.'],
      ['Packet switching', 'Store and forward per hop, statistical multiplexing, variable delay.'],
      ['Virtual circuit switching', 'Connection setup with per-hop VC tables; ordered delivery without a dedicated circuit.'],
      ['Transmission delay', 'Packet size divided by link bandwidth.'],
      ['Propagation delay', 'Distance divided by signal speed; independent of packet size.'],
      ['Queueing and processing delay', 'The two variable components of total delay.'],
      ['Bandwidth-delay product', 'Bits in flight on the link; the size a window must reach to fill the pipe.'],
      ['Throughput and efficiency', 'Useful bits per second against the bottleneck link.'],
      ['End-to-end delay across hops', 'Summing per-hop transmission and propagation — the standard numerical.'],
    ]),

    ch('Data Link Layer', 'Data link layer: error detection, Medium Access Control, Ethernet;', [
      ['Framing', 'Character stuffing, bit stuffing, length fields.'],
      ['Parity checks', 'Single-bit error detection; two-dimensional parity for correction.'],
      ['Checksums', 'One’s complement sum used by IP, UDP and TCP.'],
      ['Cyclic redundancy check', 'Polynomial division over GF(2); computing the CRC bits is a stock question.'],
      ['Hamming distance and error detection capability', 'Detect d−1 errors, correct ⌊(d−1)/2⌋.'],
      ['Hamming codes', 'Single-error correction; computing the parity-bit positions.'],
      ['Stop and wait', 'Efficiency = 1/(1+2a); the base case for every ARQ comparison.'],
      ['Go-back-N ARQ', 'Window at the sender only; cumulative acknowledgements and retransmission of the whole window.'],
      ['Selective repeat ARQ', 'Windows at both ends; window size at most half the sequence space.'],
      ['Sliding window efficiency', 'Utilisation = W/(1+2a) capped at 1 — the most-asked DLL numerical.'],
      ['ALOHA and slotted ALOHA', 'Maximum throughput 18.4% and 36.8%.'],
      ['CSMA and its variants', '1-persistent, non-persistent, p-persistent.'],
      ['CSMA/CD', 'Collision detection and the minimum frame size condition Tt ≥ 2Tp.'],
      ['Ethernet', 'Frame format, MAC addressing, minimum and maximum frame size, switched Ethernet.'],
      ['Switches, bridges and collision domains', 'Learning bridges, forwarding tables, collision versus broadcast domains.'],
    ]),

    ch('Routing', 'Distance vector and link state routing;', [
      ['Routing versus forwarding', 'Building the table against using it per packet.'],
      ['Distance vector routing', 'Bellman–Ford distributed; each node advertises its whole vector to neighbours.'],
      ['Count-to-infinity', 'Slow convergence after a failure; split horizon and poison reverse as mitigations.'],
      ['Link state routing', 'Flood link states, then run Dijkstra locally on the complete map.'],
      ['Comparison of the two', 'Convergence speed, message volume and memory — asked as a direct contrast.'],
      ['Hierarchical routing', 'Autonomous systems and why interior and exterior protocols differ.'],
    ]),

    ch('Network Layer — IPv4', 'IPv4 - Fragmentation, CIDR Notation, Network Address Translation;', [
      ['IPv4 header fields', 'Version, IHL, total length, identification, flags, fragment offset, TTL, protocol, checksum.'],
      ['IP addressing and classes', 'Dotted decimal, network and host parts.'],
      ['Subnetting', 'Borrowing host bits; computing subnet, broadcast and usable host ranges.'],
      ['CIDR notation', 'Prefix length rather than classes; supernetting and route aggregation.'],
      ['Longest prefix matching', 'Forwarding-table lookup rule; asked as "which entry matches".'],
      ['Fragmentation and reassembly', 'MTU, offset in units of 8 bytes, the more-fragments flag; computing the fragment list.'],
      ['Network address translation', 'Private address reuse, NAT table, port address translation.'],
      ['ICMP, ARP and DHCP', 'No longer explicitly listed in the 2027 syllabus — deprioritise these.', 'dropped'],
    ]),

    ch('Transport Layer — TCP', 'TCP- flow control and congestion control, socket API;', [
      ['TCP segment header', 'Sequence and acknowledgement numbers, window, flags, checksum.'],
      ['Connection establishment and teardown', 'Three-way handshake and four-way close; TIME_WAIT.'],
      ['Sequence and acknowledgement numbering', 'Byte-oriented numbering; tracing the numbers across an exchange.'],
      ['Flow control', 'Receiver-advertised window; zero-window and window probes.'],
      ['Congestion control: slow start', 'Exponential growth of cwnd until the threshold.'],
      ['Congestion avoidance', 'Additive increase, multiplicative decrease past the threshold.'],
      ['Fast retransmit and fast recovery', 'Three duplicate ACKs trigger retransmission without waiting for a timeout.'],
      ['Timeout and RTT estimation', 'Smoothed RTT, deviation, and Karn’s algorithm.'],
      ['cwnd evolution problems', 'Plotting the window across rounds given losses — the highest-value CN numerical.'],
      ['Socket API', 'socket, bind, listen, accept, connect, send, recv, close and the order of the calls.'],
      ['UDP', 'No longer explicitly named for 2027; TCP is what the syllabus calls out.', 'dropped'],
    ]),

    ch('Application Layer', 'DNS and HTTP.', [
      ['DNS hierarchy', 'Root, TLD and authoritative servers; the domain namespace as a tree.'],
      ['Iterative and recursive resolution', 'Who chases the referral, and the message count for a lookup.'],
      ['DNS record types and caching', 'A, NS, CNAME, MX; TTL-driven caching.'],
      ['HTTP request and response', 'Methods, status code classes, headers, and the message format.'],
      ['Persistent and non-persistent connections', 'Object-fetch time in RTTs — the standard calculation.'],
      ['HTTP caching and conditional requests', 'Cache-Control, ETag, If-Modified-Since.'],
      ['Cookies and statelessness', 'How state is layered on a stateless protocol.'],
      ['FTP and SMTP', 'Removed from the explicit 2027 application-layer scope — only DNS and HTTP are named.', 'dropped'],
    ]),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

const generalAptitude: SyllabusUnit = {
  unitId: 11,
  section: 'GA: General Aptitude',
  title: 'General Aptitude',
  official:
    'Verbal Aptitude: Basic English grammar: tenses, articles, adjectives, prepositions, conjunctions, verb-noun agreement, and other parts of speech. Basic vocabulary: words, idioms, and phrases in context. Reading and comprehension, Narrative sequencing. Quantitative Aptitude: Data interpretation: data graphs (bar graphs, pie charts, and other graphs representing data), 2-and 3-dimensional plots, maps, and tables. Numerical computation and estimation: ratios, percentages, powers, exponents and logarithms, permutations and combinations, and series. Mensuration and geometry, Elementary statistics and probability. Analytical Aptitude: Logic: deduction and induction, Analogy, Numerical relations and reasoning. Spatial Aptitude: Transformation of shapes: translation, rotation, scaling, mirroring, assembling, and grouping paper folding, cutting, and patterns in 2 and 3 dimensions.',
  chapters: [
    ch('Verbal Aptitude', 'Basic English grammar: tenses, articles, adjectives, prepositions, conjunctions, verb-noun agreement, and other parts of speech.', [
      ['Tenses', 'The twelve forms and sequence of tenses in reported speech.'],
      ['Articles', 'a, an, the — definite versus indefinite and zero article.'],
      ['Adjectives and adverbs', 'Order, comparison, and adjective-versus-adverb misuse.'],
      ['Prepositions', 'Fixed collocations, the most error-prone area for non-native usage.'],
      ['Conjunctions', 'Coordinating, subordinating and correlative pairs.'],
      ['Subject-verb agreement', 'Number agreement with collective nouns, "each", "either…or" and intervening phrases.'],
      ['Other parts of speech', 'Pronouns and their antecedents, determiners, participles and gerunds.'],
      ['Vocabulary in context', 'Word meaning inferred from the sentence rather than recalled.'],
      ['Idioms and phrases', 'Fixed expressions whose meaning is not compositional.'],
      ['Reading comprehension', 'Main idea, inference, tone and detail questions on a short passage.'],
      ['Narrative sequencing', 'Ordering jumbled sentences into a coherent paragraph.'],
    ]),

    ch('Quantitative Aptitude', 'Data interpretation … Numerical computation and estimation … Mensuration and geometry, Elementary statistics and probability.', [
      ['Data interpretation from graphs', 'Bar graphs, pie charts, line graphs; percentage change and ratio questions on them.'],
      ['Tables, maps and multi-dimensional plots', 'Reading combined data sources and 2-D/3-D plots.'],
      ['Ratios and proportion', 'Direct and inverse, partnership and mixture problems.'],
      ['Percentages', 'Successive change, profit and loss, discount.'],
      ['Powers, exponents and logarithms', 'Index laws, log identities, and change of base.'],
      ['Permutations and combinations', 'The aptitude-level counting problems, lighter than the discrete-maths versions.'],
      ['Series', 'Arithmetic, geometric and pattern-completion sequences.'],
      ['Numerical estimation', 'Approximation to eliminate options quickly under time pressure.'],
      ['Mensuration', 'Area, perimeter, surface area and volume of the standard 2-D and 3-D figures.'],
      ['Geometry', 'Triangles, circles, similarity, coordinate geometry basics.'],
      ['Elementary statistics', 'Mean, median, mode, range and standard deviation on small data sets.'],
      ['Elementary probability', 'Simple events, conditional probability, and expected value.'],
      ['Time, speed, distance and work', 'Classic rate problems that recur every year.'],
    ]),

    ch('Analytical Aptitude', 'Logic: deduction and induction, Analogy, Numerical relations and reasoning.', [
      ['Deductive reasoning', 'Syllogisms and validity from stated premises; Venn diagrams as the tool.'],
      ['Inductive reasoning', 'Generalising from cases, and recognising where the generalisation breaks.'],
      ['Analogies', 'Verbal and numerical relationship matching.'],
      ['Numerical relations', 'Coding-decoding, number series with an embedded rule.'],
      ['Logical puzzles', 'Seating, ordering and grid-based constraint puzzles.'],
      ['Blood relations and directions', 'Relationship chains and direction-sense problems.'],
      ['Statement and conclusion', 'Deciding which conclusions genuinely follow.'],
    ]),

    ch('Spatial Aptitude', 'Transformation of shapes: translation, rotation, scaling, mirroring, assembling, and grouping paper folding, cutting, and patterns in 2 and 3 dimensions.', [
      ['Translation and rotation', 'Predicting a shape’s appearance after a rigid motion.'],
      ['Scaling and mirroring', 'Resizing, and mirror-image identification.'],
      ['Assembling and grouping', 'Which pieces combine into a target figure.'],
      ['Paper folding and cutting', 'Predicting the hole pattern after unfolding.'],
      ['2-D patterns and sequences', 'Completing a visual series.'],
      ['3-D visualisation', 'Cube nets, dice faces, and views of a solid from different directions.'],
    ]),
  ],
};

/** The whole GATE 2027 CS syllabus, in the tracker's own subject order. */
export const GATE_SYLLABUS: readonly SyllabusUnit[] = [
  discreteMathematics,
  digitalLogic,
  programmingDataStructures,
  algorithms,
  engineeringMathematics,
  computerOrganisation,
  operatingSystems,
  databases,
  theoryOfComputation,
  compilerDesign,
  computerNetworks,
  generalAptitude,
];

/** Source of the official text, shown on the page so the provenance is visible. */
export const GATE_SYLLABUS_SOURCE = {
  label: 'Official GATE 2027 syllabus, IIT Madras',
  where: 'gate2027.iitm.ac.in → Exam papers and syllabus → CS and GA',
};

// ─────────────────────────────────────────────────────────────────────────────
// Where to learn each subject from.
//
// One book you actually finish beats four you sample. `text` is ranked: the
// first entry is the one to work through, the rest are for the topics the first
// covers badly. `lectures` is deliberately a shortlist to choose ONE from — the
// campaign plan allows exactly one playlist per subject. `practice` is where the
// marks are actually won.

export interface LearnFrom {
  /** Books, ranked. Work through the first; use the others as backup. */
  text: string[];
  /** Pick exactly one and stay with it for the whole subject. */
  lectures: string[];
  /** Where the drilling happens. */
  practice: string[];
  /** One honest line on how to use the above for this particular subject. */
  note: string;
}

export const GATE_LEARN_FROM: Record<number, LearnFrom> = {
  // Discrete Mathematics
  0: {
    text: [
      'Discrete Mathematics and Its Applications — Kenneth H. Rosen (the standard; GATE questions are recognisably from it)',
      'Elements of Discrete Mathematics — C. L. Liu (tighter on combinatorics and recurrences)',
      'Graph Theory with Applications to Engineering and Computer Science — Narsingh Deo (graphs only, when Rosen is too shallow)',
    ],
    lectures: [
      'NPTEL — Discrete Mathematics, Kamala Krithivasan (IIT Madras)',
      'NPTEL — Discrete Mathematics, Sudarshan Iyengar (IIT Ropar), lighter and faster',
    ],
    practice: [
      'Rosen chapter exercises — do these before touching previous-year papers',
      'GATE previous-year questions 2000 onwards, subject-wise',
      'GATE Overflow for worked solutions and the discussion under each question',
    ],
    note: 'The highest-density subject in the paper and completely deterministic — aim for near-perfect, not "good enough".',
  },

  // Digital Logic
  1: {
    text: [
      'Digital Design — M. Morris Mano (the only book you need for this subject)',
      'Digital Logic and Computer Design — Mano, for the arithmetic-circuit chapters',
    ],
    lectures: [
      'NPTEL — Digital Circuits, Santanu Chattopadhyay (IIT Kharagpur)',
      'Neso Academy — Digital Electronics, if you want it broken into short pieces',
    ],
    practice: [
      'Mano end-of-chapter problems, especially K-map and sequential design',
      'Previous-year questions — this subject repeats patterns more than any other',
      'A timed drill of 20 IEEE-754 conversions until the error rate is zero',
    ],
    note: 'Small, mechanical and closes fast. The tabular (Quine–McCluskey) method is new for 2027, so no previous-year question exists — take it straight from Mano.',
  },

  // Programming and Data Structures
  2: {
    text: [
      'The C Programming Language — Kernighan and Ritchie (for the language itself)',
      'Data Structures Using C — Tenenbaum, Langsam and Augenstein',
      'Introduction to Algorithms — Cormen, for trees, heaps and hashing done properly',
    ],
    lectures: [
      'NPTEL — Programming and Data Structures, Hema Murthy / Deepak D’Souza',
      'mycodeschool on data structures, if you prefer code-first explanation',
    ],
    practice: [
      'Dry-run code on paper with an explicit stack — never in an IDE',
      'Previous-year output-prediction and pointer questions, 2000 onwards',
      'A complete operation-complexity table written cold from memory',
    ],
    note: 'Your coding background is a real edge here, but it works against you on paper questions — the exam tests tracing, not writing.',
  },

  // Algorithms
  3: {
    text: [
      'Introduction to Algorithms — Cormen, Leiserson, Rivest, Stein (read it, do not just consult it)',
      'Algorithm Design — Kleinberg and Tardos, for greedy and dynamic-programming intuition',
    ],
    lectures: [
      'NPTEL — Design and Analysis of Algorithms, Madhavan Mukund (CMI)',
      'MIT 6.006 Introduction to Algorithms (OpenCourseWare), if you want the harder treatment',
    ],
    practice: [
      'Compute comparison and swap counts on a given array without re-deriving the algorithm',
      'Previous-year questions — the recurrence and complexity questions especially',
      'Trace Dijkstra, Prim, Kruskal and Bellman–Ford by hand on the same graph',
    ],
    note: 'Highest conceptual ceiling in the paper. Expect to drop a mark or two to a genuinely hard question and plan for it.',
  },

  // Engineering Mathematics
  4: {
    text: [
      'Higher Engineering Mathematics — B. S. Grewal (the standard Indian reference)',
      'Introduction to Linear Algebra — Gilbert Strang, for eigenvalues actually making sense',
      'Probability and Statistics — Schaum’s Outline, for volume of solved problems',
    ],
    lectures: [
      'NPTEL — Linear Algebra, Gilbert Strang’s MIT 18.06 as the alternative',
      'NPTEL — Probability and Statistics, for the distributions section',
    ],
    practice: [
      'Eigenvalue problems for 3×3 matrices until each takes under three minutes',
      'Conditional-probability trees until you build them without thinking',
      'Previous-year questions — patterns here are the most stable in the paper',
    ],
    note: 'Small syllabus, stable patterns, very high marks per hour. Do not skip it because it feels like school maths.',
  },

  // Computer Organisation and Architecture
  5: {
    text: [
      'Computer Organization — Carl Hamacher, Vranesic and Zaky (the GATE default)',
      'Computer Organization and Design — Patterson and Hennessy, for pipelining and caches',
      'Computer System Architecture — M. Morris Mano, for control unit design',
    ],
    lectures: [
      'NPTEL — Computer Organization and Architecture, Smruti Sarangi (IIT Delhi)',
      'NPTEL — Computer Architecture, Anshul Kumar (IIT Delhi)',
    ],
    practice: [
      'Cache field-width and hit-ratio numericals until they are automatic',
      'Pipeline speedup, stall-cycle and CPI computations from previous years',
      'Control unit design worked from the textbook — there is no previous-year question for it',
    ],
    note: 'Control unit design and memory interfacing are new for 2027 with no previous-year coverage. Mano and Hamacher are the only sources.',
  },

  // Operating Systems
  6: {
    text: [
      'Operating System Concepts — Silberschatz, Galvin and Gagne (the dinosaur book)',
      'Modern Operating Systems — Tanenbaum, for the synchronisation chapters',
    ],
    lectures: [
      'NPTEL — Operating Systems, Mythili Vutukuru (IIT Bombay)',
      'NPTEL — Introduction to Operating Systems, Chester Rebeiro (IIT Madras)',
    ],
    practice: [
      'Every scheduling algorithm as a Gantt chart with waiting and turnaround times, under three minutes',
      'Banker’s algorithm and page-replacement traces from previous years',
      'TLB and multi-level page-table effective-access-time calculations',
    ],
    note: 'The highest ratio of drillable, repeating numericals in the whole paper. This should be one of your strongest subjects.',
  },

  // Databases
  7: {
    text: [
      'Database System Concepts — Silberschatz, Korth and Sudarshan (Korth is the GATE standard)',
      'Fundamentals of Database Systems — Elmasri and Navathe, for ER modelling and normalisation',
    ],
    lectures: [
      'NPTEL — Database Management System, Partha Pratim Das (IIT Kharagpur)',
      'NPTEL — Data Base Management System, Prof. D. Janakiram (IIT Madras)',
    ],
    practice: [
      'Find candidate keys by attribute closure, systematically, never by inspection',
      'Conflict and view serialisability tested mechanically on previous-year schedules',
      'Count output tuples for a given query and pair of tables — the most repeated DBMS question',
    ],
    note: 'Normalisation and serialisability are formulaic once drilled. Drill them to reflex and this subject stops costing you time.',
  },

  // Theory of Computation
  8: {
    text: [
      'An Introduction to Formal Languages and Automata — Peter Linz (start here)',
      'Introduction to Automata Theory, Languages and Computation — Hopcroft, Motwani and Ullman (the deeper treatment)',
      'Introduction to the Theory of Computation — Michael Sipser, for decidability written clearly',
    ],
    lectures: [
      'NPTEL — Theory of Computation, Somenath Biswas (IIT Kanpur)',
      'NPTEL — Theory of Computation, Raghunath Tewari (IIT Kanpur)',
    ],
    practice: [
      'Build DFAs for divisibility, substring and counting conditions until it is mechanical',
      'Previous-year closure-property and decidability tables',
      'Rice’s theorem applied to a dozen properties — it settles most questions instantly',
    ],
    note: 'Everything except decidability is mechanical. Decidability and reductions are exactly where the marks get lost, so spend the time there.',
  },

  // Compiler Design
  9: {
    text: [
      'Compilers: Principles, Techniques and Tools — Aho, Lam, Sethi and Ullman (the dragon book; read the parsing chapters properly)',
      'Principles of Compiler Design — Aho and Ullman, the older and shorter one',
    ],
    lectures: [
      'NPTEL — Compiler Design, Santanu Chattopadhyay (IIT Kharagpur)',
      'NPTEL — Principles of Compiler Design, Y. N. Srikant (IISc)',
    ],
    practice: [
      'FIRST and FOLLOW for twenty grammars, then their LL(1) and LR tables',
      'Construct LR item sets and a parse table for a fresh grammar in under ten minutes',
      'Previous-year questions on parser conflicts and the grammar class hierarchy',
    ],
    note: 'Parsing tables are drillable to near-certainty. Twenty grammars worked by hand and this subject is finished.',
  },

  // Computer Networks
  10: {
    text: [
      'Computer Networking: A Top-Down Approach — Kurose and Ross (matches the 2027 scope best)',
      'Computer Networks — Andrew S. Tanenbaum, for the data link layer',
      'Data Communications and Networking — Forouzan, for error detection worked step by step',
    ],
    lectures: [
      'NPTEL — Computer Networks and Internet Protocol, Soumya Kanti Ghosh (IIT Kharagpur)',
      'NPTEL — Computer Networks, Sujoy Ghosh (IIT Kharagpur)',
    ],
    practice: [
      'Sliding-window efficiency and CSMA/CD minimum-frame-size numericals',
      'TCP congestion-window evolution plotted across rounds with losses',
      'Subnetting, CIDR and fragmentation questions from previous years',
    ],
    note: 'The syllabus was cut hard for 2027, so filter old material aggressively — anything on OSI layers, ARP, ICMP, DHCP, UDP, FTP or SMTP is no longer in scope. Lowest marks per hour after the trim, so deprioritise it deliberately.',
  },

  // General Aptitude
  11: {
    text: [
      'A Modern Approach to Verbal and Non-Verbal Reasoning — R. S. Aggarwal',
      'Quantitative Aptitude for Competitive Examinations — R. S. Aggarwal',
      'Word Power Made Easy — Norman Lewis, for the vocabulary section',
    ],
    lectures: [
      'No lecture course needed. This subject is drilled, not taught.',
    ],
    practice: [
      'General Aptitude sections of previous GATE papers from every branch, 2010 onwards',
      'One timed 25-minute set per day, every day, without exception',
      'Track time per mark — the target is under 1.4 minutes',
    ],
    note: 'The cheapest fifteen marks in the paper. Take the time from college dead time; nowhere else in the week is time allocated to it.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-chapter reading pointer: exactly which chapter of which book covers it.
//
// Chapter *titles* are given rather than only numbers wherever the numbering
// moves between editions (Galvin, Korth, Hamacher), so the pointer stays correct
// whichever printing you own. Keyed by `unitId|chapter name`.

export const GATE_CHAPTER_SOURCES: Record<string, string> = {
  // Discrete Mathematics
  '0|Propositional Logic': 'Rosen, Ch. 1 (The Foundations: Logic and Proofs), §1.1–1.3 and 1.6',
  '0|First-Order Logic': 'Rosen, Ch. 1, §1.4–1.5 (Predicates and Quantifiers, Nested Quantifiers)',
  '0|Sets, Relations and Functions': 'Rosen, Ch. 2 (Basic Structures) and Ch. 9 (Relations)',
  '0|Partial Orders and Lattices': 'Rosen, Ch. 9, §9.6 (Partial Orderings); C. L. Liu for lattices',
  '0|Monoids and Groups': 'C. L. Liu, the Algebraic Structures chapters — Rosen barely covers this',
  '0|Graph Theory': 'Rosen, Ch. 10 (Graphs) and Ch. 11 (Trees); Narsingh Deo where Rosen is thin',
  '0|Combinatorics': 'Rosen, Ch. 6 (Counting) and Ch. 8 (Advanced Counting Techniques)',

  // Digital Logic
  '1|Boolean Algebra': 'Mano, Digital Design, Ch. 2 (Boolean Algebra and Logic Gates)',
  '1|Minimisation': 'Mano, Ch. 3 (Gate-Level Minimization) — §3.6 for the tabular method',
  '1|Combinational Circuits': 'Mano, Ch. 4 (Combinational Logic)',
  '1|Sequential Circuits': 'Mano, Ch. 5 (Synchronous Sequential Logic) and Ch. 6 (Registers and Counters)',
  '1|Number Representation and Arithmetic': 'Mano, Ch. 1 (Digital Systems and Binary Numbers); Hamacher Ch. 6 for IEEE-754',

  // Programming and Data Structures
  '2|Programming in C': 'Kernighan and Ritchie, Ch. 1–6 — every chapter, including the exercises',
  '2|Recursion': 'Kernighan and Ritchie §4.10; Tenenbaum, the Recursion chapter',
  '2|Arrays, Stacks and Queues': 'Tenenbaum, the Stacks and Queues chapters',
  '2|Linked Lists': 'Tenenbaum, the Linked Lists chapter',
  '2|Trees and Binary Search Trees': 'Tenenbaum, the Trees chapter; Cormen Ch. 12 (Binary Search Trees)',
  '2|Binary Heaps': 'Cormen, Ch. 6 (Heapsort) — heap operations and build-heap analysis',
  '2|Graphs (representation)': 'Cormen, Ch. 22 (Elementary Graph Algorithms)',

  // Algorithms
  '3|Asymptotic Analysis': 'Cormen, Ch. 2–4 (growth of functions, divide-and-conquer, recurrences); Ch. 17 for amortised',
  '3|Searching': 'Cormen, Ch. 9 (Medians and Order Statistics); binary search from Tenenbaum',
  '3|Sorting': 'Cormen, Ch. 6–8 (Heapsort, Quicksort, Sorting in Linear Time)',
  '3|Hashing': 'Cormen, Ch. 11 (Hash Tables)',
  '3|Divide and Conquer': 'Cormen, Ch. 4; §4.2 for Strassen, Ch. 33 for closest pair',
  '3|Greedy Algorithms': 'Cormen, Ch. 16 (Greedy Algorithms); Kleinberg and Tardos Ch. 4 for the proofs',
  '3|Dynamic Programming': 'Cormen, Ch. 15 (Dynamic Programming); Kleinberg and Tardos Ch. 6',
  '3|Graph Algorithms': 'Cormen, Ch. 22–25 (traversal, MST, shortest paths, all-pairs)',

  // Engineering Mathematics
  '4|Linear Algebra: Matrices and Determinants': 'Grewal, the Matrices chapter; Strang Ch. 1–2 for intuition',
  '4|Systems of Linear Equations': 'Strang, Ch. 2 (Solving Linear Equations) and Ch. 3 (Vector Spaces); Grewal for LU',
  '4|Eigenvalues and Eigenvectors': 'Strang, Ch. 6 (Eigenvalues and Eigenvectors) — the clearest treatment available',
  '4|Calculus': 'Grewal, the Differential and Integral Calculus chapters',
  '4|Probability': "Grewal, the Probability chapter; Schaum's Outline for volume of solved problems",
  '4|Random Variables and Distributions': "Schaum's Outline of Probability and Statistics, the distributions chapters",
  '4|Statistics': 'Grewal, the Statistics chapter — descriptive statistics only, keep it light',

  // Computer Organisation and Architecture
  '5|Instruction Set and Addressing Modes': 'Hamacher, Ch. 2 (Machine Instructions and Programs)',
  '5|Arithmetic and Logic Unit': 'Hamacher, Ch. 6 (Arithmetic) — Booth and division traces',
  '5|Control Unit': 'Mano, Computer System Architecture, the Control Unit chapters — no previous-year question exists, so the textbook is the only source',
  '5|Memory Hierarchy and Cache': 'Hamacher, Ch. 5 (The Memory System); Patterson and Hennessy Ch. 5 for cache performance',
  '5|I/O Interface': 'Hamacher, Ch. 4 (Input/Output Organization)',
  '5|Pipelining': 'Hamacher, Ch. 8 (Pipelining); Patterson and Hennessy Ch. 4 for hazards and forwarding',

  // Operating Systems
  '6|System Calls and Processes': 'Galvin, the Operating-System Structures, Processes and Threads chapters',
  '6|Inter-process Communication and Synchronisation': 'Galvin, the Process Synchronization chapters; Tanenbaum for the classic problems',
  '6|Deadlock': 'Galvin, the Deadlocks chapter — work every Banker’s algorithm example',
  '6|CPU and I/O Scheduling': 'Galvin, the CPU Scheduling chapter',
  '6|Memory Management': 'Galvin, the Main Memory chapter (paging, segmentation, TLB)',
  '6|Virtual Memory': 'Galvin, the Virtual Memory chapter (demand paging, replacement, thrashing)',
  '6|File Systems': 'Galvin, the File-System Interface and Implementation chapters',

  // Databases
  '7|ER Model': 'Navathe, the Data Modeling Using the ER Model chapters — better than Korth here',
  '7|Relational Model and Algebra': 'Korth, the Introduction to the Relational Model and Formal Relational Query Languages chapters',
  '7|SQL': 'Korth, the Introduction to SQL and Intermediate SQL chapters',
  '7|Integrity Constraints and Normal Forms': 'Korth, the Relational Database Design chapter — the whole chapter, worked',
  '7|File Organisation and Indexing': 'Korth, the Indexing and Hashing chapter (B and B+ trees)',
  '7|Transactions and Concurrency Control': 'Korth, the Transactions, Concurrency Control and Recovery chapters',

  // Theory of Computation
  '8|Finite Automata': 'Peter Linz, Ch. 2 (Finite Automata); Hopcroft Ch. 2 for the formal treatment',
  '8|Regular Languages and Expressions': 'Peter Linz, Ch. 3 (Regular Languages) and Ch. 4 (Properties of Regular Languages)',
  '8|Context-Free Grammars and Languages': 'Peter Linz, Ch. 5 (Context-Free Languages), Ch. 6 (Simplification) and Ch. 8 (Properties)',
  '8|Push-down Automata': 'Peter Linz, Ch. 7 (Pushdown Automata)',
  '8|Turing Machines and Undecidability': 'Peter Linz, Ch. 9 and Ch. 11–12; Sipser Ch. 4–5 for decidability written clearly',

  // Compiler Design
  '9|Lexical Analysis': 'Aho (dragon book), Ch. 3 (Lexical Analysis)',
  '9|Parsing': 'Aho, Ch. 4 (Syntax Analysis) — §4.4 for LL, §4.6–4.7 for LR. The most important chapter in the book',
  '9|Syntax-Directed Translation': 'Aho, Ch. 5 (Syntax-Directed Translation)',
  '9|Runtime Environments': 'Aho, Ch. 7 (Run-Time Environments)',
  '9|Intermediate Code Generation': 'Aho, Ch. 6 (Intermediate-Code Generation)',
  '9|Optimisation and Data Flow Analysis': 'Aho, Ch. 8 (Code Generation) and Ch. 9 (Machine-Independent Optimizations), §9.1–9.3',

  // Computer Networks
  '10|Principles of Layering': 'Kurose and Ross, Ch. 1 (Computer Networks and the Internet), §1.5',
  '10|Switching and Performance': 'Kurose and Ross, Ch. 1, §1.3–1.4 (switching, delay, loss and throughput)',
  '10|Data Link Layer': 'Kurose and Ross, Ch. 6 (The Link Layer); Forouzan for error detection worked step by step',
  '10|Routing': 'Kurose and Ross, Ch. 5 (Network Layer: Control Plane), §5.2 (distance vector and link state)',
  '10|Network Layer — IPv4': 'Kurose and Ross, Ch. 4 (Network Layer: Data Plane), §4.3 (IPv4, fragmentation, CIDR, NAT)',
  '10|Transport Layer — TCP': 'Kurose and Ross, Ch. 3 (Transport Layer), §3.5–3.7 (TCP, flow and congestion control)',
  '10|Application Layer': 'Kurose and Ross, Ch. 2 (Application Layer), §2.2 (HTTP) and §2.4 (DNS) only',

  // General Aptitude
  '11|Verbal Aptitude': 'Norman Lewis for vocabulary; Wren and Martin for grammar; previous-year passages for comprehension',
  '11|Quantitative Aptitude': 'R. S. Aggarwal, Quantitative Aptitude — the arithmetic, mensuration and DI chapters',
  '11|Analytical Aptitude': 'R. S. Aggarwal, Verbal and Non-Verbal Reasoning — the logical reasoning half',
  '11|Spatial Aptitude': 'R. S. Aggarwal, Verbal and Non-Verbal Reasoning — the non-verbal half (paper folding, cubes, series)',
};

/** Reading pointer for one chapter, or null when none is written. */
export function chapterSource(unitId: number, chapterName: string): string | null {
  return GATE_CHAPTER_SOURCES[`${unitId}|${chapterName}`] ?? null;
}

export function countConcepts(units: readonly SyllabusUnit[]): number {
  return units.reduce(
    (sum, u) => sum + u.chapters.reduce((s, c) => s + c.concepts.length, 0),
    0,
  );
}
