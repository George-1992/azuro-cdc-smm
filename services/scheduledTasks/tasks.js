import { saGetItem, saGetItems } from "@/components/serverActions.jsx";
import Prisma from "@/services/prisma";

const IS_DEV = process.env.NODE_ENV === 'development';
const CONTENT_CREATE_WINDOW = parseInt(process.env.CONTENT_CREATE_WINDOW || 24)  // in hours
const CONTENT_WINDOW_HOURS = process.env.CONTENT_WINDOW_HOURS ? parseInt(process.env.CONTENT_WINDOW_HOURS) : 48; // default to 48 hours

export const contentTasks = async () => {
    let resObj = {
        success: false,
        message: '',
        data: null
    }
    try {

        // `Date.now()` / `new Date().getTime()` already return milliseconds since
        // the Unix epoch in UTC. If you need other UTC formats, convert below.
        const utcNow = Date.now(); // milliseconds since epoch (UTC)
        const utcNowSeconds = Math.floor(utcNow / 1000); // seconds since epoch (UTC)
        const utcIso = new Date(utcNow).toISOString(); // ISO 8601 in UTC
        const utcString = new Date(utcNow).toUTCString(); // human-readable UTC

        console.log('============== CRON =================');
        console.log('contentTasks utcNow (ms):', utcNow);
        console.log('contentTasks utcNow (s):', utcNowSeconds);
        console.log('contentTasks utcIso:', utcIso);
        console.log('contentTasks utcString:', utcString);


        const accountData = await saGetItems({
            collection: 'accounts',
            // query: {
            //     where: { is_active: true }
            // },
            includeCount: true
        });

        if (!accountData.success) {
            console.error('contentTasks accountData fetch failed');
        }


        const processOrg = async ({
            account, org
        }) => {
            try {
                const requests = [];
                const timezone = org.timezone || 'UTC';
                const webhookUrl = org?.webhook || '';

                // CONTENT PROCESSING LOGIC HERE
                // where scheduled_at is undefined/null or scheduled_at is within next CONTENT_WINDOW_HOURS hours
                // console.log(`Processing org id:`, org);
                const s = Date.now() - (CONTENT_CREATE_WINDOW * 60 * 60 * 1000); // milliseconds
                const e = Date.now() + (CONTENT_WINDOW_HOURS * 60 * 60 * 1000); // milliseconds
                const startIso = new Date(s).toISOString();
                const endIso = new Date(e).toISOString();
                // console.log('s:', startIso);
                // console.log('e:', endIso);
                const publications = await saGetItems({
                    collection: 'publications',
                    query: {
                        where: {
                            org_id: org.id,
                            status: { notIn: ['published', 'creating'] },
                            OR: [
                                { scheduled_at: null },
                                { scheduled_at: { gte: startIso, lte: endIso } }
                            ]
                        },
                        include: {
                            medias: true,
                            avatar: true,
                            sources: true
                        }
                    }
                });

                if (!publications.success) {
                    console.error(`contentTasks publications fetch failed for org id: ${org.id}`);
                    return;
                }
                const contents = publications.data || [];
                // console.log('timezone: ', timezone);
                console.log('contents: ', contents?.length);

                const toCreateItems = [];
                contents.forEach((c, i) => {
                    if (['draft'].includes(c.status)) {
                        toCreateItems.push(c);
                    }
                });

                // console.log('toCreateItems: ', toCreateItems.length);
                // console.log('org: ', org);



                // send content creation reuqests
                const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        collection: 'contents',
                        data: toCreateItems,
                        org: org,
                    })
                }


                // console.log('webhookUrl: ', webhookUrl);
                // console.log('options: ', options);
                if (!IS_DEV) {
                    const result = await fetch(webhookUrl, options);
                    // if response is ok , update content status to 'creating'
                    if (!result.ok) {
                        console.error(`Content creation requests sent for org id: ${org.id}, items: ${toCreateItems.length} but response not ok`);
                        return;
                    }
                    // On successful webhook response, update statuses appropriately:
                    // - items that were 'draft' -> set to 'creating'
                    // - items that were 'created' -> set to 'publishing'
                    try {
                        const draftIds = toCreateItems.filter(i => ['draft', 'failed'].includes(i.status)).map(i => i.id);
                        const createdIds = toCreateItems.filter(i => i.status === 'created').map(i => i.id);

                        const updates = [];
                        if (draftIds.length > 0) {
                            updates.push(Prisma.contents.updateMany({
                                where: { id: { in: draftIds }, status: 'draft' },
                                data: { status: 'creating' }
                            }));
                        }
                        if (createdIds.length > 0) {
                            updates.push(Prisma.contents.updateMany({
                                where: { id: { in: createdIds }, status: 'created' },
                                data: { status: 'publishing' }
                            }));
                        }

                        if (updates.length > 0) {
                            const results = await Prisma.$transaction(updates);
                            // results is array of { count }
                            results.forEach((r, idx) => {
                                const ids = idx === 0 && draftIds.length > 0 ? draftIds : createdIds;
                                const from = idx === 0 && draftIds.length > 0 ? 'draft' : 'created';
                                const to = idx === 0 && draftIds.length > 0 ? 'creating' : 'publishing';
                                console.log(`Updated ${r.count} items from '${from}' to '${to}' for org id: ${org.id}`);
                            });
                        } else {
                            console.log('No items required status update for org id:', org.id);
                        }
                    } catch (err) {
                        console.error('Error updating content statuses:', err);
                    }
                };


            } catch (error) {
                console.error('contentTasks processOrg ERROR: ', error);
            }
        }


        const processAccount = async (account) => {
            try {
                const orgsRes = await saGetItems({
                    collection: 'organizations',
                    query: {
                        where: { account_id: account.id }
                    }
                });

                if (!orgsRes.success) {
                    console.error(`contentTasks orgs fetch failed for account id: ${account.id}`);
                    return;
                }
                const orgs = orgsRes.data || [];
                // console.log('orgs: ', orgs);
                if (orgs.length === 0) {
                    console.log(`No organizations found for account id: ${account.id}`);
                }

                for (const org of orgs) {
                    await processOrg({
                        account,
                        org
                    });
                }


            } catch (error) {
                console.error('contentTasks processAccount ERROR: ', error);
            }
        };



        for (const account of accountData.data) {
            await processAccount(account);
        }
        // console.log('contentTasks accountData:', accountData);

        resObj.success = true;
        resObj.message = 'contentTasks completed successfully';
        return resObj;

    } catch (error) {
        console.error('contentTasks ERROR: ', error);
        resObj.success = false;
        resObj.message = error.message || 'contentTasks failed';
        return resObj;
    }
};


export const campaignTasks = async () => {
    let resObj = {
        success: false,
        message: '',
        data: null
    };

    try {

        const accountData = await saGetItems({
            collection: 'accounts',
            // query: {
            //     where: { is_active: true }
            // },
            includeCount: true
        });

        // console.error('accountData:', accountData);

        if (!accountData.success) {
            console.error('campaignTasks accountData fetch failed');
            resObj.success = false;
            resObj.message = 'campaignTasks accountData fetch failed';
            return resObj;
        }




        for (const account of accountData.data) {
            try {

                const orgs = await saGetItems({
                    collection: 'organizations',
                    query: {
                        where: { account_id: account.id }
                    }
                });

                if (!orgs.success || !orgs.data || orgs.data.length === 0) {
                    console.error(`campaignTasks orgs fetch failed for account id: ${account.id} or no orgs found`);
                    continue;
                }

                for (const org of orgs.data) {
                    // CAMPAIGN AGENDA PROCESSING LOGIC HERE
                    const campaigns = await saGetItems({
                        collection: 'campaigns',
                        query: {
                            where: {
                                org_id: org.id,
                                status: 'active',
                            }
                        }
                    });

                    if (!campaigns.success || !campaigns.data || campaigns.data.length === 0) {
                        console.log(`No active campaigns found for org id: ${org.id}`);
                        continue;
                    }
                }


            } catch (error) {
                console.error('campaignTasks processAccount ERROR: ', error);
                resObj.success = false;
                resObj.message = error.message || 'campaignTasks processAccount failed';
                return resObj;
            }
        }



        resObj.success = true;
        resObj.message = 'campaignTasks completed successfully';
        return resObj;

    } catch (error) {
        console.error('campaignTasks ERROR: ', error);
        resObj.success = false;
        resObj.message = error.message || 'campaignTasks failed';
        return resObj;
    }
};