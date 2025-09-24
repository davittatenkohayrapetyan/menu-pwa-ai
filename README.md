# menu-pwa-ai

AI-powered PWA that scans restaurant menus via camera, extracts dishes with descriptions, and lets users edit items. Backend enriches entries with detailed descriptions, estimated nutrition, and generated images using OpenAI. Includes offline support, JWT auth, and Dockerized deployment.

## Features

- 📷 Camera capture for menu photos
- 🤖 AI-powered menu text extraction and parsing
- ✏️ Interactive menu items editing
- 🔄 Offline support with Dexie IndexedDB
- 📱 Progressive Web App (PWA) capabilities
- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- 🗄️ SQLite database with Prisma ORM
- 🐳 Docker containerization support

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd menu-pwa-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Add your OpenAI API key to .env.local
```

4. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Docker Development

Build and run with Docker Compose:

```bash
docker-compose up --build
```

## Core Workflow

1. **Capture Menu Photo**: Use camera to take a photo of a restaurant menu
2. **Parse Menu**: Call `/api/parse-menu` to extract text and identify dishes
3. **Edit Items List**: Review and modify the extracted menu items
4. **AI Enrichment**: Enhance items with detailed descriptions, nutrition info, and generated images

## Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Prisma with SQLite
- **Offline Storage**: Dexie (IndexedDB wrapper)
- **PWA**: Service Worker and Web App Manifest
- **AI**: OpenAI API for text processing and image generation
- **Deployment**: Docker & Docker Compose
