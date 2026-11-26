import { Alert } from '@/components/AntDComponent';

const CHALLAN_POINTS = [
  'Stock moves from the From warehouse to the To warehouse when the challan is marked as Sent, and moves back if it returns to Draft or is cancelled.',
  'An invoice made from this challan does not deduct stock again. The moved stock stays in the To warehouse.',
  'The customer must be a Branch / Divisions customer, one of your own branches or divisions.',
  'Both warehouses need a full address with different PIN codes. The e-way bill is filed from and to these addresses.',
];

const StockTransferNotice = ({ variant = 'challan', className = '' }) => {
  if (variant === 'invoice') {
    return (
      <Alert
        className={className}
        type="info"
        showIcon
        message="Made from an internal stock transfer"
        description="This invoice does not deduct stock. The stock already moved to the To warehouse when the delivery challan was sent."
      />
    );
  }

  return (
    <Alert
      className={className}
      type="info"
      showIcon
      message="Internal stock transfer"
      description={
        <ul className="m-0 mt-1 list-disc space-y-1 pl-4 text-[13px]">
          {CHALLAN_POINTS.map(point => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      }
    />
  );
};

export default StockTransferNotice;
