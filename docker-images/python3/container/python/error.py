import os
import traceback
import json
import boto3
from functools import wraps

bus_event = boto3.client('events')


def send_error(error_type, error_msg):
    print(
        'Sending to busEvent: {} the ERROR: {}'
        .format(os.environ.get('EVENT_BUS_NAME'), error_msg)
    )
    bus_event.put_events(
        Entries=[
            {
                'Source': os.environ.get('EVENT_BUS_SOURCE'),
                'EventBusName': os.environ.get('EVENT_BUS_NAME'),
                'DetailType': os.environ.get('EVENT_BUS_TYPE'),
                'Detail': json.dumps({
                    'ErrorType': error_type,
                    'Message': error_msg,
                    'AppId': os.environ.get('APP_CLIENT'),
                    'ModelId': os.environ.get("MODEL")
                })
            }
        ]
    )


def error_handler(error_type):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            error, val = None, None
            try:
                val = func(*args, **kwargs)
            except Exception as e:
                formatted_lines = traceback.format_exc().splitlines()
                error = formatted_lines[5:]
                print(
                    f"ERROR {error_type} : {func.__name__} -> {traceback.format_exc()}"
                )
                send_error("{}:{}".format(error_type, func.__name__),
                           " -> ".join(error))
            return val, error
        return wrapper
    return decorator
