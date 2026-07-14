import uuid
from datetime import date

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.usage import Usage
from app.models.user import User

router = APIRouter(prefix="/billing", tags=["billing"])

stripe.api_key = settings.stripe_secret_key

TIER_LIMITS = {
    "free": {"pdfs": 5, "pages_per_pdf": 50, "queries_per_min": 20},
    "pro": {"pdfs": 100, "pages_per_pdf": 500, "queries_per_min": 100},
    "enterprise": {"pdfs": 999999, "pages_per_pdf": 999999, "queries_per_min": 500},
}

TIER_PRICES = {
    "pro": settings.stripe_pro_price_id,
    "enterprise": settings.stripe_enterprise_price_id,
}


@router.get("/usage")
async def get_usage(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    today = date.today().replace(day=1)
    stmt = select(Usage).where(
        Usage.user_id == uuid.UUID(user_id), Usage.month == today
    )
    result = await db.execute(stmt)
    usage = result.scalar_one_or_none()

    if not usage:
        return {
            "pdf_uploads": 0,
            "pages_processed": 0,
            "queries_made": 0,
            "tokens_used": 0,
        }

    return {
        "pdf_uploads": usage.pdf_uploads,
        "pages_processed": usage.pages_processed,
        "queries_made": usage.queries_made,
        "tokens_used": usage.tokens_used,
    }


@router.post("/checkout")
async def create_checkout(
    tier: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if tier not in TIER_PRICES:
        raise HTTPException(status_code=400, detail="Invalid tier")

    if not settings.stripe_secret_key or settings.stripe_secret_key == "":
        raise HTTPException(
            status_code=503,
            detail="Stripe is not configured. Please set up Stripe keys to enable billing.",
        )

    stmt = select(User).where(User.id == uuid.UUID(user_id))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            metadata={"user_id": user_id},
        )
        user.stripe_customer_id = customer.id

    session = stripe.checkout.Session.create(
        customer=user.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": TIER_PRICES[tier], "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.cors_origins[0]}/dashboard?upgraded=true",
        cancel_url=f"{settings.cors_origins[0]}/billing",
        metadata={"user_id": user_id, "tier": tier},
    )

    return {"checkout_url": session.url}


@router.get("/subscription")
async def get_subscription(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.id == uuid.UUID(user_id))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.stripe_customer_id:
        return {"tier": "free", "status": "active"}

    subscriptions = stripe.Subscription.list(customer=user.stripe_customer_id)
    for sub in subscriptions.auto_paging_iter():
        if sub.status == "active":
            price_id = sub.items.data[0].price.id
            tier = "pro" if price_id == TIER_PRICES["pro"] else "enterprise"
            return {"tier": tier, "status": sub.status}

    return {"tier": "free", "status": "active"}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"]["user_id"]
        tier = session["metadata"]["tier"]

        stmt = select(User).where(User.id == uuid.UUID(user_id))
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.plan = tier
            await db.commit()

    return {"status": "ok"}
