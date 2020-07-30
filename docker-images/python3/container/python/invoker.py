from io import StringIO
import os
import sys
import importlib
context = {}


class Capturing(list):
    def __enter__(self):
        self._stdout = sys.stdout
        sys.stdout = self._stringio = StringIO()
        return self

    def __exit__(self, *args):
        self.extend(self._stringio.getvalue().splitlines())
        del self._stringio
        sys.stdout = self._stdout


def invoke(inference_file, *args):
    global context
    model, result = None, ''
    logs = []
    secret = os.environ.get('AWS_SECRET_ACCESS_KEY')
    id = os.environ.get('AWS_ACCESS_KEY_ID')
    os.environ['AWS_SECRET_ACCESS_KEY'] = ''
    os.environ['AWS_ACCESS_KEY_ID'] = ''

    pathname, filename = os.path.split(inference_file)
    sys.path.append(os.path.abspath(pathname))
    modname = os.path.splitext(filename)[0]
    mod = importlib.import_module(modname)

    if hasattr(mod, 'load_model'):
        if 'model' in context:
            print("Returning local cached model")
            model = context['model']
        else:
            with Capturing(["Function call: [load_model]"]) as output:
                model = getattr(mod, 'load_model')(*args)
            context['model'] = model
            logs.append(output)

    if hasattr(mod, 'inference'):
        with Capturing(["Function call: [inference]"]) as output:
            result = getattr(mod, 'inference')(model, *args)
        logs.append(output)
    else:
        raise NotImplementedError(
            'Handler function (inference) is not implemented correctly in user script.')

    os.environ['AWS_SECRET_ACCESS_KEY'] = secret or ''
    os.environ['AWS_ACCESS_KEY_ID'] = id or ''

    output_log = [item for sublist in logs for item in sublist]
    print('Log output: ', output_log)
    return result, output_log
