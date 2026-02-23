from fastapi import APIRouter
from ..config import setting

config_router = APIRouter(prefix="/config", tags=["config"])


@config_router.get("/feature-flags")
async def get_feature_flags():
    return {
        "disableStudentAccounts": setting.DISABLE_STUDENT_ACCOUNTS,
    }
