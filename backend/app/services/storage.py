import os
from datetime import datetime, timedelta
from typing import Optional

import boto3


class StorageService:
    def __init__(self) -> None:
        self.s3_bucket = os.getenv("S3_BUCKET")
        self.s3_region = os.getenv("AWS_REGION", "us-east-1")
        self.enabled_s3 = bool(self.s3_bucket)
        if self.enabled_s3:
            self.client = boto3.client("s3", region_name=self.s3_region)
        self.local_dir = os.path.abspath(os.getenv("UPLOADS_DIR", os.path.join(os.getcwd(), "uploads")))
        os.makedirs(self.local_dir, exist_ok=True)

    def presign_put(self, key: str, content_type: str, expires_seconds: int = 900) -> dict:
        if self.enabled_s3:
            url = self.client.generate_presigned_url(
                ClientMethod="put_object",
                Params={"Bucket": self.s3_bucket, "Key": key, "ContentType": content_type},
                ExpiresIn=expires_seconds,
            )
            return {"provider": "s3", "url": url, "key": key}
        else:
            # Local fallback: just return a local path to PUT to our API later
            return {"provider": "local", "path": os.path.join(self.local_dir, key).replace("\\", "/"), "key": key}






