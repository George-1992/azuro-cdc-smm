export const adjustRelationalData = ({ collection, data, originalData }) => {

    if (!data) {
        return data;
    }
    let _data = { ...data };
    try {
        // console.log('data: ', data);


        if (_data) {
            ['created_at', 'updated_at'].forEach(relKey => {
                if (_data[relKey]) {
                    delete _data[relKey];
                }
            });

            // delete relation ids if not defined
            ['avatar_id'].forEach(relKey => {
                console.log('relKey: ', relKey, typeof _data?.[relKey]);
                if (_data && typeof _data?.[relKey] !== 'undefined' && !_data[relKey]) {
                    delete _data[relKey];
                }
            });


            ['avatar', 'org'].forEach(relKey => {
                if (typeof _data[relKey] !== 'undefined') {
                    console.log('relKey: ', relKey);
                    delete _data[relKey];
                }
            });
            // return _data;

            // delete relational data that should not be directly updated
            ['sources', 'medias'].forEach(relKey => {
                if (typeof _data[relKey] !== 'undefined') {
                    let d = {
                        connect: [],
                        disconnect: [],
                    }
                    const originalItems = originalData
                        ? originalData[relKey] || []
                        : [];
                    // console.log('originalItems: ', originalItems);
                    // console.log('newItems: ', _data[relKey]);

                    if (originalItems) {
                        const newItems = _data[relKey];
                        if (originalItems.length === 0) {
                            d.connect = newItems;
                        } else {
                            // determine items to connect and disconnect
                            const itemsToConnect = newItems.filter(ni => !originalItems.some(oi => oi.id === ni.id));
                            const itemsToDisconnect = originalItems.filter(oi => !newItems.some(ni => ni.id === oi.id));
                            d.connect = itemsToConnect;
                            d.disconnect = itemsToDisconnect;
                        }
                    }
                    // console.log('d: ', d);

                    if (d.connect.length || d.disconnect.length) {
                        _data[relKey] = {};
                        if (d.connect && d.connect.length > 0) {
                            _data[relKey].connect = d.connect.map(item => ({ id: item.id }));
                        }
                        if (d.disconnect && d.disconnect.length > 0) {
                            _data[relKey].disconnect = d.disconnect.map(item => ({ id: item.id }));
                        }
                    } else {
                        delete _data[relKey];
                    }

                }
            });
        }


        // console.log('_data: ', _data);

        return _data;

    } catch (error) {
        console.error('adjustRelationalData error: ', error);
        return _data;
    }
}