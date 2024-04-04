import express from 'express';
import dotenv from 'dotenv';

export const app = express();
const port = 3001;
dotenv.config();
app.use(express.json());


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });