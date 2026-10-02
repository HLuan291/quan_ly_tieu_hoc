import axios from 'axios';

export function LayThongBaoLoi(
  Error: unknown,
) {
  if (
    axios.isAxiosError(
      Error,
    )
  ) {
    const Message =
      Error.response?.data
        ?.message;

    if (
      Array.isArray(
        Message,
      )
    ) {
      return Message.join(', ');
    }

    if (
      typeof Message ===
      'string'
    ) {
      return Message;
    }
  }

  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}
