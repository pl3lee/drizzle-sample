import { pgTable, uuid, varchar } from "drizzle-orm/pg-core"

// we are creating a table called "user"
export const UserTable = pgTable("user", {
    // the argument id is the name of the column
    // specifies that this is a primary key, and gets a random value by default
    // if we want an auto incrementing id, we can use 
    // serial("id").primaryKey()
    // serial is a function that generates an auto incrementing id
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull()
})