export const wrapResponse = <T>(data: T, message?: string) => ({
  success: true,
  message,
  data,
});

export const response = {
  success: <T>(data: T, message?: string) => wrapResponse(data, message),
  error: (message: string, code?: string) => ({
    success: false,
    message,
    code,
  }),
};
