# Hop Bunny Game Backend API

This is the backend API for the Hop Bunny game, providing user authentication and a leaderboard system.

## Setup

1. Install dependencies:
```
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb+srv://your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
```

3. Run the server:
```
npm run dev
```

## Deploying to Vercel

1. Install Vercel CLI:
```
npm install -g vercel
```

2. Deploy to Vercel:
```
vercel
```

3. Add environment variables in the Vercel dashboard:
   - MONGODB_URI
   - JWT_SECRET

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### Scores
- `POST /api/scores` - Submit a score (authenticated)
- `GET /api/leaderboard` - Get top 10 scores
- `GET /api/scores/me` - Get user's personal best score (authenticated)

## Technologies
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- bcrypt.js for password hashing 