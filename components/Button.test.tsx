import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from './Button';

describe('Button', () => {
  it('should render label text', () => {
    const { getByText } = render(<Button label="Click me" />);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button label="Press" onPress={onPress} />,
    );

    fireEvent.press(getByText('Press'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button label="Disabled" onPress={onPress} disabled />,
    );

    fireEvent.press(getByText('Disabled'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('should apply opacity when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button label="Dim" disabled onPress={onPress} />,
    );

    // Disabled button ignores press
    fireEvent.press(getByText('Dim'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should render with primary variant by default', () => {
    const { getByText } = render(<Button label="Primary" />);
    expect(getByText('Primary')).toBeTruthy();
  });

  it('should render outline variant', () => {
    const { getByText } = render(
      <Button label="Outline" variant="outline" />,
    );
    expect(getByText('Outline')).toBeTruthy();
  });

  it('should render dark variant', () => {
    const { getByText } = render(<Button label="Dark" variant="dark" />);
    expect(getByText('Dark')).toBeTruthy();
  });
});
