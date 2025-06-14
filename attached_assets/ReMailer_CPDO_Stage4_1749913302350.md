
# ReMailer – CPDO Stage 4: Design & Prototyping

## Prepared By:
Jay Baker  
Product Developer  
🗒️ Date: 2025-06-14

---

## 1 · Purpose

Translate validated user problems and prioritized features into visual designs and functional blueprints. This includes UI/UX mockups, early user feedback, tech stack selection, and documentation of key frontend and backend requirements.

---

## 2 · Design Prototypes

### 2.1 Core UX Wireframes (High-Fidelity)
**Screens:**
- Dashboard (Campaign performance at a glance)
- Campaign Builder (WYSIWYG + HTML tab)
- Contact Upload & Tagging
- API Token Management
- Analytics Dashboard (Opens, Clicks, Bounce Rate)
- Settings (Sender domains, integrations)
- User Management (Roles, permissions)
- Audit Log Viewer

**Design Tools:** Figma (exportable to React/Tailwind via plugins)  
**User Flow Validated:** Yes (via 3 stakeholder reviews)

---

## 3 · Technical Architecture

### 3.1 Tech Stack

| Layer          | Technology               | Notes                                                   |
|----------------|--------------------------|----------------------------------------------------------|
| **Frontend**   | React + Tailwind CSS     | Fast UI dev; integrates with Replit and Vite tooling    |
| **Backend**    | Node.js (Express)        | RESTful API; Replit-compatible                          |
| **Database**   | PostgreSQL (via Supabase)| User, contact, campaign, and analytics storage          |
| **Email Engine** | Mailgun / Postmark     | Supports deliverability and analytics                   |
| **Auth**       | Clerk.dev / Supabase Auth| Magic link & OAuth support                              |
| **RBAC**       | Custom Roles + Supabase Policies | Support for admin, editor, viewer roles         |
| **SOC2 Auditing** | Supabase Logs + Custom Audit Middleware | Log all key actions (login, send, edit)     |
| **Deployment** | Replit + Railway         | Replit for dev/test; Railway for scaling prod           |
| **Monitoring** | LogRocket + Posthog      | Session logging and event analytics                     |

---

## 4 · Functional Requirements

### 4.3 System States & Transitions
...

### 4.4 Access Control Matrix (RBAC)
...

### 4.5 Data Models (Simplified)
...

### 4.6 Notifications
...

### 4.7 Rate Limiting (Suggested Defaults)
...

### 4.8 CI/CD Expectations
...

### 4.9 Unit Testing Guidance
...

---

## 5 · Feedback Summary
...

---

## 6 · Compliance-by-Design
...

---

## 7 · Design Deliverables

*This section intentionally left blank. Design deliverables are not provided in this version of the document.*

---

## 8 · WBS Requirements Expansion from Stage 2

*Already detailed above in expanded form in sprints 1–3 with full UI/backend expectations.*

---

## 9 · Azure/Outlook Mail Integration (healthtrixss.com)
...

---

## 10 · Workflow Diagrams

### 10.1 Create Campaign Workflow
...

### 10.2 Monitor Campaign Workflow
...

---
