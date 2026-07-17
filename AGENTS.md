# Tishrei Entry Backend - Agent Instructions (AGENTS.md)

This document provides a comprehensive overview of the Tishrei Entry Backend project, its architecture, coding standards, and guidelines for AI agents working on the codebase.

## 1. Project Overview

The **Tishrei Entry Backend** is a Node.js server built with Express and MongoDB. It serves as the backend for a QR code entry management system. The system is designed to manage:

*   **Users:** System administrators and scanners with different permission levels.
*   **Participants:** Attendees of the events, identified by unique details and barcodes.
*   **Events:** Specific dates/sessions where entry needs to be tracked.
*   **Entries:** Records of when a participant scanned in for a particular event.

The system uses JSON Web Tokens (JWT) for authentication and role-based access control (RBAC) to differentiate between `admin` (full access) and `scanner` (limited access for scanning barcodes).

## 2. Architecture & Tech Stack

*   **Runtime:** Node.js (v18+)
*   **Framework:** Express.js
*   **Database:** MongoDB (v5+) accessed via Mongoose ORM
*   **Language:** TypeScript
*   **Authentication:** JWT (JSON Web Tokens) with bcrypt for password hashing
*   **Security:** `helmet` for HTTP headers, `express-rate-limit` for rate limiting, and configured CORS.
*   **Development Tools:** `nodemon`, `ts-node`, `eslint`/`prettier` (assumed based on standard TS projects), `jest` for testing.

## 3. Folder Structure

The project follows a standard MVC-like architecture for Express applications:

```
src/
├── config/       # Configuration files (e.g., database connection)
├── controllers/  # Request handlers containing the core business logic
├── middleware/   # Express middleware (e.g., auth, role checking)
├── models/       # Mongoose database schemas and models
├── routes/       # Express route definitions, mapping endpoints to controllers
├── services/     # (Optional) Reusable business logic separated from controllers
├── types/        # TypeScript interfaces and type definitions
├── utils/        # Utility functions (e.g., database seeding scripts)
└── index.ts      # The main entry point of the application
```

## 4. Coding Standards & Guidelines

When modifying or adding to the codebase, adhere to the following principles:

1.  **TypeScript:** Always use strong typing. Define interfaces for request bodies, responses, and internal data structures in `src/types/index.ts`. Avoid using `any` unless strictly necessary.
2.  **Async/Await:** Use `async/await` for all asynchronous operations (database queries, external API calls, etc.). Avoid raw `.then().catch()` chains.
3.  **Error Handling:**
    *   Wrap controller logic in `try/catch` blocks.
    *   Log errors to the console (`console.error`).
    *   Return appropriate HTTP status codes (e.g., 400 for validation errors, 401 for unauthorized, 404 for not found, 500 for server errors).
    *   **Crucial:** All user-facing error and success messages returned in the JSON response must be in **Hebrew**.
4.  **Response Format:** Always use the standard `ApiResponse` format defined in the project:
    ```json
    {
      "success": true | false,
      "data": { ... }, // Optional, present if success is true
      "message": "...", // Optional success message in Hebrew
      "error": "..." // Optional, present if success is false, in Hebrew
    }
    ```
5.  **Authentication/Authorization:** Protect routes using the appropriate middleware from `src/middleware/auth.ts`:
    *   `authenticateToken`: Requires a valid JWT token.
    *   `requireAdmin`: Requires a valid JWT token AND an `admin` role.

## 5. Workflow: Adding a New Endpoint

To add a new feature or endpoint, follow this general workflow.

**Example: Adding an endpoint to update a participant's note.**

**Step 1: Define Types (if needed)**
If the new endpoint requires a specific request body or a new data structure, add it to `src/types/index.ts`.
```typescript
// Example: src/types/index.ts
export interface UpdateParticipantNoteRequest {
  note: string;
}
```

**Step 2: Update the Model (if needed)**
If the database schema needs to change, update the corresponding file in `src/models/`.
```typescript
// Example: Adding a note field to src/models/Participant.ts
const participantSchema = new Schema<IParticipant>({
  // ... existing fields
  note: { type: String, required: false },
});
```

**Step 3: Create the Controller Logic**
Add the business logic to the relevant controller in `src/controllers/`. Remember to use `try/catch` and return standard Hebrew responses.
```typescript
// Example: src/controllers/participantController.ts
import { Request, Response } from 'express';
import { ParticipantModel } from '../models/Participant';

export const updateParticipantNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const participant = await ParticipantModel.findByIdAndUpdate(
      id,
      { note },
      { new: true, runValidators: true }
    );

    if (!participant) {
      res.status(404).json({ success: false, error: 'משתתף לא נמצא' });
      return;
    }

    res.status(200).json({
      success: true,
      data: participant,
      message: 'הערת משתתף עודכנה בהצלחה'
    });
  } catch (error) {
    console.error('Update participant note error:', error);
    res.status(500).json({ success: false, error: 'שגיאה בשרת' });
  }
};
```

**Step 4: Define the Route**
Map the new controller function to a specific HTTP method and URL in the relevant router inside `src/routes/`. Apply necessary middleware.
```typescript
// Example: src/routes/participants.ts
import { Router } from 'express';
import { updateParticipantNote /* ... other controllers */ } from '../controllers/participantController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// ... existing routes

// Only admins can update notes
router.patch('/:id/note', authenticateToken, requireAdmin, updateParticipantNote);

export default router;
```

**Step 5: Register the Router (if creating a new domain)**
If you created a completely new route file (e.g., `src/routes/reports.ts`), you must register it in `src/index.ts`.
```typescript
// Example: src/index.ts
// ...
import reportRoutes from './routes/reports';
// ...
app.use('/api/reports', reportRoutes);
```

## 6. Testing

Ensure that you run the existing tests to verify that your changes did not introduce regressions.

```bash
npm test
```

If you add new features, it is highly recommended to add corresponding test coverage (e.g., in a `tests` or `__tests__` directory if one exists, or alongside the files).