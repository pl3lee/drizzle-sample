import { relations } from "drizzle-orm"
import { index, integer, pgEnum, pgTable, uniqueIndex, uuid, varchar, unique, boolean, real, timestamp, primaryKey } from "drizzle-orm/pg-core"

// remember to export this!
export const UserRole = pgEnum("userRole", ["ADMIN", "BASIC"])

// we are creating a table called "user"
export const UserTable = pgTable("user", {
    // the argument id is the name of the column
    // specifies that this is a primary key, and gets a random value by default
    // if we want an auto incrementing id, we can use 
    // serial("id").primaryKey()
    // serial is a function that generates an auto incrementing id
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    age: integer("age").notNull(),
    // no need to enforce that the email is unique, since we are already using uniqueIndex below
    email: varchar("email", { length: 255 }).notNull(),
    // either BASIC or ADMIN, defined as an enum above, with default value BASIC
    role: UserRole("userRole").default("BASIC").notNull()
}, table => {
    return {
        // we are defining an index on the email column so that it is faster to query
        // or we can just do index("emailIndex").on(table.email) if we do not need it to be unique
        emailIndex: uniqueIndex("emailIndex").on(table.email),
        // the combination of name and age must be unique
        uniqueNameAndAge: unique("uniqueNameAndAge").on(table.name, table.age)
    }
})

export const UserPreferencesTable = pgTable("userPreferences", {
    id: uuid("id").primaryKey().defaultRandom(),
    emailUpdates: boolean("emailUpdates").notNull().default(false),
    // references creates a foreign key to the user table
    userId: uuid("userId")
        .references(() => UserTable.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull()
})

export const PostTable = pgTable("post", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    // this is a rating between 1-5 that is a decimal number. In postgres, we use the real type
    averageRating: real("averageRating").notNull().default(0),
    // timestamps for when the post was created and updated
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    // the userId that created this post
    authorId: uuid("authorId").references(() => UserTable.id).notNull()
})

export const CategoryTable = pgTable("category", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
})

// Note that we do not need an id for this table, since the combination of postId and categoryId is unique and thus can be used as a primary key
export const PostCategoryTable = pgTable("postCategory", {
    // the post id
    postId: uuid("postId").references(() => PostTable.id).notNull(),
    // the category id
    categoryId: uuid("categoryId").references(() => CategoryTable.id).notNull()
}, table => {
    return {
        // creating a composite primary key on postId and categoryId
        pk: primaryKey({ columns: [table.postId, table.categoryId] })
    }
})


// Relations

// here we are saying our user table has one user preference from the user preferences table, and many posts from the post table.
// user 1-1 user preferences
// user 1-many post
export const UserTableRelations = relations(UserTable, ({ one, many }) => {
    return {
        preferences: one(UserPreferencesTable),
        posts: many(PostTable)
    }
})

// for the table that has a foreign key with a 1-1 relationship, we have to pass in another argument to the relations function to specify the foreign key
// user preferences 1-1 user
export const UserPreferencesTableRelations = relations(UserPreferencesTable, ({ one }) => {
    return {
        user: one(UserTable, {
            fields: [UserPreferencesTable.userId],
            references: [UserTable.id]
        })
    }
})

// for a 1-many relationship, whichever table is the 1 side will have to specify the foreign key
// no need to specify foreign key for the many side
// post many-1 user
export const PostTableRelations = relations(PostTable, ({ one, many }) => {
    return {
        author: one(UserTable, {
            fields: [PostTable.authorId],
            references: [UserTable.id]
        }),
        postCategories: many(PostCategoryTable)
    }
})

// category 1-many post category
export const CategoryTableRelations = relations(CategoryTable, ({ many }) => {
    return {
        postCategories: many(PostCategoryTable)
    }
})

// post category 1-1 post
// post category many-1 category
export const PostCategoryTableRelations = relations(PostCategoryTable, ({ one }) => {
    return {
        post: one(PostTable, {
            fields: [PostCategoryTable.postId],
            references: [PostTable.id]
        }),
        category: one(CategoryTable, {
            fields: [PostCategoryTable.categoryId],
            references: [CategoryTable.id]
        })
    }
})