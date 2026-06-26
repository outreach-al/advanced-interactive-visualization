import type { Metadata } from 'next';
import { RiskFingerprints } from '@/app/components/RiskFingerprints';

export const metadata: Metadata = {
  title: 'Risk Fingerprints: where the model misses',
  description:
    'A residual-sorted grid of country disaster fingerprints, comparing INFORM predicted risk against three decades of observed losses from EM-DAT.',
};

export default function RiskFingerprintsPage() {
  return <RiskFingerprints />;
}
