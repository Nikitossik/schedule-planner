"""
Documentation strings and descriptions for the Schedule Planner API.
"""

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

## Security
- bearerAuth (JWT): default global security requirement
- OAuth2 password flow: POST /api/auth/token
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
    {"name": "Faculties", "description": "Faculty resources."},
    {"name": "Directions", "description": "Academic directions/programs."},
    {
        "name": "Study Forms",
        "description": "Study formats (e.g., full-time, part-time).",
    },
    {
        "name": "Academic Years",
        "description": "Academic year resources and current year flag.",
    },
    {
        "name": "Semesters",
        "description": "Semester resources and periods (winter/summer).",
    },
    {
        "name": "Professor Contracts",
        "description": "Contracts per professor and semester.",
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

# API metadata
API_METADATA = {
    "title": "Schedule Planner API",
    "version": "1.0.0",
    "description": PROJECT_DESCRIPTION,
    "contact": {
        "name": "Schedule Planner Team",
        "email": "nikita.rahmany@gmail.com",
    },
    "license_info": {
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
}