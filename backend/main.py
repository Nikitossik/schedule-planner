import uvicorn
from fastapi import FastAPI

from app.database import Base, engine
from app.utils.lifespan import lifespan
from app.settings.openapi import create_custom_openapi_schema, get_api_config
from app.settings.middleware import setup_middleware
from app.settings.routes import register_routers

# Initialize database
Base.metadata.create_all(engine)

# Create FastAPI application with configuration
app = FastAPI(lifespan=lifespan, **get_api_config())

# Configure OpenAPI schema
app.openapi = create_custom_openapi_schema(app)

# Setup middleware
setup_middleware(app)

# Register routers
register_routers(app)


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
