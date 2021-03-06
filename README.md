# serverless-app

This is a serverless application.

## What inside:
### S3 bucket
S3 bucket without version history(easy to change in configuration)

### DynamoDB
DynamoDB to keep our data from s3 bucket

### Notification 
Notification from s3 to lambda for every new file in it.

### Lambda 
Lambda which get content of file and put into DynamoDB

### Policy and Role for lambda
The least privileges for lambda to get files and put into a database.


### Makefile

```Makefile``` has everything inside.
From tests to deploy/destroy.
You can run make to see all options it has.



## CDK

This app is designed as a CDK stack with all resources inside.
```src``` directory has every resource from above. 
Depending on environment variables you can install as many copies of app as you want.


# CI/CD
CI/CD is done through Github Actions


Development flow is:
```Branch --> Develop --> Main```

## Branch: 
For every push in any branch workflow ```cdk-branch.yaml``` runs test for 
python lambdas(mypy, pylint, black) and does cdk synth

## Develop:
After merging any branch to develop workflow ```cdk-develop.yaml``` runs 
deploy infrastructure to nonprod zone. It can be another account or shared account.
Depends on configuration.

## Main:
After merging any branch to the main workflow ```cdk-main.yaml``` runs 
deploy infrastructure to prod zone.

## Destroy

Destruction is an extra feature here. You can push to destroy branches to 
run ``cdk destroy`` for prod and nonprod environments.
This was done for test purposes, but of course you can use it for some cases.


