import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { UpOutlined } from '@ant-design/icons';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  const toggleVisibility = () => {
    if (window.scrollY > 100) {
      setShouldRender(true);
      setIsVisible(true);
      setAnimationClass('scroll-to-top-enter');
    } else {
      setIsVisible(false);
      setAnimationClass('scroll-to-top-exit');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isVisible]);

  return (
    shouldRender && (
      <Button onClick={scrollToTop} icon={<UpOutlined className="animate-bounce" />} type="primary" className={`fixed bottom-16 right-6 z-50 shadow-lg ${animationClass} scroll-top-btn`}></Button>
    )
  );
};

export default ScrollToTopButton;
