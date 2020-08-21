import flask
from functools import wraps
from db import monitor_prediction
from error import send_error


def monitor(fn):
    @wraps(fn)
    def wrapper(*args):
        try:
            response, request_id = fn(*args)
            output = ''
            if response.is_json:
                output = response.get_json(True)
            else:
                output = response.get_data(True)
            data = {
                'requestId': request_id,
                'endpointInput': flask.request.get_json()["params"],
                'endpointOutput': output,
            }
            monitor_prediction(data)
            return response
        except Exception as e:
            print('Error: {}'.format(str(e)))
            send_error('Error: Monitor Saving', str(e))
            return {}
    return wrapper
