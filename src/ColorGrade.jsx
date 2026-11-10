import React from 'react';

// A shared, reversible display grade; original image files are untouched.
export function ColorGrade() {
  return <svg className="color-grade-defs" aria-hidden="true" focusable="false"><defs>
    <filter id="scene-grade" colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values="0.98 0 0 0 0.005  0 0.99 0 0 0.003  0 0 1.025 0 0.002  0 0 0 1 0"/>
    </filter>
    <filter id="car-grade" colorInterpolationFilters="sRGB">
      <feColorMatrix type="saturate" values="0.94"/>
      <feComponentTransfer>
        <feFuncR type="gamma" amplitude="0.96" exponent="0.95" offset="0"/>
        <feFuncG type="gamma" amplitude="0.955" exponent="0.95" offset="0"/>
        <feFuncB type="gamma" amplitude="0.945" exponent="0.96" offset="0"/>
      </feComponentTransfer>
    </filter>
  </defs></svg>;
}
