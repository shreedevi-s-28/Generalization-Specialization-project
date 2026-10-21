# EER Lab — Generalization & Specialization Visualizer

**Live Demo:** eer-lab-demo.netlify.app

EER Lab is an interactive, browser-based learning platform for the Enhanced Entity-Relationship (EER) model. It helps students understand superclass/subclass hierarchies, generalization, specialization, inheritance, and constraints such as disjoint/overlapping and total/partial participation.

The platform combines a live EER diagram visualizer, SQL and table import tools, automatic relational schema generation, structured learning modules, competitive exam practice, AI-generated quizzes, and student progress tracking.

The application is designed to run directly in a browser without requiring user accounts or a database server for its core features.

---

## Features

### 1. Interactive EER Visualizer
- Create entities and attributes, and identify key attributes.
- Perform generalization by combining entities with common attributes into a superclass.
- Perform specialization by dividing a superclass into subclasses.
- Configure disjoint/overlapping and total/partial constraints using standard EER notation.
- Generate relational schemas and SQL automatically.
- Choose from four relational mapping strategies.
- Use undo/redo, auto-layout, pan, and zoom.
- Export diagrams as PNG or SVG and export generated SQL.

### 2. Table and SQL Import Workbench
- Import table definitions by pasting table structures, uploading CSV files, or pasting SQL `CREATE TABLE` statements.
- Analyze column names and data patterns to suggest entities, relationships, and potential generalization groupings.
- Review and confirm suggestions before generating an EER diagram.

### 3. ER/EER Diagram Image Recognition
- Upload an ER/EER diagram image for AI-assisted structural recognition.
- Extract proposed entities, attributes, primary keys, explicitly marked foreign keys, relationships, cardinalities, participation constraints, and specialization structures.
- Highlight uncertain elements for manual review.
- Compare the extracted structure with the original image before generating a diagram.

**Note:** AI diagram recognition requires the bundled Python server and a valid Anthropic API key. The API key is kept on the server and is not exposed to the browser. This feature is not available through the static Netlify deployment unless a compatible recognition API is separately hosted and configured.

### 4. Student Profile
- Create a personalized academic profile.
- Upload or change a student photo.
- Maintain register number, department, semester, and course information.
- Track learning progress, question accuracy, competitive scores, and milestones.

### 5. Contributors Page
- Manage contributors, including students, faculty mentors, and other project participants.
- Add, edit, delete, and reorder contributor profiles.
- Include photographs, names, roles, and optional academic information.
- Store contributor records and photos in browser IndexedDB.

Contributor information is managed dynamically through **Admin → Contributors**, rather than being hardcoded into the page.

### 6. Learn and Progress Path
- Explore 30 curriculum modules, from ER fundamentals to advanced EER mapping.
- Track progress through learning modules and topics.
- Review topic-wise accuracy tables and progress cards.
- Access curated YouTube video lectures with verified video IDs, click-to-play support, and direct-link fallbacks.
- Track completion of learning materials.

### 7. Competitive Examination Practice
- Practice GATE CS-style and university-level questions across 12 EER and DBMS topics.
- Filter questions by topic and difficulty.
- Work with questions carrying different marks, including +2M and +4M.
- Review detailed, step-by-step solutions.
- Attempt timed tests to simulate examination conditions.

### 8. Personal Performance Leaderboard
- Compare assessment attempts using scores, accuracy, and completion time.
- View rankings based on recorded performance.
- Understand the distinction between locally stored rankings and shared, server-backed multi-user rankings.

**Note:** Local browser storage does not automatically synchronize leaderboard data between different users or devices.

### 9. Admin and Content Manager
- Add, edit, preview, and delete competitive questions.
- Preview the same question card students see, including answer-key and student-view modes.
- Preview saved, unsaved, and JSON-imported questions.
- Curate YouTube video lectures.
- Manage diagram images.
- Back up and restore application data through JSON import and export.

---

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **Visualization:** Interactive browser-based EER diagram rendering
- **Data import:** CSV and SQL `CREATE TABLE` parsing
- **Storage:** Browser storage and IndexedDB
- **Backend:** Python 3 standard-library server
- **AI integration:** Anthropic API for diagram image recognition
- **Deployment:** Netlify for the static frontend

---

## Live Demo

Explore the application:

**eer-lab-demo.netlify.app**

The Netlify deployment serves the static application. Core browser-based features can run without a backend, while AI diagram recognition requires a separately running and configured Python server.

---

## Getting Started Locally

### Prerequisites
- Python 3
- A modern web browser
- An Anthropic API key, only if you want to use AI diagram recognition

### Option 1: Run the bundled server

Clone or download the repository, navigate to the project directory, and run:

```bash
export ANTHROPIC_API_KEY=your_api_key_here
python3 server.py
```

Open **http://127.0.0.1:8000** in your browser.

The API key is optional for the rest of the application. Without it, diagram recognition reports that the feature is unavailable.

You can also configure the key in a `.env` file beside `server.py`, following `.env.example`. Do not commit your actual API key to GitHub.

### Option 2: Run without the custom server

For features that do not require AI diagram recognition, you can use Python's built-in static server:

```bash
python3 -m http.server 8000
```

Then open **http://127.0.0.1:8000**.

Using a local HTTP server is recommended over opening `index.html` directly because embedded YouTube players may not work correctly on `file://` pages.

---

## AI Diagram Recognition Workflow

1. Open **Table / SQL Import → ER diagram image**.
2. Upload an ER/EER diagram.
3. The browser validates, previews, and resizes the image before sending it to the recognition API.
4. The Python server calls the vision model using the server-side API key.
5. The returned structure is validated and presented for review.
6. Uncertain elements, missing cardinalities, and unspecified constraints are highlighted or assigned visible defaults.
7. Compare the results with the original image, confirm the details, select **“I compared this with my original”**, and press **Generate**.

The application requires explicit user confirmation before the recognized structure is added to the Visualizer.

The server also implements upload-size limits, request-rate limiting, and cross-site request protections.

### Optional Environment Variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Enables AI diagram recognition |
| `ANTHROPIC_MODEL` | Selects the vision model; defaults to `claude-sonnet-5-5` |
| `PORT` | Configures the server port |
| `HOST` | Configures the server host |
| `RECOG_RATE_PER_MIN` | Configures the recognition request limit |

---

## Project Structure

```text
├── index.html                  # Bundled application
├── build.py                    # Build script
├── server.py                   # Static server and recognition API
├── .env.example                # Environment variable template
├── README.md                   # Project documentation
├── 01_style.css                # Styling and design system
├── 02_core.js                  # Utilities, storage, and icons
├── 03_eer.js                   # EER visualizer and relational mapping
├── 04_import.js                # SQL/CSV import workbench
├── 04b_vision.js               # Image validation and API client
├── 05a_content.js              # Worked examples, questions, and videos
├── 05b_topics.js               # Curriculum modules, part 1
├── 05c_topics.js               # Curriculum modules, part 2
├── 06_views1.js                # Dashboard and navigation
├── 07_views2.js                # Visualizer, workbench, and learning views
├── 08_views3.js                # Profile, contributors, progress, and admin
└── assets/
    └── contributors/           # Placeholder images
```

Contributor profiles and photographs are managed dynamically in IndexedDB; the placeholder images are not the source of truth for the contributors page.

---

## Rebuilding the Application

The repository contains modular source files and a bundled `index.html`. After editing the source CSS or JavaScript files, regenerate the bundled application by running:

```bash
python3 build.py
```

Commit the updated source files and generated `index.html` to GitHub, then redeploy the project on Netlify.

---

## Data and Privacy

- Core application features run in the browser.
- Student profiles, progress, contributor records, and other locally stored information may be specific to the current browser and device.
- Local data is not automatically shared between users.
- AI diagram recognition sends uploaded diagram images to the configured backend for processing by the selected vision provider.
- API credentials must remain on the server and must never be embedded in frontend JavaScript or committed to the repository.

---

## Project Goal

EER Lab aims to make Enhanced Entity-Relationship modeling easier to learn through interactive visualization, automated schema generation, practical SQL workflows, guided learning, and examination-oriented practice.

By combining conceptual explanations with hands-on tools, the platform helps students move from understanding EER concepts to designing and mapping complete database schemas.
