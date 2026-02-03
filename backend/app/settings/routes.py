"""
Router configuration and registration for the Schedule Planner API.
"""

import app.routes as routes


def register_routers(app):
    """
    Registers all API routers with the FastAPI application.
    """
    # Core routers
    app.include_router(routes.config_router)
    app.include_router(routes.auth_router)
    app.include_router(routes.user_router)
    
    # Academic management
    app.include_router(routes.faculty_router)
    app.include_router(routes.direction_router)
    app.include_router(routes.study_form_router)
    app.include_router(routes.academic_year_router)
    app.include_router(routes.semester_router)
    app.include_router(routes.university_holiday_router)
    
    # Professor and workload management
    app.include_router(routes.professor_contract_router)
    app.include_router(routes.professor_workload_router)
    
    # Subject and assignment management
    app.include_router(routes.subject_router)
    app.include_router(routes.subject_assignment_router)
    
    # Resources and scheduling
    app.include_router(routes.room_router)
    app.include_router(routes.group_router)
    app.include_router(routes.schedule_router)
    app.include_router(routes.lesson_router)
    app.include_router(routes.recurring_template_router)