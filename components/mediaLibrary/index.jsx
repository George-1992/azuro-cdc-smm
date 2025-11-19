'use client'
import Uploader from "@/components/mediaLibrary/filepond";
import MediaUploader from "@/components/mediaLibrary/mediaUploader";
import { ButtonGroup, ButtonGroupButton } from "@/components/other/all";
import Loading from "@/components/other/loading";
import { PopupModal } from "@/components/other/modals";
import { Tabs } from "@/components/other/tabs";
import { saCreateItem, saDeleteItems, saGetItem, saGetItems } from "@/components/serverActions.jsx";
import { notify } from "@/components/sonnar/sonnar";
import { cn } from "@/libs/utils";
import { deleteS3Objects } from "@/services/s3";
import { getFileTypeFromUrl } from "@/utils/other";
import { CircleCheckIcon, CircleIcon, CircleXIcon, ImageIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { use, useEffect, useState } from "react";


const mediaDomain = process.env.NEXT_PUBLIC_MEDIA_DOMAIN || '';
const allSizes = ['sm', 'md', 'full'];

console.log('mediaDomain: ', mediaDomain);


export default function MediaLibrary({
    medias = [],
    allowEdit = false,
    allowSingleSelect = false,
    allowUpload = true,
    standAloneMode = false,
    editMode = false,
    size = 'full',
    org = null,
    // acceptedFileTypes = ['image/png', 'image/jpeg', 'image/jpg', 'video/webp'],
    acceptedFileTypes = null,
    types = null,
    onChange = () => { },
}) {

    let _acceptedFileTypes = acceptedFileTypes;
    if (!_acceptedFileTypes && types && types.length) {
        _acceptedFileTypes = [];
        if (types.includes('image')) {
            _acceptedFileTypes = _acceptedFileTypes.concat(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);
        }
        if (types.includes('video')) {
            _acceptedFileTypes = _acceptedFileTypes.concat(['video/mp4', 'video/webm', 'video/ogg']);
        }
        if (types.includes('pdf')) {
            _acceptedFileTypes = _acceptedFileTypes.concat(['application/pdf']);
        }
        if (types.includes('audio')) {
            _acceptedFileTypes = _acceptedFileTypes.concat(['audio/mpeg', 'audio/wav', 'audio/ogg']);
        }
        if (types.includes('document')) {
            _acceptedFileTypes = _acceptedFileTypes.concat([
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ]);
        }
    }
    // console.log('_acceptedFileTypes: ', _acceptedFileTypes);

    const orgId = org ? org.id : null;
    const thisPrefix = `smm-app/${orgId || 'no-org'}`;
    const [_medias, _setMedias] = useState(medias || []);
    const [_size, _setSize] = useState(size || 'full');
    const [isLoading, setIsLoading] = useState(false);

    const [_isEditMode, _setIsEditMode] = useState(editMode || false);
    const [_editedMedias, _setEditedMedias] = useState(medias || []);


    const handleRemoveMedia = (mediaId) => {
        const updatedMedias = _medias.filter((media) => media.id !== mediaId);
        _setMedias(updatedMedias);
        onChange(updatedMedias);
    };

    const handleFileUpload = async ({ data, itemId }) => {
        try {

            let mediaRes = null;
            // first get media if exists in db 
            mediaRes = await saGetItem({
                collection: 'medias',
                query: {
                    where: { url: data.url }
                }
            });


            // create media item in DB
            if (!mediaRes || !mediaRes.success || mediaRes.data.length === 0) {
                mediaRes = await saCreateItem({
                    collection: 'medias',
                    data: {
                        url: data.url,
                        key: data.url,
                        type: getFileTypeFromUrl(data.url),
                        org_id: orgId,
                    }
                });

                // add to medias state
                if (mediaRes && mediaRes.success) {
                    const newData = [..._medias];
                    newData.push(mediaRes.data);
                    _setMedias(newData);
                    onChange(newData);
                } else {
                    notify({ type: 'error', message: 'Failed to create media item' });
                }
            }

            // if (mediaRes && mediaRes.success) {
            //     let newData = [..._data];
            //     newData.forEach((d, i) => {
            //         if (d.id === itemId) {
            //             newData[i].medias = newData[i].medias || [];
            //             newData[i].medias.push(mediaRes.data);
            //         }
            //     });
            //     _setData(newData);

            // } else {
            //     notify({ type: 'error', message: 'Failed to create media item' });
            // }

        } catch (error) {
            console.error('Error handling file upload: ', error);
        }
    };
    const handleDeleteFiles = async (mediaIds) => {
        try {
            const _mids = mediaIds || _editedMedias;
            // console.log('_mids: ', _mids);
            // return;
            const s3response = await deleteS3Objects(_mids);

            if (!s3response || !s3response.success) {
                notify({ type: 'error', message: 'Failed to delete selected files from S3' });
                return;
            }

            const response = await saDeleteItems({
                collection: 'medias',
                query: {
                    where: {
                        id: { in: _mids }
                    }
                }
            });

            if (response && response.success) {
                notify({ type: 'success', message: 'Deleted selected media items' });
                // refresh data
                const newData = _medias.filter(media => !_mids.includes(media.id));
                _setMedias(newData);
                _setEditedMedias([]);
                _setIsEditMode(false);
                onChange(newData);
            } else {
                notify({ type: 'error', message: response.message || 'Failed to delete selected media items' });
            }

        } catch (error) {
            console.error('handleDeleteFiles error: ', error);
        }
    };

    // fetch medias when org changes
    const fetchThisData = async () => {
        try {
            setIsLoading(true);
            let d = {
                collection: 'medias',
                query: {
                    where: {
                        // account_id: account ? account.id : null,
                        org_id: org ? org.id : null
                    },
                    // orderBy: {
                    //     created_at: 'desc'
                    // },
                    // take: 50,
                }
            };
            if (types) {
                d.query.where.type = { in: types };
            }
            // console.log('d: ', d);

            const response = await saGetItems(d);
            console.log('Fetched medias: ', response);

            if (response && response.success) {
                _setMedias(response.data || []);
            } else {
                notify({ type: 'error', message: response.message || `Failed to fetch ${collectionName}` });
            }

        } catch (error) {
            console.error(`Error fetching medias: `, error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMediaSelect = (action, mediaId) => {
        if (action === 'select') {
            if (!_editedMedias.includes(mediaId)) {
                _setEditedMedias([..._editedMedias, mediaId]);
            }
        } else if (action === 'deselect') {
            _setEditedMedias(_editedMedias.filter(id => id !== mediaId));
        }
    };

    let MediaContainer = 'div';
    if (allowSingleSelect) {
        MediaContainer = 'button';
    }


    useEffect(() => {
        if (!medias.length && !standAloneMode) {
            fetchThisData();
        }
    }, [org?.id]);

    useEffect(() => {
        if (standAloneMode) {
            _setMedias(medias || []);
        }
    }, [medias.length]);


    // console.log('MediaLibrary medias: ', medias);
    // console.log('MediaLibrary _medias: ', _medias);
    // console.log('MediaLibrary : ', allowEdit, _isEditMode);

    return (
        <div className="mediaLibrary-container relative">

            {allowUpload &&
                <Uploader
                    acceptedFileTypes={_acceptedFileTypes}
                    options={{
                        keyPrefix: thisPrefix
                    }}
                    onUpload={(data) => {
                        handleFileUpload({
                            data,
                        });
                    }}
                />
            }
            {/* actions */}
            <div className="flex gap-5 justify-end">

                <div className="flex flex-1">
                    <div className="flex gap-2">
                        {_isEditMode &&
                            <button
                                className="btn btn-primary h-9 border border-gray-200"
                                onClick={() => {
                                    _setIsEditMode(false)
                                    _setEditedMedias([]);
                                }}
                            >
                                Cancel
                            </button>
                        }
                        {/* {_isEditMode &&
                            <button
                                className="btn btn-secondary h-9 border border-gray-200"
                            >
                                Save
                            </button>
                        } */}
                        {_isEditMode &&
                            <button
                                className="btn btn-danger h-9 border border-gray-200"
                                onClick={() => { handleDeleteFiles(); }}
                            >

                                Delete &nbsp;
                                {_editedMedias.length} &nbsp;
                                Items
                            </button>
                        }
                        {!_isEditMode && allowEdit &&
                            <button
                                className="btn btn-secondary h-9 border border-gray-200"
                                onClick={() => _setIsEditMode(true)}
                            >
                                Edit
                            </button>
                        }
                    </div>

                </div>
                {allowEdit &&
                    <ButtonGroup defaultValue="full" className="mb-2" onChange={(val) => _setSize(val)}>
                        {allSizes.map((s) => (
                            <ButtonGroupButton
                                key={s}
                                value={s}
                            >
                                {s}
                            </ButtonGroupButton>
                        ))}
                    </ButtonGroup>
                }

            </div>

            {
                _medias && _medias.length
                    ? (
                        <div className="flex flex-wrap gap-3 p-1 justify-center">
                            {
                                _medias.map((media) => {
                                    const url = `${mediaDomain}/${media.url}`;
                                    // console.log('media: ', media);


                                    return (
                                        <MediaContainer
                                            key={`media-item-${media.id}`}
                                            type={allowSingleSelect ? 'button' : undefined}
                                            onClick={(e) => {
                                                if (allowSingleSelect) {
                                                    e.preventDefault();
                                                    onChange(media);
                                                }
                                            }}
                                            className={cn(
                                                'relative p-0.5 border border-gray-300 rounded-sm',
                                                'flex justify-center items-center',
                                                _size === 'sm' && 'w-12 h-auto min-h-6  object-cover',
                                                _size === 'md' && 'w-40 h-auto min-h-20  object-cover',
                                                _size === 'full' && "w-[250px] h-auto min-h-48 object-contain",
                                            )}
                                        >
                                            {media.type === 'image' &&
                                                <Image
                                                    src={url}
                                                    alt={media.name || media.key || 'media image'}
                                                    width={_size === 'sm' ? 48 : _size === 'md' ? 160 : 250}
                                                    height={_size === 'sm' ? 48 : _size === 'md' ? 160 : 250}
                                                    className="object-contain h-auto"
                                                />
                                            }
                                            {media.type === 'pdf' &&
                                                <Image
                                                    src={'/images/other/pdf-logo.svg'}
                                                    alt={'pdf logo'}
                                                    width={100}
                                                    height={100}
                                                />
                                            }
                                            {media.type === 'video' &&
                                                <video
                                                    src={url}
                                                    width={_size === 'sm' ? 48 : _size === 'md' ? 160 : 250}
                                                    controls
                                                />
                                            }


                                            {size === 'full' &&
                                                <div className="absolute -bottom-1 -right-1">
                                                    <span className="opacity-40 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                                        {media.url.split('/').pop()}
                                                    </span>
                                                </div>
                                            }

                                            <div className="absolute -top-1 -right-1">

                                                {
                                                    standAloneMode && <button
                                                        type="button"
                                                        className="bg-white rounded-full"
                                                        onClick={() => {
                                                            handleRemoveMedia(media.id);
                                                        }}
                                                    >
                                                        <CircleXIcon className="size-5" />
                                                    </button>
                                                }

                                                {allowEdit && _isEditMode &&
                                                    (
                                                        _editedMedias.includes(media.id)
                                                            ? < button
                                                                type="button"
                                                                onClick={() => handleMediaSelect('deselect', media.id)}
                                                            >
                                                                <CircleCheckIcon className="size-6 text-gray-500 fill-blue-100 " />
                                                            </button>
                                                            : < button
                                                                type="button"
                                                                onClick={() => handleMediaSelect('select', media.id)}
                                                            >
                                                                <CircleIcon className="size-6 text-gray-500" />
                                                            </button>
                                                    )
                                                }
                                            </div>
                                        </MediaContainer>
                                    );
                                })
                            }
                        </div>
                    )
                    : <div className="text-center">No medias available</div>
            }

            <Loading loading={isLoading} />
        </div >
    );
}

export const InlineMediaLibrary = ({
    collection = '',
    org = null,
    types = null,
    acceptedFileTypes = null,
    onChange = () => { },
}) => {

    const [_isOpen, _setIsOpen] = useState(false);

    const handleOnChange = (selectedMedia) => {
        onChange(selectedMedia);
        _setIsOpen(false);
    };

    return (
        <div className="w-96">
            <div className="w-full flex flex-col gap-3">
                <div className="flex justify-between">
                    <div>
                        {!_isOpen &&
                            <button
                                type="button"
                                className=" btn btn-secondary flex items-center gap-2"
                                onClick={() => _setIsOpen(true)}
                            >
                                <ImageIcon className="size-5 " />
                                <span>
                                    Open Media Library
                                </span>
                            </button>
                        }
                    </div>
                    <div>
                        {_isOpen &&
                            <button
                                type="button"
                                className=" btn btn-secondary flex items-center gap-2"
                                onClick={() => _setIsOpen(false)}
                            >
                                <XIcon className="size-5 " />
                                <span>
                                    Close
                                </span>
                            </button>
                        }
                    </div>
                </div>
                {_isOpen &&
                    <PopupModal
                        isOpen={_isOpen}
                        onClose={() => { _setIsOpen(false) }}
                        size="lg"
                        className="w-[560px] h-[580px]"
                        backdropClassName={'pt-2 md:pt-3'}
                    >
                        <MediaLibrary
                            org={org}
                            size={'md'}
                            types={types}
                            acceptedFileTypes={acceptedFileTypes}
                            allowEdit={false}
                            collection={collection}
                            allowSingleSelect={true}
                            onChange={handleOnChange}
                        />
                    </PopupModal>
                }
                {/* <div className="absolute top-0 left-0 bg-red-300">
                    <MediaLibrary
                        org={org}
                        size={'md'}
                        types={types}
                        acceptedFileTypes={acceptedFileTypes}
                        allowEdit={false}
                        collection={collection}
                        allowSingleSelect={true}
                        onChange={handleOnChange}
                    />
                </div> */}
            </div>
        </div>
    )
};

export { MediaUploader };