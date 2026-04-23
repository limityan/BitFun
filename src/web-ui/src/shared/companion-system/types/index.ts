export type CompanionCharacter = 'red-panda' | 'fox';

export type CompanionMotion =
  | 'idle'
  | 'doze'
  | 'think'
  | 'point'
  | 'hop'
  | 'alert'
  | 'amble'
  | 'pace'
  | 'peek'
  | 'scurry'
  | 'tease'
  | 'hide';

export type CompanionAction =
  | 'idle'
  | 'resting'
  | 'thinking'
  | 'guiding'
  | 'encouraging'
  | 'alerting'
  | 'keeping-company'
  | 'checking-in'
  | 'watching'
  | 'hurrying'
  | 'playful'
  | 'hiding';

export type CompanionSize = 'sm' | 'md' | 'lg' | number;

export type CompanionDirection = 'up' | 'right' | 'down' | 'left';

export type CompanionEmphasis = 'normal' | 'pulse' | 'dramatic';

export type CompanionExpression =
  | 'neutral'
  | 'sleepy'
  | 'surprised'
  | 'mischief'
  | 'bashful';

export type CompanionViewportPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center-left'
  | 'center-right'
  | 'center-bottom';

export type CompanionSelectorPlacement =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type CompanionRoamSpeed = 'slow' | 'medium' | 'fast';

export type CompanionHoverBehavior = 'none' | 'dodge';

export type CompanionClickBehavior = 'none' | 'emote' | 'hide' | 'tease';

export interface CompanionPresentationBase {
  character?: CompanionCharacter;
  size?: CompanionSize;
  emphasis?: CompanionEmphasis;
  direction?: CompanionDirection;
  expression?: CompanionExpression;
  label?: string;
}

export type CompanionPresentation = CompanionPresentationBase & (
  | {
    action: CompanionAction;
    motion?: CompanionMotion;
  }
  | {
    motion: CompanionMotion;
    action?: CompanionAction;
  }
);

export interface ResolvedCompanionPresentation extends CompanionPresentationBase {
  character: CompanionCharacter;
  action: CompanionAction;
  motion: CompanionMotion;
}

export interface CompanionRoamBehavior {
  enabled?: boolean;
  radiusX?: number;
  radiusY?: number;
  speed?: CompanionRoamSpeed;
}

export interface CompanionInteractionBehavior {
  hover?: CompanionHoverBehavior;
  click?: CompanionClickBehavior | CompanionClickBehavior[];
  emotes?: string[];
}

export interface CompanionBehavior {
  roam?: CompanionRoamBehavior;
  interaction?: CompanionInteractionBehavior;
}

export interface CompanionInlineTarget {
  kind: 'inline';
  slotId: string;
}

export interface CompanionViewportAnchor {
  type: 'viewport';
  position: CompanionViewportPosition;
  offsetX?: number;
  offsetY?: number;
}

export interface CompanionSelectorAnchor {
  type: 'selector';
  selector: string;
  placement?: CompanionSelectorPlacement;
  offsetX?: number;
  offsetY?: number;
}

export type CompanionAnchor = CompanionViewportAnchor | CompanionSelectorAnchor;

export interface CompanionFloatingTarget {
  kind: 'floating';
  anchor: CompanionAnchor;
  fallbackAnchor?: CompanionAnchor;
}

export interface CompanionScenario {
  id: string;
  enabled: boolean;
  priority?: number;
  presentation: CompanionPresentation;
  target: CompanionInlineTarget | CompanionFloatingTarget;
  behavior?: CompanionBehavior;
}

export interface RegisteredCompanionScenario extends CompanionScenario {
  priority: number;
  updatedAt: number;
}
