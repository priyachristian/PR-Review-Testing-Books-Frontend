// Components
import { Drawer } from '@/components/AntDComponent';
import CloseIconButton from '@/components/ui/button/CloseIconButton';
import BatchDetailContent from '@/components/dataDisplay/BatchDetailContent';

// Extras
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';

const BatchDetailsDrawer = ({ open, batch, loading, onClose }) => {
  return (
    <Drawer
      closable={false}
      push={false}
      title={
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Icons.InboxOutlined style={{ color: colorPalette.primary[500], fontSize: 18 }} />
            <div className="min-w-0">
              <p className="text-base font-bold text-gray-900 truncate">Batch Details</p>
            </div>
          </div>
          <CloseIconButton onClick={onClose} />
        </div>
      }
      placement="right"
      width={820}
      open={open}
      onClose={onClose}
      destroyOnClose
      maskClosable
      styles={{
        body: { padding: 0, background: '#f8fafc' },
        header: { padding: '12px 16px', borderBottom: '1px solid #e5e7eb' },
      }}
    >
      {batch && <BatchDetailContent batch={batch} variant="compact" className="px-4 py-4" />}
      {!batch && loading && <div className="px-4 py-10 text-center text-sm text-gray-500">Loading batch…</div>}
    </Drawer>
  );
};

export default BatchDetailsDrawer;
