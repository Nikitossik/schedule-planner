"""
OpenAPI configuration and schema customization for the Schedule Planner API.
"""

from fastapi.openapi.utils import get_openapi
from .docs import API_METADATA, OPENAPI_TAGS


def create_custom_openapi_schema(app):
    """
    Creates a customized OpenAPI schema with security schemes and metadata.
    """
    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )

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

    return custom_openapi


def get_api_config():
    """
    Returns the API configuration dictionary.
    """
    return {
        **API_METADATA,
        "openapi_tags": OPENAPI_TAGS,
        "openapi_url": "/openapi.json",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
    }