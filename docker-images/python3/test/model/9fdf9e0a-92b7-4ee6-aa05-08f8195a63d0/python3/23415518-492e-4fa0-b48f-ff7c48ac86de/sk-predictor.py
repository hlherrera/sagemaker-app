import os
import pickle

labels = ["setosa", "versicolor", "virginica"]


def inference(payload):
    model = pickle.load(open("model.pkl", "rb"))

    measurements = [
        payload["sepal_length"],
        payload["sepal_width"],
        payload["petal_length"],
        payload["petal_width"],
    ]

    label_id = model.predict([measurements])[0]
    return labels[label_id]
