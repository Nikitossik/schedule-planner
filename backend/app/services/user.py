from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from ..repositories import (
    UserRepository,
    StudentProfileRepository,
    ProfessorProfileRepository,
)
from ..models import User
from ..schemas.user import UserIn, UserUpdate, UserQueryParams
from ..utils.enums import UserRoleEnum
from ..utils import exceptions, security
from app.utils.exceptions import AlreadyExistsException, LastAdminException
from .base import BaseService


class UserService(BaseService[User, UserIn]):
    """
    Service layer for User domain logic.

    Responsibilities:
    - Authenticate users, manage CRUD, and apply list filters.
    - Create role-specific profiles (student/professor) on user creation.
    - Enforce constraints (e.g., prevent deletion of the last admin).
    """

    def __init__(self, db: Session):
        """
        Initialize the User service with repositories.

        Args:
            db (Session): Active SQLAlchemy session.
        """
        self.student_repo = StudentProfileRepository(db)
        self.professor_repo = ProfessorProfileRepository(db)
        super().__init__(db, User, UserRepository(db))

    def authenticate(self, user_email, user_password) -> User:
        """
        Authenticate a user by email and password.

        Args:
            user_email (str): Email address provided by the user.
            user_password (str): Plaintext password to verify.

        Returns:
            User: Authenticated user entity.

        Raises:
            exceptions.UserNotFoundException: If user not found or password mismatch.
        """
        found_user = self.get_by_email(user_email)

        if not found_user or not security.verify_password(
            user_password, found_user.password_hash
        ):
            raise exceptions.UserNotFoundException()

        return found_user

    def apply_filters(self, query, params: UserQueryParams):
        """
        Apply filters to the users query.

        Supported filters:
        - q: free-text search across email, name, and surname.
        - user_roles: filter by one or more roles.
        - user_types: filter base users by user_type, while leaving non-base roles intact.

        Args:
            query: SQLAlchemy query for User.
            params (UserQueryParams): Combined query/filter params.

        Returns:
            The filtered SQLAlchemy query.
        """
        if params.q:
            query_string = params.q.strip()
            query = query.filter(
                or_(
                    User.email.ilike(f"%{query_string}%"),
                    User.name.ilike(f"%{query_string}%"),
                    User.surname.ilike(f"%{query_string}%"),
                )
            )
        if params.user_roles:
            query = query.filter(User.role.in_(params.user_roles))

        if params.user_types:
            query = query.filter(
                or_(
                    User.role != UserRoleEnum.user,
                    and_(
                        User.role == UserRoleEnum.user,
                        User.user_type.in_(params.user_types),
                    ),
                )
            )
        return query

    def create(self, user: UserIn) -> User:
        """
        Create a new user and provision the role-specific profile when applicable.

        Steps:
        - Ensure email uniqueness.
        - Hash provided password.
        - Persist user and create associated student/professor profile.

        Args:
            user (UserIn): Payload for the new user.

        Returns:
            User: Newly created user.

        Raises:
            AlreadyExistsException: If a user with the same email already exists.
        """
        user_data = user.model_dump(exclude={"student_profile", "professor_profile"})

        found_user = self.repo.get_by_email(user_data["email"])

        if found_user:
            raise AlreadyExistsException("User", "email", user_data["email"])

        user_data["password_hash"] = security.get_password_hash(user_data["password"])

        new_user = super().create(user_data)

        # Create profile using data from student_profile or professor_profile
        self.create_user_profile(new_user, user)

        return new_user

    def create_user_profile(self, new_user: User, user_in: UserIn):
        """
        Create a student or professor profile for the newly created user.

        Args:
            new_user (User): Persisted user entity.
            user_in (UserIn): Original input schema with profile data.

        Returns:
            None
        """
        if user_in.user_type == "student" and user_in.student_profile:
            profile_data = {
                **user_in.student_profile.model_dump(),
                "user_id": new_user.id,
            }
            self.student_repo.create(profile_data)
        elif user_in.user_type == "professor" and user_in.professor_profile:
            profile_data = {
                **user_in.professor_profile.model_dump(),
                "user_id": new_user.id,
            }
            self.professor_repo.create(profile_data)

    def update(self, user_id: int, user: UserIn | UserUpdate) -> User:
        """
        Update an existing user. Password is re-hashed if provided.
        Updates profile data based on user type.

        Args:
            user_id (int): Identifier of the user to update.
            user (UserIn | UserUpdate): Partial or full update payload.

        Returns:
            User: Updated user entity.
        """
        user_data = user.model_dump(
            exclude_none=True, exclude={"student_profile", "professor_profile"}
        )

        if user_data.get("password"):
            user_data["password_hash"] = security.get_password_hash(
                user_data["password"]
            )

        updated_user = super().update(user_id, user_data)

        # Update profile based on user type using relationship
        if updated_user.user_type == "student" and user.student_profile:
            profile_data = user.student_profile.model_dump(exclude_none=True)
            if profile_data and updated_user.student_profile:
                for key, value in profile_data.items():
                    setattr(updated_user.student_profile, key, value)
        elif updated_user.user_type == "professor" and user.professor_profile:
            profile_data = user.professor_profile.model_dump(exclude_none=True)
            if profile_data and updated_user.professor_profile:
                for key, value in profile_data.items():
                    setattr(updated_user.professor_profile, key, value)

        self.db.commit()
        self.db.refresh(updated_user)
        return updated_user

    def delete(self, user_id: int):
        """
        Delete a user by ID, preventing removal of the last admin.

        Args:
            user_id (int): Identifier of the user to delete.

        Returns:
            Any: Repository delete result.

        Raises:
            LastAdminException: If attempting to delete the only remaining admin.
        """
        admin_users = self.repo.get_by_role(UserRoleEnum.admin)

        if len(admin_users) == 1 and admin_users[0].id == user_id:
            raise LastAdminException

        return super().delete(user_id)

    def get_by_user_type(self, user_type: str) -> list[User]:
        """
        Retrieve users of a specific user_type (for base users).

        Args:
            user_type (str): Target user type (e.g., STUDENT, PROFESSOR).

        Returns:
            list[User]: Matching users.
        """
        return self.repo.get_by_user_type(user_type)

    def get_by_email(self, email: str) -> User | None:
        """
        Retrieve a user by email.

        Args:
            email (str): Email address to search for.

        Returns:
            User | None: Matching user or None if not found.
        """
        return self.repo.get_by_email(email)
