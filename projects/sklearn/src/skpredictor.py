import os
import pickle

labels = ["setosa", "versicolor", "virginica"]
model = None


def load_model(payload, context):
    print('Loading model...')
    model = pickle.load(open("model.pkl", "rb"))
    return model


def inference(model, payload, context):
    print("Input parameters: {}".format(payload))
    measurements = [
        payload["sepal_length"],
        payload["sepal_width"],
        payload["petal_length"],
        payload["petal_width"],
    ]

    print("Predicting class...")
    labelId = model.predict([measurements])[0]
    print(
        "Class predicted: index -> {} class-> {}".format(
            labelId, labels[labelId])
    )
    return {"response": labels[labelId]}
