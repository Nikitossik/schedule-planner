from .base import BaseRepository
from ..models.recurring_template import RecurringLessonTemplate


class RecurringLessonTemplateRepository(BaseRepository):
    model = RecurringLessonTemplate
