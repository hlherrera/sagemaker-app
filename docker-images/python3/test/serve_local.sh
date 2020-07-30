#!/bin/sh

image=${1:-python3}

#
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=AKIAZSJ7JVBU3BAQQIHD
export AWS_SECRET_ACCESS_KEY=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

export BUCKET=23people-model
export MODEL=tf-model
export MODEL_PREFIX=tf
export MODEL_MAIN=inference

#tables
export CHAMELEON_APP_LOGS_TABLE=chameleon-clients-logs-dev
export CHAMELEON_APP_MONITOR_TABLE=chameleon-clients-monitor-dev
#

docker run -e AWS_DEFAULT_REGION -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e CHAMELEON_APP_LOGS_TABLE -e CHAMELEON_APP_MONITOR_TABLE -e BUCKET -e MODEL -e MODEL_PREFIX -e MODEL_MAIN  -v $(pwd)/:/opt/ml -p 8080:8080 --rm ${image} serve
