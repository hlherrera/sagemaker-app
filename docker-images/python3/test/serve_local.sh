#!/bin/sh

image=$1

docker run -e AWS_DEFAULT_REGION -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -v $(pwd)/:/opt/ml -p 8080:8080 --rm ${image} serve
