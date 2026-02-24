import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import TextInputRow from './TextInputRow';

// Simple icon mock
const MockIcon = (_props: any) => <Text testID="mock-icon">icon</Text>;

describe('TextInputRow', () => {
  it('should render with placeholder', () => {
    const { getByPlaceholderText } = render(
      <TextInputRow placeholder="Enter email" />,
    );
    expect(getByPlaceholderText('Enter email')).toBeTruthy();
  });

  it('should render icon when provided', () => {
    const { getByTestId } = render(
      <TextInputRow icon={MockIcon} placeholder="With icon" />,
    );
    expect(getByTestId('mock-icon')).toBeTruthy();
  });

  it('should render right content when provided', () => {
    const { getByTestId } = render(
      <TextInputRow
        placeholder="With right"
        right={<Text testID="right-element">R</Text>}
      />,
    );
    expect(getByTestId('right-element')).toBeTruthy();
  });

  it('should call onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <TextInputRow placeholder="Type here" onChangeText={onChangeText} />,
    );

    fireEvent.changeText(getByPlaceholderText('Type here'), 'hello');

    expect(onChangeText).toHaveBeenCalledWith('hello');
  });
});
