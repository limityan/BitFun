import React from 'react';
import { CompanionOverlay } from './CompanionOverlay';

export const CompanionSystemProvider: React.FC = () => {
  return <CompanionOverlay />;
};

CompanionSystemProvider.displayName = 'CompanionSystemProvider';
