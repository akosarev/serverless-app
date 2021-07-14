"""
This is lambda which is triggered by s3 notification
and upload data to dynamodb Table
"""
import logging
import os
from typing import Any, Optional, List
import boto3
import csv
import codecs

LOG = logging.getLogger("serverless")
LOG_LEVEL = os.environ.get("LOG_LEVEL", logging.INFO)
LOG.setLevel(LOG_LEVEL)

BUCKET_NAME = os.environ.get("BUCKET")

client = boto3.client("s3")


def parse_event_data(event: dict) -> Any:
    """
    Parse lambda event data and return dict:
    {
      'bucket': '<the bucket name>',
      'filename': '<the object key i.e., the file name>',
      'timestamp': '<s3 event timestamp>'
    }
    """

    # Parse encapsulated event (from S3)
    # and retrieve the relevant values of BUCKET_NAME and FILE_NAME
    enca_event_time = event.get("Records")[0].get(  # type: ignore
        "eventTime"
    )  # S3 event timestamp
    s3_notification = event.get("Records")[0].get("s3")  # type: ignore
    bucket_name = s3_notification.get("bucket").get("name")  # S3 bucket name
    object_key = s3_notification.get("object").get(
        "key"
    )  # S3 object key i.e., filename

    return {
        "bucket": bucket_name,
        "filename": object_key,
        "timestamp": enca_event_time,
    }


def read_csv_from_s3(bucket_name: Optional[str], key: str) -> List[dict]:
    """
    main handler
    """
    data = client.get_object(Bucket=bucket_name, Key=key)

    csv_line = None
    result = []
    for csv_line in csv.DictReader(codecs.getreader("utf-8")(data["Body"])):
        result.append(csv_line)

    return result


def handler(event: dict, _: Any) -> bool:
    """
    main handler
    """
    LOG.info(event)

    event_info = parse_event_data(event)
    if (
        not event_info.get("bucket")
        or not event_info.get("filename")
        or not event_info.get("timestamp")
    ):
        raise ValueError(
            f"Did NOT discover the location of \
            an S3 file\nDetails: {event_info}"
        )
    LOG.info(
        f"Discovered file ... \
        s3://{event_info.get('bucket')}/{event_info.get('filename')}"
    )

    result = read_csv_from_s3(BUCKET_NAME, event_info.get("filename"))

    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(os.environ["DATABASE"])

    with table.batch_writer() as batch:
        for item in result:
            batch.put_item(Item=item)

    return True
