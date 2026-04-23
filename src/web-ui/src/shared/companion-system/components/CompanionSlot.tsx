import React from 'react';
import { useCompanionSlotScenario } from '../store/companionStore';
import { BitFunCompanion } from './BitFunCompanion';

export interface CompanionSlotProps {
  slotId: string;
  className?: string;
}

export const CompanionSlot: React.FC<CompanionSlotProps> = ({
  slotId,
  className = '',
}) => {
  const activeScenario = useCompanionSlotScenario(slotId);

  if (!activeScenario) {
    return null;
  }

  return (
    <div className={className}>
      <BitFunCompanion {...activeScenario.presentation} />
    </div>
  );
};

CompanionSlot.displayName = 'CompanionSlot';
