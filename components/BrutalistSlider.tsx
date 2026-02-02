import React from 'react';
import { SliderProps } from '../types';

export const BrutalistSlider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-2 w-full group">
      <div className="flex justify-between items-baseline font-mono text-xs uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">
        <span>{label}</span>
        <span className="font-bold text-black border border-black px-1.5 py-0.5">
          {value}{unit}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="
            appearance-none w-full h-[2px] bg-gray-300 outline-none
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-black
            [&::-webkit-slider-thumb]:border-0
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:active:scale-125
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:bg-black
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-grab
            focus:bg-black transition-colors duration-300
          "
        />
      </div>
    </div>
  );
};