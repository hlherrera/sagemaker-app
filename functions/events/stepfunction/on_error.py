import boto3
import functions.db.chameleon_saver as db


def handler(event, context):
    print('event: ', event)
    input = event['detail']['input']
    print('input: ', input)
