import flask
import json
import os
from functools import wraps
from db import monitor_prediction


def monitor(fn):
    @wraps(fn)
    def wrapper(*args):
        app = os.environ.get('APP_CLIENT', "app-client")
        model = os.environ.get('MODEL')
        response = fn(*args)
        output = ''
        if response.is_json:
            output = response.get_json(True)
        else:
            output = response.get_data(True)
        data = {
            'endpointInput': flask.request.get_json()["params"],
            'endpointOutput': output,
        }
        monitor_prediction(json.dumps(data), app, model)
        return response
    return wrapper
