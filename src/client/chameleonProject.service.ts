import { Injectable } from '@nestjs/common';
import { DynamoService } from '../aws/dynamo/dynamo.service';
import { ChameleonProject } from './domain/chameleonProject';
import { ChameleonModel } from './domain/models/chameleonModel';

@Injectable()
export class ChameleonProjectService {
  constructor(private readonly db: DynamoService) {}

  readonly DEFAULT_TABLE_NAME: string = 'Chameleon-Project-Table';
  async findOne(projectId: string): Promise<ChameleonProject> {
    const params = {
      TableName:
        process.env.CHAMELEON_PROJECTS_TABLE || this.DEFAULT_TABLE_NAME,
      Key: {
        id: projectId,
      },
    };
    return this.db.get(params).then((Item: ChameleonProject) =>
      new ChameleonProject().build({
        id: Item.id,
        name: Item.name,
        description: Item.description,
        models: Item.models,
      }),
    );
  }

  async register(project: ChameleonProject): Promise<ChameleonProject | Error> {
    const timestamp = new Date().getTime();
    const params = {
      TableName:
        process.env.CHAMELEON_PROJECTS_TABLE || this.DEFAULT_TABLE_NAME,
      Item: {
        createdAt: timestamp,
        updatedAt: timestamp,
        ...project,
      },
    };

    return this.db
      .register(params)
      .catch((err) => err)
      .then((Item) =>
        new ChameleonProject().build({
          id: Item.id,
          name: Item.name,
          description: Item.description,
        }),
      );
  }

  async hasModel(
    projectId: string,
    modelName: string,
  ): Promise<ChameleonModel | false> {
    const project: ChameleonProject = await this.findOne(projectId).catch(
      (err) => err,
    );
    const model = project.models?.find(
      (m: ChameleonModel) => m.name === modelName,
    );
    return model || false;
  }

  async addModel(
    appId: string,
    model: ChameleonModel,
  ): Promise<string | Error> {
    const result = await this.findOne(appId).catch((err) => err);
    if (result instanceof Error) {
      return result;
    }
    const models = [model, ...result.models];
    const params = {
      TableName:
        process.env.CHAMELEON_PROJECTS_TABLE || this.DEFAULT_TABLE_NAME,
      Key: {
        id: appId,
      },
      UpdateExpression: 'set updatedAt = :time, models=:models',
      ExpressionAttributeValues: {
        ':time': new Date().getTime(),
        ':models': models,
      },
      ReturnValues: 'ALL_NEW',
    };

    return this.db.update(params).then(() => model.name || '');
  }
}
