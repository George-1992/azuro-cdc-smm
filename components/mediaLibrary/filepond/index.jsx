import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';


export default function Uploader() {
    return (
        <div>
            <FilePond
                allowMultiple={true}
                maxFiles={3}
                server="/api/v1"
            // onupdatefiles={fileItems => {
            //     console.log('fileItems: ', fileItems);
            // }}
            />
        </div>
    );
}