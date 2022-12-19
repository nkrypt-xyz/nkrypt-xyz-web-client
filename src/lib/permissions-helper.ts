const defaultGlobalPermissions = {
  MANAGE_ALL_USER: false,
  CREATE_USER: false,
  CREATE_BUCKET: true,
};

const globalPermissionDetails = {
  MANAGE_ALL_USER: "Manage all users",
  CREATE_USER: "Create users",
  CREATE_BUCKET: "Create buckets",
};

const defaultBucketPermissions = {
  VIEW_CONTENT: true,
  MANAGE_CONTENT: true,
  MODIFY: false,
  DESTROY: false,
  MANAGE_AUTHORIZATION: false,
};

const bucketPermissionDetails = {
  VIEW_CONTENT: "View all directories and files",
  MANAGE_CONTENT: "Add/Edit/Delete any directories and files",
  MODIFY: "Modify this bucket and meta data",
  DESTROY: "Destory this bucket",
  MANAGE_AUTHORIZATION: "Manage complete authorization of this bucket",
};

export {
  defaultGlobalPermissions,
  globalPermissionDetails,
  defaultBucketPermissions,
  bucketPermissionDetails,
};
