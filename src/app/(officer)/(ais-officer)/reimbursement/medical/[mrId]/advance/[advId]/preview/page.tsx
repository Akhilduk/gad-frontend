'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from '../../../../mr-book.module.css';
import { fetchProfilePreview2 } from '../../../../profile-mapper';
import { loadCases } from '../../../../mock-store';
import type { MRCase, OfficerProfileVM } from '../../../../mr-types';

export default function AdvancePreviewPage({ params }: { params: { mrId: string; advId: string } }) {
  const [profile, setProfile] = useState<OfficerProfileVM | null>(null);
  const [cases, setCases] = useState<MRCase[]>([]);
  const [otp, setOtp] = useState(false);
  const [receipt, setReceipt] = useState(false);
  useEffect(() => { fetchProfilePreview2().then(({ profile: p }) => { setProfile(p); setCases(loadCases(p)); }); }, []);
  const item = useMemo(() => cases.find((c) => c.mrId === params.mrId), [cases, params.mrId]);
  const adv = item?.advances.find((a) => a.advId === params.advId) || item?.advances[0];
  if (!item || !adv || !profile) return null;
  return <div className={styles.shellBg}><div className={styles.container}><section className={styles.page}><h1 className="text-xl font-semibold">Advance Request Preview Sheet</h1><p>MR No: {item.mrNo} | Advance No: {adv.advNo}</p><ol className="mt-2 list-decimal pl-5 text-sm space-y-1"><li>Name and office held: {profile.fullName}, {profile.designation}</li><li>Service: {profile.serviceType}</li><li>Present posting/office address: {profile.officePostingAddress}</li><li>Residential address: {profile.residentialAddress}</li><li>Patient name: {item.patient.name}</li><li>Relationship: {item.patient.relation}</li><li>Place of illness: {item.treatment.placeOfIllness}</li><li>Hospitalised: {item.treatment.hospitalised ? 'Yes' : 'No'} / {item.treatment.hospitalName}</li><li>Period: {item.treatment.fromDate} to {item.treatment.toDate || '—'}</li><li>Advance amount requested: ₹{adv.amount}</li><li>Annexure: estimate document</li></ol><p className="mt-3 text-sm">Declaration: I certify the information above is true.</p><div className="mt-3 flex gap-2"><button className="rounded border px-3 py-2" onClick={()=>window.print()}>Download Preview</button><button className="rounded border px-3 py-2" onClick={()=>setOtp(true)}>Submit with OTP eSign</button></div></section>{otp && <div className="fixed inset-0 bg-black/40 p-4"><div className="mx-auto mt-20 max-w-md rounded bg-white p-4"><p className="font-semibold">Are you sure?</p><p className="text-sm">Submitting amount ₹{adv.amount} with estimate attachment.</p><button className="mt-2 rounded border px-3 py-1" onClick={()=>{setOtp(false);setReceipt(true);}}>Confirm OTP</button></div></div>}{receipt && <section className="mt-3 rounded border bg-emerald-50 p-3 text-sm">Receipt: {adv.advNo} submitted at {new Date().toLocaleString()} signed by {profile.fullName}</section>}<Link href={`/reimbursement/medical/${item.mrId}`} className="text-sm underline">Back</Link></div></div>;
}
