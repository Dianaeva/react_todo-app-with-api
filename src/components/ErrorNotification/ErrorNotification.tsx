import React, { useState, useEffect, useRef, useCallback } from 'react';
import cn from 'classnames';

import { ErrorState } from '../../types/Error';

type Props = {
  error: ErrorState;
  hidden: boolean;
  onNotificationClosed: () => void;
};

const ErrorNotificationBase: React.FC<Props> = ({
  hidden,
  onNotificationClosed,
  error,
}) => {
  const [isHidden, setIsHidden] = useState(hidden);

  const timerId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeNotification = useCallback(() => {
    if (timerId.current) {
      clearTimeout(timerId.current);
    }

    setIsHidden(true);
    onNotificationClosed();
  }, [onNotificationClosed]);

  useEffect(() => {
    setIsHidden(hidden);
  }, [hidden]);

  useEffect(() => {
    if (hidden) {
      setIsHidden(true);

      return;
    }

    setIsHidden(false);

    if (timerId.current) {
      clearTimeout(timerId.current);
    }

    timerId.current = setTimeout(closeNotification, 3_000);

    return () => {
      if (timerId.current) {
        clearTimeout(timerId.current);
      }
    };
  }, [hidden, error.id, closeNotification]);

  return (
    <div
      data-cy="ErrorNotification"
      className={cn(
        'notification',
        'is-danger',
        'is-light',
        'has-text-weight-normal',
        {
          hidden: isHidden,
        },
      )}
    >
      <button
        data-cy="HideErrorButton"
        type="button"
        className="delete"
        onClick={closeNotification}
      />
      {error.errorMessage}
    </div>
  );
};

export const ErrorNotification = React.memo(ErrorNotificationBase);
