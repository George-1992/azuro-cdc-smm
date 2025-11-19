'use client';
import Loading from "@/components/other/loading";
import { saCreateItem, saDeleteItem, saGetItems, saUpdateItem } from "@/components/serverActions.jsx";
import { notify } from "@/components/sonnar/sonnar";
import Table from "@/components/table";
import { useState, useEffect } from "react";
import allTypes, { sourceTypes } from "@/data/types";
import StatusItem from "@/components/other/statusItem";
import SourceTypeItem, { getTypeFromUrl } from "@/components/other/sourceTypeItem";
import Uploader from "@/components/mediaLibrary/filepond";
import MediaLibrary, { InlineMediaLibrary } from "@/components/mediaLibrary";

export default function Sources({ pathname, user, account, session, org }) {


    const orgId = org ? org.id : null;
    const collectionName = 'sources';
    const [isLoading, setIsLoading] = useState(true);
    const [_data, _setData] = useState([]);
    const [isNewItem, setIsNewItem] = useState(false);
    const [_page, _setPage] = useState({
        skip: 0,
        take: 10,
        itemsPerPage: 10,
        total: 0
    });

    const handleNewItem = async (item) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {
            // add account_id to item if you have account-based filtering
            let toSaveData = cloneDeep(item);
            const od = cloneDeep(item)
            toSaveData.org_id = orgId;
            toSaveData = adjustRelationalData({
                data: toSaveData,
                collection: collectionName,
                originalData: {}
            });

            const response = await saCreateItem({
                collection: collectionName,
                data: toSaveData
            });

            // console.log(`Response from adding new ${collectionName}: `, response);
            if (response && response.success) {
                let newData = [..._data];
                let newDataItem = response.data;
                if (item.medias && item.medias.length > 0) {
                    newDataItem.medias = item.medias;
                }
                newData.unshift(newDataItem);
                _setData(newData);
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
                notify({ type: 'success', message: 'Sources deleted successfully' });
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
    const handlePageChange = (newPage) => {
        _setPage(newPage);
        fetchItems(newPage);
    }

    const fetchItems = async (thisPage = _page) => {
        try {
            setIsLoading(true);
            const response = await saGetItems({
                collection: collectionName,
                includeCount: true,
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
                if (!_page.total) {
                    _setPage(prev => ({
                        ...prev,
                        total: response.count || response.data.length || 0
                    }));
                }
            } else {
                notify({ type: 'error', message: response.message || `Failed to fetch ${collectionName}` });
            }

        } catch (error) {
            console.error(`Error fetching ${collectionName}: `, error);
        } finally {
            setIsLoading(false);
        }
    };

    // initial load, fetch data
    useEffect(() => {
        fetchItems();
    }, []);


    // console.log('_data: ',_data);
    // console.log('isNewItem: ', isNewItem);

    return (
        <div className="container-main w-full flex flex-col gap-6">
            <h1 className="text-2xl flex items-center gap-2">
                Sources
            </h1>


            <div className="w-full relative rounded-md overflow-x-auto">
                <Table
                    className="card-1 min-w-full"
                    editable={true}
                    editableInline={false}
                    allowAddNew={true}
                    data={_data}
                    onAddNew={handleNewItem}
                    onRowChange={handleUpdateItem}
                    onRowDelete={handleDeleteItem}
                    newItemChange={(item) => {
                        setIsNewItem(item ? true : false);
                    }}
                    page={_page}
                    onPageChange={handlePageChange}
                    onChange={(newData) => {
                        console.log('Sources data changed: ', newData);
                    }}
                    actions={[
                        {
                            name: 'edit',
                        },
                        {
                            name: 'delete',
                            confirm: {
                                title: 'Confirm Deletion',
                                message: 'Are you sure you want to delete this publication?',
                                button1: 'Cancel',
                                button2: 'Delete',
                            },
                            func: handleDeleteItem
                        }
                    ]}
                    tableExcludeKeys={[
                        'idea_inspiration', 'raw_text',
                        'internal_note', 'config', 'medias'
                    ]}
                    previewKey="notes"
                    editRenderOrder={[
                        ['name'],
                        ['type', 'status'],
                        ['url'],
                        // ['fixed_idea'],
                        // ['idea_inspiration'],
                        ['raw_text'],
                        ['text_output'],
                        ['medias'],
                    ]}
                    columns={[
                        {
                            key: 'name',
                            title: 'Name',
                            width: 'w-48',
                            required: false,
                            validateKey: 'length',
                            defaultValue: 'Untitled Source',
                        },
                        {
                            key: 'type',
                            title: 'Type',
                            width: 'w-48',
                            type: 'select',
                            required: true,
                            disabled: !isNewItem,
                            defaultValue: 'n/a',
                            options: sourceTypes,
                            // func: (data) => {
                            //     return getTypeFromUrl(data.url);
                            // },
                            // Component: (props) => {
                            //     // console.log('type props: ', props);
                            //     return <SourceTypeItem
                            //         type={props.value}
                            //         data={props.row}
                            //     />
                            // },
                        },
                        {
                            key: 'status',
                            type: 'select',
                            title: 'Status',
                            width: 'w-48',
                            required: false,
                            disabled: !isNewItem,
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
                            key: 'url',
                            title: 'URL',
                            width: 'w-48',
                            required: false,
                            disabled: !isNewItem,
                            validateKey: 'url',
                        },
                        // {
                        //     key: 'fixed_idea',
                        //     type: 'textarea',
                        //     title: 'Fixed Idea',
                        //     width: 'w-48',
                        //     required: false,
                        //     validateKey: 'length',
                        // },
                        // {
                        //     key: 'idea_inspiration',
                        //     type: 'textarea',
                        //     title: 'Idea Inspiration',
                        //     width: 'w-48',
                        //     required: false,
                        //     validateKey: 'length',
                        // },
                        {
                            key: 'raw_text',
                            type: 'textarea',
                            title: 'Text (Raw Input/source)',
                            width: 'w-48',
                            required: false,
                            disabled: !isNewItem,
                            // validateKey: 'length',
                        },
                        {
                            key: 'text_output',
                            type: 'textarea',
                            title: 'Text (Output)',
                            width: 'w-48',
                            required: false,
                            disabled: !isNewItem,
                            // validateKey: 'length',
                        },
                        {
                            key: 'medias',
                            title: 'Medias',
                            width: 'w-96',
                            required: false,
                            multiple: true,
                            Component: (props) => {
                                return (
                                    <div>{props?.value?.length || 0}</div>
                                    // <MediaLibrary medias={props.row.medias} size='sm' />
                                )
                            },
                            EditComponent: (props) => {
                                const row = props.row || {};
                                // console.log('EditComponent: ', props);

                                return (
                                    <div className="w-full">
                                        <div className="flex flex-col gap-3">
                                            <InlineMediaLibrary
                                                org={org}
                                                types={['pdf']}
                                                onChange={(media) => {
                                                    // console.log('EditComponent imd: ', media);
                                                    if (props.onChange) {
                                                        const newMedias = props.row.medias || [];
                                                        if (!newMedias.find(m => m.id === media.id)) {
                                                            newMedias.push(media);
                                                        }

                                                        // console.log('newMedias: ', newMedias);

                                                        props.onChange({
                                                            target: {
                                                                name: 'medias',
                                                                value: newMedias
                                                            }
                                                        });
                                                    }
                                                }}
                                            />

                                            <div>
                                                <MediaLibrary
                                                    org={org}
                                                    size='md'
                                                    allowUpload={false}
                                                    allowEdit={false}
                                                    standAloneMode={true}
                                                    medias={row.medias}
                                                    onChange={(updatedMedias) => {
                                                        // console.log('MediaLibrary updatedMedias: ', updatedMedias);
                                                        if (props.onChange) {
                                                            props.onChange({
                                                                target: {
                                                                    name: 'medias',
                                                                    value: updatedMedias
                                                                }
                                                            });
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        },
                    ]}

                />

                <Loading loading={isLoading} />
            </div>


        </div>
    );
}