from io import StringIO
import os
import time
import sys
import importlib
from functools import wraps
from error import error_handler

context = {}


def protect_credentials(fn):
    @wraps(fn)
    def wrapper(*args):
        secret = os.environ.get('AWS_SECRET_ACCESS_KEY')
        keyid = os.environ.get('AWS_ACCESS_KEY_ID')
        os.environ['AWS_SECRET_ACCESS_KEY'] = ''
        os.environ['AWS_ACCESS_KEY_ID'] = ''

        response = fn(*args)

        os.environ['AWS_SECRET_ACCESS_KEY'] = secret or ''
        os.environ['AWS_ACCESS_KEY_ID'] = keyid or ''
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

    pathname, filename = os.path.split(inference_file)
    sys.path.append(os.path.abspath(pathname))
    modname = os.path.splitext(filename)[0]
    mod = importlib.import_module(modname)

    load_model(mod, logs)

    if not bool(req):
        return {}, []

    start = int(time.time()*1000)
    result = do_inference(mod, logs, req)
    end = int(time.time()*1000)

    output_log = [item for sublist in logs for item in sublist]
    print('Log output: ', output_log)
    return result, output_log, (end-start)


@error_handler('Load Model')
def load_model(mod, logs):
    global context
    if hasattr(mod, 'load_model'):
        if 'model' in context:
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
