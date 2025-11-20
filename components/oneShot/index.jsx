'use client';
import FormBuilder from "@/components/formBuilder";
import { Dropdown } from "@/components/other/dropdown";
import SourceTypeItem, { getTypeFromUrl } from "@/components/other/sourceTypeItem";
import StatusItem from "@/components/other/statusItem";
import { Checkbox, Toggle } from "@/components/other/toggle";
import { saCreateItem, saGetItems } from "@/components/serverActions.jsx";
import { notify } from "@/components/sonnar/sonnar";
import { contentTypeOptions, languageOptions, socialMediaPlatforms, weekdayOptions } from "@/data/types";
import { generateName, toDisplayStr } from "@/utils/other";
import _, { map } from "lodash";
import { ChevronsUpDownIcon, CircleSlashIcon, StickyNoteIcon, VideoIcon, WandSparklesIcon } from "lucide-react";
import { useState, useEffect } from "react";

const weekTimeOptions = Array.from({ length: 24 }, (_, i) => {
    return { value: `${i}:00`, label: `${i}:00` };
});

const platformOptions = socialMediaPlatforms.map(platform => ({
    value: platform,
    label: toDisplayStr(platform)
}));

const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];



export default function OneShot({ org, onSuccess = () => { } }) {

    const [_data, _setData] = useState({
        name: generateName('oneshot'),
        language: org.language || org.configs?.language || 'en',
        content_type: 'video',
        status: 'draft',
        // scheduled_at: new Date().toISOString(), // ISO string
        global_inspiration: '',
        target_platforms: [],
        sources: [],
    });
    const [_avatars, _setAvatars] = useState([]);
    const [_sources, _setSources] = useState([]);
    const [_isFastMode, _setIsFastMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);


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
            // console.log('avatarsResponse: ', avatarsResponse);
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

            // console.log('sourcesResponse: ', sourcesResponse);
            if (sourcesResponse?.success) {
                _setSources(sourcesResponse.data || []);
            }
        } catch (error) {
            console.error('Error fetching related data: ', error);
        }
    };

    const handleSubmit = async (newData) => {
        // console.log('Publications data changed: ', newData);
        try {
            // Call the create publication API
            let toSaveData = { ...newData };
            toSaveData.org_id = org.id;
            if (_isFastMode) {
                toSaveData.isFastMode = true;
            }

            // delete relational data that should not be directly updated
            // or move relational data to connect format
            ['avatar', 'sources'].forEach(relKey => {
                if (toSaveData[relKey]) {
                    // if its an array move to connect format
                    if (Array.isArray(toSaveData[relKey])) {
                        console.log('toSaveData[relKey]: ', toSaveData[relKey]);

                        toSaveData[relKey] = {
                            connect: toSaveData[relKey].map(id => ({ id }))
                        };

                    } else {
                        delete toSaveData[relKey];
                    }
                }
            });

            // console.log('toSaveData: ', toSaveData);
            // return;


            const response = await saCreateItem({ collection: 'publications', data: toSaveData });
            // console.log('response: ', response);

            if (response?.success) {
                notify({ type: 'success', message: 'Created successfully!' });
                onSuccess(_data);
            } else {
                notify({ type: 'error', message: response?.message || 'Failed to create One Shot.' });
            }
        } catch (error) {
            console.error('Error creating One Shot: ', error);
            notify({ type: 'error', message: error?.message || 'Failed to create One Shot.' });
        }
    }

    // on fast mode change update status
    //  if its fast mode, set status to ready
    useEffect(() => {
        if (_isFastMode && _data.status !== 'ready') {
            _setData(prevData => ({
                ...prevData,
                status: 'ready'
            }));
        }
    }, [_isFastMode]);

    // initial load, fetch data
    useEffect(() => {
        const body = async () => {
            try {
                setIsLoading(true);


                // Fetch related data
                await fetchRelatedData();

            } catch (error) {
                console.error(`Error fetching : `, error);
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

    // console.log('_data: ', _data);

    return (
        <div className="w-full p-2 flex flex-col gap-2">
            <div className="w-full flex items-center gap-4 mb-4">
                <WandSparklesIcon className="h-5 w-5 text-gray-600 " />
                <span className="text-gray-600">One Shot  </span>
            </div>

            <div className="flex items-center gap-2">
                Fast Mode
                <Toggle
                    checked={_isFastMode}
                    onChange={(e) => {
                        _setIsFastMode(e);
                    }}
                />
            </div>
            <div className="bg-blue-50 p-2 rounded-md">
                <p>
                    Toggle fast mode to review and edit idea
                </p>
            </div>

            <div className="relative p-1 my-3">
                <FormBuilder
                    className=""
                    formData={_data}
                    submitButtonText="Create One Shot"
                    onSubmit={(newData) => {
                        handleSubmit(newData);
                    }}
                    renderOrder={[
                        ['language', 'content_type'],
                        ['avatar_id'],
                        ['sources'],
                        ['global_inspiration'],
                        ['agendaHeading'],
                        ['weekday', 'time'],
                        ['target_platforms'],
                        ['spacerHeading'],
                    ]}
                    fields={[
                        // {
                        //     name: 'name',
                        //     label: 'Name',
                        //     type: 'text',
                        //     required: true,
                        //     validateKey: 'length',
                        //     placeholder: 'Enter campaign name',
                        //     defaultValue: _data.name,
                        //     disabled: _isFastMode,
                        // },
                        // {
                        //     name: 'scheduled_at',
                        //     label: 'Scheduled At',
                        //     type: 'datetime',
                        //     required: true,
                        //     validateKey: 'length',
                        //     placeholder: 'Enter scheduled date and time (ISO format)',
                        //     disabled: _isFastMode,
                        // },
                        {
                            name: 'language',
                            label: 'Language',
                            width: 'w-32',
                            type: 'select',
                            required: true,
                            options: languageOptions,
                            defaultValue: 'en',
                            placeholder: 'Select language'
                        },
                        {
                            name: 'content_type',
                            label: 'Content Type',
                            width: 'w-32',
                            type: 'select',
                            options: contentTypeOptions,
                            required: true,
                            placeholder: 'Select type',
                            Component: (props) => {
                                // console.log('props: ', props);
                                return <div className="flex gap-2 items-center">
                                    {props.value === 'video' && <VideoIcon className="size-5" />}
                                    {props.value === 'post' && <StickyNoteIcon className="size-5" />}
                                    {props.value || 'N/A'}
                                </div>;
                            },
                            EditComponent: (props) => {
                                // if (_isFastMode) {
                                //     return <div className="flex gap-2 items-center">
                                //         {props.value === 'video' && <VideoIcon className="size-5" />}
                                //         {props.value === 'post' && <StickyNoteIcon className="size-5" />}
                                //         {props.value || 'N/A'}
                                //     </div>;
                                // }
                                return <Dropdown className="">
                                    <div
                                        data-type="trigger"
                                        className="w-full p-1 flex gap-1 items-center justify-between text-sm bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                    >
                                        <div className="flex gap-2 items-center">

                                            {
                                                props.value === 'video' ? <VideoIcon className="size-5" /> :
                                                    props.value === 'post'
                                                        ? <StickyNoteIcon className="size-5" />
                                                        : <CircleSlashIcon className="size-5" />
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
                                                            option.value === 'video' ? <VideoIcon className="size-5" /> :
                                                                option.value === 'post'
                                                                    ? <StickyNoteIcon className="size-5" />
                                                                    : <CircleSlashIcon className="size-5" />
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
                            name: 'avatar_id',
                            label: 'Avatar',
                            width: 'w-32',
                            type: 'select',
                            required: false,
                            options: avatarOptions,
                            placeholder: 'Select avatar',
                            disabled: false,
                            clearable: true
                        },
                        {
                            name: 'sources',
                            label: 'Sources',
                            width: 'w-32',
                            type: 'select',
                            required: false,
                            multiple: true,
                            options: sourceOptions,
                            placeholder: 'Select sources',
                            clearable: true,
                            // getValue: (item) => {
                            //     let r = item.sources
                            //         ? map(item.sources, 'id')
                            //         : [];
                            //     const v = _.get(item, 'sources.connect', null);
                            //     if (v) {
                            //         r = map(v, 'id');
                            //     }
                            //     // console.log('getValue item: ', item);
                            //     // console.log('getValue r: ', r);
                            //     return r;
                            // },
                            // setValue: (item, value) => {
                            //     let newItem = { ...item };
                            //     newItem.sources = {
                            //         connect: value.map(id => ({ id }))
                            //     }
                            //     // console.log('setValue newItem: ', newItem);
                            //     return newItem;
                            // }
                        },
                        {
                            name: 'global_inspiration',
                            label: 'Inspiration with idea',
                            type: 'textarea',
                            required: false,
                            width: 'w-32',
                            disabled: false,
                            placeholder: 'Campaign inspiration...',
                            rows: 2
                        },

                    ]}
                />



                {/* {_isFastMode &&
                    <div className="w-full flex justify-end">
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                handleSubmit(_data);
                            }}
                        >
                            Create One Shot
                        </button>
                    </div>
                } */}
            </div>
        </div>
    );
}