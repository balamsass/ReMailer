import { 
  users, 
  apiTokens, 
  contacts, 
  campaigns, 
  campaignContacts, 
  campaignAnalytics,
  lists,
  images,
  auditLogs,
  serviceHealth,
  apiKeyUsage,
  type User, 
  type InsertUser, 
  type ApiToken, 
  type InsertApiToken, 
  type Contact, 
  type InsertContact, 
  type Campaign, 
  type InsertCampaign,
  type CampaignContact,
  type InsertCampaignContact,
  type CampaignAnalytics,
  type List,
  type InsertList,
  type Image,
  type InsertImage,
  type AuditLog,
  type InsertAuditLog,
  type ServiceHealth,
  type InsertServiceHealth,
  type ApiKeyUsage,
  type InsertApiKeyUsage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, sql, desc, asc, count, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // API Token operations
  getApiTokens(userId: number): Promise<ApiToken[]>;
  getApiTokenByToken(token: string): Promise<ApiToken | undefined>;
  createApiToken(token: Omit<InsertApiToken, 'userId'> & { userId: number; token: string }): Promise<ApiToken>;
  updateApiTokenLastUsed(tokenId: number): Promise<void>;
  deleteApiToken(tokenId: number, userId: number): Promise<boolean>;

  // Contact operations
  getContacts(userId: number, options?: { page?: number; limit?: number; search?: string; tags?: string; status?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<{
    contacts: Contact[];
    total: number;
    active: number;
  }>;
  getContactCount(userId: number): Promise<number>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(contactId: number, userId: number, data: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(contactId: number, userId: number): Promise<boolean>;
  importContacts(userId: number, contacts: any[]): Promise<{ successful: number; failed: number; errors: string[] }>;
  bulkUpdateContactStatus(contactIds: number[], userId: number, status: string): Promise<{ updated: number }>;
  bulkDeleteContacts(contactIds: number[], userId: number): Promise<{ deleted: number }>;

  // List operations
  getLists(userId: number, options?: { page?: number; limit?: number; search?: string; tags?: string; status?: string }): Promise<{
    lists: List[];
    total: number;
  }>;
  getList(listId: number, userId: number): Promise<List | undefined>;
  createList(list: InsertList): Promise<List>;
  updateList(listId: number, userId: number, data: Partial<InsertList>): Promise<List | undefined>;
  deleteList(listId: number, userId: number): Promise<boolean>;
  cloneList(listId: number, userId: number, newName: string): Promise<List | undefined>;
  executeListFilter(listId: number, userId: number): Promise<{
    contacts: Contact[];
    count: number;
  }>;
  previewListFilter(filterDefinition: any, userId: number): Promise<{
    contacts: Contact[];
    count: number;
  }>;
  updateListMatchCount(listId: number, count: number): Promise<void>;

  // Campaign operations
  getCampaigns(userId: number): Promise<Campaign[]>;
  getCampaign(campaignId: number, userId: number): Promise<Campaign | undefined>;
  getCampaignCount(userId: number): Promise<number>;
  getRecentCampaigns(userId: number, limit: number): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(campaignId: number, userId: number, data: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(campaignId: number, userId: number): Promise<boolean>;
  createCampaignContact(data: InsertCampaignContact): Promise<CampaignContact>;

  // Analytics operations
  getDashboardAnalytics(userId: number): Promise<{
    totalSent: number;
    openRate: string;
    clickRate: string;
    bounceRate: string;
  }>;
  getAnalytics(userId: number): Promise<{
    totalOpens: number;
    totalClicks: number;
    totalBounces: number;
    totalUnsubscribes: number;
    openRate: string;
    clickRate: string;
    bounceRate: string;
    unsubscribeRate: string;
    topCampaigns: any[];
  }>;
  getCampaignAnalytics(campaignId: number, userId: number): Promise<CampaignAnalytics | undefined>;

  // Admin operations
  getAllUsers(options?: { page?: number; limit?: number; search?: string; role?: string }): Promise<{
    users: User[];
    total: number;
  }>;
  updateUserRole(userId: number, role: string): Promise<User | undefined>;
  deleteUser(userId: number): Promise<boolean>;

  // Audit logging
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(options?: { 
    page?: number; 
    limit?: number; 
    userId?: number; 
    action?: string; 
    startDate?: Date; 
    endDate?: Date 
  }): Promise<{
    logs: (AuditLog & { user?: User })[];
    total: number;
  }>;

  // Service health monitoring
  updateServiceHealth(serviceName: string, status: string, responseTime?: number, details?: any): Promise<ServiceHealth>;
  getServiceHealth(): Promise<ServiceHealth[]>;
  
  // API usage tracking
  trackApiUsage(usage: InsertApiKeyUsage): Promise<ApiKeyUsage>;
  getApiUsageStats(tokenId?: number): Promise<{
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    topEndpoints: any[];
  }>;

  // Image operations
  getImages(userId: number, options?: { page?: number; limit?: number; search?: string; tags?: string }): Promise<{
    images: Image[];
    total: number;
  }>;
  getImage(imageId: number, userId: number): Promise<Image | undefined>;
  createImage(image: InsertImage): Promise<Image>;
  updateImage(imageId: number, userId: number, data: Partial<InsertImage>): Promise<Image | undefined>;
  deleteImage(imageId: number, userId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // API Token operations
  async getApiTokens(userId: number): Promise<ApiToken[]> {
    return await db
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.userId, userId))
      .orderBy(desc(apiTokens.createdAt));
  }

  async getApiTokenByToken(token: string): Promise<ApiToken | undefined> {
    const [apiToken] = await db
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.token, token));
    return apiToken || undefined;
  }

  async createApiToken(tokenData: Omit<InsertApiToken, 'userId'> & { userId: number; token: string }): Promise<ApiToken> {
    const [token] = await db
      .insert(apiTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async updateApiTokenLastUsed(tokenId: number): Promise<void> {
    await db
      .update(apiTokens)
      .set({ lastUsedAt: sql`NOW()` })
      .where(eq(apiTokens.id, tokenId));
  }

  async deleteApiToken(tokenId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(apiTokens)
      .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Contact operations
  async getContacts(userId: number, options: { page?: number; limit?: number; search?: string; tags?: string; status?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}): Promise<{
    contacts: Contact[];
    total: number;
    active: number;
  }> {
    const { page = 1, limit = 50, search, tags, status, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    let whereConditions = [eq(contacts.userId, userId)];

    if (search) {
      whereConditions.push(
        sql`${contacts.email} ILIKE ${`%${search}%`} OR ${contacts.name} ILIKE ${`%${search}%`} OR ${contacts.company} ILIKE ${`%${search}%`} OR ${contacts.phone} ILIKE ${`%${search}%`}`
      );
    }

    if (tags) {
      whereConditions.push(sql`${tags} = ANY(${contacts.tags})`);
    }

    if (status) {
      whereConditions.push(eq(contacts.status, status));
    }

    const query = db.select().from(contacts).where(and(...whereConditions));

    // Add sorting
    const sortColumn = sortBy === 'name' ? contacts.name :
                      sortBy === 'email' ? contacts.email :
                      sortBy === 'company' ? contacts.company :
                      sortBy === 'status' ? contacts.status :
                      contacts.createdAt;

    const contactsResult = await query
      .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.userId, userId));

    // Get active count
    const [activeResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(eq(contacts.userId, userId), eq(contacts.status, 'active')));

    return {
      contacts: contactsResult,
      total: totalResult.count,
      active: activeResult.count,
    };
  }

  async getContactCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.userId, userId));
    return result.count;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values({
        ...contact,
        updatedAt: sql`NOW()`,
      })
      .returning();
    return newContact;
  }

  async updateContact(contactId: number, userId: number, data: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db
      .update(contacts)
      .set({
        ...data,
        updatedAt: sql`NOW()`,
      })
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteContact(contactId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async importContacts(userId: number, contactsData: any[]): Promise<{ successful: number; failed: number; errors: string[] }> {
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const contactData of contactsData) {
      try {
        // Check if contact already exists
        const existing = await db
          .select()
          .from(contacts)
          .where(and(eq(contacts.userId, userId), eq(contacts.email, contactData.email)));

        if (existing.length > 0) {
          // Update existing contact
          await this.updateContact(existing[0].id, userId, {
            name: contactData.name,
            tags: contactData.tags || [],
          });
        } else {
          // Create new contact
          await this.createContact({
            userId,
            email: contactData.email,
            name: contactData.name,
            tags: contactData.tags || [],
            status: 'active',
          });
        }
        successful++;
      } catch (error) {
        failed++;
        errors.push(`Failed to import ${contactData.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { successful, failed, errors };
  }

  async bulkUpdateContactStatus(contactIds: number[], userId: number, status: string): Promise<{ updated: number }> {
    const result = await db
      .update(contacts)
      .set({ status })
      .where(
        and(
          inArray(contacts.id, contactIds),
          eq(contacts.userId, userId)
        )
      );
    
    return { updated: result.rowCount || 0 };
  }

  async bulkDeleteContacts(contactIds: number[], userId: number): Promise<{ deleted: number }> {
    const result = await db
      .delete(contacts)
      .where(
        and(
          inArray(contacts.id, contactIds),
          eq(contacts.userId, userId)
        )
      );
    
    return { deleted: result.rowCount || 0 };
  }

  // List operations
  async getLists(userId: number, options: { page?: number; limit?: number; search?: string; tags?: string; status?: string } = {}): Promise<{
    lists: List[];
    total: number;
  }> {
    const { page = 1, limit = 10, search, tags, status } = options;
    const offset = (page - 1) * limit;

    let query = db
      .select()
      .from(lists)
      .where(eq(lists.userId, userId));

    if (search) {
      query = query.where(
        and(
          eq(lists.userId, userId),
          like(lists.name, `%${search}%`)
        )
      );
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      for (const tag of tagArray) {
        query = query.where(
          and(
            eq(lists.userId, userId),
            sql`${lists.tags} @> ${JSON.stringify([tag])}`
          )
        );
      }
    }

    if (status) {
      query = query.where(
        and(
          eq(lists.userId, userId),
          eq(lists.status, status)
        )
      );
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(lists)
      .where(eq(lists.userId, userId));

    const listResults = await query
      .orderBy(desc(lists.updatedAt))
      .limit(limit)
      .offset(offset);

    // Calculate actual contact counts for each list
    const listsWithCounts = await Promise.all(
      listResults.map(async (list) => {
        const { contacts: listContacts } = await this.executeListFilter(list.id, userId);
        return {
          ...list,
          matchCount: listContacts.length
        };
      })
    );

    return {
      lists: listsWithCounts,
      total: totalResult.count
    };
  }

  async getList(listId: number, userId: number): Promise<List | undefined> {
    const [list] = await db
      .select()
      .from(lists)
      .where(
        and(
          eq(lists.id, listId),
          eq(lists.userId, userId)
        )
      );
    return list;
  }

  async createList(list: InsertList): Promise<List> {
    const [newList] = await db
      .insert(lists)
      .values(list)
      .returning();
    return newList;
  }

  async updateList(listId: number, userId: number, data: Partial<InsertList>): Promise<List | undefined> {
    const [updatedList] = await db
      .update(lists)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(lists.id, listId),
          eq(lists.userId, userId)
        )
      )
      .returning();
    return updatedList;
  }

  async deleteList(listId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(lists)
      .where(
        and(
          eq(lists.id, listId),
          eq(lists.userId, userId)
        )
      );
    return (result.rowCount || 0) > 0;
  }

  async cloneList(listId: number, userId: number, newName: string): Promise<List | undefined> {
    const originalList = await this.getList(listId, userId);
    if (!originalList) return undefined;

    const [clonedList] = await db
      .insert(lists)
      .values({
        name: newName,
        description: `Copy of ${originalList.name}`,
        userId: userId,
        filterDefinition: originalList.filterDefinition,
        tags: originalList.tags,
        status: 'active'
      })
      .returning();

    return clonedList;
  }

  private evaluateFilter(contact: Contact, filterDefinition: any): boolean {
    if (!filterDefinition || !filterDefinition.rules) return true;

    const { logic = 'AND', rules } = filterDefinition;

    const evaluateRule = (rule: any): boolean => {
      if (rule.rules) {
        // Nested group
        const nestedResults = rule.rules.map(evaluateRule);
        return rule.logic === 'OR' 
          ? nestedResults.some(Boolean)
          : nestedResults.every(Boolean);
      }

      const { field, operator: ruleOp, value } = rule;
      const contactValue = this.getContactFieldValue(contact, field);

      // Special handling for tags field
      if (field === 'tags') {
        const contactTags = Array.isArray(contact.tags) ? contact.tags : [];
        switch (ruleOp) {
          case 'contains':
            return contactTags.some(tag => 
              String(tag || '').toLowerCase().includes(String(value || '').toLowerCase())
            );
          case 'notContains':
            return !contactTags.some(tag => 
              String(tag || '').toLowerCase().includes(String(value || '').toLowerCase())
            );
          case 'equals':
            return contactTags.includes(value);
          case 'notEquals':
            return !contactTags.includes(value);
          case 'isEmpty':
            return contactTags.length === 0;
          case 'isNotEmpty':
            return contactTags.length > 0;
          default:
            return false;
        }
      }

      // Regular field evaluation
      switch (ruleOp) {
        case 'equals':
          return contactValue === value;
        case 'notEquals':
          return contactValue !== value;
        case 'contains':
          return String(contactValue || '').toLowerCase().includes(String(value || '').toLowerCase());
        case 'notContains':
          return !String(contactValue || '').toLowerCase().includes(String(value || '').toLowerCase());
        case 'startsWith':
          return String(contactValue || '').toLowerCase().startsWith(String(value || '').toLowerCase());
        case 'endsWith':
          return String(contactValue || '').toLowerCase().endsWith(String(value || '').toLowerCase());
        case 'isEmpty':
          return !contactValue || contactValue === '';
        case 'isNotEmpty':
          return contactValue && contactValue !== '';
        default:
          return false;
      }
    };

    const results = rules.map(evaluateRule);
    return logic === 'OR' 
      ? results.some(Boolean)
      : results.every(Boolean);
  }

  private getContactFieldValue(contact: Contact, field: string): any {
    switch (field) {
      case 'email':
        return contact.email;
      case 'name':
        return contact.name;
      case 'phone':
        return contact.phone;
      case 'company':
        return contact.company;
      case 'jobTitle':
        return contact.jobTitle;
      case 'status':
        return contact.status;
      case 'tags':
        return contact.tags;
      case 'notes':
        return contact.notes;
      default:
        // Check metadata for custom fields
        if (contact.metadata && typeof contact.metadata === 'object') {
          return (contact.metadata as any)[field];
        }
        return null;
    }
  }

  async executeListFilter(listId: number, userId: number): Promise<{
    contacts: Contact[];
    count: number;
  }> {
    const list = await this.getList(listId, userId);
    if (!list) {
      return { contacts: [], count: 0 };
    }

    return this.previewListFilter(list.filterDefinition, userId);
  }

  async previewListFilter(filterDefinition: any, userId: number): Promise<{
    contacts: Contact[];
    count: number;
  }> {
    // Get all contacts for the user
    const allContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId));

    // Apply filter logic
    const filteredContacts = allContacts.filter(contact => 
      this.evaluateFilter(contact, filterDefinition)
    );

    return {
      contacts: filteredContacts,
      count: filteredContacts.length
    };
  }

  async updateListMatchCount(listId: number, count: number): Promise<void> {
    await db
      .update(lists)
      .set({ 
        matchCount: count,
        updatedAt: new Date()
      })
      .where(eq(lists.id, listId));
  }

  // Campaign operations
  async getCampaigns(userId: number): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(campaignId: number, userId: number): Promise<Campaign | undefined> {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
    return campaign || undefined;
  }

  async getCampaignCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(campaigns)
      .where(eq(campaigns.userId, userId));
    return result.count;
  }

  async getRecentCampaigns(userId: number, limit: number): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt))
      .limit(limit);
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        ...campaign,
        updatedAt: sql`NOW()`,
      })
      .returning();
    return newCampaign;
  }

  async updateCampaign(campaignId: number, userId: number, data: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [updated] = await db
      .update(campaigns)
      .set({
        ...data,
        updatedAt: sql`NOW()`,
      })
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteCampaign(campaignId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async createCampaignContact(data: InsertCampaignContact): Promise<CampaignContact> {
    const [campaignContact] = await db
      .insert(campaignContacts)
      .values(data)
      .returning();
    return campaignContact;
  }

  // Analytics operations
  async getDashboardAnalytics(userId: number): Promise<{
    totalSent: number;
    openRate: string;
    clickRate: string;
    bounceRate: string;
  }> {
    // Get aggregated analytics for user's campaigns
    const userCampaigns = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.userId, userId));

    if (userCampaigns.length === 0) {
      return {
        totalSent: 0,
        openRate: "0.00%",
        clickRate: "0.00%",
        bounceRate: "0.00%",
      };
    }

    const campaignIds = userCampaigns.map(c => c.id);

    const [analytics] = await db
      .select({
        totalSent: sql<number>`COALESCE(SUM(${campaignAnalytics.totalSent}), 0)`,
        totalDelivered: sql<number>`COALESCE(SUM(${campaignAnalytics.totalDelivered}), 0)`,
        totalOpened: sql<number>`COALESCE(SUM(${campaignAnalytics.totalOpened}), 0)`,
        totalClicked: sql<number>`COALESCE(SUM(${campaignAnalytics.totalClicked}), 0)`,
        totalBounced: sql<number>`COALESCE(SUM(${campaignAnalytics.totalBounced}), 0)`,
      })
      .from(campaignAnalytics)
      .where(inArray(campaignAnalytics.campaignId, campaignIds));

    const openRate = analytics.totalDelivered > 0 
      ? ((analytics.totalOpened / analytics.totalDelivered) * 100).toFixed(1) + "%"
      : "0.0%";

    const clickRate = analytics.totalDelivered > 0
      ? ((analytics.totalClicked / analytics.totalDelivered) * 100).toFixed(1) + "%"
      : "0.0%";

    const bounceRate = analytics.totalSent > 0
      ? ((analytics.totalBounced / analytics.totalSent) * 100).toFixed(1) + "%"
      : "0.0%";

    return {
      totalSent: analytics.totalSent,
      openRate,
      clickRate,
      bounceRate,
    };
  }

  async getAnalytics(userId: number): Promise<{
    totalOpens: number;
    totalClicks: number;
    totalBounces: number;
    totalUnsubscribes: number;
    openRate: string;
    clickRate: string;
    bounceRate: string;
    unsubscribeRate: string;
    topCampaigns: any[];
  }> {
    // Get aggregated analytics for user's campaigns
    const userCampaigns = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.userId, userId));

    if (userCampaigns.length === 0) {
      return {
        totalOpens: 0,
        totalClicks: 0,
        totalBounces: 0,
        totalUnsubscribes: 0,
        openRate: "0.00%",
        clickRate: "0.00%",
        bounceRate: "0.00%",
        unsubscribeRate: "0.00%",
        topCampaigns: [],
      };
    }

    const campaignIds = userCampaigns.map(c => c.id);

    const [analytics] = await db
      .select({
        totalSent: sql<number>`COALESCE(SUM(${campaignAnalytics.totalSent}), 0)`,
        totalDelivered: sql<number>`COALESCE(SUM(${campaignAnalytics.totalDelivered}), 0)`,
        totalOpened: sql<number>`COALESCE(SUM(${campaignAnalytics.totalOpened}), 0)`,
        totalClicked: sql<number>`COALESCE(SUM(${campaignAnalytics.totalClicked}), 0)`,
        totalBounced: sql<number>`COALESCE(SUM(${campaignAnalytics.totalBounced}), 0)`,
        totalUnsubscribed: sql<number>`COALESCE(SUM(${campaignAnalytics.totalUnsubscribed}), 0)`,
      })
      .from(campaignAnalytics)
      .where(inArray(campaignAnalytics.campaignId, campaignIds));

    const openRate = analytics.totalDelivered > 0 
      ? ((analytics.totalOpened / analytics.totalDelivered) * 100).toFixed(1) + "%"
      : "0.0%";

    const clickRate = analytics.totalDelivered > 0
      ? ((analytics.totalClicked / analytics.totalDelivered) * 100).toFixed(1) + "%"
      : "0.0%";

    const bounceRate = analytics.totalSent > 0
      ? ((analytics.totalBounced / analytics.totalSent) * 100).toFixed(1) + "%"
      : "0.0%";

    const unsubscribeRate = analytics.totalSent > 0
      ? ((analytics.totalUnsubscribed / analytics.totalSent) * 100).toFixed(1) + "%"
      : "0.0%";

    // Get top performing campaigns
    const topCampaigns = await db
      .select({
        name: campaigns.name,
        sent: campaignAnalytics.totalSent,
        opens: campaignAnalytics.totalOpened,
        clicks: campaignAnalytics.totalClicked,
        sentDate: campaigns.sentAt,
      })
      .from(campaigns)
      .innerJoin(campaignAnalytics, eq(campaigns.id, campaignAnalytics.campaignId))
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaignAnalytics.totalOpened))
      .limit(5);

    return {
      totalOpens: analytics.totalOpened,
      totalClicks: analytics.totalClicked,
      totalBounces: analytics.totalBounced,
      totalUnsubscribes: analytics.totalUnsubscribed,
      openRate,
      clickRate,
      bounceRate,
      unsubscribeRate,
      topCampaigns,
    };
  }

  async getCampaignAnalytics(campaignId: number, userId: number): Promise<CampaignAnalytics | undefined> {
    // First verify the campaign belongs to the user
    const campaign = await this.getCampaign(campaignId, userId);
    if (!campaign) {
      return undefined;
    }

    const [analytics] = await db
      .select()
      .from(campaignAnalytics)
      .where(eq(campaignAnalytics.campaignId, campaignId));

    return analytics || undefined;
  }

  // Admin operations
  async getAllUsers(options: { page?: number; limit?: number; search?: string; role?: string } = {}): Promise<{
    users: User[];
    total: number;
  }> {
    const { page = 1, limit = 10, search, role } = options;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        sql`${users.name} ILIKE ${'%' + search + '%'} OR ${users.email} ILIKE ${'%' + search + '%'}`
      );
    }
    
    if (role) {
      whereConditions.push(eq(users.role, role));
    }

    const whereClause = whereConditions.length > 0 
      ? and(...whereConditions)
      : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause);

    const userResults = await db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      users: userResults,
      total: totalResult.count,
    };
  }

  async updateUserRole(userId: number, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async deleteUser(userId: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, userId));

    return result.rowCount > 0;
  }

  // Audit logging
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(auditLogs)
      .values(log)
      .returning();

    return auditLog;
  }

  async getAuditLogs(options: { 
    page?: number; 
    limit?: number; 
    userId?: number; 
    action?: string; 
    startDate?: Date; 
    endDate?: Date 
  } = {}): Promise<{
    logs: (AuditLog & { user?: User })[];
    total: number;
  }> {
    const { page = 1, limit = 50, userId, action, startDate, endDate } = options;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    
    if (userId) {
      whereConditions.push(eq(auditLogs.userId, userId));
    }
    
    if (action) {
      whereConditions.push(eq(auditLogs.action, action));
    }
    
    if (startDate) {
      whereConditions.push(sql`${auditLogs.createdAt} >= ${startDate}`);
    }
    
    if (endDate) {
      whereConditions.push(sql`${auditLogs.createdAt} <= ${endDate}`);
    }

    const whereClause = whereConditions.length > 0 
      ? and(...whereConditions)
      : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(whereClause);

    const logsWithUsers = await db
      .select({
        log: auditLogs,
        user: users,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      logs: logsWithUsers.map(row => ({ ...row.log, user: row.user || undefined })),
      total: totalResult.count,
    };
  }

  // Service health monitoring
  async updateServiceHealth(serviceName: string, status: string, responseTime?: number, details?: any): Promise<ServiceHealth> {
    const [existingService] = await db
      .select()
      .from(serviceHealth)
      .where(eq(serviceHealth.serviceName, serviceName));

    if (existingService) {
      const [updated] = await db
        .update(serviceHealth)
        .set({
          status,
          responseTime,
          details,
          lastCheck: new Date(),
        })
        .where(eq(serviceHealth.serviceName, serviceName))
        .returning();

      return updated;
    } else {
      const [created] = await db
        .insert(serviceHealth)
        .values({
          serviceName,
          status,
          responseTime,
          details,
        })
        .returning();

      return created;
    }
  }

  async getServiceHealth(): Promise<ServiceHealth[]> {
    return await db
      .select()
      .from(serviceHealth)
      .orderBy(serviceHealth.serviceName);
  }
  
  // API usage tracking
  async trackApiUsage(usage: InsertApiKeyUsage): Promise<ApiKeyUsage> {
    const [created] = await db
      .insert(apiKeyUsage)
      .values(usage)
      .returning();

    return created;
  }

  async getApiUsageStats(tokenId?: number): Promise<{
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    topEndpoints: any[];
  }> {
    let whereCondition = undefined;
    if (tokenId) {
      whereCondition = eq(apiKeyUsage.apiTokenId, tokenId);
    }

    const [stats] = await db
      .select({
        totalRequests: count(),
        avgResponseTime: sql<number>`AVG(${apiKeyUsage.responseTime})`,
        errorCount: sql<number>`SUM(CASE WHEN ${apiKeyUsage.responseCode} >= 400 THEN 1 ELSE 0 END)`,
      })
      .from(apiKeyUsage)
      .where(whereCondition);

    const topEndpoints = await db
      .select({
        endpoint: apiKeyUsage.endpoint,
        method: apiKeyUsage.method,
        requests: count(),
        avgResponseTime: sql<number>`AVG(${apiKeyUsage.responseTime})`,
      })
      .from(apiKeyUsage)
      .where(whereCondition)
      .groupBy(apiKeyUsage.endpoint, apiKeyUsage.method)
      .orderBy(desc(count()))
      .limit(10);

    const errorRate = stats.totalRequests > 0 
      ? (Number(stats.errorCount) / stats.totalRequests) * 100 
      : 0;

    return {
      totalRequests: stats.totalRequests,
      avgResponseTime: Number(stats.avgResponseTime) || 0,
      errorRate,
      topEndpoints,
    };
  }

  // Image operations
  async getImages(userId: number, options: { page?: number; limit?: number; search?: string; tags?: string } = {}): Promise<{
    images: Image[];
    total: number;
  }> {
    const { page = 1, limit = 20, search, tags } = options;
    const offset = (page - 1) * limit;

    let whereClause = eq(images.userId, userId);

    if (search) {
      whereClause = and(
        whereClause,
        like(images.name, `%${search}%`)
      );
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      if (tagArray.length > 0) {
        whereClause = and(
          whereClause,
          sql`${images.tags} && ${tagArray}`
        );
      }
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(images)
      .where(whereClause);

    const imageList = await db
      .select()
      .from(images)
      .where(whereClause)
      .orderBy(desc(images.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      images: imageList,
      total: totalResult.count,
    };
  }

  async getImage(imageId: number, userId: number): Promise<Image | undefined> {
    const [image] = await db
      .select()
      .from(images)
      .where(and(eq(images.id, imageId), eq(images.userId, userId)));

    return image || undefined;
  }

  async createImage(image: InsertImage): Promise<Image> {
    const [newImage] = await db
      .insert(images)
      .values({
        ...image,
        filename: image.name || 'unknown',
        originalName: image.name || 'unknown',
        mimeType: 'image/jpeg',
        size: 0,
      })
      .returning();

    return newImage;
  }

  async updateImage(imageId: number, userId: number, data: Partial<InsertImage>): Promise<Image | undefined> {
    const [updated] = await db
      .update(images)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(images.id, imageId), eq(images.userId, userId)))
      .returning();

    return updated || undefined;
  }

  async deleteImage(imageId: number, userId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(images)
        .where(and(eq(images.id, imageId), eq(images.userId, userId)));

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Delete image error:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
