import type { Metadata } from 'next';
import Link from 'next/link';
import { ClimateSpiral } from '@/app/components/ClimateSpiral';
import { WarmingStripes } from '@/app/components/WarmingStripes';
import { ClimateTrend } from '@/app/components/ClimateTrend';
import { HeatDeaths } from '@/app/components/HeatDeaths';

export const metadata: Metadata = {
  title: 'Climate Spiral · Kurtoza',
  description: 'A century and a half of global temperature, drawn as a spiral. Every year is a ring; the planet warms as it winds outward.',
};

export default function ClimateSpiralPage() {
  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/lab" className="font-mono text-xs text-faint hover:text-ink">
          ← Lab
        </Link>

        <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-faint">Climate · temperature</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">A century and a half, wound into a spiral</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/80">
          Every ring is one year of global temperature, month by month, from 1880 to today. The twelve
          months run clockwise from January at the top. A ring sits close to the center in a cool year and
          winds outward in a warm one, so the record does not just get redder, it physically grows. Press
          play to watch it wind out, or drag the slider to any year.
        </p>

        <div className="mt-10">
          <ClimateSpiral />
        </div>

        <div className="mt-12 max-w-2xl space-y-3 border-t border-rule pt-6 text-sm leading-relaxed text-ink/75">
          <p>
            The numbers are anomalies: how far each month ran above or below the 1951 to 1980 average. That
            baseline is the innermost dashed ring, at zero. The two outer dashed rings mark plus 1.0 and plus
            1.5 degrees Celsius, the thresholds the Paris agreement is written around. For most of the
            twentieth century the rings coil tightly near the baseline. From the 1980s on they pull away, and
            the last decade sits almost entirely outside plus 1.0.
          </p>
        </div>

        {/* the spiral unrolled: one stripe per year */}
        <section className="mt-16 border-t border-rule pt-10">
          <h2 className="text-xl font-semibold tracking-tight">The same record, unrolled</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/80">
            The spiral is striking but hard to read year to year. Laid out as one stripe per year, the drift is
            plain: a long band of cool blues through the twentieth century, then an unbroken run of reds from
            the 1980s on. Hover any year to read its value.
          </p>
          <div className="mt-6">
            <WarmingStripes />
          </div>
        </section>

        {/* the trend, measured */}
        <section className="mt-16 border-t border-rule pt-10">
          <h2 className="text-xl font-semibold tracking-tight">The trend, measured</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/80">
            And as a plain line: each year's anomaly against the 1951 to 1980 baseline. The curve is flat and
            noisy for a century, then bends sharply upward after 1980. The dashed lines mark the plus 1.0 and
            plus 1.5 degree thresholds. Hover to trace any single year.
          </p>
          <div className="mt-6">
            <ClimateTrend />
          </div>
        </section>

        {/* the human cost */}
        <section className="mt-16 border-t border-rule pt-10">
          <h2 className="text-xl font-semibold tracking-tight">The cost, in lives</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/80">
            A warmer average is not an abstraction. It arrives as heat waves, and heat waves kill. These are
            recorded heat-wave deaths from the international disaster database EM-DAT: more than 336,000 since
            2000. The 2003 European summer and Russia's 2010 heat wave stand out, but the recent cluster is the
            real story, with 2022, 2023 and 2024 each among the deadliest years on record.
          </p>
          <div className="mt-6">
            <HeatDeaths />
          </div>
          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-faint">
            Honest scope: heat deaths are badly under-recorded, and reporting has improved over time, so part
            of the recent rise reflects better counting rather than only more heat. Independent excess-mortality
            studies put the true toll far higher than any disaster database captures.
          </p>
        </section>

        <div className="mt-14 max-w-2xl border-t border-rule pt-6">
          <p className="text-xs text-faint">
            Data: NASA GISS Surface Temperature Analysis (GISTEMP v4), land-ocean global means. Anomalies in
            degrees Celsius relative to the 1951 to 1980 mean.
          </p>
        </div>
      </main>
    </div>
  );
}
