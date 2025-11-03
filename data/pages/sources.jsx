'use client';
import Loading from "@/components/other/loading";
import { saCreateItem, saDeleteItem, saGetItems, saUpdateItem } from "@/components/serverActions.jsx";
import { notify } from "@/components/sonnar/sonnar";
import Table from "@/components/table";
import { useState, useEffect } from "react";
import allTypes from "@/data/types";
import StatusItem from "@/components/other/statusItem";
import SourceTypeItem, { getTypeFromUrl } from "@/components/other/sourceTypeItem";

export default function Sources({ pathname, user, account, session, org }) {



    const collectionName = 'sources';
    const [isLoading, setIsLoading] = useState(true);
    const [_data, _setData] = useState([]);

    const handleNewItem = async (item) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {
            // add account_id to item if you have account-based filtering
            // item.account_id = account ? account.id : null;
            item.org_id = org ? org.id : null;

            const response = await saCreateItem({
                collection: collectionName,
                data: item
            });

            // console.log(`Response from adding new ${collectionName}: `, response);
            if (response && response.success) {
                _setData(prev => [...prev, response.data]);
                // notify({ type: 'success', message: 'Sources created successfully' });
                resObj.success = true;
                resObj.data = response.data;
                resObj.message = 'Done';
            } else {
                resObj.success = false;
                resObj.message = response.message || 'Failed to create sources';
                notify({ type: 'error', message: response.message || 'Failed to create sources' });
            }

            return resObj;
        } catch (error) {
            console.error('Error adding new sources: ', error);
            notify({ type: 'error', message: 'Failed to create sources' });
            resObj.success = false;
            resObj.message = error.message || 'Failed to create sources';
            return resObj;
        }
    };

    const handleUpdateItem = async (item) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {

            const response = await saUpdateItem({
                collection: collectionName,
                query: {
                    where: { id: item.id },
                    data: item
                }
            });

            console.log(`Response from updating ${collectionName}: `, response);

            if (response && response.success) {
                _setData(prev => prev.map(i => i.id === item.id ? response.data : i));
                notify({ type: 'success', message: `${collectionName} updated successfully` });
                resObj.success = true;
                resObj.data = response.data;
                resObj.message = 'Done';
            } else {
                notify({ type: 'error', message: response.message || `Failed to update ${collectionName}` });
                resObj.message = response.message || `Failed to update ${collectionName}`;
                resObj.success = false;
            }

            return resObj;

        } catch (error) {
            console.error('Error updating sources: ', error);
            notify({ type: 'error', message: 'Failed to update sources' });
            resObj.message = error.message || 'Failed to update sources';
            resObj.data = item;
            resObj.success = false;
            return resObj;
        }
    };

    const handleDeleteItem = async (item) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {
            const response = await saDeleteItem({
                collection: collectionName,
                query: {
                    where: { id: item.id }
                }
            });

            if (response && response.success) {
                _setData(prev => prev.filter(i => i.id !== item.id));
                // notify({ type: 'success', message: 'Sources deleted successfully' });
                resObj.success = true;
                resObj.message = 'Done';
            } else {
                notify({ type: 'error', message: response.message || 'Failed to delete sources' });
                resObj.message = response.message || 'Failed to delete sources';
                resObj.success = false;
            }

            return resObj;
        } catch (error) {
            console.error(`Error deleting ${collectionName}: `, error);
            notify({ type: 'error', message: `Failed to delete ${collectionName}` });
            resObj.message = error.message || `Failed to delete ${collectionName}`;
            resObj.data = item;
            resObj.success = false;
            return resObj;
        }
    };

    // initial load, fetch data
    useEffect(() => {
        const body = async () => {
            try {
                setIsLoading(true);
                const response = await saGetItems({
                    collection: collectionName,
                    query: {
                        where: {
                            // account_id: account ? account.id : null,
                            org_id: org ? org.id : null
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    }
                });

                console.log(`Fetched ${collectionName}: `, response);

                if (response && response.success) {
                    _setData(response.data || []);
                } else {
                    notify({ type: 'error', message: response.message || `Failed to fetch ${collectionName}` });
                }

            } catch (error) {
                console.error(`Error fetching ${collectionName}: `, error);
            } finally {
                setIsLoading(false);
            }
        };
        body();
    }, []);


    // console.log('_data: ',_data);

    return (
        <div className="container-main w-full flex flex-col gap-6">
            <h1 className="text-2xl flex items-center gap-2">
                Sources
            </h1>


            <div className="w-full relative rounded-md overflow-x-auto">
                <Table
                    className="card-1 min-w-full"
                    editable={true}
                    editableInline={true}
                    allowAddNew={true}
                    actions={['edit', 'delete']}
                    tableExcludeKeys={['idea_inspiration', 'text', 'internal_note', 'config']}
                    previewKey="notes"
                    editRenderOrder={[
                        ['name'],
                        ['status', 'type'],
                        ['url'],
                        ['fixed_idea'],
                        ['idea_inspiration'],
                        ['text'],
                        ['text_output'],
                    ]}
                    columns={[
                        {
                            key: 'name',
                            title: 'Name',
                            width: 'w-48',
                            required: true,
                            validateKey: 'length',
                        },
                        {
                            key: 'status',
                            type: 'select',
                            title: 'Status',
                            width: 'w-48',
                            required: true,
                            disabled: true,
                            defaultValue: allTypes[collectionName].options[0],
                            options: allTypes[collectionName].options,
                            Component: (props) => {
                                // console.log('props: ', props);
                                const { value } = props;
                                return <StatusItem
                                    status={value}
                                />
                            },
                        },
                        {
                            key: 'type',
                            title: 'Type',
                            width: 'w-48',
                            required: true,
                            disabled: true,
                            defaultValue: 'n/a',
                            func: (data) => {
                                return getTypeFromUrl(data.url);
                            },
                            Component: (props) => {
                                // console.log('type props: ', props);
                                return <SourceTypeItem
                                    type={props.value}
                                    data={props.row}
                                />
                            },
                        },
                        {
                            key: 'url',
                            title: 'URL',
                            width: 'w-48',
                            required: false,
                            validateKey: 'url',
                        },
                        {
                            key: 'fixed_idea',
                            type: 'textarea',
                            title: 'Fixed Idea',
                            width: 'w-48',
                            required: false,
                            validateKey: 'length',
                        },
                        {
                            key: 'idea_inspiration',
                            type: 'textarea',
                            title: 'Idea Inspiration',
                            width: 'w-48',
                            required: false,
                            validateKey: 'length',
                        },
                        {
                            key: 'text',
                            type: 'textarea',
                            title: 'Text (Raw Input/source)',
                            width: 'w-48',
                            required: false,
                            disabled: false,
                            // validateKey: 'length',
                        },
                        {
                            key: 'text_output',
                            type: 'textarea',
                            title: 'Text (Output)',
                            width: 'w-48',
                            required: false,
                            disabled: true,
                            // validateKey: 'length',
                        },
                    ]}
                    data={_data}
                    onAddNew={handleNewItem}
                    onRowChange={handleUpdateItem}
                    onRowDelete={handleDeleteItem}
                    onChange={(newData) => {
                        console.log('Sources data changed: ', newData);
                    }}
                />

                <Loading loading={isLoading} />
            </div>
        </div>
    );
}