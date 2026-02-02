'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { CheckIcon, Sparkles, Zap, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

const plans = [
    {
        name: 'Hobby',
        price: '$0',
        period: '/month',
        description: 'Perfect for getting started with automation',
        features: [
            '3 Free automations',
            '100 tasks per month',
            'Two-step Actions',
            'Basic support',
        ],
        icon: Sparkles,
        popular: false,
    },
    {
        name: 'Pro Plan',
        price: '$29',
        period: '/month',
        description: 'For professionals who need more power',
        features: [
            'Unlimited automations',
            '10,000 tasks per month',
            'Multi-step Actions',
            'Priority support',
            'Advanced analytics',
        ],
        icon: Zap,
        popular: true,
    },
    {
        name: 'Unlimited',
        price: '$99',
        period: '/month',
        description: 'For teams that want it all',
        features: [
            'Everything in Pro',
            'Unlimited tasks',
            'Custom integrations',
            'Dedicated account manager',
            'SLA guarantee',
            'Team collaboration',
        ],
        icon: Crown,
        popular: false,
    },
]

export function PricingSection() {
    return (
        <section className="relative w-full py-24 overflow-hidden bg-neutral-950">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-900/50 to-neutral-950" />

            {/* Animated gradient orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section header with animation */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-16"
                >
                    <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="inline-block px-4 py-1.5 mb-6 text-sm font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full"
                    >
                        Simple Pricing
                    </motion.span>

                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
                        <span className="bg-gradient-to-br from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                            Plans That
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                            Fit You Best
                        </span>
                    </h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="text-neutral-400 text-lg max-w-2xl mx-auto"
                    >
                        Choose the perfect plan for your automation needs. Start free and scale as you grow.
                    </motion.p>
                </motion.div>

                {/* Pricing cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 60 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{
                                duration: 0.7,
                                delay: index * 0.15,
                                ease: [0.16, 1, 0.3, 1]
                            }}
                            className="relative group"
                        >
                            {/* Popular badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                    <span className="px-4 py-1 text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/25">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            {/* Card */}
                            <div
                                className={cn(
                                    "relative h-full p-8 rounded-2xl border transition-all duration-500",
                                    "bg-neutral-900/50 backdrop-blur-sm",
                                    plan.popular
                                        ? "border-purple-500/50 shadow-2xl shadow-purple-500/10"
                                        : "border-neutral-800 hover:border-neutral-700",
                                    "group-hover:translate-y-[-4px] group-hover:shadow-xl"
                                )}
                            >
                                {/* Gradient overlay for popular plan */}
                                {plan.popular && (
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
                                )}

                                <div className="relative z-10">
                                    {/* Icon */}
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors duration-300",
                                        plan.popular
                                            ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                                            : "bg-neutral-800 text-neutral-400 group-hover:bg-neutral-700"
                                    )}>
                                        <plan.icon className="w-6 h-6" />
                                    </div>

                                    {/* Plan name */}
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        {plan.name}
                                    </h3>

                                    {/* Price */}
                                    <div className="flex items-baseline mb-4">
                                        <span className="text-5xl font-bold text-white">{plan.price}</span>
                                        <span className="text-neutral-500 ml-1">{plan.period}</span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-neutral-400 text-sm mb-8">
                                        {plan.description}
                                    </p>

                                    {/* Features */}
                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-center gap-3 text-sm">
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                                                    plan.popular
                                                        ? "bg-purple-500/20 text-purple-400"
                                                        : "bg-neutral-800 text-neutral-500"
                                                )}>
                                                    <CheckIcon className="w-3 h-3" />
                                                </div>
                                                <span className="text-neutral-300">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <button
                                        className={cn(
                                            "w-full py-3 px-6 rounded-xl font-medium transition-all duration-300",
                                            plan.popular
                                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]"
                                                : "bg-neutral-800 text-white hover:bg-neutral-700"
                                        )}
                                    >
                                        {plan.price === '$0' ? 'Start Free' : 'Get Started'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-center text-neutral-500 text-sm mt-12"
                >
                    All plans include 14-day money-back guarantee. No credit card required for free plan.
                </motion.p>
            </div>
        </section>
    )
}
