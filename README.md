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

You can test the transformer using the provided mock data, or dynamically pass in your own files!

**Running with the included Mock Data:**
```bash
node dist/index.js --csv mock-data/recruiter.csv --pdf mock-data/resume.pdf --config mock-data/config.json
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
