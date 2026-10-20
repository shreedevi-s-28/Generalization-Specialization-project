/* ===== Learn topics (part 2) ===== */
T('super-sub', 'Superclass and Subclass', 'EER Core', {
  what: 'A superclass is a general entity type. A subclass is a more specific entity type whose every member is also a member of the superclass. The subclass entity and the superclass entity represent the same real-world thing.',
  beg: 'Every STUDENT is a PERSON. There is not one person record and a different student record for someone new: it is one person who plays the student role.',
  why: 'It lets you say "a student has everything a person has, plus more" without rewriting the person attributes.',
  how: ['Name the superclass with the general concept (PERSON).', 'Name each subclass with the specific role (STUDENT).', 'Give the subclass only its own attributes and relationships.', 'A subclass member must exist in the superclass.', 'A subclass can itself be a superclass (a hierarchy of levels).'],
  terms: [['Type / class', 'Entity type acting as superclass or subclass.'], ['Hierarchy', 'Each subclass has one superclass.'], ['Lattice', 'A subclass may have several superclasses (multiple inheritance).'], ['Local attributes', 'Attributes defined only on the subclass.']],
  viz: 'person', pipe: 'person', real: 'VEHICLE → CAR and BIKE. ACCOUNT → SAVINGS and CURRENT. PERSON → STUDENT → RESEARCH_STUDENT (three levels).',
  ex: { t: 'Reading a superclass/subclass diagram', steps: ['Find the box at the top: PERSON, the superclass.', 'Find the boxes under the circle: STUDENT and FACULTY, the subclasses.', 'Every STUDENT is a PERSON, but not every PERSON must be a STUDENT.', 'STUDENT has CGPA plus everything PERSON has.'] },
  mist: ['Reversing the direction: a person is not "a student".', 'Creating a subclass entity that is not present in the superclass.', 'Duplicating superclass attributes inside the subclass.'],
  exam: { defs: ['Subclass entity ⊆ superclass entity set.', 'Superclass/subclass relationship is also called IS-A or class/subclass.'], traps: ['A subclass is a subset, not a separate independent entity.'], short: ['Define superclass and subclass with an example.'], long: ['Explain superclass/subclass with attribute and relationship inheritance.'], gate: ['Every subclass entity must also be an entity of the superclass.'], net: ['Class/subclass vs type/subtype terminology.'] },
  quiz: [Q('Which is the subclass?', ['PERSON', 'STUDENT (of PERSON)', 'Both', 'Neither'], 1, 'STUDENT is the more specific class.'), Q('A subclass entity must also exist in the:', ['Superclass', 'Another subclass', 'Relationship', 'Attribute'], 0, 'Members of a subclass are members of the superclass.'), Q('A subclass with several superclasses is part of a:', ['Hierarchy', 'Lattice', 'Weak entity', 'Key'], 1, 'Multiple superclasses form a lattice.')],
  sum: 'Superclass = general, subclass = specific. One real-world entity, two roles.', next: 'isa'
});
T('isa', 'ISA Relationship', 'EER Core', {
  what: 'The ISA ("is-a") relationship links a subclass to its superclass. It is drawn as a circle (Elmasri–Navathe) or a triangle/hollow arrow (other textbooks). Inside the circle a letter shows disjoint (d) or overlapping (o). A double line to the superclass shows total participation.',
  beg: 'Read it aloud: "STUDENT is a PERSON". The circle is the small hinge that connects the general box to the specific boxes.',
  why: 'ISA is what makes EER different from ER. It is the symbol that carries inheritance and the constraints.',
  how: ['Draw a line from the superclass to a circle.', 'Draw lines from the circle to each subclass, with a subset symbol (⊂) facing the superclass.', 'Write d or o inside the circle.', 'Use a double line from the superclass for total, a single line for partial.'],
  terms: [['ISA circle', 'Holds the d/o letter.'], ['Subset symbol ⊂', 'Shows that the subclass is a subset of the superclass.'], ['Double line', 'Total specialization.'], ['Alternative notation', 'Hollow-headed arrow pointing to the superclass (Silberschatz).']],
  widget: 'cw', pipe: 'vehicle', real: 'A VEHICLE registry: the circle says d (a vehicle is not both), and the double line says every vehicle is a car or a bike.',
  ex: { t: 'Draw an ISA', steps: ['Draw VEHICLE at the top and CAR, BIKE below.', 'Add a circle below VEHICLE.', 'Connect the circle to CAR and BIKE with ⊂ marks.', 'Write d in the circle: no vehicle is both.', 'Double the line from VEHICLE: every vehicle is one of them.'] },
  mist: ['Pointing the ⊂ symbol the wrong way.', 'Forgetting the d/o letter.', 'Mixing notations from different textbooks in one diagram.'],
  exam: { defs: ['ISA = is-a relationship between class and subclass.', 'A "d" in the circle = disjoint; "o" = overlapping.'], freq: ['Reading symbols of an EER diagram'], traps: ['ISA is not an ordinary relationship: it has no attributes and no cardinality.'], short: ['What does the circle with "d" mean?'], long: ['Explain the notation for ISA with all constraints.'], gate: ['Symbols: circle+d, circle+o, double line, ⊂.'], net: ['Notation differs between books; know both.'] },
  quiz: [Q('The letter "o" in the ISA circle means:', ['Optional', 'Overlapping', 'Owner', 'One'], 1, 'o = overlapping.'), Q('A double line from superclass to the circle means:', ['Total', 'Partial', 'Weak', 'Disjoint'], 0, 'Double line = total.'), Q('Which describes ISA?', ['Ordinary M:N relationship', 'Subclass-of relationship', 'Foreign key', 'Attribute'], 1, 'ISA connects subclass to superclass.')],
  sum: 'ISA connects subclass to superclass; the circle letter and line style carry the constraints.', next: 'attr-inherit'
});
T('attr-inherit', 'Attribute Inheritance', 'EER Core', {
  what: 'A subclass inherits every attribute of its superclass (including the key) and may add local attributes. The entity in the subclass therefore has inherited plus local attributes.',
  beg: 'A child inherits eye colour from parents and also has personal traits. A STUDENT inherits Name and Address from PERSON and adds CGPA.',
  why: 'Inheritance is why common attributes are stored once. It also explains why a subclass needs no key of its own.',
  how: ['List the superclass attributes: they flow down to every subclass.', 'Add the subclass local attributes.', 'In multi-level hierarchies, inheritance passes through each level.', 'Do not redefine an inherited attribute in the subclass.'],
  terms: [['Inherited attribute', 'Comes from a superclass.'], ['Local (specific) attribute', 'Defined only on the subclass.'], ['Multiple inheritance', 'Attributes come from several superclasses in a lattice.']],
  viz: 'person', pipe: 'person', real: 'STUDENT = Person_ID, Name, Address, Phone (inherited) + CGPA (local).',
  ex: { t: 'Count attributes with inheritance', steps: ['PERSON has 4 attributes: Person_ID, Name, Address, Phone.', 'STUDENT defines 1 local attribute: CGPA.', 'STUDENT therefore has 4 + 1 = 5 attributes in total.', 'FACULTY likewise has 4 + 1 = 5.', 'Try "Show inherited attributes" in the Visualizer to see them.'] },
  mist: ['Repeating Name in STUDENT again.', 'Believing a superclass inherits from its subclasses.', 'Giving the subclass a separate primary key.'],
  exam: { defs: ['Subclass has all attributes of the superclass plus its own.'], freq: ['Count of attributes of a subclass'], traps: ['Inheritance flows downward only.'], pat: ['"How many attributes does subclass X have?" — add inherited and local.'], short: ['What is attribute inheritance?'], long: ['Explain attribute and relationship inheritance with a diagram.'], gate: ['Total attributes of a subclass = own + all ancestors\' attributes.'], net: ['Inheritance and code reuse analogy with OOP.'] },
  quiz: [Q('PERSON has 4 attributes and STUDENT adds 1. STUDENT has:', ['1', '4', '5', '9'], 2, '4 inherited + 1 local = 5.'), Q('Inheritance flows from:', ['Subclass to superclass', 'Superclass to subclass', 'Both ways', 'Neither'], 1, 'Downward.'), Q('Should STUDENT define its own primary key?', ['Yes, always', 'No, it inherits the superclass key', 'Only if weak', 'Only if partial'], 1, 'It inherits the key.')],
  sum: 'Subclass = inherited attributes + local attributes. Inheritance flows downward.', next: 'rel-inherit'
});
T('rel-inherit', 'Relationship Inheritance', 'EER Core', {
  what: 'A subclass takes part in every relationship its superclass takes part in, and it may have relationships of its own that the superclass does not.',
  beg: 'If every employee works for a department, then a manager (an employee) also works for a department. But only managers manage a department, so MANAGES belongs to MANAGER alone.',
  why: 'Attaching a relationship at the right level avoids nonsense (a non-manager managing a department) and avoids repeating the relationship on each subclass.',
  how: ['If all subclasses take part, attach the relationship to the superclass.', 'If only one subclass takes part, attach it to that subclass.', 'A subclass inherits all relationships of its ancestors.', 'When mapping, relationships on a superclass reference the superclass table.'],
  terms: [['Inherited relationship', 'Comes from a superclass.'], ['Local relationship', 'Defined only on the subclass.']],
  viz: 'empdept', pipe: 'empdept', real: 'WORKS_FOR is on EMPLOYEE, so MANAGER inherits it. MANAGES is on MANAGER only.',
  ex: { t: 'Decide where to attach', steps: ['Rule: "Every employee works for one department." → WORKS_FOR on EMPLOYEE.', 'Rule: "Each department has one manager." → MANAGES on MANAGER.', 'MANAGER inherits WORKS_FOR without redrawing it.', 'In tables: EMPLOYEE has Dept_ID; MANAGER (person key) links to the department it manages.'] },
  mist: ['Redrawing the inherited relationship on every subclass.', 'Attaching a subclass-only relationship to the superclass.'],
  exam: { defs: ['Subclass participates in all relationships of the superclass.'], traps: ['Relationships of a subclass are not inherited upward.'], short: ['Explain relationship inheritance.'], long: ['With an example, show inherited and local relationships and their mapping.'], gate: ['Subclass inherits both attributes and relationship types.'], net: ['Where to place a relationship in a hierarchy.'] },
  quiz: [Q('MANAGES applies only to managers. Attach it to:', ['EMPLOYEE', 'MANAGER', 'DEPARTMENT', 'Nothing'], 1, 'Attach at the level where all participants are covered.'), Q('Does MANAGER take part in WORKS_FOR (declared on EMPLOYEE)?', ['Yes', 'No', 'Only if total', 'Only if partial'], 0, 'Subclasses inherit relationships.'), Q('Inheritance of relationships flows:', ['Downward', 'Upward', 'Sideways', 'Not at all'], 0, 'From superclass to subclass.')],
  sum: 'Subclasses inherit the superclass relationships and may add their own.', next: 'disjoint'
});
T('disjoint', 'Disjoint Constraint', 'Constraints', {
  what: 'A specialization is disjoint if an entity of the superclass can be a member of at most one of its subclasses. It is shown by the letter d in the ISA circle.',
  beg: 'A vehicle registered as a CAR cannot also be registered as a BIKE. The groups do not overlap.',
  why: 'Disjointness allows simple mappings (one type column) and states a business rule the database can enforce.',
  how: ['Ask: "Can one entity be in two subclasses at once?"', 'If never → disjoint (d).', 'Draw d in the circle.', 'Map with a type column (Option C) or separate tables (Option A).'],
  terms: [['Disjoint (d)', 'Subclass memberships are mutually exclusive.'], ['Attribute-defined', 'A defining attribute (Type) decides the single subclass.']],
  widget: 'cw', pipe: 'vehicle', real: 'Individual vs corporate customer; savings vs current account; car vs bike.',
  ex: { t: 'Test for disjointness', steps: ['Take the subclasses CAR and BIKE.', 'Try to imagine one vehicle in both. Not possible.', 'Conclusion: disjoint. Write d.', 'Mapping tip: a single Vehicle_Type column can hold the answer.'] },
  mist: ['Choosing d because "it feels normal" without checking real cases.', 'Confusing disjoint with total.'],
  exam: { defs: ['Disjoint: subclasses are pairwise disjoint sets.'], freq: ['d vs o', 'Which mapping suits disjoint?'], traps: ['Disjoint says nothing about whether every entity is in a subclass; that is completeness.'], short: ['Explain disjoint constraint with an example.'], long: ['Compare disjoint and overlapping constraints with diagrams.'], gate: ['Disjoint + total ⇒ each superclass entity is in exactly one subclass.'], net: ['Constraint symbols d and o.'] },
  quiz: [Q('Disjoint means an entity belongs to:', ['At most one subclass', 'At least one subclass', 'All subclasses', 'No subclass'], 0, 'At most one.'), Q('Which is disjoint?', ['Doctor / Patient', 'Manager / Engineer (can be both)', 'Car / Bike', 'Student / TA'], 2, 'A vehicle cannot be a car and a bike.'), Q('The letter for disjoint in the circle is:', ['o', 'd', 't', 'p'], 1, 'd.')],
  sum: 'Disjoint: at most one subclass per entity. Letter d.', next: 'overlapping'
});
T('overlapping', 'Overlapping Constraint', 'Constraints', {
  what: 'A specialization is overlapping if the same superclass entity can belong to more than one subclass at once. It is shown by the letter o in the circle.',
  beg: 'A doctor who is admitted to hospital is both a DOCTOR and a PATIENT. One person, two roles.',
  why: 'It tells designers not to use a single type column, because one value cannot record two roles.',
  how: ['Ask: "Can one entity be in two subclasses?"', 'If yes → overlapping (o).', 'Draw o in the circle.', 'Map with boolean flags (Option D) or separate tables (Option A).'],
  terms: [['Overlapping (o)', 'An entity may be in several subclasses.'], ['Role', 'Each subclass membership is a role.']],
  widget: 'cw', pipe: 'hospital', real: 'Doctor and patient; manager and engineer; student and teaching assistant.',
  ex: { t: 'Test for overlap', steps: ['Take DOCTOR and PATIENT.', 'A doctor can fall ill and be admitted → the same person is in both.', 'Conclusion: overlapping. Write o.', 'Mapping: Is_Doctor and Is_Patient flags, or subclass tables sharing Person_ID.'] },
  mist: ['Using a single type column for overlapping subclasses.', 'Assuming overlapping means total.'],
  exam: { defs: ['Overlapping: subclass sets may intersect.'], freq: ['Mapping of overlapping specialization'], traps: ['Overlapping ≠ partial. They are different constraints.'], short: ['Give an example of overlapping specialization.'], long: ['Explain the four constraint combinations.'], gate: ['Overlapping specializations need multiple flags or separate tables.'], net: ['Overlap and role modelling.'] },
  quiz: [Q('Overlapping allows an entity to be in:', ['Only one subclass', 'More than one subclass', 'No subclass only', 'Exactly two subclasses'], 1, 'One or more subclasses.'), Q('Best single-table mapping for overlapping subclasses:', ['One type column', 'Boolean flag per subclass', 'No mapping', 'Drop subclasses'], 1, 'Flags can be true together.'), Q('The letter is:', ['o', 'd', 'p', 't'], 0, 'o.')],
  sum: 'Overlapping: an entity may be in several subclasses. Letter o.', next: 'total'
});
T('total', 'Total Specialization', 'Constraints', {
  what: 'A specialization is total if every entity of the superclass must belong to at least one of the subclasses. It is drawn with a double line from the superclass to the ISA circle.',
  beg: 'A bank offers only savings and current accounts. There is no such thing as an account that is neither.',
  why: 'Totality lets you drop the superclass table (Option B) and lets you make the type column NOT NULL.',
  how: ['Ask: "Is there any superclass entity that fits none of the subclasses?"', 'If none → total. Draw a double line.', 'Consider NOT NULL on type columns.', 'Subclass-only tables (Option B) become possible.'],
  terms: [['Total', 'Every superclass entity is in a subclass.'], ['Double line', 'The notation.']],
  widget: 'cw', pipe: 'account', real: 'Account → Savings or Current. Vehicle → Car or Bike.',
  ex: { t: 'Test for totality', steps: ['List the subclasses: SAVINGS, CURRENT.', 'Can an ACCOUNT be neither? No.', 'Conclusion: total. Double line.', 'Mapping: Option B is possible, or Option C with a NOT NULL type.'] },
  mist: ['Confusing total specialization with total participation in a relationship.', 'Choosing total when a "miscellaneous" case exists.'],
  exam: { defs: ['Total: every superclass entity belongs to some subclass.'], freq: ['Total + disjoint combination'], traps: ['Total does not prevent overlap.'], short: ['Define total specialization.'], long: ['Explain completeness constraints with mapping implications.'], gate: ['Total + disjoint: exactly one subclass per entity.'], net: ['Double line = total.'] },
  quiz: [Q('Total specialization means every superclass entity is in:', ['No subclass', 'At least one subclass', 'Exactly two subclasses', 'All subclasses'], 1, 'At least one subclass.'), Q('Total is drawn as a:', ['Dashed line', 'Double line', 'Wavy line', 'Arrow'], 1, 'Double line.'), Q('Which mapping is only safe when total?', ['Subclass tables only', 'Separate tables for all classes', 'Boolean flags', 'Type column'], 0, 'Without a superclass table, entities in no subclass would be lost.')],
  sum: 'Total: no superclass entity is left outside the subclasses. Double line.', next: 'partial'
});
T('partial', 'Partial Specialization', 'Constraints', {
  what: 'A specialization is partial if some superclass entities may belong to none of the subclasses. It is drawn with a single line from the superclass to the circle (the default).',
  beg: 'In a university some people are neither students nor faculty: visitors, alumni, suppliers. PERSON is a partial specialization.',
  why: 'Partial means the superclass table must remain, so everyone can be stored.',
  how: ['Ask: "Can a superclass entity exist that fits no subclass?"', 'If yes → partial. Single line.', 'Keep the superclass table in the mapping.', 'Type columns must allow NULL.'],
  terms: [['Partial', 'Some superclass entities are in no subclass.'], ['Single line', 'The notation.']],
  widget: 'cw', pipe: 'person', real: 'PERSON → STUDENT/FACULTY with visitors outside. EMPLOYEE → MANAGER/ENGINEER with clerks outside.',
  ex: { t: 'Test for partial', steps: ['List the subclasses: STUDENT, FACULTY.', 'Can a PERSON be neither? Yes: a visitor.', 'Conclusion: partial. Single line.', 'Mapping: keep the PERSON table; use Option A, C (nullable type) or D.'] },
  mist: ['Calling a specialization partial because you did not model all subclasses (unmodelled ones still make it partial only if such entities exist).', 'Confusing partial with overlapping.'],
  exam: { defs: ['Partial: superclass entity may belong to no subclass.'], freq: ['Partial vs overlapping'], traps: ['Partial does not mean the subclasses overlap.'], short: ['What is partial specialization?'], long: ['Explain all four combinations with examples and mapping.'], gate: ['Partial specialization requires the superclass relation in mapping.'], net: ['Single line = partial.'] },
  quiz: [Q('Partial means:', ['Every entity is in a subclass', 'Some entities may be in no subclass', 'Entities are in two subclasses', 'No subclasses'], 1, 'Some entities are outside all subclasses.'), Q('Drawn as:', ['Single line', 'Double line', 'Circle', 'Diamond'], 0, 'Single line.'), Q('Which mapping loses data for partial specializations?', ['Subclass tables only', 'Separate tables', 'Flags', 'Type column'], 0, 'Entities in no subclass have no table.')],
  sum: 'Partial: some superclass entities are outside all subclasses. Single line.', next: 'gen-vs-spec'
});
T('gen-vs-spec', 'Generalization vs Specialization', 'Constraints', {
  what: 'They describe the same superclass/subclass structure viewed from opposite directions. Generalization goes bottom-up from similar entities to a superclass. Specialization goes top-down from a superclass to subclasses.',
  beg: 'Climbing a tree from the leaves to the trunk is generalization. Walking from the trunk out to the leaves is specialization. It is the same tree.',
  why: 'Exams ask for the difference, and designers need both directions: start from what you know and refine.',
  how: ['Have several similar entities? Generalize.', 'Have one entity with subgroups? Specialize.', 'The final diagram looks the same either way.', 'Add constraints afterward.'],
  terms: [['Bottom-up', 'Generalization.'], ['Top-down', 'Specialization.'], ['Abstraction', 'Ignoring differences to see commonality.']],
  widget: 'gen', pipe: 'person', real: 'Merging STUDENT and FACULTY into PERSON (generalization). Splitting PERSON into STUDENT and FACULTY (specialization).',
  ex: { t: 'Same structure, two views', steps: ['Start A: STUDENT and FACULTY exist. Common attributes are moved up → generalization.', 'Start B: PERSON exists. Subgroups are defined → specialization.', 'Both end with PERSON, STUDENT, FACULTY and an ISA.'] },
  mist: ['Thinking the two produce different diagrams.', 'Mixing up the directions in exams.'],
  exam: { defs: ['Generalization: bottom-up, emphasises similarities. Specialization: top-down, emphasises differences.'], freq: ['Table of differences'], traps: ['Neither adds new entity instances; they organize types.'], short: ['Differentiate generalization and specialization (4 points).'], long: ['Explain both with diagrams and mapping.'], gate: ['Both are represented by the same ISA structure.'], net: ['Approach, process, focus, result.'] },
  quiz: [Q('Bottom-up design of superclass is:', ['Specialization', 'Generalization', 'Aggregation', 'Categorization'], 1, 'Generalization.'), Q('Specialization emphasises:', ['Similarities', 'Differences between subgroups', 'Deleting attributes', 'Keys'], 1, 'Differences.'), Q('Do the two give different diagrams?', ['Yes', 'No, same structure', 'Only for total', 'Only for weak'], 1, 'Same ISA structure.')],
  sum: 'Same structure, opposite directions.', next: 'eer-examples'
});
T('eer-examples', 'EER Diagram Examples', 'Practice with EER', {
  what: 'Worked EER examples covering single and multiple subclasses, overlap, total specialization, relationships and relationship inheritance.',
  beg: 'Reading many small diagrams is the fastest way to learn to draw your own.',
  why: 'Patterns repeat. Once you have seen Person, Vehicle and Employee patterns, new problems look familiar.',
  how: ['Open an example.', 'Read the problem, then the analysis.', 'Look at the diagram and check each symbol against the problem.', 'Open the example in the Visualizer and change a constraint to see the effect.'],
  terms: [['Pattern', 'A recurring modelling situation.']],
  viz: 'university', real: 'The Examples page has eight ready models with generated schema and SQL.',
  ex: { t: 'How to use the examples', steps: ['Open Examples from the menu.', 'Pick "Employee → Manager / Engineer".', 'Read why the constraints are overlapping and partial.', 'Click "Open in Visualizer" and try changing o to d.', 'Compare the SQL before and after.'] },
  mist: ['Memorising diagrams without understanding the constraints.'],
  exam: { defs: ['Know one example per constraint combination.'], traps: ['Examples in exams often hide the constraint in the wording ("can be both").'], short: ['Draw an EER for vehicles.'], long: ['Draw an EER for a university with departments, students and faculty.'], gate: ['Read words like "every", "at most one" and "can be both" to get constraints.'], net: ['Practise drawing quickly.'] },
  quiz: [Q('"A person can be both a doctor and a patient" signals:', ['Disjoint', 'Overlapping', 'Total', 'Weak'], 1, 'Both roles → overlapping.'), Q('"Every account is savings or current" signals:', ['Partial', 'Total', 'Weak', 'Derived'], 1, 'Every → total.'), Q('"Some people are neither" signals:', ['Total', 'Partial', 'Disjoint', 'Overlapping'], 1, 'Some outside → partial.')],
  sum: 'Practise by reading, then changing, example models.', next: 'map-eer'
});
T('map-eer', 'Mapping EER to Relational Schema', 'Mapping', {
  what: 'Mapping converts an EER diagram into relational tables. Regular entities become tables; relationships become foreign keys or link tables; weak entities and multi-valued attributes get their own tables; specializations use one of four options.',
  beg: 'A diagram is a plan; tables are the bricks. The mapping rules tell you which bricks each part of the plan needs.',
  why: 'A relational DBMS stores tables, not diagrams. A correct mapping keeps all diagram information.',
  how: ['Regular entity → table with its simple attributes; primary key from the key.', 'Weak entity → table with owner key + partial key as primary key.', '1:1 → foreign key in one table (prefer the side with total participation).', '1:N → foreign key on the N side.', 'M:N → new table with both keys as a composite primary key.', 'Multi-valued attribute → new table (entity key + value).', 'Superclass/subclass → choose option A, B, C or D.'],
  terms: [['Foreign key', 'Implements a relationship.'], ['Link table', 'Table for an M:N relationship.'], ['Composite key', 'Key made of several columns.']],
  viz: 'erbasic', pipe: 'erbasic', real: 'STUDENT and COURSE become tables; ENROLLS becomes a table with (Roll_No, Course_ID, Grade).',
  ex: { t: 'Map STUDENT–ENROLLS–COURSE', steps: ['Table STUDENT(Roll_No PK, Name, Email).', 'Table COURSE(Course_ID PK, Title, Credits).', 'ENROLLS is M:N → table ENROLLS(Roll_No, Course_ID, Grade).', 'PRIMARY KEY (Roll_No, Course_ID).', 'Two foreign keys point to STUDENT and COURSE.'] },
  mist: ['Putting the foreign key on the wrong side.', 'Forgetting the relationship attribute in M:N.', 'Dropping total participation (NOT NULL).'],
  exam: { defs: ['Seven-step ER-to-relational algorithm (Elmasri & Navathe).'], freq: ['Count of tables for a given diagram'], traps: ['1:1 and 1:N do not create new tables (in the basic algorithm).'], pat: ['"Minimum number of tables = entities + M:N relationships"'], short: ['How is an M:N relationship mapped?'], long: ['Map a complete EER diagram to relations.'], gate: ['Minimum tables: one per entity set, plus one per M:N relationship; 1:1 and 1:N merge into entity tables.'], net: ['Steps of ER to relational mapping.'] },
  quiz: [Q('An M:N relationship becomes:', ['A foreign key in one table', 'A new table', 'An attribute', 'A view'], 1, 'A link table.'), Q('For 1:N, the foreign key goes to the:', ['1 side', 'N side', 'New table', 'Both'], 1, 'N side.'), Q('Weak entity primary key is:', ['Partial key', 'Owner key + partial key', 'Random', 'None'], 1, 'Owner key plus partial key.')],
  sum: 'Entities → tables, relationships → keys or link tables, ISA → one of four options.', next: 'map-gen-spec'
});
T('map-gen-spec', 'Mapping Generalization/Specialization to Tables', 'Mapping', {
  what: 'There are four standard ways to turn a superclass/subclass structure into tables. The best choice depends on whether the specialization is total or partial and disjoint or overlapping.',
  beg: 'You can keep one drawer per class (A), keep drawers only for the specific classes (B), put everything in one drawer with a label (C), or with several yes/no tags (D).',
  why: 'Each option trades off table count, NULLs, joins and correctness. A wrong option can lose data or duplicate it.',
  how: ['Option A: a table for the superclass and one per subclass. Subclass key = superclass key (also FK). Works for every case.', 'Option B: tables only for subclasses, each with the inherited columns. Needs total; overlapping duplicates data.', 'Option C: one table with a type column. For disjoint subclasses; subclass columns are NULL for other types.', 'Option D: one table with a boolean flag per subclass. For overlapping (or disjoint) subclasses.', 'Use the explorer below to see the tables and SQL for each option.'],
  terms: [['Discriminator / type column', 'Says which subclass a row belongs to.'], ['Flag columns', 'One boolean per subclass.'], ['Redundancy', 'Same entity stored in several tables.']],
  widget: 'strat', real: 'A bank with total, disjoint accounts can use one table with Account_Type, or separate Savings and Current tables.',
  ex: { t: 'Choose an option', steps: ['Read the constraints: total or partial? disjoint or overlapping?', 'Partial → keep the superclass table (A, C or D).', 'Overlapping → not C (use A or D).', 'Total + disjoint → any option works; B and C are compact.', 'Prefer A when unsure: it is always correct.'] },
  mist: ['Using B for a partial specialization.', 'Using C for overlapping subclasses.', 'Forgetting that C and D create many NULLs.'],
  exam: { defs: ['8A multiple relations (superclass and subclasses), 8B subclass relations only, 8C single relation with one type attribute, 8D single relation with multiple type attributes (Elmasri & Navathe numbering).'], freq: ['Which option for which constraint'], traps: ['Option B needs total; option C needs disjoint.'], pat: ['"Which mapping is unsuitable for overlapping subclasses?"'], short: ['List the options for mapping specialization.'], long: ['Explain all four options with an example and their trade-offs.'], gate: ['Match constraints (d/o, total/partial) to mapping options.'], net: ['Advantages and disadvantages of each option.'] },
  quiz: [Q('Option A creates:', ['Only subclass tables', 'Superclass table plus a table per subclass', 'One table', 'No tables'], 1, 'Every class gets a table.'), Q('Unsafe for a PARTIAL specialization:', ['Option A', 'Option B', 'Option C', 'Option D'], 1, 'Superclass-only entities have no home in B.'), Q('Best single-table option for overlapping subclasses:', ['C', 'D', 'B', 'None'], 1, 'D, boolean flags.'), Q('A drawback of C and D:', ['Many NULLs', 'No keys', 'Cannot store data', 'No SQL'], 0, 'Subclass columns are NULL for other rows.')],
  sum: 'A is always safe; B needs total; C needs disjoint; D handles overlap.', next: 'map-sql'
});
T('map-sql', 'Mapping to SQL', 'Mapping', {
  what: 'After choosing the relational schema, SQL DDL creates the tables with primary keys, foreign keys and NOT NULL/UNIQUE constraints. The Visualizer generates this SQL from the model.',
  beg: 'The schema is the blueprint; SQL is the instruction the database follows to build it.',
  why: 'SQL enforces the model: keys stop duplicates, foreign keys stop orphans, NOT NULL enforces total participation.',
  how: ['Create parent tables before children (foreign keys must have a target).', 'Write the primary key inline or as a table constraint.', 'Add FOREIGN KEY constraints; use ON DELETE CASCADE for subclass tables.', 'Add NOT NULL for total participation; UNIQUE for 1:1 foreign keys.', 'Run the script and test with sample rows.'],
  terms: [['DDL', 'CREATE TABLE and friends.'], ['Referential integrity', 'Foreign keys must point to existing rows.'], ['ON DELETE CASCADE', 'Deleting a parent row deletes dependent rows.']],
  pipe: 'person', real: 'STUDENT is created with person_id as PRIMARY KEY and FOREIGN KEY to PERSON.',
  ex: { t: 'Write the SQL for PERSON and STUDENT', steps: ['CREATE TABLE Person (person_id INT PRIMARY KEY, name VARCHAR(100), ...);', 'CREATE TABLE Student (person_id INT PRIMARY KEY, cgpa DECIMAL(3,2), FOREIGN KEY (person_id) REFERENCES Person(person_id));', 'Person is created first so the reference is valid.', 'Insert a person, then a student with the same person_id.'] },
  mist: ['Creating child tables before parents.', 'Using different data types for a key and its foreign key.'],
  exam: { defs: ['Referential integrity: FK value is NULL or matches a PK value.'], traps: ['A foreign key may be NULL unless declared NOT NULL.'], short: ['Write SQL for a weak entity table.'], long: ['Write the schema and SQL for a given EER diagram.'], gate: ['Know FOREIGN KEY, ON DELETE options.'], net: ['DDL command syntax.'] },
  quiz: [Q('Which constraint enforces total participation on an FK column?', ['UNIQUE', 'NOT NULL', 'CHECK only', 'DEFAULT'], 1, 'NOT NULL forces a value.'), Q('Which table must be created first?', ['Child', 'Parent (referenced)', 'Any', 'Junction'], 1, 'Referenced tables first.'), Q('A subclass table key is:', ['PK and FK to the superclass', 'A new surrogate only', 'No key', 'UNIQUE only'], 0, 'Both primary and foreign key.')],
  sum: 'SQL DDL turns the schema into enforceable tables.', next: 'exam-problems'
});
T('exam-problems', 'Common Exam Problems', 'Exam Prep', {
  what: 'Typical question types on EER: identify superclass and subclasses from a story, read constraints from a diagram, choose a mapping option, count tables, and draw the EER for a given description.',
  beg: 'Most questions follow a small number of patterns. Learn the pattern, then only the story changes.',
  why: 'Time in exams is short. A checklist helps you get constraints right quickly.',
  how: ['Underline nouns: candidate entities.', 'Find shared attributes: superclass.', 'Read quantifiers: "every" → total; "some may be neither" → partial.', 'Read "can be both" → overlapping; "only one" → disjoint.', 'Choose the mapping option from the constraints.', 'Draw neatly: circle, letter, ⊂ symbols, double line.'],
  terms: [['Quantifier words', '"every", "each", "some", "at most one", "can be both".']],
  viz: 'employee', real: 'Story: "Employees are managers or engineers; a few are both; some are clerks." → overlapping, partial.',
  ex: { t: 'Checklist on one problem', steps: ['Story: "A bank has savings and current accounts only. No account is both."', 'Superclass: ACCOUNT.', '"only" → total.', '"No account is both" → disjoint.', 'Mapping: A, B or C all work.'] },
  mist: ['Ignoring quantifier words.', 'Drawing the ⊂ symbol the wrong way.', 'Skipping the key.'],
  exam: { defs: ['Constraint keywords table.'], freq: ['Constraints from story', 'Mapping choice', 'Attribute counts'], traps: ['Do not assume total unless the text says every entity must be in a subclass.'], pat: ['Story → EER → tables'], short: ['State the constraint for a described situation.'], long: ['Full design problem with diagram, schema and SQL.'], gate: ['Practise constraint identification from text.'], net: ['Definition + example answers.'] },
  quiz: [Q('"Some employees are neither managers nor engineers" implies:', ['Total', 'Partial', 'Disjoint', 'Weak'], 1, 'Some outside → partial.'), Q('"An employee can be both" implies:', ['Disjoint', 'Overlapping', 'Total', 'Partial'], 1, 'Both → overlapping.'), Q('"Every vehicle is a car or a bike" implies:', ['Total', 'Partial', 'Overlapping', 'Weak'], 0, 'Every → total.')],
  sum: 'Use quantifier words to fix d/o and total/partial, then choose the mapping.', next: 'gate-net'
});
T('gate-net', 'GATE / UGC NET Concepts', 'Exam Prep', {
  what: 'A concept summary of the EER topics that competitive exams such as GATE and UGC NET usually test. These are study notes, not past-year questions.',
  beg: 'Think of this page as a revision sheet: definitions, formulas and traps in one place.',
  why: 'Competitive questions test precision: small wording differences change the answer.',
  how: ['Memorise the four constraint combinations.', 'Know the four mapping options and when each is valid.', 'Know table-count rules for ER-to-relational mapping.', 'Know attribute and relationship inheritance.', 'Practise with the Practice bank and the AI Quiz, then attempt real past papers from official sources.'],
  terms: [['d/o', 'Disjoint / overlapping.'], ['total/partial', 'Completeness.']],
  real: 'Official question papers are the best source of real previous-year questions. Add verified ones in Competitive Questions.',
  ex: { t: 'Revision sequence', steps: ['Day 1: ER basics, keys, cardinality.', 'Day 2: generalization, specialization, inheritance.', 'Day 3: constraints and mapping options.', 'Day 4: practice bank and weak-topic revision.', 'Day 5: timed competitive questions and past papers.'] },
  mist: ['Relying on memorised answers instead of reasoning.'],
  exam: { defs: ['Total + disjoint = partition of the superclass.'], freq: ['Minimum tables', 'Constraints from text', 'Mapping choice'], traps: ['Wording: "at least", "at most", "exactly".'], short: ['Revision list of definitions.'], long: ['Design + mapping problems.'], gate: ['Minimum tables = entities + M:N relationships (basic mapping). Weak entity key = owner key + partial key. Subclass inherits key.'], net: ['Terminology and notations across textbooks.'] },
  quiz: [Q('Total + disjoint forms a:', ['Partition of the superclass', 'Lattice', 'Weak entity', 'View'], 0, 'Every entity in exactly one subclass.'), Q('Minimum tables for 3 entities with one M:N and one 1:N:', ['3', '4', '5', '2'], 1, '3 entities + 1 M:N table = 4.'), Q('Which needs the superclass table kept?', ['Total specialization', 'Partial specialization', 'Neither', 'Both'], 1, 'Partial.')],
  sum: 'Precision wins: constraints, mapping options and table counts.', next: 'practice'
});
T('practice', 'Practice Problems', 'Exam Prep', {
  what: 'The Practice section has questions on every EER topic with hints, answers and explanations.',
  beg: 'Learning sticks when you try to recall it. Practice is the recall step.',
  why: 'Attempts feed your progress and weak-topic detection.',
  how: ['Open Practice and filter by type or topic.', 'Read the question and try before opening the hint.', 'Submit and read the explanation.', 'Check Progress for topics that need work.'],
  terms: [['Weak topic', 'A topic where you often answer wrongly.']],
  real: 'Question types: identify, generalization/specialization, constraints, mapping, table mapping, SQL, diagram interpretation.',
  ex: { t: 'A good practice loop', steps: ['Pick a topic.', 'Answer 5 questions.', 'Read every explanation, even for right answers.', 'Repeat the ones you got wrong the next day.'] },
  mist: ['Opening the hint before thinking.'],
  exam: { defs: ['Timed practice builds speed.'], traps: ['Guessing without reading options.'], short: ['Try 10 questions.'], long: ['Full mixed set.'], gate: ['Focus on constraints and mapping.'], net: ['Definitions and notations.'] },
  quiz: [Q('Best use of a hint:', ['Open it first', 'After trying', 'Never', 'Always'], 1, 'Try first.'), Q('Wrong answers are useful because they:', ['Show weak topics', 'Lower your score', 'Are hidden', 'Are deleted'], 0, 'They reveal gaps.'), Q('Where do attempts appear?', ['Progress', 'Nowhere', 'Help', 'Home only'], 0, 'On the Progress page.')],
  sum: 'Practice turns reading into recall. Use it often.', next: 'competitive', link: 'practice'
});
T('competitive', 'Competitive Questions', 'Exam Prep', {
  what: 'A dedicated section for GATE, UGC NET and university competitive examination questions covering complex EER hierarchies, constraints, and mappings.',
  beg: 'Challenging exam-level problems designed to test rigorous theoretical and design mastery.',
  why: 'Competitive examinations test edge cases, constraint combinations, and formal schema transformations.',
  how: ['Filter by difficulty or topic.', 'Start a timed competitive set.', 'Answer questions under the timer and review detailed step-by-step explanations.', 'Track your marks and accuracy in your Student Profile.'],
  terms: [['Competitive Question', 'Challenging multiple-choice exam question with assigned marks and detailed explanation.']],
  real: 'Test yourself on multiple inheritance lattices, overlapping total mappings, and aggregation.',
  ex: { t: 'Attempt competitive questions', steps: ['Open Competitive Questions from navigation.', 'Filter by difficulty (e.g. Hard).', 'Launch the timed quiz.', 'Review answers and marks obtained.'] },
  mist: ['Assuming partial specialization can be mapped to subclass-only tables.'],
  exam: { defs: ['Always verify disjointness and completeness independent constraints.'], traps: ['Watch out for multiple inheritance key redundancies.'], short: ['Attempt 5 competitive questions.'], long: ['Attempt a full timed competitive set.'], gate: ['GATE questions emphasize minimum table count and referential actions.'], net: ['UGC NET questions emphasize formal definitions and constraint partitions.'] },
  quiz: [Q('Competitive questions test:', ['Deep EER concepts and exam-level problems', 'Only easy definitions', 'Unrelated programming syntax', 'Nothing'], 0, 'Deep EER concepts and exam-level problems.'), Q('Completing competitive questions improves:', ['Your competitive score and mastery', 'Nothing', 'Deletes attempts', 'Resets progress'], 0, 'Your competitive score and mastery.'), Q('Best way to prepare for competitive DB exams:', ['Practice edge cases and mapping options', 'Memorize random questions', 'Skip diagrams', 'Ignore constraints'], 0, 'Practice edge cases and mapping options.')],
  sum: 'Challenging competitive questions built for rigorous academic mastery.', link: 'competitive'
});

const GROUPS = ['Foundations', 'ER Model', 'EER Core', 'Constraints', 'Practice with EER', 'Mapping', 'Exam Prep'];
const topicById = id => TOPICS.find(t => t.id === id);
const SEED_RESOURCES = [
  { id: 'r1', title: 'Fundamentals of Database Systems: Elmasri & Navathe', type: 'Reference book', desc: 'Chapters on the ER and Enhanced ER (EER) models. Source of the mapping options A–D used here.', url: '', topic: 'eer-model', seed: true },
  { id: 'r2', title: 'Database System Concepts: Silberschatz, Korth & Sudarshan', type: 'Reference book', desc: 'Chapter on the entity-relationship model, including extended features such as specialization and generalization.', url: '', topic: 'generalization', seed: true }
];
