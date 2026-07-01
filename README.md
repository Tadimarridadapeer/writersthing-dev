# Writersthing Platform

Welcome to the Writersthing Platform repository! This project is a full-stack web application designed for writers and readers.

## Repository Structure

- `/frontend`: The web client built with Next.js and React. It contains all the UI components, pages (like dashboard, marketplace, profile), and API routes for the frontend.
- `/backend`: The server-side application built with Node.js. It handles core business logic, book processing, and payments.
- `/supabase_*.sql`: Database schema files for Supabase. Includes schemas for core features, social interactions, and user engagement.
- `/favicons`: Various application icons and logos for different devices.

## Getting Started

### Frontend
Navigate to the frontend directory to run the Next.js app:
```bash
cd frontend
npm install
npm run dev
```

### Backend
Navigate to the backend directory to run the Node.js server:
```bash
cd backend
npm install
npm run dev
```

## Database
The platform relies on Supabase. You can find the database schemas in the root SQL files to set up your tables, row-level security (RLS), and storage configurations.
