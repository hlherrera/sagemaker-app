#!/bin/bash

payload=${1:-'{"bucket": "23people-model", "prefix": "python3/", "model": "2a92f9bb-f38f-45e3-a840-d272dc2ad50c", "main": "sk-predictor", "type": "python3", "params": {"sepal_length": 1, "sepal_width": 2, "petal_length": 1, "petal_width": 1} }'}
content=${2:-application/json}

curl --data-binary @${payload} -H "Content-Type: ${content}" -v http://localhost:8080/invocations
