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

        const METHOD = req.method;
        const HEADERS = req.headers;

        const isApiKeyValid = await verifyApiKey(HEADERS);
        // console.log('isApiKeyValid: ', isApiKeyValid);

        if (!isApiKeyValid) {
            resObj.message = 'Invalid API Key';
            return NextResponse.json(resObj);
        }

        // console.log('METHOD: ', METHOD);
        // console.log('HEADERS: ', HEADERS);

        if (METHOD === 'GET') {
            return await handleApiGetRequest(req, res);
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
        }



        return NextResponse.json(resObj);
    } catch (error) {
        console.error(error);
        resObj.message = error.message || 'An error occurred';
        resObj.success = false;
        return NextResponse.json(resObj);
    }
}