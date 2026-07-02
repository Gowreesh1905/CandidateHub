# Multi-Source Candidate Data Transformer

A pluggable, config-driven data processing pipeline that ingests messy candidate profiles from multiple sources (Structured CSVs, Unstructured PDFs), resolves conflicts intelligently using a Field-Level Trust Matrix, and projects a clean, configurable canonical record.

## 🚀 Features

- **Pluggable Ingestion Engine**: Easily scale to new data sources without touching the core engine.
- **Identity Resolution**: Multi-pass heuristic matching prevents bad merges (e.g., shared phone numbers but different names).
- **Field-Level Trust Matrix**: Intelligently resolves data conflicts based on source reliability (e.g., Resume > Recruiter CSV for Skills).
- **Deep Lineage Tracking**: Every final data point includes `provenance` detailing exactly *why* and *where* it was selected.
- **Config-Driven Projection**: A runtime JSON config dictates the final output shape and normalization rules (e.g., E.164 phone formatting).
- **Transformation Report**: Automatically outputs a visual summary of the resolution process to the console.

## 📦 Setup & Installation

Ensure you have [Node.js](https://nodejs.org/) installed, then run:

```bash
npm install
npx tsc
```

## 🛠️ Usage & Testing



### 1. Testing Local Files (CSV & PDF)
This tests the pipeline on local standard data. It demonstrates perfect merging (John Doe's CSV + PDF), robust Identity Resolution (John Edge vs Mary Edge), and strict projection skipping (Ghost User).

**Default Config:**
```bash
node dist/index.js --csv mock-data/demo/recruiter.csv --pdf mock-data/demo/john-resume.pdf,mock-data/demo/mary-resume.pdf --config mock-data/demo/config.json
```

**Custom Config (Dynamic Renaming & Formatting):**
```bash
node dist/index.js --csv mock-data/demo/recruiter.csv --pdf mock-data/demo/john-resume.pdf,mock-data/demo/mary-resume.pdf --config mock-data/demo/custom-config.json
```

### 2. Testing Structured & Remote APIs (ATS JSON & GitHub)
This tests the extensible architecture by feeding it standard ATS JSON and a live GitHub profile URL. It proves the system can pull from local JSON files or live API URLs (`api.github.com`).

**Default Config:**
```bash
node dist/index.js --ats mock-data/demo/ats-export.json --github https://github.com/torvalds --config mock-data/demo/config.json
```

**Custom Config:**
```bash
node dist/index.js --ats mock-data/demo/ats-export.json --github https://github.com/torvalds --config mock-data/demo/custom-config.json
```

### 3. The Ultimate Test (All Sources & Custom Files)
To run every single source at once:
```bash
node dist/index.js --csv mock-data/demo/recruiter.csv --pdf mock-data/demo/john-resume.pdf --ats mock-data/demo/ats-export.json --github https://github.com/torvalds --config mock-data/demo/config.json
```
### 4. Testing With Your Own Files (Custom Data)
You are completely free to point the CLI at your own test files! The engine does not hardcode any file paths and supports passing multiple comma-separated paths for any source.

To test your own custom data, simply replace the placeholders with your actual file paths or URLs:
```bash
node dist/index.js --csv /path/to/custom1.csv,/path/to/custom2.csv --pdf /path/to/resume.pdf --ats https://api.your-ats.com/export.json --github https://github.com/your-username --config /path/to/custom-config.json
```
## 🧠 Architecture Overview & Core Concepts

This pipeline is engineered for extensibility, data integrity, and auditability. The architecture is decoupled into four independent layers utilizing Object-Oriented Design patterns in TypeScript:

### 1. Pluggable Ingestion Strategy
To ensure the core engine remains completely agnostic to incoming data formats, the system relies on the Strategy Design Pattern via a strict `IIngestor` interface. New data sources (CSV, PDF, ATS JSON, GitHub API) are implemented as isolated classes that normalize raw data into a standard `NormalizedRecord` payload. 

The ingestion layer natively supports both local file parsing (utilizing `fs` and `pdf-parse`) and asynchronous network requests (`fetch`) for live API payloads. Furthermore, network-based ingestors implement graceful degradation; if an external API enforces rate-limiting or bot-blocking (e.g., HTTP 999), the ingestor catches the exception, logs a standard CLI warning, and allows the broader pipeline execution to continue uninterrupted.

### 2. Identity Resolution Engine
Matching candidate records across disjointed sources requires more than simple exact-match logic. The engine employs a multi-pass heuristic grouping algorithm to safely aggregate profiles.

It first groups records using strict primary keys (e.g., `primary_email`), followed by a secondary pass using softer identifiers (e.g., `phone` and `full_name`). Crucially, the engine includes collision prevention mechanisms. For example, if two records share a phone number but have vastly different primary emails, the heuristics actively reject the merge, preventing catastrophic downstream data pollution.

### 3. Field-Level Trust Matrix
When disparate sources provide conflicting data for the same candidate, the system utilizes a deterministic scoring algorithm to resolve the contradiction. 

Each `IIngestor` assigns a baseline Confidence Score to its payload based on source reliability (e.g., a candidate's own parsed PDF resume is mathematically weighted to be more trustworthy for `skills` than a recruiter's manual CSV entry). During the merge phase, the engine evaluates this Trust Matrix on a strictly per-field basis, selecting the single most reliable data point for each attribute.

To ensure deep lineage and auditability, every value in the final JSON output includes a `provenance` array detailing the exact source that provided the data and the mathematical score that justified its selection.

### 4. Config-Driven Projection Engine
The final output schema is completely decoupled from the internal business logic. A runtime projection engine reads mapping rules from an external `config.json` file, allowing stakeholders to reshape the data without modifying the TypeScript codebase.

This projection layer supports dynamic key renaming, object nesting, and strict schema validation. If the runtime configuration specifies that a field is mandatory (e.g., `"required": true`), and an upstream ingestor fails to provide it, the Projection Engine intercepts the candidate profile, logs a validation warning, and drops the record to maintain strict data hygiene.
