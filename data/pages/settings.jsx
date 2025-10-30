'use client';
import {
    saCreateItem, saDeleteItem,
    saGetItem,
    saGetItems, saUpdateItem
} from "@/components/serverActions.jsx";
import { notify } from "@/components/sonnar/sonnar";
import { useState, useEffect, use } from "react";
import { ExpandableModal, PopupModal } from "@/components/other/modals";
import Table from "@/components/table";
import { makeFirstLetterUppercase } from "@/utils/other";
import FormBuilder from "@/components/formBuilder";
import { webhookTypes } from "@/data/types";
import Image from "next/image";
import { Building, TextInitial } from "lucide-react";



export default function Settings({ params, pathname, searchParams, session, user, account, org, orgs }) {


    const blotato = {
        apiKey: ''
    }
    const webhooksDefault = {
        sources: '',
        avatars: ''
    };

    let preOrg = { ...org };
    if (!preOrg.webhooks) {
        preOrg.webhooks = webhooksDefault;
    }
    if (!preOrg.configs) {
        preOrg.configs = {};
    }
    if (!preOrg.configs.blotato) {
        preOrg.configs.blotato = blotato;
    }

    const [_org, _setOrg] = useState(preOrg);
    const [formErrors, setFormErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const minLoadingTime = 500;



    // webhooks data
    const [isPopupOpen, setIsPopupOpen] = useState(false);


    const handleOrgUpdate = async (data) => {


        try {
            setIsLoading(true);
            setIsActionLoading(true);

            let toSaveData = data ? {
                name: data.name,
            } : {};
            if (data.webhooks) {
                toSaveData.webhooks = data.webhooks;
            }
            if (data.configs) {
                toSaveData.configs = data.configs;
            }


            const resData = await saUpdateItem({
                collection: 'organizations',
                query: {
                    where: {
                        id: _org.id
                    },
                    data: toSaveData
                }
            });
            // console.log('resData: ', resData);




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
    }



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
            {/* <h1 className="text-2xl">Settings </h1> */}

            {/* general inputs */}
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

            {/* Organization */}
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
                            }
                        ]}


                    />
                </div>
            </div>


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
                />

            </div>

            {/* Blotato */}
            <div className="card-1 flex flex-col gap-3">
                <div className="flex gap-3 items-center">
                    <Image
                        src={'/images/other/blotato-logo.webp'}
                        alt={'Blotato Logo'}
                        width={40}
                        height={40}
                    />
                    <span className="text-xl">Blotato</span>
                </div>
                <FormBuilder
                    formData={_org.configs.blotato || {}}
                    isLoading={isActionLoading}
                    fields={[
                        {
                            name: 'apiKey',
                            label: 'Blotato API key',
                            placeholder: `Enter your blotato webhook URL`,
                            required: true,
                            hidden: false,
                            disabled: false,
                            validator: 'length'
                        }
                    ]}
                    onSubmit={(data) => {
                        handleOrgUpdate({
                            ..._org,
                            configs: {
                                ..._org.configs,
                                blotato: data
                            }
                        });
                    }}
                />
            </div>

            {/* ElevenLabs */}
            <div className="card-1 flex flex-col gap-3">
                <div className="flex gap-3 items-center">
                    <Image
                        src={'/images/other/elevenlabs-logo.png'}
                        alt={'ElevenLabs Logo'}
                        width={40}
                        height={40}
                    />
                    <span className="text-xl">ElevenLabs</span>
                </div>
                <FormBuilder
                    formData={_org.configs.elevenLabs || {}}
                    isLoading={isActionLoading}
                    fields={[
                        {
                            name: 'apiKey',
                            label: 'ElevenLabs API key',
                            placeholder: `Enter your elevenLabs API key`,
                            required: true,
                            hidden: false,
                            disabled: false,
                            validator: 'length'
                        },
                        {
                            name: 'defaultVoiceId',
                            label: 'ElevenLabs Default Voice ID',
                            placeholder: `Enter your elevenLabs Default Voice ID`,
                            required: true,
                            hidden: false,
                            disabled: false,
                            validator: 'length'
                        }
                    ]}
                    onSubmit={(data) => {
                        handleOrgUpdate({
                            ..._org,
                            configs: {
                                ..._org.configs,
                                elevenLabs: data
                            }
                        });
                    }}
                />
            </div>


            {/* context */}
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
                            options: [
                                { value: 'en', label: 'English' },
                                { value: 'es', label: 'Spanish' },
                                { value: 'fr', label: 'French' },
                                { value: 'de', label: 'German' },
                            ]
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






            {/* <PopupModal isOpen={isPopupOpen} onClose={() => { setIsPopupOpen(!isPopupOpen) }}>
            </PopupModal> */}
        </div>
    );
}