FROM lambci/lambda:build-nodejs12.x as app

ENV NODE_ENV=development

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

#COPY package*.json ./
COPY . .
RUN rm -f node_modules
RUN npm ci
RUN npm run build

#RUN cat .lambdaignore | xargs zip -9qyr lambda.zip . -x
#CMD aws lambda update-function-code --function-name mylambda --zip-file fileb://lambda.zip

# 1st - STEP
# docker build -t doc .

# 2nd - STEP
# docker run --env-file ./.env doc sls deploy
RUN chmod +x ./start.sh

CMD ["./start.sh"]