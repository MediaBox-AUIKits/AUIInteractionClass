import { createSearchParams, useNavigate } from 'umi';
import { UA } from '@/utils/common';
import PCLogin from '@/components/Login/pc';
import MobileLogin from '@/components/Login/mobile';
import services from '@/services';
import { Permission } from '@/types';

export default function HomePage() {
  const navigate = useNavigate();

  const onLoginSuccess = (id: any, role?: any) => {
    const params = createSearchParams(
      role !== undefined ? { id, role } : { id }
    );
    navigate({
      pathname: '/classroom',
      search: `?${params}`,
    });
  };

  const fetchAssistantPermissions = async (
    classId: string,
    userName: string
  ) => {
    await services.login(userName, userName);
    return services.getAssistantPermissions(classId);
  };

  const setAssistantPermissions = async (
    classId: string,
    permissions: Permission[]
  ) => {
    return services.setAssistantPermissions(
      classId,
      JSON.stringify(permissions)
    );
  };

  const deleteAssistantPermissions = (classId: string) => {
    return services.deleteAssistantPermissions(classId);
  };

  return UA.isPC ? (
    <PCLogin
      onLoginSuccess={onLoginSuccess}
      services={{
        fetchAssistantPermissions,
        setAssistantPermissions,
        deleteAssistantPermissions,
      }}
    />
  ) : (
    <MobileLogin onLoginSuccess={onLoginSuccess} />
  );
}
