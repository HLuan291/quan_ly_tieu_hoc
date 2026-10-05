import { TaoCauHinhMySql } from './cau_hinh_database';

describe('Kết nối MySQL và khóa RSA', () => {
  it.each(['localhost', 'LOCALHOST', '127.0.0.1', '[::1]'])(
    'cho phép xác thực RSA với MySQL local tại %s',
    (Host) => {
      expect(TaoCauHinhMySql('mysql://demo:secret@' + Host + '/school').allowPublicKeyRetrieval).toBe(true);
    },
  );

  it.each(['db.example.test', '192.168.1.8', 'localhost.example.test'])(
    'giữ lấy khóa từ server mặc định tắt tại %s',
    (Host) => {
      expect(TaoCauHinhMySql('mysql://demo:secret@' + Host + '/school').allowPublicKeyRetrieval).toBe(false);
    },
  );

  it('cho phép cấu hình tắt việc lấy khóa ở local', () => {
    expect(TaoCauHinhMySql('mysql://demo:secret@localhost/school?allowPublicKeyRetrieval=false').allowPublicKeyRetrieval).toBe(false);
  });

  it('truyền lựa chọn lấy khóa rõ ràng cho server được cấu hình', () => {
    expect(TaoCauHinhMySql('mysql://demo:secret@db.example.test/school?allowPublicKeyRetrieval=true').allowPublicKeyRetrieval).toBe(true);
  });

  it('giải mã tên và mật khẩu có ký tự đặc biệt, giữ cổng và database', () => {
    expect(TaoCauHinhMySql('mysql://demo%40school:p%40ss%23word@127.0.0.1:3307/school%5Ftest')).toEqual({
      host: '127.0.0.1', port: 3307, user: 'demo@school', password: 'p@ss#word',
      database: 'school_test', connectionLimit: 5, allowPublicKeyRetrieval: true,
    });
  });

  it('bỏ ngoặc IPv6 trước khi truyền host cho driver', () => {
    expect(TaoCauHinhMySql('mysql://demo:secret@[::1]/school').host).toBe('::1');
  });

  it.each(['1', 'FALSE', 'yes'])('từ chối tùy chọn khóa sai %s', (Value) => {
    expect(() => TaoCauHinhMySql('mysql://demo:secret@localhost/school?allowPublicKeyRetrieval=' + Value)).toThrow('allowPublicKeyRetrieval chỉ nhận true hoặc false');
  });

  it.each([undefined, 'not a URL', 'postgres://demo:secret@localhost/school', 'mysql://demo:secret@localhost/'])(
    'báo cấu hình sai trước khi gọi database',
    (Value) => {
      expect(() => TaoCauHinhMySql(Value)).toThrow(Error);
    },
  );

  it('không đưa mật khẩu cấu hình vào lỗi trả ra', () => {
    try {
      TaoCauHinhMySql('mysql://demo:private-secret@localhost:wrong/school');
      throw new Error('Phải từ chối URL sai');
    } catch (Error) {
      expect(String(Error)).not.toContain('private-secret');
    }
  });
});
