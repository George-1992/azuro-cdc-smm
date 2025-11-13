'use client';
import Select from "@/components/select";
import { socialMediaPlatforms, weekdayOptions } from "@/data/types";
import _, { set } from "lodash";
import { PlusIcon, MinusIcon, X, CircleXIcon } from "lucide-react";
import { useState, useEffect } from "react";

export default function AgendaBuilder({
    items = [], onChange = () => { }
}) {

    const itemsExample = [
        {
            weekday: 'monday',
            times: [{ h: 9, m: 0 }],
            targetPlatforms: ['facebook', 'instagram'],
        }
    ]

    const [_items, _setItems] = useState(items || []);

    const handleItemChange = (index, field, value) => {

        let newData = [..._items];
        newData[index] = { ...newData[index], [field]: value };
        onChange(newData);
        _setItems(newData);
    }

    const handleNoneInputChange = (data) => {
        // console.log('handleNoneInputChange: ', data);
        onChange(data);
        _setItems(data);
    }

    const handleAddTimeSlot = (itemIndex) => {
        let newData = [..._items];
        if (newData[itemIndex] && newData[itemIndex].times) {
            const currentTimes = [...newData[itemIndex].times];
            // Add a new time slot (default to 9:00 AM)
            currentTimes.push({ h: 9, m: 0 });
            newData[itemIndex].times = currentTimes;
        }
        handleNoneInputChange(newData);
    }

    const handleRemoveTimeSlot = (itemIndex, timeIndex) => {
        let newData = [..._items];
        if (newData[itemIndex] && newData[itemIndex].times) {
            const currentTimes = [...newData[itemIndex].times];
            // Remove the time slot at the specified index (but keep at least one)
            if (currentTimes.length > 1) {
                currentTimes.splice(timeIndex, 1);
            }
            newData[itemIndex].times = currentTimes;
        }
        handleNoneInputChange(newData);
    }

    const handleTimeChange = (itemIndex, timeIndex, field, value) => {
        let newData = [..._items];
        if (newData[itemIndex] && newData[itemIndex].times) {
            const currentTimes = [...newData[itemIndex].times];
            currentTimes[timeIndex] = {
                ...currentTimes[timeIndex],
                [field]: parseInt(value)
            };
            newData[itemIndex].times = currentTimes;
        }
        handleNoneInputChange(newData);
    }

    const handleAddSchedule = () => {
        const newSchedule = {
            weekday: 'monday',
            times: [{ h: 9, m: 0 }],
            targetPlatforms: [],
        };
        let newData = [..._items, newSchedule];
        handleNoneInputChange(newData);
    }

    const handleRemoveSchedule = (index) => {
        let newData = [..._items];
        newData.splice(index, 1);
        handleNoneInputChange(newData);
    }

    // console.log('_items: ', _items);


    return (
        <div className="agenda-container w-full">
            <div className="flex flex-col gap-2">
                {
                    _items.map((item, index) => (
                        <div key={index} className="agenda-item relative p-3 rounded-md border bg-slate-50 border-gray-300 shadow-sm">
                            <div className="font-semibold mb-4">Schedule {index + 1}</div>

                            {/* Weekday Selection */}
                            <div className="mb-4 flex items-center gap-6 ">
                                <div className="w-40">
                                    <span className="block text-sm font-medium text-gray-700 mb-2">
                                        Weekday
                                    </span>
                                    <Select
                                        className="bg-white max-w-xs"
                                        placeholder="Select weekday"
                                        options={weekdayOptions}
                                        value={item.weekday}
                                        onChange={(selected) => {
                                            const v = selected?.target?.value || selected?.value || selected;
                                            handleItemChange(index, "weekday", v);
                                        }}
                                    />
                                </div>

                                <div>
                                    <span className="block text-sm font-medium text-gray-700 mb-2">
                                        Time
                                    </span>
                                    <div className="timeslot flex items-center gap-0.5">
                                        <select
                                            className="p-1.5 border border-gray-300 rounded-md bg-white"
                                            value={item.times[0]?.h || 0}
                                            onChange={(e) => handleTimeChange(index, 0, 'h', e.target.value)}
                                        >
                                            {
                                                Array.from({ length: 24 }, (_, i) => (
                                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                                ))
                                            }
                                        </select>
                                        :
                                        <select
                                            className="p-1.5 border border-gray-300 rounded-md bg-white"
                                            value={item.times[0]?.m || 0}
                                            onChange={(e) => handleTimeChange(index, 0, 'm', e.target.value)}
                                        >
                                            {
                                                Array.from({ length: 60 }, (_, i) => (
                                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                </div>
                                <div className="w-full">
                                    <span className="block text-sm font-medium text-gray-700 mb-2">
                                        Target Platforms
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        <Select
                                            className="bg-white"
                                            placeholder="select platforms"
                                            options={socialMediaPlatforms}
                                            value={item.targetPlatforms}
                                            multiple={true}
                                            onChange={(selected) => {
                                                const v = selected?.target?.value || [];
                                                handleItemChange(index, "targetPlatforms", v);
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="absolute -top-3 -right-2">
                                    <button
                                        className="text-red-500 hover:scale-105 text-sm mt-2 duration-200"
                                        onClick={() => handleRemoveSchedule(index)}
                                        type="button"
                                    >
                                        <CircleXIcon className="size-6" />
                                    </button>
                                </div>


                            </div>



                        </div>
                    ))
                }

                <button
                    className="w-full btn btn-secondary flex gap-2 items-center "
                    onClick={handleAddSchedule}
                    type="button"
                >
                    <PlusIcon className="w-4 h-4 mt-1" />
                    Add Schedule
                </button>
            </div>
        </div>
    );
}
