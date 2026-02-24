'use client'

import { useState } from 'react'
import Link from 'next/link';

import {
    CheckCircleIcon,PencilSquareIcon,PlusIcon,
  } from '@heroicons/react/16/solid'

 
import { ModalRoleDetails } from '../modal/role-details'

const products = [
    {
        slno: "1",
        statename: "Role Name 1",
    },
    {
        slno: "2",
        statename: "Role Name 2",
    },
    {
        slno: "3",
        statename: "Role Name 3",
    },
    // Add more items as needed
];

export default function RoleList() {
    const [isModalOpen, setModalOpen] = useState(false)

    return (
        <>
        <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
            <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900  flex justify-between items-center">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Role List</h3>
                <button type="button" className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  onClick={() => setModalOpen(true)} >
                  Add Role<PlusIcon aria-hidden="true" className="-mr-0.5 size-5" />
                </button>
                <ModalRoleDetails open={isModalOpen} setOpen={setModalOpen} />
            </div>
            <div className="mx-auto max-w-12xl">
                <table className="table-auto w-full text-left border-collapse">
                    <thead className="text-gray-600 text-sm">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sl. No</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State Name</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right ">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, index) => (
                            <tr key={index} className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700">
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{product.slno}</td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{product.statename}</td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                                    <button type="button" className="float-right inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-indigo-500 hover:ring-indigo-500 px-2.5 py-1.5 text-sm font-semibold text-grey  "
                                        onClick={() => setModalOpen(true)} >
                                        Edit <PencilSquareIcon aria-hidden="true" className="-mr-0.5 size-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        <ModalRoleDetails open={isModalOpen} setOpen={setModalOpen} />
        </>
    );
}

