# FitShare - Workout Social Network

A social network platform for sharing and discovering workout routines. Built with React, TypeScript, and Supabase.

## Features

- **User Authentication**: Secure login and registration system
- **Workout Feed**: View workouts from users you follow
- **Explore**: Discover public workouts with search and filters
- **Create Workouts**: Build detailed workout routines with sections and exercises
- **Social Features**: Like workouts and follow other users
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth + PostgreSQL + Storage)
- **State Management**: Zustand
- **Icons**: Lucide React
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
├── lib/                # Utility functions and configurations
└── App.tsx             # Main application component
```

## Database Schema

The application uses the following tables (all in English):

- **users**: User profiles and authentication
- **workouts**: Workout routines with metadata
- **sections**: Workout sections (e.g., warm-up, cardio, strength)
- **exercises**: Individual exercises within sections
- **followers**: User following relationships
- **likes**: Workout likes from users

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd mygym
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy the migration file from `supabase/migrations/20241219_initial_schema.sql`
3. Run the migration in your Supabase SQL editor
4. Get your project URL and anon key from Supabase dashboard

### 4. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Add your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run check` - Run TypeScript type checking

## Features in Detail

### Authentication
- Email and password registration
- Secure login with Supabase Auth
- Protected routes for authenticated users

### Workout Management
- Create workouts with multiple sections
- Add different types of exercises (repetitions, time-based, rest)
- Set workout category, difficulty, and duration
- Choose between public and private workouts

### Social Features
- Like workouts and see like counts
- Follow other users to see their workouts in your feed
- Explore public workouts with search and filters

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Consistent design system with proper spacing and colors
- Touch-optimized interactions

## API Endpoints

The application uses Supabase client SDK for all API operations:

- **Authentication**: Supabase Auth
- **Workouts**: CRUD operations on workouts table
- **Sections**: Manage workout sections
- **Exercises**: Handle individual exercises
- **Social**: Follow users and like workouts

## Deployment

The application is ready for deployment on platforms like Vercel, Netlify, or any static hosting service that supports React applications.

1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables in your hosting platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run type checking: `npm run check`
5. Submit a pull request

## License

This project is open source and available under the MIT License.