"use client";

import Uppy from '@uppy/core'
import { useRef, useState } from 'react'

import {
    Dropzone,
    FilesGrid,
    FilesList,
    UploadButton,
    UppyContextProvider,
} from '@uppy/react'
import RemoteSources from '@uppy/remote-sources'
import UppyScreenCapture from '@uppy/screen-capture'
import Tus from '@uppy/tus'
import UppyWebcam from '@uppy/webcam'


// import CustomDropzone from './CustomDropzone'
// import { RemoteSource } from './RemoteSource'
// import ScreenCapture from './ScreenCapture'
// import Webcam from './Webcam'


export default function UppyEl() {
    return (
        <div>Uppy Component</div>
    );
}