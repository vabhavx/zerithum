
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import AlertBanner from './AlertBanner';
import '@testing-library/jest-dom';

// Mock framer-motion since it's used in the component
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => {
      // Filter out framer-motion specific props that might cause issues in DOM
      const { initial, animate, exit, ...validProps } = props;
      return <div className={className} {...validProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('AlertBanner', () => {
  it('renders nothing when no alerts are provided', () => {
    const { container } = render(<AlertBanner alerts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders alerts with correct titles and descriptions', () => {
    const alerts = [
      {
        id: '1',
        type: 'error',
        title: 'Error Alert',
        description: 'Something went wrong',
        dismissible: true
      },
      {
        id: '2',
        type: 'info',
        title: 'Info Alert',
        description: 'Just letting you know',
        dismissible: false
      }
    ];

    render(<AlertBanner alerts={alerts} />);

    expect(screen.getByText('Error Alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Info Alert')).toBeInTheDocument();
  });

  it('renders dismiss button with accessible label for dismissible alerts', () => {
    const alerts = [
      {
        id: '1',
        type: 'warning',
        title: 'Warning Alert',
        dismissible: true
      }
    ];

    const onDismiss = vi.fn();
    render(<AlertBanner alerts={alerts} onDismiss={onDismiss} />);

    // This is the key test for our change
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Dismiss Warning Alert');

    fireEvent.click(button);
    expect(onDismiss).toHaveBeenCalledWith('1');
  });

  it('does not render dismiss button for non-dismissible alerts', () => {
    const alerts = [
      {
        id: '1',
        type: 'sync',
        title: 'Sync Alert',
        dismissible: false
      }
    ];

    render(<AlertBanner alerts={alerts} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
