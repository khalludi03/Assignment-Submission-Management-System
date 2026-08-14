# AMASS (Assignment & Submission Management System)

A role-based school/college web application for managing assignments and submissions. Teachers create and
publish assignments for the classes and subjects they teach; students view assignments, submit answers and
update them before the deadline; teachers review submissions, award marks and give feedback; an admin manages
users, classes, subjects and teacher assignments and can view everything.

Built as a full-stack evaluation project for **OnnoRokom Projukti Limited** (submitted 14 August 2026).

## Table of Contents

- [Main Features](#main-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Demo Credentials](#demo-credentials)
- [Prerequisites](#prerequisites)
- [Setup — Database](#setup--database)
- [Setup — Backend](#setup--backend)
- [Setup — Frontend](#setup--frontend)
- [Running the Tests](#running-the-tests)
- [API Overview](#api-overview)
- [Environment Configuration](#environment-configuration)
- [Assumptions](#assumptions)
- [Known Limitations](#known-limitations)

## Main Features

| Role | Capabilities |
| --- | --- |
| **Admin** | Manage users (admin/teacher/student), classes, subjects. Assign teachers to class+subject pairs. View all assignments and submissions across the school. |
| **Teacher** | Create, edit and delete assignments. Assign each assignment to a class and subject, define title, description, deadline and maximum marks. Keep as draft or publish/unpublish. Review student submissions, award marks, give feedback, and change submission status (Submitted/Graded/Rejected). |
| **Student** | View the published assignments for their class, see details and deadlines, submit an answer, update it before the deadline (unless already graded), and view submission status, marks and feedback. |

Key business rules enforced by the backend:

- A teacher may only create/edit assignments for class+subject pairs they have been assigned to.
- An assignment must have a future deadline and a positive maximum marks value.
- Students only see published assignments for their own class; draft assignments are invisible to them.
- A student may not submit to a draft assignment or to an assignment for another class.
- Submissions cannot be created after the deadline; existing submissions can be updated before the deadline
  or until graded.
- Marks must be between `0` and the assignment's maximum marks.
- Duplicate emails, duplicate teacher assignments, and deletion of in-use records are rejected with clear messages.

## Technology Stack

- **Frontend:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, client-side forms.
- **Backend:** ASP.NET Core 8 Web API, C#, EF Core 8 (Npgsql), JWT bearer authentication, role-based
  authorization policies, Swagger/OpenAPI, global exception-handling middleware.
- **Database:** PostgreSQL 16 (official Docker image) with EF Core migrations and an idempotent seeder.
- **Testing:** xUnit + EF Core InMemory provider.

## Project Structure

```
.
├── backend/
│   ├── AssignmentSystem.sln
│   ├── AssignmentSystem.Api/          # ASP.NET Core Web API
│   │   ├── Controllers/               # Auth, Assignments, Submissions, Admin
│   │   ├── Services/                  # Business logic, JWT, policies, middleware
│   │   ├── Dtos/                      # Request/response models
│   │   ├── Entities/                  # EF Core entities (TPH: Admin/Teacher/Student)
│   │   ├── Data/                      # AppDbContext, DbSeeder
│   │   ├── Migrations/                # EF Core migrations (auto-applied on startup)
│   │   └── appsettings.json
│   └── AssignmentSystem.Api.Tests/    # xUnit unit tests
├── frontend/                          # Next.js 16 application
│   ├── app/                           # App Router pages (login, admin, teacher, student)
│   ├── components/                    # Reusable UI components
│   ├── lib/                           # API client, auth helpers, types
│   └── proxy.ts                       # Route guard (role-based middleware)
├── docker-compose.yml                 # PostgreSQL 16
├── .env.example                       # Environment variable template
└── README.md
```

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@school.com` | `Admin@123` |
| Teacher | `teacher@school.com` | `Teacher@123` |
| Student | `student@school.com` | `Student@123` |

These accounts (plus a class, two subjects, a teacher assignment, one published assignment and one graded
submission) are created automatically the first time the backend starts against an empty database.

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) 18.17+ (developed on 24)
- [Docker](https://www.docker.com/) with Docker Compose (for PostgreSQL)
- EF Core CLI tool: `dotnet tool install --global dotnet-ef`

## Setup — Database

1. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

2. Confirm it is healthy:

   ```bash
   docker compose ps
   ```

No manual table creation is required. On the first backend startup, EF Core applies the included
migrations automatically and the seeder inserts the demo data. A persistent volume (`db_data`) keeps your
data across container restarts. To start from a clean slate: `docker compose down -v && docker compose up -d`.

## Setup — Backend

1. Start PostgreSQL as described above.
2. Run the API:

   ```bash
   cd backend/AssignmentSystem.Api
   dotnet restore
   dotnet run
   ```

The API listens on `http://localhost:5270` (see `Properties/launchSettings.json`). In development mode
Swagger is available at `http://localhost:5270/swagger`. Every secured endpoint expects a JWT via
`Authorization: Bearer <token>`.

## Setup — Frontend

1. Create `frontend/.env.local`:

   ```bash
   echo "BACKEND_URL=http://localhost:5270" > frontend/.env.local
   ```

2. Run the app:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Open `http://localhost:3000` and sign in with one of the demo credentials. The frontend proxies `/api/*`
requests to the backend (`frontend/next.config.ts`), so no CORS configuration is needed. A route guard
(`frontend/proxy.ts`) redirects unauthenticated visitors to `/login` and keeps each role inside their own
area.

For a production-style check: `npm run build && npm start`.

## Running the Tests

```bash
cd backend
dotnet test
```

The suite covers 41 unit tests: assignment business rules (deadline, marks, ownership, publish), submission
workflows (submit, update-before-deadline, grade, reject, status), authorization policies per role, and the
admin overview reads. The tests use an in-memory EF Core database, so no running PostgreSQL is required.

## API Overview

| Method | Route | Access |
| --- | --- | --- |
| POST | `/api/auth/login` | public |
| GET | `/api/assignments/my` | Student |
| GET | `/api/assignments/teacher` | Teacher |
| GET | `/api/assignments/teaching` | Teacher (own class/subject pairs) |
| POST | `/api/assignments` | Teacher |
| PUT | `/api/assignments/{id}` | Teacher (own) |
| DELETE | `/api/assignments/{id}` | Teacher (own) |
| POST | `/api/assignments/{id}/publish` \| `/unpublish` | Teacher (own) |
| POST | `/api/submissions/{assignmentId}` | Student (submit or update) |
| GET | `/api/submissions/mine` | Student |
| GET | `/api/submissions/assignment/{assignmentId}` | Teacher (own) |
| PUT | `/api/submissions/{id}/grade` | Teacher (own) |
| PUT | `/api/submissions/{id}/status` | Teacher (own) |
| GET/POST | `/api/admin/users` \| `/classes` \| `/subjects` | Admin |
| DELETE | `/api/admin/users/{id}` \| `/classes/{id}` \| `/subjects/{id}` | Admin |
| GET/POST | `/api/admin/teacher-assignments` | Admin |
| DELETE | `/api/admin/teacher-assignments/{t}/{c}/{s}` | Admin |
| GET | `/api/admin/assignments` | Admin |
| GET | `/api/admin/submissions` | Admin |

Errors are returned as `{ "message": "..." }` with an appropriate status code: `400` business rule
violation, `401` unauthenticated, `403` forbidden, `404` not found. Enums are serialized as strings.

## Environment Configuration

Copy the pattern from `.env.example` — no secrets are committed to the repository. The dev-only JWT
signing key lives in `appsettings.json` and must be overridden in any real deployment via
`JWT__SIGNINGKEY` (or `Jwt:SigningKey`). PostgreSQL credentials can be overridden for both Docker and the
API through environment variables.

## Assumptions

- **Roles are modeled by inheritance (TPH), not an enum.** `Admin`, `Teacher` and `Student` are subclasses
  of a shared `User` table with a discriminator column. The role is inferred from the object type, which
  avoids a role field getting out of sync with the object.
- **A teacher assignment is a (teacher, class, subject) triple.** A teacher may only create assignments for
  triples they belong to, and only one triple is seeded.
- **Drafts are a teacher-only concept.** Students never see draft assignments.
- **"Update before the deadline, if allowed"** is interpreted as: a student may update a submission while the
  assignment deadline has not passed and the submission is not yet graded.
- **Submission status defaults to `Submitted`** on submit; grading sets it to `Graded` unless the teacher
  chooses `Rejected`.
- **Deleting an assignment deletes its submissions** (cascade) to avoid orphaned data.
- **Admin cannot be deleted or assigned to teach** (only teachers can be assigned; the admin user is
  protected by in-use guards when it owns data).
- **Local dev uses dev-only credentials** documented above; production deployment must override them.

## Known Limitations

- No pagination or advanced filtering; lists load in full (acceptable at school scale).
- No real-time notifications (email or in-app) for new assignments or grades.
- Submission updates are allowed up to the deadline but the backend stores the latest answer only (no
  revision history).
- No password reset/change flow; passwords are only set by the admin when creating users.
- Frontend form validation is minimal (HTML `required` + basic checks); the backend remains the source of
  truth for validation.
- Swagger is enabled only in the Development environment.
