import boto3

from app.core.config import settings


def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
    )


def download_pdf(s3_key: str) -> bytes:
    s3 = get_r2_client()
    response = s3.get_object(Bucket=settings.r2_bucket_name, Key=s3_key)
    return response["Body"].read()


def upload_to_r2(key: str, data: bytes, content_type: str = "application/pdf"):
    s3 = get_r2_client()
    s3.put_object(
        Bucket=settings.r2_bucket_name,
        Key=key,
        Body=data,
        ContentType=content_type,
    )
