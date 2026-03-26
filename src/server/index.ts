import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Mock Data (In a real app, this would be a database)
const users = ["ahmed saeed", "dev nora", "omar tech", "sara_v", "john_doe"];
let comments = [
   {
      "id": "Jx6ZQUuZuPk",
      "user": "omar tech",
      "text": "ahmed saeed replay",
      "parentId": "-DVtiMtchLY",
      "reactions": {
         "thumbsUp": 0,
         "heart": 0,
         "laugh": 1
      },
      "createdAt": "2026-03-24T19:36:40.790Z"
   },
];

app.get('/api/comments', (req, res) => {
   res.json(comments);
});

app.post('/api/comments', (req, res) => {
   const newComment = { id: Date.now(), ...req.body };
   comments.push(newComment);
   res.status(201).json(newComment);
});


// Only start the server if we're running locally
if (process.env.NODE_ENV !== 'production') {
   const PORT = 3001;
   app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 API Server running on http://localhost:${PORT}`);
      console.log(`📱 Access from mobile: http://YOUR_IP:${PORT}/api`);
   });
}

// Export for Vercel
export default app;