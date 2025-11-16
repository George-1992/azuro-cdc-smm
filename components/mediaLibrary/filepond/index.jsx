'use client';

import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import { uploadS3 } from '@/services/s3';
import { useEffect, useState } from 'react';


export default function Uploader({
    options = {
        keyPrefix: '',
    },
    onUpload = () => { },
    acceptedFileTypes = ['image/*', 'video/*', 'audio/*'],
    allowMultiple = false,
    maxFiles = 3,
}) {

    const [errorMessage, setErrorMessage] = useState('');

    const keyPrefix = options.keyPrefix || '';

    const handleUploadSuccess = (data) => {
        // console.log('Upload successful: ', data);
        onUpload(data);
    }

    // console.log('errorMessage: ', errorMessage);

    useEffect(() => {
        if (acceptedFileTypes && acceptedFileTypes.length > 0) {
            // find filepond--browser input and set its accept attribute
            const inputs = document.getElementsByClassName('filepond--browser');
            for (let input of inputs) {
                input.setAttribute('accept', acceptedFileTypes.join(','));
            }
        }
    }, [acceptedFileTypes]);
    return (
        <div className='relative'>
            <FilePond
                allowMultiple={allowMultiple}
                maxFiles={maxFiles}

                allowFileTypeValidation={true}
                acceptedFileTypes={acceptedFileTypes}
                labelFileTypeNotAllowed="Only JPEG images are allowed"
                fileValidateTypeLabelExpectedTypes="Expects .jpg or .jpeg"
                // server="/api/v1"
                server={{
                    // fake server to simulate loading a 'local' server file and processing a file
                    process: (fieldName, file, metadata, load, error, progress, abort) => {
                        (async () => {
                            try {
                                const fileType = file.type;
                                console.log('Detected MIME type:', fileType);

                                // Manual validation
                                if (acceptedFileTypes && !acceptedFileTypes.includes(fileType)) {
                                    error(`Invalid file type: ${fileType}. Only JPEG allowed.`);
                                    return;
                                }

                                const formData = new FormData();
                                formData.append('file', file, file.name);
                                const key = `${keyPrefix}/${file.name}`;

                                const uRes = await uploadS3({
                                    form: formData,
                                    options: { key },
                                });

                                if (uRes.success) {
                                    handleUploadSuccess({ name: file.name, url: key });
                                    load(key); // Only on success
                                } else {
                                    // error(uRes.message || 'Upload failed');
                                    error(uRes.message || 'Upload failed');
                                }
                            } catch (err) {
                                error('Upload error: ' + err.message);
                            }
                        })();

                        // Return abort controller
                        return {
                            abort: () => {
                                // Optional: cancel uploadS3 if in progress
                                abort();
                            }
                        };
                    },
                    load: (source, load) => {
                        // simulates loading a file from the server
                        // fetch(source)
                        //     .then((res) => res.blob())
                        //     .then(load);
                    },
                }}
                onupdatefiles={fileItems => {
                    // console.log('fileItems: ', fileItems);
                }}

            />
            <div className='w-full absolute bottom-2 left-0 text-sm opacity-30 text-center'>
                {
                    acceptedFileTypes && acceptedFileTypes
                        .map(type => type
                            .replace(/^image\//, '')
                            .replace(/^video\//, '')
                            .replace(/^audio\//, '')
                            .replace(/^\*$/, 'all')
                        )
                        .join(', ')
                }
            </div>
            {errorMessage && (
                <div className="w-full absolute bottom-0 left-0 text-sm text-red-500 text-center">
                    {errorMessage}
                </div>
            )}
        </div>
    );
}