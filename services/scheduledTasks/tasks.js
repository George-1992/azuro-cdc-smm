import { saGetItem, saGetItems } from "@/components/serverActions.jsx";

const IS_DEV = process.env.NODE_ENV === 'development';

export const contentTasks = async () => {
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

                // console.log(`Processing org id:`, org);
                const publications = await saGetItems({
                    collection: 'publications',
                    query: {
                        where: {
                            org_id: org.id,
                            status: { not: 'published' },   // status is NOT 'published'
                            // scheduled_at: { gte: utcIso },  // scheduled_at is now or later
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
                const pubs = publications.data || [];
                const timezone = org.timezone || 'UTC';
                console.log('timezone: ', timezone);
                console.log('publications: ', pubs?.length);
                console.log(' pubs[0]: ', pubs[0]);


                // const url = webhook;
                // const options = {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify({
                //         collection: collection,
                //         data: toSendData,
                //         context: orgData && orgData?.configs ? orgData?.configs : {}
                //     })
                // }

                // if (!IS_DEV) {
                //     const result = await fetch(url, options);
                // }


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


    } catch (error) {
        console.error('contentTasks ERROR: ', error);
    }
};