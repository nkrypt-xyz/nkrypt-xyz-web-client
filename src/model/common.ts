export type Session = {
  serverUrl: string;
  apiKey: string;
};

export type User = {
  userName: string;
  displayName: string;
  userId: string;
};

export type Settings = {
  uploadMechanism: string;
  downloadMechanism: string;
};

export type Bucket = {
  _id: string;
  name: string;
  cryptSpec: string;
  cryptData: string;
  metaData: any;
  bucketAuthorizations: [];
};
