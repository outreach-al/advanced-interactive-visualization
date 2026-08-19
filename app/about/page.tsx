import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/components/site/SiteShell';

export const metadata: Metadata = {
  title: 'About · Kurtoza',
  description: 'The person behind Kurtoza, and where it is going next: bespoke visualizations, generated automatically for any dataset you have.',
};

export default function AboutPage() {
  return (
    <SiteShell>
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-faint">About</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Hi, I&apos;m Krenar.</h1>

        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink/80">
          <p>
            I&apos;m an AI engineer, finishing a degree in artificial intelligence and spending most of my days
            with large language models and the agentic systems built around them. Kurtoza is what I make when I
            want to work with my hands for a while instead.
          </p>
          <p>
            It came out of a small, recurring annoyance. I&apos;d find a dataset that clearly had something to
            say, and every ready-made way of looking at it would sand that something off until what was left
            could have been about anything at all. The data deserved better than that. And, honestly, so did I,
            sitting there trying to actually understand it.
          </p>
          <p>
            So I started making them the other way around. Instead of pouring a dataset into a shape that
            already exists, I go looking for the shape hiding inside it, then draw the thing by hand until the
            point of it is the first thing you notice. The lab is where those experiments live. Some of them
            work, some of them don&apos;t. That part is honestly the fun of it.
          </p>
          <p>
            I&apos;ve come at this from a lot of directions over the years, from core banking systems to news
            analysis for Albanian-speaking regions to research into how far you can really trust what a language
            model tells you. Different worlds, same lesson every time: real data is messy and stubborn, and the
            tools most people are handed to make sense of it are blunt.
          </p>
        </div>

        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight">Why I build these</h2>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink/80">
            <p>
              I keep circling one thing in particular: the gap between what a model predicts and what actually
              happens. A risk index calls a country safe and the disaster arrives anyway. A global average
              creeps up by a number that sounds harmless while the summers quietly turn deadlier. That gap
              usually gets treated as noise to smooth away. I think it&apos;s the most honest part of the data,
              and the part most worth seeing clearly.
            </p>
            <p>
              So that is the rule behind everything here. Put the prediction and the reality on the same screen,
              stay honest about what the data can and can&apos;t say, and let the difference between them be the
              story.
            </p>
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-rule bg-black/[0.015] p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-faint">Coming next</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Visualizations like these, generated automatically, for all of your data.
          </h2>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink/80">
            <p>
              Everything in the lab so far I&apos;ve made by hand, one dataset at a time. That is the proof it
              can be done. What I actually want to build is a way to do it for anyone, on their own data.
            </p>
            <p>
              The idea is easy to say and hard to pull off: hand Kurtoza a dataset, any dataset, and get back a
              visualization built around its real shape. Not a default chart, not another dashboard of generic
              widgets, but a considered piece that goes looking for the story the way these ones do and tells
              you honestly what it does and doesn&apos;t mean. Almost everyone is sitting on data that gets
              quietly flattened into something forgettable, and I want to give all of it the treatment the
              pieces here get, without the weeks of hand work behind each one.
            </p>
            <p className="text-ink">
              I spend my days building agentic systems and working out what language models can and can&apos;t
              be trusted with. Pointing that at the problem of showing data honestly is the part I&apos;m most
              excited about. The lab is where you can watch it take shape in the meantime.
            </p>
          </div>
        </section>

        <div className="mt-14 border-t border-rule pt-6">
          <p className="text-sm text-ink/70">
            Based in Vienna. Have data you think deserves this, or just want to talk? Reach me at{' '}
            <a href="mailto:kahmeti123@gmail.com" className="font-medium text-ink underline decoration-rule underline-offset-2 hover:decoration-ink">
              kahmeti123@gmail.com
            </a>
            , or start with the{' '}
            <Link href="/lab" className="font-medium text-ink underline decoration-rule underline-offset-2 hover:decoration-ink">
              lab
            </Link>
            .
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
