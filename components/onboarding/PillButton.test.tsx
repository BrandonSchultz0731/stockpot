import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PillButton from './PillButton';

describe('PillButton', () => {
  it('should render label text', () => {
    const { getByText } = render(
      <PillButton label="Vegan" selected={false} onPress={jest.fn()} />,
    );
    expect(getByText('Vegan')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PillButton label="Keto" selected={false} onPress={onPress} />,
    );

    fireEvent.press(getByText('Keto'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should show Check icon when selected with diet variant', () => {
    const { getByTestId } = render(
      <PillButton
        label="Vegan"
        selected={true}
        onPress={jest.fn()}
        variant="diet"
      />,
    );
    expect(getByTestId('icon-Check')).toBeTruthy();
  });

  it('should show X icon when selected with exclude variant', () => {
    const { getByTestId } = render(
      <PillButton
        label="Peanuts"
        selected={true}
        onPress={jest.fn()}
        variant="exclude"
      />,
    );
    expect(getByTestId('icon-X')).toBeTruthy();
  });

  it('should not show icon when unselected', () => {
    const { queryByTestId } = render(
      <PillButton label="Paleo" selected={false} onPress={jest.fn()} />,
    );
    expect(queryByTestId('icon-Check')).toBeNull();
    expect(queryByTestId('icon-X')).toBeNull();
  });
});
