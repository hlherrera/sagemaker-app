
import numpy as np

from tensorflow.keras.applications.resnet50 import ResNet50
from tensorflow.keras.preprocessing import image
from tensorflow.keras.utils import get_file
from tensorflow.keras.applications.resnet50 import preprocess_input, decode_predictions


def load_model():
    print('Loading model...')
    model = ResNet50()
    cfg = model.get_config()
    print('name : ', cfg['name'])
    print('# of layers: ', len(cfg['layers']))
    print('# of params: ', model.count_params())
    print('Input: ', cfg['layers'][0]['config']['batch_input_shape'])

    return model


def inference(model, payload, ctx):

    print("Proccessing input ...")
    img_url = payload['url']
    name_file = img_url.split('/')[-1]
    file = get_file(name_file, img_url)
    img = image.load_img(file, target_size=(224, 224))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)

    print("Predicting ...")
    response = model.predict(x)
    predictions = list(
        map(lambda e: [e[1], e[2].astype(float)],
            decode_predictions(response, top=5)[0]
            )
    )

    print("Response classes: {}", predictions)
    return {"response": predictions}
