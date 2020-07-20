import main

path = 's3://23people-model/python/googlesheet.tar.gz'
event = {
    'appClient': 'model-ns',
    'clientModel': {
        'modelName': 'googlesheet',
        'type': 'python3',
        'prefix': 'python',
        'mainProgram': 'googlesheet'
    },
    'chameleonStorage': {
        'key': path
    }
}
main.deploy(event, {})
