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
CORS_ORIGIN=*
```

3. Run the server:
```
npm run dev
```

## Deploying to Vercel

### Manual Deployment (Recommended for fixing errors)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project or create a new one
3. Go to "Settings" > "Environment Variables"
4. Add or update these environment variables:
   - `MONGODB_URI` = Your MongoDB connection string
   - `JWT_SECRET` = Any secure random string
   - `CORS_ORIGIN` = `*`
5. Go to "Deployments" tab
6. Click "Redeploy" on your last deployment or create a new deployment

### CLI Deployment

1. Install Vercel CLI:
```
npm install -g vercel
```

2. Deploy to Vercel:
```
vercel
```

## Troubleshooting Deployment Errors

If you see a 500 INTERNAL_SERVER_ERROR or "Serverless Function has crashed" message:

1. **Check MongoDB Connection String**:
   - Verify the connection string in your Vercel environment variables
   - Ensure your MongoDB Atlas cluster is running
   - Make sure network access is allowed (IP whitelist includes 0.0.0.0/0)

2. **Test Simplified Endpoints**:
   - Try accessing `/api/health` or `/api/test` endpoints
   - These don't require database access and should work even if MongoDB fails

3. **Check Vercel Logs**:
   - In your Vercel dashboard, go to your project
   - Click on the latest deployment
   - Click "View Function Logs" to see detailed error information

4. **Use the Simplified API**:
   - The `api/index.js` file contains a simplified version of the API
   - This is optimized for Vercel's serverless environment

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