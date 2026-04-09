import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  // Seed courses on startup
  await storage.seedCourses();

  const getUserId = (req: Request): string => {
    return req.user?.id || "";
  };

  // Stats
  app.get("/api/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Courses
  app.get("/api/courses", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const courses = await storage.getCoursesWithEligibility(userId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/eligible", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const courses = await storage.getEligibleCourses(userId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching eligible courses:", error);
      res.status(500).json({ error: "Failed to fetch eligible courses" });
    }
  });

  // Requirements
  app.get("/api/requirements", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      // Seed requirements for new users
      await storage.seedRequirements(userId);
      
      // Get requirements and update completed credits based on completed courses
      const reqs = await storage.getRequirements(userId);
      const completedCourses = await storage.getCompletedCourses(userId);
      
      // Calculate completed credits per category
      const creditsByCategory: Record<string, number> = {};
      for (const cc of completedCourses) {
        const cat = cc.course.category;
        creditsByCategory[cat] = (creditsByCategory[cat] || 0) + cc.course.credits;
      }
      
      // Update requirements with actual completed credits
      for (const req of reqs) {
        const completed = creditsByCategory[req.category] || 0;
        if (completed !== req.completedCredits) {
          await storage.updateRequirement(req.id, completed);
          req.completedCredits = completed;
        }
      }
      
      res.json(reqs);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      res.status(500).json({ error: "Failed to fetch requirements" });
    }
  });

  // Completed Courses
  app.get("/api/completed-courses", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const courses = await storage.getCompletedCourses(userId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching completed courses:", error);
      res.status(500).json({ error: "Failed to fetch completed courses" });
    }
  });

  app.post("/api/completed-courses", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { courseId, grade, semester, year } = req.body;
      const completed = await storage.addCompletedCourse({
        userId,
        courseId,
        grade,
        semester,
        year,
      });
      res.status(201).json(completed);
    } catch (error) {
      console.error("Error adding completed course:", error);
      res.status(500).json({ error: "Failed to add completed course" });
    }
  });

  app.delete("/api/completed-courses/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      await storage.removeCompletedCourse(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing completed course:", error);
      res.status(500).json({ error: "Failed to remove completed course" });
    }
  });

  // Semester Plans
  app.get("/api/plans", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const plans = await storage.getPlans(userId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });

  app.post("/api/plans", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { name, semester, year } = req.body;
      const plan = await storage.createPlan({
        userId,
        name,
        semester,
        year,
        isActive: true,
      });
      // Set as active plan
      await storage.setActivePlan(userId, plan.id);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating plan:", error);
      res.status(500).json({ error: "Failed to create plan" });
    }
  });

  app.delete("/api/plans/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      await storage.deletePlan(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ error: "Failed to delete plan" });
    }
  });

  app.patch("/api/plans/:id/activate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const planId = parseInt(String(req.params.id));
      await storage.setActivePlan(userId, planId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error activating plan:", error);
      res.status(500).json({ error: "Failed to activate plan" });
    }
  });

  app.post("/api/plans/:id/courses", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const planId = parseInt(String(req.params.id));
      const { courseId, crn, professorName, schedule } = req.body;
      const planCourse = await storage.addCourseToPlan({
        planId,
        courseId,
        crn,
        professorName,
        schedule,
      });
      res.status(201).json(planCourse);
    } catch (error) {
      console.error("Error adding course to plan:", error);
      res.status(500).json({ error: "Failed to add course to plan" });
    }
  });

  app.delete("/api/plans/:planId/courses/:courseId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const planCourseId = parseInt(String(req.params.courseId));
      await storage.removeCourseFromPlan(planCourseId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing course from plan:", error);
      res.status(500).json({ error: "Failed to remove course from plan" });
    }
  });

  // Advisor Chats
  app.get("/api/advisor/chats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const chats = await storage.getAdvisorChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching advisor chats:", error);
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  });

  app.get("/api/advisor/chats/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const chat = await storage.getAdvisorChat(id);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      res.json(chat);
    } catch (error) {
      console.error("Error fetching advisor chat:", error);
      res.status(500).json({ error: "Failed to fetch chat" });
    }
  });

  app.post("/api/advisor/chats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { title } = req.body;
      const chat = await storage.createAdvisorChat({
        userId,
        title: title || "New Chat",
      });
      res.status(201).json(chat);
    } catch (error) {
      console.error("Error creating advisor chat:", error);
      res.status(500).json({ error: "Failed to create chat" });
    }
  });

  app.delete("/api/advisor/chats/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      await storage.deleteAdvisorChat(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting advisor chat:", error);
      res.status(500).json({ error: "Failed to delete chat" });
    }
  });

  // Advisor Messages with streaming AI response
  app.post("/api/advisor/chats/:id/messages", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const chatId = parseInt(String(req.params.id));
      const { content } = req.body;

      // Save user message
      await storage.addAdvisorMessage({
        chatId,
        role: "user",
        content,
      });

      // Get user context for AI
      const completedCourses = await storage.getCompletedCourses(userId);
      const requirements = await storage.getRequirements(userId);
      const plans = await storage.getPlans(userId);
      const eligibleCourses = await storage.getEligibleCourses(userId);

      // Build context for AI
      const completedList = completedCourses.map(c => `${c.course.code}: ${c.course.name} (${c.grade})`).join("\n");
      const reqsList = requirements.map(r => `${r.category}: ${r.completedCredits}/${r.requiredCredits} credits`).join("\n");
      const eligibleList = eligibleCourses.slice(0, 10).map(c => `${c.code}: ${c.name}`).join("\n");
      const activePlan = plans.find(p => p.isActive);
      const planList = activePlan 
        ? activePlan.courses.map(pc => `${pc.course.code}: ${pc.course.name}`).join("\n")
        : "No active plan";

      const systemPrompt = `You are an academic advisor assistant helping a university student plan their courses. You have access to their academic data:

COMPLETED COURSES:
${completedList || "No courses completed yet"}

DEGREE REQUIREMENTS:
${reqsList}

ELIGIBLE COURSES (based on completed prerequisites):
${eligibleList || "No eligible courses found"}

CURRENT PLAN:
${planList}

Guidelines:
- Be helpful, encouraging, and specific
- Reference their actual data when making recommendations
- Suggest specific courses they are eligible for
- Warn about heavy course loads or difficult combinations
- If asked to generate an advising request, format it professionally with their status, questions, and context
- Keep responses concise but informative
- Remember this is a planning tool - advise them to confirm with their official advisor`;

      // Get conversation history
      const chat = await storage.getAdvisorChat(chatId);
      const messages = chat?.messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })) || [];

      // Setup SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI
      const openai = getOpenAI();
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_completion_tokens: 1024,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await storage.addAdvisorMessage({
        chatId,
        role: "assistant",
        content: fullResponse,
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in advisor chat:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  return httpServer;
}
