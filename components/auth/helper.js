'use server';

import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'tkn_';
const JWT_SECRET = process.env.JWT_SECRET
const EXPIREY_SECONDS = process.env.EXPIREY_SECONDS || 86400; // default 24 hours

export const getSession = async () => {

    try {

        // code here
        let session = null;
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

        // console.log('sessionCookie ==> ', sessionCookie);
        if (!cookieStore) {
            return null;
        }
        if (!sessionCookie) {
            return null;
        }
        if (!JWT_SECRET) {
            return null;
        }
        if (!jwt) {
            return null;
        }

        try {
            if (sessionCookie && sessionCookie.name && sessionCookie.value && sessionCookie.name === SESSION_COOKIE_NAME) {
                // Verify and decode the JWT
                const decoded = jwt.verify(sessionCookie.value, JWT_SECRET);
                session = { ...decoded };
                // console.log('decoded session ==> ', session);
            }
        } catch (error) {
            console.error('getSession inner error ==> ', error?.message || error);
        }

        // if session has expired destroy it
        if (!session) {
            // // await destroySession();
            // const cookieStore = await cookies();
            // cookieStore.set(SESSION_COOKIE_NAME, 'aaaa', {
            //     httpOnly: true,
            //     secure: process.env.NODE_ENV === 'production',
            //     sameSite: 'lax',
            //     maxAge: 0, // 0 means delete the cookie
            //     path: '/'
            // });
        } else {
            // // extend by 24 hours
            // const timestamp = Date.now() / 1000
            // const expiryDate = new Date(timestamp * 1000 + (24 * 60 * 60 * 1000));
            // cookieStore.set(SESSION_COOKIE_NAME, 'aaaa', {
            //     httpOnly: true,
            //     secure: process.env.NODE_ENV === 'production',
            //     sameSite: 'lax',
            //     expires: expiryDate,

            // });
        }

        return session;

    } catch (error) {
        console.error('getSession error ==> ', error);
        return null;
    }
}

export const extendSession = async (data) => {
    return await createSession(data);
}

export const createSession = async (data, exp = null) => {
    try {

        let payload = { ...data };
        const jwtExpiry = Math.floor(Date.now() / 1000) + (EXPIREY_SECONDS); // default 1 minute expiry
        payload.exp = jwtExpiry;


        // Sign the token
        const token = jwt.sign(payload, JWT_SECRET);

        // Set the cookie
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: EXPIREY_SECONDS, // 24 hours
            path: '/'
        });

        const resObj = { success: true, token };

        // console.log('createSession resObj ==> ', resObj);


        return resObj;

    } catch (error) {
        console.error('createSession error ==> ', error);
        return { success: false, message: 'Failed to create session' };
    }
}

export const verifySession = async (token) => {
    try {
        if (!token) {
            return null;
        }

        const d = jwt.verify(token, JWT_SECRET);
        return d;
    } catch (error) {
        console.error('verifySession error ==> ', error);
        return null;
    }
}

export const destroySession = async () => {
    try {
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0, // 0 means delete the cookie
            path: '/'
        });
        return { success: true };

    } catch (error) {
        console.error('destroySession error ==> ', error);
        return { success: false, message: 'Failed to destroy session' };
    }
}

export const refreshSession = async () => {
    try {
        const userData = await verifySession();
        if (!userData) {
            return { success: false, message: 'No valid session to refresh' };
        }

        // Create new session with same user data
        return await createSession(userData);

    } catch (error) {
        console.error('refreshSession error ==> ', error);
        return { success: false, message: 'Failed to refresh session' };
    }
}

export const getCookie = async (name) => {
    try {
        if (!name) return null;
        const cookieStore = await cookies();
        return cookieStore.get(name);
    } catch (error) {
        console.error('getCookie error ==> ', error);
        return null;
    }
}
