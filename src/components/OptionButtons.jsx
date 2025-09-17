import React from 'react';

const OptionButtons = ({ options, onOptionSelect, config }) => {
  return (
    <div className="flex flex-wrap gap-1 max-w-[80%]">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onOptionSelect(option)}
          className="bg-white border border-gray-300 py-1.5 px-2.5 rounded-lg cursor-pointer text-xs text-center transition-all duration-200 break-words hover:bg-gray-50"
          style={{
            ':hover': {
              borderColor: config.primaryColor
            }
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f9fafb';
            e.target.style.borderColor = config.primaryColor;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white';
            e.target.style.borderColor = '#d1d5db';
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default OptionButtons;