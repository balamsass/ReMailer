import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertContactSchema, insertCampaignSchema, insertApiTokenSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { z } from "zod";

// Auth middleware
async function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.slice(7);
  const apiToken = await storage.getApiTokenByToken(token);
  
  if (!apiToken || !apiToken.isActive) {
    return res.status(401).json({ error: "Invalid or inactive token" });
  }

  // Update last used timestamp
  await storage.updateApiTokenLastUsed(apiToken.id);
  
  req.user = await storage.getUser(apiToken.userId);
  req.apiToken = apiToken;
  next();
}

// Session auth middleware
async function requireSession(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  req.user = await storage.getUser(req.session.userId);
  if (!req.user) {
    return res.status(401).json({ error: "User not found" });
  }
  
  next();
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);
      
      const user = await storage.createUser({
        email: data.email,
        name: data.name,
        passwordHash,
        role: "user",
      });

      // Create session
      req.session.userId = user.id;
      
      res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Create session
      req.session.userId = user.id;
      
      res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireSession, (req, res) => {
    const user = req.user;
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", requireSession, async (req, res) => {
    try {
      const userId = req.user.id;
      
      const totalCampaigns = await storage.getCampaignCount(userId);
      const totalContacts = await storage.getContactCount(userId);
      const recentCampaigns = await storage.getRecentCampaigns(userId, 5);
      const analytics = await storage.getDashboardAnalytics(userId);

      res.json({
        totalCampaigns,
        totalContacts,
        recentCampaigns,
        analytics,
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch stats" });
    }
  });

  // Campaigns routes
  app.get("/api/campaigns", requireSession, async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns(req.user.id);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", requireSession, async (req, res) => {
    try {
      const data = insertCampaignSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const campaign = await storage.createCampaign(data);
      res.json(campaign);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create campaign" });
    }
  });

  app.get("/api/campaigns/:id", requireSession, async (req, res) => {
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.id), req.user.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch campaign" });
    }
  });

  app.put("/api/campaigns/:id", requireSession, async (req, res) => {
    try {
      const data = insertCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateCampaign(parseInt(req.params.id), req.user.id, data);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", requireSession, async (req, res) => {
    try {
      const success = await storage.deleteCampaign(parseInt(req.params.id), req.user.id);
      if (!success) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete campaign" });
    }
  });

  // Contacts routes
  app.get("/api/contacts", requireSession, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      const tags = req.query.tags as string;
      
      const result = await storage.getContacts(req.user.id, { page, limit, search, tags });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", requireSession, async (req, res) => {
    try {
      const data = insertContactSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const contact = await storage.createContact(data);
      res.json(contact);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create contact" });
    }
  });

  app.post("/api/contacts/import", requireSession, async (req, res) => {
    try {
      const { contacts } = req.body;
      if (!Array.isArray(contacts)) {
        return res.status(400).json({ error: "Invalid contacts data" });
      }

      const results = await storage.importContacts(req.user.id, contacts);
      res.json(results);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to import contacts" });
    }
  });

  app.put("/api/contacts/:id", requireSession, async (req, res) => {
    try {
      const data = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(parseInt(req.params.id), req.user.id, data);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", requireSession, async (req, res) => {
    try {
      const success = await storage.deleteContact(parseInt(req.params.id), req.user.id);
      if (!success) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete contact" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", requireSession, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics(req.user.id);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/campaigns/:id", requireSession, async (req, res) => {
    try {
      const analytics = await storage.getCampaignAnalytics(parseInt(req.params.id), req.user.id);
      if (!analytics) {
        return res.status(404).json({ error: "Campaign analytics not found" });
      }
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch campaign analytics" });
    }
  });

  // API Tokens routes
  app.get("/api/tokens", requireSession, async (req, res) => {
    try {
      const tokens = await storage.getApiTokens(req.user.id);
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch tokens" });
    }
  });

  app.post("/api/tokens", requireSession, async (req, res) => {
    try {
      const data = insertApiTokenSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      // Generate secure token
      const token = `rm_sk_${crypto.randomBytes(32).toString('hex')}`;
      
      const apiToken = await storage.createApiToken({
        ...data,
        token,
      });
      
      res.json(apiToken);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create token" });
    }
  });

  app.delete("/api/tokens/:id", requireSession, async (req, res) => {
    try {
      const success = await storage.deleteApiToken(parseInt(req.params.id), req.user.id);
      if (!success) {
        return res.status(404).json({ error: "Token not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete token" });
    }
  });

  // Public API routes (with API token auth)
  app.post("/api/v1/campaigns/send", requireAuth, async (req, res) => {
    try {
      const { campaignId, contactIds, schedule } = req.body;
      
      // Implementation for sending campaigns would go here
      // This would integrate with email service providers like Mailgun/Postmark
      
      res.json({ 
        success: true, 
        message: "Campaign send initiated",
        campaignId,
        contactCount: contactIds?.length || 0
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to send campaign" });
    }
  });

  app.post("/api/v1/contacts", requireAuth, async (req, res) => {
    try {
      const data = insertContactSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const contact = await storage.createContact(data);
      res.json(contact);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create contact" });
    }
  });

  app.get("/api/v1/campaigns/:id/analytics", requireAuth, async (req, res) => {
    try {
      const analytics = await storage.getCampaignAnalytics(parseInt(req.params.id), req.user.id);
      if (!analytics) {
        return res.status(404).json({ error: "Campaign analytics not found" });
      }
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
