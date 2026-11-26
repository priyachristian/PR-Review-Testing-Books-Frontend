// Components
import { message } from '@/components/AntDComponent';

// Configure global message settings
message.config({
  duration: 6,
  maxCount: 3,
  rtl: false,
});

const Toast = {
  success: content => {
    message.success({
      content,
      duration: 5,
    });
  },
  error: content => {
    message.error({
      content,
      duration: 5,
    });
  },
  warning: content => {
    message.warning({
      content,
      duration: 5,
    });
  },
  info: content => {
    message.info({
      content,
      duration: 5,
    });
  },
  loading: (content, duration = 0) => {
    return message.loading({
      content,
      duration,
    });
  },
  close: () => {
    message.destroy();
  },
};

export default Toast;
