export enum STORAGE_TYPE {
  AWS_S3 = 1,
}

export interface StorageTypeInterface {
  filter: Function;
  value: Function;
}
