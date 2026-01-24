import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Redirect /about to /faq for now
export default function AboutPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/faq');
  }, [router]);

  return null;
}
