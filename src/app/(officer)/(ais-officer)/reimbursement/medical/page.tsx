'use client';

import Link from 'next/link';
import { type ComponentType, type SVGProps, useMemo, useState } from 'react';
import {
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { medicalCases, statusClasses, type CaseStatus } from './data';

const metricConfig: { title: string; count: number; icon: ComponentType<SVGProps<SVGSVGElement>>; filter: CaseStatus | 'all' }[] = [
  { title: 'Active Drafts', count: 2, icon: DocumentTextIcon, filter: 'Draft' },
  { title: 'Advance Requested', count: 1, icon: BanknotesIcon, filter: 'Advance Pending' },
  { title: 'Pending Final', count: 3, icon: ClockIcon, filter: 'Ready to Submit' },
  { title: 'Paid & Closed', count: 1, icon: CheckCircleIcon, filter: 'Paid & Closed' },
];

export default function MedicalReimbursementPage() {
  const [activeFilter, setActiveFilter] = useState<CaseStatus | 'all'>('all');

  const filteredCases = useMemo(
    () => (activeFilter === 'all' ? medicalCases : medicalCases.filter((item) => item.status === activeFilter)),
    [activeFilter],
  );

  return (
    <div className="space-y-6 animate-[fadeIn_300ms_ease]">
      <header className="sticky top-0 z-10 rounded-xl border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Medical Reimbursement</h1>
            <p className="text-sm text-slate-500">Manage your medical claims and advances</p>
          </div>
          <Link
            href="/reimbursement/medical/MR-2026-00123"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E4A7A] to-[#2b6cb0] px-5 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <PlusIcon className="h-5 w-5" />
            New Reimbursement
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricConfig.map(({ title, count, icon: Icon, filter }) => (
          <button
            key={title}
            onClick={() => setActiveFilter((curr) => (curr === filter ? 'all' : filter))}
            className={`rounded-xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md ${
              activeFilter === filter ? 'border-[#1E4A7A]' : 'border-slate-200'
            }`}
          >
            <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-2 text-[#1E4A7A]">
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{count}</p>
          </button>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Your Reimbursement Cases</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">MR No. & Date</th>
                <th className="px-4 py-3">Claim For</th>
                <th className="px-4 py-3">Hospital/Treatment</th>
                <th className="px-4 py-3">Financial Summary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((item) => (
                <tr key={item.mrNo} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-4">
                    <Link href={`/reimbursement/medical/${item.mrNo}`} className="font-mono text-sm font-semibold text-[#1E4A7A] hover:underline">
                      {item.mrNo}
                    </Link>
                    <p className="text-xs text-slate-500">Created: {item.createdOn}</p>
                  </td>
                  <td className="px-4 py-4">{item.claimFor}</td>
                  <td className="max-w-48 truncate px-4 py-4">{item.hospital}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-1 text-xs text-slate-600">
                      {item.financial.map((line) => (
                        <p key={line} className={line.includes('Net Claim') ? 'font-bold text-slate-900' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[item.status]}`}>{item.status.toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/reimbursement/medical/${item.mrNo}`}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          item.primaryAction.includes('Submit')
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-[#1E4A7A] text-white hover:bg-[#143554]'
                        }`}
                      >
                        {item.primaryAction}
                      </Link>
                      <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
