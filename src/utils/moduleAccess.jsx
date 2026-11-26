import { useEffect, useState } from 'react';
import { TeamOutlined } from '@ant-design/icons';

const LOGO_IMG_CLASS = 'w-48 h-36 object-contain scale-150';

function LazyModuleImage({ loadImage, alt }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let active = true;

    loadImage().then(module => {
      if (active) setSrc(module.default);
    });

    return () => {
      active = false;
    };
  }, [loadImage]);

  if (!src) {
    return <div className="w-20 h-20" aria-hidden />;
  }

  return <img src={src} alt={alt} className={LOGO_IMG_CLASS} loading="lazy" decoding="async" />;
}

const loadBooksLogo = () => import('@/assets/images/LOGO-SMALL.png');
const loadCrmLogo = () => import('@/assets/images/CRM-LOGO.png');

export function getAccessibleModulesList(modules) {
  const CRM_URL = import.meta.env.VITE_CRM_URL;
  const ACCOUNT_URL = import.meta.env.VITE_ACCOUNT_URL;

  const isCrmAccessible = modules?.find(module => module.module === 'CRM')?.isAccessed;

  return [
    {
      name: 'Books',
      isAccessible: true,
      icon: <LazyModuleImage loadImage={loadBooksLogo} alt="Books" />,
    },
    {
      name: 'CRM',
      isAccessible: isCrmAccessible,
      icon: <LazyModuleImage loadImage={loadCrmLogo} alt="CRM" />,
      onClick: () => {
        if (isCrmAccessible) {
          window.open(CRM_URL, '_blank');
        } else {
          window.open(ACCOUNT_URL, '_blank');
        }
      },
    },
    {
      name: 'Teams',
      isAccessible: false,
      isComingSoon: true,
      icon: <TeamOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      color: '#722ed1',
    },
  ];
}
