import cdk = require("@aws-cdk/core");
import { Environment } from "@aws-cdk/core";

export interface EnvironmentConfig extends cdk.StackProps {
  s3BucketName: string;
  stageName: string;
  env: Environment;
  lambdaEnvironmentVars: { [key: string]: string };
  tags: {
    Team: string;
    [key: string]: string;
  };
  databaseName: string;
  lambdaName: string;
}

export const PROD_ACCOUNT = process.env.PROD_ACCOUNT;
export const NONPROD_ACCOUNT = process.env.NONPROD_ACCOUNT;

export const cfg = {
  nonprod: {
    env: {
      account: NONPROD_ACCOUNT,
      region: "eu-west-1"
    },
    lambdaEnvironmentVars: {},
    s3BucketName: "s3-serverless-nonprod",
    tags: {
      Team: "Automation"
    },
    stageName: "dev",
    databaseName: "serverless-nonprod",
    lambdaName: "serverlessLambda-nonprod"
  },
  prod: {
    env: {
      account: PROD_ACCOUNT,
      region: "eu-west-1"
    },
    lambdaEnvironmentVars: {},
    s3BucketName: "s3-serverless-prod",
    tags: {
      Team: "Automation"
    },
    stageName: "v1",
    databaseName: "serverless-prod",
    lambdaName: "serverlessLambda-prod"
  }
};

cfg.nonprod.lambdaEnvironmentVars = {
  ENVIRONMENT: "nonprod",
  BUCKET: cfg.nonprod.s3BucketName,
  DATABASE: cfg.nonprod.databaseName
};

cfg.prod.lambdaEnvironmentVars = {
  ENVIRONMENT: "prod",
  BUCKET: cfg.prod.s3BucketName,
  DATABASE: cfg.prod.databaseName

};

export type EnvType = keyof typeof cfg;

export const getEnv = (env: EnvType): EnvironmentConfig => {
  return cfg[env];
};