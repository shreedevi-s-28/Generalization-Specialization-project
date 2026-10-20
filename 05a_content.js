/* ===== Content: models, examples, practice ===== */
const MODEL_SPECS = {
  person: ['University people', { E: { PERSON: ['Person_ID:INT:pk', 'Name', 'Address', 'Phone:VARCHAR(20)'], STUDENT: ['CGPA:DECIMAL(3,2)'], FACULTY: ['Salary:DECIMAL(10,2)'] }, ISA: [{ sup: 'PERSON', subs: ['STUDENT', 'FACULTY'], d: true, t: false }] }],
  person3: ['Person specialized', { E: { PERSON: ['Person_ID:INT:pk', 'Name', 'Address'], STUDENT: ['CGPA:DECIMAL(3,2)'], FACULTY: ['Salary:DECIMAL(10,2)'], STAFF: ['Grade:VARCHAR(10)'] }, ISA: [{ sup: 'PERSON', subs: ['STUDENT', 'FACULTY', 'STAFF'], d: true, t: false }] }],
  student: ['Student is a Person', { E: { PERSON: ['Person_ID:INT:pk', 'Name', 'Address', 'DOB:DATE'], STUDENT: ['CGPA:DECIMAL(3,2)', 'Enroll_Year:INT'] }, ISA: [{ sup: 'PERSON', subs: ['STUDENT'], d: true, t: false }] }],
  faculty: ['Faculty is a Person', { E: { PERSON: ['Person_ID:INT:pk', 'Name', 'Address', 'DOB:DATE'], FACULTY: ['Salary:DECIMAL(10,2)', 'Designation:VARCHAR(50)'] }, ISA: [{ sup: 'PERSON', subs: ['FACULTY'], d: true, t: false }] }],
  employee: ['Employee overlap', { E: { EMPLOYEE: ['Emp_ID:INT:pk', 'Name', 'Salary:DECIMAL(10,2)'], MANAGER: ['Bonus:DECIMAL(10,2)'], ENGINEER: ['Specialty:VARCHAR(50)'] }, ISA: [{ sup: 'EMPLOYEE', subs: ['MANAGER', 'ENGINEER'], d: false, t: false }] }],
  vehicle: ['Vehicles', { E: { VEHICLE: ['Reg_No:VARCHAR(20):pk', 'Make', 'Year:INT'], CAR: ['Seats:INT'], BIKE: ['Engine_CC:INT'] }, ISA: [{ sup: 'VEHICLE', subs: ['CAR', 'BIKE'], d: true, t: true }] }],
  account: ['Bank accounts', { E: { CUSTOMER: ['Cust_ID:INT:pk', 'Name', 'Phone:VARCHAR(20)'], ACCOUNT: ['Acc_No:INT:pk', 'Balance:DECIMAL(12,2)'], SAVINGS: ['Interest_Rate:DECIMAL(4,2)'], CURRENT: ['Overdraft_Limit:DECIMAL(10,2)'] }, ISA: [{ sup: 'ACCOUNT', subs: ['SAVINGS', 'CURRENT'], d: true, t: true }], R: [{ n: 'OWNS', a: ['CUSTOMER', '1', 'p'], b: ['ACCOUNT', 'N', 't'] }] }],
  university: ['University', { E: { DEPARTMENT: ['Dept_ID:INT:pk', 'Dept_Name'], PERSON: ['Person_ID:INT:pk', 'Name', 'Phone:VARCHAR(20)'], STUDENT: ['CGPA:DECIMAL(3,2)'], FACULTY: ['Salary:DECIMAL(10,2)'] }, ISA: [{ sup: 'PERSON', subs: ['STUDENT', 'FACULTY'], d: true, t: false }], R: [{ n: 'BELONGS_TO', a: ['STUDENT', 'N', 't'], b: ['DEPARTMENT', '1', 'p'] }, { n: 'WORKS_FOR', a: ['FACULTY', 'N', 't'], b: ['DEPARTMENT', '1', 'p'] }] }],
  hospital: ['Hospital', { E: { PERSON: ['Person_ID:INT:pk', 'Name', 'DOB:DATE'], DOCTOR: ['Specialty:VARCHAR(50)', 'License_No:VARCHAR(20)'], PATIENT: ['Blood_Group:VARCHAR(5)'] }, ISA: [{ sup: 'PERSON', subs: ['DOCTOR', 'PATIENT'], d: false, t: false }], R: [{ n: 'TREATS', a: ['DOCTOR', 'N', 'p'], b: ['PATIENT', 'N', 'p'], at: ['Visit_Date:DATE'] }] }],
  empdept: ['Employee and Department', { E: { EMPLOYEE: ['Emp_ID:INT:pk', 'Name', 'Salary:DECIMAL(10,2)'], MANAGER: ['Bonus:DECIMAL(10,2)'], DEPARTMENT: ['Dept_ID:INT:pk', 'Dept_Name'] }, ISA: [{ sup: 'EMPLOYEE', subs: ['MANAGER'], d: true, t: false }], R: [{ n: 'WORKS_FOR', a: ['EMPLOYEE', 'N', 't'], b: ['DEPARTMENT', '1', 'p'] }, { n: 'MANAGES', a: ['MANAGER', '1', 'p'], b: ['DEPARTMENT', '1', 't'] }] }],
  erbasic: ['Students and courses', { E: { STUDENT: ['Roll_No:INT:pk', 'Name', 'Email'], COURSE: ['Course_ID:VARCHAR(10):pk', 'Title', 'Credits:INT'] }, R: [{ n: 'ENROLLS', a: ['STUDENT', 'N', 'p'], b: ['COURSE', 'N', 'p'], at: ['Grade:VARCHAR(2)'] }] }],
  weak: ['Weak entity', { E: { EMPLOYEE: ['Emp_ID:INT:pk', 'Name'], DEPENDENT: ['Dep_Name:VARCHAR(50):pk', 'Relationship:VARCHAR(20)', 'Birth_Date:DATE'] }, W: ['DEPENDENT'], R: [{ n: 'HAS_DEP', a: ['EMPLOYEE', '1', 'p'], b: ['DEPENDENT', 'N', 't'], id: true }] }],
  gen_before: ['Before generalization', { E: { STUDENT: ['Student_ID:INT:pk', 'Name', 'Address', 'Phone:VARCHAR(20)', 'CGPA:DECIMAL(3,2)'], FACULTY: ['Faculty_ID:INT:pk', 'Name', 'Address', 'Phone:VARCHAR(20)', 'Salary:DECIMAL(10,2)'] } }]
};
const modelOf = k => { const [n, s] = MODEL_SPECS[k]; return mk(n, s); };

const EXAMPLES = [
  { id: 'student-person', title: 'Student → Person', tag: 'Specialization', model: 'student', problem: 'A university stores every person with an ID, name, address and date of birth. Some persons are students and additionally have a CGPA and an enrolment year.', analysis: ['PERSON is the general entity. STUDENT has extra attributes, so it is a specialization of PERSON.', 'Only STUDENT is modelled, but other kinds of persons may exist later, so the specialization is partial.', 'One subclass means the disjoint/overlapping question does not arise in practice; disjoint is used by default.'], cons: 'Partial · Disjoint (single subclass)', explain: 'A STUDENT row is the same real-world person as a PERSON row. It inherits Person_ID, Name, Address and DOB and adds CGPA and Enroll_Year. In tables, STUDENT.Person_ID is both the primary key and a foreign key to PERSON.' },
  { id: 'faculty-person', title: 'Faculty → Person', tag: 'Specialization', model: 'faculty', problem: 'The same university needs salary and designation for faculty members only. Faculty are people, so they should not repeat the name or address columns.', analysis: ['FACULTY holds attributes that make sense only for faculty (Salary, Designation).', 'Name, Address and DOB stay in PERSON and are inherited.', 'Not every person is faculty, so the specialization is partial.'], cons: 'Partial · Disjoint (single subclass)', explain: 'This is the same pattern as the Student example. Comparing the two shows why a PERSON superclass with both subclasses avoids duplicate columns.' },
  { id: 'employee-mgr-eng', title: 'Employee → Manager / Engineer', tag: 'Overlapping', model: 'employee', problem: 'A company employs people who can be managers, engineers, or both (an engineering manager). Some employees are neither, for example clerks.', analysis: ['EMPLOYEE has Emp_ID, Name and Salary.', 'MANAGER adds Bonus. ENGINEER adds Specialty.', 'An engineering manager is in both subclasses, so the subclasses overlap.', 'Clerks are in neither, so the specialization is partial.'], cons: 'Partial · Overlapping', explain: 'Overlapping means one employee entity can appear in several subclasses. When mapped, use boolean flags (Option D) or separate tables (Option A), not a single type column.' },
  { id: 'vehicle-car-bike', title: 'Vehicle → Car / Bike', tag: 'Total, disjoint', model: 'vehicle', problem: 'A registry records only cars and bikes. A vehicle is exactly one of them.', analysis: ['VEHICLE has the common attributes Reg_No, Make and Year.', 'CAR has Seats. BIKE has Engine_CC.', 'Every vehicle is a car or a bike, so the specialization is total.', 'No vehicle is both, so it is disjoint.'], cons: 'Total · Disjoint', explain: 'Total plus disjoint is the neatest case. It can be mapped with separate tables, with subclass tables only (Option B), or with one table and a type column (Option C).' },
  { id: 'customer-account', title: 'Customer → Account', tag: 'Relationship + ISA', model: 'account', problem: 'A bank customer can own many accounts. Every account is either a savings or a current account, and every account has exactly one owner.', analysis: ['CUSTOMER and ACCOUNT are linked by OWNS (1:N). Account participation is total.', 'ACCOUNT is specialized into SAVINGS (Interest_Rate) and CURRENT (Overdraft_Limit).', 'Both subclasses inherit the OWNS relationship from ACCOUNT.'], cons: 'Total · Disjoint; OWNS is 1:N', explain: 'The foreign key for OWNS goes into ACCOUNT (the N side). Because SAVINGS and CURRENT inherit from ACCOUNT, they need no extra foreign key to CUSTOMER.' },
  { id: 'university', title: 'University → Student / Faculty', tag: 'Full model', model: 'university', problem: 'A university has departments. People are students or faculty. Every student belongs to a department and every faculty member works for one.', analysis: ['PERSON is generalized from STUDENT and FACULTY.', 'DEPARTMENT is a separate entity.', 'BELONGS_TO and WORKS_FOR are N:1 relationships, each with total participation on the person side.'], cons: 'Partial · Disjoint; two N:1 relationships', explain: 'Students and faculty have their own relationships, so those relationships are attached to the subclasses. Relationships shared by all people would be attached to PERSON.' },
  { id: 'hospital', title: 'Hospital → Doctor / Patient', tag: 'Overlapping', model: 'hospital', problem: 'In a hospital, doctors and patients are people. A doctor can also be admitted as a patient. Visitors and staff are recorded as people but are neither.', analysis: ['PERSON holds Name and DOB.', 'DOCTOR and PATIENT are subclasses with their own attributes.', 'A doctor who is also a patient belongs to both, so the subclasses overlap.', 'Visitors are in neither, so the specialization is partial.', 'TREATS is M:N with attribute Visit_Date.'], cons: 'Partial · Overlapping; TREATS is M:N', explain: 'TREATS becomes its own table with a composite key. Because DOCTOR and PATIENT overlap, one Person_ID may appear in both subclass tables.' },
  { id: 'employee-dept', title: 'Employee → Department', tag: 'Relationship inheritance', model: 'empdept', problem: 'Every employee works for one department. Some employees are managers, and each department has exactly one manager who manages it.', analysis: ['WORKS_FOR is N:1 from EMPLOYEE to DEPARTMENT.', 'MANAGER is a subclass of EMPLOYEE, so it inherits WORKS_FOR.', 'MANAGES is a relationship of the subclass only: 1:1 with DEPARTMENT.'], cons: 'Partial · Disjoint; MANAGES is 1:1', explain: 'This shows relationship inheritance in both directions: MANAGER inherits WORKS_FOR from EMPLOYEE and also adds its own relationship, MANAGES.' }
];

const TRY = [
  { id: 'uni', title: 'University people', text: 'A university stores STUDENT and FACULTY. Both have Name, Address and Phone. Some other people (visitors, alumni) are stored too. A student cannot be faculty.', sup: 'PERSON', supOpts: ['PERSON', 'UNIVERSITY', 'COURSE', 'ADDRESS'], subs: ['STUDENT', 'FACULTY'], subOpts: ['STUDENT', 'FACULTY', 'ADDRESS', 'PHONE'], d: true, t: false, why: 'The shared attributes belong in a superclass PERSON. Visitors and alumni are in neither subclass, so the specialization is partial. A student cannot also be faculty, so it is disjoint.' },
  { id: 'veh', title: 'Vehicles', text: 'A rental company only rents CARs and BIKEs. Both have a registration number, make and year. No vehicle is both a car and a bike.', sup: 'VEHICLE', supOpts: ['VEHICLE', 'ENGINE', 'CUSTOMER', 'BRANCH'], subs: ['CAR', 'BIKE'], subOpts: ['CAR', 'BIKE', 'MAKE', 'YEAR'], d: true, t: true, why: 'VEHICLE is the superclass. Every vehicle is a car or a bike (total) and never both (disjoint).' },
  { id: 'emp', title: 'Employees', text: 'A firm has MANAGERs and ENGINEERs. An engineering manager is both. Clerks are also employees but are in neither group.', sup: 'EMPLOYEE', supOpts: ['EMPLOYEE', 'FIRM', 'SALARY', 'PROJECT'], subs: ['MANAGER', 'ENGINEER'], subOpts: ['MANAGER', 'ENGINEER', 'SALARY', 'CLERK'], d: false, t: false, why: 'An engineering manager belongs to two subclasses, so they overlap. Clerks are in neither, so it is partial. CLERK is not modelled as a subclass here.' },
  { id: 'bank', title: 'Bank accounts', text: 'A bank offers only SAVINGS and CURRENT accounts. Every account must be one of these two, and no account is both.', sup: 'ACCOUNT', supOpts: ['ACCOUNT', 'BANK', 'CUSTOMER', 'BALANCE'], subs: ['SAVINGS', 'CURRENT'], subOpts: ['SAVINGS', 'CURRENT', 'BALANCE', 'CUSTOMER'], d: true, t: true, why: 'ACCOUNT is the superclass. Every account belongs to exactly one subclass, so the specialization is total and disjoint.' },
  { id: 'hos', title: 'Hospital', text: 'In a hospital, DOCTORs and PATIENTs are people. A doctor can be admitted as a patient. Visitors are recorded too.', sup: 'PERSON', supOpts: ['PERSON', 'HOSPITAL', 'WARD', 'VISIT'], subs: ['DOCTOR', 'PATIENT'], subOpts: ['DOCTOR', 'PATIENT', 'WARD', 'VISITOR'], d: false, t: false, why: 'A doctor who is also a patient makes the subclasses overlap. Visitors belong to neither, so it is partial.' },
  { id: 'cus', title: 'Customers', text: 'A shop stores every CUSTOMER as either an INDIVIDUAL or a CORPORATE customer. Nobody is both, and there are no other kinds.', sup: 'CUSTOMER', supOpts: ['CUSTOMER', 'SHOP', 'ORDER', 'PRODUCT'], subs: ['INDIVIDUAL', 'CORPORATE'], subOpts: ['INDIVIDUAL', 'CORPORATE', 'ORDER', 'PRODUCT'], d: true, t: true, why: 'CUSTOMER is the superclass. The two kinds cover every customer (total) and do not overlap (disjoint).' }
];

/* Practice bank. type: identify | genspec | constraint | mapping | table | sql | diagram */
const PRACTICE = [
  { id: 'p1', type: 'identify', topic: 'entity', d: 'easy', q: 'In "A library keeps books, each with an ISBN, title and author", which is the best choice for an entity?', o: ['ISBN', 'BOOK', 'title', 'author name'], a: 1, h: 'An entity is a thing that has its own attributes.', e: 'BOOK is a thing with attributes (ISBN, title, author). ISBN and title are attributes of BOOK.' },
  { id: 'p2', type: 'identify', topic: 'attributes', d: 'easy', q: 'Which attribute is most naturally multi-valued for a STUDENT entity?', o: ['Roll number', 'Date of birth', 'Phone numbers', 'Name'], a: 2, h: 'Can one student have more than one value at the same time?', e: 'A student can have several phone numbers. Roll number, date of birth and name each have one value.' },
  { id: 'p3', type: 'identify', topic: 'keys', d: 'easy', q: 'Two students can have the same name but never the same roll number. Which should be the primary key?', o: ['Name', 'Roll number', 'Name and address', 'Department'], a: 1, h: 'A primary key must be unique for every row.', e: 'Roll number is unique for each student. Names can repeat, so Name alone cannot identify a row.' },
  { id: 'p4', type: 'identify', topic: 'cardinality', d: 'easy', q: 'One department has many employees and each employee works in one department. What is the cardinality from DEPARTMENT to EMPLOYEE?', o: ['1:1', '1:N', 'M:N', 'N:1 from department'], a: 1, h: 'Count how many employees one department can have.', e: 'One department to many employees is 1:N (department to employee).' },
  { id: 'p5', type: 'identify', topic: 'participation', d: 'medium', q: 'Every ACCOUNT must belong to a CUSTOMER, but some customers have no account yet. What is ACCOUNT\'s participation in OWNS?', o: ['Partial', 'Total', 'Optional', 'Weak'], a: 1, h: 'Total means every entity must take part.', e: 'Every account must have an owner, so ACCOUNT participates totally (double line). CUSTOMER participates partially.' },
  { id: 'p6', type: 'genspec', topic: 'generalization', d: 'easy', q: 'CAR and BIKE both have RegNo, Make and Year. You create a VEHICLE entity holding these three attributes. What is this process called?', o: ['Specialization', 'Generalization', 'Aggregation', 'Normalization'], a: 1, h: 'Are you starting from the specific entities or the general one?', e: 'Combining specific entities into a higher-level entity by extracting common attributes is generalization (bottom-up).' },
  { id: 'p7', type: 'genspec', topic: 'specialization', d: 'easy', q: 'You start with EMPLOYEE and then define MANAGER and ENGINEER, each with attributes of its own. This is:', o: ['Generalization', 'Specialization', 'Aggregation', 'Weak entity'], a: 1, h: 'Direction matters: general to specific.', e: 'Defining subclasses from an existing entity is specialization (top-down).' },
  { id: 'p8', type: 'genspec', topic: 'gen-vs-spec', d: 'medium', q: 'Which statement about generalization and specialization is correct?', o: ['Generalization is top-down and specialization is bottom-up', 'Generalization is bottom-up and specialization is top-down', 'Both are bottom-up', 'They are unrelated to each other'], a: 1, h: 'Think of the direction you travel between subclass and superclass.', e: 'Generalization goes from subclasses up to a superclass (bottom-up). Specialization goes from a superclass down to subclasses (top-down). They are the same structure viewed from opposite directions.' },
  { id: 'p9', type: 'genspec', topic: 'super-sub', d: 'medium', q: 'STUDENT is a subclass of PERSON. Person_ID is the key of PERSON. What is true of a STUDENT entity?', o: ['It has no key', 'It inherits Person_ID as its key', 'It must define a new key', 'It is not a person'], a: 1, h: 'A subclass entity is the same real-world entity as a superclass entity.', e: 'A subclass member is also a member of the superclass, so it inherits all attributes including the key.' },
  { id: 'p10', type: 'constraint', topic: 'disjoint', d: 'easy', q: 'An entity of the superclass can belong to at most one subclass. Which constraint is this?', o: ['Overlapping', 'Disjoint', 'Total', 'Partial'], a: 1, h: 'The circle contains the letter "d".', e: 'Disjoint means the subclasses share no members.' },
  { id: 'p11', type: 'constraint', topic: 'overlapping', d: 'easy', q: 'A person can be both a DOCTOR and a PATIENT. The specialization is:', o: ['Disjoint', 'Overlapping', 'Total', 'Weak'], a: 1, h: 'One entity in two subclasses.', e: 'An entity that may belong to several subclasses is overlapping (circle with "o").' },
  { id: 'p12', type: 'constraint', topic: 'total', d: 'medium', q: 'Every VEHICLE must be a CAR or a BIKE. Which completeness constraint applies, and how is it drawn?', o: ['Partial, single line', 'Total, double line', 'Total, single line', 'Partial, double line'], a: 1, h: 'Every superclass entity must belong to a subclass.', e: 'Total specialization is drawn with a double line from the superclass to the circle.' },
  { id: 'p13', type: 'constraint', topic: 'partial', d: 'medium', q: 'Some EMPLOYEEs are neither MANAGER nor ENGINEER. The specialization is:', o: ['Total', 'Partial', 'Disjoint', 'Overlapping'], a: 1, h: 'Are there superclass entities outside every subclass?', e: 'If some superclass entities are in no subclass, the specialization is partial (single line).' },
  { id: 'p14', type: 'constraint', topic: 'disjoint', d: 'hard', q: 'A specialization is total and overlapping. Which statement is correct?', o: ['Every entity is in exactly one subclass', 'Every entity is in at least one subclass, and some may be in several', 'Some entities may be in no subclass, and none is in two', 'Subclasses must have equal sizes'], a: 1, h: 'Total = at least one. Overlapping = possibly more than one.', e: 'Total requires membership in at least one subclass. Overlapping allows membership in more than one. Combined, every entity is in one or more subclasses.' },
  { id: 'p15', type: 'constraint', topic: 'total', d: 'hard', q: 'Disjointness and completeness are independent. How many valid constraint combinations does one specialization have?', o: ['2', '3', '4', '8'], a: 2, h: 'Two choices for one constraint times two for the other.', e: 'Disjoint/overlapping (2) times total/partial (2) gives 4 combinations.' },
  { id: 'p16', type: 'mapping', topic: 'map-gen-spec', d: 'medium', q: 'In the "separate table for every class" mapping, how is a subclass table\'s primary key defined?', o: ['A new surrogate key', 'The superclass key, also a foreign key to the superclass', 'No key at all', 'The subclass\'s first attribute'], a: 1, h: 'The subclass row extends exactly one superclass row.', e: 'The subclass primary key is the superclass key and also a foreign key referencing the superclass table.' },
  { id: 'p17', type: 'mapping', topic: 'map-gen-spec', d: 'medium', q: 'Which mapping option best suits OVERLAPPING subclasses within a single table?', o: ['One type column', 'One boolean flag per subclass', 'Subclass tables only', 'No mapping exists'], a: 1, h: 'A single type value cannot hold two subclasses.', e: 'One boolean flag per subclass can be true for several subclasses at once. A single type column allows only one value.' },
  { id: 'p18', type: 'mapping', topic: 'map-gen-spec', d: 'hard', q: 'Why is "subclass tables only" a poor choice for a PARTIAL specialization?', o: ['It needs more foreign keys', 'Superclass entities in no subclass have nowhere to be stored', 'It cannot store attributes', 'It makes keys non-unique'], a: 1, h: 'Without a superclass table, where does an entity with no subclass go?', e: 'Without a superclass table, an entity that belongs to no subclass cannot be represented. This option works when the specialization is total.' },
  { id: 'p19', type: 'table', topic: 'map-eer', d: 'medium', q: 'An M:N relationship ENROLLS between STUDENT and COURSE with attribute Grade is mapped to relations. What is created?', o: ['A foreign key in STUDENT only', 'A new table with both keys as a composite primary key, plus Grade', 'A foreign key in COURSE only', 'Nothing; M:N is not mapped'], a: 1, h: 'Neither side can hold a single foreign key for many partners.', e: 'M:N becomes its own relation containing the keys of both entities (composite primary key) and the relationship attributes.' },
  { id: 'p20', type: 'table', topic: 'map-eer', d: 'medium', q: 'For a 1:N relationship between DEPARTMENT (1) and EMPLOYEE (N), where does the foreign key go?', o: ['In DEPARTMENT', 'In EMPLOYEE', 'In a new table', 'In both'], a: 1, h: 'Put it on the "many" side.', e: 'Each employee has one department, so EMPLOYEE gets a Dept_ID foreign key referencing DEPARTMENT.' },
  { id: 'p21', type: 'table', topic: 'weak-entity', d: 'medium', q: 'A weak entity DEPENDENT depends on EMPLOYEE. What is DEPENDENT\'s primary key in the relational schema?', o: ['Its partial key alone', 'Emp_ID alone', 'Emp_ID combined with its partial key', 'A random number'], a: 2, h: 'A weak entity has no key of its own.', e: 'The primary key combines the owner\'s key (Emp_ID, also a foreign key) with the weak entity\'s partial key.' },
  { id: 'p22', type: 'sql', topic: 'map-sql', d: 'medium', q: 'Which SQL fragment correctly makes STUDENT a subclass table of PERSON?', o: ['person_id INT, FOREIGN KEY (person_id) REFERENCES Person(person_id)', 'person_id INT PRIMARY KEY, FOREIGN KEY (person_id) REFERENCES Person(person_id)', 'student_id INT PRIMARY KEY', 'person_id INT UNIQUE'], a: 1, h: 'The key must be both primary and foreign.', e: 'A subclass table uses the superclass key as PRIMARY KEY and as a FOREIGN KEY to the superclass table.' },
  { id: 'p23', type: 'sql', topic: 'map-sql', d: 'hard', q: 'In a single-table mapping of a disjoint specialization, what happens to subclass-specific columns for rows of another subclass?', o: ['They hold default values that are ignored', 'They are NULL', 'They are deleted', 'They cause an error'], a: 1, h: 'The row has no value for an attribute that does not apply.', e: 'Subclass-specific columns are nullable and stay NULL for rows of other subclasses. That is the main cost of this mapping.' },
  { id: 'p24', type: 'diagram', topic: 'isa', d: 'medium', model: 'vehicle', q: 'In the diagram, what do the double line and the letter "d" tell you?', o: ['Total and disjoint', 'Partial and disjoint', 'Total and overlapping', 'Partial and overlapping'], a: 0, h: 'Double line describes completeness. The letter describes disjointness.', e: 'A double line means total. The letter "d" means disjoint. Each vehicle is exactly one of car or bike.' },
  { id: 'p25', type: 'diagram', topic: 'overlapping', d: 'medium', model: 'hospital', q: 'In the diagram, which person could exist according to its constraints?', o: ['A person who is a doctor and a patient', 'A person who is a doctor only', 'A person who is neither', 'All of these'], a: 3, h: 'Check the letter in the circle and the type of line.', e: 'The circle has "o" (overlapping), so a person can be both. The single line means partial, so a person can be in neither. Being in one subclass is allowed too.' },
  { id: 'p26', type: 'diagram', topic: 'attr-inherit', d: 'easy', model: 'person', q: 'Which attributes does a STUDENT have in this diagram, counting inherited ones?', o: ['CGPA only', 'Person_ID, Name, Address, Phone and CGPA', 'Person_ID and CGPA', 'Salary and CGPA'], a: 1, h: 'A subclass inherits everything from its superclass.', e: 'STUDENT inherits Person_ID, Name, Address and Phone from PERSON and adds CGPA.' },
  { id: 'p27', type: 'genspec', topic: 'rel-inherit', d: 'hard', q: 'PERSON participates in a relationship LIVES_AT with ADDRESS. STUDENT is a subclass of PERSON. Does STUDENT take part in LIVES_AT?', o: ['No, relationships are not inherited', 'Yes, subclasses inherit relationships of the superclass', 'Only if declared again', 'Only if STUDENT is total'], a: 1, h: 'Inheritance covers relationships as well as attributes.', e: 'A subclass inherits the attributes and the relationship participations of its superclass, and may add its own.' },
  { id: 'p28', type: 'genspec', topic: 'gen-vs-spec', d: 'hard', q: 'Which is NOT a reason to introduce a superclass?', o: ['Avoid repeating common attributes', 'Share relationships among subclasses', 'Make the diagram larger', 'Model "is-a" relations directly'], a: 2, h: 'Look for the option that is not a modelling benefit.', e: 'A superclass reduces duplication, allows shared relationships and expresses is-a. Making a diagram larger is not a goal.' }
];

/* Seed Competitive Questions across all EER, Generalization, Specialization, Constraints, Mapping & Design topics */
const SEED_CQ = [
  {
    id: 'cq1',
    exam: 'GATE CS',
    year: 2024,
    topic: 'generalization',
    d: 'medium',
    marks: 2,
    timeLimit: 90,
    q: 'In an EER diagram, entities ACCOUNT_SAVINGS and ACCOUNT_CURRENT share attributes Account_No, Balance, and Date_Opened, while each maintains unique interest rate and overdraft limit attributes respectively. If a designer synthesizes them into ACCOUNT using a bottom-up approach, which of the following is strictly true regarding attribute inheritance?',
    o: [
      'ACCOUNT inherits all attributes from both ACCOUNT_SAVINGS and ACCOUNT_CURRENT.',
      'ACCOUNT_SAVINGS and ACCOUNT_CURRENT inherit the common attributes from the synthesized superclass ACCOUNT, and their primary keys must reference ACCOUNT.',
      'Subclasses can inherit attributes only if the completeness constraint is partial.',
      'Inheritance occurs top-down only; bottom-up generalization cannot support key inheritance in relational mapping.'
    ],
    a: 1,
    source: 'GATE CS / EER Specialist Exam',
    sol: 'In generalization (bottom-up), common attributes are factored out into a newly created superclass ACCOUNT. The subclasses inherit these shared attributes, and in relational design each subclass table retains the superclass primary key as both its primary key and a foreign key.'
  },
  {
    id: 'cq2',
    exam: 'GATE CS',
    year: 2023,
    topic: 'constraints',
    d: 'hard',
    marks: 4,
    timeLimit: 120,
    q: 'Consider a superclass EMPLOYEE with subclasses SALARIED_EMP and HOURLY_EMP under the constraint (Total, Disjoint). A new requirement specifies: "Every employee must be either salaried or hourly, and certain senior research fellows can be BOTH salaried and hourly simultaneously." What minimal modification must be applied to the EER constraints?',
    o: [
      'Change Total to Partial, keeping Disjoint.',
      'Change Disjoint to Overlapping, keeping Total.',
      'Change both Total to Partial and Disjoint to Overlapping.',
      'Introduce an aggregation between SALARIED_EMP and HOURLY_EMP.'
    ],
    a: 1,
    source: 'GATE CS / DBMS Specialization',
    sol: 'Because every employee must belong to at least one subclass, completeness remains Total. Because senior research fellows can belong to both subclasses at once, disjointness ("d") must change to overlapping ("o"). Hence: Disjoint changes to Overlapping while keeping Total.'
  },
  {
    id: 'cq3',
    exam: 'UGC NET',
    year: 2023,
    topic: 'aggregation',
    d: 'hard',
    marks: 4,
    timeLimit: 120,
    q: 'In an EER model, entities EMPLOYEE, PROJECT, and BRANCH participate in a ternary relationship ASSIGNED_TO. If the enterprise needs to record JOB_EVALUATION instances specifically for an employee\'s assignment to a project at a branch, which EER abstraction mechanism is required to avoid ternary redundancy and modeling anomaly?',
    o: [
      'Specialization of EMPLOYEE into an Evaluated_Employee subclass.',
      'Aggregation, treating the ASSIGNED_TO relationship itself as a higher-level composite entity that participates in the EVALUATION relationship.',
      'Generalization of PROJECT and BRANCH into a common superclass.',
      'A weak entity connected directly to BRANCH only.'
    ],
    a: 1,
    source: 'UGC NET Computer Science Paper II',
    sol: 'Aggregation is the EER abstraction used when a relationship between entities needs to be treated as a higher-level entity set so that it can participate as a whole in another relationship.'
  },
  {
    id: 'cq4',
    exam: 'GATE CS',
    year: 2022,
    topic: 'map-gen-spec',
    d: 'medium',
    marks: 2,
    timeLimit: 90,
    q: 'An EER hierarchy consists of superclass VEHICLE (Reg_No, Price) and subclasses CAR (Num_Doors) and TRUCK (Tonnage). The constraint is (Partial, Disjoint). Which relational mapping strategy causes severe data loss or is conceptually INVALID for this constraint?',
    o: [
      'Option A: 3 tables (VEHICLE, CAR, TRUCK) with primary key Reg_No in all three tables.',
      'Option B: 2 tables only (CAR, TRUCK) with no VEHICLE table, replicating common attributes.',
      'Option C: 1 table VEHICLE with a Vehicle_Type discriminator column and nullable subclass columns.',
      'Option D: 1 table VEHICLE with boolean flags is_car and is_truck.'
    ],
    a: 1,
    source: 'GATE CS Database Systems',
    sol: 'Option B (subclass tables only) strictly requires TOTAL specialization. When specialization is PARTIAL, vehicles that are neither CAR nor TRUCK (e.g. motorcycles, trailers) have no superclass table to exist in, causing irreversible data loss.'
  },
  {
    id: 'cq5',
    exam: 'GATE CS',
    year: 2021,
    topic: 'weak-entity',
    d: 'medium',
    marks: 2,
    timeLimit: 90,
    q: 'In a real-estate database, BUILDING is a strong entity with primary key Building_ID. APARTMENT is a weak entity with partial key Apt_No, connected via the identifying relationship CONTAINS. If BUILDING has 10 tuples and each building has 5 apartments numbered 101 to 105, what is the primary key and the number of distinct primary key values in the APARTMENT relational table?',
    o: [
      'Primary key is (Apt_No); 5 distinct values.',
      'Primary key is (Building_ID); 10 distinct values.',
      'Primary key is (Building_ID, Apt_No); 50 distinct values.',
      'Primary key is an auto-generated surrogate key; Apt_No cannot be used.'
    ],
    a: 2,
    source: 'GATE CS Database Engineering',
    sol: 'A weak entity\'s primary key is formed by concatenating the identifying owner entity\'s primary key (Building_ID) with the weak entity\'s partial discriminator key (Apt_No). 10 buildings × 5 apartments = 50 distinct composite keys.'
  },
  {
    id: 'cq6',
    exam: 'UGC NET',
    year: 2022,
    topic: 'inheritance',
    d: 'hard',
    marks: 4,
    timeLimit: 120,
    q: 'Consider an EER multiple-inheritance lattice: TEACHING_ASSISTANT is a subclass of both INSTRUCTOR and GRAD_STUDENT, while both INSTRUCTOR and GRAD_STUDENT are subclasses of PERSON (Person_ID, Name, Email). Which statement is correct regarding attribute inheritance in TEACHING_ASSISTANT?',
    o: [
      'TEACHING_ASSISTANT receives duplicate Person_ID keys and must store two distinct primary key columns.',
      'TEACHING_ASSISTANT inherits Person_ID once from root superclass PERSON, along with the specific attributes and relationships of both INSTRUCTOR and GRAD_STUDENT.',
      'Multiple inheritance is forbidden in standard EER modeling.',
      'TEACHING_ASSISTANT must drop all connections to PERSON and create a surrogate key.'
    ],
    a: 1,
    source: 'UGC NET Advanced Database Systems',
    sol: 'In an EER lattice with shared root superclasses, shared ancestor attributes (like Person_ID from root PERSON) are inherited exactly once by the leaf subclass (TEACHING_ASSISTANT), along with non-conflicting specific attributes of intermediate superclasses.'
  },
  {
    id: 'cq7',
    exam: 'GATE CS',
    year: 2020,
    topic: 'constraints',
    d: 'easy',
    marks: 2,
    timeLimit: 60,
    q: 'In Elmasri-Navathe standard EER notation, what does a DOUBLE LINE connecting a superclass entity box to an ISA circle indicate?',
    o: [
      'Disjoint constraint (no entity can belong to more than one subclass).',
      'Total completeness constraint (every superclass entity must belong to at least one subclass).',
      'Partial participation in an identifying relationship.',
      'Multi-valued composite attribute link.'
    ],
    a: 1,
    source: 'GATE CS Database Notation Reference',
    sol: 'A double line from the superclass to the ISA circle indicates Total Specialization (mandatory participation in subclasses). A single line indicates Partial Specialization.'
  },
  {
    id: 'cq8',
    exam: 'GATE CS',
    year: 2024,
    topic: 'map-eer',
    d: 'medium',
    marks: 2,
    timeLimit: 90,
    q: 'A specialization between PERSON and subclasses CUSTOMER and SUPPLIER is OVERLAPPING and PARTIAL. Which relational mapping option correctly handles entities that can simultaneously be both customer and supplier within a single relational table?',
    o: [
      'Single table with a single scalar "Person_Type" column.',
      'Single table with boolean flags (is_customer, is_supplier) and nullable specific columns (Option D).',
      'Subclass tables only with no PERSON table (Option B).',
      'Creating an associative junction table between CUSTOMER and SUPPLIER.'
    ],
    a: 1,
    source: 'GATE CS Conceptual Design',
    sol: 'For overlapping subclasses mapped into a single table, Option D uses boolean flags (is_customer, is_supplier). A single scalar "Type" column cannot represent an entity that belongs to both subclasses concurrently. Option B cannot be used because participation is partial.'
  },
  {
    id: 'cq9',
    exam: 'UGC NET',
    year: 2021,
    topic: 'super-sub',
    d: 'easy',
    marks: 2,
    timeLimit: 60,
    q: 'What fundamental condition must hold for an entity set S to be formally defined as a SUBCLASS of superclass G in an EER model?',
    o: [
      'Every entity in S must also be an entity in G with identical real-world identity.',
      'Entities in S must have completely disjoint primary keys from G.',
      'S must contain strictly more attributes than G.',
      'S must not participate in any relationships.'
    ],
    a: 0,
    source: 'UGC NET DBMS Foundations',
    sol: 'By definition of subclassing, an entity in subclass S is the exact same real-world entity as in superclass G. S inherits the key and attributes of G and adds specialized attributes or relationship participations.'
  },
  {
    id: 'cq10',
    exam: 'GATE CS',
    year: 2023,
    topic: 'disjoint',
    d: 'medium',
    marks: 2,
    timeLimit: 90,
    q: 'A database stores GEOMETRIC_OBJECT with subclasses CIRCLE, RECTANGLE, and TRIANGLE with constraint (Total, Disjoint). If the relation contains 100 Geometric Objects, 40 Circles, and 35 Rectangles, how many Triangles exist in the database?',
    o: [
      'Cannot be computed without overlapping tuple sets.',
      'Exactly 25 Triangles.',
      'At most 10 Triangles.',
      'Between 35 and 40 Triangles.'
    ],
    a: 1,
    source: 'GATE CS Database Partitions',
    sol: 'Total + Disjoint forms an exact partition of the superclass. Every entity belongs to exactly one subclass. Therefore: Total (100) - Circles (40) - Rectangles (35) = 25 Triangles.'
  },
  {
    id: 'cq11',
    exam: 'GATE CS',
    year: 2022,
    topic: 'map-sql',
    d: 'hard',
    marks: 4,
    timeLimit: 120,
    q: 'When mapping an EER hierarchy using Option A (separate table for superclass PERSON and subclass STUDENT), how must the primary/foreign key constraint on STUDENT be declared in standard SQL DDL?',
    o: [
      'person_id INT, FOREIGN KEY (person_id) REFERENCES Person(person_id) ON DELETE SET NULL',
      'person_id INT PRIMARY KEY, FOREIGN KEY (person_id) REFERENCES Person(person_id) ON DELETE CASCADE',
      'student_id INT PRIMARY KEY, person_id INT UNIQUE',
      'No foreign key is needed if attribute names are identical.'
    ],
    a: 1,
    source: 'GATE CS SQL Integrity Constraints',
    sol: 'In Option A, the subclass table primary key is also a foreign key referencing the superclass. Because a student tuple represents the same entity as the person tuple, deleting the person tuple must cascade to delete the specialized student tuple (ON DELETE CASCADE).'
  },
  {
    id: 'cq12',
    exam: 'GATE CS',
    year: 2020,
    topic: 'rel-inherit',
    d: 'medium',
    marks: 2,
    timeLimit: 90,
    q: 'A superclass VEHICLE participates in a 1:N relationship INSURED_BY with INSURANCE_POLICY. If CAR and TRUCK are specialized subclasses of VEHICLE, which statement is true regarding relationship inheritance?',
    o: [
      'Subclasses cannot be insured because relationships never inherit across ISA hierarchies.',
      'Both CAR and TRUCK automatically inherit the INSURED_BY relationship from VEHICLE.',
      'Only subclasses with total participation inherit superclass relationships.',
      'A separate link table must be declared for every subclass.'
    ],
    a: 1,
    source: 'GATE CS EER Relationship Inheritance',
    sol: 'In EER modeling, relationship inheritance dictates that subclasses inherit all relationship participations of their superclasses in addition to all attributes.'
  },
  {
    id: 'cq13',
    exam: 'UGC NET',
    year: 2024,
    topic: 'categories',
    d: 'hard',
    marks: 4,
    timeLimit: 120,
    q: 'In advanced EER modeling, how does a CATEGORY (Union Type) fundamentally differ from a standard generalized superclass?',
    o: [
      'A Category can only have one superclass, whereas generalization has many.',
      'A Category represents a subclass of the UNION of distinct superclasses that may have completely different primary keys (e.g. OWNER can be PERSON, BANK, or COMPANY).',
      'A Category cannot participate in any relationships or have foreign keys.',
      'A Category must always have disjoint and total constraints.'
    ],
    a: 1,
    source: 'UGC NET Advanced Modeling',
    sol: 'A Category (Union Type) models an entity that represents a subset of the union of distinct entity types that have different primary keys (e.g. Registered Owner can be a Person, a Bank, or a Company).'
  },
  {
    id: 'cq14',
    exam: 'GATE CS',
    year: 2021,
    topic: 'er-relational',
    d: 'medium',
    marks: 2,
    timeLimit: 90,
    q: 'In an EER scenario: An enterprise records PROJECTS. Each project is managed by exactly one EMPLOYEE (1:1 relationship MANAGES with TOTAL participation on the PROJECT side and PARTIAL on EMPLOYEE). Where should the foreign key be placed to completely eliminate NULL values?',
    o: [
      'In the EMPLOYEE relation as Project_ID.',
      'In the PROJECT relation as Manager_Emp_ID with a NOT NULL constraint.',
      'In a third standalone junction table only.',
      'In both EMPLOYEE and PROJECT relations simultaneously.'
    ],
    a: 1,
    source: 'GATE CS Schema Optimization',
    sol: 'Placing Manager_Emp_ID in PROJECT (the entity with total participation) with a NOT NULL constraint guarantees that every project tuple points to its manager without allowing any null values.'
  },
  {
    id: 'cq15',
    exam: 'UGC NET',
    year: 2022,
    topic: 'specialization',
    d: 'easy',
    marks: 2,
    timeLimit: 60,
    q: 'Specialization is characterized as a top-down database design process. Which of the following is the primary objective of specialization?',
    o: [
      'To merge unrelated database schemas into a single view.',
      'To classify subgroups within an entity type that have distinctive attributes or specific relationship participations.',
      'To eliminate all primary key constraints.',
      'To denormalize BCNF tables into unnormalized structures.'
    ],
    a: 1,
    source: 'UGC NET DBMS Core Concepts',
    sol: 'Specialization takes a high-level entity and refines it top-down into subclasses based on distinguishing features, specific attributes, or specialized relationship participations.'
  },
  {
    id: 'cq16',
    exam: 'GATE CS',
    year: 2023,
    topic: 'total-partial',
    d: 'medium',
    marks: 2,
    timeLimit: 90,
    q: 'In a university hospital EER diagram, PERSON is specialized into PATIENT. Which condition formally justifies specifying a PARTIAL specialization constraint?',
    o: [
      'Every person recorded in the database must be a patient.',
      'The database also stores doctors, nurses, administrative staff, and visitors who are people but not patients.',
      'Patients cannot have contact numbers.',
      'No person can be admitted more than once.'
    ],
    a: 1,
    source: 'GATE CS Completeness Constraints',
    sol: 'Partial specialization means some entities in the superclass (PERSON) do not belong to any subclass. Because hospital staff and visitors are people but not patients, the specialization is partial.'
  },
  {
    id: 'cq17',
    exam: 'GATE CS',
    year: 2024,
    topic: 'constraints',
    d: 'hard',
    marks: 4,
    timeLimit: 120,
    q: 'An academic conference system specifies: "An AUTHOR can submit papers. Some authors are REVIEWERS and some are EDITORS. An author can simultaneously be both a reviewer and an editor. Furthermore, every reviewer must have reviewed at least one paper." Which combination of EER constraints correctly models this requirement?',
    o: [
      'Disjoint specialization of Reviewer and Editor; partial participation of Reviewer in REVIEWS.',
      'Overlapping specialization of Reviewer and Editor; total participation of Reviewer in REVIEWS.',
      'Total specialization of Reviewer and Editor; partial participation of Reviewer in REVIEWS.',
      'Category union type of Reviewer and Editor.'
    ],
    a: 1,
    source: 'GATE CS Complex Scenario Modeling',
    sol: 'Authors can be both reviewers and editors -> Overlapping ("o"). Every reviewer must review at least one paper -> Total participation (double line) of REVIEWER in the REVIEWS relationship.'
  },
  {
    id: 'cq18',
    exam: 'GATE CS',
    year: 2022,
    topic: 'map-gen-spec',
    d: 'hard',
    marks: 4,
    timeLimit: 120,
    q: 'Under which specific condition is Option C (Single table with a single Type discriminating column) completely INAPPLICABLE for mapping an EER hierarchy into relations?',
    o: [
      'When the completeness constraint is Total.',
      'When the subclasses are OVERLAPPING, because a single scalar column cannot store multiple values for an entity belonging to two or more subclasses.',
      'When the superclass has more than two attributes.',
      'When foreign key cascades are active.'
    ],
    a: 1,
    source: 'GATE CS Relational Mapping Pitfalls',
    sol: 'A single discriminating type column can only store one atomic value per tuple (e.g. "C" or "T"). If subclasses overlap, an entity belonging to both cannot be represented by a single scalar type column without violating 1NF or losing subclass identity.'
  }
];

/* Curated educational YouTube video lectures on EER modelling.
   Every ID below was checked against YouTube's oEmbed endpoint (video exists, is public and embeddable).
   Titles/channels are exactly as YouTube reports them. Durations are not stored because they were not verified. */
const SEED_VIDEOS = [
  { id: 'yt-rM1xg-m8egY', topic: 'eer-model', title: 'Enhanced ER Model Explained for Beginners | Database Design Tutorial', url: 'https://www.youtube.com/watch?v=rM1xg-m8egY', channel: 'CodeLucky', desc: 'Beginner introduction to the Enhanced ER (EER) model and why it extends the basic ER model.' },
  { id: 'yt-0mBkRtJP-_Y', topic: 'generalization', title: 'Enhanced Entity-Relationship Model Part 2: Generalization vs. Specialization and EER Constraints', url: 'https://www.youtube.com/watch?v=0mBkRtJP-_Y', channel: 'Brian Finnegan', desc: 'Generalization compared with specialization, plus the EER constraints on subclasses.' },
  { id: 'yt-1G4agXWNr_M', topic: 'specialization', title: 'L2.6 Extended ER Features: Generalization, Specialization, Aggregation | Inheritance | ER Model | DBMS', url: 'https://www.youtube.com/watch?v=1G4agXWNr_M', channel: 'Shanu Kuttan CSE Classes', desc: 'Specialization, generalization, inheritance and aggregation as extended ER features.' },
  { id: 'yt-jbnwnmR3vq4', topic: 'disjoint', title: 'Constraints on Generalization and Specialization: Disjoint, Overlapping, Total, and Partial', url: 'https://www.youtube.com/watch?v=jbnwnmR3vq4', channel: 'AY EDUCATION', desc: 'Disjoint vs overlapping and total vs partial constraints on a specialization.' },
  { id: 'yt-Cu_LwPQsuXs', topic: 'total', title: '[DB11] Constraints on Generalization, Disjoint, Overlapping, Total, Partial', url: 'https://www.youtube.com/watch?v=Cu_LwPQsuXs', channel: 'The Academician', desc: 'Second explanation of the disjointness and completeness constraints, with examples.' },
  { id: 'yt-FYfcrJ797Xg', topic: 'gen-vs-spec', title: 'Lec-14 Generalization, Specialization & Aggregation in DBMS | Enhanced ER Model | DBMS', url: 'https://www.youtube.com/watch?v=FYfcrJ797Xg', channel: 'CS & IT Engineering Gyan', desc: 'Generalization, specialization and aggregation in the enhanced ER model.' },
  { id: 'yt-HN8MnX_GkNg', topic: 'eer-model', title: 'Aggregation in E-R model | DBMS Tutorials for Beginners in Hindi #12', url: 'https://www.youtube.com/watch?v=HN8MnX_GkNg', channel: 'Premium Learnings', desc: 'Aggregation in the ER model (explained in Hindi).' },
  { id: 'yt-0ZOFZ-Hh664', topic: 'map-gen-spec', title: 'EER to Relational Translation Techniques', url: 'https://www.youtube.com/watch?v=0ZOFZ-Hh664', channel: 'Brian Finnegan', desc: 'Translating EER superclass/subclass structures into relational tables.' },
  { id: 'yt-WOFYySkSrQQ', topic: 'map-eer', title: 'DBMS: Mapping of EER to Relational model', url: 'https://www.youtube.com/watch?v=WOFYySkSrQQ', channel: 'Sarita Ambadekar', desc: 'Step-by-step mapping of EER diagrams to the relational model.' }
];
/* The first release seeded six videos (ids v1-v6) whose YouTube IDs do not exist. They are removed once, together with
   any completion flag stored for them. Videos added by the user are never touched. */
const LEGACY_BAD_VIDEOS = { v1: '0kP0K4Z3_wM', v2: 'kYvjD_40qNk', v3: 'wXjRz6H8G6Q', v4: 'QZ0_7E6n1aE', v5: '3r_T2eZ1xG0', v6: 'vV3rX1_4E6w' };

function initSeeds() {
  if (!DB.cq || !DB.cq.length) {
    DB.cq = clone(SEED_CQ);
    DB.save('cq');
  }
  if (!DB.videos || !DB.videos.length) {
    DB.videos = clone(SEED_VIDEOS);
    DB.save('videos');
    return;
  }
  const dead = DB.videos.filter(v => LEGACY_BAD_VIDEOS[v.id] && getYouTubeId(v.url) === LEGACY_BAD_VIDEOS[v.id]);
  if (dead.length) {
    const ids = new Set(dead.map(v => v.id));
    DB.videos = DB.videos.filter(v => !ids.has(v.id));
    SEED_VIDEOS.forEach(sv => { if (!DB.videos.some(v => v.id === sv.id)) DB.videos.push(clone(sv)); });
    if (DB.vdone) ids.forEach(id => delete DB.vdone[id]);
    DB.save('videos'); DB.save('vdone');
  }
}
