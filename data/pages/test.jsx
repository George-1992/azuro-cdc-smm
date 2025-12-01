'use client';
import { addModal, useModal } from "@/components/modals";
import { useEffect } from "react";


export default function Test({ params, pathname, searchParams, session, user, account }) {

    const { addModal } = useModal();


    useEffect(() => {
        let modalHandle;
        const thisModal = addModal({
            id: 'new_test_id',
            type: 'popup',
            title: 'new_test',
            component: () => (
                <div>Modal content</div>
            ),
            buttons: [
                {
                    label: 'Close',
                    className: 'btn btn-primary min-w-24',
                    onClick: () => {
                        console.log('Close clicked');
                        thisModal.close();
                    },
                },
                {
                    label: 'Save',
                    className: 'btn btn-primary min-w-24',
                    onClick: () => {
                        console.log('Save clicked');
                    },
                }
            ],
        });

        // push second modal after 2 seconds
        const secondModal = addModal({
            id: 'second_test_id',
            type: 'popup',
            title: 'Second Test Modal',
            component: () => (
                <div>Second Modal content</div>
            ),
        });
    }, []);

    return (
        <div className="container-main flex flex-col gap-4">
            <h1 className="text-2xl">Test</h1>

            <p>
                {pathname}
            </p>
        </div>
    );
}