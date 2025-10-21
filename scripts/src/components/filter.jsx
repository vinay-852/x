import React from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

const animatedComponents = makeAnimated();

export default function Filter({ options, value, onChange, placeholder }) {
  return (
    <Select
      closeMenuOnSelect={false}
      components={animatedComponents}
      isMulti
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder || "Filter..."}
    />
  );
}