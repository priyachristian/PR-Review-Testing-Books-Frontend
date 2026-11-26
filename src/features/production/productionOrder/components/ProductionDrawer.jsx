import { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';

// Components
import CloseIconButton from '@/components/ui/button/CloseIconButton';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { Drawer } from '@/components/AntDComponent';

const FooterSlotContext = createContext(null);

// The shell every production submit/view drawer shares: same size, same header layout, same footer rule.
const ProductionDrawer = ({ title, status, statusLabel, meta, footer, maskClosable = true, onClose, children }) => {
  const [footerSlot, setFooterSlot] = useState(null);

  return (
    <Drawer
      open
      placement="right"
      width={1120}
      closable={false}
      destroyOnClose
      maskClosable={maskClosable}
      onClose={onClose}
      title={
        <div className="flex items-start justify-between gap-3 w-full py-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-gray-900">{title}</span>
              {status ? <StatusBadge status={status} value={statusLabel} /> : null}
            </div>
            {meta ? <div className="flex flex-wrap mt-2">{meta}</div> : null}
          </div>
          <CloseIconButton onClick={onClose} />
        </div>
      }
      styles={{
        body: { padding: '16px 24px', background: '#f8fafc' },
        header: { padding: '12px 16px', borderBottom: '1px solid #e5e7eb' },
        footer: { borderTop: '1px solid #e5e7eb', padding: '12px 24px' },
      }}
      footer={
        <div ref={setFooterSlot} className="flex items-center justify-end gap-2">
          {footer}
        </div>
      }
    >
      <FooterSlotContext.Provider value={footerSlot}>{children}</FooterSlotContext.Provider>
    </Drawer>
  );
};

export const ProductionDrawerFooter = ({ children }) => {
  const footerSlot = useContext(FooterSlotContext);
  return footerSlot ? createPortal(children, footerSlot) : null;
};

export default ProductionDrawer;
