import { STORAGE_TYPE } from './storages';
import { S3DeploymentService } from './services/s3Deployment.service';

export const DeploymentsProvider = {
  provide: 'DeploymentServices',
  useFactory: (S3Service: S3DeploymentService) => {
    const mappedProviders = {
      [STORAGE_TYPE.AWS_S3]: S3Service,
    };
    return mappedProviders;
  },
  inject: [S3DeploymentService],
};
