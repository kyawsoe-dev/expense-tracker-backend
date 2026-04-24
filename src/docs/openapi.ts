import { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

const bearerSecurity = [{ bearerAuth: [] }];

const jsonContent = (schema: Record<string, unknown>) => ({
  "application/json": {
    schema
  }
});

const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Expense Tracker API",
    version: "1.1.0",
    description:
      "API documentation for authentication, group collaboration, expense history, monthly summaries, and yearly analytics."
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" }
        }
      },
      ValidationErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string" },
                message: { type: "string" }
              }
            }
          }
        }
      },
      AuthRequestRegister: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 100 },
          name: { type: "string", minLength: 1, maxLength: 100, nullable: true }
        }
      },
      AuthRequestLogin: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 100 }
        }
      },
      RefreshRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string", minLength: 10 }
        }
      },
      AuthResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              email: { type: "string", format: "email" },
              name: { type: "string", nullable: true }
            }
          }
        }
      },
      GroupCreateRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 80 },
          memberEmails: {
            type: "array",
            items: { type: "string", format: "email" },
            maxItems: 20
          }
        }
      },
      GroupMemberRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" }
        }
      },
      GroupSummary: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          ownerId: { type: "string", format: "uuid" },
          memberCount: { type: "integer" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      GroupDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          owner: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string", nullable: true },
              email: { type: "string", format: "email" }
            }
          },
          members: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string", nullable: true },
                email: { type: "string", format: "email" },
                role: { type: "string" },
                joinedAt: { type: "string", format: "date-time" }
              }
            }
          },
          balances: {
            type: "array",
            items: {
              type: "object",
              properties: {
                userId: { type: "string", format: "uuid" },
                name: { type: "string", nullable: true },
                email: { type: "string", format: "email" },
                paid: { type: "number" },
                owes: { type: "number" },
                balance: { type: "number" }
              }
            }
          }
        }
      },
      ExpenseRequest: {
        type: "object",
        required: ["title", "amount", "category", "date"],
        properties: {
          title: { type: "string", minLength: 1, maxLength: 120 },
          amount: { type: "number", minimum: 0.01 },
          category: { type: "string", minLength: 1, maxLength: 60 },
          date: { type: "string", format: "date-time" },
          note: { type: "string", maxLength: 500, nullable: true },
          groupId: { type: "string", format: "uuid", nullable: true }
        }
      },
      ExpenseUserRef: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", nullable: true },
          email: { type: "string", format: "email" }
        }
      },
      ExpenseGroupRef: {
        type: "object",
        nullable: true,
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" }
        }
      },
      Expense: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          amount: { type: "number" },
          category: { type: "string" },
          date: { type: "string", format: "date-time" },
          note: { type: "string", nullable: true },
          groupId: { type: "string", format: "uuid", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          group: { $ref: "#/components/schemas/ExpenseGroupRef" },
          user: { $ref: "#/components/schemas/ExpenseUserRef" }
        }
      },
      ExpenseListResponse: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/Expense" }
          },
          total: { type: "integer" },
          take: { type: "integer" },
          skip: { type: "integer" },
          hasMore: { type: "boolean" },
          nextSkip: { type: "integer", nullable: true },
          filters: {
            type: "object",
            properties: {
              search: { type: "string", nullable: true },
              category: { type: "string", nullable: true },
              year: { type: "integer", nullable: true },
              month: { type: "integer", nullable: true }
            }
          }
        }
      },
      ExpenseMonthSummary: {
        type: "object",
        properties: {
          year: { type: "integer" },
          month: { type: "integer" },
          monthStart: { type: "string", format: "date-time" },
          monthEnd: { type: "string", format: "date-time" },
          total: { type: "number" },
          transactionCount: { type: "integer" },
          topCategory: { type: "string", nullable: true },
          byCategory: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                total: { type: "number" }
              }
            }
          }
        }
      },
      ExpenseYearAnalytics: {
        type: "object",
        properties: {
          year: { type: "integer" },
          yearStart: { type: "string", format: "date-time" },
          yearEnd: { type: "string", format: "date-time" },
          total: { type: "number" },
          averageMonthly: { type: "number" },
          topCategory: { type: "string", nullable: true },
          byMonth: {
            type: "array",
            items: {
              type: "object",
              properties: {
                month: { type: "integer" },
                label: { type: "string" },
                total: { type: "number" }
              }
            }
          },
          byCategory: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                total: { type: "number" }
              }
            }
          }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "API is running"
          }
        }
      }
    },
    "/api/v1/auth/register": {
      post: {
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: jsonContent({ $ref: "#/components/schemas/AuthRequestRegister" })
        },
        responses: {
          "201": {
            description: "Authenticated user response",
            content: jsonContent({ $ref: "#/components/schemas/AuthResponse" })
          },
          "400": {
            description: "Validation failed",
            content: jsonContent({ $ref: "#/components/schemas/ValidationErrorResponse" })
          }
        }
      }
    },
    "/api/v1/auth/login": {
      post: {
        summary: "Log in with email and password",
        requestBody: {
          required: true,
          content: jsonContent({ $ref: "#/components/schemas/AuthRequestLogin" })
        },
        responses: {
          "200": {
            description: "Authenticated user response",
            content: jsonContent({ $ref: "#/components/schemas/AuthResponse" })
          }
        }
      }
    },
    "/api/v1/auth/refresh": {
      post: {
        summary: "Refresh an access token",
        requestBody: {
          required: true,
          content: jsonContent({ $ref: "#/components/schemas/RefreshRequest" })
        },
        responses: {
          "200": {
            description: "Authenticated user response",
            content: jsonContent({ $ref: "#/components/schemas/AuthResponse" })
          }
        }
      }
    },
    "/api/v1/auth/logout": {
      post: {
        summary: "Log out the current user",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "Logout confirmation",
            content: jsonContent({
              type: "object",
              properties: {
                success: { type: "boolean" }
              }
            })
          }
        }
      }
    },
    "/api/v1/groups": {
      get: {
        summary: "List groups available to the authenticated user",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "Group list",
            content: jsonContent({
              type: "array",
              items: { $ref: "#/components/schemas/GroupSummary" }
            })
          }
        }
      },
      post: {
        summary: "Create a new expense group",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: "#/components/schemas/GroupCreateRequest" })
        },
        responses: {
          "201": {
            description: "Created group",
            content: jsonContent({ $ref: "#/components/schemas/GroupDetail" })
          }
        }
      }
    },
    "/api/v1/groups/member-suggestions": {
      get: {
        summary: "Search inviteable users by email",
        security: bearerSecurity,
        parameters: [
          { name: "query", in: "query", required: true, schema: { type: "string" } },
          { name: "groupId", in: "query", schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": {
            description: "Suggested users",
            content: jsonContent({
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  name: { type: "string", nullable: true },
                  email: { type: "string", format: "email" }
                }
              }
            })
          }
        }
      }
    },
    "/api/v1/groups/{id}": {
      get: {
        summary: "Get group detail and balances",
        security: bearerSecurity,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Group detail",
            content: jsonContent({ $ref: "#/components/schemas/GroupDetail" })
          }
        }
      }
    },
    "/api/v1/groups/{id}/members": {
      post: {
        summary: "Add a member to a group",
        security: bearerSecurity,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: jsonContent({ $ref: "#/components/schemas/GroupMemberRequest" })
        },
        responses: {
          "200": {
            description: "Updated group detail",
            content: jsonContent({ $ref: "#/components/schemas/GroupDetail" })
          }
        }
      }
    },
    "/api/v1/expenses": {
      get: {
        summary: "List expenses with pagination and filters",
        security: bearerSecurity,
        parameters: [
          { name: "take", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 } },
          { name: "skip", in: "query", schema: { type: "integer", default: 0, minimum: 0 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "year", in: "query", schema: { type: "integer" } },
          { name: "month", in: "query", schema: { type: "integer", minimum: 1, maximum: 12 } }
        ],
        responses: {
          "200": {
            description: "Paginated expense list",
            content: jsonContent({ $ref: "#/components/schemas/ExpenseListResponse" })
          }
        }
      },
      post: {
        summary: "Create an expense",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: "#/components/schemas/ExpenseRequest" })
        },
        responses: {
          "201": {
            description: "Created expense",
            content: jsonContent({ $ref: "#/components/schemas/Expense" })
          }
        }
      }
    },
    "/api/v1/expenses/by-group/{groupId}": {
      get: {
        summary: "List expenses for a specific group",
        security: bearerSecurity,
        parameters: [
          {
            name: "groupId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          },
          { name: "take", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 } },
          { name: "skip", in: "query", schema: { type: "integer", default: 0, minimum: 0 } }
        ],
        responses: {
          "200": {
            description: "Group expense list",
            content: jsonContent({
              type: "array",
              items: { $ref: "#/components/schemas/Expense" }
            })
          }
        }
      }
    },
    "/api/v1/expenses/{id}": {
      patch: {
        summary: "Update an expense",
        security: bearerSecurity,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: jsonContent({ $ref: "#/components/schemas/ExpenseRequest" })
        },
        responses: {
          "200": {
            description: "Updated expense",
            content: jsonContent({ $ref: "#/components/schemas/Expense" })
          }
        }
      },
      delete: {
        summary: "Delete an expense",
        security: bearerSecurity,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Delete confirmation",
            content: jsonContent({
              type: "object",
              properties: {
                success: { type: "boolean" }
              }
            })
          }
        }
      }
    },
    "/api/v1/expenses/summary/current-month": {
      get: {
        summary: "Current month summary",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "Month summary",
            content: jsonContent({ $ref: "#/components/schemas/ExpenseMonthSummary" })
          }
        }
      }
    },
    "/api/v1/expenses/summary/monthly": {
      get: {
        summary: "Monthly summary for a selected month",
        security: bearerSecurity,
        parameters: [
          { name: "year", in: "query", schema: { type: "integer" } },
          { name: "month", in: "query", schema: { type: "integer", minimum: 1, maximum: 12 } }
        ],
        responses: {
          "200": {
            description: "Month summary",
            content: jsonContent({ $ref: "#/components/schemas/ExpenseMonthSummary" })
          }
        }
      }
    },
    "/api/v1/expenses/analytics/yearly": {
      get: {
        summary: "Yearly analytics grouped by month and category",
        security: bearerSecurity,
        parameters: [
          { name: "year", in: "query", schema: { type: "integer" } }
        ],
        responses: {
          "200": {
            description: "Yearly analytics",
            content: jsonContent({ $ref: "#/components/schemas/ExpenseYearAnalytics" })
          }
        }
      }
    }
  }
} as const;

export function registerOpenApi(app: Express) {
  app.get("/api-docs.json", (_req: Request, res: Response) => {
    res.status(200).json(openApiDocument);
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      explorer: true
    })
  );
}
