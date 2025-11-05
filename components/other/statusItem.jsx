export default function StatusItem({ status }) {
    return (
        <div className={`p-1 rounded-md
            ${ ['processed','active'].includes(status) ? 'bg-green-200 text-green-800' : ''}
            ${ ['inactive','archived'].includes(status) ? 'bg-gray-200 text-gray-800' : ''}
            ${['pending'].includes(status) ? 'bg-yellow-200 text-yellow-800' : ''}
            ${['failed'].includes(status) ? 'bg-red-200 text-red-800' : ''}
            
            ${!['active', 'inactive', 'archived', 'pending', 'banned'].includes(status)
                ? 'bg-gray-200 text-gray-800'
                : ''
            }
        `}>
            {status}
        </div>
    );
}