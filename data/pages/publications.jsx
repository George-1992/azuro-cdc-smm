'use client';
import Loading from "@/components/other/loading";
import { saCreateItem, saDeleteItem, saGetItems, saUpdateItem } from "@/components/serverActions.jsx";
import { notify } from "@/components/sonnar/sonnar";
import Table from "@/components/table";
import { useState, useEffect } from "react";
import { toDisplayStr } from "@/utils/other";
import { Calendar, CheckCircle, Clock, Edit3, FileText, Pause, Play, XCircle, BookOpen } from "lucide-react";
import DateDisplay from "@/components/date/DateDisplay";
import Image from "next/image";

// Status Component with Icons
const StatusItem = ({ value, row, rowIndex, column }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'planned':
                return <Edit3 className="w-4 h-4 text-gray-500" />;
            case 'scheduled':
                return <Clock className="w-4 h-4 text-blue-500" />;
            case 'published':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'draft':
                return <FileText className="w-4 h-4 text-yellow-500" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <FileText className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'planned':
                return 'text-gray-600 bg-gray-100';
            case 'scheduled':
                return 'text-blue-600 bg-blue-100';
            case 'published':
                return 'text-green-600 bg-green-100';
            case 'draft':
                return 'text-yellow-600 bg-yellow-100';
            case 'cancelled':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${getStatusColor(value)}`}>
            {getStatusIcon(value)}
            <span className="capitalize text-xs font-medium">{value}</span>
        </div>
    );
};

export default function Publications({ pathname, user, account, session, org }) {

    const collectionName = 'publications';
    const [isLoading, setIsLoading] = useState(false);
    const [_data, _setData] = useState([]);

    // Define options for the dropdowns
    const statusOptions = [
        { value: 'planned', label: 'Planned' },
        { value: 'draft', label: 'Draft' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'published', label: 'Published' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const handleNewItem = async (item) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {
            item.org_id = org ? org.id : null;

            const response = await saCreateItem({
                collection: collectionName,
                data: item
            });

            console.log(`Response from adding new ${collectionName}: `, response);
            if (response && response.success) {
                _setData(prev => [...prev, response.data]);
                resObj.success = true;
                resObj.data = response.data;
                resObj.message = 'Publication created successfully';
            } else {
                resObj.success = false;
                resObj.message = response.message || 'Failed to create publication';
                notify({ type: 'error', message: response.message || 'Failed to create publication' });
            }

            return resObj;
        } catch (error) {
            console.error('Error adding new publication: ', error);
            notify({ type: 'error', message: 'Failed to create publication' });
            resObj.success = false;
            resObj.message = error.message || 'Failed to create publication';
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
                notify({ type: 'success', message: 'Publication updated successfully' });
                resObj.success = true;
                resObj.data = response.data;
                resObj.message = 'Done';
            } else {
                notify({ type: 'error', message: response.message || 'Failed to update publication' });
                resObj.message = response.message || 'Failed to update publication';
                resObj.success = false;
            }

            return resObj;

        } catch (error) {
            console.error('Error updating publication: ', error);
            notify({ type: 'error', message: 'Failed to update publication' });
            resObj.message = error.message || 'Failed to update publication';
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
                resObj.success = true;
                resObj.message = 'Publication deleted successfully';
            } else {
                notify({ type: 'error', message: response.message || 'Failed to delete publication' });
                resObj.message = response.message || 'Failed to delete publication';
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
    }, [org]);


    
    return (
        <div className="container-main w-full flex flex-col gap-6">
            <h1 className="text-2xl flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-purple-500" />
                {toDisplayStr(collectionName)}
            </h1>

            <div className="w-full relative rounded-md overflow-x-auto">
                <Table
                    className="card-1 min-w-full"
                    editable={false}
                    editableInline={true}
                    allowAddNew={true}
                    actions={['edit', 'delete', 'preview']}
                    tableExcludeKeys={['org_id']}
                    previewKey="content"
                    editRenderOrder={[
                        ['name', 'status'],
                        ['title'],
                        ['media'],
                        ['scheduled_at'],
                        ['description'],
                        ['notes'],
                    ]}
                    columns={[
                        {
                            key: 'name',
                            title: 'Name',
                            width: 'w-48',
                            type: 'text',
                            required: true,
                            validateKey: 'length',
                            placeholder: 'Enter publication name'
                        },
                        {
                            key: 'status',
                            title: 'Status',
                            width: 'w-32',
                            type: 'select',
                            options: statusOptions,
                            required: true,
                            defaultValue: 'inReview',
                            Component: StatusItem
                        },
                        {
                            key: 'scheduled_at',
                            title: 'Scheduled',
                            width: 'w-40',
                            type: 'datetime',
                            placeholder: 'Select date & time',
                            Component: ({ value }) => value ? <DateDisplay date={value} format="short" showTime={true} /> : <span className="text-gray-400">Not scheduled</span>
                        },
                        {
                            key: 'title',
                            title: 'Title',
                            width: 'w-64',
                            type: 'textarea',
                            placeholder: 'Social media title...',
                        },
                        {
                            key: 'description',
                            title: 'Description',
                            width: 'w-64',
                            type: 'textarea',
                            placeholder: 'Enter description...',
                        },
                        {
                            key: 'script',
                            title: 'Script',
                            width: 'w-64',
                            type: 'textarea',
                            placeholder: 'Enter script...',
                        },
                        {
                            key: 'media',
                            title: 'Media',
                            width: 'w-64',
                            // type: 'textarea',
                            placeholder: 'Enter media URLs...',
                            validationKey: 'url',
                        },
                        {
                            key: 'notes',
                            title: 'Notes',
                            type: 'textarea',
                            width: 'w-48',
                            placeholder: 'Internal notes...',
                        },
                    ]}
                    data={_data}
                    onAddNew={handleNewItem}
                    onRowChange={handleUpdateItem}
                    onRowDelete={handleDeleteItem}
                    onChange={(newData) => {
                        console.log('Publications data changed: ', newData);
                    }}
                />

                <Loading loading={isLoading} />
            </div>


            {/* <div className="relative w-72 min-h-96 card-1 flex flex-col gap-4 ">
 
                <span className="font-semibold">
                    Title Placeholder
                </span>
                <span>
                    Description
                </span>

                <div className="">
                    <Image
                        src="/images/other/s-poster.jpeg"
                        alt="Social Media Preview"
                        width={250}
                        height={100}
                        className="rounded-md shadow-md"
                    />
                </div>
            </div> */}
        </div>
    );
}