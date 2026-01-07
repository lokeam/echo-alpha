'use client';

// Next
import { useRouter } from 'next/navigation';

// Components
import { Button } from '@/components/ui/button';
import { Hero } from '@/components/hero/hero';
import { HeroImage } from '@/components/hero-image/hero-image';
import { PageDivide } from '@/components/layout/page-divide';
import { FAQs } from '@/components/faqs/faqs';

export default function OverviewPage() {
  const router = useRouter();

  const handleContinueToDemo = () => {
    router.push('/demo');
  };

  return (
    <>
      <Hero />
      <PageDivide />
      <HeroImage />
      <PageDivide />
      <FAQs />
      <PageDivide />
      <div className="flex justify-center py-12">
        <Button onClick={handleContinueToDemo} size="lg">
          Continue to Demo →
        </Button>
      </div>
    </>
  );
}
