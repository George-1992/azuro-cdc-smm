'use client';
import Loading from "@/components/other/loading";
import { saCreateItem, saDeleteItem, saGetItems, saUpdateItem } from "@/components/serverActions.jsx";
import { notify } from "@/components/sonnar/sonnar";
import Table from "@/components/table";
import { useState, useEffect } from "react";
import { toDisplayStr } from "@/utils/other";
import { Calendar, CheckCircle, Clock, Edit3, FileText, MegaphoneIcon, Pause, Play, XCircle } from "lucide-react";
import DateDisplay from "@/components/date/DateDisplay";
import { languageOptions, socialMediaPlatforms, weekdayOptions } from "@/data/types";
import StatusItem from "@/components/other/statusItem";
import { Dropdown } from "@/components/other/dropdown";
import _, { get, map } from "lodash";
import AgendaBuilder from "@/components/agenda/agendaBuilder";




const weekTimeOptions = Array.from({ length: 24 }, (_, i) => {
    return { value: `${i}:00`, label: `${i}:00` };
});

const platformOptions = socialMediaPlatforms.map(platform => ({
    value: platform,
    label: toDisplayStr(platform)
}));

export default function Campaigns({ pathname, user, account, session, org }) {

    const collectionName = 'campaigns';
    const [isLoading, setIsLoading] = useState(true);
    const [_data, _setData] = useState([]);
    const [_avatars, _setAvatars] = useState([]);
    const [_sources, _setSources] = useState([]);
    const [_weekTemplates, _setWeekTemplates] = useState([]);

    // Define options for the dropdowns
    const statusOptions = [
        // { value: 'draft', label: 'Draft' },
        // { value: 'scheduled', label: 'Scheduled' },
        // { value: 'published', label: 'Published' },
        // { value: 'paused', label: 'Paused' },
        // { value: 'cancelled', label: 'Cancelled' }
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    const handleNewItem = async (item) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {
            let toSaveData = { ...item };
            toSaveData.org_id = org ? org.id : null;

            if (toSaveData.org_id === undefined) {
                notify({ type: 'error', message: 'Organization ID is required' });
                resObj.success = false;
                resObj.message = 'Organization ID is required';
                return resObj;
            }

            // if avatar_id is not set, remove it from the data to avoid foreign key constraint error
            if (!toSaveData.avatar_id) {
                delete toSaveData.avatar_id;
            }
            if (!toSaveData.sources || toSaveData.sources.length === 0) {
                delete toSaveData.sources;
            }


            // console.log('Adding new campaign: ', toSaveData);
            const response = await saCreateItem({
                collection: collectionName,
                data: toSaveData
            });

            console.log(`Response from adding new ${collectionName}: `, response);
            if (response && response.success) {
                _setData(prev => [...prev, response.data]);
                resObj.success = true;
                resObj.data = response.data;
                resObj.message = 'Campaign created successfully';
            } else {
                resObj.success = false;
                resObj.message = response.message || 'Failed to create campaign';
                notify({ type: 'error', message: response.message || 'Failed to create campaign' });
            }

            return resObj;
        } catch (error) {
            console.error('Error adding new campaign: ', error);
            notify({ type: 'error', message: 'Failed to create campaign' });
            resObj.success = false;
            resObj.message = error.message || 'Failed to create campaign';
            return resObj;
        }
    };

    const handleUpdateItem = async (item) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        // console.log('handleUpdateItem : ', item);
        // return resObj;


        try {
            let toSaveData = { ...item };
            // if avatar_id is not set, remove it from the data to avoid foreign key constraint error
            if (!toSaveData.avatar_id) {
                delete toSaveData.avatar_id;
            }
            if (!toSaveData.sources || toSaveData.sources.length === 0) {
                delete toSaveData.sources;
            }
            // delete relational data that should not be directly updated
            ['avatar'].forEach(relKey => {
                if (toSaveData[relKey]) {
                    delete toSaveData[relKey];
                }
            });

            const response = await saUpdateItem({
                collection: collectionName,
                query: {
                    where: { id: item.id },
                    data: toSaveData
                }
            });

            console.log(`Response from updating ${collectionName}: `, response);

            if (response && response.success) {
                _setData(prev => prev.map(i => i.id === item.id ? response.data : i));
                // notify({ type: 'success', message: 'Campaign updated successfully' });
                resObj.success = true;
                resObj.data = response.data;
                resObj.message = 'Done';
            } else {
                notify({ type: 'error', message: response.message || 'Failed to update campaign' });
                resObj.message = response.message || 'Failed to update campaign';
                resObj.success = false;
            }

            return resObj;

        } catch (error) {
            console.error('Error updating campaign: ', error);
            notify({ type: 'error', message: 'Failed to update campaign' });
            resObj.message = error.message || 'Failed to update campaign';
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
                resObj.message = 'Campaign deleted successfully';
            } else {
                notify({ type: 'error', message: response.message || 'Failed to delete campaign' });
                resObj.message = response.message || 'Failed to delete campaign';
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

    // Fetch related data (avatars, sources, week_templates)
    const fetchRelatedData = async () => {
        try {
            // Fetch avatars
            const avatarsResponse = await saGetItems({
                collection: 'avatars',
                query: {
                    where: { org_id: org ? org.id : null }
                }
            });
            if (avatarsResponse?.success) {
                _setAvatars(avatarsResponse.data || []);
            }

            // Fetch sources
            const sourcesResponse = await saGetItems({
                collection: 'sources',
                query: {
                    where: { org_id: org ? org.id : null }
                }
            });
            if (sourcesResponse?.success) {
                _setSources(sourcesResponse.data || []);
            }
        } catch (error) {
            console.error('Error fetching related data: ', error);
        }
    };

    // initial load, fetch data
    useEffect(() => {
        const body = async () => {
            try {
                setIsLoading(true);

                // Fetch campaigns
                const response = await saGetItems({
                    collection: collectionName,
                    query: {
                        where: {
                            org_id: org ? org.id : null
                        },
                        orderBy: {
                            created_at: 'desc'
                        },
                        include: {
                            sources: true,
                            avatar: true
                        }
                    }
                });

                console.log(`Fetched ${collectionName}: `, response);

                if (response && response.success) {
                    _setData(response.data || []);
                } else {
                    notify({ type: 'error', message: response.message || `Failed to fetch ${collectionName}` });
                }

                // Fetch related data
                await fetchRelatedData();

            } catch (error) {
                console.error(`Error fetching ${collectionName}: `, error);
            } finally {
                setIsLoading(false);
            }
        };
        body();
    }, [org]);

    // Create options for select fields
    const avatarOptions = _avatars.map(avatar => ({
        value: avatar.id,
        label: avatar.name
    }));

    const sourceOptions = _sources.map(source => ({
        value: source.id,
        label: source.name
    }));

    const weekTemplateOptions = _weekTemplates.map(template => ({
        value: template.id,
        label: template.name
    }));

    // console.log('_data: ', _data);


    return (
        <div className="container-main w-full flex flex-col gap-6">
            <h1 className="text-2xl flex items-center gap-2">
                <MegaphoneIcon className="w-8 h-8" />
                Campaigns
            </h1>

            <div className="w-full relative rounded-md overflow-x-auto">
                <Table
                    className="card-1 min-w-full"
                    editable={true}
                    editableInline={true}
                    allowAddNew={true}
                    modalType="expandable"
                    actions={['edit', 'delete']}
                    tableExcludeKeys={['org_id', 'sources', 'agenda']}
                    editRenderOrder={[
                        ['name'],
                        ['language', 'status'],
                        ['avatar_id'],
                        ['sources'],
                        ['scheduled_at'],
                        ['global_inspiration'],
                        ['agendaHeading'],
                        ['agenda'],
                        ['weekday', 'time'],
                        ['target_platforms'],
                        ['spacerHeading'],
                    ]}
                    columns={[
                        {
                            key: 'name',
                            title: 'Name',
                            width: 'w-32',
                            type: 'text',
                            required: true,
                            validateKey: 'length',
                            placeholder: 'Enter campaign name'
                        },
                        {
                            key: 'status',
                            title: 'Status',
                            width: 'w-32',
                            type: 'select',
                            options: statusOptions,
                            required: true,
                            defaultValue: 'inactive',
                            Component: (props) => {
                                return <StatusItem status={props.value} />
                            },
                            EditComponent: (props) => {
                                return (
                                    <Dropdown className="" align="left">
                                        <div data-type="trigger" className="w-32 ">
                                            <StatusItem status={props.value} />
                                        </div>
                                        <div data-type="content" className="w-48 right-0">
                                            <div className="flex flex-col">
                                                {statusOptions.map(option => (
                                                    <button
                                                        key={option.value}
                                                        className="p-1 border-b border-gray-100 hover:bg-gray-50"
                                                        onClick={(e) => {
                                                            if (props?.onChange) {
                                                                props.onChange({
                                                                    target: {
                                                                        name: 'status',
                                                                        value: option.value
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <StatusItem status={option.value} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </Dropdown>
                                )
                            }
                        },
                        {
                            key: 'language',
                            title: 'Language',
                            width: 'w-32',
                            type: 'select',
                            required: true,
                            options: languageOptions,
                            defaultValue: org.language || org.configs?.language || 'en',
                            placeholder: 'Select language'
                        },
                        {
                            key: 'avatar_id',
                            title: 'Avatar',
                            width: 'w-32',
                            type: 'select',
                            required: false,
                            options: avatarOptions,
                            placeholder: 'Select avatar',
                            clearable: true
                        },
                        {
                            key: 'sources',
                            title: 'Sources',
                            width: 'w-32',
                            type: 'select',
                            required: false,
                            multiple: true,
                            options: sourceOptions,
                            placeholder: 'Select sources',
                            clearable: true,
                            getValue: (item) => {
                                let r = item.sources
                                    ? map(item.sources, 'id')
                                    : [];
                                const v = _.get(item, 'sources.connect', null);
                                if (v) {
                                    r = map(v, 'id');
                                }
                                // console.log('getValue item: ', item);
                                // console.log('getValue r: ', r);
                                return r;
                            },
                            setValue: (item, value) => {
                                let newItem = { ...item };
                                newItem.sources = {
                                    connect: value.map(id => ({ id }))
                                }
                                // console.log('setValue newItem: ', newItem);
                                return newItem;
                            }
                        },
                        {
                            key: 'global_inspiration',
                            title: 'Inspiration',
                            type: 'textarea',
                            required: false,
                            width: 'w-32',
                            placeholder: 'Campaign inspiration...',
                            rows: 2
                        },
                        {
                            key: 'agendaHeading',
                            type: 'element',
                            Component: () => {
                                return (
                                    <div className="w-full mt-5 mb-2">
                                        <span className="font-semibold">Agenda</span>
                                        <div className="border-t text-gray-300"></div>
                                    </div>
                                );
                            }
                        },
                        {
                            key: 'agenda',
                            title: '',
                            width: 'w-32',
                            type: 'text',
                            required: false,
                            EditComponent: (props) => {
                                return <AgendaBuilder
                                    items={props.value || []}
                                    onChange={(newAgenda) => {
                                        if (props.onChange) {
                                            props.onChange({
                                                target: {
                                                    name: 'agenda',
                                                    value: newAgenda
                                                }
                                            });
                                        }
                                    }}
                                />
                            }
                        },
                        {
                            key: 'spacerHeading',
                            type: 'element',
                            Component: () => {
                                return (
                                    <div className="w-full h-10">
                                    </div>
                                );
                            }
                        },
                    ]}
                    data={_data}
                    onAddNew={handleNewItem}
                    onRowChange={handleUpdateItem}
                    onRowDelete={handleDeleteItem}
                    onChange={(newData) => {
                        // console.log('Campaigns data changed: ', newData);
                    }}
                />
                <div className="h-20"></div>

                <Loading loading={isLoading} />

            </div>

        </div>
    );
}