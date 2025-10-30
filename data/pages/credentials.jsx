'use client';
import Loading from "@/components/other/loading";
import { saCreateItem, saDeleteItem, saGetItems, saUpdateItem } from "@/components/serverActions.jsx";
import { notify } from "@/components/sonnar/sonnar";
import Table from "@/components/table";
import { useState, useEffect } from "react";
import {
    Copy, Check,
    Component,
    Key,
    KeyRoundIcon,
    StretchVerticalIcon,
    BoxesIcon
} from "lucide-react";
import { makeFirstLetterUppercase, toDisplayStr } from "@/utils/other";
import allTypes from "@/data/types";
import StatusItem from "@/components/other/statusItem";
import SourceTypeItem, { getTypeFromUrl } from "@/components/other/sourceTypeItem";
import Image from "next/image";

export default function Credentials({ pathname, user, account, session }) {

    const collectionName = 'credentials';
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
            item.account_id = account ? account.id : null;

            const response = await saCreateItem({
                collection: collectionName,
                data: item
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
                            account_id: account ? account.id : null // uncomment if using account-based filtering
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
                {toDisplayStr(collectionName)}
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
                        ['api_key']
                    ]}
                    columns={[
                        {
                            key: 'name',
                            title: 'Name',
                            width: 'w-48',
                            required: true,
                            validateKey: 'length',
                            Component: ({ value, row }) => {
                                const isBlotato = value.toLowerCase().includes('blotato');
                                const isElevenLabs = value.toLowerCase().includes('elevenlabs');


                                // console.log('value, row: ', value, row);
                                return <div className="flex items-center gap-1">
                                    <div className="border w-12 h-[32px] rounded-md border-gray-300 flex items-center justify-center">
                                        {(isBlotato || isElevenLabs)
                                            ? <Image
                                                src={isBlotato ? '/images/other/blotato-logo.webp' : '/images/other/elevenlabs-logo.png'}
                                                alt={isBlotato ? 'Blotato Logo' : 'ElevenLabs Logo'}
                                                width={40}
                                                height={40}
                                            />
                                            : <BoxesIcon className="size-6" />
                                        }
                                    </div>
                                    <span> {value}</span>
                                </div>
                            },
                            EditComponent: ({ value, row, onChange }) => {
                                // console.log('value, row, onChange: ', value, row, onChange);

                                const isBlotato = value.toLowerCase().includes('blotato');
                                const isElevenLabs = value.toLowerCase().includes('elevenlabs');

                                return (
                                    <div className="flex items-center gap-1">
                                        <div className="border w-12 h-[37px] rounded-md border-gray-300 flex items-center justify-center">
                                            {(isBlotato || isElevenLabs)
                                                ? <Image
                                                    src={isBlotato ? '/images/other/blotato-logo.webp' : '/images/other/elevenlabs-logo.png'}
                                                    alt={isBlotato ? 'Blotato Logo' : 'ElevenLabs Logo'}
                                                    width={40}
                                                    height={40}
                                                />
                                                : <BoxesIcon className="size-6" />
                                            }
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-control"
                                            value={value}
                                            onChange={onChange}
                                        />

                                    </div>
                                )
                            },
                        },
                        {
                            key: 'api_key',
                            title: 'API Key',
                            width: 'w-48',
                            required: true,
                            // hidden: false,
                            validateKey: 'length',
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