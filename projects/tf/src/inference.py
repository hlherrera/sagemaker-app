import os
import numpy as np
import json
import tensorflow as tf

imagenet_labels = None


def _get_labels():
    labels_path = tf.keras.utils.get_file(
        'ImageNetLabels.txt',
        'https://storage.googleapis.com/download.tensorflow.org/data/ImageNetLabels.txt')
    imagenet_labels = np.array(open(labels_path).read().splitlines())
    return imagenet_labels


def load_model():
    print('Loading model...')
    mobilenet_save_path = os.path.join('.', "mobilenet/1/")
    model = tf.saved_model.load(mobilenet_save_path)
    print(list(model.signatures.keys()))
    return model


def inference(model, payload, context):
    global imagenet_labels

    if 'labels' not in context:
        print("Loading labels ...")
        context['labels'] = _get_labels()

    predictor = model.signatures["serving_default"]

    print("Proccessing input ...")
    img_url = payload['url']
    name_file = img_url.split('/')[-1]
    file = tf.keras.utils.get_file(name_file, img_url)
    img = tf.keras.preprocessing.image.load_img(file, target_size=[224, 224])
    x = tf.keras.preprocessing.image.img_to_array(img)
    x = tf.keras.applications.mobilenet.preprocess_input(x[tf.newaxis, ...])

    print("Predicting ...")
    response = predictor(tf.constant(x))

    predictions = np.array(response["predictions"])
    if imagenet_labels is None:
        imagenet_labels = _get_labels()
    index = np.argsort(predictions)[0, ::-1][:5]

    result = list(zip(imagenet_labels[index+1],
                      map(str, predictions[0][index])))

    print("Response classes: {}", result)
    return {"response": result}
