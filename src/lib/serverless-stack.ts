import cdk = require("@aws-cdk/core");
import s3 = require("@aws-cdk/aws-s3");
import lambda = require("@aws-cdk/aws-lambda");
import iam = require("@aws-cdk/aws-iam");
import * as lambdaEventSources from '@aws-cdk/aws-lambda-event-sources';
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import {BlockPublicAccess, Bucket} from '@aws-cdk/aws-s3';

import {
  EnvironmentConfig,
  PROD_ACCOUNT,
} from "./config";

export class ServerlessStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, cfg: EnvironmentConfig) {
    super(scope, id, { env: cfg.env, tags: cfg.tags });

    const app = this.node.root;

    const lambdaPolicy = new iam.ManagedPolicy(this, "ManagedPolicy", {
      path: "/self-service/serverless/",
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["Logs:CreateLogGroup"],
          resources: [`arn:aws:logs:eu-west-1:${cfg.env.account}:*`],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["Logs:CreateLogStream", "Logs:PutLogEvents"],
          resources: [`arn:aws:logs:eu-west-1:${cfg.env.account}:log-group:*`],
        }),
       new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["s3:*"],
          resources: [
            `arn:aws:s3:::${cfg.s3BucketName}`,
            `arn:aws:s3:::${cfg.s3BucketName}/*`,
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "kms:Encrypt",
            "kms:Decrypt",
            "kms:ReEncrypt*",
            "kms:GenerateDataKey*",
            "kms:DescribeKey",
          ],
          resources: [`*`],
        }),
         new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["dynamodb:*"],
          resources: [
            `arn:aws:dynamodb:eu-west-1:${cfg.env.account}:table/${cfg.databaseName}`,
          ],
        }),

      ],
    });

    const lambdaRole = new iam.Role(this, "serverlessLambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [lambdaPolicy],
      path: "/self-service/serverless/"
    });


    const bucket = new s3.Bucket(
      this,
      cfg.s3BucketName,
        {
            versioned: false,
            bucketName: cfg.s3BucketName,
            encryption: s3.BucketEncryption.KMS_MANAGED,
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL
        }
    );

    const serverlessLambda = new lambda.Function(this, cfg.lambdaName, {
      functionName: cfg.lambdaName,
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset("serverless_lambda"),
      handler: "app.handler",
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      environment: cfg.lambdaEnvironmentVars,
    });

    const s3PutEventSource = new lambdaEventSources.S3EventSource(bucket, {
      events: [
        s3.EventType.OBJECT_CREATED_PUT
      ]
    });

    serverlessLambda.addEventSource(s3PutEventSource);

    const table = new dynamodb.Table(this, cfg.databaseName, {
      tableName: cfg.databaseName,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Use on-demand billing mode
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
    });


  }
}