import os
import time

import boto3
from pymongo import MongoClient

dynamodb = boto3.resource('dynamodb')
TTL_SECONDS_6_MONTH = 6*730*3600

protocol = os.environ.get("MONGO_DB_PROTOCOL", 'mongodb+srv')
user = os.environ.get("MONGO_DB_USER")
host = os.environ.get("MONGO_DB_URL")
password = os.environ.get("MONGO_DB_PASS")
db = os.environ.get("MONGO_DB_NAME")
uri = "{}://{}:{}@{}/{}?retryWrites=true&w=majority".format(
    protocol, user, password, host, db
)
mongo_client = MongoClient(uri)


def put_app_log(request_id, text, elapsed_time=0, status=False):
    app_id = os.environ.get('APP_CLIENT', 'client-app')
    model_id = os.environ.get("MODEL")
    tableName = os.environ.get('CHAMELEON_APP_LOGS_TABLE')
    table = dynamodb.Table(tableName)

    if request_id:
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
    return False


def get_model_status():
    app_id = os.environ.get('APP_CLIENT', 'client-app')
    model_name = os.environ.get("MODEL")
    tableName = os.environ.get('CHAMELEON_PROJECTS_TABLE')
    table = dynamodb.Table(tableName)

    response = table.get_item(
        Key={
            'id': app_id
        }
    )
    models = response['Item']['models']
    m = list(filter(lambda _m: _m['name'] == model_name, models))
    return m.pop()


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
