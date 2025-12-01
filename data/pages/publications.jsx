'use client';
import Loading from "@/components/other/loading";
import { saCreateItem, saDeleteItem, saGetItems, saUpdateItem } from "@/components/serverActions.jsx";
import { notify } from "@/components/sonnar/sonnar";
import Table from "@/components/table";
import { useState, useEffect } from "react";
import { toDisplayStr } from "@/utils/other";
import { Calendar, CheckCircle, Clock, Edit3, FileText, Pause, Play, XCircle, BookOpen, Component, InfoIcon } from "lucide-react";
import DateDisplay from "@/components/date/DateDisplay";
import Image from "next/image";
import MediaLibrary, { InlineMediaLibrary } from "@/components/mediaLibrary";
import { adjustRelationalData } from "@/utils/data";
import { cloneDeep } from "lodash";
import { PopupModal } from "@/components/other/modals";
import DatePicker from "react-datepicker";
import DateInput from "@/components/date";

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

        if (['draft', 'planned'].includes(status)) {
            return 'text-yellow-600 bg-yellow-100';
        }
        else if (['publishing'].includes(status)) {
            return 'text-green-600 bg-yellow-100';
        }
        else if (['cancelled'].includes(status)) {
            return 'text-red-600 bg-red-100';
        }
        else if (['scheduled'].includes(status)) {
            return 'text-blue-600 bg-blue-100';
        }
        else if (['published'].includes(status)) {
            return 'text-green-600 bg-green-100';
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

    const orgId = org ? org.id : null;
    const collectionName = 'publications';
    const [isLoading, setIsLoading] = useState(false);
    const [_data, _setData] = useState([]);
    const [_dataOriginal, _setDataOriginal] = useState([]);

    const [_page, _setPage] = useState({
        skip: 0,
        take: 10,
        itemsPerPage: 10,
        total: 0
    });

    // Define options for the dropdowns
    const statusOptions = [
        { value: 'draft', label: 'Draft' },
        { value: 'ready', label: 'Ready' },
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
                let newData = [..._data];
                let newDataItem = response.data;
                if (item.medias && item.medias.length > 0) {
                    newDataItem.medias = item.medias;
                }
                newData.unshift(newDataItem);
                _setData(newData);

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

            let toSaveData = cloneDeep(item);
            toSaveData.org_id = orgId;
            toSaveData = adjustRelationalData({
                collection: collectionName,
                data: toSaveData,
                originalData: _dataOriginal.find(d => d.id === toSaveData.id)
            });
            // console.log('toSaveData: ', toSaveData);

            const response = await saUpdateItem({
                collection: collectionName,
                query: {
                    where: {
                        id: toSaveData.id
                    },
                    data: toSaveData,
                    include: {
                        medias: true
                    },
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
                notify({ type: 'success', message: 'Content deleted successfully' });
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
    const handlePublishItem = async (item) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {


            const response = await saUpdateItem({
                collection: collectionName,
                query: {
                    where: {
                        id: item.id
                    },
                    data: {
                        status: 'publishing',
                        scheduled_at: item.scheduled_at || null,
                    },
                }
            });


            if (response && response.success) {
                let newData = [..._data];
                newData.forEach(d => {
                    if (d.id === item.id) {
                        d.status = 'publishing';
                        d.scheduled_at = item.scheduled_at || null;
                    }
                });
                _setData(newData);
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
            console.error('Error updating publication: ', error);
            notify({ type: 'error', message: 'Failed to update publication' });
            resObj.message = error.message || 'Failed to update publication';
            resObj.data = item;
            resObj.success = false;
            return resObj;
        }
    };

    // initial load, fetch data
    const fetchItems = async (thisPage = _page) => {
        try {
            setIsLoading(true);
            const response = await saGetItems({
                collection: collectionName,
                includeCount: true,
                query: {
                    where: {
                        org_id: org ? org.id : null
                    },
                    include: {
                        medias: true,
                        sources: true,
                        avatar: true,
                    },
                    orderBy: {
                        created_at: 'desc'
                    },
                    skip: thisPage.skip || 0,
                    take: thisPage.take,
                }
            });

            console.log(`Fetched ${collectionName}: `, response);
            // console.log(`Total count: `, response.count);

            if (response && response.success) {
                _setData(response.data || []);
                _setDataOriginal(cloneDeep(response.data || []));
                // if total not set yet
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
    useEffect(() => {
        fetchItems();
    }, []);

    const handlePageChange = (newPage) => {
        _setPage(newPage);
        fetchItems(newPage);
    }


    return (
        <div className="container-main w-full flex flex-col gap-6">
            <h1 className="text-2xl flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-purple-500" />
                Content
            </h1>

            <div className="w-full relative rounded-md overflow-x-auto">
                <Table
                    className="card-1 min-w-full max-h-calc(100vh-300px)"
                    editable={true}
                    editableInline={false}
                    allowAddNew={true}

                    tableExcludeKeys={['org_id']}
                    previewKey="content"
                    // modalType="expandable"
                    page={_page}
                    onPageChange={handlePageChange}
                    editRenderOrder={[
                        ['name', 'status'],
                        ['title'],
                        // ['scheduled_at'],
                        ['description'],
                        ['notes'],
                        ['medias'],
                    ]}
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
                        },
                        {
                            name: 'publish',
                            confirm: {
                                title: 'Confirm Publication',
                                message: 'Are you sure you want to publish this content?',
                                button1: 'Cancel',
                                button2: 'Publish',
                            },
                            // func: handlePublishItem,
                            ConfirmComponent: (props) => {
                                // console.log('props: ', props);
                                const [thisData, setThisData] = useState(props.data || {});

                                return (
                                    <div className="w-full h-[430px]">
                                        <div>
                                            <h4 className="text-lg font-semibold mb-4">
                                                Confirm Publication
                                            </h4>
                                        </div>
                                        <div>
                                            <p>Select date and time to publish later</p>
                                            <DateInput
                                                value={thisData.scheduled_at}
                                                showTime={true}
                                                onChange={(d) => {
                                                    setThisData({
                                                        ...thisData,
                                                        scheduled_at: d?.target?.value
                                                    });
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-4 mt-5 mb-6">
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => { }}
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => {
                                                    handlePublishItem(thisData);
                                                    if (props.onClose) {
                                                        props.onClose();
                                                    }
                                                }}
                                            >
                                                Publish &nbsp;
                                                {thisData.scheduled_at ? ' Later' : 'Now'}
                                            </button>
                                        </div>
                                        <div className="p-2 flex flex-col gap-5 text-gray-400">
                                            <div className="p-2 rounded-md border border-gray-400 shadow-sm">
                                                <div className="flex items-center">
                                                    <InfoIcon className="size-5 mr-2" />
                                                    <span className="font-semibold">
                                                        Date Not Selected:
                                                    </span>
                                                </div>
                                                <span>
                                                    The content will be published immediately upon confirmation.
                                                </span>
                                            </div>
                                            <div className="p-2 rounded-md border border-gray-400 shadow-sm">
                                                <div className="flex items-center">
                                                    <InfoIcon className="size-5 mr-2" />
                                                    <span className="font-semibold">
                                                        Date Selected:
                                                    </span>
                                                </div>
                                                <span>
                                                    The content will be published at the scheduled date and time.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        }
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
                            defaultValue: 'draft',
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
                            key: 'medias',
                            title: 'Medias',
                            width: 'w-96',
                            required: false,
                            multiple: true,
                            Component: (props) => {
                                return (
                                    <div>{props?.value?.length || 0}</div>
                                )
                            },
                            EditComponent: (props) => {
                                const row = props.row || {};
                                // console.log('EditComponent: ', props);
                                // return (
                                //     <div>{props?.value?.length || 0}</div>
                                // )
                                return (
                                    <div className="w-full">
                                        <div className="flex flex-col gap-3">
                                            <InlineMediaLibrary
                                                org={org}
                                                types={['image', 'video']}
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
                        {
                            key: 'script',
                            title: 'Script',
                            width: 'w-64',
                            type: 'textarea',
                            placeholder: 'Enter script...',
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