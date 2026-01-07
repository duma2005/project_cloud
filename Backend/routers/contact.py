from fastapi import APIRouter
from pydantic import BaseModel, constr

router = APIRouter(prefix="/contact", tags=["Contact"])


class ContactPayload(BaseModel):
    name: constr(min_length=2, max_length=80)
    email: constr(min_length=3, max_length=320)
    message: constr(min_length=10, max_length=2000)


@router.post("")
def submit_contact(payload: ContactPayload):
    return {"ok": True}
