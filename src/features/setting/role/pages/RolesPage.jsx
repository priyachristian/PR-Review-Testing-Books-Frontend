import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import Toast from '@/components/ui/common/Toast';

import useModulePermissions from 'hooks/useModulePermissions';

import { useRole, roleColumn } from '@/features/setting/role';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';

const RolesPage = () => {
  const navigate = useNavigate();
  const { roles, pagination, loading, error, getRoles, resetRoles, handleDeleteRole } = useRole();
  const { isViewOnly } = useModulePermissions(RESOURCES.ROLES);

  useEffect(() => {
    getRoles({ page: 1, limit: DEFAULT_PAGE_SIZE });
    return () => {
      resetRoles();
    };
  }, []);

  useEffect(() => {
    if (error) Toast.error(error);
  }, [error]);

  const fetchRoles = (page = 1, pageSize = DEFAULT_PAGE_SIZE) => {
    getRoles({ page, limit: pageSize });
  };

  const handlePaginationChange = (page, pageSize) => {
    fetchRoles(page, pageSize);
  };

  const handleNewRole = () => {
    navigate(`/${ADMIN_ROUTE_PATHS.setting.roles.new}`);
  };

  const handleEdit = role => {
    navigate(`/${ADMIN_ROUTE_PATHS.setting.roles.build.edit(role?.id || role?._id)}`);
  };

  const handleCopy = role => {
    navigate(`/${ADMIN_ROUTE_PATHS.setting.roles.new}`, { state: { mode: 'copy', initialRole: role } });
  };

  const handleDelete = async role => {
    await handleDeleteRole(role?._id);
    fetchRoles(pagination.page, pagination.limit);
  };

  const columns = roleColumn(handleEdit, handleCopy, handleDelete, isViewOnly);

  return (
    <div>
      <div className="bg-white shadow-sm border border-t-0 border-gray-200 px-4 py-[6px]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#16a2491a] justify-center items-center w-10 h-10 flex rounded-lg p-2">
              <Icons.ClusterOutlined className="text-[#16a249] items-center text-xl" />
            </div>
            <div>
              <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Roles Management</h3>
              <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Structure your organization with clarity and control</p>
            </div>
          </div>
          <div className="flex gap-4">
            <PermissionButton canAccess isViewOnly={isViewOnly} type="primary" onClick={isViewOnly ? undefined : handleNewRole} icon={<Icons.PlusCircleOutlined />} text="Add" />
          </div>
        </div>
      </div>
      <CustomTable
        columns={columns}
        data={roles}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.totalResults,
          onChange: handlePaginationChange,
        }}
        loading={loading}
        rowKey="id"
        isTableScrollable={false}
        isPaginationFixed={true}
        paginationClassName="border-l-0"
      />
    </div>
  );
};

export default RolesPage;
