import { Button } from '@/components/AntDComponent';
import Icons from 'assets/icons/icon';

export const CLOSE_ICON_BUTTON_CLASS =
  'flex !h-10 !w-10 shrink-0 items-center justify-center p-0 leading-none [&_.ant-btn-icon]:m-0 [&_.ant-btn-icon]:flex [&_.ant-btn-icon]:items-center [&_.ant-btn-icon]:justify-center';

const CloseIconButton = ({ className = '', onClick, ...rest }) => (
  <Button size="small" className={[CLOSE_ICON_BUTTON_CLASS, className].filter(Boolean).join(' ')} icon={<Icons.CloseOutlined />} onClick={onClick} aria-label="Close" {...rest} />
);

export default CloseIconButton;
