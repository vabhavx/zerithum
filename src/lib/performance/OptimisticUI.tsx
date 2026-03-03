/**
 * Optimistic UI - Instant feedback, seamless experience
 * Show updates immediately, reconcile in background
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
} from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface OptimisticOperation<T, R> {
  id: string;
  type: string;
  payload: T;
  previousState: any;
  timestamp: number;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
}

interface OptimisticState<T> {
  data: T;
  pending: boolean;
  error: Error | null;
  lastUpdated: number;
}

interface OptimisticContextValue {
  execute: <T, R>(
    type: string,
    payload: T,
    apiCall: () => Promise<R>,
    rollbackFn?: () => void
  ) => Promise<R>;
  isPending: (type?: string) => boolean;
  getPendingCount: () => number;
}

// ============================================================================
// CONTEXT
// ============================================================================

const OptimisticContext = createContext<OptimisticContextValue>({
  execute: async () => { throw new Error('Not implemented'); },
  isPending: () => false,
  getPendingCount: () => 0,
});

export const useOptimistic = () => useContext(OptimisticContext);

// ============================================================================
// PROVIDER
// ============================================================================

export const OptimisticProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const operations = useRef<Map<string, OptimisticOperation<any, any>>>(new Map());
  const [pendingCount, setPendingCount] = useState(0);
  const queue = useRef<OptimisticOperation<any, any>[]>([]);
  const processing = useRef(false);

  const processQueue = useCallback(async () => {
    if (processing.current || queue.current.length === 0) return;
    
    processing.current = true;
    const operation = queue.current.shift();
    
    if (operation) {
      try {
        // In a real implementation, this would call the actual API
        // For now, we simulate the async behavior
        const result = await new Promise((resolve) => {
          setTimeout(() => resolve({ success: true }), 100);
        });
        
        operation.resolve(result as any);
        operations.current.delete(operation.id);
      } catch (error) {
        operation.reject(error as Error);
        if (operation.previousState) {
          // Rollback logic would go here
        }
        operations.current.delete(operation.id);
      }
    }
    
    processing.current = false;
    setPendingCount(operations.current.size);
    
    // Process next item
    if (queue.current.length > 0) {
      processQueue();
    }
  }, []);

  const execute = useCallback(<T, R>(
    type: string,
    payload: T,
    apiCall: () => Promise<R>,
    rollbackFn?: () => void
  ): Promise<R> => {
    return new Promise((resolve, reject) => {
      const operation: OptimisticOperation<T, R> = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        payload,
        previousState: null, // Would capture current state
        timestamp: Date.now(),
        resolve,
        reject,
      };

      operations.current.set(operation.id, operation);
      queue.current.push(operation);
      setPendingCount(operations.current.size);

      // Start processing
      processQueue();
    });
  }, [processQueue]);

  const isPending = useCallback((type?: string) => {
    if (!type) return operations.current.size > 0;
    return Array.from(operations.current.values()).some(op => op.type === type);
  }, []);

  const getPendingCount = useCallback(() => operations.current.size, []);

  return (
    <OptimisticContext.Provider value={{ execute, isPending, getPendingCount }}>
      {children}
    </OptimisticContext.Provider>
  );
};

// ============================================================================
// OPTIMISTIC MUTATION HOOK
// ============================================================================

interface UseOptimisticMutationOptions<T, R> {
  mutationFn: (variables: T) => Promise<R>;
  onMutate?: (variables: T) => void | Promise<void>;
  onError?: (error: Error, variables: T, context: any) => void;
  onSuccess?: (data: R, variables: T) => void;
  retryCount?: number;
  retryDelay?: number;
}

interface UseOptimisticMutationResult<T, R> {
  mutate: (variables: T) => void;
  mutateAsync: (variables: T) => Promise<R>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: R | null;
  reset: () => void;
}

export function useOptimisticMutation<T, R>(
  options: UseOptimisticMutationOptions<T, R>
): UseOptimisticMutationResult<T, R> {
  const [state, setState] = useState<{
    isPending: boolean;
    isError: boolean;
    error: Error | null;
    data: R | null;
  }>({
    isPending: false,
    isError: false,
    error: null,
    data: null,
  });

  const retryCount = useRef(0);
  const maxRetries = options.retryCount ?? 3;

  const executeMutation = useCallback(async (variables: T): Promise<R> => {
    setState(prev => ({ ...prev, isPending: true, isError: false, error: null }));
    retryCount.current = 0;

    // Optimistic update
    const context = await options.onMutate?.(variables);

    const attempt = async (): Promise<R> => {
      try {
        const result = await options.mutationFn(variables);
        
        setState({
          isPending: false,
          isError: false,
          error: null,
          data: result,
        });
        
        options.onSuccess?.(result, variables);
        return result;
      } catch (error) {
        if (retryCount.current < maxRetries) {
          retryCount.current++;
          await new Promise(resolve => setTimeout(resolve, options.retryDelay ?? 1000));
          return attempt();
        }
        
        setState({
          isPending: false,
          isError: true,
          error: error as Error,
          data: null,
        });
        
        options.onError?.(error as Error, variables, context);
        throw error;
      }
    };

    return attempt();
  }, [options]);

  const mutate = useCallback((variables: T) => {
    executeMutation(variables).catch(() => {});
  }, [executeMutation]);

  const mutateAsync = useCallback((variables: T) => {
    return executeMutation(variables);
  }, [executeMutation]);

  const reset = useCallback(() => {
    setState({
      isPending: false,
      isError: false,
      error: null,
      data: null,
    });
  }, []);

  return {
    mutate,
    mutateAsync,
    ...state,
    reset,
  };
}

// ============================================================================
// OPTIMISTIC BUTTON COMPONENT
// ============================================================================

interface OptimisticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  mutation: ReturnType<typeof useOptimisticMutation<any, any>>;
  onClick: () => void;
  children: React.ReactNode;
  loadingText?: string;
  successText?: string;
}

export const OptimisticButton: React.FC<OptimisticButtonProps> = ({
  mutation,
  onClick,
  children,
  loadingText = 'Saving...',
  successText = 'Saved!',
  ...props
}) => {
  const [showSuccess, setShowSuccess] = React.useState(false);

  useEffect(() => {
    if (mutation.data && !mutation.isPending) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [mutation.data, mutation.isPending]);

  const handleClick = () => {
    if (!mutation.isPending) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={mutation.isPending || props.disabled}
      className={`
        inline-flex items-center justify-center px-4 py-2 rounded-md
        font-medium text-sm transition-all duration-150
        ${mutation.isPending 
          ? 'bg-gray-100 text-gray-500 cursor-wait' 
          : showSuccess
            ? 'bg-green-600 text-white'
            : mutation.isError
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
        }
        ${props.className || ''}
      `}
      {...props}
    >
      {mutation.isPending ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {loadingText}
        </>
      ) : showSuccess ? (
        <>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successText}
        </>
      ) : mutation.isError ? (
        <>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Retry
        </>
      ) : (
        children
      )}
    </button>
  );
};

// ============================================================================
// INSTANT INPUT COMPONENT
// ============================================================================

interface InstantInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSave: (value: string) => Promise<void>;
  debounceMs?: number;
}

export const InstantInput: React.FC<InstantInputProps> = ({
  onSave,
  debounceMs = 500,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(props.value || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValue = useRef(props.value);

  useEffect(() => {
    setLocalValue(props.value || '');
    lastSavedValue.current = props.value;
  }, [props.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setSaveStatus('idle');

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (newValue !== lastSavedValue.current) {
        setSaveStatus('saving');
        try {
          await onSave(newValue);
          lastSavedValue.current = newValue;
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 1500);
        } catch {
          setSaveStatus('error');
        }
      }
    }, debounceMs);
  };

  return (
    <div className="relative">
      <input
        {...props}
        value={localValue}
        onChange={handleChange}
        className={`
          w-full px-3 py-2 rounded-md border transition-all duration-150
          ${saveStatus === 'error' 
            ? 'border-red-500 bg-red-50' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          }
          ${props.className || ''}
        `}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {saveStatus === 'saving' && (
          <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {saveStatus === 'saved' && (
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {saveStatus === 'error' && (
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
    </div>
  );
};
