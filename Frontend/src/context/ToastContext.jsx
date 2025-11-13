import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [modal, setModal] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const confirmResolveRef = useRef(null);
  const onCloseCallbackRef = useRef(null);

  const showToast = useCallback((message, type = 'success', onClose = null) => {
    // Store the callback in a ref so we can access it later
    onCloseCallbackRef.current = onClose;
    // If there's already a modal closing, wait for it to finish
    if (isClosing) {
      setTimeout(() => {
        setModal({ message, type });
        setIsClosing(false);
      }, 300);
    } else {
      setModal({ message, type });
      setIsClosing(false);
    }
  }, [isClosing]);

  const hideToast = useCallback(() => {
    if (isClosing) return; // Prevent multiple close calls
    setIsClosing(true);
    setTimeout(() => {
      // Call the onClose callback if provided
      if (onCloseCallbackRef.current) {
        onCloseCallbackRef.current();
        onCloseCallbackRef.current = null;
      }
      setModal(null);
      setIsClosing(false);
    }, 300); // Match animation duration
  }, [isClosing]);

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setModal({ message, type: 'confirm' });
      setIsClosing(false);
    });
  }, []);

  const handleConfirm = useCallback((confirmed) => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current(confirmed);
      confirmResolveRef.current = null;
    }
    hideToast();
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, showConfirm }}>
      {children}
      {modal && (
        <Modal 
          modal={modal} 
          onClose={modal.type === 'confirm' ? () => handleConfirm(false) : hideToast}
          onConfirm={modal.type === 'confirm' ? () => handleConfirm(true) : null}
          isClosing={isClosing} 
        />
      )}
    </ToastContext.Provider>
  );
};

const Modal = ({ modal, onClose, onConfirm, isClosing }) => {
  const { message, type } = modal;

  const getModalStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          iconBg: 'bg-green-100 dark:bg-green-900/30',
          iconColor: 'text-green-600 dark:text-green-400',
          buttonBg: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
          borderColor: 'border-green-200 dark:border-green-700',
        };
      case 'error':
        return {
          icon: '❌',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonBg: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
          borderColor: 'border-red-200 dark:border-red-700',
        };
      case 'info':
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
          buttonBg: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
          borderColor: 'border-blue-200 dark:border-blue-700',
        };
      case 'confirm':
        return {
          icon: '❓',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          buttonBg: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
          borderColor: 'border-yellow-200 dark:border-yellow-700',
        };
      default:
        return {
          icon: '📢',
          iconBg: 'bg-gray-100 dark:bg-gray-800',
          iconColor: 'text-gray-600 dark:text-gray-400',
          buttonBg: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
          borderColor: 'border-gray-200 dark:border-gray-700',
        };
    }
  };

  const styles = getModalStyles();
  const isConfirm = type === 'confirm';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 ${styles.borderColor} max-w-md w-full p-4 sm:p-6 pointer-events-auto transition-all duration-300 ${
            isClosing 
              ? 'opacity-0 scale-90 translate-y-[-20px]' 
              : 'opacity-100 scale-100 translate-y-0'
          }`}
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: isClosing ? 'none' : 'modalPopIn 0.3s ease-out',
          }}
        >
          <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
            {/* Icon */}
            <div className={`${styles.iconBg} rounded-full p-3 sm:p-4`}>
              <span className={`text-3xl sm:text-4xl ${styles.iconColor}`}>{styles.icon}</span>
            </div>
            
            {/* Message */}
            <p className="text-gray-800 dark:text-gray-200 text-base sm:text-lg font-semibold px-2">
              {message}
            </p>
            
            {/* Buttons */}
            {isConfirm ? (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full mt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  No
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 ${styles.buttonBg} text-white font-semibold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
                >
                  Yes
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                className={`${styles.buttonBg} text-white font-semibold px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mt-2`}
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

