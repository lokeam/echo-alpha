import { ShimmerEyebrow } from "@/components/shimmer-eyebrow/shimmer-eyebrow";
import { PageContainer } from "@/components/layout/page-container";
import { Heading } from "@/components/heading/heading";
import { SubHeading } from "@/components/subheading/subheading";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const Hero = () => {
  return (
    <PageContainer className="border-divide flex flex-col items-center justify-center border-x px-4 pt-10 pb-10 md:pt-32 md:pb-20">
      <ShimmerEyebrow text="Demo for Tandem" />
      <Heading className="mt-4">
        AI <span className="text-[#ff2727]">Email Assistant</span> for Office Leasing
      </Heading>

      <SubHeading className="mx-auto mt-6 max-w-lg">
        Demonstrating the human-in-the-loop AI co-pilot workflow
      </SubHeading>

      <div className="mt-6 flex items-center gap-4">
        <Button asChild>
          <Link href="/demo">
            Start Demo
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/pricing">
            View Use Case
          </Link>
        </Button>
      </div>

    </PageContainer>
  )
}