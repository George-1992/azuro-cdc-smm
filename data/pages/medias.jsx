'use client';
import Loading from "@/components/other/loading";
import Table from "@/components/table";
import { useState, useEffect } from "react";
import allTypes, { avatarTones } from "@/data/types";
import MediaLibrary from "@/components/mediaLibrary";


export default function MediaLibraryPage({ pathname, user, account, session, org }) {

    const orgId = org ? org.id : null;
    const collectionName = 'avatars';
    const [isLoading, setIsLoading] = useState(true);
    const [_data, _setData] = useState([]);
    const [_dataOriginal, _setDataOriginal] = useState([]);





    return (
        <div className="container-main w-full flex flex-col gap-6">
            <h1 className="text-2xl flex items-center gap-2">
                Media Library
            </h1>


            <div className="w-full">
                <MediaLibrary
                    allowEdit={true}
                    org={org}
                />
            </div>

        </div>
    );
}