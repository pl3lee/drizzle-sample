import express from 'express';
import dotenv from 'dotenv';
import { db } from './drizzle/db';
import { UserPreferencesTable, UserTable } from './drizzle/schema';
import { asc, between, count, eq, gt, sql } from 'drizzle-orm';
dotenv.config();

export const app = express();
const port = 3001;

app.use(express.json());


app.put("/user", async (req, res) => {
    const { name, age, email, role } = req.body
    if (!name || !age || !email) {
        res.status(400).json({ error: "name, age, and email are required" })
        return
    }
    try {
        const user = await db.insert(UserTable).values({
            name: name,
            age: age,
            email: email,
            ...{ role: role && role }
        }).returning({
            // our key id maps to UserTable.id
            id: UserTable.id
        }).onConflictDoNothing()
        res.status(200).json(user)
    } catch (e) {
        res.status(500).json(e)
    }
})

app.get("/users", async (req, res) => {
    try {
        const users = await db.query.UserTable.findMany({
            // leaving this blank is going to return all columns
            // you can also set a field to false to exclude it
            columns: { name: true, email: true },
            // this allows us to run raw SQL to return extra information
            extras: { lowerCaseName: sql<string>`lower(${UserTable.name})`.as("lowerCaseName") },
            offset: 1,
            limit: 5,
            // can leave preferences: true if we want to have all the columns from preferences
            with: {
                preferences: {
                    columns: {
                        emailUpdates: true
                    }
                },
                posts: {
                    with: {
                        postCategories: true
                    }
                }
            },
            // or desc
            orderBy: asc(UserTable.name),
            where: (table, funcs) => funcs.between(table.age, 20, 25)
        })
        res.json(users)
    } catch (e) {
        res.status(500).json(e)
    }
})

app.get("/users/sqlstyle", async (req, res) => {
    try {
        const users1 = await db
            .select({ id: UserTable.id, age: UserTable.age, emailUpdates: UserPreferencesTable.emailUpdates })
            .from(UserTable)
            .where(between(UserTable.age, 10, 30))
            .leftJoin(UserPreferencesTable, eq(UserPreferencesTable.userId, UserTable.id))
            .orderBy(asc(UserTable.name))

        // grouping by name and counting the number of users with that name, and only returning the ones with more than 1
        const users2 = await db
            .select({
                name: UserTable.name,
                count: count(UserTable.name)
            })
            .from(UserTable)
            .groupBy(UserTable.name)
            .having(columns => gt(columns.count, 1))
        res.json({ users1, users2 })
    } catch (e) {
        res.status(500).json(e)
    }
})

app.post("/user", async (req, res) => {
    const { id, name, age, email, role } = req.body
    if (!id) {
        return res.status(400).json({ error: "id is required" })
    }
    try {
        const updatedUser = await db.update(UserTable).set({
            ...{ name: name && name },
            ...{ age: age && age },
            ...{ email: email && email },
            ...{ role: role && role }
        }).where(eq(UserTable.id, id)).returning({
            id: UserTable.id,
            name: UserTable.name,
            age: UserTable.age,
            email: UserTable.email,
            role: UserTable.role
        })
        res.json(updatedUser)
    } catch (e) {
        return res.status(500).json(e)
    }
})

app.delete("/user", async (req, res) => {
    const { id } = req.body
    if (!id) {
        return res.status(400).json({ error: "id is required" })
    }
    try {
        const deletedUser = await db.delete(UserTable).where(eq(UserTable.id, id)).returning({
            id: UserTable.id,
            name: UserTable.name,
            age: UserTable.age,
            email: UserTable.email,
            role: UserTable.role
        })
        res.json(deletedUser)
    } catch (e) {
        return res.status(500).json(e)
    }
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});