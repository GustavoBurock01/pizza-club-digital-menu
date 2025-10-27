import { toast } from "sonner";

/**
 * Standardized toast notifications with consistent styling
 */

export const toastSuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
    duration: 3000,
  });
};

export const toastError = (message: string, description?: string) => {
  toast.error(message, {
    description,
    duration: 4000,
  });
};

export const toastInfo = (message: string, description?: string) => {
  toast.info(message, {
    description,
    duration: 3000,
  });
};

export const toastWarning = (message: string, description?: string) => {
  toast.warning(message, {
    description,
    duration: 3500,
  });
};

export const toastLoading = (message: string) => {
  return toast.loading(message);
};

export const toastPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) => {
  return toast.promise(promise, messages);
};
