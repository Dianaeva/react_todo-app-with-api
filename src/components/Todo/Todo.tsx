import React, { useEffect, useState } from 'react';
import cn from 'classnames';

import { Todo as TodoType } from '../../types/Todo';

type Props = {
  todo: TodoType;
  isUpdating?: boolean;
  deleteTodo?: (todoId: number) => Promise<unknown>;
  setErrorMessage?: (message: string) => void;
  onChangeTodoCompleteness?: (
    todoId: number,
    isCompleted: boolean,
  ) => Promise<TodoType | void>;
};

const TodoBase: React.FC<Props> = ({
  todo,
  isUpdating = false,
  deleteTodo,
  setErrorMessage = () => {},
  onChangeTodoCompleteness,
}) => {
  const [isTodoUpdating, setIsTodoUpdating] = useState(isUpdating);

  const handleChangeCompleteness = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChangeTodoCompleteness) {
      setIsTodoUpdating(true);
      setErrorMessage('');

      onChangeTodoCompleteness(todo.id, e.target.checked).finally(() => {
        setIsTodoUpdating(false);
      });
    }
  };

  const handleDeleteTodo = () => {
    if (deleteTodo) {
      setIsTodoUpdating(true);

      deleteTodo(todo.id).finally(() => {
        setIsTodoUpdating(false);
      });
    }
  };

  useEffect(() => {
    setIsTodoUpdating(isUpdating);
  }, [isUpdating]);

  return (
    <div
      data-cy="Todo"
      className={cn('todo', {
        completed: todo.completed,
      })}
    >
      <label className="todo__status-label">
        <input
          onChange={handleChangeCompleteness}
          id={`${todo.id}`}
          data-cy="TodoStatus"
          type="checkbox"
          className="todo__status"
          checked={todo.completed}
          aria-label="Toggle todo status"
        />
      </label>

      <span data-cy="TodoTitle" className="todo__title">
        {todo.title}
      </span>

      <button
        type="button"
        className="todo__remove"
        data-cy="TodoDelete"
        onClick={handleDeleteTodo}
      >
        ×
      </button>

      <div
        data-cy="TodoLoader"
        className={cn('modal', 'overlay', {
          'is-active': isTodoUpdating,
        })}
      >
        <div className="modal-background has-background-white-ter" />
        <div className="loader" />
      </div>
    </div>
  );
};

export const Todo = React.memo(TodoBase);
