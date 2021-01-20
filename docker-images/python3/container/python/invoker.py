import importlib
import os
import sys
import time
import traceback
from functools import wraps
from io import StringIO

from error import error_handler, send_error

context = {'model': None}


def protect_credentials(fn):
    @wraps(fn)
    def wrapper(*args):
        secret = os.environ.get('AWS_SECRET_ACCESS_KEY')
        keyid = os.environ.get('AWS_ACCESS_KEY_ID')
        mongo_pass = os.environ.get('MONGO_DB_PASS')
        mongo_user = os.environ.get('MONGO_DB_USER')
        mongo_db = os.environ.get('MONGO_DB_NAME')
        os.environ['AWS_SECRET_ACCESS_KEY'] = ''
        os.environ['AWS_ACCESS_KEY_ID'] = ''
        os.environ['MONGO_DB_PASS'] = ''
        os.environ['MONGO_DB_USER'] = ''
        os.environ['MONGO_DB_NAME'] = ''

        response = fn(*args)

        os.environ['AWS_SECRET_ACCESS_KEY'] = secret or ''
        os.environ['AWS_ACCESS_KEY_ID'] = keyid or ''
        os.environ['MONGO_DB_PASS'] = mongo_pass
        os.environ['MONGO_DB_USER'] = mongo_user
        os.environ['MONGO_DB_NAME'] = mongo_db

        return response
    return wrapper


class Capturing(list):
    def __enter__(self):
        self._stdout = sys.stdout
        sys.stdout = self._stringio = StringIO()
        return self

    def __exit__(self, *args):
        self.extend(self._stringio.getvalue().splitlines())
        del self._stringio
        sys.stdout = self._stdout


@protect_credentials
def invoke(inference_file, req):
    logs = []
    result = None
    start = int(time.time()*1000)

    try:
        pathname, filename = os.path.split(inference_file)
        sys.path.append(os.path.abspath(pathname))
        modname = os.path.splitext(filename)[0]
        mod = importlib.import_module(modname)
        load_model(mod, logs)

        if not bool(req):
            end = int(time.time()*1000)
            return {}, logs, end-start

        result, err = do_inference(mod, logs, req)

        if err is not None:
            logs.append(err)

    except Exception as e:
        formatted_lines = traceback.format_exc().splitlines()
        errors = formatted_lines[5:]
        logs.append(errors)
        send_error('Load Model', " -> ".join(errors))

    output_log = [item for sublist in logs for item in sublist]
    end = int(time.time()*1000)
    print('Log output: ', output_log)
    return result, output_log, (end-start)


@error_handler('Load Model')
def load_model(mod, logs):
    global context
    if hasattr(mod, 'load_model'):
        print('Has model implemented')
        if context['model'] is not None:
            print("Returning local cached model")
        else:
            with Capturing(["Function call: [load_model]"]) as output:
                context['model'] = getattr(mod, 'load_model')()
            logs.append(output)
    pass


@error_handler('Do Inference')
def do_inference(mod, logs, req):
    result = None
    if hasattr(mod, 'inference'):
        with Capturing(["Function call: [inference]"]) as output:
            result = getattr(mod, 'inference')(context['model'], req, context)
        logs.append(output)
    else:
        msg = 'Handler function (inference) is not implemented correctly in user script.'
        raise NotImplementedError(msg)
    return result
