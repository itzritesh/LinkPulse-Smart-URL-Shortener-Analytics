from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard generic envelope for API responses."""
    success: bool = Field(True, description="Whether the request was successful")
    message: str = Field("Success", description="Human-readable status message")
    data: Optional[T] = Field(None, description="Payload data")


class ErrorResponse(BaseModel):
    """Standard error response structure."""
    success: bool = Field(False, description="Always false for error responses")
    message: str = Field(..., description="Error summary")
    detail: Optional[Any] = Field(None, description="Detailed error information or validation errors")
