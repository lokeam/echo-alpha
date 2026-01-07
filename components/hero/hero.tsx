"use client";

import { ShimmerEyebrow } from "@/components/shimmer-eyebrow/shimmer-eyebrow";
import { PageContainer } from "@/components/layout/page-container";
import { Heading } from "@/components/heading/heading";
import { SubHeading } from "@/components/subheading/subheading";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const Hero = () => {
  const scrollToFAQs = () => {
    const faqsSection = document.getElementById('faqs-section');
    if (faqsSection) {
      faqsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <PageContainer className="border-divide flex flex-col items-center justify-center border-x px-4 pt-10 pb-10 md:pt-32 md:pb-20">
      <ShimmerEyebrow text="AI Email Assistant Demo" />
      <Heading className="mt-4">
        AI <span className="text-brand">Email Assistant</span> for Office Leasing
      </Heading>

      <SubHeading className="mx-auto mt-6 max-w-lg">
        Demonstrating the human-in-the-loop AI co-pilot workflow
      </SubHeading>

      <div className="mt-6 flex items-center gap-4 cursor-pointer">
        <Button asChild>
          <Link href="/demo">
            Start Demo
          </Link>
        </Button>
        <Button
          variant="secondary"
          onClick={scrollToFAQs}
          className="cursor-pointer"
        >
          View Use Case in FAQs
        </Button>
      </div>

    </PageContainer>
  )
}