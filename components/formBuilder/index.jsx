'use client';

import Validators from "@/utils/validation";
import { useState, useEffect } from "react";
import Select from "@/components/select";
import DateInput from "@/components/date";
import NotesArray from "@/components/other/notesArray";
import { cn } from "@/libs/utils";

export default function FormBuilder({
    className = '',
    fields = [],
    formData = {},
    onChange = () => { },
    onSubmit = () => { },
    renderOrder = [],
    isForm = true,
    isInlineEdit = false,
    disabled = false,
    buttonClassName = '',
    excludeKeys = [],
    buttons = [], //buttons components to render next to the Save button
    isLoading = false,
    submitButtonText = 'Save',
}) {

    const [_formData, _setFormData] = useState(formData)
    const [_formErrors, _setFormErrors] = useState({})
    const [_isLoading, _setIsLoading] = useState(isLoading)
    const [_renderOrder, _setRenderOrder] = useState(renderOrder && renderOrder.length > 0
        ? renderOrder
        : fields.map(f => [f.name])
    )


    // if field has getValue func call it to set initial value
    const handleGetValue = (field) => {
        try {
            let value = _formData[field.name];
            if (field.getValue && typeof field.getValue === 'function') {
                value = field.getValue(_formData);
            }
            return value;
        } catch (error) {
            console.error('FormBuilder handleGetValue error ==> ', error);
        }
    };

    const handlesSetValue = (currentFormData, name, value) => {
        let data = { ...currentFormData };
        const thisField = fields.find(f => f.name === name);

        if (thisField.setValue && typeof thisField.setValue === 'function') {
            const func = thisField.setValue;
            data = func(data, value);
            // console.log(' func(data, value): ', func(data, value));

        } else {
            data[name] = value;
        }

        return data;
    }



    //if any fields func is defined call it to update dependent fields
    const handleFieldsWithFunc = (data) => {
        fields.forEach(field => {
            if (
                (field.func && typeof field.func === 'function')
                || (field.setValue && typeof field.setValue === 'function')
            ) {
                const func = field.func || field.setValue;
                const newValue = func(data);
                // console.log('field: ',field);
                if (newValue !== undefined) {
                    data[field.name] = newValue;
                }
            }
        });
    }



    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // let av = value;
        // let newFormData = { ..._formData, [name]: av }

        const nfd = handlesSetValue(_formData, name, value);
        // console.log('newFormData: ', nfd);

        _setFormData(nfd);
        onChange(nfd);
    };

    const formSubmit = (e) => {
        try {
            // console.log('Form submit e==> ', e);
            // console.log('Form submit disabled==> ', disabled);

            e.preventDefault();
            if (disabled) return;

            // validate
            let hasErrors = false;
            const newErrors = {};

            // Check all fields, not just ones in formData
            for (const field of fields) {
                const key = field.name;
                const value = _formData[key];

                // Check if required field is empty
                if (field.required) {
                    const isEmpty = value === undefined || value === null || value === '' ||
                        (Array.isArray(value) && value.length === 0);

                    if (isEmpty) {
                        newErrors[key] = `${field.label || key} is required`;
                        hasErrors = true;
                        continue;
                    }
                }

                // Run validator if exists
                const v = Validators[field?.validator || field?.validateKey || key];
                if (v && !v(value).isValid) {
                    newErrors[key] = v(value).errors.join(', ');
                    hasErrors = true;
                }
            }
            // console.log('Form submit newErrors==> ', newErrors);

            if (hasErrors) {
                _setFormErrors(newErrors);
                return;
            }

            // Parse number fields before submitting
            const processedFormData = { ..._formData };
            for (const field of fields) {
                const key = field.name;
                const value = processedFormData[key];

                // Parse number fields
                if (field.type === 'number' && value !== undefined && value !== null && value !== '') {
                    const numValue = parseFloat(value);
                    processedFormData[key] = isNaN(numValue) ? value : numValue;
                }
            }

            onSubmit(processedFormData);

        } catch (error) {
            console.error('FormBuilder formSubmit error ==> ', error);
        }
    }
    // console.log('Form submit _formErrors==> ', _formErrors);


    // if typing removes errors if any
    const str1 = Object.values(_formData).join(', ');
    useEffect(() => {
        if (Object.keys(_formErrors).length > 0) {
            _setFormErrors({});
        }
    }, [str1]);



    // update isLoading state if prop changes
    useEffect(() => {
        _setIsLoading(isLoading);
    }, [isLoading]);


    if (!fields) {
        return null;
    }
    // console.log('FormBuilder renderOrder ==> ', _renderOrder);
    // console.log('_formData: ', _formData);
    // console.log('_formData: ', _formData);
    // console.log('fields: ', fields);


    return (
        <div className={className}>
            <form className="w-full gap-3 flex flex-col " onSubmit={formSubmit}>
                <div className="w-full flex flex-col gap-3">
                    {
                        _renderOrder && _renderOrder.map((rowItems, idx) => {
                            const rowFields = fields.filter(f => rowItems.includes(f.name) && !f.hidden);

                            if (!rowFields || rowFields.length === 0) return null;


                            return (
                                <div key={idx} className="flex md:flex-row flex-col gap-4">
                                    {rowFields.map((field, fIdx) => {
                                        // console.log('field: ', field);

                                        if (field.type === 'element') {

                                            return (
                                                <field.Component
                                                    key={`fIdx-level1-${fIdx}`}
                                                    // formData={_formData}
                                                    // formErrors={_formErrors}
                                                    // onChange={handleInputChange}
                                                    isLoading={_isLoading}
                                                />
                                            );
                                        }

                                        return (
                                            <div key={`fIdx-level1-${fIdx}`} className={`form-group flex-1 relative flex flex-col justify-start ${field.className || ''}`}>
                                                <label
                                                    htmlFor={field.name}
                                                    className={cn(
                                                        _formErrors[field.name] ? 'text-red-500' : '',
                                                    )}
                                                >
                                                    {field.label}
                                                </label>

                                                <div className="flex-1 flex flex-col items-start justify-center">
                                                    {field.EditComponent || field.Component
                                                        ? (field.EditComponent
                                                            ? <field.EditComponent
                                                                value={handleGetValue(field)}
                                                                row={_formData}
                                                                onChange={handleInputChange}
                                                            />
                                                            : <field.Component
                                                                value={handleGetValue(field)}
                                                                row={_formData}
                                                            />
                                                        )
                                                        : <div className="w-full relative rounded-md">
                                                            {field.type === 'select'
                                                                ? (
                                                                    <Select
                                                                        id={field.name}
                                                                        name={field.name}
                                                                        value={handleGetValue(field) || (field.multiple ? [] : '')}
                                                                        onChange={handleInputChange}
                                                                        options={field.options || []}
                                                                        placeholder={field.placeholder}
                                                                        searchable={field.searchable || false}
                                                                        clearable={field.clearable || false}
                                                                        multiple={field.multiple || false}
                                                                        disabled={_isLoading || field.disabled}
                                                                        required={field.required}
                                                                        error={_formErrors[field.name]}
                                                                        renderOption={field.renderOption}
                                                                        renderValue={field.renderValue}
                                                                        loading={field.loading || false}
                                                                        loadingText={field.loadingText}
                                                                        noOptionsText={field.noOptionsText}
                                                                    // className={`${field.className || ''}`}
                                                                    />
                                                                )
                                                                : field.type === 'date' || field.type === 'datetime'
                                                                    ? (
                                                                        <DateInput
                                                                            id={field.name}
                                                                            name={field.name}
                                                                            value={handleGetValue(field) || ''}
                                                                            onChange={handleInputChange}
                                                                            placeholder={field.placeholder}
                                                                            disabled={_isLoading || field.disabled}
                                                                            required={field.required}
                                                                            error={_formErrors[field.name]}
                                                                            showTime={field.type === 'datetime' || field.showTime}
                                                                            format={field.format}
                                                                            clearable={field.clearable !== false}
                                                                            minDate={field.minDate}
                                                                            maxDate={field.maxDate}
                                                                            className={`w-full ${_formErrors[field.name] ? 'border-red-400' : ''} `}
                                                                        />
                                                                    )
                                                                    : field.type === 'notesArray' ? (
                                                                        <NotesArray
                                                                            value={handleGetValue(field) || []}
                                                                            onChange={(newValue) => {
                                                                                const newFormData = { ..._formData, [field.name]: newValue };
                                                                                _setFormData(newFormData);
                                                                                onChange(newFormData);
                                                                            }}
                                                                            placeholder={field.placeholder || "Enter note..."}
                                                                            readOnly={_isLoading || field.disabled}
                                                                            className={`${_formErrors[field.name] ? 'border-red-400' : ''}`}
                                                                        />
                                                                    )
                                                                        : field.type === 'textarea'
                                                                            ? (
                                                                                <textarea
                                                                                    id={field.name}
                                                                                    name={field.name}
                                                                                    placeholder={field.placeholder}
                                                                                    className={`form-control ${_formErrors[field.name] ? 'border-red-400' : ''} ${field.disabled && 'cursor-not-allowed'}`}
                                                                                    required={field.required}
                                                                                    onChange={handleInputChange}
                                                                                    disabled={_isLoading || field.disabled}
                                                                                    value={handleGetValue(field) || ''}
                                                                                    rows={field.rows || 3}
                                                                                />
                                                                            )
                                                                            : (
                                                                                <input
                                                                                    id={field.name}
                                                                                    name={field.name}
                                                                                    type={field.type}
                                                                                    placeholder={field.placeholder}
                                                                                    className={`form-control ${_formErrors[field.name] ? 'border-red-400' : ''} ${field.disabled && 'cursor-not-allowed'} ${field.className || ''}`}
                                                                                    required={field.required}
                                                                                    onChange={handleInputChange}
                                                                                    disabled={_isLoading || field.disabled}
                                                                                    value={handleGetValue(field) || ''}
                                                                                    autoComplete={field.autoComplete || ''}
                                                                                />
                                                                            )}
                                                            {_isLoading && <div className="animate-shimmer" />}


                                                        </div>
                                                    }


                                                    {_formErrors[field.name] && !['select', 'date', 'datetime', 'notesArray'].includes(field.type) && (
                                                        <p className="text-sm text-red-500 my-1 expanding">
                                                            {_formErrors[field.name]}
                                                        </p>
                                                    )}

                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            );
                        })
                    }
                </div>
                {fields && fields.length > 0 && isForm &&
                    <div className="flex items-center justify-end">
                        {
                            buttons && buttons.length > 0
                                ? buttons.map((ButtonComp, bIdx) => (
                                    <button key={`bIdx-level1-${bIdx}`} type="submit">
                                        {ButtonComp}
                                    </button>
                                ))
                                : <div className="flex items-center justify-end" type="submit">
                                    <button className={`btn btn-primary min-w-24 ${buttonClassName}`} disabled={_isLoading || disabled} type="submit">
                                        {submitButtonText}
                                    </button>
                                </div>
                        }


                    </div>
                }
            </form>
        </div>
    );
}


export const FormItem = ({
    type, componentType = 'input',
    value, onChange, label, placeholder, required = false, disabled = false
}) => {


    return (
        <div className="form-group flex-1 relative flex flex-col">
            <label htmlFor={label}>{label}</label>
            {componentType === 'input' && (
                <input
                    id={label}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className="form-control"
                />
            )}
        </div>
    );
}


//  example usage:
// <FormBuilder
//         fields={[
//             {
//                 name: 'id',
//                 label: 'ID',
//                 placeholder: 'Enter your ID',
//                 type: 'text',
//                 required: true,
//                 hidden: false,
//                 disabled: true,
//                 validator: ''
//             },
//             {
//                 name: 'email',
//                 label: 'Email',
//                 placeholder: 'Enter your email',
//                 type: 'email',
//                 required: true,
//                 hidden: false,
//                 disabled: false,
//                 validator: 'email'
//             },
//             {
//                 name: 'role',
//                 label: 'Role',
//                 placeholder: 'Select a role...',
//                 type: 'select',
//                 required: true,
//                 options: [
//                     { value: 'admin', label: 'Administrator' },
//                     { value: 'user', label: 'User' },
//                     { value: 'guest', label: 'Guest' }
//                 ],
//                 searchable: true,
//                 clearable: true
//             },
//             {
//                 name: 'skills',
//                 label: 'Skills',
//                 placeholder: 'Select skills...',
//                 type: 'select',
//                 multiple: true,
//                 options: ['JavaScript', 'React', 'Node.js', 'Python'],
//                 searchable: true,
//                 clearable: true
//             },
//             {
//                 name: 'description',
//                 label: 'Description',
//                 placeholder: 'Enter description...',
//                 type: 'textarea',
//                 rows: 4
//             },
//             {
//                 name: 'due_date',
//                 label: 'Due Date',
//                 placeholder: 'Select due date...',
//                 type: 'date',
//                 required: true,
//                 clearable: true
//             },
//             {
//                 name: 'created_at',
//                 label: 'Created At',
//                 placeholder: 'Select date and time...',
//                 type: 'datetime',
//                 showTime: true,
//                 format: 'YYYY-MM-DD HH:mm'
//             }
//         ]}
//         formData={formData}
//         className="w-full"
//     />