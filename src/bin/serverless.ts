#!/usr/bin/env node
import 'source-map-support/register'
import {ServerlessStack} from '../lib/serverless-stack'
import {EnvType, getEnv} from '../lib/config'
import cdk = require('@aws-cdk/core')

const environment = getEnv(process.env.ENV as EnvType);
const app = new cdk.App();

const serverless = new ServerlessStack(
  app,
  "serverless",
  environment
);