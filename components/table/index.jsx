'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, Edit2, Check, X, ChevronLeft, ChevronRight, CircleX, Pencil, Trash, PlusIcon, ArrowBigRight, Eye } from 'lucide-react';
import { PopupModal, ExpandableModal } from '@/components/other/modals';
import FormBuilder from '@/components/formBuilder';
import { notify } from '@/components/sonnar/sonnar';
import DateInput from '@/components/date';
import Select from '@/components/select';
import { isEqual } from 'lodash';
import DateDisplay from '@/components/date/DateDisplay';
import { widthMap } from './helper';
import Link from 'next/link';
import FilterAndViews from '@/components/table/parts/tableFilter';
import { cn } from '@/libs/utils';

const passwordField = {
    name: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    required: true,
    hidden: false,
    validateKey: 'password'
}

// Table Component with full features
export const Table = ({
    pathname = '',
    className = '',
    columns = [], // { key: 'name', title: 'Name' width: 'w-1/3' sort: 'asc'  }
    data = [],
    searchable = true,
    sortable = true,
    paginated = false,
    pageSize = 10,
    filterable = false,
    editable = false,
    editableInline = false,
    nonEditables = ['id', 'createdAt'],
    actions = [], // ['edit', 'delete', 'preview'] 
    allowAddNew = false,
    isUserTable = false, // special for users table
    editRenderOrder = [],
    tableExcludeKeys = [], // keys to exclude from table display
    linkPrefix = '', // if view action, link prefix
    previewKey = 'body', // key to use for preview content

    users = [], // for user select options
    leads = [], // for lead select options

    account = {},
    user = {},

    modalType = 'popup', // 'popup' or 'expandable'

    onChange = (updatedData) => { console.log('updatedData:', updatedData); },
    onRowChange = (rowIndex, newRowData) => { console.log('Row Change:', rowIndex, newRowData); return { success: false } },
    onRowDelete = (rowIndex, rowData) => { console.log('Row Delete:', rowIndex, rowData); },
    onAddNew = (newRowData) => { console.log('Add New Row:', newRowData); return { success: false } },
    onPreview = (rowData) => { console.log('Preview:', rowData); },
    onFilter = () => { },
    newItemChange = () => { }
}) => {




    const getCols = () => {
        const arr = [];
        if (columns.length > 0) {
            arr.push(...columns);
        } else {
            if (data && data.length) {
                arr.push(...Object.keys(data[0] || {})
                    .map(key => ({ key, title: key })));
            }
        }
        const filteredArr = arr.filter(col =>
            !tableExcludeKeys.includes(col.key)
            && col.type !== 'heading'
            && col.type !== 'element'
        );

        // console.log('Filtered Columns: ', filteredArr);
        return filteredArr;
    };


    const [_originalData, _setOriginalData] = useState(data);
    const [_data, _setData] = useState(data || []);
    const [_columns, _setColumns] = useState(getCols());

    const [searchTerm, setSearchTerm] = useState('');
    const [_sortKey, _setSortKey] = useState(null);
    const [_sortOrder, _setSortOrder] = useState('asc'); // 'asc' or 'desc'

    // editing column, inline
    const [_editingItem, _setEditingItem] = useState(null);
    const [_editingCell, _setEditingCell] = useState(null);

    // edit item popup
    const [_editingItemMain, _setEditingItemMain] = useState(null);
    const [_deletingItem, _setDeletingItem] = useState(null);

    const [_newItem, _setNewItem] = useState(null);

    const [_isActionLoading, _setIsActionLoading] = useState(false);

    const [_previewItem, _setPreviewItem] = useState(null);

    const Modal = modalType === 'expandable' ? ExpandableModal : PopupModal;

    const modifiedRowIds = _originalData
        .filter(origRow => {
            // Find matching current row by id
            const currentRow = _data.find(r => r.id === origRow.id);
            if (!currentRow) return false;

            // Deep compare both rows
            // If not equal, it means some value actually changed
            return !isEqual(origRow, currentRow);
        })
        .map(origRow => origRow.id);
    // console.log('Modified rows:', modifiedRowIds);


    const handleSort = (columnKey) => {
        // Determine new sort order
        let newOrder;
        if (_sortKey !== columnKey) {
            newOrder = 'asc'; // First click on new column = ascending
        } else if (_sortOrder === 'asc') {
            newOrder = 'desc'; // Second click = descending
        } else {
            newOrder = 'asc'; // Third click = ascending again
        }

        // Update sort states
        _setSortKey(columnKey);
        _setSortOrder(newOrder);

        // Apply sorting to current data
        const sortedData = [..._data].sort((a, b) => {
            const aValue = a[columnKey];
            const bValue = b[columnKey];

            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            // Handle different data types
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return newOrder === 'asc' ? aValue - bValue : bValue - aValue;
            }

            // String comparison
            const aString = String(aValue).toLowerCase();
            const bString = String(bValue).toLowerCase();

            if (aString < bString) return newOrder === 'asc' ? -1 : 1;
            if (aString > bString) return newOrder === 'asc' ? 1 : -1;
            return 0;
        });

        _setData(sortedData);
    };

    const handleCellClick = ({ rowIndex, columnKey, row, column }) => {

        // console.log('Cell clicked:', columnKey, rowIndex,);
        // console.log('Row data:', row);
        // console.log('Column data:', column);

        if (editableInline && !nonEditables.includes(columnKey)) {
            //  if already editing same cell, do nothing
            if (_editingCell === `$${columnKey}-${rowIndex}`) return;
            _setEditingCell(`$${columnKey}-${rowIndex}`);
            _setEditingItem(row);
        }

    };

    const handleCellChange = (rowIndex, columnKey, newValue) => {
        // console.log('Cell change:', rowIndex, columnKey, newValue);
        const updatedData = [..._data];
        updatedData[rowIndex] = {
            ...updatedData[rowIndex],
            [columnKey]: newValue
        };
        _setData(updatedData);
        onChange(updatedData);
    };
    const handleRowChangeDismiss = (row) => {
        // console.log('Row change dismissed:', row);
        // add back from _originalData
        const originalRow = _originalData.find(r => r.id === row.id);
        if (originalRow) {
            const updatedData = [..._data];
            updatedData[_data.findIndex(r => r.id === row.id)] = originalRow;
            _setData(updatedData);
        }
    };
    const handleActionEdit = (row) => {
        // console.log('Edit action clicked for row:', row);
        _setEditingItemMain(row);
    };
    const handleActionDelete = (row) => {
        // console.log('Delete action clicked for row:', row);
        _setDeletingItem(row);
    };
    const handleAddNew = () => {
        const emptyRow = {};
        _columns.forEach(col => {
            if (col.multiple) {
                emptyRow[col.key] = col.defaultValue || [];
            } else {
                emptyRow[col.key] = col.defaultValue || '';
            }
        });
        _setNewItem(emptyRow);
        newItemChange(emptyRow);
    };

    const handleActionPreview = (row) => {
        _setPreviewItem(row);
    };

    const handleModalClose = () => {
        _setEditingItemMain(null);
        _setDeletingItem(null);
        _setNewItem(null);
        newItemChange(null);
    }


    const getFormBuilderRenderOrder = () => {
        // console.log('getFormBuilderRenderOrder editRenderOrder ==> ', editRenderOrder);
        const keys = _columns.map(col => col.key)
            .filter(k => !k);

        // Find keys that are NOT present in ANY of the editRenderOrder arrays
        const missingKeys = keys.filter(key =>
            !nonEditables.includes(key) &&
            !editRenderOrder.some(arr => arr && arr.includes(key))
        );

        // Convert missing keys to arrays and add to the result
        const arr = [
            ...editRenderOrder,
            ...missingKeys.map(key => [key])
        ];

        // console.log('getFormBuilderRenderOrder missingKeys ==> ', missingKeys);
        // console.log('getFormBuilderRenderOrder ==> ', arr);

        return arr;
    }



    const handleRowSave = async (row) => {
        try {
            let response = null
            // console.log('Row save:', row);

            _setIsActionLoading(true);
            const func = _newItem ? onAddNew : onRowChange;

            response = await func(row);


            if (!response || !response.success) {
                notify({ type: 'error', message: response && response.message ? response.message : 'Error saving row' });
                return;
            } else {
                // notify({ type: 'success', message: 'Done' });
                _setNewItem(null);
                _setEditingItemMain(null);
                _setDeletingItem(null);
                newItemChange(null);
            }

        } catch (error) {
            console.error('Row save error:', error);
        } finally {
            _setIsActionLoading(false);
        }

        // Here you would typically send the updated row data to your server or state management
    };
    const handleRowDelete = async (row) => {
        try {
            _setIsActionLoading(true);
            const response = await onRowDelete(row);
            if (!response || !response.success) {
                notify({ type: 'error', message: response && response.message ? response.message : 'Error deleting row' });
                return;
            }
            _setDeletingItem(null);

            notify({ type: 'success', message: 'Row deleted successfully' });
        } catch (error) {
            console.error('Row delete error:', error);
        } finally {
            _setIsActionLoading(false);
        }
    };



    const handleFilterChange = (filters) => {
        // console.log('Filters changed:', filters);
        onFilter(filters);
    };

    // Calculate minimum table width based on column widths
    const calculateMinWidth = () => {

        let totalWidth = 0;
        _columns.forEach(col => {
            totalWidth += widthMap[col.width] || 150; // default 150px if no width specified
        });

        // Add space for actions column if present
        if (actions && actions.length > 0) {
            totalWidth += 120; // 120px for actions column
        }

        // Add padding and borders
        totalWidth += 32; // extra padding

        return totalWidth;
    };
    const minTableWidth = calculateMinWidth();



    const getCellVal = (key, column, row) => {
        try {
            // console.log('key: ', key, column.options);

            if (column.options && column.options.length > 0) {
                const option = column.options.find(opt => opt.value === row[key]);
                if (option) {
                    return option.label || option.label
                }
            }

            return typeof row[key] === 'string'
                ? row[key]
                : JSON.stringify(row[key]);

            // const val = row[key];
            // return typeof val === 'string' ? val : JSON.stringify(val);
        } catch (error) {
            console.error('Error getting cell value:', error);
            return 'errored';
        }
    };

    const getPlcHolder = (col) => {
        let v = '';
        if (!v) {
            if (col.title) {
                v = `Enter ${col.title.toLowerCase()}...`;
            } else if (col.key) {
                v = `Enter ${col.key.toLowerCase()}...`;
            } else {
                v = '';
            }
        }
        return v;
    }


    // search, sort, data change
    useEffect(() => {
        let filteredData = data;

        // Apply search filter
        if (searchTerm) {
            filteredData = filteredData.filter(item =>
                Object.values(item).some(value =>
                    String(value).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // Apply current sorting if any column is sorted
        if (_sortKey) {
            filteredData = [...filteredData].sort((a, b) => {
                const aValue = a[_sortKey];
                const bValue = b[_sortKey];

                if (aValue == null && bValue == null) return 0;
                if (aValue == null) return 1;
                if (bValue == null) return -1;

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return _sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                }

                const aString = String(aValue).toLowerCase();
                const bString = String(bValue).toLowerCase();

                if (aString < bString) return _sortOrder === 'asc' ? -1 : 1;
                if (aString > bString) return _sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }

        _setData(filteredData);
    }, [searchTerm, data, _sortKey, _sortOrder]);

    // if _editingItem and _editingCell are set, then if click outside, clear them
    // excluding the same cell clicks
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (_editingCell) {
                const cellElement = document.querySelector(`[data-cellid="${_editingCell}"]`);
                if (cellElement && !cellElement.contains(event.target)) {
                    // clicked outside the editing cell
                    _setEditingCell(null);
                    _setEditingItem(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [_editingItem, _editingCell]);
    // console.log('Table columns:', columns);

    // update original data if data prop changes

    useEffect(() => {
        if (!isEqual(data, _originalData)) {
            _setOriginalData(data);
            _setData(data || []);
        }
    }, [data]);

    // update on columns change
    useEffect(() => {
        if (!isEqual(columns, _columns)) {
            _setColumns(getCols());
        }
    }, [columns]);

    // console.log('Table _editingItem: ', _editingItem);
    // // console.log('Table _editingCell: ', _editingCell);
    // console.log('Table _newItem: ', _newItem);
    // console.log('Table _columns: ', _columns);

    return (
        <div className={`cs-table ${className} `}>
            {/* header */}
            <div className='w-full h-8 flex justify-end items-center mb-4'>

                {/* filters */}
                <div className='flex flex-1  items-center'>
                    {
                        allowAddNew && editable && <button
                            className='btn btn-secondary flex items-center'
                            onClick={handleAddNew}
                        >
                            <PlusIcon className='size-4 mr-2' />
                            Add New
                        </button>
                    }
                    {/* filters */}
                    {filterable &&
                        <FilterAndViews
                            className="w-full flex-1 mx-3"
                            account={account}
                            user={user}
                            data={data}
                            pathname={pathname}
                            columns={columns}
                            onChange={handleFilterChange}
                        />
                    }

                </div>


                {/* search */}
                <div className='flex justify-end'>
                    {
                        searchable && (
                            <div className='relative form-control w-60 flex items-center gap-2 '>
                                <Search className='size-4 text-gray-300' />
                                <input
                                    type='text'
                                    placeholder='Search...'
                                    className='focus:ring-0 focus:outline-none h-4'
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )
                    }
                </div>
            </div>
            {/* table */}
            <div className='overflow-x-auto  border rounded-lg slick-scrollbar border-gray-200'>
                <table className='table-fixed' style={{ minWidth: `${minTableWidth}px`, width: '100%' }}>
                    <thead className='border-b border-gray-200 bg-gray-50'>
                        <tr content=''>
                            {editable && actions && actions.length > 0 &&
                                <th className='w-32'>
                                    <div className='w-32 px-2 py-2 text-sm font-medium text-gray-500 flex justify-start'>
                                        Actions
                                    </div>
                                </th>
                            }

                            {_columns.map((column) => (
                                <th key={column.key} className={`${column.width || ''} px-2 py-2 text-left text-sm font-medium text-gray-500`}>
                                    <div className={`flex items-center gap-2 ${column.width || ''}`}>
                                        <span className='text-nowrap'>
                                            {column.title}
                                        </span>
                                        {sortable && <button onClick={() => handleSort(column.key)}>
                                            {_sortKey === column.key ? (
                                                _sortOrder === 'asc' ? (
                                                    <ChevronUp className="w-4 h-4 inline-block text-gray-900 transition-all duration-300" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 inline-block text-gray-900 transition-all duration-300" />
                                                )
                                            ) : (
                                                <ChevronDown className="w-4 h-4 inline-block text-gray-400 transition-all duration-300" />
                                            )}
                                        </button>}
                                    </div>
                                </th>
                            ))}

                        </tr>
                    </thead>
                    <tbody className=''>
                        {_data.map((row, rowIndex) => {
                            const isModified = modifiedRowIds.includes(row.id);
                            // console.log('isModified', isModified, modifiedRowIds, modifiedRowIds);


                            return (
                                <tr key={rowIndex} className={`
                                border-b border-gray-200 ${isModified ? 'bg-yellow-100' : ''}
                                ${row.disabled && 'opacity-55'}
                                `}>

                                    {/* actions */}
                                    {editable && actions && actions.length > 0 && !row.disabled && editable &&
                                        <td className='w-32'>
                                            <div className='w-32 flex items-center gap-3 justify-start ml-2'>
                                                {!isModified && actions && actions.length > 0 &&
                                                    actions.map((action, aIdx) => {
                                                        const otherProps = {};
                                                        let Icon = Pencil;
                                                        if (action === 'edit') Icon = Edit2;
                                                        if (action === 'delete') Icon = Trash;
                                                        if (action === 'view') Icon = ArrowBigRight;
                                                        if (action === 'preview') Icon = Eye;
                                                        if (action === 'custom' && action.Icon) Icon = action.Icon;

                                                        const func = action === 'edit'
                                                            ? handleActionEdit
                                                            : action === 'delete'
                                                                ? handleActionDelete
                                                                : action === 'preview'
                                                                    ? handleActionPreview
                                                                    : () => { };

                                                        let Comp = null;
                                                        if (action === 'view' && linkPrefix && row.id) {
                                                            otherProps.href = `${linkPrefix || pathname}/${row.id}`;

                                                            Comp = Link;
                                                        } else {
                                                            Comp = 'button';
                                                        }

                                                        return (
                                                            <Comp
                                                                key={aIdx}
                                                                onClick={() => func(row)}
                                                                className='p-1.5 bg-gray-200 border border-gray-100 rounded-md hover:bg-gray-300 transition-colors '
                                                                {...otherProps}
                                                            >
                                                                <Icon className={`size-4 ${action === 'delete' ? 'text-red-500' : 'text-gray-500'}`} />
                                                            </Comp>
                                                        )
                                                    })
                                                }

                                                {
                                                    isModified &&
                                                    <div className='flex items-center gap-3'>
                                                        <button
                                                            className='p-1.5 border border-gray-500 rounded-full transition-colors hover:bg-gray-100'
                                                            onClick={() => {
                                                                handleRowChangeDismiss(row);
                                                            }}
                                                        >
                                                            <X className='size-4 text-gray-500' />
                                                        </button>

                                                        <button
                                                            className='p-1.5 border border-gray-500 rounded-full transition-colors hover:bg-gray-100'
                                                            onClick={() => {
                                                                handleRowSave(row);
                                                            }}
                                                        >
                                                            <Check className='size-4 text-gray-500' />
                                                        </button>

                                                    </div>
                                                }
                                            </div>
                                        </td>
                                    }

                                    {_columns.map((column) => {


                                        const cellId = `$${column.key}-${rowIndex}`;
                                        const isEditMode = _editingCell === cellId;

                                        const ColComponent = column.Component || null;
                                        const CellContainer = editableInline && !nonEditables.includes(column.key) && !isEditMode
                                            ? 'button'
                                            : 'div'

                                        const EditComponent = column.EditComponent && column.EditComponent !== 'default'
                                            ? column.EditComponent
                                            : null;

                                        // console.log('EditComponent ==> ', EditComponent, column.EditComponent);
                                        let val = row[column.key];

                                        if (['due_date', 'date', 'created_at', 'updated_at'].includes(column.key)) {
                                            val = new Date(val).toLocaleDateString();
                                        }
                                        if (Array.isArray(val)) {
                                            val = val.join(', ');
                                        }

                                        // console.log('table -  row-edit val: ', val);
                                        if (typeof val === 'object' && val !== null) {
                                            // val = 'bbb';
                                            val = JSON.stringify(val);
                                        }
                                        return (
                                            <td key={column.key} className={`${column.width || ''}`}>
                                                <CellContainer
                                                    data-cellid={cellId}
                                                    className={` h-10 
                                                        px-2 py-2 text-sm text-gray-700 ${column.width || ''} 
                                                        ${isEditMode ? 'overflow-visible' : 'overflow-hidden'} whitespace-nowrap text-ellipsis
                                                        flex items-center justify-start
                                                        transition-all duration-300 ease-in-out
                                                        ${isEditMode ? 'relative z-10 bg-blue-100 ' : ''}
                                                        `}
                                                    onClick={() => {
                                                        if (CellContainer !== 'button') return;
                                                        handleCellClick({
                                                            rowIndex,
                                                            columnKey: column.key,
                                                            row,
                                                            column,
                                                        });
                                                    }}
                                                >
                                                    {
                                                        !isEditMode && <>
                                                            {
                                                                ColComponent ? (
                                                                    <ColComponent
                                                                        value={row[column.key]}
                                                                        row={row} rowIndex={rowIndex} column={column}
                                                                        users={users} leads={leads}
                                                                    />
                                                                ) : column.type === 'date'
                                                                    ? <DateDisplay date={row[column.key]} format="short" className="text-gray-700" />
                                                                    : <>{getCellVal(column.key, column, row)}</>
                                                            }
                                                        </>
                                                    }
                                                    {
                                                        isEditMode && <div className={``}>
                                                            {
                                                                (ColComponent && EditComponent) && !isEditMode ? (
                                                                    EditComponent
                                                                        ? <EditComponent
                                                                            value={row[column.key]}
                                                                            row={row}
                                                                            rowIndex={rowIndex} column={column}
                                                                            onChange={(newValue) => handleCellChange(rowIndex, column.key, newValue)}
                                                                            users={users} leads={leads}
                                                                        />
                                                                        : <ColComponent value={row[column.key]} row={row} rowIndex={rowIndex} column={column} />
                                                                ) : column.type === 'select' ? (
                                                                    <Select
                                                                        value={row[column.key] || (column.multiple ? [] : '')}
                                                                        onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                                                                        options={column.options || []}
                                                                        placeholder="Select..."
                                                                        searchable={column.searchable || false}
                                                                        clearable={column.clearable || false}
                                                                        multiple={column.multiple || false}
                                                                        className="min-w-32"
                                                                    />
                                                                ) : column.type === 'date' || column.type === 'datetime' ? (
                                                                    <div className='w-full'>
                                                                        <DateInput
                                                                            value={row[column.key] || ''}
                                                                            onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                                                                            placeholder="Select date..."
                                                                            showTime={column.type === 'datetime' || column.showTime}
                                                                            format={column.format}
                                                                            inline={true}
                                                                        />

                                                                    </div>
                                                                ) : (
                                                                    <div className='w-10/12 mx-1 p-0.5 text-sm border border-gray-300 rounded '>
                                                                        <input
                                                                            type={['email', 'number', 'text', 'password'].includes(column.type)
                                                                                ? column.type
                                                                                : 'text'
                                                                            }
                                                                            name={column.key}
                                                                            className='focus:right-0 focus:outline-none w-full'
                                                                            value={row[column.key]}
                                                                            onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                                                                        />
                                                                    </div>
                                                                )
                                                            }
                                                        </div>
                                                    }

                                                </CellContainer>

                                                {/* space holder */}
                                                {/* <div className='h-4 w-full flex-shrink'></div> */}
                                            </td>
                                        )
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {
                    _data.length === 0 &&
                    <div className='p-4 text-center text-gray-500'>
                        No data available
                    </div>
                }
            </div>


            {/* combined modal for edit/add */}
            {
                (_editingItemMain || _newItem) && (
                    <Modal
                        isOpen={true}
                        onClose={handleModalClose}
                        className={cn(
                            modalType === 'expandable'
                                ? 'w-11/12 max-w-5xl'
                                : 'w-96 md:w-[600px]',
                        )}
                    // title={_editingItemMain ? 'Edit Item' : 'Add New Item'}
                    >
                        <FormBuilder
                            className='w-full p-4 relative'
                            formData={_editingItemMain || _newItem}
                            onSubmit={handleRowSave}
                            renderOrder={getFormBuilderRenderOrder()}
                            fields={[
                                ...columns.map(col => ({
                                    ...col,
                                    name: col.key,
                                    label: col.title,
                                    type: col.type || 'text',
                                    options: col.options || null,
                                    validateKey: col.validateKey || col.key,
                                    required: col?.required || false,
                                    disabled: col.disabled || false,
                                    defaultValue: _newItem ? (col.defaultValue || (col.multiple ? [] : '')) : undefined,
                                    multiple: col.multiple || false,
                                    searchable: col.searchable || false,
                                    clearable: col.clearable !== false,
                                    placeholder: getPlcHolder(col),
                                    showTime: col.showTime || false,
                                    format: col.format || 'YYYY-MM-DD',
                                    rows: col.rows || 3,
                                })).filter(f => !nonEditables.includes(f.name)),
                                ...(isUserTable ? [{
                                    ...passwordField,
                                    required: _newItem ? true : false
                                }] : [])
                            ]}
                            disabled={_isActionLoading}
                        />
                        {_isActionLoading && <div className='animate-shimmer'></div>}
                    </Modal>
                )
            }
            {
                _deletingItem && (
                    <Modal
                        isOpen={true}
                        onClose={() => _setDeletingItem(null)}
                    >
                        <div className='p-4'>
                            <h2 className='text-lg font-semibold mb-2'>Confirm Deletion</h2>
                            <p>Are you sure you want to delete this item?</p>
                        </div>
                        <div className='flex justify-end p-4'>
                            <button
                                className='btn btn-danger'
                                onClick={() => {
                                    handleRowDelete(_deletingItem);
                                }}
                            >
                                Delete
                            </button>
                            <button
                                className='btn btn-secondary ml-2'
                                onClick={() => _setDeletingItem(null)}
                            >
                                Cancel
                            </button>
                        </div>
                        {_isActionLoading && <div className='animate-shimmer'></div>}

                    </Modal>
                )
            }
            {
                _previewItem && (
                    <Modal
                        isOpen={true}
                        title={`Preview  ${_previewItem.name || _previewItem.title || 'Content'}`}
                        onClose={() => _setPreviewItem(null)}
                        className="w-10/12 md:w-[600px]"
                    >
                        <div className='p-4 flex flex-col gap-4'>
                            {(() => {
                                const content = _previewItem[previewKey] || '';
                                const isHTML = /<[a-z][\s\S]*>/i.test(content);

                                if (isHTML) {
                                    return (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Eye className="w-5 h-5 text-blue-500" />
                                                <span className="font-medium">HTML Preview:</span>
                                            </div>
                                            <iframe
                                                srcDoc={content}
                                                className="w-full h-96 border border-gray-300 rounded-md"
                                                title="Content Preview"
                                                sandbox="allow-same-origin"
                                            />
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Eye className="w-5 h-5 text-green-500" />
                                                <span className="font-medium">Text Preview:</span>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto slick-scrollbar">
                                                <div className="whitespace-pre-wrap text-gray-800 text-sm">
                                                    {content || 'No content available'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            })()}

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <button
                                    onClick={() => _setPreviewItem(null)}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </Modal>
                )
            }

            {/* <div>
                {JSON.stringify(users)}
            </div> */}
        </div>
    )
}

export default Table;
