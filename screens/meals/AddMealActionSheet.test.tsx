import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AddMealActionSheet from './AddMealActionSheet';

const defaultProps = {
  visible: true,
  mealType: 'Dinner',
  onClose: jest.fn(),
  onAddMeal: jest.fn(),
  onPhotoCapture: jest.fn(),
  isLoading: false,
};

describe('AddMealActionSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render three options in choose mode', () => {
    const { getByText } = render(<AddMealActionSheet {...defaultProps} />);

    expect(getByText('Generate with AI')).toBeTruthy();
    expect(getByText('Import from Website')).toBeTruthy();
    expect(getByText('Scan from Photo')).toBeTruthy();
  });

  it('should display the mealType in the header', () => {
    const { getByText } = render(<AddMealActionSheet {...defaultProps} />);

    expect(getByText('Add Dinner')).toBeTruthy();
  });

  it('should call onAddMeal when Generate with AI is pressed', () => {
    const { getByText } = render(<AddMealActionSheet {...defaultProps} />);

    fireEvent.press(getByText('Generate with AI'));

    expect(defaultProps.onAddMeal).toHaveBeenCalledTimes(1);
    expect(defaultProps.onAddMeal).toHaveBeenCalledWith();
  });

  it('should switch to URL mode when Import from Website is pressed', () => {
    const { getByText, getByPlaceholderText } = render(
      <AddMealActionSheet {...defaultProps} />,
    );

    fireEvent.press(getByText('Import from Website'));

    expect(getByPlaceholderText('https://example.com/recipe')).toBeTruthy();
    expect(getByText('Import Recipe')).toBeTruthy();
  });

  it('should switch to photo mode when Scan from Photo is pressed', () => {
    const { getByText } = render(<AddMealActionSheet {...defaultProps} />);

    fireEvent.press(getByText('Scan from Photo'));

    expect(getByText('Take Photo')).toBeTruthy();
    expect(getByText('Choose from Library')).toBeTruthy();
  });

  it('should call onPhotoCapture with camera when Take Photo is pressed', () => {
    const { getByText } = render(<AddMealActionSheet {...defaultProps} />);

    fireEvent.press(getByText('Scan from Photo'));
    fireEvent.press(getByText('Take Photo'));

    expect(defaultProps.onPhotoCapture).toHaveBeenCalledWith('camera');
  });

  it('should call onPhotoCapture with gallery when Choose from Library is pressed', () => {
    const { getByText } = render(<AddMealActionSheet {...defaultProps} />);

    fireEvent.press(getByText('Scan from Photo'));
    fireEvent.press(getByText('Choose from Library'));

    expect(defaultProps.onPhotoCapture).toHaveBeenCalledWith('gallery');
  });

  it('should show back arrow in photo mode and return to choose mode', () => {
    const { getByText, getByTestId, queryByText } = render(
      <AddMealActionSheet {...defaultProps} />,
    );

    // Navigate to photo mode
    fireEvent.press(getByText('Scan from Photo'));

    // Verify we're in photo mode
    expect(getByText('Take Photo')).toBeTruthy();
    expect(queryByText('Generate with AI')).toBeNull();

    // Tap the back arrow to return to choose mode
    fireEvent.press(getByTestId('icon-ArrowLeft'));

    // Should be back in choose mode
    expect(getByText('Generate with AI')).toBeTruthy();
    expect(getByText('Scan from Photo')).toBeTruthy();
  });

  it('should show back arrow in URL mode and return to choose mode', () => {
    const { getByText, getByTestId, queryByText } = render(
      <AddMealActionSheet {...defaultProps} />,
    );

    fireEvent.press(getByText('Import from Website'));

    expect(getByText('Import Recipe')).toBeTruthy();
    expect(queryByText('Generate with AI')).toBeNull();

    fireEvent.press(getByTestId('icon-ArrowLeft'));

    expect(getByText('Generate with AI')).toBeTruthy();
  });
});
