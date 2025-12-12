'use client';
import {
    saCreateItem, saDeleteItem,
    saGetItem,
    saGetItems, saUpdateItem
} from "@/components/serverActions.jsx";
import { notify } from "@/components/sonnar/sonnar";
import { useState, useEffect } from "react";
import { ExpandableModal, PopupModal } from "@/components/other/modals";
import Table from "@/components/table";
import { makeFirstLetterUppercase, toDisplayStr } from "@/utils/other";
import FormBuilder from "@/components/formBuilder";
import { languageOptions, socialMediaPlatforms, webhookTypes } from "@/data/types";
import Image from "next/image";
import { Building, TextInitial } from "lucide-react";
import Timezones from "@/data/tomezones.json";
import { TabContainer, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/other/tabs";
import { webhook } from "twilio/lib/webhooks/webhooks";


export default function Settings({ params, pathname, searchParams, session, user, account, org, orgs }) {


    const credentialProviders = {
        blotato: {
            label: 'Blotato',
            name: 'blotato',
            default: { apiKey: '' },
            logo: '/images/other/blotato-logo.webp',
        },
        elevenLabs: {
            label: 'ElevenLabs',
            name: 'elevenLabs',
            default: { apiKey: '', defaultVoiceId: '' },
            logo: '/images/other/elevenlabs-logo.png',
        },
        fal: {
            label: 'FAL',
            name: 'fal',
            default: { apiKey: '' },
            logo: '/images/other/fal-logo.png',
        },
        openRouter: {
            label: 'OpenRouter',
            name: 'openRouter',
            default: { apiKey: '' },
            logo: '/images/other/openrouter-logo.png',
        },
    }


    const webhooksDefault = {
        sources: '',
        avatars: ''
    };

    let preOrg = { ...org };
    preOrg.webhook = preOrg.webhook || '';
    // if (!preOrg.webhooks) {
    //     preOrg.webhooks = webhooksDefault;
    // }
    if (!preOrg.configs) {
        preOrg.configs = {};
    }

    Object.values(credentialProviders).forEach(provider => {
        if (!preOrg.configs[provider.name]) {
            preOrg.configs[provider.name] = {
                apiKey: ''
            };
        }
    });

    if (!preOrg.configs.accounts) {
        preOrg.configs.accounts = [
            // {
            //     name: 'snd Twitter Account',
            //     type: 'twitter',
            //     accountId: '',
            // }
        ];
    }

    const [_org, _setOrg] = useState(preOrg);
    const [formErrors, setFormErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const minLoadingTime = 500;



    // webhooks data
    const [isPopupOpen, setIsPopupOpen] = useState(false);


    const handleOrgUpdate = async (data) => {

        // console.log('handleOrgUpdate data: ', data);

        try {
            setIsLoading(true);
            setIsActionLoading(true);

            let toSaveData = data ? {
                name: data.name,
                webhook: data.webhook,
            } : {};
            // if (data.webhooks) {
            //     toSaveData.webhooks = data.webhooks;
            // }
            if (data.configs) {
                toSaveData.configs = data.configs;
            }

            // console.log('handleOrgUpdate toSaveData: ', data.id, toSaveData);
            // return;
            const _d = {
                collection: 'organizations',
                query: {
                    where: {
                        id: data.id
                    },
                    data: toSaveData
                }
            }

            const resData = await saUpdateItem(_d);


            if (resData && resData.success) {
                notify({
                    type: 'success',
                    message: 'Updated !',
                });
                _setOrg(resData.data);
            } else {
                notify({
                    type: 'error',
                    message: resData.message || 'Error updating organization',
                });
            }


        } catch (error) {
            console.error('Error in handleOrgUpdate: ', error);
        } finally {
            setIsLoading(false);
            setIsActionLoading(false);
        }
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleAccountUpdate = async (data) => {
        try {
            // // console.log('Form submitted with data: ', formData);
            // // compare to session if its the same then dont update
            // if (_org.firstName === session?.first_name &&
            //     _org.lastName === session?.last_name &&
            //     _org.email === session?.email
            // ) {
            //     notify({
            //         type: 'warning',
            //         message: 'No changes detected',
            //     })
            //     return;
            // }

            const startTimestamp = Date.now();
            setIsLoading(true);
            setIsActionLoading(true);

            let toSaveData = {
                name: data.name,
                webhooks: data.webhooks || {}
            };
            // console.log('data: ', data);
            // console.log('toSaveData: ', toSaveData);


            const resObj = await saUpdateItem({
                collection: 'accounts',
                query: {
                    where: {
                        id: account?.id
                    },
                    data: toSaveData
                },
            })

            const endTimestamp = Date.now();
            const elapsed = endTimestamp - startTimestamp;
            if (elapsed < minLoadingTime) {
                await new Promise(res => setTimeout(res, minLoadingTime - elapsed));
            }
            setIsLoading(false);
            setIsActionLoading(false);

            // console.log('resObj ==> ', resObj);
            if (resObj.success) {
                notify({
                    type: 'success',
                    message: 'Updated successfully',
                })
                setFormData(toSaveData);
            } else {
                notify({
                    type: 'error',
                    message: resObj.message || 'Error updating profile',
                })
            }


        } catch (error) {
            setIsLoading(false);
            setIsActionLoading(false);
            console.error('Error in handleFirstForm: ', error);
        }
    };



    // fetch users
    useEffect(() => {
        async function body() {
            try {
                setIsLoading(true);


                const thisOrg = await saGetItem({
                    collection: 'organizations',
                    query: {
                        where: {
                            id: org.id
                        },
                    }
                });
                console.log('thisOrg: ', thisOrg);

                if (thisOrg && thisOrg.success && thisOrg.data) {
                    _setOrg(thisOrg.data);
                }



            } catch (error) {
                console.error('Error fetching users: ', error);
            } finally {
                setIsLoading(false);
            }
        };
        body();
    }, []);



    // // if typing removes errors if any
    // const str1 = Object.values(formData).join(', ');
    // useEffect(() => {
    //     if (Object.keys(formErrors).length > 0) {
    //         setFormErrors({});
    //     }
    // }, [str1]);


    // console.log('_org: ', _org);



    return (
        <div className="container-main flex flex-col gap-6">
            <div>
                <h2 className="text-xl mb-2">Account </h2>
                <div className="card-1 flex flex-col gap-3">
                    <div className="md:flex-row gap-6 items-start justify-start ">
                        <span>
                            Account Id
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            value={account?.id || ''}
                            disabled={true}
                        />
                    </div>
                </div>

            </div>

            <Tabs>
                <TabsList>
                    <TabsTrigger value="general" className="mr-2">
                        General
                    </TabsTrigger>
                    <TabsTrigger value="webhooks" className="mr-2">
                        Webhooks
                    </TabsTrigger>
                    <TabsTrigger value="credentials" className="mr-2">
                        Credentials
                    </TabsTrigger>
                    <TabsTrigger value="accounts" className="mr-2">
                        Accounts
                    </TabsTrigger>
                    <TabsTrigger value="context" className="mr-2">
                        Context
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <div>
                        <div className="card-1 flex flex-col gap-3">
                            <div className="flex gap-3  items-center">
                                <Building className="size-5" />
                                <span className="text-xl">Organization</span>
                            </div>
                            <FormBuilder
                                formData={_org}
                                onSubmit={handleOrgUpdate}
                                fields={[
                                    {
                                        name: 'id',
                                        label: 'Organization ID',
                                        placeholder: 'Enter organization ID',
                                        required: true,
                                        disabled: true,
                                    },
                                    {
                                        name: 'name',
                                        label: 'Organization Name',
                                        placeholder: 'Enter organization name',
                                        required: true,
                                    },
                                    {
                                        name: 'timezone',
                                        label: 'Timezone',
                                        placeholder: 'Select timezone',
                                        required: true,
                                        type: 'select',
                                        searchable: true,
                                        options: Timezones.map(zone => ({
                                            value: zone.zone,
                                            label: `${zone.name} ${zone.gmt}`
                                        })),
                                    }
                                ]}
                            />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="webhooks">
                    {/* webhooks */}
                    {/* webhooks for sources and avatars */}
                    <div className="card-1 ">
                        <div className="flex gap-3 items-center">
                            <Image
                                src={'/images/other/n8n-logo.svg'}
                                alt={'n8n Logo'}
                                width={40}
                                height={40}
                            />
                            <span className="text-xl">
                                Webhooks n8n
                            </span>
                        </div>
                        <FormBuilder
                            formData={_org || {}}
                            isLoading={isActionLoading}
                            fields={[{
                                name: 'webhook',
                                label: `n8n webhook URL`,
                                placeholder: `Enter your n8n webhook URL`,
                                type: 'url',
                                required: true,
                                hidden: false,
                                disabled: false,
                                validator: 'url',
                                defaultValue: _org.webhook || ''
                            }
                            ]}
                            onSubmit={(data) => {
                                // console.log('data: ', data);

                                let newOrg = { ..._org };
                                newOrg.webhook = data.webhook;
                                // console.log('newOrg: ', newOrg);

                                handleOrgUpdate(newOrg);
                                setIsPopupOpen(false);

                            }}
                        />
                        {/* <FormBuilder
                            formData={_org.webhooks || {}}
                            isLoading={isActionLoading}
                            fields={
                                webhookTypes.map(whType => ({
                                    name: whType,
                                    label: `${makeFirstLetterUppercase(whType)} Webhook`,
                                    placeholder: `Enter your ${whType} webhook URL`,
                                    type: 'url',
                                    required: true,
                                    hidden: false,
                                    disabled: false,
                                    validator: 'url'
                                }))
                            }
                            onSubmit={(data) => {
                                handleOrgUpdate({
                                    ..._org,
                                    webhooks: data
                                });
                                setIsPopupOpen(false);
                            }}
                        /> */}

                    </div>
                </TabsContent>
                <TabsContent value="credentials">
                    <div className="flex flex-col gap-6">
                        {
                            Object.keys(credentialProviders).map((key) => {
                                const provider = credentialProviders[key];

                                const editFields = [];
                                Object.keys(provider.default).forEach(configKey => {
                                    editFields.push({
                                        name: configKey,
                                        label: provider.default[configKey].label,
                                        placeholder: ` Enter your ${toDisplayStr(configKey)}`,
                                        defaultValue: _org.configs[provider.name]
                                            ? _org.configs[provider.name][configKey] || ''
                                            : '',
                                        validatorKey: 'length',
                                    });
                                });

                                return (
                                    <div className="card-1 flex flex-col gap-3" key={provider.name}>
                                        <div className="flex gap-3 items-center">
                                            <Image
                                                src={provider.logo}
                                                alt={`${provider.name} Logo`}
                                                width={35}
                                                height={35}
                                            />
                                            <span className="text-xl">{provider.label}</span>
                                        </div>
                                        <FormBuilder
                                            formData={_org.configs[provider.name] || {}}
                                            isLoading={isActionLoading}
                                            fields={editFields}
                                            onSubmit={(data) => {
                                                let newOrg = { ..._org };
                                                newOrg.configs = newOrg.configs || {};
                                                newOrg.configs[provider.name] = data;
                                                handleOrgUpdate(newOrg);
                                            }}
                                        />
                                    </div>
                                );
                            })}
                    </div>
                </TabsContent>
                <TabsContent value="accounts">
                    <div className="card-1 flex flex-col gap-4">
                        <div className="flex gap-3 items-center justify-between">
                            <div className="flex gap-3 items-center">
                                <Building className="size-5" />
                                <span className="text-xl">Social Media Accounts</span>
                            </div>
                        </div>

                        <div className="w-full relative rounded-md overflow-x-auto">
                            <Table
                                className="min-w-full"
                                editable={true}
                                editableInline={false}
                                allowAddNew={true}
                                actions={['edit', 'delete']}
                                tableExcludeKeys={['configs']}
                                editRenderOrder={[
                                    ['type'],
                                    ['name'],
                                    ['accountId'],
                                ]}
                                columns={[
                                    {
                                        key: 'type',
                                        title: 'type',
                                        width: 'w-32',
                                        type: 'select',
                                        options: socialMediaPlatforms,
                                        required: true,
                                        placeholder: 'Select platform',
                                    },
                                    {
                                        key: 'name',
                                        title: 'Name',
                                        width: 'w-48',
                                        type: 'text',
                                        required: true,
                                        validateKey: 'length',
                                        placeholder: 'e.g. Main Instagram Account'
                                    },
                                    {
                                        key: 'accountId',
                                        title: 'Account ID',
                                        width: 'w-40',
                                        type: 'text',
                                        required: true,
                                        placeholder: 'enter account id',
                                    },
                                ]}
                                data={_org?.configs?.accounts || []}
                                onAddNew={async (item) => {
                                    try {
                                        const newAccounts = [...(_org?.configs?.accounts || []), {
                                            ...item,
                                            id: Date.now().toString(), // Simple ID generation
                                            createdAt: new Date().toISOString()
                                        }];

                                        const newOrg = {
                                            ..._org,
                                            configs: {
                                                ..._org.configs,
                                                accounts: newAccounts
                                            }
                                        };

                                        await handleOrgUpdate(newOrg);
                                        return { success: true, message: 'Account added successfully' };
                                    } catch (error) {
                                        return { success: false, message: 'Failed to add account' };
                                    }
                                }}
                                onRowChange={async (item) => {
                                    try {
                                        const updatedAccounts = (_org?.configs?.accounts || []).map(acc =>
                                            acc.id === item.id ? { ...acc, ...item } : acc
                                        );

                                        const newOrg = {
                                            ..._org,
                                            configs: {
                                                ..._org.configs,
                                                accounts: updatedAccounts
                                            }
                                        };

                                        await handleOrgUpdate(newOrg);
                                        return { success: true, message: 'Account updated successfully' };
                                    } catch (error) {
                                        return { success: false, message: 'Failed to update account' };
                                    }
                                }}
                                onRowDelete={async (item) => {
                                    try {
                                        const filteredAccounts = (_org?.configs?.accounts || []).filter(acc =>
                                            acc.id !== item.id
                                        );

                                        const newOrg = {
                                            ..._org,
                                            configs: {
                                                ..._org.configs,
                                                accounts: filteredAccounts
                                            }
                                        };

                                        await handleOrgUpdate(newOrg);
                                        return { success: true, message: 'Account deleted successfully' };
                                    } catch (error) {
                                        return { success: false, message: 'Failed to delete account' };
                                    }
                                }}
                                onChange={(newData) => {
                                    console.log('Accounts data changed: ', newData);
                                }}
                            />
                        </div>

                        <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
                            <strong>Note:</strong> These are your social media accounts that can be used in publications.
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="context">
                    <div className="card-1 flex flex-col gap-3">
                        <div className="flex gap-3  items-center">
                            <TextInitial className="size-5" />
                            <span className="text-xl">Default creation context</span>
                        </div>
                        <FormBuilder
                            formData={_org.configs || {}}
                            isLoading={isActionLoading}
                            fields={[
                                {
                                    name: 'language',
                                    label: 'Preferred language',
                                    type: 'select',
                                    options: languageOptions,
                                },
                                {
                                    name: 'context',
                                    label: 'Default creation context',
                                    type: 'textarea',
                                    placeholder: `Enter your default creation context`,
                                    required: true,
                                    validatorKey: 'length'
                                },
                                {
                                    name: 'targetAudience',
                                    label: 'Target audience',
                                    type: 'textarea',
                                    placeholder: `Enter your target audience (persona description; optional)`,
                                    required: true,
                                    validatorKey: 'length'
                                },

                            ]}
                            onSubmit={(data) => {
                                let newOrg = { ..._org };
                                newOrg.configs = newOrg.configs || {};
                                newOrg.configs.language = data.language;
                                newOrg.configs.context = data.context;
                                newOrg.configs.targetAudience = data.targetAudience;
                                handleOrgUpdate(newOrg);
                            }}
                        />
                    </div>

                </TabsContent>

                <TabsContent value="other">
                    other
                </TabsContent>
            </Tabs>











            {/* <PopupModal isOpen={isPopupOpen} onClose={() => { setIsPopupOpen(!isPopupOpen) }}>
            </PopupModal> */}
        </div>
    );
}