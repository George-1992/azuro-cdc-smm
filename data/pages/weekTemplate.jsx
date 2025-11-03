'use client';
import Loading from "@/components/other/loading";
import { saCreateItem, saDeleteItem, saGetItems, saUpdateItem } from "@/components/serverActions.jsx";
import { notify } from "@/components/sonnar/sonnar";
import Table from "@/components/table";
import { useState, useEffect } from "react";
import { socialMediaPlatforms } from "@/data/types";
import { toDisplayStr } from "@/utils/other";
import { ChevronsUpDownIcon, CircleSlash, Edit, StickyNote, Video } from "lucide-react";
import Select from "@/components/select";
import { Dropdown } from "@/components/other/dropdown";

export default function WeekTemplate({ pathname, user, account, session, org }) {

    const collectionName = 'week_templates';
    const [isLoading, setIsLoading] = useState(true);
    const [_data, _setData] = useState([]);

    // Define options for the dropdowns
    const weekdayOptions = [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' }
    ];

    const weekTimeOptions = Array.from({ length: 24 }, (_, i) => {
        return { value: i, label: `${i}:00` };
    });


    const contentTypeOptions = [
        { value: 'video', label: 'Video' },
        { value: 'post', label: 'Post' },
    ];

    const platformOptions = socialMediaPlatforms.map(platform => ({
        value: platform,
        label: toDisplayStr(platform)
    }));

    const handleNewItem = async (item) => {
        console.log('item: ', item);
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
                resObj.message = 'Week template created successfully';
            } else {
                resObj.success = false;
                resObj.message = response.message || 'Failed to create week template';
                notify({ type: 'error', message: response.message || 'Failed to create week template' });
            }

            return resObj;
        } catch (error) {
            console.error('Error adding new week template: ', error);
            notify({ type: 'error', message: 'Failed to create week template' });
            resObj.success = false;
            resObj.message = error.message || 'Failed to create week template';
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
                notify({ type: 'success', message: 'Week template updated successfully' });
                resObj.success = true;
                resObj.data = response.data;
                resObj.message = 'Done';
            } else {
                notify({ type: 'error', message: response.message || 'Failed to update week template' });
                resObj.message = response.message || 'Failed to update week template';
                resObj.success = false;
            }

            return resObj;

        } catch (error) {
            console.error('Error updating week template: ', error);
            notify({ type: 'error', message: 'Failed to update week template' });
            resObj.message = error.message || 'Failed to update week template';
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
                resObj.message = 'Week template deleted successfully';
            } else {
                notify({ type: 'error', message: response.message || 'Failed to delete week template' });
                resObj.message = response.message || 'Failed to delete week template';
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
                Week Templates
            </h1>

            <div className="w-full relative rounded-md overflow-x-auto">
                <Table
                    className="card-1 min-w-full"
                    editable={true}
                    editableInline={true}
                    allowAddNew={true}
                    actions={['edit', 'delete']}
                    tableExcludeKeys={['configs', 'org_id']}
                    previewKey="description"
                    editRenderOrder={[
                        ['name'],
                        ['weekday', 'time'],
                        ['content_type', 'target_platforms'],
                        ['description'],
                    ]}
                    columns={[
                        {
                            key: 'name',
                            title: 'Name',
                            width: 'w-48',
                            type: 'text',
                            required: true,
                            validateKey: 'length',
                            placeholder: 'Enter template name'
                        },
                        {
                            key: 'weekday',
                            title: 'Weekday',
                            width: 'w-32',
                            type: 'select',
                            options: weekdayOptions,
                            required: true,
                            placeholder: 'Select day'
                        },
                        {
                            key: 'time',
                            title: 'Time',
                            width: 'w-24',
                            type: 'select',
                            required: true,
                            options: weekTimeOptions,
                        },
                        {
                            key: 'content_type',
                            title: 'Content Type',
                            width: 'w-32',
                            type: 'select',
                            options: contentTypeOptions,
                            required: true,
                            placeholder: 'Select type',
                            Component: (props) => {
                                // console.log('props: ', props);
                                return <div className="flex gap-2 items-center">
                                    {props.value === 'video' && <Video className="size-5" />}
                                    {props.value === 'post' && <StickyNote className="size-5" />}
                                    {props.value || 'N/A'}
                                </div>;
                            },
                            EditComponent: (props) => {
                                return <Dropdown>
                                    <div
                                        data-type="trigger"
                                        className="w-full p-1 flex gap-1 items-center justify-between text-sm bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                    >
                                        <div className="flex gap-2 items-center">

                                            {
                                                props.value === 'video' ? <Video className="size-5" /> :
                                                    props.value === 'post'
                                                        ? <StickyNote className="size-5" />
                                                        : <CircleSlash className="size-5" />
                                            }
                                            <span>
                                                {props.value || 'N/A'}
                                            </span>
                                        </div>

                                        <ChevronsUpDownIcon className="size-4" />
                                    </div>

                                    <div data-type="content" className="w-28 p-2">
                                        <div className="w-40 flex flex-col gap-2">
                                            {
                                                contentTypeOptions.map(option => (
                                                    <div
                                                        key={option.value}
                                                        className={`w-full p-1 flex gap-2 items-center justify-start text-sm rounded-md hover:bg-gray-200 transition-colors ${props.value === option.value ? 'bg-gray-200' : 'bg-gray-100'}`}
                                                        onClick={() => {
                                                            if (props.onChange) {
                                                                props.onChange({
                                                                    target: {
                                                                        name: 'content_type',
                                                                        value: option.value
                                                                    }
                                                                })
                                                            }
                                                        }}
                                                    >
                                                        {
                                                            option.value === 'video' ? <Video className="size-5" /> :
                                                                option.value === 'post'
                                                                    ? <StickyNote className="size-5" />
                                                                    : <CircleSlash className="size-5" />
                                                        }
                                                        <span>  {option.label}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                </Dropdown>
                            }
                        },
                        {
                            key: 'target_platforms',
                            title: 'Platforms',
                            width: 'w-40',
                            type: 'select',
                            options: platformOptions,
                            multiple: true,
                            required: true,
                            placeholder: 'Select platforms'
                        },
                        {
                            key: 'description',
                            title: 'Description',
                            type: 'textarea',
                            width: 'w-64',
                            placeholder: 'Template description...',
                        }
                    ]}
                    data={_data}
                    onAddNew={handleNewItem}
                    onRowChange={handleUpdateItem}
                    onRowDelete={handleDeleteItem}
                    onChange={(newData) => {
                        console.log('Week templates data changed: ', newData);
                    }}
                />

                <Loading loading={isLoading} />
            </div>
        </div>
    );
}