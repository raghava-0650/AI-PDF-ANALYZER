"use client"
import React, { useState } from 'react';

import { useMutation, useQuery } from 'convex/react';
import {
  Check,
  Crown,
  LoaderCircle,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';

const FREE_FEATURES = [
  '5 PDF uploads',
  'Chat with your PDFs',
  'AI summaries & notes',
  'Export notes to Word',
];

const PRO_FEATURES = [
  'Unlimited PDF uploads',
  'Chat with your PDFs',
  'AI summaries & notes',
  'Export notes to Word',
  'Priority support',
];

function UpgradePlans() {
  const userUpgradePlan = useMutation(api.user.userUpgradePlan);
  const { user } = useUser();
  const userInfo = useQuery(api.user.GetUserInfo, {
    userEmail: user?.primaryEmailAddress?.emailAddress,
  });
  const [paying, setPaying] = useState(false);

  const isUpgraded = !!userInfo?.upgrade;

  const onPaymentSuccess = async () => {
    await userUpgradePlan({
      userEmail: user?.primaryEmailAddress?.emailAddress,
    });
    toast.success('Welcome to Unlimited! 🎉');
  };

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async () => {
    setPaying(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Razorpay SDK failed to load');

      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount: 10 }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || 'Could not create order');

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'Papermind AI',
        description: 'Unlimited Plan',
        order_id: order.id,
        handler: async function (response) {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            body: JSON.stringify(response),
          });
          const result = await verifyRes.json();
          if (result.success) {
            await onPaymentSuccess();
          } else {
            toast.error('Payment verification failed');
          }
        },
        prefill: { email: user?.primaryEmailAddress?.emailAddress },
        theme: { color: '#6366f1' },
      };

      new window.Razorpay(options).open();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Plans</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Start free. Upgrade once, keep it forever.
      </p>

      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Free plan */}
        <div className="rounded-3xl border bg-card p-8 shadow-xs">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Free</h3>
          </div>
          <p className="mt-4">
            <span className="text-4xl font-extrabold">₹0</span>
            <span className="text-sm text-muted-foreground"> / forever</span>
          </p>

          <ul className="mt-6 space-y-2.5">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 shrink-0 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>

          <Button variant="outline" className="mt-8 w-full" disabled>
            {isUpgraded ? 'Included' : 'Current plan'}
          </Button>
        </div>

        {/* Unlimited plan */}
        <div className="relative rounded-3xl border-2 border-primary bg-card p-8 shadow-lg shadow-primary/10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
            Most popular
          </div>
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <h3 className="font-semibold">Unlimited</h3>
          </div>
          <p className="mt-4">
            <span className="text-4xl font-extrabold">₹10</span>
            <span className="text-sm text-muted-foreground"> / one-time</span>
          </p>

          <ul className="mt-6 space-y-2.5">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 shrink-0 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>

          {isUpgraded ? (
            <Button variant="outline" className="mt-8 w-full" disabled>
              <Crown className="h-4 w-4 text-amber-500" /> You're on Unlimited
            </Button>
          ) : (
            <Button
              variant="gradient"
              className="mt-8 w-full"
              onClick={handlePayment}
              disabled={paying}
            >
              {paying ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                'Upgrade to Unlimited'
              )}
            </Button>
          )}
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-md text-center text-xs text-muted-foreground">
        Payments are processed securely by Razorpay and verified server-side
        with signature checking.
      </p>
    </div>
  );
}

export default UpgradePlans;
