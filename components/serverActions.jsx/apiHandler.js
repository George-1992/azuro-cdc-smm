'use server';

import Prisma from "@/services/prisma";

const { NextResponse } = require("next/server");

export const handleApiRequest = async (req, res) => {
    let resObj = {
        success: false,
        warning: false,
        message: '',
        data: null,
    }
    try {
        // console.log('handleApiRequest>>>>>>>>>>>>');

        const METHOD = req.method;
        const HEADERS = req.headers;
        const pathname = req.nextUrl.pathname;
        let isFile = false;



        const isApiKeyValid = await verifyApiKey(HEADERS);
        // console.log('isApiKeyValid: ', isApiKeyValid);
        // console.log('pathname: ', pathname);

        if (!isApiKeyValid) {
            resObj.message = 'Invalid API Key';
            return NextResponse.json(resObj);
        }
        // check if its a file upload
        if (isFileRequest(req)) {
            isFile = true;
        }


        // console.log('METHOD: ', METHOD);
        // console.log('HEADERS: ', HEADERS);

        if (METHOD === 'GET') {
            return await handleApiGetRequest(req, res);
        } else if (METHOD === 'POST') {
            // handle POST requests
            if (isFile) {
                // handle file upload
                console.log('isFile: ', isFile);

            }
        }





        // code here
        return NextResponse.json(resObj);
    } catch (error) {
        console.error(error);
        resObj.message = error.message || 'An error occurred';
        resObj.warning = true;
    }
}

export const verifyApiKey = async (HEADERS) => {
    try {
        return true; // Temporarily disable API key verification
        if (!HEADERS) {
            console.error('No headers provided');
            return false;
        }
        const apiKey = await HEADERS.get('x-api-key');

        // console.log('apiKey: ', apiKey);
        if (!apiKey || apiKey !== process.env.API_KEY) {
            console.error('Invalid API Key');
            return false;
        }

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}


export const handleApiGetRequest = async (req, res) => {
    let resObj = {
        success: false,
        warning: false,
        message: '',
        data: null,
    }
    try {

        const HEADERS = req.headers;
        const queryParams = req.nextUrl.searchParams;
        const orgId = queryParams.get('org_id');
        if (!orgId) {
            resObj.message = 'Organization ID is required';
            return NextResponse.json(resObj);
        }
        const collection = queryParams.get('collection');
        if (!collection) {
            resObj.message = 'Collection is required';
            return NextResponse.json(resObj);
        }

        // console.log('HEADERS: ', HEADERS);
        // console.log('queryParams: ', queryParams);
        // console.log('collection: ', collection);

        if (collection === 'settings') {
            resObj.data = await Prisma.organizations.findUnique({
                where: { id: orgId },
                include: {
                    account: true
                }
            });
            resObj.success = true;
        } else if (collection === 'publications') {
            const status = queryParams.get('status');
            let d = {
                where: { org_id: orgId },
            };
            if (status) {
                d.where.status = status;
            }
            resObj.data = await Prisma.publications.findMany(d);
            resObj.success = true;
        } else if (collection === 'sources') {
            resObj.data = await Prisma.sources.findMany({
                where: { org_id: orgId },
            });
            resObj.success = true;
        }



        return NextResponse.json(resObj);
    } catch (error) {
        console.error(error);
        resObj.message = error.message || 'An error occurred';
        resObj.success = false;
        return NextResponse.json(resObj);
    }
}

export const handleApiPostRequest = async (req, res) => {
    let resObj = {
        success: false,
        warning: false,
        message: '',
        data: null,
    }
    try {
        const body = await req.json();
        const collection = body.collection;
        const reqData = body.data;
        if (!collection === 'sources') {
            resObj.message = 'Collection is required for POST requests';
            return NextResponse.json(resObj);
        }
        if (!reqData) {
            resObj.message = 'Data is required for POST requests';
            return NextResponse.json(resObj);
        }

        if (collection === 'sources') {
            // update source
            for (const sData of reqData) {
                if (sData.id) {
                    // update existing
                    await Prisma.sources.update({
                        where: { id: sData.id },
                        data: sData,
                    });
                }
            }
        }
        resObj.success = true;
        resObj.message = 'Data updated successfully';
        return NextResponse.json(resObj);

    } catch (error) {
        console.error(error);
        resObj.message = error.message || 'An error occurred';
        resObj.success = false;
        return NextResponse.json(resObj);
    }
}


const isFileRequest = (req) => {
    try {
        // check if the request has form or multipart data
        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
            return true;
        }
        return false;
    } catch (error) {
        console.error('isFileRequest error: ', error);
        return false;
    }
}