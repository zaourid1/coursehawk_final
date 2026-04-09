import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, serial, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";
export * from "./models/chat";

// Courses table - course catalog
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  credits: integer("credits").notNull().default(3),
  description: text("description"),
  prerequisites: text("prerequisites").array().default(sql`'{}'::text[]`),
  category: varchar("category", { length: 50 }).notNull(), // e.g., "Core", "Elective", "General Education"
  difficulty: integer("difficulty").default(3), // 1-5 scale
  semester: varchar("semester", { length: 20 }), // "Fall", "Winter", "Spring", "Summer" or null for all
});

// Degree requirements table
export const requirements = pgTable("requirements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  requiredCredits: integer("required_credits").notNull(),
  completedCredits: integer("completed_credits").notNull().default(0),
  description: text("description"),
});

// Completed courses for a user
export const completedCourses = pgTable("completed_courses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  grade: varchar("grade", { length: 5 }),
  semester: varchar("semester", { length: 20 }),
  year: integer("year"),
});

// Semester plans
export const semesterPlans = pgTable("semester_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  semester: varchar("semester", { length: 20 }).notNull(),
  year: integer("year").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Courses in a semester plan
export const planCourses = pgTable("plan_courses", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  courseId: integer("course_id").notNull(),
  crn: varchar("crn", { length: 20 }),
  professorName: text("professor_name"),
  schedule: text("schedule"), // e.g., "MWF 10:00-11:00"
});

// Chat conversations for AI advisor (user-specific)
export const advisorChats = pgTable("advisor_chats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull().default("New Chat"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages
export const advisorMessages = pgTable("advisor_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertRequirementSchema = createInsertSchema(requirements).omit({ id: true });
export const insertCompletedCourseSchema = createInsertSchema(completedCourses).omit({ id: true });
export const insertSemesterPlanSchema = createInsertSchema(semesterPlans).omit({ id: true, createdAt: true });
export const insertPlanCourseSchema = createInsertSchema(planCourses).omit({ id: true });
export const insertAdvisorChatSchema = createInsertSchema(advisorChats).omit({ id: true, createdAt: true });
export const insertAdvisorMessageSchema = createInsertSchema(advisorMessages).omit({ id: true, createdAt: true });

// Types
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Requirement = typeof requirements.$inferSelect;
export type InsertRequirement = z.infer<typeof insertRequirementSchema>;
export type CompletedCourse = typeof completedCourses.$inferSelect;
export type InsertCompletedCourse = z.infer<typeof insertCompletedCourseSchema>;
export type SemesterPlan = typeof semesterPlans.$inferSelect;
export type InsertSemesterPlan = z.infer<typeof insertSemesterPlanSchema>;
export type PlanCourse = typeof planCourses.$inferSelect;
export type InsertPlanCourse = z.infer<typeof insertPlanCourseSchema>;
export type AdvisorChat = typeof advisorChats.$inferSelect;
export type InsertAdvisorChat = z.infer<typeof insertAdvisorChatSchema>;
export type AdvisorMessage = typeof advisorMessages.$inferSelect;
export type InsertAdvisorMessage = z.infer<typeof insertAdvisorMessageSchema>;

// Extended types for frontend
export type CourseWithEligibility = Course & {
  isEligible: boolean;
  blockedBy?: string[];
  isCompleted?: boolean;
};

export type PlanCourseWithDetails = PlanCourse & {
  course: Course;
};

export type SemesterPlanWithCourses = SemesterPlan & {
  courses: PlanCourseWithDetails[];
  totalCredits: number;
  difficultyScore: number;
};
