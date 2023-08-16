import { createSearchParams, useNavigate } from 'umi';
import { UA } from '@/utils/common';
import PCLogin from '@/components/Login/pc';
import MobileLogin from '@/components/Login/mobile';

export default function HomePage() {
  const navigate = useNavigate();

  const onLoginSuccess = (id: any, role?: any) => {
    const params = createSearchParams(role ? { id, role } : { id });
    navigate({
      pathname: '/classroom',
      search: `?${params}`,
    });
  };

  return UA.isPC ? (
    <PCLogin onLoginSuccess={onLoginSuccess} />
  ) : (
    <MobileLogin onLoginSuccess={onLoginSuccess} />
  );
}
