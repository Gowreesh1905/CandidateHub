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

We have provided two sets of mock data so you can test both the "Happy Path" and the advanced edge-case handling.

**1. The Happy Path (Perfect Merging)**
This tests the pipeline on standard data. It perfectly merges "John Doe" across the CSV and PDF based on his email, intelligently resolving conflicts using the Field-Level Trust Matrix.
```bash
node dist/index.js --csv mock-data/happy-path/recruiter.csv --pdf mock-data/happy-path/resume.pdf --config mock-data/happy-path/config.json
```

**2. The Edge Cases (Strict Validation & Identity Checks)**
This tests the robust safety mechanisms of the pipeline. It features a CSV with two different candidates who share the same phone number (the Identity Resolution prevents a bad merge), and a candidate missing a required email (triggering a graceful Projection Validation error).
```bash
node dist/index.js --csv mock-data/edge-cases/edge-cases.csv --pdf mock-data/edge-cases/mary-edge-resume.pdf --config mock-data/edge-cases/config.json
```

**Testing with Your Own Dynamic Inputs (IMPORTANT):**
You are completely free to point the CLI at your own test files! The engine does not hardcode any file paths.
To test your own data, simply drop your CSVs or PDFs anywhere on your machine and pass their paths to the flags:
```bash
node dist/index.js --csv /path/to/your/custom.csv --pdf /path/to/your/custom.pdf --config /path/to/your/custom-config.json
```

## 🧠 Architecture Overview
1. **Ingestion**: `CsvIngestor` and `PdfResumeIngestor` normalize messy inputs into standard `NormalizedRecord` objects.
2. **Matching**: Grouping algorithms ensure we only merge data belonging to the exact same human.
3. **Merging**: The Field-Level Trust Matrix picks the most reliable data points to form the `CanonicalProfile`.
4. **Projection**: The Engine dynamically extracts and maps fields based on the runtime config rules, throwing errors if required data is missing.
