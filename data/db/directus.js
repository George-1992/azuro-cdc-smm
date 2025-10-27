require('dotenv').config();

const { DIRECTUS_URL, DIRECTUS_API_TOKEN } = process.env;


const baseFieldMeta = {
    interface: 'input',
    primary_key: false,
    hidden: false,
    readonly: false
};

const uuidObj = {
    field: 'id',
    type: 'uuid',
    meta: {
        interface: 'input',
        hidden: true,
        readonly: true,
        special: [
            "uuid"
        ],
    },
    schema: {
        is_primary_key: true,
        has_auto_increment: false,
        is_nullable: false
    }
}

// Many-to-One relation field (foreign key)
const getManyToOneField = (fieldName, relatedCollection, displayTemplate = null) => {
    return {
        field: fieldName,
        type: 'uuid',
        meta: {
            interface: 'select-dropdown-m2o',
            special: ['m2o'],
            options: {
                template: displayTemplate || '{{name}}'
            }
        },
        schema: {
            foreign_key_table: relatedCollection,
            foreign_key_column: 'id'
        }
    }
};

// One-to-Many relation field (virtual field)
const getOneToManyField = (fieldName, relatedCollection, relatedField) => {
    return {
        field: fieldName,
        type: 'alias',
        meta: {
            interface: 'list-o2m',
            special: ['o2m'],
            options: {
                template: '{{name}}'
            }
        }
    }
};

// Many-to-Many relation field (virtual field)
const getManyToManyField = (fieldName, junctionCollection, junctionField) => {
    return {
        field: fieldName,
        type: 'alias',
        meta: {
            interface: 'list-m2m',
            special: ['m2m']
        }
    }
};


const dataModels = [
    {
        collection: 'users',
        meta: { icon: 'person', note: 'Users collection', hidden: false, singleton: false },
        schema: { name: 'users' },
        fields: [
            { ...uuidObj },
            { field: 'name', type: 'string', meta: { interface: 'input', required: true } },
            { field: 'last_name', type: 'string', meta: { interface: 'input', required: true } },
            { field: 'email', type: 'string', meta: { interface: 'input', required: true } },
            { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Active', value: 'active' }, { text: 'Inactive', value: 'inactive' }] } } },
            { field: 'created_at', type: 'timestamp', meta: { interface: 'datetime', special: ['date-created'], readonly: true } },
            { field: 'updated_at', type: 'timestamp', meta: { interface: 'datetime', special: ['date-updated'], readonly: true } },
        ]
    },
    {
        collection: 'account',
        meta: { icon: 'business', note: 'Account collection', hidden: false, singleton: false },
        schema: { name: 'account' },
        fields: [
            { ...uuidObj },
            { field: 'name', type: 'string', meta: { interface: 'input', required: true } },
            { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Active', value: 'active' }, { text: 'Inactive', value: 'inactive' }] } } },
            // Many-to-Many relation to users via junction table
            getManyToManyField('users', 'account_users', 'user_id'),
            { field: 'created_at', type: 'timestamp', meta: { interface: 'datetime', special: ['date-created'], readonly: true } },
            { field: 'updated_at', type: 'timestamp', meta: { interface: 'datetime', special: ['date-updated'], readonly: true } },
        ]
    },
    {
        collection: 'account_users',
        meta: { icon: 'link', note: 'Junction table for Account-Users M2M relation', hidden: true, singleton: false },
        schema: { name: 'account_users' },
        fields: [
            { ...uuidObj },
            // Foreign key fields (not relation fields initially)
            {
                field: 'account_id',
                type: 'uuid',
                meta: {
                    interface: 'input',
                    hidden: true,
                    required: true
                },
                schema: {
                    is_nullable: false
                }
            },
            {
                field: 'user_id',
                type: 'uuid',
                meta: {
                    interface: 'input',
                    hidden: true,
                    required: true
                },
                schema: {
                    is_nullable: false
                }
            },
            { field: 'created_at', type: 'timestamp', meta: { interface: 'datetime', special: ['date-created'], readonly: true } },
        ]
    }
];



const directusRequest = async ({
    method = 'GET',
    path = '',
    payload = null
}) => {
    let resObj = {
        success: false,
        warning: false,
        message: '',
        data: null,
    }

    if (!DIRECTUS_URL || !DIRECTUS_API_TOKEN) {
        resObj.message = 'DIRECTUS_URL or DIRECTUS_API_TOKEN is not set in environment variables';
        return resObj;
    }

    if (!path || typeof path !== 'string') {
        resObj.message = 'Path is required and must be a string';
        return resObj;
    }

    if (!payload) {
        resObj.message = 'Payload is required';
        return resObj;
    }


    try {
        const url = `${DIRECTUS_URL}${path}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DIRECTUS_API_TOKEN}`
            },
            body: JSON.stringify(payload)
        };
        const response = await fetch(url, options);
        const json = await response.json();

        // console.log('json ==> ', json.errors);

        if (json.errors) {
            let msg = '';
            if (Array.isArray(json.errors)) {

                json.errors.forEach(err => {
                    msg += err.message;
                    if (err.extensions) {
                        msg += ` (${JSON.stringify(err.extensions)})`;
                    }
                });
            } else if (typeof json.errors === 'object' && json.errors.message) {
                msg = json.errors.message;
            } else {
                msg = 'An error occurred';
            }

            resObj.message = msg;
            return resObj;
        }

        resObj.success = response.ok;
        resObj.message = json.message || '';
        resObj.data = json.data || null;
        return resObj;

    } catch (error) {
        console.error(error);
        resObj.message = error.message || 'An error occurred';
        return resObj;
    }
}



const test = async () => {
    try {



        // Step 1: Create collections first (without virtual relation fields)
        for (const model of dataModels) {
            const collectionPayload = {
                collection: model.collection,
                meta: model.meta,
                schema: model.schema,
                fields: model.fields.filter(field =>
                    // Only exclude virtual M2M fields, keep actual foreign key fields
                    !(field.type === 'alias' && field.meta?.special?.includes('m2m'))
                )
            };

            const dresponse = await directusRequest({
                method: 'POST',
                path: '/collections',
                payload: collectionPayload
            });
            console.log(`Create collection '${model.collection}' response ==> `, dresponse.success ? 'SUCCESS' : dresponse.message);
        }
        console.log('\n--- Creating Relations ---\n');

        // Step 2: Create relations after all collections exist
        const relations = [
            // M2M relation: account <-> users via account_users
            {
                collection: 'account_users', // Junction collection
                field: 'account_id', // Field in junction
                related_collection: 'account', // Target collection
                meta: {
                    one_field: 'users', // Field name in account collection
                    sort_field: null,
                    one_allowed_collections: null,
                    one_collection_field: null,
                    one_deselect_action: 'nullify'
                },
                schema: {
                    on_delete: 'SET NULL'
                }
            },
            {
                collection: 'account_users', // Junction collection  
                field: 'user_id', // Field in junction
                related_collection: 'users', // Target collection
                meta: {
                    one_field: null, // No reverse field needed
                    sort_field: null,
                    one_allowed_collections: null,
                    one_collection_field: null,
                    one_deselect_action: 'nullify'
                },
                schema: {
                    on_delete: 'SET NULL'
                }
            }
        ];

        for (const relation of relations) {
            const relationResponse = await directusRequest({
                method: 'POST',
                path: '/relations',
                payload: relation
            });
            console.log(`Create relation '${relation.collection}.${relation.field}' ==> `, relationResponse.success ? 'SUCCESS' : relationResponse.message);
        }

        console.log('\n--- Creating Virtual M2M Field ---\n');

        // Step 3: Create the virtual M2M field in account collection
        const m2mField = {
            collection: 'account',
            field: 'users',
            type: 'alias',
            meta: {
                interface: 'list-m2m',
                special: ['m2m'],
                options: {
                    template: '{{name}} {{last_name}}'
                }
            }
        };

        const m2mResponse = await directusRequest({
            method: 'POST',
            path: '/fields/account',
            payload: m2mField
        });
        console.log(`Create M2M field 'account.users' ==> `, m2mResponse.success ? 'SUCCESS' : m2mResponse.message);

    } catch (error) {
        console.log(error);
    }
};
test();


// https://dtus.stepanyan.me/collections?filter[collection][_contains]=tttt
// https://dtus.stepanyan.me/items/test?filter[collection][_nstarts_with]=directus_