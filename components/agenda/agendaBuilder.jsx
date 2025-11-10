'use client';
import Select from "@/components/select";
import { socialMediaPlatforms, weekdayOptions } from "@/data/types";
import _, { set } from "lodash";
import { PlusIcon, MinusIcon } from "lucide-react";
import { useState, useEffect } from "react";

export default function AgendaBuilder({
    items = [], onChange = () => { }
}) {

    const itemsExample = [
        {
            weekSchedule: {
                monday: [{ h: 9, m: 0 }],
                tuesday: [{ h: 9, m: 0 }],
                wednesday: [{ h: 9, m: 0 }],
                thursday: [{ h: 9, m: 0 }],
                friday: [{ h: 9, m: 0 }],
                saturday: [{ h: 9, m: 0 }],
                sunday: [{ h: 9, m: 0 }],
            },
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

    const handleAddTimeSlot = (itemIndex, day) => {
        let newData = [..._items];
        if (newData[itemIndex] && newData[itemIndex].weekSchedule && newData[itemIndex].weekSchedule[day]) {
            const currentDaySchedule = [...newData[itemIndex].weekSchedule[day]];
            // Add a new time slot (default to 9:00 AM)
            currentDaySchedule.push({ h: 9, m: 0 });
            newData[itemIndex].weekSchedule[day] = currentDaySchedule;

        }
        handleNoneInputChange(newData);
    }

    const handleRemoveTimeSlot = (itemIndex, day, timeIndex) => {

        let newData = [..._items];
        if (newData[itemIndex] && newData[itemIndex].weekSchedule && newData[itemIndex].weekSchedule[day]) {
            const currentDaySchedule = [...newData[itemIndex].weekSchedule[day]];
            // Remove the time slot at the specified index (but keep at least one)
            if (currentDaySchedule.length > 1) {
                currentDaySchedule.splice(timeIndex, 1);
            }
            newData[itemIndex].weekSchedule[day] = currentDaySchedule;
        }

        handleNoneInputChange(newData);
    }

    const handleTimeChange = (itemIndex, day, timeIndex, field, value) => {
        let newData = [..._items];
        if (newData[itemIndex] && newData[itemIndex].weekSchedule && newData[itemIndex].weekSchedule[day]) {
            const currentDaySchedule = [...newData[itemIndex].weekSchedule[day]];
            currentDaySchedule[timeIndex] = {
                ...currentDaySchedule[timeIndex],
                [field]: parseInt(value)
            };
            newData[itemIndex].weekSchedule[day] = currentDaySchedule;
        }

        handleNoneInputChange(newData);
    }

    const handleAddSchedule = () => {
        const newSchedule = {
            weekSchedule: {
                monday: [{ h: 9, m: 0 }],
                tuesday: [{ h: 9, m: 0 }],
                wednesday: [{ h: 9, m: 0 }],
                thursday: [{ h: 9, m: 0 }],
                friday: [{ h: 9, m: 0 }],
                saturday: [{ h: 10, m: 0 }],
                sunday: [{ h: 10, m: 0 }],
            },
            targetPlatforms: [],
        };
        let newData = [..._items, newSchedule];
        handleNoneInputChange(newData);
    }
    // console.log('_items: ', _items);


    return (
        <div className="agenda-container w-full">
            <div className="flex flex-col gap-2">
                {
                    _items.map((item, index) => (
                        <div key={index} className="agenda-item p-3 rounded-md border bg-slate-50 border-gray-300 shadow-sm">
                            <div className="font-semibold mb-2">Schedule {index + 1}</div>

                            <div className="grid grid-cols-7 gap-2">
                                {
                                    weekdayOptions.map((dayObj, dayIndex) => {
                                        const day = dayObj.value;
                                        const timeSlots = item.weekSchedule[day];
                                        return (
                                            <div key={dayIndex} className="flex flex-col gap-2 p-0.5 border border-gray-300 rounded-md">
                                                <div className="text-start">
                                                    <span className="font-semibold text-sm">{dayObj.label}</span>
                                                </div>

                                                {/* Time slots for this day */}
                                                <div className="flex flex-1 flex-col gap-1">
                                                    {timeSlots.map((timeSlot, timeIndex) => (
                                                        <div key={timeIndex} className="flex flex-col gap-1 ">
                                                            <div className="flex items-center gap-0.5 text-xs">
                                                                <select
                                                                    value={timeSlot.h}
                                                                    onChange={(e) => handleTimeChange(index, day, timeIndex, 'h', e.target.value)}
                                                                    className="w-12 border border-gray-300 rounded px-1 py-0.5 text-xs"
                                                                >
                                                                    {Array.from({ length: 24 }, (_, i) => (
                                                                        <option key={i} value={i}>
                                                                            {i.toString().padStart(2, '0')}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <span>:</span>
                                                                <select
                                                                    value={timeSlot.m}
                                                                    onChange={(e) => handleTimeChange(index, day, timeIndex, 'm', e.target.value)}
                                                                    className="border border-gray-300 rounded px-1 py-0.5 text-xs w-12"
                                                                >
                                                                    {Array.from({ length: 12 }, (_, i) => (
                                                                        <option key={i} value={i * 5}>
                                                                            {(i * 5).toString().padStart(2, '0')}
                                                                        </option>
                                                                    ))}
                                                                </select>

                                                                {/* Remove button (only show if more than 1 time slot) */}
                                                                {timeSlots.length > 1 && (
                                                                    <button
                                                                        onClick={() => handleRemoveTimeSlot(index, day, timeIndex)}
                                                                        className="p-0.5 hover:bg-red-100 rounded text-red-500 transition-colors"
                                                                        title="Remove time slot"
                                                                        type="button"
                                                                    >
                                                                        <MinusIcon className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}


                                                </div>
                                                {/* Add time slot button */}
                                                <button
                                                    className="w-full p-1 border border-dashed border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center transition-colors"
                                                    onClick={() => handleAddTimeSlot(index, day)}
                                                    title="Add time slot"
                                                    type="button"
                                                >
                                                    <PlusIcon className="w-3 h-3 text-gray-400" />
                                                </button>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                            <div className="text-sm mt-4">Target Platforms</div>
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
