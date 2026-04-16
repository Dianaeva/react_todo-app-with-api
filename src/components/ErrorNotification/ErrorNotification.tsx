import React, { useState, useEffect, useRef, useCallback } from 'react';
import cn from 'classnames';

type Props = {
  message: string;
  hidden: boolean;
  onNotificationClosed: (message: string) => void;
};

const ErrorNotificationBase: React.FC<Props> = ({
  message,
  hidden,
  onNotificationClosed,
}) => {
  const [isHidden, setIsHidden] = useState(hidden);

  const timerId = useRef<number | null>(null);
  const messageTimerId = useRef<number | null>(null);

  const closeNotification = useCallback(() => {
    if (messageTimerId.current) {
      window.clearTimeout(messageTimerId.current);
    }

    setIsHidden(true);
    messageTimerId.current = window.setTimeout(() => {
      onNotificationClosed('');
    }, 1_000);
  }, [onNotificationClosed]);

  useEffect(() => {
    setIsHidden(hidden);
  }, [hidden]);

  useEffect(() => {
    if (timerId.current) {
      window.clearTimeout(timerId.current);
    }

    timerId.current = window.setTimeout(() => {
      closeNotification();
    }, 3_000);

    return () => {
      if (timerId.current) {
        window.clearTimeout(timerId.current);
      }
    };
  }, [hidden, message, closeNotification]);

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
      {message}
    </div>
  );
};

export const ErrorNotification = React.memo(ErrorNotificationBase);
