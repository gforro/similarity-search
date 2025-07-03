# Similarity Search

A TypeScript application that finds the most similar person records using OpenAI embeddings and HNSW (Hierarchical Navigable Small World) vector search algorithm.

## Overview

This project implements a similarity search system that:
1. Generates embeddings for person records using OpenAI's text-embedding-3-small model
2. Stores vectors in an HNSW index for fast similarity search
3. Finds the most similar candidates and analyzes differences using OpenAI's chat completion
4. Handles OpenAI API rate limits intelligently with automatic retry logic

## Features

- **OpenAI Embeddings**: Uses OpenAI's text-embedding-3-small model for high-quality vector representations
- **HNSW Vector Search**: Fast approximate nearest neighbor search using hnswlib-node
- **Intelligent Rate Limiting**: Automatic handling of OpenAI API rate limits with retry logic
- **Similarity Analysis**: Detailed comparison reports using GPT-4 mini
- **Concurrent Processing**: Parallel processing with concurrency limits

## Installation

### Prerequisites

- Node.js 20+ (project uses Node 20+ features like `--env-file`)
- npm package manager
- OpenAI API key

### Setup

1. Clone the repository:
```bash
git clone https://github.com/gforro/similarity-search.git
cd similarity-search
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create a .env file in the project root
echo "OPENAI_KEY=your-openai-api-key-here" > .env
```

## Usage

### Data Format

The application expects JSON files with arrays of person records:

```typescript
interface Person {
  id: number;
  name: string;
  title: string;
  summary: string;
  skills: string[];
}
```

Example data file:
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "title": "Senior Software Engineer",
    "summary": "Experienced developer with focus on backend systems",
    "skills": ["TypeScript", "Node.js", "PostgreSQL", "AWS"]
  }
]
```

### Running the Application

1. Prepare your data files:
   - `files/datasetB.json` - The reference dataset to build the vector index
   - `files/datasetA.json` - Records to find similarities for

2. Run the similarity search:
```bash
# Development mode with TypeScript
npm run dev

# Build and run production version
npm run build
npm run start
```

3. Results will be saved to `files/comparison_report.json`

### Output Format

The application generates a detailed comparison report:

```json
[
  {
    "recordToMatch": { /* person from datasetA */ },
    "bestMatch": { /* most similar person from datasetB */ },
    "similarity": 0.92,
    "diffSummary": "Skills updated from JavaScript to TypeScript"
  }
]
```

## Architecture

The application follows a modular architecture with clear separation of concerns:

### Core Components

1. **Embedding Process** (`src/embedding-process.ts`)
   - Generates embeddings for person records
   - Stores vectors in the HNSW index

2. **Similarity Analysis Process** (`src/similarity-analysis-process.ts`)
   - Finds similar candidates using vector search
   - Analyzes differences using GPT-4 mini

3. **OpenAI Integration** (`src/openai/`)
   - `EmbeddingActivity`: Handles text-embedding-3-small API calls
   - `SimilarityAnalysisActivity`: Manages GPT-4 mini chat completions
   - `OpenAIActivityManager`: Orchestrates API calls with rate limiting

4. **Rate Limiting** (`src/ratelimit/`)
   - `OpenAIHeadersChecker`: Intelligent rate limit handling
   - Automatic retry with exponential backoff
   - Tracks both request and token limits

5. **Vector Storage** (`src/storage/`)
   - `HNSWStorage`: HNSW index implementation using hnswlib-node
   - Cosine similarity metric for 1536-dimensional embeddings

### Data Flow

```
1. Load reference dataset (datasetB.json)
   ↓
2. Generate embeddings for each person
   ↓
3. Store vectors in HNSW index
   ↓
4. Load comparison dataset (datasetA.json)
   ↓
5. For each person in datasetA:
   a. Generate embedding
   b. Find top 3 similar candidates from HNSW
   c. Use GPT-4 mini to analyze similarities
   ↓
6. Save results to comparison_report.json
```

## Scripts

- `npm run dev` - Run in development mode with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the compiled JavaScript
- `npm run lint` - Run ESLint on source files
- `npm run lint:fix` - Auto-fix linting issues
- `npm run test` - Launch node tests

## Rate Limiting

The application includes rate limit handling for OpenAI API calls:

- Automatically parses rate limit headers from OpenAI responses
- Tracks both request and token limits
- Calculates optimal wait times to avoid hitting limits
- Implements automatic retry with exponential backoff
- Separate rate limiters for embeddings and chat completions

## Performance Considerations

- **Concurrency**: Default limit of 20 concurrent operations (can be changed in `index.ts`)
- **Embedding Model**: Uses `text-embedding-3-small` for cost-effectiveness
- **HNSW Parameters**: Optimized for cosine similarity with 1536-dimensional vectors
- **Token Estimation**: Pre-calculates token usage to avoid rate limits

## Environment Variables

- `OPENAI_KEY` - Your OpenAI API key (required)

## Acknowledgments

- OpenAI for providing embedding and chat completion APIs
- hnswlib-node for the efficient vector search implementation
- Built with ❤️ by [@gforro](https://github.com/gforro)
