#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RescueSpotDataStack } from '../lib/rescue-spot-data-stack';

const app = new cdk.App();
new RescueSpotDataStack(app, 'RescueSpotDataStack', {
});

cdk.Tags.of(app).add('Project', 'ResucueSpotData');