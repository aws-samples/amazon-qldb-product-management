import * as cdk from '@aws-cdk/core';
import { CfnLedger } from '@aws-cdk/aws-qldb';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Notifications from '@aws-cdk/aws-s3-notifications';
import * as lambda from '@aws-cdk/aws-lambda';
import * as lambdaNodejs from '@aws-cdk/aws-lambda-nodejs';
import * as agw from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';

const ID_PREFIX = 'QLDBProdMng';
const LEDGER_NAME = 'productmanagement';
const TABLE_NAME = 'qualitydata';

export class BackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new CfnLedger(this, `${ID_PREFIX}-Ledger`, {
      permissionsMode: 'ALLOW_ALL',
      name: LEDGER_NAME,
    });

    const bucket = new s3.Bucket(this, `${ID_PREFIX}-Bucket`, {
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.HEAD,
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    const defaultFuncProps = {
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: cdk.Duration.minutes(1),
      tracing: lambda.Tracing.ACTIVE,
    };

    const hookCreateEvent = new lambdaNodejs.NodejsFunction(this, `${ID_PREFIX}-HookCreateEvent`, {
      ...defaultFuncProps,
      entry: './lambda/hookCreateEvent.ts',
      environment: {
        LEDGER_NAME,
        TABLE_NAME,
      },
    });

    bucket.grantRead(hookCreateEvent);
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.LambdaDestination(hookCreateEvent)
    );

    this.addQldbPolicy(hookCreateEvent);

    const createPresignedUrl = new lambdaNodejs.NodejsFunction(this, `${ID_PREFIX}-CreatePresignedUrl`, {
      ...defaultFuncProps,
      entry: './lambda/createPresignedUrl.ts',
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(createPresignedUrl);

    const history = new lambdaNodejs.NodejsFunction(this, `${ID_PREFIX}-History`, {
      ...defaultFuncProps,
      entry: './lambda/history.ts',
      environment: {
        LEDGER_NAME,
        TABLE_NAME,
      },
    });

    this.addQldbPolicy(history);

    const query = new lambdaNodejs.NodejsFunction(this, `${ID_PREFIX}-Query`, {
      ...defaultFuncProps,
      entry: './lambda/query.ts',
      environment: {
        LEDGER_NAME,
        TABLE_NAME,
      },
    });

    this.addQldbPolicy(query);

    const update = new lambdaNodejs.NodejsFunction(this, `${ID_PREFIX}-Update`, {
      ...defaultFuncProps,
      entry: './lambda/update.ts',
      environment: {
        LEDGER_NAME,
        TABLE_NAME,
      },
    });

    this.addQldbPolicy(update);

    const deleteProduct = new lambdaNodejs.NodejsFunction(this, `${ID_PREFIX}-Delete`, {
      ...defaultFuncProps,
      entry: './lambda/delete.ts',
      environment: {
        LEDGER_NAME,
        TABLE_NAME,
      },
    });

    this.addQldbPolicy(deleteProduct);

    const api = new agw.RestApi(this, `${ID_PREFIX}-RestApi`, {
      defaultCorsPreflightOptions: {
        allowOrigins: agw.Cors.ALL_ORIGINS,
        allowMethods: agw.Cors.ALL_METHODS
      }
    });

    const apiS3Url = api.root.addResource('s3url');
    const apiQuery = api.root.addResource('query');
    const apiData = api.root.addResource('data').addResource('{id}');

    apiS3Url.addMethod('GET', new agw.LambdaIntegration(createPresignedUrl));
    apiQuery.addMethod('GET', new agw.LambdaIntegration(query));
    apiData.addMethod('GET', new agw.LambdaIntegration(history));
    apiData.addMethod('PATCH', new agw.LambdaIntegration(update));
    apiData.addMethod('DELETE', new agw.LambdaIntegration(deleteProduct));
  }

  addQldbPolicy(func: lambdaNodejs.NodejsFunction): void {
    func.role!.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [this.formatArn({
          service: 'qldb',
          resource: 'ledger',
          resourceName: LEDGER_NAME,
        })],
        actions: ['qldb:SendCommand'],
      }),
    );
  }
}
