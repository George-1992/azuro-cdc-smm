'use client';
import Loading from "@/components/other/loading";
import { saCreateItem, saDeleteItem, saGetItems, saUpdateItem } from "@/components/serverActions.jsx";
import { notify } from "@/components/sonnar/sonnar";
import Table from "@/components/table";
import { useState, useEffect } from "react";
import { toDisplayStr } from "@/utils/other";
import { Calendar, CheckCircle, Clock, Edit3, FileText, MegaphoneIcon, Pause, Play, XCircle } from "lucide-react";
import DateDisplay from "@/components/date/DateDisplay";
import { languageOptions } from "@/data/types";



// Status Component with Icons
const StatusItem = ({ value, row, rowIndex, column }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'draft':
                return <Edit3 className="w-4 h-4 text-gray-500" />;
            case 'scheduled':
                return <Clock className="w-4 h-4 text-blue-500" />;
            case 'published':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'paused':
                return <Pause className="w-4 h-4 text-yellow-500" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <FileText className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft':
                return 'text-gray-600 bg-gray-100';
            case 'scheduled':
                return 'text-blue-600 bg-blue-100';
            case 'published':
                return 'text-green-600 bg-green-100';
            case 'paused':
                return 'text-yellow-600 bg-yellow-100';
            case 'cancelled':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className={`w-full h-full p-1 flex items-center gap-2 px-2 py-1 rounded-md ${getStatusColor(value)}`}>
            {getStatusIcon(value)}
            <span className="capitalize text-xs font-medium">{value}</span>
        </div>
    );
};

export default function Campaigns({ pathname, user, account, session, org }) {

    const collectionName = 'campaigns';
    const [isLoading, setIsLoading] = useState(true);
    const [_data, _setData] = useState([]);
    const [_avatars, _setAvatars] = useState([]);
    const [_sources, _setSources] = useState([]);
    const [_weekTemplates, _setWeekTemplates] = useState([]);

    // Define options for the dropdowns
    const statusOptions = [
        { value: 'draft', label: 'Draft' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'published', label: 'Published' },
        { value: 'paused', label: 'Paused' },
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
                notify({ type: 'success', message: 'Campaign updated successfully' });
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

            // Fetch week templates
            const weekTemplatesResponse = await saGetItems({
                collection: 'week_templates',
                query: {
                    where: { org_id: org ? org.id : null }
                }
            });
            if (weekTemplatesResponse?.success) {
                _setWeekTemplates(weekTemplatesResponse.data || []);
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
                    actions={['edit', 'delete']}
                    tableExcludeKeys={['org_id']}
                    previewKey="global_inspiration"
                    editRenderOrder={[
                        ['name', 'status'],
                        ['language'],
                        ['avatar_id', 'source_id'],
                        ['week_template_id'],
                        ['scheduled_at'],
                        ['global_inspiration'],
                    ]}
                    columns={[
                        {
                            key: 'name',
                            title: 'Name',
                            width: 'w-48',
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
                            defaultValue: 'draft',
                            Component: StatusItem
                        },
                        {
                            key: 'language',
                            title: 'Language',
                            width: 'w-24',
                            type: 'select',
                            required: true,
                            options: languageOptions,
                            defaultValue: 'en',
                            placeholder: 'Select language'
                        },
                        {
                            key: 'avatar_id',
                            title: 'Avatar',
                            width: 'w-32',
                            type: 'select',
                            required: true,
                            options: avatarOptions,
                            placeholder: 'Select avatar',
                            clearable: true
                        },
                        {
                            key: 'source_id',
                            title: 'Source',
                            width: 'w-32',
                            type: 'select',
                            required: true,
                            options: sourceOptions,
                            placeholder: 'Select source',
                            clearable: true
                        },
                        {
                            key: 'week_template_id',
                            title: 'Week Template',
                            width: 'w-32',
                            type: 'select',
                            required: true,
                            options: weekTemplateOptions,
                            placeholder: 'Select template',
                            clearable: true
                        },
                        {
                            key: 'global_inspiration',
                            title: 'Inspiration',
                            type: 'textarea',
                            required: false,
                            width: 'w-64',
                            placeholder: 'Campaign inspiration...',
                            rows: 2
                        }
                    ]}
                    data={_data}
                    onAddNew={handleNewItem}
                    onRowChange={handleUpdateItem}
                    onRowDelete={handleDeleteItem}
                    onChange={(newData) => {
                        console.log('Campaigns data changed: ', newData);
                    }}
                />

                <Loading loading={isLoading} />
            </div>
        </div>
    );
}