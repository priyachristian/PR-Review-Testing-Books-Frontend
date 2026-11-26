import { useRef } from 'react';
import { Link } from 'react-router-dom';

// Hooks
import useModulePermissions from '@/hooks/useModulePermissions';

// Extras
import { RESOURCES } from '@/utils/jsonFile';
import { colorPalette } from 'utils/theme';
import { PAGE_HEADERS } from '@/utils/label';

const ViewReports = () => {
  const { useModuleGeneralLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.GENERAL_LEDGER);
  const { useModuleItemLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.ITEM_LEDGER);
  const { useModuleBankLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.BANK_LEDGER);
  const { useModuleSalesLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.SALES_LEDGER);
  const { useModulePurchaseLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.PURCHASE_LEDGER);
  const { useModuleCreditorsLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.CREDITORS_LEDGER);
  const { useModuleDebtorsLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.DEBTORS_LEDGER);
  const { useModuleGrossProfit } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.GROSS_PROFIT);
  const { useModuleCustomerAgingReport } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.CUSTOMER_AGING_REPORT);
  const { useModuleVendorAgingReport } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.VENDOR_AGING_REPORT);
  const { useModuleReceivablesPayables } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.RECEIVABLES_PAYABLES);
  const arr = [
    {
      key: 'Accountant',
      child: [
        {
          name: 'General Ledger',
          type: 'General Ledger',
          createdBy: 'System Generated',
          path: 'ledger',
          isAccessible: useModuleGeneralLedger?.canView,
        },
      ],
    },
    {
      key: 'Item',
      child: [
        {
          name: 'Item Ledger',
          type: 'Item Ledger',
          createdBy: 'System Generated',
          path: 'item-ledger',
          isAccessible: useModuleItemLedger?.canView,
        },
      ],
    },
    {
      key: 'Bank',
      child: [
        {
          name: 'Bank Ledger',
          type: 'Bank Ledger',
          createdBy: 'System Generated',
          path: 'bank-ledger',
          isAccessible: useModuleBankLedger?.canView,
        },
      ],
    },
    {
      key: 'Sales',
      child: [
        {
          name: 'Sales Ledger',
          type: 'Sales Ledger',
          createdBy: 'System Generated',
          path: 'sales-ledger',
          isAccessible: useModuleSalesLedger?.canView,
        },
      ],
    },
    {
      key: 'Purchase Ledger',
      child: [
        {
          name: 'Purchase Ledger',
          type: 'Purchase Ledger',
          createdBy: 'System Generated',
          path: 'purchase-ledger',
          isAccessible: useModulePurchaseLedger?.canView,
        },
      ],
    },
    {
      key: 'Creditors Ledger',
      child: [
        {
          name: 'Creditors Ledger',
          type: 'Creditors Ledger',
          createdBy: 'System Generated',
          path: 'creditors-ledger',
          isAccessible: useModuleCreditorsLedger?.canView,
        },
      ],
    },
    {
      key: 'Debtors Ledger',
      child: [
        {
          name: 'Debtors Ledger',
          type: 'Debtors Ledger',
          createdBy: 'System Generated',
          path: 'debtors-ledger',
          isAccessible: useModuleDebtorsLedger?.canView,
        },
      ],
    },
    {
      key: 'Gross Profit',
      child: [
        {
          name: 'Gross Profit',
          type: 'Gross Profit',
          createdBy: 'System Generated',
          path: 'gross-profit',
          isAccessible: useModuleGrossProfit?.canView,
        },
      ],
    },
    {
      key: 'Aging Reports',
      child: [
        {
          name: 'Customer Aging Report',
          type: 'Customer Aging',
          createdBy: 'System Generated',
          path: 'customer-aging',
          isAccessible: useModuleCustomerAgingReport?.canView,
        },
        {
          name: 'Vendor Aging Report',
          type: 'Vendor Aging',
          createdBy: 'System Generated',
          path: 'vendor-aging',
          isAccessible: useModuleVendorAgingReport?.canView,
        },
        {
          name: 'Receivables / Payables',
          type: 'Receivables Payables',
          createdBy: 'System Generated',
          path: 'receivables-payables',
          isAccessible: useModuleReceivablesPayables?.canView,
        },
      ],
    },
  ];

  const tbodyRefs = useRef({});

  return (
    <div className="flex flex-col -m-4">
      <div className="bg-white sticky-page-header px-4 py-3 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="text-xl ps-2 font-bold">{PAGE_HEADERS?.REPORTS?.title}</div>
      </div>
      <div className="flex gap-6 mb-8">
        <div className="w-full bg-white">
          <div className="overflow-x-auto">
            <div className="overflow-hidden border border-gray-200">
              <table className="w-full">
                <thead className="bg-white">
                  <tr className="w-full border-b border-gray-200">
                    <th className="border-r px-4 py-3 bg-[#fafafa] text-start font-semibold text-base">Report Name</th>
                    <th className=" border-r px-4 py-3 bg-[#fafafa] text-start font-semibold text-base">Type</th>
                    <th className="px-4 py-3 bg-[#fafafa] text-start font-semibold text-base">Created By</th>
                  </tr>
                </thead>
                {arr
                  ?.filter(item => item?.child?.some(child => child?.isAccessible))
                  ?.map(item => {
                    return (
                      <tbody id={item?.key} key={item?.key} ref={el => (tbodyRefs.current[item] = el)} className="divide-y divide-gray-200">
                        <tr>
                          <td className="pl-5 py-2 bg-[#f3f4f6] font-bold text-[15px] relative" colSpan={3}>
                            {`${item?.key} (${item.child?.length})`}
                          </td>
                        </tr>
                        {item?.child
                          ?.filter(nestedItem => nestedItem?.isAccessible)
                          ?.map(nestedItem => {
                            return (
                              <tr key={nestedItem?.name} className={`transition-colors duration-150 hover:bg-[${colorPalette.primary[50]}] bg-white`}>
                                <td className="py-2 pl-5 text-left relative text-[15px] font-medium rounded-l-md border-r">
                                  <Link to={`/reports/${nestedItem?.path}`} style={{ color: colorPalette.primary[500] }} className={`hover:underline`}>
                                    {nestedItem?.name}
                                  </Link>
                                </td>
                                <td className="py-2 pl-5 text-left relative text-[15px] border-r font-medium text-[#334155]">{nestedItem?.type}</td>
                                <td className="py-2 pl-5 text-left relative text-[15px] rounded-r-md font-medium text-[#334155]">{nestedItem?.createdBy}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    );
                  })}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReports;
