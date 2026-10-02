import axios from 'axios';

export function layThongBaoLoi(
  error: unknown,
) {
  if (
    axios.isAxiosError(error)
  ) {
    const message =
      error.response?.data
        ?.message;

    if (
      Array.isArray(message)
    ) {
      return message.join(', ');
    }

    if (
      typeof message ===
      'string'
    ) {
      return message;
    }
  }

  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}
