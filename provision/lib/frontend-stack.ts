import * as cdk from '@aws-cdk/core';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';
import * as path from 'path';

const ID_PREFIX = 'QLDBProdMngFrontend';

export class FrontendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, `${ID_PREFIX}-Bucket`, {
      websiteIndexDocument: '',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, `${ID_PREFIX}-AccessIdentity`);
    const distribution = new cloudfront.CloudFrontWebDistribution(this, `${ID_PREFIX}-Distribution`, {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity,
          },
          behaviors: [
            { isDefaultBehavior: true },
          ],
        }
      ],
      errorConfigurations: [
        {
          errorCode: 404,
          errorCachingMinTtl: 0,
          responseCode: 200,
          responsePagePath: '/',
        },
        {
          errorCode: 403,
          errorCachingMinTtl: 0,
          responseCode: 200,
          responsePagePath: '/',
        }
      ],
    });

    new s3Deployment.BucketDeployment(this, `${ID_PREFIX}-Deployment`, {
      sources: [s3Deployment.Source.asset(path.join(__dirname, '..', '..', 'management-ui', 'dist'))],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
    });
  }
}
