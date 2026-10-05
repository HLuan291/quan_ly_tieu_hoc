import axios from 'axios';

export function LayThongBaoLoi(Error: unknown) {
  if (axios.isAxiosError(Error)) {
    if (!Error.response) {
      return Error.code === 'ECONNABORTED' || Error.code === 'ETIMEDOUT'
        ? 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.'
        : 'Không kết nối được máy chủ. Vui lòng thử lại.';
    }

    const Message = Error.response.data?.message;
    if (Array.isArray(Message)) {
      return Message.join(', ');
    }
    if (typeof Message === 'string' && Message.trim()) {
      if (Error.response.status >= 500 && Message === 'Internal server error') {
        return 'Máy chủ tạm thời gặp sự cố. Vui lòng thử lại sau.';
      }
      return Message;
    }
    if (Error.response.status >= 500) {
      return 'Máy chủ tạm thời gặp sự cố. Vui lòng thử lại sau.';
    }
  }

  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}
