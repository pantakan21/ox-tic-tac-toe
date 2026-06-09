'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  image?: string;
}

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const setToken = useUserStore((s) => s.setToken);

  useEffect(() => {
    const token = params.get('token');
    if (!token) { router.replace('/'); return; }

    try {
      const payload = jwtDecode<JwtPayload>(token);
      setToken(token, payload.name, payload.image);
      router.replace('/game');
    } catch {
      router.replace('/');
    }
  }, [params, router, setToken]);

  return <p className="text-center mt-20 text-gray-500">กำลังเข้าสู่ระบบ...</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p className="text-center mt-20 text-gray-500">กำลังโหลด...</p>}>
      <CallbackHandler />
    </Suspense>
  );
}
