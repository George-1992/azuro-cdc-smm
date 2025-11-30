
'use client';
import { useState, useEffect } from 'react';
import { saGetItems } from '@/components/serverActions.jsx';
import { Database, MegaphoneIcon, CalendarSyncIcon, SquareUser, SquareUserIcon, LibraryBigIcon, SquareArrowOutUpRightIcon, NewspaperIcon } from 'lucide-react';
import Loading from '@/components/other/loading';
import Link from 'next/link';

export default function Home({ params, pathname, searchParams, session, user, account, org, orgs }) {

    const [collectionCounts, setCollectionCounts] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const collections = [
        {
            name: 'campaigns',
            label: 'Campaigns',
            icon: MegaphoneIcon,
            color: 'bg-blue-500',
            description: 'Active marketing campaigns',
            link: '/campaigns',
        },
        // {
        //     name: 'week_templates',
        //     label: 'Week Templates',
        //     icon: CalendarSyncIcon,
        //     color: 'bg-green-500',
        //     description: 'Weekly content templates',
        //     link: '/week-templates',
        // },
        {
            name: 'avatars',
            label: 'Avatars',
            icon: SquareUserIcon,
            color: 'bg-purple-500',
            description: 'Content creation avatars',
            link: '/avatars',
        },
        {
            name: 'sources',
            label: 'Sources',
            icon: LibraryBigIcon,
            color: 'bg-orange-500',
            description: 'Content sources and inspiration',
            link: '/sources',
        },
        {
            name: 'publications',
            label: 'Publications',
            icon: NewspaperIcon,
            color: 'bg-amber-500',
            description: 'Content publications and articles',
            link: '/publications',
        },
        {
            name: 'medias',
            label: 'Medias',
            icon: Database,
            color: 'bg-red-500',
            description: 'Media assets and files',
            link: '/medias',
        }
    ];

    // Fetch counts for each collection
    useEffect(() => {
        const fetchCounts = async () => {
            if (!org?.id) return;

            setIsLoading(true);
            const counts = {};

            try {
                // Fetch counts for each collection
                for (const collection of collections) {
                    const response = await saGetItems({
                        collection: collection.name,
                        query: {
                            where: {
                                org_id: org.id
                            }
                        }
                    });

                    counts[collection.name] = response?.success ? (response.data?.length || 0) : 0;
                }

                setCollectionCounts(counts);
            } catch (error) {
                console.error('Error fetching collection counts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCounts();
    }, [org?.id]);

    return (
        <div className="container-main flex flex-col gap-6 bg-">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <div className="text-sm text-gray-500">
                    {org?.name || 'No organization selected'}
                </div>
            </div>

            {/* Collection Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {collections.map((collection) => {
                    const IconComponent = collection.icon;
                    const count = collectionCounts[collection.name] || 0;

                    return (
                        <div
                            key={collection.name}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 ${collection.color} rounded-lg flex items-center justify-center`}>
                                    <IconComponent className="w-6 h-6 text-white" />
                                </div>
                                {isLoading ? (
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="text-2xl font-bold text-gray-900">
                                        {count}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {collection.label}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {collection.description}
                                </p>
                            </div>

                            {/* Progress indicator or status */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center text-xs text-gray-400">
                                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                                    {count === 0 ? 'No items yet' : `${count} total items`}


                                    {/* link */}
                                    <div className="ml-auto">
                                        <Link
                                            href={collection.link}
                                            className=""
                                        >
                                            <SquareArrowOutUpRightIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Stats Summary */}
            <div className="bg-gray-100 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-blue-600">
                            {collectionCounts.campaigns || 0}
                        </div>
                        <div className="text-sm text-gray-600">Campaigns</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-green-600">
                            {collectionCounts.week_templates || 0}
                        </div>
                        <div className="text-sm text-gray-600">Templates</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-purple-600">
                            {collectionCounts.avatars || 0}
                        </div>
                        <div className="text-sm text-gray-600">Avatars</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-orange-600">
                            {collectionCounts.sources || 0}
                        </div>
                        <div className="text-sm text-gray-600">Sources</div>
                    </div>
                </div>
            </div>

            {/* Recent Activity placeholder */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                <div className="text-sm text-gray-500">
                    Activity tracking coming soon...
                </div>
            </div>
        </div>
    );
}