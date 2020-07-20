import { StorageTypeInterface, STORAGE_TYPE } from '../types.enum';

export class S3StorageType implements StorageTypeInterface {
  filter(requestBody: object) {
    return (
      requestBody['bucket'] &&
      requestBody['key'] &&
      requestBody['accessKeyId'] &&
      requestBody['secretAccessKey'] &&
      requestBody['region']
    );
  }

  value() {
    return STORAGE_TYPE.AWS_S3;
  }
}
