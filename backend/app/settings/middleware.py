"""
Middleware configuration for the Schedule Planner API.
"""

from fastapi.middleware.cors import CORSMiddleware


def configure_cors(app):
    """
    Configures CORS middleware for the FastAPI application.
    """
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production, use specific origins
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def setup_middleware(app):
    """
    Sets up all middleware for the application.
    """
    configure_cors(app)