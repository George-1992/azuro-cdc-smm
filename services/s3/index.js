'use server';

import {
    S3Client, PutObjectCommand, PutObjectCommandInput,
    ListBucketsCommand, ListObjectsV2Command,
    ListObjectsCommand, GetObjectCommand, DeleteObjectsCommand,
    UploadPartCommand,
    CreateMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    HeadBucketCommand,
    ListMultipartUploadsCommand,
    AbortMultipartUploadCommand
} from '@aws-sdk/client-s3';

const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_ACCOUNT_ID = process.env.S3_ACCOUNT_ID;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

const S3 = new S3Client({
    region: 'auto',
    endpoint: `https://${S3_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
});

export const uploadS3 = async ({ form, options = {} }) => {
    let resObj = {
        success: false,
        message: '',
        data: null,
    }
    try {
        if (!form) {
            resObj.message = 'No form data provided';
            return resObj;
        }
        const file = form.get('file');

        if (!file) {
            resObj.message = 'No file provided in form data';
            return resObj;
        }
        const buffer = await file.arrayBuffer();

        // upload file to S3
        const params = {
            Bucket: S3_BUCKET_NAME,
            Key: options.key || file.name,
            Body: buffer,
            ContentType: file.type,
            // ACL: 'public-read', // Set the ACL if needed
        };

        const command = new PutObjectCommand(params);
        const response = await S3.send(command);
        // const json = await response.json();
        // console.log('response: ', response);


        resObj.success = true;
        resObj.message = 'File uploaded successfully';
        resObj.data = response;
        return resObj;

    } catch (error) {
        console.error('uploadS3 error: ', error);
        resObj.message = error.message || 'Error uploading file to S3';
        return resObj;
    }
};

export const deleteS3Objects = async (keys = []) => {
    let resObj = {
        success: false,
        message: '',
        data: null,
    }
    try {
        if (!keys || keys.length === 0) {
            resObj.message = 'No keys provided for deletion';
            return resObj;
        }

        const params = {
            Bucket: S3_BUCKET_NAME,
            Delete: {
                Objects: keys.map(key => ({ Key: key })),
                Quiet: false,
            },
        };
        console.log('params: ', params);


        const command = new DeleteObjectsCommand(params);
        const response = await S3.send(command);

        resObj.success = true;
        resObj.message = 'Objects deleted successfully';
        resObj.data = response;
        return resObj;

    } catch (error) {
        console.error('deleteS3Objects error: ', error);
        resObj.message = error.message || 'Error deleting objects from S3';
        return resObj;
    }
};

