import { defineConfig } from "drizzle-kit"

export default defineConfig({
    // the path to database schemas
    schema: "./src/drizzle/schema.ts",
    // the output of database migration files
    out: "./src/drizzle/migrations",
    // the database we are using
    driver: "pg",
    // the database connection string
    dbCredentials: {
        connectionString: process.env.DATABASE_URL as string
    },
    // tells us what happens when we generate a migration
    verbose: true,
    // makes migrations more secure
    strict: true
})