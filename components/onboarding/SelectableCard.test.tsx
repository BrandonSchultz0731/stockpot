import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SelectableCard from './SelectableCard';

describe('SelectableCard', () => {
  it('should render title', () => {
    const { getByText } = render(
      <SelectableCard
        title="Beginner"
        selected={false}
        onPress={jest.fn()}
      />,
    );
    expect(getByText('Beginner')).toBeTruthy();
  });

  it('should render description when provided', () => {
    const { getByText } = render(
      <SelectableCard
        title="Beginner"
        description="Simple recipes"
        selected={false}
        onPress={jest.fn()}
      />,
    );
    expect(getByText('Simple recipes')).toBeTruthy();
  });

  it('should show check icon when selected', () => {
    const { getByTestId } = render(
      <SelectableCard title="Selected" selected={true} onPress={jest.fn()} />,
    );
    expect(getByTestId('icon-Check')).toBeTruthy();
  });

  it('should not show check icon when unselected', () => {
    const { queryByTestId } = render(
      <SelectableCard
        title="Unselected"
        selected={false}
        onPress={jest.fn()}
      />,
    );
    expect(queryByTestId('icon-Check')).toBeNull();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SelectableCard title="Tap me" selected={false} onPress={onPress} />,
    );

    fireEvent.press(getByText('Tap me'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
