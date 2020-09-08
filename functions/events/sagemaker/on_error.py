import boto3
import functions.db.chameleon_saver as db
autoscaling = boto3.client('application-autoscaling')


def handler(event, context):
    print('event: ', event)
    error_message = event['detail']['Message']
    app_id = event['detail']['AppId']
    model_id = event['detail']['ModelId']

    db.update_status_model(
        app_id=app_id, model_id=model_id, status='Failed', soft_delete=False, status_message=error_message
    )
