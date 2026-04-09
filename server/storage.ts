import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  courses,
  requirements,
  completedCourses,
  semesterPlans,
  planCourses,
  advisorChats,
  advisorMessages,
  type Course,
  type InsertCourse,
  type Requirement,
  type InsertRequirement,
  type CompletedCourse,
  type InsertCompletedCourse,
  type SemesterPlan,
  type InsertSemesterPlan,
  type PlanCourse,
  type InsertPlanCourse,
  type AdvisorChat,
  type InsertAdvisorChat,
  type AdvisorMessage,
  type InsertAdvisorMessage,
  type CourseWithEligibility,
  type SemesterPlanWithCourses,
  type PlanCourseWithDetails,
} from "@shared/schema";

export interface IStorage {
  // Courses
  getAllCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourseByCode(code: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getCoursesWithEligibility(userId: string): Promise<CourseWithEligibility[]>;
  getEligibleCourses(userId: string): Promise<Course[]>;

  // Requirements
  getRequirements(userId: string): Promise<Requirement[]>;
  createRequirement(req: InsertRequirement): Promise<Requirement>;
  updateRequirement(id: number, completedCredits: number): Promise<Requirement | undefined>;

  // Completed Courses
  getCompletedCourses(userId: string): Promise<(CompletedCourse & { course: Course })[]>;
  addCompletedCourse(data: InsertCompletedCourse): Promise<CompletedCourse>;
  removeCompletedCourse(id: number): Promise<void>;
  getCompletedCourseCodes(userId: string): Promise<string[]>;

  // Semester Plans
  getPlans(userId: string): Promise<SemesterPlanWithCourses[]>;
  getPlan(id: number): Promise<SemesterPlanWithCourses | undefined>;
  createPlan(plan: InsertSemesterPlan): Promise<SemesterPlan>;
  deletePlan(id: number): Promise<void>;
  setActivePlan(userId: string, planId: number): Promise<void>;

  // Plan Courses
  addCourseToPlan(data: InsertPlanCourse): Promise<PlanCourse>;
  removeCourseFromPlan(planCourseId: number): Promise<void>;

  // Advisor Chats
  getAdvisorChats(userId: string): Promise<AdvisorChat[]>;
  getAdvisorChat(id: number): Promise<(AdvisorChat & { messages: AdvisorMessage[] }) | undefined>;
  createAdvisorChat(data: InsertAdvisorChat): Promise<AdvisorChat>;
  deleteAdvisorChat(id: number): Promise<void>;

  // Advisor Messages
  addAdvisorMessage(data: InsertAdvisorMessage): Promise<AdvisorMessage>;

  // Stats
  getStats(userId: string): Promise<{
    totalCredits: number;
    completedCredits: number;
    completedCourses: number;
    upcomingCourses: number;
  }>;

  // Seed
  seedCourses(): Promise<void>;
  seedRequirements(userId: string): Promise<void>;
}

class DatabaseStorage implements IStorage {
  // Courses
  async getAllCourses(): Promise<Course[]> {
    return db.select().from(courses);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseByCode(code: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.code, code));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await db.insert(courses).values(course).returning();
    return created;
  }

  async getCoursesWithEligibility(userId: string): Promise<CourseWithEligibility[]> {
    const allCourses = await this.getAllCourses();
    const completedCodes = await this.getCompletedCourseCodes(userId);

    return allCourses.map(course => {
      const isCompleted = completedCodes.includes(course.code);
      const prerequisites = course.prerequisites || [];
      const missingPrereqs = prerequisites.filter(p => !completedCodes.includes(p));
      const isEligible = missingPrereqs.length === 0;

      return {
        ...course,
        isEligible,
        isCompleted,
        blockedBy: missingPrereqs.length > 0 ? missingPrereqs : undefined,
      };
    });
  }

  async getEligibleCourses(userId: string): Promise<Course[]> {
    const coursesWithElig = await this.getCoursesWithEligibility(userId);
    return coursesWithElig.filter(c => c.isEligible && !c.isCompleted);
  }

  // Requirements
  async getRequirements(userId: string): Promise<Requirement[]> {
    return db.select().from(requirements).where(eq(requirements.userId, userId));
  }

  async createRequirement(req: InsertRequirement): Promise<Requirement> {
    const [created] = await db.insert(requirements).values(req).returning();
    return created;
  }

  async updateRequirement(id: number, completedCredits: number): Promise<Requirement | undefined> {
    const [updated] = await db
      .update(requirements)
      .set({ completedCredits })
      .where(eq(requirements.id, id))
      .returning();
    return updated;
  }

  // Completed Courses
  async getCompletedCourses(userId: string): Promise<(CompletedCourse & { course: Course })[]> {
    const completed = await db.select().from(completedCourses).where(eq(completedCourses.userId, userId));
    const result = [];
    for (const cc of completed) {
      const course = await this.getCourse(cc.courseId);
      if (course) {
        result.push({ ...cc, course });
      }
    }
    return result;
  }

  async addCompletedCourse(data: InsertCompletedCourse): Promise<CompletedCourse> {
    const [created] = await db.insert(completedCourses).values(data).returning();
    return created;
  }

  async removeCompletedCourse(id: number): Promise<void> {
    await db.delete(completedCourses).where(eq(completedCourses.id, id));
  }

  async getCompletedCourseCodes(userId: string): Promise<string[]> {
    const completed = await this.getCompletedCourses(userId);
    return completed.map(c => c.course.code);
  }

  // Semester Plans
  async getPlans(userId: string): Promise<SemesterPlanWithCourses[]> {
    const plans = await db.select().from(semesterPlans).where(eq(semesterPlans.userId, userId)).orderBy(desc(semesterPlans.createdAt));
    const result: SemesterPlanWithCourses[] = [];
    
    for (const plan of plans) {
      const pCourses = await db.select().from(planCourses).where(eq(planCourses.planId, plan.id));
      const coursesWithDetails: PlanCourseWithDetails[] = [];
      let totalCredits = 0;
      let totalDifficulty = 0;

      for (const pc of pCourses) {
        const course = await this.getCourse(pc.courseId);
        if (course) {
          coursesWithDetails.push({ ...pc, course });
          totalCredits += course.credits;
          totalDifficulty += course.difficulty || 3;
        }
      }

      result.push({
        ...plan,
        courses: coursesWithDetails,
        totalCredits,
        difficultyScore: coursesWithDetails.length > 0 ? totalDifficulty / coursesWithDetails.length : 0,
      });
    }

    return result;
  }

  async getPlan(id: number): Promise<SemesterPlanWithCourses | undefined> {
    const [plan] = await db.select().from(semesterPlans).where(eq(semesterPlans.id, id));
    if (!plan) return undefined;

    const pCourses = await db.select().from(planCourses).where(eq(planCourses.planId, id));
    const coursesWithDetails: PlanCourseWithDetails[] = [];
    let totalCredits = 0;
    let totalDifficulty = 0;

    for (const pc of pCourses) {
      const course = await this.getCourse(pc.courseId);
      if (course) {
        coursesWithDetails.push({ ...pc, course });
        totalCredits += course.credits;
        totalDifficulty += course.difficulty || 3;
      }
    }

    return {
      ...plan,
      courses: coursesWithDetails,
      totalCredits,
      difficultyScore: coursesWithDetails.length > 0 ? totalDifficulty / coursesWithDetails.length : 0,
    };
  }

  async createPlan(plan: InsertSemesterPlan): Promise<SemesterPlan> {
    const [created] = await db.insert(semesterPlans).values(plan).returning();
    return created;
  }

  async deletePlan(id: number): Promise<void> {
    await db.delete(planCourses).where(eq(planCourses.planId, id));
    await db.delete(semesterPlans).where(eq(semesterPlans.id, id));
  }

  async setActivePlan(userId: string, planId: number): Promise<void> {
    await db.update(semesterPlans).set({ isActive: false }).where(eq(semesterPlans.userId, userId));
    await db.update(semesterPlans).set({ isActive: true }).where(eq(semesterPlans.id, planId));
  }

  // Plan Courses
  async addCourseToPlan(data: InsertPlanCourse): Promise<PlanCourse> {
    const [created] = await db.insert(planCourses).values(data).returning();
    return created;
  }

  async removeCourseFromPlan(planCourseId: number): Promise<void> {
    await db.delete(planCourses).where(eq(planCourses.id, planCourseId));
  }

  // Advisor Chats
  async getAdvisorChats(userId: string): Promise<AdvisorChat[]> {
    return db.select().from(advisorChats).where(eq(advisorChats.userId, userId)).orderBy(desc(advisorChats.createdAt));
  }

  async getAdvisorChat(id: number): Promise<(AdvisorChat & { messages: AdvisorMessage[] }) | undefined> {
    const [chat] = await db.select().from(advisorChats).where(eq(advisorChats.id, id));
    if (!chat) return undefined;
    const msgs = await db.select().from(advisorMessages).where(eq(advisorMessages.chatId, id));
    return { ...chat, messages: msgs };
  }

  async createAdvisorChat(data: InsertAdvisorChat): Promise<AdvisorChat> {
    const [created] = await db.insert(advisorChats).values(data).returning();
    return created;
  }

  async deleteAdvisorChat(id: number): Promise<void> {
    await db.delete(advisorMessages).where(eq(advisorMessages.chatId, id));
    await db.delete(advisorChats).where(eq(advisorChats.id, id));
  }

  // Advisor Messages
  async addAdvisorMessage(data: InsertAdvisorMessage): Promise<AdvisorMessage> {
    const [created] = await db.insert(advisorMessages).values(data).returning();
    return created;
  }

  // Stats
  async getStats(userId: string): Promise<{
    totalCredits: number;
    completedCredits: number;
    completedCourses: number;
    upcomingCourses: number;
  }> {
    const completed = await this.getCompletedCourses(userId);
    const completedCredits = completed.reduce((acc, c) => acc + c.course.credits, 0);
    const plans = await this.getPlans(userId);
    const activePlan = plans.find(p => p.isActive);

    return {
      totalCredits: 75, // WLU CS Honours BSc (27 Core + 15 Math + 18 Elective + 15 GenEd)
      completedCredits,
      completedCourses: completed.length,
      upcomingCourses: activePlan?.courses.length || 0,
    };
  }

  // Seed data — Wilfrid Laurier University Computer Science (Honours BSc)
  async seedCourses(): Promise<void> {
    const existingCourses = await this.getAllCourses();
    if (existingCourses.length > 0) return;

    const seedData: InsertCourse[] = [
      // ── Required Core CS Courses ──────────────────────────────────────
      { code: "CP 104", name: "Introduction to Programming", credits: 3, category: "Core", difficulty: 2, prerequisites: [], description: "Introduction to algorithms and programming using Python. Problem solving, control structures, functions, and file I/O." },
      { code: "CP 164", name: "Data Structures I", credits: 3, category: "Core", difficulty: 3, prerequisites: ["CP 104"], description: "Abstract data types: stacks, queues, linked lists, and binary trees. Recursion and sorting algorithms." },
      { code: "CP 213", name: "Introduction to Object-Oriented Programming", credits: 3, category: "Core", difficulty: 3, prerequisites: ["CP 164"], description: "Object-oriented design with Java. Inheritance, polymorphism, interfaces, and exception handling." },
      { code: "CP 216", name: "Introduction to Computer Architecture", credits: 3, category: "Core", difficulty: 3, prerequisites: ["CP 104"], description: "Computer organization, data representation, assembly language, and the hardware/software interface." },
      { code: "CP 264", name: "Data Structures II", credits: 3, category: "Core", difficulty: 4, prerequisites: ["CP 164"], description: "Advanced data structures: heaps, hash tables, balanced BSTs, and graphs. Algorithm analysis and complexity." },
      { code: "CP 312", name: "Algorithm Design and Analysis", credits: 3, category: "Core", difficulty: 4, prerequisites: ["CP 264", "MA 200"], description: "Algorithmic paradigms: divide and conquer, dynamic programming, greedy algorithms. NP-completeness." },
      { code: "CP 317", name: "Software Engineering", credits: 3, category: "Core", difficulty: 3, prerequisites: ["CP 213", "CP 264"], description: "Software development lifecycle, requirements, UML design, testing, agile practices, and team projects." },
      { code: "CP 363", name: "Database Management", credits: 3, category: "Core", difficulty: 3, prerequisites: ["CP 264"], description: "Relational model, SQL, database design using ER diagrams, normalization, and transaction processing." },
      { code: "CP 386", name: "Operating Systems", credits: 3, category: "Core", difficulty: 4, prerequisites: ["CP 264", "CP 216"], description: "Process management, CPU scheduling, memory management, file systems, and concurrency." },

      // ── Mathematics (Required) ────────────────────────────────────────
      { code: "MA 103", name: "Calculus 1", credits: 3, category: "Mathematics", difficulty: 3, prerequisites: [], description: "Limits, continuity, derivatives, and an introduction to integration. Applications to science and engineering." },
      { code: "MA 104", name: "Calculus 2", credits: 3, category: "Mathematics", difficulty: 4, prerequisites: ["MA 103"], description: "Techniques of integration, improper integrals, sequences, series, and Taylor expansions." },
      { code: "MA 170", name: "Linear Algebra I", credits: 3, category: "Mathematics", difficulty: 3, prerequisites: ["MA 103"], description: "Systems of linear equations, matrices, determinants, vector spaces, eigenvalues and eigenvectors." },
      { code: "MA 200", name: "Discrete Mathematics for Computing", credits: 3, category: "Mathematics", difficulty: 3, prerequisites: ["MA 103"], description: "Logic, sets, functions, relations, induction, combinatorics, and graph theory for computer scientists." },
      { code: "ST 259", name: "Probability and Statistics for CS", credits: 3, category: "Mathematics", difficulty: 3, prerequisites: ["MA 104"], description: "Probability theory, discrete and continuous distributions, statistical inference, and regression." },

      // ── Technical Electives ───────────────────────────────────────────
      { code: "CP 372", name: "Computer Networks", credits: 3, category: "Elective", difficulty: 4, prerequisites: ["CP 386"], description: "OSI model, TCP/IP protocol suite, routing, transport layer protocols, and network security fundamentals." },
      { code: "CP 411", name: "Compiler Construction", credits: 3, category: "Elective", difficulty: 5, prerequisites: ["CP 312"], description: "Lexical analysis, parsing, semantic analysis, intermediate code generation, and optimization techniques." },
      { code: "CP 414", name: "Introduction to Artificial Intelligence", credits: 3, category: "Elective", difficulty: 4, prerequisites: ["CP 312"], description: "Search algorithms, knowledge representation, planning, constraint satisfaction, and machine learning basics." },
      { code: "CP 423", name: "Text Retrieval and Search Engines", credits: 3, category: "Elective", difficulty: 3, prerequisites: ["CP 312"], description: "Information retrieval models, indexing, ranking algorithms, and natural language processing fundamentals." },
      { code: "CP 431", name: "Parallel and Distributed Computing", credits: 3, category: "Elective", difficulty: 4, prerequisites: ["CP 386"], description: "Parallel programming models, distributed systems, message passing (MPI), and concurrent algorithms." },
      { code: "CP 460", name: "Applied Cryptography", credits: 3, category: "Elective", difficulty: 4, prerequisites: ["CP 312"], description: "Symmetric and public-key cryptography, digital signatures, hash functions, and protocol security." },
      { code: "CP 465", name: "Internet Applications", credits: 3, category: "Elective", difficulty: 3, prerequisites: ["CP 363"], description: "Full-stack web development: RESTful APIs, server-side programming, databases, and deployment." },
      { code: "CP 467", name: "Introduction to Image Processing", credits: 3, category: "Elective", difficulty: 4, prerequisites: ["CP 312", "MA 170"], description: "Image filtering, edge detection, morphological operations, and pattern recognition techniques." },
      { code: "CP 468", name: "Artificial Neural Networks", credits: 3, category: "Elective", difficulty: 5, prerequisites: ["CP 414", "MA 170", "ST 259"], description: "Deep learning, backpropagation, CNNs, RNNs, and modern neural network architectures." },

      // ── General Education / Open Electives ───────────────────────────
      { code: "ENG 101", name: "Effective Writing", credits: 3, category: "General Education", difficulty: 2, prerequisites: [], description: "Academic writing skills: argumentation, essay structure, research, and citation practices." },
      { code: "EC 120", name: "Introduction to Microeconomics", credits: 3, category: "General Education", difficulty: 2, prerequisites: [], description: "Markets, supply and demand, consumer theory, firm behaviour, and market structures." },
      { code: "EC 140", name: "Introduction to Macroeconomics", credits: 3, category: "General Education", difficulty: 2, prerequisites: [], description: "National income, unemployment, inflation, fiscal and monetary policy, and economic growth." },
      { code: "PO 101", name: "Introduction to Political Science", credits: 3, category: "General Education", difficulty: 1, prerequisites: [], description: "Political systems, governance, democracy, political ideologies, and global political institutions." },
      { code: "PS 101", name: "Introduction to Psychology", credits: 3, category: "General Education", difficulty: 2, prerequisites: [], description: "Biological bases of behaviour, perception, learning, memory, development, personality, and social psychology." },
      { code: "BU 111", name: "Intro to the Business Environment", credits: 3, category: "General Education", difficulty: 2, prerequisites: [], description: "Business functions, entrepreneurship, ethical decision-making, and the global business environment." },
    ];

    for (const course of seedData) {
      await this.createCourse(course);
    }
  }

  async seedRequirements(userId: string): Promise<void> {
    const existing = await this.getRequirements(userId);
    if (existing.length > 0) return;

    const reqs: InsertRequirement[] = [
      { userId, category: "Core", requiredCredits: 27, completedCredits: 0, description: "Required CS courses: CP 104 through CP 386 (9 courses × 3 credits)" },
      { userId, category: "Mathematics", requiredCredits: 15, completedCredits: 0, description: "Required math: MA 103, MA 104, MA 170, MA 200, ST 259 (5 courses × 3 credits)" },
      { userId, category: "Elective", requiredCredits: 18, completedCredits: 0, description: "Technical electives from 400-level CP courses (choose 6 × 3 credits)" },
      { userId, category: "General Education", requiredCredits: 15, completedCredits: 0, description: "Open electives from other disciplines (5 courses × 3 credits)" },
    ];

    for (const req of reqs) {
      await this.createRequirement(req);
    }
  }
}

export const storage = new DatabaseStorage();
