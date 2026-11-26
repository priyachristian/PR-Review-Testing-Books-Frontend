import StatusBadge from '@/components/ui/badge/StatusBadge';

export const userColumn = () => {
  return [
    {
      title: 'User Details',
      dataIndex: 'userdetails',
      key: 'userdetails',
      render: userdetails => (
        <div className="flex gap-5">
          <div>
            <div>{userdetails?.name}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: ['userdetails', 'email'],
      key: 'email',
      render: email => email ?? '-',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        return <StatusBadge status={status} value={status?.toUpperCase()} />;
      },
    },
    // {
    //   title: "Action",
    //   key: "edit",
    //   render: (record) => {
    //     if (record.status === "active") return null;
    //     return (
    //       <span
    //         className="cursor-pointer text-primary"
    //         onClick={() => handleResendMail(record)}
    //         onKeyDown={(e) => {
    //           if (e.key === "Enter" || e.key === " ") {
    //             e.preventDefault();
    //             handleResendMail(record);
    //           }
    //         }}
    //         role="button"
    //         tabIndex={0}
    //       >
    //         Resend
    //       </span>
    //     );
    //   },
    // },
  ];
};
