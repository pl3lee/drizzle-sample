import express from 'express';
import dotenv from 'dotenv';
import { db } from './drizzle/db';
import { UserTable } from './drizzle/schema';
dotenv.config();

export const app = express();
const port = 3001;

app.use(express.json());


app.put("/user", async (req, res) => {
    const { name } = req.body
    try {
        await db.insert(UserTable).values({
            name: name
        })
        const user = await db.query.UserTable.findFirst()
        res.json(user)
    } catch (e) {
        res.status(500).json(e)
    }
})


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});