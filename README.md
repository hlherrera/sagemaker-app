# serverless-nestjs

## What is changed.

### add

- `src/index.ts`
- `src/swagger.ts`
- `serverless.yml`

### change

- `package.json`

### Install

```
$ npm install serverless -g
$ git clone 【projectName】
$ cd 【projectName】
$ npm install
$ npm start
```

### Development

```bash
$ sls offline
```

```
$ sls offline
Serverless: Starting Offline: dev/us-east-1.

Serverless: Routes for index:
Serverless: ANY /
Serverless: ANY /{proxy*}

Serverless: Offline listening on http://localhost:3000
```

Then browse http://localhost:3000

The logs should be :

```
Serverless: ANY / (λ: index)
[Nest] 5280   - 2019-03-24 14:44   [NestFactory] Starting Nest application...
[Nest] 5280   - 2019-03-24 14:44   [InstanceLoader] AppModule dependencies initialized +11ms
[Nest] 5280   - 2019-03-24 14:44   [RoutesResolver] AppController {/}: +5ms
[Nest] 5280   - 2019-03-24 14:44   [RouterExplorer] Mapped {/, GET} route +2ms
[Nest] 5280   - 2019-03-24 14:44   [NestApplication] Nest application successfully started +1ms
```

## How to Deploy

```bash
$ npm run deploy
```

## Options

### Use Swagger for development

```
$ ts-node src/swagger.ts
```

```
[Nest] 6890   - 2019-03-24 15:11   [NestFactory] Starting Nest application...
[Nest] 6890   - 2019-03-24 15:11   [InstanceLoader] AppModule dependencies initialized +11ms
[Nest] 6890   - 2019-03-24 15:11   [RoutesResolver] AppController {/}: +224ms
[Nest] 6890   - 2019-03-24 15:11   [RouterExplorer] Mapped {/, GET} route +2ms
[Nest] 6890   - 2019-03-24 15:11   [NestApplication] Nest application successfully started +2ms
```

Then browse http://localhost:3001/api

**This function is for development.** If you want to use production, change package.json dependencies and serverless.yml.
