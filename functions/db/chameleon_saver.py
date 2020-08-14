import os
import time
from pymongo import MongoClient
import boto3
from botocore.exceptions import ClientError

TTL_SECONDS_6_MONTH = 6*730*3600

dynamodb = boto3.resource('dynamodb')

host = os.environ.get("MONGO_DB_URL")
user = os.environ.get("MONGO_DB_USER")
password = os.environ.get("MONGO_DB_PASS")
db = os.environ.get("MONGO_DB_NAME")
uri = "mongodb+srv://{}:{}@{}/{}?retryWrites=true&w=majority".format(
    user, password, host, db
)
mongo_client = MongoClient(uri)


def handler(event, ctx):
    app_id = event['appClient']
    chameleon_storage = event['chameleonStorage']
    chameleon_model = event['clientModel']

    bucket = chameleon_storage['key'].replace('s3://', '').split('/')[0]
    project = add_model(app_id, {
        'name': chameleon_model['modelName'],
        'bucket': bucket,
        'status': chameleon_model['status'],
        'path': '{}/'.format(chameleon_model['prefix']).replace('//', '/'),
        'fn': chameleon_model['mainProgram'],
        'type': chameleon_model['type']
    })
    event['error'] = 1 if project is None else 0
    return event


def find_one(app_id):
    table = dynamodb.Table(os.environ.get('CHAMELEON_PROJECTS_TABLE'))
    try:
        response = table.get_item(Key={
            'id': app_id
        })
    except ClientError as e:
        print(e.response['Error'])
    else:
        return response['Item']


def update_status_model(app_id, model_id, status, soft_delete=False, status_message=None):
    table = dynamodb.Table(os.environ.get('CHAMELEON_PROJECTS_TABLE'))
    project = find_one(app_id)
    models = project['models']

    for m in models:
        if m['name'] == model_id:
            m['status'] = status
            if status_message is not None:
                m['statusMessage'] = status_message
            if soft_delete:
                m['active'] = 0
                m['expireAt'] = int(time.time()) + TTL_SECONDS_6_MONTH

    table.update_item(
        Key={
            'id': app_id,
        },
        UpdateExpression='set updatedAt = :time, models=:models',
        ExpressionAttributeValues={
            ':time': int(time.time()),
            ':models': models,
        },
        ReturnValues="UPDATED_NEW"
    )


def delete_model_monitor_logs(app_id, model_id):
    monitor_db = mongo_client[db]
    collection_logs = monitor_db['endpoint_logs']

    result = collection_logs.update_many({
        "appId": app_id,
        "modelId": model_id
    }, {
        "$set": {"ttl": int(time.time()) + TTL_SECONDS_6_MONTH}
    })
    return result.modified_count


def add_model(app_id, model):
    table = dynamodb.Table(os.environ.get('CHAMELEON_PROJECTS_TABLE'))
    project = find_one(app_id)
    if project is not None:
        models = [model] + project['models']

        table.update_item(
            Key={
                'id': app_id,
            },
            UpdateExpression='set updatedAt = :time, models=:models',
            ExpressionAttributeValues={
                ':time': int(time.time()),
                ':models': models,
            },
            ReturnValues="UPDATED_NEW"
        )
    return project
