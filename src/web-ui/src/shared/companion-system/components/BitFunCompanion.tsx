import React from 'react';
import { DEFAULT_COMPANION_CHARACTER } from '../characters';
import { useAgentCompanionCharacter } from '../hooks/useAgentCompanionCharacter';
import { resolveCompanionPresentation } from '../presentation';
import type {
  CompanionCharacter,
  CompanionDirection,
  CompanionEmphasis,
  CompanionExpression,
  CompanionMotion,
  CompanionPresentation,
  CompanionSize,
} from '../types';
import './BitFunCompanion.scss';

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

function resolveDirection(
  direction: CompanionDirection | undefined,
  motion: CompanionMotion,
): CompanionDirection {
  if (direction) {
    return direction;
  }

  return motion === 'point' ? 'right' : 'right';
}

function resolveEmphasis(emphasis: CompanionEmphasis | undefined): CompanionEmphasis {
  return emphasis ?? 'normal';
}

const CompanionOverlays: React.FC = () => (
  <>
    <g className="bitfun-companion__overlay bitfun-companion__overlay--zzz">
      <text x="108" y="34">z</text>
      <text x="124" y="18">z</text>
      <text x="140" y="6">Z</text>
    </g>

    <g className="bitfun-companion__overlay bitfun-companion__overlay--think">
      <circle cx="106" cy="36" r="4" />
      <circle cx="122" cy="22" r="5.5" />
      <circle cx="140" cy="10" r="7" />
    </g>

    <g className="bitfun-companion__overlay bitfun-companion__overlay--point">
      <path className="bitfun-companion__arrow" d="M111 59 H147" />
      <path className="bitfun-companion__arrow" d="M139 49 L149 59 L139 69" />
    </g>

    <g className="bitfun-companion__overlay bitfun-companion__overlay--alert">
      <text x="122" y="28">!</text>
    </g>

    <g className="bitfun-companion__overlay bitfun-companion__overlay--tease">
      <text x="118" y="26">*</text>
      <text x="134" y="14">*</text>
    </g>

    <g className="bitfun-companion__overlay bitfun-companion__overlay--hide">
      <text x="114" y="28">...</text>
    </g>
  </>
);

const RedPandaArt: React.FC = () => (
  <>
    <ellipse className="bitfun-companion__shadow" cx="88" cy="114" rx="52" ry="9" />

    <g className="bitfun-companion__tail">
      <path
        className="bitfun-companion__fur bitfun-companion__fur--dark"
        d="M120 80 C145 66 170 72 172 92 C174 110 150 120 123 111 C110 106 103 95 107 86 C110 81 114 79 120 80 Z"
      />
      <path className="bitfun-companion__tail-stripe" d="M127 78 C135 84 136 95 128 104" />
      <path className="bitfun-companion__tail-stripe" d="M144 79 C151 86 151 97 143 107" />
      <path className="bitfun-companion__tail-stripe" d="M159 84 C164 90 164 98 159 105" />
    </g>

    <g className="bitfun-companion__body-group">
      <ellipse className="bitfun-companion__fur" cx="89" cy="82" rx="38" ry="27" />
      <ellipse className="bitfun-companion__fur bitfun-companion__fur--light" cx="81" cy="87" rx="19" ry="15" />
      <ellipse className="bitfun-companion__leg" cx="68" cy="104" rx="12" ry="8" />
      <ellipse className="bitfun-companion__leg" cx="97" cy="106" rx="14" ry="8" />
      <g className="bitfun-companion__paw bitfun-companion__paw--front">
        <ellipse className="bitfun-companion__leg" cx="51" cy="90" rx="11" ry="8" />
      </g>
    </g>

    <g className="bitfun-companion__head-group">
      <circle className="bitfun-companion__fur" cx="67" cy="46" r="26" />
      <g className="bitfun-companion__ears">
        <circle className="bitfun-companion__fur bitfun-companion__ear" cx="48" cy="25" r="10" />
        <circle className="bitfun-companion__fur bitfun-companion__ear" cx="85" cy="22" r="10" />
        <circle className="bitfun-companion__ear-inner" cx="48" cy="25" r="5" />
        <circle className="bitfun-companion__ear-inner" cx="85" cy="22" r="5" />
      </g>
      <path
        className="bitfun-companion__fur bitfun-companion__fur--light"
        d="M48 50 C50 36 60 30 71 31 C82 32 90 39 89 50 C88 61 80 69 68 70 C57 71 47 63 48 50 Z"
      />
      <ellipse className="bitfun-companion__eye bitfun-companion__eye--left" cx="59" cy="48" rx="3" ry="4" />
      <ellipse className="bitfun-companion__eye bitfun-companion__eye--right" cx="76" cy="46" rx="3" ry="4" />
      <path className="bitfun-companion__muzzle" d="M60 58 C64 54 71 54 75 58 C71 62 64 62 60 58 Z" />
      <circle className="bitfun-companion__nose" cx="68" cy="55" r="3.2" />
    </g>
  </>
);

const FoxArt: React.FC = () => (
  <>
    <ellipse className="bitfun-companion__shadow" cx="90" cy="114" rx="52" ry="9" />

    <g className="bitfun-companion__tail">
      <path
        className="bitfun-companion__fur bitfun-companion__fur--dark"
        d="M120 84 C146 61 173 70 171 93 C170 111 146 121 119 117 C102 113 95 100 100 90 C104 83 112 80 120 84 Z"
      />
      <path
        className="bitfun-companion__tail-tip"
        d="M148 92 C161 95 162 108 151 113 C139 118 127 113 128 104 C129 97 137 90 148 92 Z"
      />
    </g>

    <g className="bitfun-companion__body-group">
      <path
        className="bitfun-companion__fur"
        d="M58 83 C58 65 73 55 94 55 C111 55 123 67 123 84 C123 100 111 110 93 110 C73 110 58 99 58 83 Z"
      />
      <path
        className="bitfun-companion__fur bitfun-companion__fur--light"
        d="M69 86 C69 75 78 68 90 68 C101 68 109 75 109 87 C109 98 101 104 90 104 C78 104 69 97 69 86 Z"
      />
      <ellipse className="bitfun-companion__leg" cx="72" cy="105" rx="11" ry="7" />
      <ellipse className="bitfun-companion__leg" cx="100" cy="106" rx="13" ry="7" />
      <g className="bitfun-companion__paw bitfun-companion__paw--front">
        <ellipse className="bitfun-companion__leg" cx="51" cy="90" rx="10.5" ry="7.5" />
      </g>
    </g>

    <g className="bitfun-companion__head-group">
      <path
        className="bitfun-companion__fur"
        d="M42 52 C42 34 54 22 71 22 C88 22 101 34 101 51 C101 67 88 80 71 80 C53 80 42 68 42 52 Z"
      />
      <g className="bitfun-companion__ears">
        <path className="bitfun-companion__fur bitfun-companion__ear" d="M49 31 L56 10 L65 29 Z" />
        <path className="bitfun-companion__fur bitfun-companion__ear" d="M81 29 L90 8 L98 30 Z" />
        <path className="bitfun-companion__ear-inner" d="M52 29 L56 16 L61 28 Z" />
        <path className="bitfun-companion__ear-inner" d="M84 28 L89 16 L94 29 Z" />
      </g>
      <path
        className="bitfun-companion__fur bitfun-companion__fur--light"
        d="M53 54 C53 43 61 35 72 35 C82 35 90 43 90 54 C90 66 82 73 71 73 C60 73 53 65 53 54 Z"
      />
      <ellipse className="bitfun-companion__face-mark" cx="58" cy="48" rx="5.8" ry="4.4" />
      <ellipse className="bitfun-companion__face-mark" cx="83" cy="47" rx="5.8" ry="4.4" />
      <ellipse className="bitfun-companion__eye bitfun-companion__eye--left" cx="62" cy="49" rx="3" ry="4" />
      <ellipse className="bitfun-companion__eye bitfun-companion__eye--right" cx="79" cy="47" rx="3" ry="4" />
      <path className="bitfun-companion__muzzle" d="M63 60 C67 56 74 56 78 60 C74 64 67 64 63 60 Z" />
      <circle className="bitfun-companion__nose" cx="71" cy="57" r="3.2" />
    </g>
  </>
);

function renderCharacterArt(character: CompanionCharacter): React.ReactNode {
  switch (character) {
    case 'fox':
      return <FoxArt />;
    case 'red-panda':
    default:
      return <RedPandaArt />;
  }
}

function resolveExpression(
  expression: CompanionExpression | undefined,
  motion: CompanionMotion,
): CompanionExpression {
  if (expression) {
    return expression;
  }

  switch (motion) {
    case 'doze':
      return 'sleepy';
    case 'alert':
      return 'surprised';
    case 'tease':
      return 'mischief';
    case 'peek':
    case 'hide':
      return 'bashful';
    default:
      return 'neutral';
  }
}

export type BitFunCompanionProps = CompanionPresentation & {
  className?: string;
  reactionEmote?: string | null;
};

export const BitFunCompanion: React.FC<BitFunCompanionProps> = ({
  reactionEmote,
  className = '',
  ...presentationProps
}) => {
  const selectedCharacter = useAgentCompanionCharacter();
  const resolvedPresentation = resolveCompanionPresentation(
    presentationProps,
    selectedCharacter ?? DEFAULT_COMPANION_CHARACTER,
  );
  const sizePx = resolveSizePx(resolvedPresentation.size);
  const resolvedCharacter = resolvedPresentation.character;
  const resolvedMotion = resolvedPresentation.motion;
  const resolvedDirection = resolveDirection(
    resolvedPresentation.direction,
    resolvedMotion,
  );
  const resolvedEmphasis = resolveEmphasis(resolvedPresentation.emphasis);
  const resolvedExpression = resolveExpression(
    resolvedPresentation.expression,
    resolvedMotion,
  );

  return (
    <div
      className={[
        'bitfun-companion',
        `bitfun-companion--character-${resolvedCharacter}`,
        `bitfun-companion--motion-${resolvedMotion}`,
        `bitfun-companion--dir-${resolvedDirection}`,
        `bitfun-companion--emphasis-${resolvedEmphasis}`,
        `bitfun-companion--expression-${resolvedExpression}`,
        className,
      ].filter(Boolean).join(' ')}
      style={{ '--bitfun-companion-size': `${sizePx}px` } as React.CSSProperties}
      aria-hidden
    >
      {resolvedPresentation.label ? (
        <div className="bitfun-companion__label">{resolvedPresentation.label}</div>
      ) : null}
      {reactionEmote ? <div className="bitfun-companion__reaction">{reactionEmote}</div> : null}

      <div className="bitfun-companion__stage">
        <svg
          className="bitfun-companion__svg"
          viewBox="0 0 180 132"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          {renderCharacterArt(resolvedCharacter)}
          <CompanionOverlays />
        </svg>
      </div>
    </div>
  );
};

BitFunCompanion.displayName = 'BitFunCompanion';
