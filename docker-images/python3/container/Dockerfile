# Build an image that can do training and inference in SageMaker
# This is a Python 3 image that uses the nginx, gunicorn, flask stack
# for serving inferences in a stable way.

FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get -y update && apt-get install -y --no-install-recommends \
        wget \
        curl \
        python3-dev \
        build-essential libssl-dev libffi-dev \
        libxml2-dev libxslt1-dev zlib1g-dev \
        nginx \
        ca-certificates \
        && rm -rf /var/lib/apt/lists/*

RUN curl -fSsL -O https://bootstrap.pypa.io/3.4/get-pip.py && \
        python3 get-pip.py && \
        rm get-pip.py

RUN pip install --upgrade pip

RUN pip --no-cache-dir install \
        numpy \
        scipy \
        sklearn \
        pandas \
        flask \
        gevent \
        gunicorn \
        boto3 \
        colorama \
        termcolor

ENV PYTHONUNBUFFERED=TRUE
ENV PYTHONDONTWRITEBYTECODE=TRUE
ENV PATH="/opt/program:${PATH}"

# Set up the program in the image
COPY python /opt/program
WORKDIR /opt/program

