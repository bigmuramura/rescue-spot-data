import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class RescueSpotDataStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 バケット作成
    const backupBucket = new s3.Bucket(this, 'RescueSpotDataBucket', {
      bucketName: 'rescue-spot-data-bucket',
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1), // 未完了のマルチパートアップロードを1日後に削除
          expiredObjectDeleteMarker: true, // 期限切れの削除マーカーを削除
          noncurrentVersionExpiration: cdk.Duration.days(7), // 非現行バージョンを7日後に削除
        },
      ],
    });

    // Lambda 関数作成
    const rescueSpotDataHandler = new lambda.Function(this, 'RescueSpotDataHandler', {
      runtime: lambda.Runtime.PYTHON_3_12,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.minutes(5),
      environment: {
        BUCKET_NAME: backupBucket.bucketName,
      },
    });

    // Lambda に権限を付与
    rescueSpotDataHandler.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:SendCommand'],
      resources: ['*'],
    }));

    backupBucket.grantReadWrite(rescueSpotDataHandler);

    // EventBridge ルール作成
    const rule = new events.Rule(this, 'RescueSpotDataRule', {
      eventPattern: {
        source: ['aws.ec2'],
        detailType: ['EC2 Spot Instance Interruption Warning'],
      },
    });

    // EventBridge ルールのターゲットとして Lambda を設定
    rule.addTarget(new targets.LambdaFunction(rescueSpotDataHandler));
  }
}