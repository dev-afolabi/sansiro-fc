# Sansiro FC - Football Match Tracker

A modern, authenticated football match tracking app built with React, Supabase, and Tailwind CSS.

## Features

- 🔐 **Authentication**: Secure user accounts with Supabase Auth
- ⚽ **Match Management**: Create and manage football matches with player tracking
- 📊 **Statistics**: Professional football-style leaderboard with multi-column sorting
- 🎯 **Goal & Assist Tracking**: Record goals and assists for detailed player stats
- 📱 **Responsive Design**: Mobile-first design with PWA support
- 🎨 **Premium UI**: Classy, senior-engineer-level design with football aesthetics

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **State Management**: Zustand
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Fonts**: Bebas Neue, DM Sans

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd sansiro-fc
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Run the SQL schema in your Supabase SQL editor:

```sql
-- Copy and paste the contents of supabase-schema.sql
```

This will create:
- `players` table with RLS policies
- `match_days` table with RLS policies
- Proper indexes and triggers

### 4. Enable Authentication

In your Supabase dashboard:
1. Go to Authentication > Settings
2. Configure your site URL and redirect URLs
3. Enable email confirmation if desired

### 5. Run the Application

```bash
npm run dev
```

## Database Schema

### Players Table
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to auth.users)
- `name`: TEXT
- `total_goals`: INTEGER
- `total_conceded`: INTEGER
- `total_assists`: INTEGER
- `wins`, `draws`, `losses`: INTEGER
- `points`: INTEGER
- `matches_played`: INTEGER
- `archived`: BOOLEAN

### Match Days Table
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to auth.users)
- `date`: DATE
- `aside_size`: INTEGER (8, 9, or 10)
- `backman_a`, `backman_b`: UUID (Foreign Keys to players)
- `players`: UUID[] (Array of player IDs)
- `team_a`, `team_b`: UUID[] (Array of player IDs)
- `score_a`, `score_b`: INTEGER
- `goal_scorers`: JSONB
- `assists`: JSONB
- `status`: TEXT ('setup', 'teamsheet', 'teams', 'completed')

## Features Overview

### Authentication
- User registration and login
- Protected routes
- Automatic session management
- User-specific data isolation

### Match Management
1. **Setup**: Configure match size and backmen
2. **Teamsheet**: Add players as they arrive
3. **Teams**: Randomized team generation with shuffle animation
4. **Score Entry**: Record final scores, goals, and assists
5. **Statistics**: View comprehensive player and match statistics

### Statistics Dashboard
- Professional football-style table layout
- Multi-column sorting (points, goals, wins, losses, etc.)
- Goal difference, win/loss/draw records
- Match history with detailed results

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth)
├── lib/               # External service configurations
├── pages/             # Route components
├── store/             # Zustand state management
└── utils/             # Helper functions
```

### Key Components

- **AuthContext**: Manages authentication state
- **useStore**: Supabase-integrated state management
- **Stats**: Professional leaderboard with sorting
- **ScoreEntry**: Goal and assist tracking interface

## Deployment

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Ensure environment variables are set in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details