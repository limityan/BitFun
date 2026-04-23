import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFloatingCompanionScenario } from '../store/companionStore';
import { useAgentCompanionCharacter } from '../hooks/useAgentCompanionCharacter';
import { resolveCompanionPresentation } from '../presentation';
import type {
  CompanionAnchor,
  CompanionClickBehavior,
  CompanionDirection,
  CompanionExpression,
  CompanionFloatingTarget,
  CompanionHoverBehavior,
  CompanionMotion,
  ResolvedCompanionPresentation,
  CompanionRoamSpeed,
  CompanionSelectorPlacement,
  CompanionSize,
  CompanionViewportPosition,
} from '../types';
import { BitFunCompanion } from './BitFunCompanion';
import './CompanionOverlay.scss';

interface CompanionBox {
  width: number;
  height: number;
}

interface CompanionPosition {
  top: number;
  left: number;
}

interface CompanionOffset {
  x: number;
  y: number;
}

interface CompanionReactionState {
  emote: string | null;
  hidden: boolean;
  motion: CompanionMotion | null;
  expression: CompanionExpression | undefined;
}

const VIEWPORT_MARGIN_PX = 18;
const TARGET_GAP_PX = 14;
const CLICK_REACTION_MS = 1050;
const HIDE_REACTION_MS = 860;
const DEFAULT_EMOTES = ['?!', '>_<', '...'];

const SIZE_MAP: Record<Exclude<CompanionSize, number>, number> = {
  sm: 68,
  md: 88,
  lg: 112,
};

function resolveSizePx(size: CompanionSize | undefined): number {
  if (typeof size === 'number') {
    return size;
  }

  return SIZE_MAP[size ?? 'sm'];
}

function resolveCompanionBox(size: CompanionSize | undefined): CompanionBox {
  const width = resolveSizePx(size);
  return {
    width,
    height: Math.round(width * 0.74),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function chooseRandom<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function resolveRoamDuration(speed: CompanionRoamSpeed | undefined): string {
  switch (speed) {
    case 'slow':
      return '9.2s';
    case 'fast':
      return '5.1s';
    default:
      return '6.8s';
  }
}

function resolveViewportPosition(
  position: CompanionViewportPosition,
  box: CompanionBox,
  offsetX = 0,
  offsetY = 0,
): CompanionPosition {
  const maxLeft = window.innerWidth - box.width - VIEWPORT_MARGIN_PX;
  const maxTop = window.innerHeight - box.height - VIEWPORT_MARGIN_PX;

  const horizontalCenter = (window.innerWidth - box.width) / 2;
  const verticalCenter = (window.innerHeight - box.height) / 2;

  let left = VIEWPORT_MARGIN_PX;
  let top = VIEWPORT_MARGIN_PX;

  switch (position) {
    case 'top-right':
      left = maxLeft;
      break;
    case 'bottom-left':
      top = maxTop;
      break;
    case 'bottom-right':
      left = maxLeft;
      top = maxTop;
      break;
    case 'center-left':
      top = verticalCenter;
      break;
    case 'center-right':
      left = maxLeft;
      top = verticalCenter;
      break;
    case 'center-bottom':
      left = horizontalCenter;
      top = maxTop;
      break;
    default:
      break;
  }

  return {
    left: clamp(left + offsetX, VIEWPORT_MARGIN_PX, maxLeft),
    top: clamp(top + offsetY, VIEWPORT_MARGIN_PX, maxTop),
  };
}

function resolveSelectorPosition(
  selector: string,
  placement: CompanionSelectorPlacement,
  box: CompanionBox,
  offsetX = 0,
  offsetY = 0,
): CompanionPosition | null {
  const target = document.querySelector<HTMLElement>(selector);
  if (!target) {
    return null;
  }

  const rect = target.getBoundingClientRect();
  const centerLeft = rect.left + rect.width / 2 - box.width / 2;
  const centerTop = rect.top + rect.height / 2 - box.height / 2;

  let left = centerLeft;
  let top = centerTop;

  switch (placement) {
    case 'top':
      top = rect.top - box.height - TARGET_GAP_PX;
      break;
    case 'right':
      left = rect.right + TARGET_GAP_PX;
      break;
    case 'bottom':
      top = rect.bottom + TARGET_GAP_PX;
      break;
    case 'left':
      left = rect.left - box.width - TARGET_GAP_PX;
      break;
    case 'top-left':
      left = rect.left - box.width * 0.8;
      top = rect.top - box.height - TARGET_GAP_PX;
      break;
    case 'top-right':
      left = rect.right - box.width * 0.2;
      top = rect.top - box.height - TARGET_GAP_PX;
      break;
    case 'bottom-left':
      left = rect.left - box.width * 0.8;
      top = rect.bottom + TARGET_GAP_PX;
      break;
    case 'bottom-right':
      left = rect.right - box.width * 0.2;
      top = rect.bottom + TARGET_GAP_PX;
      break;
  }

  return {
    left: clamp(
      left + offsetX,
      VIEWPORT_MARGIN_PX,
      window.innerWidth - box.width - VIEWPORT_MARGIN_PX,
    ),
    top: clamp(
      top + offsetY,
      VIEWPORT_MARGIN_PX,
      window.innerHeight - box.height - VIEWPORT_MARGIN_PX,
    ),
  };
}

function resolveAnchorPosition(
  anchor: CompanionAnchor,
  box: CompanionBox,
): CompanionPosition | null {
  if (anchor.type === 'viewport') {
    return resolveViewportPosition(
      anchor.position,
      box,
      anchor.offsetX,
      anchor.offsetY,
    );
  }

  return resolveSelectorPosition(
    anchor.selector,
    anchor.placement ?? 'right',
    box,
    anchor.offsetX,
    anchor.offsetY,
  );
}

function resolveFloatingPosition(
  target: CompanionFloatingTarget,
  box: CompanionBox,
): CompanionPosition | null {
  return resolveAnchorPosition(target.anchor, box)
    ?? (target.fallbackAnchor ? resolveAnchorPosition(target.fallbackAnchor, box) : null);
}

function resolveFallbackDirection(
  target: CompanionFloatingTarget,
  presentation: ResolvedCompanionPresentation,
): CompanionDirection | undefined {
  if (presentation.direction) {
    return presentation.direction;
  }

  const anchor = target.anchor;
  if (anchor.type === 'viewport') {
    switch (anchor.position) {
      case 'bottom-left':
      case 'center-left':
        return 'right';
      case 'bottom-right':
      case 'center-right':
      case 'top-right':
        return 'left';
      case 'center-bottom':
        return 'up';
      default:
        return 'right';
    }
  }

  switch (anchor.placement ?? 'right') {
    case 'left':
      return 'right';
    case 'bottom':
      return 'up';
    case 'top':
      return 'down';
    case 'top-left':
    case 'bottom-left':
      return 'right';
    case 'top-right':
    case 'bottom-right':
      return 'left';
    default:
      return 'left';
  }
}

function areSamePosition(
  left: CompanionPosition | null,
  right: CompanionPosition | null,
): boolean {
  if (!left || !right) {
    return left === right;
  }

  return Math.abs(left.left - right.left) < 0.5 && Math.abs(left.top - right.top) < 0.5;
}

function normalizeClickBehaviors(
  clickBehavior: CompanionClickBehavior | CompanionClickBehavior[] | undefined,
): CompanionClickBehavior[] {
  if (!clickBehavior) {
    return [];
  }

  const values = Array.isArray(clickBehavior) ? clickBehavior : [clickBehavior];
  return values.filter((value): value is CompanionClickBehavior => value !== 'none');
}

function resolveReactionMotion(
  clickBehavior: CompanionClickBehavior,
  fallbackMotion: CompanionMotion,
): CompanionMotion {
  switch (clickBehavior) {
    case 'hide':
      return 'hide';
    case 'tease':
      return 'tease';
    case 'emote':
      return fallbackMotion === 'hide' ? 'peek' : 'hop';
    default:
      return fallbackMotion;
  }
}

function resolveReactionExpression(
  clickBehavior: CompanionClickBehavior,
): CompanionExpression {
  switch (clickBehavior) {
    case 'hide':
      return 'bashful';
    case 'tease':
      return 'mischief';
    case 'emote':
      return 'surprised';
    default:
      return 'neutral';
  }
}

function resolveReactionEmote(
  emotes: string[] | undefined,
  clickBehavior: CompanionClickBehavior,
): string {
  if (clickBehavior === 'hide') {
    return '...';
  }

  if (clickBehavior === 'tease') {
    return '>_<';
  }

  const resolvedEmotes = emotes && emotes.length > 0 ? emotes : DEFAULT_EMOTES;
  return chooseRandom(resolvedEmotes);
}

const INITIAL_OFFSET: CompanionOffset = { x: 0, y: 0 };
const INITIAL_REACTION_STATE: CompanionReactionState = {
  emote: null,
  hidden: false,
  motion: null,
  expression: undefined,
};

export const CompanionOverlay: React.FC = () => {
  const activeScenario = useFloatingCompanionScenario();
  const selectedCharacter = useAgentCompanionCharacter();
  const [position, setPosition] = useState<CompanionPosition | null>(null);
  const [hoverOffset, setHoverOffset] = useState<CompanionOffset>(INITIAL_OFFSET);
  const [clickOffset, setClickOffset] = useState<CompanionOffset>(INITIAL_OFFSET);
  const [reactionState, setReactionState] = useState<CompanionReactionState>(
    INITIAL_REACTION_STATE,
  );
  const interactiveRef = useRef<HTMLDivElement | null>(null);
  const reactionTimerRef = useRef<number | null>(null);

  const resolvedPresentation = useMemo(
    () => (
      activeScenario
        ? resolveCompanionPresentation(activeScenario.presentation, selectedCharacter)
        : null
    ),
    [activeScenario, selectedCharacter],
  );

  const box = useMemo(
    () => resolveCompanionBox(resolvedPresentation?.size),
    [resolvedPresentation?.size],
  );

  const clickBehaviors = useMemo(
    () => normalizeClickBehaviors(activeScenario?.behavior?.interaction?.click),
    [activeScenario?.behavior?.interaction?.click],
  );

  const hoverBehavior: CompanionHoverBehavior = activeScenario?.behavior?.interaction?.hover ?? 'none';
  const roamEnabled = Boolean(activeScenario?.behavior?.roam?.enabled);
  const roamRadiusX = activeScenario?.behavior?.roam?.radiusX ?? Math.max(20, Math.round(box.width * 0.24));
  const roamRadiusY = activeScenario?.behavior?.roam?.radiusY ?? Math.max(12, Math.round(box.height * 0.24));
  const roamDuration = resolveRoamDuration(activeScenario?.behavior?.roam?.speed);
  const roamPhase = `${(hashString(activeScenario?.id ?? 'bitfun-companion') % 480) / 100}s`;
  const isInteractive = hoverBehavior !== 'none' || clickBehaviors.length > 0;

  useEffect(() => {
    return () => {
      if (reactionTimerRef.current !== null) {
        window.clearTimeout(reactionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setHoverOffset(INITIAL_OFFSET);
    setClickOffset(INITIAL_OFFSET);
    setReactionState(INITIAL_REACTION_STATE);

    if (reactionTimerRef.current !== null) {
      window.clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
  }, [activeScenario?.id]);

  useEffect(() => {
    if (!activeScenario || activeScenario.target.kind !== 'floating') {
      setPosition(null);
      return;
    }

    const floatingTarget = activeScenario.target;
    let frameId = 0;
    let disposed = false;

    const updatePosition = () => {
      if (disposed) {
        return;
      }

      const nextPosition = resolveFloatingPosition(floatingTarget, box);
      setPosition((currentPosition) => (
        areSamePosition(currentPosition, nextPosition) ? currentPosition : nextPosition
      ));

      frameId = window.requestAnimationFrame(updatePosition);
    };

    updatePosition();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [activeScenario, box]);

  if (!activeScenario || activeScenario.target.kind !== 'floating' || !position) {
    return null;
  }

  const floatingTarget = activeScenario.target;
  const activePresentation = resolvedPresentation ?? resolveCompanionPresentation(
    activeScenario.presentation,
    selectedCharacter,
  );
  const presentation = {
    ...activePresentation,
    motion: reactionState.motion ?? activePresentation.motion,
    expression: reactionState.expression ?? activePresentation.expression,
    direction: resolveFallbackDirection(floatingTarget, activePresentation),
  };

  const resetReaction = (delayMs: number) => {
    if (reactionTimerRef.current !== null) {
      window.clearTimeout(reactionTimerRef.current);
    }

    reactionTimerRef.current = window.setTimeout(() => {
      setReactionState(INITIAL_REACTION_STATE);
      setClickOffset(INITIAL_OFFSET);
    }, delayMs);
  };

  const updateHoverOffset = (clientX: number, clientY: number) => {
    if (hoverBehavior !== 'dodge' || !interactiveRef.current) {
      return;
    }

    const rect = interactiveRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.max(10, Math.hypot(deltaX, deltaY));
    const force = clamp(1.25 - distance / Math.max(rect.width, rect.height), 0.2, 1);
    const maxX = roamRadiusX + 20;
    const maxY = roamRadiusY + 16;

    setHoverOffset({
      x: clamp((-deltaX / distance) * maxX * force, -maxX, maxX),
      y: clamp((-deltaY / distance) * maxY * force, -maxY, maxY),
    });
  };

  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    updateHoverOffset(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    updateHoverOffset(event.clientX, event.clientY);
  };

  const handlePointerLeave = () => {
    setHoverOffset(INITIAL_OFFSET);
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (clickBehaviors.length === 0) {
      return;
    }

    event.stopPropagation();

    const clickBehavior = chooseRandom(clickBehaviors);
    const horizontalDirection = Math.random() > 0.5 ? 1 : -1;
    const nextClickOffset = (() => {
      switch (clickBehavior) {
        case 'hide':
          return {
            x: horizontalDirection * Math.max(18, roamRadiusX * 0.75),
            y: Math.max(10, roamRadiusY * 0.85),
          };
        case 'tease':
          return {
            x: horizontalDirection * Math.max(22, roamRadiusX + 10),
            y: -Math.max(10, roamRadiusY * 0.65),
          };
        default:
          return {
            x: horizontalDirection * 8,
            y: -10,
          };
      }
    })();

    setClickOffset(nextClickOffset);
    setReactionState({
      emote: resolveReactionEmote(activeScenario.behavior?.interaction?.emotes, clickBehavior),
      hidden: clickBehavior === 'hide',
      motion: resolveReactionMotion(clickBehavior, activePresentation.motion),
      expression: resolveReactionExpression(clickBehavior),
    });

    resetReaction(clickBehavior === 'hide' ? HIDE_REACTION_MS : CLICK_REACTION_MS);
  };

  const interactiveStyle = {
    '--bitfun-companion-hover-x': `${hoverOffset.x}px`,
    '--bitfun-companion-hover-y': `${hoverOffset.y}px`,
    '--bitfun-companion-click-x': `${clickOffset.x}px`,
    '--bitfun-companion-click-y': `${clickOffset.y}px`,
    '--bitfun-companion-scale': reactionState.hidden ? '0.52' : '1',
    '--bitfun-companion-opacity': reactionState.hidden ? '0' : '1',
    pointerEvents: isInteractive && !reactionState.hidden ? 'auto' : 'none',
  } as React.CSSProperties;

  const roamStyle = {
    '--bitfun-companion-roam-x': `${roamRadiusX}px`,
    '--bitfun-companion-roam-y': `${roamRadiusY}px`,
    '--bitfun-companion-roam-duration': roamDuration,
    '--bitfun-companion-roam-phase': roamPhase,
  } as React.CSSProperties;

  return createPortal(
    <div
      className="bitfun-companion-overlay"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div
        ref={interactiveRef}
        className={[
          'bitfun-companion-overlay__interactive',
          isInteractive ? 'bitfun-companion-overlay__interactive--interactive' : '',
          reactionState.hidden ? 'bitfun-companion-overlay__interactive--hidden' : '',
        ].filter(Boolean).join(' ')}
        style={interactiveStyle}
        onPointerEnter={isInteractive ? handlePointerEnter : undefined}
        onPointerMove={isInteractive ? handlePointerMove : undefined}
        onPointerLeave={isInteractive ? handlePointerLeave : undefined}
        onClick={clickBehaviors.length > 0 ? handleClick : undefined}
      >
        <div
          className={[
            'bitfun-companion-overlay__motion',
            roamEnabled ? 'bitfun-companion-overlay__motion--roam' : '',
          ].filter(Boolean).join(' ')}
          style={roamStyle}
        >
          <BitFunCompanion
            {...presentation}
            reactionEmote={reactionState.emote}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};

CompanionOverlay.displayName = 'CompanionOverlay';
