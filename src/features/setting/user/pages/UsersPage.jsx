import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tooltip, Popconfirm } from 'antd';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import InviteUser from '@/features/setting/user/components/InviteUser';
import UpdateUserStatusAndRoleModal from '../components/UpdateUserStatusAndRoleModal';
import { colorPalette } from '@/utils/theme';
import Toast from '@/components/ui/common/Toast';

import { useAuth } from '@/hooks/useAuth';
import { useUser, userColumn } from '@/features/setting/user';
import Icons from '@/assets/icons/icon';

const UsersPage = () => {
  const { users, pagination, loading, getUsers, resetUsers, inviteUser, accessRoles, deleteCompanyUser } = useUser();
  const isAdminRole = accessRoles?.role?.toLowerCase() === 'admin';
  const { signin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const currentLimit = parseInt(searchParams.get('limit')) || DEFAULT_PAGE_SIZE;
  const handleResendMail = async record => {
    await inviteUser({ email: record?.user?.email, roleId: record?.roleId, type: 'resend' });
  };

  const columns = userColumn(handleResendMail);

  const data = users?.length > 0 ? users.map((user, index) => ({ key: index + 1, ...user })) : [];

  useEffect(() => {
    getUsers({ page: currentPage, limit: currentLimit });
    return () => {
      resetUsers();
    };
  }, [currentPage, currentLimit]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [record, setRecord] = useState(null);

  const fetchUsers = (page = currentPage, pageSize = currentLimit) => {
    getUsers({ page, limit: pageSize });
  };

  const handlePaginationChange = (page, pageSize) => {
    setSearchParams({ page, limit: pageSize });
  };

  const handleDeleteUser = async record => {
    try {
      await deleteCompanyUser({ id: record?.user?._id });
      fetchUsers(pagination.page, pagination.limit);
    } catch (error) {
      Toast.error(typeof error === 'string' ? error : error?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="scroll-y-hidden">
      <div className="bg-white shadow-sm border border-t-0 border-gray-200 px-4 py-[6px]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#16a2491a] justify-center items-center w-10 h-10 flex rounded-lg p-2">
              <Icons.UsergroupAddOutlined className="text-[#16a249] items-center text-xl" />
            </div>
            <div>
              <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Users Management</h3>
              <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Simplify onboarding. Strengthen control.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <CustomButton onClick={() => setModalOpen(true)} text="Invite User" className="px-5" type="primary" />
          </div>
        </div>
      </div>

      <CustomTable
        columns={columns}
        data={data}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.totalResults,
          onChange: handlePaginationChange,
        }}
        columnActions={() => {
          return {
            title: 'Action',
            key: 'action',
            fixed: 'right',
            width: 120,
            visible: true,
            render: (_, record) => {
              const isSelf = record?.user?._id === signin?.user?._id;
              const isEditDisabled = !isAdminRole || (signin?.user?.isAdmin && isSelf);
              const isDeleteDisabled = !isAdminRole || isSelf;
              return (
                <div className="flex items-center gap-3">
                  <Tooltip title={isEditDisabled ? 'Editing is disabled for admin users.' : 'Edit User'}>
                    <Icons.EditOutlined
                      style={{
                        fontSize: 17,
                        color: isEditDisabled ? colorPalette.neutral[400] : colorPalette.primary[500],
                        cursor: isEditDisabled ? 'not-allowed' : 'pointer',
                      }}
                      onClick={() => {
                        if (isEditDisabled) return;
                        setEditModalOpen(true);
                        setRecord(record);
                      }}
                    />
                  </Tooltip>
                  {isAdminRole && (record.status === 'pending' || (record.status === 'active' && record.user?.isVerified === false && record.user?.isActive !== false)) && (
                    <Tooltip title="Resend Mail">
                      <button style={{ color: colorPalette.primary[500] }} className="cursor-pointer" onClick={() => handleResendMail(record)}>
                        Resend
                      </button>
                    </Tooltip>
                  )}
                  {isDeleteDisabled ? (
                    <Tooltip title="Deleting is disabled for admin users.">
                      <Icons.DeleteOutlined
                        style={{
                          fontSize: 17,
                          color: colorPalette.neutral[400],
                          cursor: 'not-allowed',
                        }}
                      />
                    </Tooltip>
                  ) : (
                    <Popconfirm title="Delete user" description="Are you sure you want to remove this user from the company?" onConfirm={() => handleDeleteUser(record)} okText="Yes" cancelText="No">
                      <Tooltip title="Delete User">
                        <Icons.DeleteOutlined
                          style={{
                            fontSize: 17,
                            color: colorPalette.error[500],
                            cursor: 'pointer',
                          }}
                        />
                      </Tooltip>
                    </Popconfirm>
                  )}
                </div>
              );
            },
          };
        }}
        paginationClassName="border-l-0"
        loading={loading}
        isPaginationFixed={true}
      />
      {modalOpen && <InviteUser modalOpen={modalOpen} setModalOpen={setModalOpen} />}
      {editModalOpen && <UpdateUserStatusAndRoleModal modalOpen={editModalOpen} setModalOpen={setEditModalOpen} record={record} fetchUsers={fetchUsers} />}
    </div>
  );
};

export default UsersPage;
