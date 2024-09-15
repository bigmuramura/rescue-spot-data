import boto3
import os
import json

ssm = boto3.client('ssm')
s3 = boto3.client('s3')

def handler(event, context):
    print("Received event: " + json.dumps(event, indent=2))

    instance_id = event['detail']['instance-id']
    bucket_name = os.environ['BUCKET_NAME']

    # SSM Run Command を使用してデータをバックアップ
    response = ssm.send_command(
        InstanceIds=[instance_id],
        DocumentName='AWS-RunShellScript',
        Parameters={
            'commands': [
                f'aws s3 sync /scratch s3://{bucket_name}/{instance_id}/'
            ]
        }
    )

    command_id = response['Command']['CommandId']
    print(f"Backup command sent. Command ID: {command_id}")

    return {
        'statusCode': 200,
        'body': json.dumps('Spot instance interruption handled successfully!')
    }