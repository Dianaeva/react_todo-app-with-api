import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { UserWarning } from './UserWarning';
import * as client from './api/todos';
import { TodoList } from './components/TodoList';
import { Todo } from './types/Todo';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ErrorNotification } from './components/ErrorNotification';
import { Loader } from './components/Loader';

export const ERROR_MESSAGES = {
  failedLoadingTodos: 'Unable to load todos',
  failedAddingTodo: 'Unable to add a todo',
  failedDeletingTodo: 'Unable to delete a todo',
  failedUpdatingTodo: 'Unable to update a todo',
  emptyTitle: 'Title should not be empty',
};

export type Filter = 'all' | 'active' | 'completed';

const isFilter = (value: string): value is Filter => {
  return ['all', 'active', 'completed'].includes(value);
};

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const [appliedFilter, setAppliedFilter] = useState<Filter>('all');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [updatingTodoIds, setUpdatingTodoIds] = useState<number[]>([]);

  const notCompletedTodos: Todo[] = useMemo(() => {
    return todos.filter(todo => !todo.completed);
  }, [todos]);

  const completedTodos: Todo[] = useMemo(() => {
    return todos.filter(todo => todo.completed);
  }, [todos]);

  const addTodo = useCallback(async (title: string) => {
    setErrorMessage('');

    setTempTodo({
      id: 0,
      userId: client.USER_ID,
      title: title,
      completed: false,
    });

    return client
      .addTodo(title)
      .then(res => {
        setTempTodo(null);
        setTodos(prevTodos => [...prevTodos, res]);

        return res;
      })
      .catch(() => {
        setTempTodo(null);
        setErrorMessage(ERROR_MESSAGES.failedAddingTodo);

        return Promise.reject(ERROR_MESSAGES.failedAddingTodo);
      });
  }, []);

  const removeTodo = async (todoId: number) => {
    setErrorMessage('');

    return client
      .deleteTodo(todoId)
      .then(res => {
        setTodos(prevTodos => {
          return prevTodos.filter(todo => todo.id !== todoId);
        });

        return res;
      })
      .catch(() => {
        setErrorMessage(ERROR_MESSAGES.failedDeletingTodo);

        return Promise.reject(ERROR_MESSAGES.failedDeletingTodo);
      });
  };

  const changeTodoCompleteness = async (
    todoId: number,
    isCompleted: boolean,
  ) => {
    setErrorMessage('');

    return client
      .changeTodoCompleteness(todoId, isCompleted)
      .then(res => {
        setTodos(prevTodos => {
          const updatedTodo = prevTodos.find(todo => todo.id === todoId);
          let index;

          if (updatedTodo) {
            index = prevTodos.indexOf(updatedTodo);

            updatedTodo.completed = isCompleted;

            return [
              ...prevTodos.slice(0, index),
              updatedTodo,
              ...prevTodos.slice(index + 1),
            ];
          } else {
            return prevTodos;
          }
        });

        return res;
      })
      .catch(() => {
        setErrorMessage(ERROR_MESSAGES.failedUpdatingTodo);

        return Promise.reject(ERROR_MESSAGES.failedUpdatingTodo);
      });
  };

  const toggleAllTodos = () => {
    const promises = [];

    if (notCompletedTodos.length === 0) {
      setUpdatingTodoIds(todos.map(todo => todo.id));

      for (const todo of todos) {
        promises.push(changeTodoCompleteness(todo.id, false));
      }
    } else {
      setUpdatingTodoIds(notCompletedTodos.map(todo => todo.id));

      for (const todo of notCompletedTodos) {
        promises.push(changeTodoCompleteness(todo.id, true));
      }
    }

    Promise.allSettled(promises).finally(() => {
      setUpdatingTodoIds([]);
    });
  };

  const clearCompletedTodos = () => {
    setUpdatingTodoIds(completedTodos.map(todo => todo.id));

    const promises = completedTodos.map(todo => removeTodo(todo.id));

    Promise.allSettled(promises).finally(() => {
      setUpdatingTodoIds([]);
    });
  };

  const processTodoData = useCallback((promise: Promise<Todo[]>) => {
    promise
      .then(res => {
        setTodos(res);
        setTempTodo(null);
      })
      .catch(() => {
        setTempTodo(null);
        setErrorMessage(ERROR_MESSAGES.failedLoadingTodos);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setErrorMessage('');
    setIsLoading(true);
    let filterParam = new URL(window.location.href).hash.slice(2);

    if (filterParam === '') {
      filterParam = 'all';
    }

    if (filterParam && isFilter(filterParam)) {
      setAppliedFilter(filterParam as Filter);
    }

    setErrorMessage('');
    processTodoData(client.getTodos());
  }, [processTodoData]);

  const visibleTodos = useMemo(() => {
    switch (appliedFilter) {
      case 'active':
        return notCompletedTodos;
      case 'completed':
        return completedTodos;
      case 'all':
        return todos;
    }
  }, [todos, appliedFilter, notCompletedTodos, completedTodos]);

  if (!client.USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          setErrorMessage={setErrorMessage}
          addTodo={addTodo}
          todos={todos}
          notCompletedTodos={notCompletedTodos}
          onToggleAllTodos={toggleAllTodos}
        />

        {isLoading && <Loader />}

        <TodoList
          todos={visibleTodos}
          tempTodo={tempTodo}
          className="todoapp__main"
          deleteTodo={removeTodo}
          setErrorMessage={setErrorMessage}
          onChangeTodoCompleteness={changeTodoCompleteness}
          updatingTodoIds={updatingTodoIds}
        />

        {todos.length !== 0 && (
          <Footer
            clearCompletedTodos={clearCompletedTodos}
            notCompletedTodos={notCompletedTodos}
            completedTodos={completedTodos}
            appliedFilter={appliedFilter}
            handleFilterChange={setAppliedFilter}
          />
        )}
      </div>

      <ErrorNotification
        message={errorMessage}
        hidden={!errorMessage}
        onNotificationClosed={setErrorMessage}
      />
    </div>
  );
};
