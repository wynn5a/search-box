# SearchBox

<div align="center">
  <p>A powerful and modern web interface for managing multiple OpenSearch clusters</p>

  [![License: MIT](https://img.shields.io/badge/License-GNU%20GPL%20v3-green.svg)](https://opensource.org/license/gpl-3-0)
  [![Next.js](https://img.shields.io/badge/Next.js-13+-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-38B2AC)](https://tailwindcss.com/)
</div>

## ✨ Features

- 🌐 **Multi-cluster Management**
  - Manage and monitor multiple OpenSearch clusters from a single dashboard
  - Real-time cluster health monitoring
  - Comprehensive cluster statistics and metrics

- 🔒 **Advanced Security**
  - Support for Basic Authentication
  - SSH tunneling capabilities for secure remote connections
  - Secure credential management

- 📊 **Powerful Monitoring**
  - Real-time cluster health monitoring
  - Node status and statistics
  - Index metrics and shard distribution
  - Storage usage analytics
  - Custom dashboard with key metrics

- 📑 **Index Management**
  - Create and delete indices
  - Modify index settings and mappings
  - Monitor index health and statistics
  - Manage index lifecycle

- 🔍 **Data Query Interface**
  - Built-in query editor with syntax highlighting
  - Query templates support
  - Results visualization
  - Export capabilities

- 🎨 **Modern User Experience**
  - Clean and intuitive interface
  - Responsive design for all devices
  - Dark/Light theme support
  - i18n support (English/Chinese)

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 13+](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Context + Hooks
- **Form Handling**: React Hook Form + Zod
- **UI Components**:
  - [shadcn/ui](https://ui.shadcn.com/)
  - [Radix UI](https://www.radix-ui.com/)
  - [Lucide Icons](https://lucide.dev/)

### Backend
- **API**: Next.js API Routes
- **Database**: [Prisma](https://www.prisma.io/) with PostgreSQL
- **Authentication**: NextAuth.js
- **OpenSearch Client**: Official OpenSearch JavaScript Client
- **SSH Tunneling**: SSH2

### Developer Experience
- **Code Quality**:
  - ESLint
  - Prettier
  - TypeScript strict mode

### Deployment
- **Containerization**: Docker
- **Orchestration**: Docker Compose

## 🚀 Getting Started

### Prerequisites

#### Local Development
- Node.js 20+
- npm or yarn
- PostgreSQL (for production)

#### Docker Development
- Docker
- Docker Compose

### Installation

#### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/search-box.git
   cd search-box
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration

4. Start the development server:
   ```bash
   npx prisma generate
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

#### Docker Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/search-box.git
   cd search-box
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration

3. Start the development environment with Docker:
   ```bash
   ./scripts/docker-dev.sh
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

#### Production Deployment with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/search-box.git
   cd search-box
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your production configuration

3. Start the production environment with Docker:
   ```bash
   ./scripts/docker-prod.sh
   ```

4. Access your application at [http://localhost:3000](http://localhost:3000) or configure a reverse proxy for production use

## 📦 Docker

This project includes Docker support for both development and production environments.

### Docker Configuration

- **Dockerfile**: Production-ready container with optimized build
- **Dockerfile.dev**: Development container with hot-reloading
- **docker-compose.yml**: Production services configuration
- **docker-compose.dev.yml**: Development services configuration

### Docker Commands

```bash
# Start development environment
./scripts/docker-dev.sh

# Start production environment
./scripts/docker-prod.sh

# Build production image only
docker build -t search-box .

# Run database migrations in Docker
docker-compose exec app npx prisma migrate deploy
```

### Troubleshooting

#### Network Issues

If you encounter network issues when building Docker images, try the following:

1. Check your internet connection
2. Make sure Docker Desktop is running
3. Try using a VPN if you're in a region with restricted access
4. Use the `--network host` flag with Docker commands:
   ```bash
   docker build --network host -t search-box .
   ```
5. If you're behind a corporate proxy, configure Docker to use it:
   ```bash
   # In ~/.docker/config.json
   {
     "proxies": {
       "default": {
         "httpProxy": "http://proxy:port",
         "httpsProxy": "http://proxy:port",
         "noProxy": "localhost,127.0.0.1"
       }
     }
   }
   ```

#### Prisma Schema Issues

If you encounter issues with Prisma not finding the schema file in the Docker container, you can use the provided script to copy it manually:

```bash
# After starting the containers
./scripts/copy-prisma-schema.sh

# Then restart the app container
docker-compose restart app
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📝 License

This project is licensed under the GNU GPLv3 License - see the [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [OpenSearch](https://opensearch.org/) for the amazing search engine
- [Vercel](https://vercel.com) for the excellent deployment platform
- All our contributors and users

---

<div align="center">
  <sub>Built with ❤️ by the community</sub>
</div>
