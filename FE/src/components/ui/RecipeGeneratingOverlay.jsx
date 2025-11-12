import React from 'react';
import logo from '@/assets/sikboo.png';

/**
 * 레시피 생성/추천 로딩 오버레이
 * - 배경 없음(투명), 로고 본래 색상 유지
 * - 중앙에 크게 표시, 펄스(밝기) 애니메이션 + 도트 애니메이션
 * - visible=true 일 때만 렌더링
 */
export default function RecipeGeneratingOverlay({
  visible,
  message = '레시피 생성중',
  blockPointer = true, // true면 클릭 막음
  size = 220, // 로고 크기(px)
}) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: blockPointer ? 'auto' : 'none',
        zIndex: 9999,
        background: 'transparent', // 흰 배경 제거
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div style={{ display: 'grid', placeItems: 'center', gap: 16 }}>
        {/* 로고: 본래 색상 + 펄스(밝기) */}
        <img
          src={logo}
          alt="식재료를 부탁해"
          width={size}
          height={size}
          style={{
            filter: 'none', // 색상 원본 유지(회색화 금지)
            animation: 'sikbooPulse 1.1s ease-in-out infinite',
            userSelect: 'none',
          }}
          draggable="false"
        />
        {/* '레시피 생성중' + 도트 애니메이션 */}
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          {message}
          <span className="dots" aria-hidden="true">
            ...
          </span>
        </div>
      </div>

      <style>{`
        @keyframes sikbooPulse {
          0%   { opacity: 0.25; transform: scale(0.98); }
          50%  { opacity: 1;    transform: scale(1.00); }
          100% { opacity: 0.25; transform: scale(0.98); }
        }
        /* ... → . .. ... 반복 */
        .dots {
          display: inline-block;
          width: 2.4ch;
          text-align: left;
          animation: dotsStep 1.0s steps(4,end) infinite;
        }
        @keyframes dotsStep {
          0%   { content: '';    }
          25%  { content: '.';   }
          50%  { content: '..';  }
          75%  { content: '...'; }
          100% { content: '';    }
        }
        /* content 애니메이션을 위해 ::after 활용 */
        .dots::after {
          content: '';
          animation: dotsAfter 1.0s steps(4,end) infinite;
        }
        @keyframes dotsAfter {
          0%   { content: '';    }
          25%  { content: '.';   }
          50%  { content: '..';  }
          75%  { content: '...'; }
          100% { content: '';    }
        }
      `}</style>
    </div>
  );
}
