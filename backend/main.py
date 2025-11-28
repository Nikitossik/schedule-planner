import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.database import Base, engine
import app.routes as routes
from app.utils.lifespan import lifespan

Base.metadata.create_all(engine)

# Rich, Markdown-formatted project description for Swagger/OpenAPI
PROJECT_DESCRIPTION = """
# Schedule Planner API

A backend service for planning academic schedules: faculties, directions, study forms, academic years, semesters, professors, workloads, subjects, rooms, groups, schedules, and lessons.

## Authentication
- Scheme: Bearer JWT (Authorization: Bearer <token>)
- OAuth2 password flow for token issuance at /api/auth/token
- Access token: short-lived; Refresh token: long-lived

## Error handling
- Errors use standard HTTP status codes (4xx/5xx)
- Error payloads include "detail" and optional extra fields

## Pagination, Sorting, Filtering
- Pagination: page (1-based), pageSize, loadAll (bool)
- Sorting: sort_by (field), desc (bool)
- Filtering: q (free-text), plus resource-specific filters (see schema docs)

## Common Conventions
- Dates: YYYY-MM-DD; Times: HH:MM:SS
- All timestamps are UTC unless otherwise noted
- Enums are uppercase strings (e.g., FULL_TIME, AUTUMN)

## Security
- bearerAuth (JWT): default global security requirement
- OAuth2 password flow: POST /api/auth/token

## Resources (Tags)
- Auth, Users, Faculties, Directions, Study Forms, Academic Years, Semesters,
  Professor Contracts, Professor Workloads, Subjects, Subject Assignments,
  Rooms, Groups, Schedules, Lessons, Conflicts

## External Docs
- See README or project wiki for deployment, migrations, and examples.
"""

# OpenAPI Tags metadata (descriptions visible in Swagger)
OPENAPI_TAGS = [
    {
        "name": "Auth",
        "description": "Authentication endpoints (token issuance, refresh).",
    },
    {
        "name": "Users",
        "description": "User management: CRUD, authentication, and profiles.",
    },
    {"name": "Faculties", "description": "Faculty resources (schools/departments)."},
    {"name": "Directions", "description": "Academic directions/programs."},
    {
        "name": "Study Forms",
        "description": "Study formats (e.g., FULL_TIME, PART_TIME).",
    },
    {
        "name": "Academic Years",
        "description": "Academic year resources and current year flag.",
    },
    {
        "name": "Semesters",
        "description": "Semester resources and periods (AUTUMN/SPRING).",
    },
    {
        "name": "Professor Contracts",
        "description": "Contracts per professor per semester.",
    },
    {
        "name": "Professor Workloads",
        "description": "Workloads and subject-hour allocations.",
    },
    {"name": "Subjects", "description": "Subjects/courses offered in semesters."},
    {
        "name": "Subject Assignments",
        "description": "Assignment of subjects to workloads.",
    },
    {"name": "Rooms", "description": "Rooms and availability checks."},
    {"name": "Groups", "description": "Student groups per study form and semester."},
    {"name": "Schedules", "description": "Schedules/timetables and exports."},
    {"name": "Lessons", "description": "Lesson sessions per schedule."},
    {
        "name": "Conflicts",
        "description": "Conflict detection (room, professor, group).",
    },
]

# Replace the basic FastAPI() init with full OpenAPI metadata
app = FastAPI(
    lifespan=lifespan,
    title="Schedule Planner API",
    version="1.0.0",
    description=PROJECT_DESCRIPTION,
    terms_of_service="https://example.com/terms",
    contact={
        "name": "Schedule Planner Team",
        "url": "https://example.com",
        "email": "support@example.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=OPENAPI_TAGS,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)


# Customize the generated OpenAPI schema (servers, externalDocs, security)
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Servers (environments)
    openapi_schema["servers"] = [
        {"url": "http://127.0.0.1:8000", "description": "Local development"},
        {"url": "https://api.example.com", "description": "Production"},
    ]

    # External documentation link
    openapi_schema["externalDocs"] = {
        "description": "Project documentation and guides",
        "url": "https://example.com/docs",
    }

    # Security schemes (JWT bearer and OAuth2 password flow)
    components = openapi_schema.setdefault("components", {})
    security_schemes = components.setdefault("securitySchemes", {})
    security_schemes.update(
        {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "Provide the access token: Bearer <JWT>",
            },
            "OAuth2Password": {
                "type": "oauth2",
                "flows": {
                    "password": {
                        "tokenUrl": "/api/auth/token",
                        "scopes": {},
                    }
                },
                "description": "OAuth2 Password flow for obtaining tokens.",
            },
        }
    )

    # Set global security requirement (can be overridden per-route)
    openapi_schema["security"] = [{"bearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.auth_router)
app.include_router(routes.user_router)
app.include_router(routes.faculty_router)
app.include_router(routes.direction_router)
app.include_router(routes.study_form_router)
app.include_router(routes.academic_year_router)
app.include_router(routes.semester_router)
app.include_router(routes.university_holiday_router)
app.include_router(routes.professor_contract_router)
app.include_router(routes.professor_workload_router)
app.include_router(routes.subject_router)
app.include_router(routes.subject_assignment_router)
app.include_router(routes.room_router)
app.include_router(routes.group_router)
app.include_router(routes.schedule_router)
app.include_router(routes.lesson_router)
app.include_router(routes.recurring_template_router)


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
