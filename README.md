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

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- PostgreSQL (for production)

### Installation

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
