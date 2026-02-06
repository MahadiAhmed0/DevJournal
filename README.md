# DevJournal 📓

> A developer learning log & code snippet manager built with NestJS and React

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://dev-journal-63.vercel.app)
[![Backend](https://img.shields.io/badge/backend-Koyeb-blue)](https://very-austin-mahadi63-98cc9d5a.koyeb.app)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![NestJS](https://img.shields.io/badge/NestJS-10+-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev/)

![DevJournal Banner](https://via.placeholder.com/1200x400/6366f1/ffffff?text=DevJournal+-+Developer+Learning+Log)

## 🎯 Overview

DevJournal is a full-stack application designed for developers to document their learning journey, store code snippets, and share knowledge with the community. It features AI-powered content summarization, syntax highlighting, and a clean, modern interface.

### ✨ Key Features

- **📝 Journal Entries** - Document your learning with rich Markdown support
- **💻 Code Snippets** - Store and organize reusable code with syntax highlighting
- **🤖 AI Summaries** - Auto-generate summaries using Google Gemini API
- **🔍 Search** - Find entries and snippets quickly
- **🏷️ Tags** - Organize content with customizable tags
- **👥 Public/Private** - Share publicly or keep entries private
- **🔐 Authentication** - Secure authentication via Supabase Auth
- **📱 Responsive** - Works seamlessly on desktop and mobile

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| [NestJS](https://nestjs.com/) | Node.js framework for scalable server-side applications |
| [Prisma](https://www.prisma.io/) | Next-generation ORM for type-safe database access |
| [PostgreSQL](https://www.postgresql.org/) | Relational database (hosted on Supabase) |
| [Supabase Auth](https://supabase.com/auth) | Authentication & user management |
| [Google Gemini](https://ai.google.dev/) | AI-powered content summarization |
| [Docker](https://www.docker.com/) | Containerization for deployment |

### Frontend
| Technology | Purpose |
|------------|---------|
| [React 18](https://react.dev/) | UI library with hooks and concurrent features |
| [Vite](https://vitejs.dev/) | Next-generation frontend build tool |
| [TailwindCSS](https://tailwindcss.com/) | Utility-first CSS framework |
| [TanStack Query](https://tanstack.com/query) | Powerful data fetching & caching |
| [React Router](https://reactrouter.com/) | Client-side routing |
| [React Hook Form](https://react-hook-form.com/) | Performant form handling |
| [React Markdown](https://remarkjs.github.io/react-markdown/) | Markdown rendering |
| [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) | Code syntax highlighting |

### Deployment
| Service | Purpose |
|---------|---------|
| [Koyeb](https://www.koyeb.com/) | Backend hosting with Docker |
| [Vercel](https://vercel.com/) | Frontend hosting with CDN |
| [Supabase](https://supabase.com/) | PostgreSQL database hosting |

## 📁 Project Structure

```
DevJournal/
├── Backend/
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── entries/           # Journal entries module
│   │   ├── snippets/          # Code snippets module
│   │   ├── users/             # User management module
│   │   ├── gemini/            # AI summarization module
│   │   ├── prisma/            # Prisma service
│   │   └── main.ts            # Application entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Database seeding
│   ├── Dockerfile             # Docker configuration
│   └── package.json
│
├── FrontEnd/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route pages
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities & API client
│   │   ├── types/             # TypeScript type definitions
│   │   └── App.tsx            # Application root
│   ├── public/                # Static assets
│   ├── vercel.json            # Vercel configuration
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (or Supabase account)
- Google Gemini API key (optional, for AI features)

### Environment Variables

#### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/database"

# Supabase Auth
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"
SUPABASE_JWT_SECRET="your-jwt-secret"

# AI (Optional)
GEMINI_API_KEY="your-gemini-api-key"

# Server
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

#### Frontend (.env)

```env
VITE_API_URL="http://localhost:3000"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/devjournal.git
   cd devjournal
   ```

2. **Install Backend dependencies**
   ```bash
   cd Backend
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

5. **Start the backend**
   ```bash
   npm run start:dev
   ```

6. **Install Frontend dependencies** (new terminal)
   ```bash
   cd FrontEnd
   npm install
   ```

7. **Start the frontend**
   ```bash
   npm run dev
   ```

8. **Open the app**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Docs: http://localhost:3000/api

## 📖 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/auth/profile` | Get current user profile |

### Journal Entries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/entries` | List all public entries |
| GET | `/entries/:id` | Get entry by ID |
| POST | `/entries` | Create new entry |
| PATCH | `/entries/:id` | Update entry |
| DELETE | `/entries/:id` | Delete entry |
| GET | `/entries/user/me` | Get current user's entries |

### Code Snippets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/snippets` | List all public snippets |
| GET | `/snippets/:id` | Get snippet by ID |
| POST | `/snippets` | Create new snippet |
| PATCH | `/snippets/:id` | Update snippet |
| DELETE | `/snippets/:id` | Delete snippet |
| GET | `/snippets/user/me` | Get current user's snippets |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/gemini/summarize` | Generate AI summary |

## 🗄️ Database Schema

```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  name      String
  avatarUrl String?
  bio       String?
  entries   Entry[]
  snippets  Snippet[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Entry {
  id        String   @id @default(uuid())
  title     String
  content   String
  summary   String?
  tags      String[]
  isPublic  Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Snippet {
  id          String   @id @default(uuid())
  title       String
  description String?
  code        String
  language    String
  tags        String[]
  isPublic    Boolean  @default(false)
  author      User     @relation(fields: [authorId], references: [id])
  authorId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 🐳 Docker Deployment

### Build the Docker image

```bash
cd Backend
docker build -t devjournal-backend .
```

### Run the container

```bash
docker run -p 8000:8000 \
  -e DATABASE_URL="your-database-url" \
  -e SUPABASE_URL="your-supabase-url" \
  -e SUPABASE_KEY="your-supabase-key" \
  -e SUPABASE_JWT_SECRET="your-jwt-secret" \
  -e FRONTEND_URL="your-frontend-url" \
  devjournal-backend
```

## 🌐 Live Demo

- **Frontend**: https://dev-journal-63.vercel.app
- **Backend API**: https://very-austin-mahadi63-98cc9d5a.koyeb.app

> ⚠️ **Note**: The live demo will be available until **February 11, 2026** due to Koyeb free trial expiration. After this date, you can run the project locally using the instructions above.

## 📸 Screenshots

### Landing Page
![Landing Page](https://via.placeholder.com/800x450/1e1e2e/ffffff?text=Landing+Page)

### Dashboard
![Dashboard](https://via.placeholder.com/800x450/1e1e2e/ffffff?text=Dashboard)

### Code Snippets
![Code Snippets](https://via.placeholder.com/800x450/1e1e2e/ffffff?text=Code+Snippets)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Your Name**
- GitHub: [@MahadiAhmed0](https://github.com/MahadiAhmed0)

## 🙏 Acknowledgments

- [NestJS Team](https://nestjs.com/) for the amazing framework
- [Prisma Team](https://www.prisma.io/) for the excellent ORM
- [Vercel](https://vercel.com/) for frontend hosting
- [Koyeb](https://www.koyeb.com/) for backend hosting
- [Supabase](https://supabase.com/) for auth and database

---

<p align="center">Made with ❤️ by developers, for developers</p>
