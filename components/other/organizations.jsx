'use client';
import { useState, useEffect } from "react";

import { Dropdown } from "@/components/other/dropdown";
import { BuildingIcon, ChevronsUpDownIcon, ListChevronsUpDownIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/libs/utils";

export default function Organizations({ session, user, account, isCollapsed = false, org, orgs }) {
    // console.log('org ==> ', org);

    const [orgId, setOrgId] = useState(org ? org.id : null);

    const theOrg = orgs && orgId ? orgs.find(o => o.id === orgId) : null;


    const getAllOrgs = () => {
        // exclude selected org from the list
        if (!orgs) {
            return [];
        }
        if (orgs && orgId) {
            return orgs.filter(o => o.id !== orgId);
        }
        return orgs;
    };

    const handleOrgChange = (newOrgId) => {
        setOrgId(newOrgId);
    };

    const handleAddNewOrg = () => {
        // redirect to org creation page
        // window.location.href = '/organizations/create';
    }


    return (
        <Dropdown fixed={true} align="right" className="w-full py-2">
            <div
                data-type="trigger"
                className={cn(
                    'w-full h-14 flex gap-1 items-center justify-between text-sm bg-gray-200 rounded-md hover:bg-gray-300 transition-colors',
                    isCollapsed ? 'justify-center' : 'p-2'
                )}
            >
                <div className="flex gap-2 items-center justify-center">
                    <BuildingIcon className="size-5" />
                    <span className={isCollapsed ? 'hidden' : ''}>
                        {theOrg && theOrg.name ? theOrg.name : 'No Organization'}
                    </span>
                </div>

                {!isCollapsed && <ChevronsUpDownIcon className="size-4" />}
            </div>
            <div data-type="content" className="w-64 right-0">
                <div className="py-1">
                    {
                        getAllOrgs().length === 0 &&
                        <div className="px-4 py-2 text-sm text-gray-500">
                            No other organizations available.
                        </div>
                    }
                    {
                        getAllOrgs().length > 0 && getAllOrgs().map((o) => (
                            <button
                                key={o.id}
                                onClick={() => handleOrgChange(o.id)}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                {o.name}
                            </button>
                        ))
                    }

                    {/* separator */}
                    <div className="border-t border-gray-200 my-1"></div>
                    {/* add new org */}
                    <div className="px-4 py-2">
                        <button
                            onClick={handleAddNewOrg}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                            <PlusIcon className="size-4" />
                            <span>Create New Organization</span>
                        </button>
                    </div>
                </div>
            </div>
        </Dropdown>
    );
}