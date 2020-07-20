import { ChameleonModel } from '../../client/domain/models';

export interface DeploymentService {
  deployModel(model: ChameleonModel, appId?: string): Promise<any>;
}
