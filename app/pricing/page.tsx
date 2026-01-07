'use client';

import Link from 'next/link';

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Icons
import { Check } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '3 AI refinements per email',
        '24-hour cooldown after limit',
        'Basic email generation',
        'Version history',
        'Manual editing',
      ],
      limitations: [
        'Limited refinements',
        'Cooldown period applies',
      ],
      cta: 'Current Plan',
      current: true,
    },
    {
      name: 'Professional',
      price: '$49',
      period: 'per month',
      description: 'For power users who need more',
      features: [
        'Unlimited AI refinements',
        'No cooldown periods',
        'Advanced email generation',
        'Version history',
        'Priority support',
        'Custom templates',
      ],
      cta: 'Upgrade to Pro',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For teams and organizations',
      features: [
        'Everything in Professional',
        'Unlimited team members',
        'Custom AI training',
        'Dedicated support',
        'SLA guarantees',
        'Advanced analytics',
        'API access',
      ],
      cta: 'Contact Sales',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Unlock unlimited AI refinements and more with our premium plans
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular
                  ? 'border-brand border-2 shadow-lg'
                  : plan.current
                  ? 'border-gray-300'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-brand text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-600 ml-2">/ {plan.period}</span>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-green-600 mr-2 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations && (
                  <div className="mb-6 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                    <p className="text-xs font-semibold text-yellow-800 mb-2">
                      Limitations:
                    </p>
                    <ul className="space-y-1">
                      {plan.limitations.map((limitation) => (
                        <li key={limitation} className="text-xs text-yellow-700">
                          • {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'bg-brand hover:bg-brand/90 text-white'
                      : plan.current
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                  disabled={plan.current}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/drafts">
            <Button variant="outline">← Back to Drafts</Button>
          </Link>
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            💡 Why upgrade?
          </h3>
          <p className="text-blue-800 mb-4">
            With unlimited refinements, you can iterate on your emails as many times as needed
            to get the perfect message. No waiting, no limits.
          </p>
          <ul className="grid md:grid-cols-2 gap-3 text-sm text-blue-700">
            <li className="flex items-start">
              <Check className="h-4 w-4 text-blue-600 mr-2 shrink-0 mt-0.5" />
              Perfect your messaging without constraints
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-blue-600 mr-2 shrink-0 mt-0.5" />
              No 24-hour cooldown periods
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-blue-600 mr-2 shrink-0 mt-0.5" />
              Faster response times for urgent deals
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-blue-600 mr-2 shrink-0 mt-0.5" />
              Close more deals with better communication
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
