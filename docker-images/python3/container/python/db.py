import time
import os
import boto3

dynamodb = boto3.resource('dynamodb')
TTL_SECONDS_6_MONTH = 15552000


def put_app_log(text, app_id):
    tableName = os.environ.get('CHAMELEON_APP_LOGS_TABLE')
    table = dynamodb.Table(tableName)

    response = table.put_item(
        Item={
            'app': app_id,
            'text': text,
            'dateZ': time.strftime("%d/%m/%Y %H:%M:%S%z"),
            'timestamp': int(time.time()),
            'ttl': int(time.time()+TTL_SECONDS_6_MONTH)
        }
    )
    return response


def monitor_prediction(text, app_id, model_id):
    tableName = os.environ.get('CHAMELEON_APP_MONITOR_TABLE')
    table = dynamodb.Table(tableName)

    print("Saving prediction: ", text)

    table.put_item(
        Item={
            'app': app_id,
            'model': model_id,
            'text': text,
            'dateZ': time.strftime("%d/%m/%Y %H:%M:%S%z"),
            'timestamp': int(time.time())
        }
    )
