from typing import Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserRegisterRequest, UserLoginRequest
from app.core.security import get_password_hash, verify_password, create_access_token


class AuthService:
    @staticmethod
    def register_user(db: Session, req: UserRegisterRequest) -> Tuple[User, str]:
        """Registers a new user, hashes their password, and issues an access token."""
        # 1. Check if email already exists
        existing = db.query(User).filter(User.email == req.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists.",
            )

        # 2. Hash password securely
        password_hash = get_password_hash(req.password)

        # 3. Create user record
        user = User(
            name=req.name,
            email=req.email,
            password_hash=password_hash,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # 4. Issue JWT access token
        access_token = create_access_token(
            subject=user.id,
            extra_claims={"email": user.email, "name": user.name},
        )

        return user, access_token

    @staticmethod
    def authenticate_user(db: Session, req: UserLoginRequest) -> Tuple[User, str]:
        """Validates credentials and generates a JWT access token upon success."""
        user = db.query(User).filter(User.email == req.email).first()
        if not user or not verify_password(req.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email address or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account has been deactivated. Please contact support.",
            )

        access_token = create_access_token(
            subject=user.id,
            extra_claims={"email": user.email, "name": user.name},
        )

        return user, access_token
