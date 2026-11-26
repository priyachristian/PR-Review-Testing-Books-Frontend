import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Components
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

// Extras
import { dateFormateForUi } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const GeneralLedger = ({ loading, reports }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [currentPageRecords, setCurrentPageRecords] = useState();
  const [searchParams] = useSearchParams();
  const recordsPerPage = useRef(DEFAULT_PAGE_SIZE);
  const prevPageLimitRef = useRef(recordsPerPage.current);

  let finalRecords = reports?.ledger ? [...reports.ledger] : [];
  let totalPages = Math.ceil(reports?.ledger?.length / recordsPerPage.current);

  const getClosingBalance = () => {
    let totalDebit = finalRecords.reduce((sum, r) => sum + (r.debit || 0), 0);
    let totalCredit = finalRecords.reduce((sum, r) => sum + (r.credit || 0), 0);

    if (reports?.openingBalanceType === 'DR') {
      totalDebit = totalDebit + reports?.openingBalance;
    } else {
      totalCredit = totalCredit + reports?.openingBalance;
    }

    const finalBalance = totalDebit > totalCredit ? totalDebit : totalCredit;

    const closingBalanceRows = [
      {
        date: '',
        description: '',
        debit: reports?.totalDebit,
        credit: reports?.totalCredit,
        type: '',
        invoiceId: '',
        status: '',
        role: '',
        balance: 0,
        balanceType: '',
      },
    ];

    if (reports?.closingBalance !== undefined) {
      closingBalanceRows.push({
        date: searchParams?.get('endDate') ? searchParams?.get('endDate') : '',
        description: 'Closing Balance',
        debit: reports?.closingBalanceType === 'DR' ? reports?.closingBalance : '',
        credit: reports?.closingBalanceType === 'CR' ? reports?.closingBalance : '',
        type: '',
        invoiceId: '',
        status: '',
        role: '',
        balance: 0,
        balanceType: reports?.closingBalanceType,
      });
    }

    closingBalanceRows.push({
      date: '',
      description: '',
      debit: finalBalance,
      credit: finalBalance,
      type: '',
      invoiceId: '',
      status: '',
      role: '',
      balance: 0,
      balanceType: '',
    });

    return closingBalanceRows;
  };

  const handlePaginationChange = (page, limit) => {
    if (prevPageLimitRef.current !== limit) {
      recordsPerPage.current = limit;
      prevPageLimitRef.current = limit;
    }
    let finalRecords = reports?.ledger ? [...reports.ledger] : [];
    let totalPages = Math.ceil(reports?.ledger?.length / recordsPerPage.current);
    let recordNumberForNextPage = page === 1 ? 0 : (page - 1) * recordsPerPage.current;
    let updatedPageRecords = finalRecords?.slice(recordNumberForNextPage, recordsPerPage.current * page);
    setPage(page);

    if (page === totalPages) {
      let totalDebit = finalRecords.reduce((sum, r) => sum + (r.debit || 0), 0);
      let totalCredit = finalRecords.reduce((sum, r) => sum + (r.credit || 0), 0);

      if (reports?.openingBalanceType === 'DR') {
        totalDebit = totalDebit + reports?.openingBalance;
      } else {
        totalCredit = totalCredit + reports?.openingBalance;
      }

      const prevPageStart = page - 1;
      const prevPageRecords = finalRecords.slice(0, prevPageStart * recordsPerPage.current);

      let prevPageTotalDebit = prevPageRecords.reduce((sum, r) => sum + (r.debit || 0), 0);
      let prevPageTotalCredit = prevPageRecords.reduce((sum, r) => sum + (r.credit || 0), 0);

      if (reports?.openingBalanceType === 'DR') {
        prevPageTotalDebit = prevPageTotalDebit + reports?.openingBalance;
      } else {
        prevPageTotalCredit = prevPageTotalCredit + reports?.openingBalance;
      }

      const finalBalance = totalDebit > totalCredit ? totalDebit : totalCredit;
      if (page !== 1) {
        updatedPageRecords.unshift({
          date: '',
          description: 'Brought Forward',
          debit: prevPageTotalDebit,
          credit: prevPageTotalCredit,
          type: '',
          invoiceId: '',
          status: '',
          role: '',
          balance: 0,
          balanceType: '',
        });
      }

      let closingBalanceArr = [
        {
          date: '',
          description: '',
          debit: reports?.totalDebit,
          credit: reports?.totalCredit,
          type: '',
          invoiceId: '',
          status: '',
          role: '',
          balance: 0,
          balanceType: '',
        },
      ];

      if (reports?.closingBalance !== undefined) {
        closingBalanceArr.push({
          date: searchParams?.get('endDate') ? searchParams?.get('endDate') : '',
          description: 'Closing Balance',
          debit: reports?.closingBalanceType === 'DR' ? reports?.closingBalance : '',
          credit: reports?.closingBalanceType === 'CR' ? reports?.closingBalance : '',
          type: '',
          invoiceId: '',
          status: '',
          role: '',
          balance: 0,
          balanceType: reports?.closingBalanceType,
        });
      }

      closingBalanceArr.push({
        date: '',
        description: '',
        debit: finalBalance,
        credit: finalBalance,
        type: '',
        invoiceId: '',
        status: '',
        role: '',
        balance: 0,
        balanceType: '',
      });

      updatedPageRecords.push(...closingBalanceArr);
    } else {
      if (page !== 1) {
        const prevPageStart = page - 1;
        const prevPageRecords = finalRecords.slice(0, prevPageStart * recordsPerPage.current);

        let prevPageTotalDebit = prevPageRecords.reduce((sum, r) => sum + (r.debit || 0), 0);
        let prevPageTotalCredit = prevPageRecords.reduce((sum, r) => sum + (r.credit || 0), 0);

        if (reports?.openingBalanceType === 'DR') {
          prevPageTotalDebit = prevPageTotalDebit + reports?.openingBalance;
        } else {
          prevPageTotalCredit = prevPageTotalCredit + reports?.openingBalance;
        }

        let pageTotalDebit = updatedPageRecords.reduce((sum, r) => sum + (r.debit || 0), 0);
        let pageTotalCredit = updatedPageRecords.reduce((sum, r) => sum + (r.credit || 0), 0);

        if (reports?.openingBalanceType === 'DR') {
          pageTotalDebit = pageTotalDebit + prevPageTotalDebit;
        } else {
          pageTotalCredit = pageTotalCredit + prevPageTotalCredit;
        }

        updatedPageRecords.unshift({
          date: '',
          description: 'Brought Forward',
          debit: prevPageTotalDebit,
          credit: prevPageTotalCredit,
          type: '',
          invoiceId: '',
          status: '',
          role: '',
          balance: 0,
          balanceType: '',
        });

        if (page !== totalPages) {
          updatedPageRecords.push({
            date: '',
            description: 'Carried Over',
            debit: pageTotalDebit,
            credit: pageTotalCredit,
            type: '',
            invoiceId: '',
            status: '',
            role: '',
            balance: 0,
            balanceType: '',
          });
        }
      } else {
        let pageTotalDebit = updatedPageRecords.reduce((sum, r) => sum + (r.debit || 0), 0);
        let pageTotalCredit = updatedPageRecords.reduce((sum, r) => sum + (r.credit || 0), 0);

        if (reports?.openingBalance) {
          let obj = {
            date: searchParams?.get('startDate') ? searchParams?.get('startDate') : '',
            description: 'Opening Balance',
            debit: reports?.openingBalanceType === 'DR' ? reports?.openingBalance : '',
            credit: reports?.openingBalanceType === 'CR' ? reports?.openingBalance : '',
            type: '',
            invoiceId: '',
            status: '',
            role: '',
            balance: 0,
            balanceType: reports?.openingBalanceType,
          };
          updatedPageRecords?.unshift(obj);

          if (reports?.openingBalanceType === 'DR') {
            pageTotalDebit = pageTotalDebit + reports?.openingBalance;
          } else {
            pageTotalCredit = pageTotalCredit + reports?.openingBalance;
          }
        }

        if (page !== totalPages) {
          updatedPageRecords.push({
            date: '',
            description: 'Carried Over',
            debit: pageTotalDebit,
            credit: pageTotalCredit,
            type: '',
            invoiceId: '',
            status: '',
            role: '',
            balance: 0,
            balanceType: '',
          });
        }
      }

      let closingBalance = getClosingBalance();
      updatedPageRecords.push(...closingBalance);
    }

    setCurrentPageRecords(updatedPageRecords);
  };

  useEffect(() => {
    setPage(1);
  }, [loading]);

  useEffect(() => {
    if (reports?.ledger?.length > 0) {
      let initialPageRecords = finalRecords?.slice(0, recordsPerPage.current);
      let pageTotalDebit = initialPageRecords.reduce((sum, r) => sum + (r.debit || 0), 0);
      let pageTotalCredit = initialPageRecords.reduce((sum, r) => sum + (r.credit || 0), 0);

      if (reports?.openingBalance) {
        let obj = {
          date: searchParams?.get('startDate') ? searchParams?.get('startDate') : '',
          description: 'Opening Balance',
          debit: reports?.openingBalanceType === 'DR' ? reports?.openingBalance : '',
          credit: reports?.openingBalanceType === 'CR' ? reports?.openingBalance : '',
          type: '',
          invoiceId: '',
          status: '',
          role: '',
          balance: 0,
          balanceType: reports?.openingBalanceType,
        };
        initialPageRecords?.unshift(obj);

        if (reports?.openingBalanceType === 'DR') {
          pageTotalDebit = pageTotalDebit + reports?.openingBalance;
        } else {
          pageTotalCredit = pageTotalCredit + reports?.openingBalance;
        }
      }

      if (page === totalPages) {
        let totalDebit = finalRecords.reduce((sum, r) => sum + (r.debit || 0), 0);
        let totalCredit = finalRecords.reduce((sum, r) => sum + (r.credit || 0), 0);

        if (reports?.openingBalanceType === 'DR') {
          totalDebit = totalDebit + reports?.openingBalance;
        } else {
          totalCredit = totalCredit + reports?.openingBalance;
        }

        const finalBalance = totalDebit > totalCredit ? totalDebit : totalCredit;

        let closingBalanceArr = [
          {
            date: '',
            description: '',
            debit: reports?.totalDebit,
            credit: reports?.totalCredit,
            type: '',
            invoiceId: '',
            status: '',
            role: '',
            balance: 0,
            balanceType: '',
          },
        ];

        if (reports?.closingBalance !== undefined) {
          closingBalanceArr.push({
            date: searchParams?.get('endDate') ? searchParams?.get('endDate') : '',
            description: 'Closing Balance',
            debit: reports?.closingBalanceType === 'DR' ? reports?.closingBalance : '',
            credit: reports?.closingBalanceType === 'CR' ? reports?.closingBalance : '',
            type: '',
            invoiceId: '',
            status: '',
            role: '',
            balance: 0,
            balanceType: reports?.closingBalanceType,
          });
        }

        closingBalanceArr.push({
          date: '',
          description: '',
          debit: finalBalance,
          credit: finalBalance,
          type: '',
          invoiceId: '',
          status: '',
          role: '',
          balance: 0,
          balanceType: '',
        });

        initialPageRecords.push(...closingBalanceArr);
      } else {
        initialPageRecords.push({
          date: '',
          description: 'Carried Over',
          debit: pageTotalDebit,
          credit: pageTotalCredit,
          type: '',
          invoiceId: '',
          status: '',
          role: '',
          balance: 0,
          balanceType: '',
        });

        let closingBalance = getClosingBalance();
        initialPageRecords.push(...closingBalance);
      }

      setCurrentPageRecords(initialPageRecords);
    } else if (reports?.openingBalance) {
      const records = [
        {
          date: searchParams?.get('startDate') ? searchParams?.get('startDate') : '',
          description: 'Opening Balance',
          debit: reports?.openingBalanceType === 'DR' ? reports?.openingBalance : '',
          credit: reports?.openingBalanceType === 'CR' ? reports?.openingBalance : '',
          type: '',
          invoiceId: '',
          status: '',
          role: '',
          balance: 0,
          balanceType: reports?.openingBalanceType,
        },
      ];

      const emptyRow = {
        date: '',
        description: '',
        debit: '',
        credit: '',
        type: '',
        invoiceId: '',
        status: '',
        role: '',
        balance: 0,
        balanceType: '',
      };
      records.push(emptyRow, emptyRow);

      if (reports?.closingBalance !== undefined) {
        records.push({
          date: searchParams?.get('endDate') ? searchParams?.get('endDate') : '',
          description: 'Closing Balance',
          debit: reports?.closingBalanceType === 'DR' ? reports?.closingBalance : '',
          credit: reports?.closingBalanceType === 'CR' ? reports?.closingBalance : '',
          type: '',
          invoiceId: '',
          status: '',
          role: '',
          balance: 0,
          balanceType: reports?.closingBalanceType,
        });
      }

      setCurrentPageRecords(records);
    } else {
      setCurrentPageRecords([]);
    }
  }, [reports?.ledger]);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: date => (date ? dateFormateForUi(date) : ''),
      align: 'left',
    },
    {
      title: 'Particulars',
      dataIndex: 'description',
      key: 'description',
      render: description => (
        <span className={description === 'Opening Balance' || description === 'Carried Over' || description === 'Closing Balance' || description === 'Brought Forward' ? 'font-bold' : ''}>
          {description}
        </span>
      ),
      align: 'left',
    },
    {
      title: 'Vch Type',
      dataIndex: 'vchType',
      key: 'vchType',
      align: 'left',
    },
    {
      title: 'Vch No',
      dataIndex: 'vchNo',
      key: 'vchNo',
      align: 'left',
    },
    {
      title: 'Debit',
      // dataIndex: "debit",
      key: 'debit',
      // render: (debit) => (debit ? formatAmount(debit?.toFixed(2), false) : ""),
      render: record => (
        <span
          className={
            record?.description === 'Opening Balance' ||
            record?.description === 'Carried Over' ||
            record?.description === 'Closing Balance' ||
            record?.description === 'Brought Forward' ||
            !record?.description
              ? 'font-bold'
              : ''
          }
        >
          {record?.debit ? formatAmount(record?.debit, false) : ''}
        </span>
      ),
      align: 'right',
    },
    {
      title: 'Credit',
      // dataIndex: "credit",
      key: 'credit',
      // render: (credit) => (credit ? formatAmount(credit?.toFixed(2), false) : ""),
      render: record => (
        <span
          className={
            record?.description === 'Opening Balance' ||
            record?.description === 'Carried Over' ||
            record?.description === 'Closing Balance' ||
            record?.description === 'Brought Forward' ||
            !record?.description
              ? 'font-bold'
              : ''
          }
        >
          {record?.credit ? formatAmount(record?.credit, false) : ''}
        </span>
      ),
      align: 'right',
    },
    {
      title: 'Balance',
      // render: record => `${record?.balance ? `${record?.balance?.toFixed(2)}` : ''}`,
      render: record => `${record?.balance ? `${formatAmount(record?.balance, false)}` : ''}`,
      align: 'right',
    },
  ];

  const handleRowClick = record => {
    if (record?.type === 'bill') {
      navigate(`/bills/${record?.billId}`);
    } else if (record?.type === 'payment_made') {
      navigate(`/payments-made/${record?.paymentId}`);
    } else if (record?.type === 'debit_note') {
      navigate(`/debit-notes/${record?.debitNoteId}`);
    } else if (record?.type === 'invoice') {
      navigate(`/invoices/${record?.invoiceId}`);
    } else if (record?.type === 'payment_received') {
      navigate(`/payments-received/${record?.paymentId}`);
    } else if (record?.type === 'credit_note') {
      navigate(`/credit-notes/${record?.creditNoteId}`);
    } else if (record?.type === 'manual_journal') {
      navigate(`/manual-journal/${record?.manualJournalId}`);
    } else if (record?.type === 'expense') {
      navigate(`/expenses/${record?.expenseId}`);
    }
    return;
  };

  return (
    <div className="">
      <CustomTable
        columns={columns}
        onRowClick={handleRowClick}
        onRow={handleRowClick}
        loading={loading}
        data={currentPageRecords}
        pagination={{
          current: page,
          pageSize: recordsPerPage.current,
          total: reports?.ledger?.length || 0,
          onChange: handlePaginationChange,
        }}
        scroll={{ x: 'max-content' }}
        isPaginationFixed={false}
        showSizeChanger={false}
        dynamicScrollY={false}
      />
    </div>
  );
};

export default GeneralLedger;
