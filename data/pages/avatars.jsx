'use client';
import Loading from "@/components/other/loading";
import { saCreateItem, saDeleteItem, saGetItem, saGetItems, saUpdateItem } from "@/components/serverActions.jsx";
import { notify } from "@/components/sonnar/sonnar";
import Table from "@/components/table";
import { useState, useEffect } from "react";
import allTypes, { avatarTones } from "@/data/types";
import StatusItem from "@/components/other/statusItem";
import SourceTypeItem, { getTypeFromUrl } from "@/components/other/sourceTypeItem";
import MediaLibrary, { InlineMediaLibrary, MediaUploader } from "@/components/mediaLibrary";
import Uploader from "@/components/mediaLibrary/filepond";
import { getFileTypeFromUrl } from "@/utils/other";
import { adjustRelationalData } from "@/utils/data";
import _, { cloneDeep } from "lodash";

export default function Avatars({ pathname, user, account, session, org }) {

    const orgId = org ? org.id : null;
    const collectionName = 'avatars';
    const [isLoading, setIsLoading] = useState(true);
    const [_data, _setData] = useState([]);
    const [_dataOriginal, _setDataOriginal] = useState([]);

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
            // console.log('handleNewItem item: ', item);
            // add account_id to item if you have account-based filtering
            // item.account_id = account ? account.id : null;

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

            console.log(`Response from adding new ${collectionName}: `, response);
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

            let toSaveData = cloneDeep(item);
            toSaveData.org_id = orgId;
            toSaveData = adjustRelationalData({
                collection: collectionName,
                data: toSaveData,
                originalData: _dataOriginal.find(d => d.id === item.id)
            });
            // console.log('handleNewItem toSaveData: ', toSaveData);
            // return resObj

            // console.log('handleUpdateItem item: ', item);
            // console.log('handleUpdateItem _dataOriginal: ', _dataOriginal.find(d => d.id === item.id));
            // console.log('handleUpdateItem toSaveData: ', toSaveData);
            // return resObj

            const response = await saUpdateItem({
                collection: collectionName,
                query: {
                    where: { id: item.id },
                    data: toSaveData,
                    include: { medias: true }
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

    const handlePageChange = (newPage) => {
        _setPage(newPage);
        fetchItems(newPage);
    }

    const fetchItems = async (thisPage = _page) => {
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
                    },
                    include: {
                        medias: true
                    },
                    skip: thisPage.skip,
                    take: thisPage.take,
                }
            });

            console.log(`Fetched ${collectionName}: `, response);

            if (response && response.success) {
                _setData(response.data || []);
                _setDataOriginal(cloneDeep(response.data) || []);
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

    // console.log('_data: ', _data);
    // console.log('Avatars org: ', org);


    return (
        <div className="container-main w-full flex flex-col gap-6">
            <h1 className="text-2xl flex items-center gap-2">
                Avatars
            </h1>


            <div className="w-full relative rounded-md overflow-x-auto">
                <Table
                    className="card-1 min-w-full"
                    editable={true}
                    editableInline={false}
                    allowAddNew={true}
                    page={_page}
                    onPageChange={handlePageChange}
                    actions={['edit', 'delete']}
                    tableExcludeKeys={[
                        'idea_inspiration', 'text',
                        'internal_note', 'config',
                        // 'medias'
                    ]}
                    previewKey="notes"
                    editRenderOrder={[
                        ['name'],
                        ['tone'],
                        ['notes'],
                        ['elvenlabs_voice_id'],
                        ['medias'],
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
                            key: 'tone',
                            title: 'Tone',
                            width: 'w-48',
                            required: true,
                            validateKey: 'length',
                            // type: 'select',
                            options: avatarTones,
                        },
                        {
                            key: 'elvenlabs_voice_id',
                            title: 'Elvenlabs Voice ID',
                            width: 'w-48',
                            required: true,
                            validateKey: 'length',
                        },
                        {
                            key: 'notes',
                            title: 'Notes',
                            type: 'textarea',
                            width: 'w-48',
                            required: false,
                            validateKey: 'length',
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
                                                types={['image']}
                                                onChange={(media) => {
                                                    // console.log('EditComponent imd: ', media);
                                                    if (props.onChange) {
                                                        const newMedias = props.row.medias || [];
                                                        if (!newMedias.find(m => m.id === media.id)) {
                                                            newMedias.push(media);
                                                        }
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