import time
import os
import boto3
from pymongo import MongoClient

dynamodb = boto3.resource('dynamodb')
TTL_SECONDS_6_MONTH = 6*730*3600

user = os.environ.get("MONGO_DB_USER")
password = os.environ.get("MONGO_DB_PASS")
host = os.environ.get("MONGO_DB_URL")
db = os.environ.get("MONGO_DB_NAME")
uri = "mongodb+srv://{}:{}@{}/{}?retryWrites=true&w=majority".format(
    user, password, host, db
)
mongo_client = MongoClient(uri)


def put_app_log(request_id, text, elapsed_time, status):
    app_id = os.environ.get('APP_CLIENT', 'client-app')
    model_id = os.environ.get("MODEL")
    tableName = os.environ.get('CHAMELEON_APP_LOGS_TABLE')
    table = dynamodb.Table(tableName)

    response = table.put_item(
        Item={
            'id': request_id,
            'app': app_id,
            'model': model_id,
            'text': text,
            'dateZ': time.strftime("%d/%m/%Y %H:%M:%S%z"),
            'timestamp': int(time.time()),
            'status': status,
            'duration': elapsed_time,
            'ttl': int(time.time()) + TTL_SECONDS_6_MONTH
        }
    )
    return response


def monitor_prediction(data):
    app_id = os.environ.get('APP_CLIENT', "app-client")
    model_id = os.environ.get('MODEL')
    monitor_db = mongo_client[db]
    collection_logs = monitor_db['endpoint_logs']

    print("Saving prediction: ", data)

    data['appId'] = app_id
    data['modelId'] = model_id
    data['timestamp'] = int(time.time())
    data['dateZ'] = time.strftime("%d/%m/%Y %H:%M:%S%z")

    result = collection_logs.insert_one(data)
    if not result.inserted_id:
        print("Error: ", result)
