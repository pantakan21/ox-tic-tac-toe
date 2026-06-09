'use client';

import { useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="text-slate-300 hover:text-white text-sm cursor-pointer"
    >
      ← กลับ
    </button>
  );
}
